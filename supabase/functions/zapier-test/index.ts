import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface TestResult {
  success: boolean;
  message: string;
  responseTime: number;
  results: Record<string, any>;
  recommendations?: string[];
}

// Hash API key for lookup
async function hashApiKey(apiKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(apiKey);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Validate API key
async function validateApiKey(apiKey: string) {
  try {
    const keyHash = await hashApiKey(apiKey);
    
    const { data, error } = await supabase
      .from('zapier_api_keys')
      .select('user_id, scopes, is_active, expires_at, rate_limit_per_hour')
      .eq('api_key_hash', keyHash)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return { valid: false, error: 'Invalid or inactive API key' };
    }

    if (new Date(data.expires_at) < new Date()) {
      return { valid: false, error: 'API key expired' };
    }

    return { 
      valid: true, 
      userId: data.user_id, 
      scopes: data.scopes,
      rateLimit: data.rate_limit_per_hour
    };
  } catch (error) {
    return { valid: false, error: 'Validation failed' };
  }
}

// Test database connectivity
async function testDatabaseConnection(): Promise<{ status: string; responseTime: number; error?: string }> {
  const startTime = Date.now();
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    const responseTime = Date.now() - startTime;
    
    if (error) {
      return { status: 'failed', responseTime, error: error.message };
    }

    return { 
      status: responseTime > 1000 ? 'degraded' : 'healthy', 
      responseTime 
    };
  } catch (error) {
    return { 
      status: 'failed', 
      responseTime: Date.now() - startTime, 
      error: error.message 
    };
  }
}

// Test webhook delivery
async function testWebhookDelivery(webhookUrl: string): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    const testPayload = {
      test: true,
      timestamp: new Date().toISOString(),
      trigger_type: 'test_delivery',
      data: {
        message: 'This is a test webhook from Sales Whisperer',
        test_id: crypto.randomUUID()
      }
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Sales-Whisperer-Test/1.0'
      },
      body: JSON.stringify(testPayload),
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });

    const responseTime = Date.now() - startTime;
    const success = response.ok;

    const results = {
      webhook_url: webhookUrl,
      http_status: response.status,
      response_headers: Object.fromEntries(response.headers.entries()),
      payload_sent: testPayload,
      delivery_time: responseTime
    };

    const recommendations = [];
    
    if (!success) {
      recommendations.push(`HTTP ${response.status}: Check your webhook endpoint implementation`);
    }
    
    if (responseTime > 5000) {
      recommendations.push('Webhook response time is slow (>5s). Consider optimizing your endpoint.');
    }

    return {
      success,
      message: success 
        ? `Webhook delivered successfully in ${responseTime}ms`
        : `Webhook delivery failed with status ${response.status}`,
      responseTime,
      results,
      recommendations
    };

  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    return {
      success: false,
      message: `Webhook delivery failed: ${error.message}`,
      responseTime,
      results: {
        webhook_url: webhookUrl,
        error: error.message,
        error_type: error.name
      },
      recommendations: [
        'Check if the webhook URL is accessible',
        'Verify the endpoint accepts POST requests',
        'Ensure firewall allows incoming connections'
      ]
    };
  }
}

// Test API connection
async function testConnection(apiKey: string): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    // Validate API key
    const validation = await validateApiKey(apiKey);
    
    if (!validation.valid) {
      return {
        success: false,
        message: validation.error || 'API key validation failed',
        responseTime: Date.now() - startTime,
        results: { authentication: 'failed' },
        recommendations: [
          'Check your API key is correct',
          'Verify the API key hasn\'t expired',
          'Ensure the API key is active'
        ]
      };
    }

    // Test database connection
    const dbTest = await testDatabaseConnection();
    
    const responseTime = Date.now() - startTime;
    const success = validation.valid && dbTest.status !== 'failed';

    const results = {
      authentication: {
        valid: validation.valid,
        user_id: validation.userId,
        scopes: validation.scopes,
        rate_limit: validation.rateLimit
      },
      database: {
        status: dbTest.status,
        response_time: dbTest.responseTime,
        error: dbTest.error
      },
      system: {
        edge_functions: 'healthy',
        total_response_time: responseTime
      }
    };

    const recommendations = [];
    
    if (dbTest.status === 'degraded') {
      recommendations.push('Database response time is slower than expected');
    }
    
    if (dbTest.status === 'failed') {
      recommendations.push('Database connection failed - check system status');
    }

    return {
      success,
      message: success 
        ? 'All connection tests passed successfully'
        : 'Some connection tests failed',
      responseTime,
      results,
      recommendations
    };

  } catch (error) {
    return {
      success: false,
      message: `Connection test failed: ${error.message}`,
      responseTime: Date.now() - startTime,
      results: { error: error.message },
      recommendations: [
        'Check your network connection',
        'Verify API endpoints are accessible',
        'Contact support if issues persist'
      ]
    };
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { apiKey, webhookUrl, test } = body;

    let result: TestResult;

    if (test === 'webhook-delivery' && webhookUrl) {
      result = await testWebhookDelivery(webhookUrl);
    } else if (test === 'connection' && apiKey) {
      result = await testConnection(apiKey);
    } else if (apiKey && !test) {
      // Default to connection test if only API key provided
      result = await testConnection(apiKey);
    } else {
      return new Response(JSON.stringify({
        success: false,
        message: 'Invalid test parameters. Provide either apiKey for connection test or webhookUrl for webhook test.',
        error: 'Missing required parameters'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 400,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error) {
    console.error('Test function error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      message: 'Test failed due to internal error',
      error: error.message,
      responseTime: 0,
      results: {}
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
};

serve(handler);