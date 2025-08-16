import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WebhookHealthResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  metrics: {
    deliveryRate: number;
    averageLatency: number;
    totalWebhooks: number;
    failedWebhooks: number;
    recentDeliveries: number;
    errorsByType: Record<string, number>;
  };
  performance: {
    p95Latency: number;
    p99Latency: number;
    throughput: number;
  };
  issues: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    count: number;
  }>;
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    console.log('Starting webhook health check...');

    // Get webhook delivery statistics for the last 24 hours
    const { data: webhookLogs, error: webhookError } = await supabase
      .from('zapier_webhook_logs')
      .select('delivery_status, delivery_latency_ms, error_type, created_at')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });

    if (webhookError) {
      throw new Error(`Failed to fetch webhook logs: ${webhookError.message}`);
    }

    const totalWebhooks = webhookLogs.length;
    const failedWebhooks = webhookLogs.filter(w => w.delivery_status === 'failed').length;
    const successfulWebhooks = totalWebhooks - failedWebhooks;
    const deliveryRate = totalWebhooks > 0 ? (successfulWebhooks / totalWebhooks) * 100 : 100;

    // Calculate latency metrics
    const successfulLatencies = webhookLogs
      .filter(w => w.delivery_status === 'delivered' && w.delivery_latency_ms)
      .map(w => w.delivery_latency_ms)
      .sort((a, b) => a - b);

    const averageLatency = successfulLatencies.length > 0 
      ? successfulLatencies.reduce((sum, lat) => sum + lat, 0) / successfulLatencies.length 
      : 0;

    const p95Index = Math.floor(successfulLatencies.length * 0.95);
    const p99Index = Math.floor(successfulLatencies.length * 0.99);
    const p95Latency = successfulLatencies[p95Index] || 0;
    const p99Latency = successfulLatencies[p99Index] || 0;

    // Count error types
    const errorsByType: Record<string, number> = {};
    webhookLogs
      .filter(w => w.delivery_status === 'failed' && w.error_type)
      .forEach(w => {
        errorsByType[w.error_type] = (errorsByType[w.error_type] || 0) + 1;
      });

    // Calculate throughput (webhooks per hour)
    const throughput = totalWebhooks;

    // Get recent deliveries (last hour)
    const recentDeliveries = webhookLogs.filter(w => 
      new Date(w.created_at).getTime() > Date.now() - 60 * 60 * 1000
    ).length;

    // Identify issues
    const issues = [];

    if (deliveryRate < 95) {
      issues.push({
        type: 'low_delivery_rate',
        severity: deliveryRate < 80 ? 'critical' : deliveryRate < 90 ? 'high' : 'medium',
        message: `Webhook delivery rate is ${deliveryRate.toFixed(1)}%`,
        count: failedWebhooks
      });
    }

    if (averageLatency > 5000) {
      issues.push({
        type: 'high_latency',
        severity: averageLatency > 10000 ? 'high' : 'medium',
        message: `Average webhook latency is ${averageLatency.toFixed(0)}ms`,
        count: successfulLatencies.filter(l => l > 5000).length
      });
    }

    if (Object.keys(errorsByType).length > 0) {
      Object.entries(errorsByType).forEach(([errorType, count]) => {
        if (count > 5) {
          issues.push({
            type: 'recurring_error',
            severity: count > 20 ? 'high' : 'medium',
            message: `${count} ${errorType} errors in the last 24h`,
            count
          });
        }
      });
    }

    if (recentDeliveries === 0 && totalWebhooks > 0) {
      issues.push({
        type: 'no_recent_activity',
        severity: 'medium',
        message: 'No webhook deliveries in the last hour',
        count: 0
      });
    }

    // Determine overall status
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    const criticalIssues = issues.filter(i => i.severity === 'critical').length;
    const highIssues = issues.filter(i => i.severity === 'high').length;
    
    if (criticalIssues > 0 || deliveryRate < 50) {
      status = 'unhealthy';
    } else if (highIssues > 0 || deliveryRate < 90 || averageLatency > 3000) {
      status = 'degraded';
    }

    const result: WebhookHealthResult = {
      status,
      timestamp: new Date().toISOString(),
      metrics: {
        deliveryRate: Math.round(deliveryRate * 100) / 100,
        averageLatency: Math.round(averageLatency),
        totalWebhooks,
        failedWebhooks,
        recentDeliveries,
        errorsByType
      },
      performance: {
        p95Latency: Math.round(p95Latency),
        p99Latency: Math.round(p99Latency),
        throughput
      },
      issues
    };

    console.log('Webhook health check completed:', {
      status,
      deliveryRate,
      totalWebhooks,
      responseTime: Date.now() - startTime
    });

    return new Response(JSON.stringify(result), {
      status: status === 'unhealthy' ? 503 : 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error) {
    console.error('Webhook health check failed:', error);
    
    const errorResult: WebhookHealthResult = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      metrics: {
        deliveryRate: 0,
        averageLatency: 0,
        totalWebhooks: 0,
        failedWebhooks: 0,
        recentDeliveries: 0,
        errorsByType: {}
      },
      performance: {
        p95Latency: 0,
        p99Latency: 0,
        throughput: 0
      },
      issues: [{
        type: 'system_error',
        severity: 'critical',
        message: `Health check failed: ${error.message}`,
        count: 1
      }]
    };

    return new Response(JSON.stringify(errorResult), {
      status: 503,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
};

serve(handler);