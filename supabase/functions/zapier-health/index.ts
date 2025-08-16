import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  services: {
    database: ServiceHealth;
    webhooks: ServiceHealth;
    matching: ServiceHealth;
    crm: ServiceHealth;
  };
  metrics: {
    responseTime: number;
    activeConnections: number;
    errorRate: number;
    uptime: number;
  };
}

interface ServiceHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime?: number;
  lastCheck: string;
  error?: string;
  details?: Record<string, any>;
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

async function checkDatabaseHealth(): Promise<ServiceHealth> {
  const startTime = Date.now();
  try {
    const { data, error } = await supabase
      .from('zapier_api_keys')
      .select('count')
      .limit(1)
      .single();

    const responseTime = Date.now() - startTime;
    
    if (error) {
      return {
        status: 'unhealthy',
        responseTime,
        lastCheck: new Date().toISOString(),
        error: error.message
      };
    }

    return {
      status: responseTime > 1000 ? 'degraded' : 'healthy',
      responseTime,
      lastCheck: new Date().toISOString(),
      details: { queryTime: responseTime }
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      lastCheck: new Date().toISOString(),
      error: error.message
    };
  }
}

async function checkWebhookHealth(): Promise<ServiceHealth> {
  const startTime = Date.now();
  try {
    // Check recent webhook deliveries
    const { data, error } = await supabase
      .from('zapier_webhook_logs')
      .select('delivery_status, created_at')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(100);

    const responseTime = Date.now() - startTime;

    if (error) {
      return {
        status: 'unhealthy',
        responseTime,
        lastCheck: new Date().toISOString(),
        error: error.message
      };
    }

    const totalWebhooks = data.length;
    const failedWebhooks = data.filter(w => w.delivery_status === 'failed').length;
    const errorRate = totalWebhooks > 0 ? (failedWebhooks / totalWebhooks) * 100 : 0;

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (errorRate > 50) status = 'unhealthy';
    else if (errorRate > 20) status = 'degraded';

    return {
      status,
      responseTime,
      lastCheck: new Date().toISOString(),
      details: {
        totalWebhooks24h: totalWebhooks,
        failedWebhooks24h: failedWebhooks,
        errorRate: errorRate.toFixed(2) + '%'
      }
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      lastCheck: new Date().toISOString(),
      error: error.message
    };
  }
}

async function checkMatchingHealth(): Promise<ServiceHealth> {
  const startTime = Date.now();
  try {
    // Check recent match reviews
    const { data, error } = await supabase
      .from('zapier_match_reviews')
      .select('status, created_at')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(100);

    const responseTime = Date.now() - startTime;

    if (error) {
      return {
        status: 'unhealthy',
        responseTime,
        lastCheck: new Date().toISOString(),
        error: error.message
      };
    }

    const totalMatches = data.length;
    const pendingMatches = data.filter(m => m.status === 'pending').length;
    const pendingRate = totalMatches > 0 ? (pendingMatches / totalMatches) * 100 : 0;

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (pendingRate > 80) status = 'unhealthy';
    else if (pendingRate > 50) status = 'degraded';

    return {
      status,
      responseTime,
      lastCheck: new Date().toISOString(),
      details: {
        totalMatches24h: totalMatches,
        pendingMatches: pendingMatches,
        pendingRate: pendingRate.toFixed(2) + '%'
      }
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      lastCheck: new Date().toISOString(),
      error: error.message
    };
  }
}

async function checkCrmHealth(): Promise<ServiceHealth> {
  const startTime = Date.now();
  try {
    // Check recent CRM integration logs
    const { data, error } = await supabase
      .from('crm_integration_logs')
      .select('status, created_at')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(100);

    const responseTime = Date.now() - startTime;

    if (error) {
      return {
        status: 'unhealthy',
        responseTime,
        lastCheck: new Date().toISOString(),
        error: error.message
      };
    }

    const totalOperations = data.length;
    const failedOperations = data.filter(op => op.status === 'failed').length;
    const errorRate = totalOperations > 0 ? (failedOperations / totalOperations) * 100 : 0;

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (errorRate > 30) status = 'unhealthy';
    else if (errorRate > 15) status = 'degraded';

    return {
      status,
      responseTime,
      lastCheck: new Date().toISOString(),
      details: {
        totalOperations24h: totalOperations,
        failedOperations24h: failedOperations,
        errorRate: errorRate.toFixed(2) + '%'
      }
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      lastCheck: new Date().toISOString(),
      error: error.message
    };
  }
}

async function getSystemMetrics() {
  try {
    // Get active connections count
    const { data: connections } = await supabase
      .from('integration_connections')
      .select('count')
      .eq('connection_status', 'active');

    // Calculate uptime (simplified - based on oldest active connection)
    const { data: oldestConnection } = await supabase
      .from('integration_connections')
      .select('created_at')
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    const uptime = oldestConnection 
      ? Date.now() - new Date(oldestConnection.created_at).getTime()
      : 0;

    return {
      activeConnections: connections?.length || 0,
      uptime: Math.floor(uptime / 1000), // Convert to seconds
      errorRate: 0 // Will be calculated from service health checks
    };
  } catch (error) {
    console.error('Error getting system metrics:', error);
    return {
      activeConnections: 0,
      uptime: 0,
      errorRate: 100
    };
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    console.log('Starting comprehensive health check...');

    // Run all health checks in parallel
    const [
      databaseHealth,
      webhookHealth, 
      matchingHealth,
      crmHealth,
      systemMetrics
    ] = await Promise.all([
      checkDatabaseHealth(),
      checkWebhookHealth(),
      checkMatchingHealth(),
      checkCrmHealth(),
      getSystemMetrics()
    ]);

    const responseTime = Date.now() - startTime;

    // Determine overall system status
    const services = [databaseHealth, webhookHealth, matchingHealth, crmHealth];
    const unhealthyServices = services.filter(s => s.status === 'unhealthy').length;
    const degradedServices = services.filter(s => s.status === 'degraded').length;

    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (unhealthyServices > 0) {
      overallStatus = 'unhealthy';
    } else if (degradedServices > 1) {
      overallStatus = 'degraded';
    }

    const result: HealthCheckResult = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      services: {
        database: databaseHealth,
        webhooks: webhookHealth,
        matching: matchingHealth,
        crm: crmHealth
      },
      metrics: {
        responseTime,
        activeConnections: systemMetrics.activeConnections,
        errorRate: (unhealthyServices / services.length) * 100,
        uptime: systemMetrics.uptime
      }
    };

    console.log('Health check completed:', { 
      status: overallStatus, 
      responseTime,
      unhealthyServices,
      degradedServices 
    });

    return new Response(JSON.stringify(result), {
      status: overallStatus === 'unhealthy' ? 503 : 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error) {
    console.error('Health check failed:', error);
    
    const errorResult: HealthCheckResult = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      services: {
        database: { status: 'unhealthy', lastCheck: new Date().toISOString(), error: 'System error' },
        webhooks: { status: 'unhealthy', lastCheck: new Date().toISOString(), error: 'System error' },
        matching: { status: 'unhealthy', lastCheck: new Date().toISOString(), error: 'System error' },
        crm: { status: 'unhealthy', lastCheck: new Date().toISOString(), error: 'System error' }
      },
      metrics: {
        responseTime: Date.now() - startTime,
        activeConnections: 0,
        errorRate: 100,
        uptime: 0
      }
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