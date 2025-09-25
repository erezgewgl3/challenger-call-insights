import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CrmHealthResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  connections: {
    total: number;
    active: number;
    failing: number;
    byProvider: Record<string, number>;
  };
  operations: {
    total: number;
    successful: number;
    failed: number;
    successRate: number;
    averageResponseTime: number;
  };
  performance: {
    p95ResponseTime: number;
    p99ResponseTime: number;
    throughput: number;
    errorsByType: Record<string, number>;
  };
  issues: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    count: number;
    affectedConnections?: string[];
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
    console.log('Starting CRM connectivity health check...');

    // Get integration connections data
    const { data: connections, error: connectionError } = await supabase
      .from('integration_connections')
      .select('id, integration_type, connection_status, connection_name, last_sync_at, created_at')
      .like('integration_type', '%crm%')
      .or('integration_type.in.(salesforce,hubspot,pipedrive,zoho)');

    if (connectionError) {
      throw new Error(`Failed to fetch connections: ${connectionError.message}`);
    }

    // Get CRM operation logs for the last 24 hours
    const { data: operationLogs, error: logError } = await supabase
      .from('crm_integration_logs')
      .select('status, response_time_ms, error_type, integration_type, created_at')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });

    if (logError) {
      throw new Error(`Failed to fetch operation logs: ${logError.message}`);
    }

    // Analyze connections
    const totalConnections = connections.length;
    const activeConnections = connections.filter(c => c.connection_status === 'active').length;
    const failingConnections = connections.filter(c => c.connection_status === 'error' || c.connection_status === 'disconnected').length;

    const connectionsByProvider: Record<string, number> = {};
    connections.forEach(conn => {
      const provider = conn.integration_type;
      connectionsByProvider[provider] = (connectionsByProvider[provider] || 0) + 1;
    });

    // Analyze operations
    const totalOperations = operationLogs.length;
    const successfulOperations = operationLogs.filter(op => op.status === 'success').length;
    const failedOperations = operationLogs.filter(op => op.status === 'failed').length;
    const successRate = totalOperations > 0 ? (successfulOperations / totalOperations) * 100 : 100;

    // Calculate response time metrics
    const responseTimes = operationLogs
      .filter(op => op.response_time_ms && op.status === 'success')
      .map(op => op.response_time_ms)
      .sort((a, b) => a - b);

    const averageResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
      : 0;

    const p95Index = Math.floor(responseTimes.length * 0.95);
    const p99Index = Math.floor(responseTimes.length * 0.99);
    const p95ResponseTime = responseTimes[p95Index] || 0;
    const p99ResponseTime = responseTimes[p99Index] || 0;

    // Count error types
    const errorsByType: Record<string, number> = {};
    operationLogs
      .filter(op => op.status === 'failed' && op.error_type)
      .forEach(op => {
        errorsByType[op.error_type] = (errorsByType[op.error_type] || 0) + 1;
      });

    // Calculate throughput (operations per hour)
    const throughput = totalOperations;

    // Identify issues
    const issues: CrmHealthResult['issues'] = [];

    // Check for failing connections
    if (failingConnections > 0) {
      const affectedConnections: string[] = connections
        .filter(c => c.connection_status === 'error' || c.connection_status === 'disconnected')
        .map(c => String(c.connection_name));

      issues.push({
        type: 'failing_connections',
        severity: failingConnections > activeConnections ? 'critical' : failingConnections > 2 ? 'high' : 'medium',
        message: `${failingConnections} CRM connection(s) are failing`,
        count: failingConnections,
        affectedConnections
      });
    }

    // Check success rate
    if (successRate < 90) {
      issues.push({
        type: 'low_success_rate',
        severity: successRate < 70 ? 'critical' : successRate < 80 ? 'high' : 'medium',
        message: `CRM operation success rate is ${successRate.toFixed(1)}%`,
        count: failedOperations
      });
    }

    // Check response times
    if (averageResponseTime > 5000) {
      issues.push({
        type: 'slow_response_times',
        severity: averageResponseTime > 15000 ? 'high' : 'medium',
        message: `Average CRM response time is ${averageResponseTime.toFixed(0)}ms`,
        count: responseTimes.filter(t => t > 5000).length
      });
    }

    // Check for recurring errors
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

    // Check for stale connections (no recent activity)
    const staleConnections = connections.filter(conn => {
      if (!conn.last_sync_at) return true;
      const lastSync = new Date(conn.last_sync_at).getTime();
      const hoursSinceSync = (Date.now() - lastSync) / (1000 * 60 * 60);
      return hoursSinceSync > 24;
    });

    if (staleConnections.length > 0) {
      issues.push({
        type: 'stale_connections',
        severity: staleConnections.length > activeConnections / 2 ? 'medium' : 'low',
        message: `${staleConnections.length} connection(s) haven't synced in 24+ hours`,
        count: staleConnections.length,
        affectedConnections: staleConnections.map(c => String(c.connection_name))
      });
    }

    // Check for no activity
    if (totalOperations === 0) {
      issues.push({
        type: 'no_crm_activity',
        severity: activeConnections > 0 ? 'medium' : 'low',
        message: 'No CRM operations in the last 24 hours',
        count: 0
      });
    }

    // Determine overall status
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    const criticalIssues = issues.filter(i => i.severity === 'critical').length;
    const highIssues = issues.filter(i => i.severity === 'high').length;
    
    if (criticalIssues > 0 || failingConnections > activeConnections || successRate < 50) {
      status = 'unhealthy';
    } else if (highIssues > 0 || failingConnections > 0 || successRate < 85) {
      status = 'degraded';
    }

    const result: CrmHealthResult = {
      status,
      timestamp: new Date().toISOString(),
      connections: {
        total: totalConnections,
        active: activeConnections,
        failing: failingConnections,
        byProvider: connectionsByProvider
      },
      operations: {
        total: totalOperations,
        successful: successfulOperations,
        failed: failedOperations,
        successRate: Math.round(successRate * 100) / 100,
        averageResponseTime: Math.round(averageResponseTime)
      },
      performance: {
        p95ResponseTime: Math.round(p95ResponseTime),
        p99ResponseTime: Math.round(p99ResponseTime),
        throughput,
        errorsByType
      },
      issues
    };

    console.log('CRM connectivity health check completed:', {
      status,
      totalConnections,
      activeConnections,
      successRate,
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
    console.error('CRM connectivity health check failed:', error);
    
    const errorResult: CrmHealthResult = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      connections: {
        total: 0,
        active: 0,
        failing: 0,
        byProvider: {}
      },
      operations: {
        total: 0,
        successful: 0,
        failed: 0,
        successRate: 0,
        averageResponseTime: 0
      },
      performance: {
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        throughput: 0,
        errorsByType: {}
      },
      issues: [{
        type: 'system_error',
        severity: 'critical',
        message: `Health check failed: ${(error instanceof Error ? error.message : String(error))}`,
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