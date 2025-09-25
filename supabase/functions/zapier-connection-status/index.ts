import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);
    const method = req.method;
    const action = url.pathname.split('/').pop();

    console.log(`Zapier connection status request: ${method} ${action}`);

    switch (method) {
      case 'GET':
        return await handleGetStatus(supabaseClient, user.id);
      case 'POST':
        return await handleVerifyConnection(supabaseClient, user.id, req);
      default:
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    console.error('Error in zapier-connection-status function:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function handleGetStatus(supabaseClient: any, userId: string) {
  console.log('Getting connection status for user:', userId);

  // Get recent verifications
  const { data: verifications, error: verifyError } = await supabaseClient
    .from('zapier_connection_verifications')
    .select('*')
    .eq('user_id', userId)
    .order('verified_at', { ascending: false })
    .limit(10);

  if (verifyError) {
    console.error('Error fetching verifications:', verifyError);
    return new Response(JSON.stringify({ error: 'Failed to fetch verifications' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Get API keys and webhooks for comprehensive status
  const [apiKeysResponse, webhooksResponse] = await Promise.all([
    supabaseClient.from('zapier_api_keys').select('*').eq('user_id', userId),
    supabaseClient.from('zapier_webhooks').select('*').eq('user_id', userId)
  ]);

  const apiKeys = apiKeysResponse.data || [];
  const webhooks = webhooksResponse.data || [];

  // Calculate status
  const isSetupComplete = apiKeys.length > 0;
  const activeApiKeys = apiKeys.filter((key: any) => key.is_active).length;
  const activeWebhooks = webhooks.filter((hook: any) => hook.is_active).length;
  
  // Check for recent successful verification (within 15 minutes)
  const recentSuccess = verifications?.find((v: any) => 
    v.success && new Date(v.verified_at).getTime() > Date.now() - 15 * 60 * 1000
  );

  // Calculate success rate
  const totalHooks = webhooks.length;
  const successfulHooks = webhooks.filter((hook: any) => 
    hook.success_count > hook.failure_count
  ).length;
  const successRate = totalHooks > 0 ? Math.round((successfulHooks / totalHooks) * 100) : 0;

  // Determine status
  let status = 'setup';
  let color = 'bg-yellow-500';
  let text = 'Setup Required';

  if (isSetupComplete) {
    if (recentSuccess) {
      if (successRate >= 90) {
        status = 'connected';
        color = 'bg-green-500';
        text = 'Healthy';
      } else if (successRate >= 70) {
        status = 'connected';
        color = 'bg-yellow-500';
        text = 'Degraded';
      } else {
        status = 'connected';
        color = 'bg-red-500';
        text = 'Connected';
      }
    } else {
      status = 'error';
      color = 'bg-red-500';
      text = 'Issues Detected';
    }
  }

  const response = {
    status,
    color,
    text,
    successRate,
    activeWebhooks,
    activeApiKeys,
    isSetupComplete,
    lastVerifiedAt: recentSuccess?.verified_at || null,
    verifications: verifications || []
  };

  console.log('Returning status:', response);

  return new Response(JSON.stringify(response), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function handleVerifyConnection(supabaseClient: any, userId: string, req: Request) {
  console.log('Verifying connection for user:', userId);

  const body = await req.json();
  const { apiKeyId, testType = 'manual_test' } = body;

  try {
    // Get API key for validation
    const { data: apiKey, error: apiKeyError } = await supabaseClient
      .from('zapier_api_keys')
      .select('*')
      .eq('id', apiKeyId)
      .eq('user_id', userId)
      .single();

    if (apiKeyError || !apiKey) {
      console.error('API key not found:', apiKeyError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'API key not found' 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Perform actual connection test
    const testResult = await performConnectionTest(supabaseClient, userId, apiKey);

    // Store verification result
    const { error: insertError } = await supabaseClient
      .from('zapier_connection_verifications')
      .insert({
        user_id: userId,
        verification_method: testType,
        success: testResult.success,
        error_details: testResult.error ? { error: testResult.error } : {},
        verification_data: testResult.data || {}
      });

    if (insertError) {
      console.error('Error storing verification:', insertError);
    }

    console.log('Connection test result:', testResult);

    return new Response(JSON.stringify(testResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error during connection verification:', error);
    
    // Still store failed verification
    await supabaseClient
      .from('zapier_connection_verifications')
      .insert({
        user_id: userId,
        verification_method: testType,
        success: false,
        error_details: { error: error instanceof Error ? error.message : 'Unknown error' }
      });

    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

async function performConnectionTest(supabaseClient: any, userId: string, apiKey: any) {
  console.log('Performing connection test for API key:', apiKey.id);

  try {
    // Test database connectivity
    const { data: testData, error: dbError } = await supabaseClient
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    if (dbError) {
      return {
        success: false,
        error: 'Database connection failed',
        data: { test: 'database_connection', error: dbError.message }
      };
    }

    // Test API key access to user's data
    const { data: userData, error: userError } = await supabaseClient
      .from('zapier_api_keys')
      .select('id, key_name, is_active')
      .eq('user_id', userId)
      .eq('id', apiKey.id)
      .single();

    if (userError) {
      return {
        success: false,
        error: 'API key validation failed',
        data: { test: 'api_key_validation', error: userError.message }
      };
    }

    // Test data access
    const { data: transcripts, error: transcriptError } = await supabaseClient
      .from('transcripts')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    if (transcriptError) {
      return {
        success: false,
        error: 'Data access test failed',
        data: { test: 'data_access', error: transcriptError.message }
      };
    }

    return {
      success: true,
      data: {
        tests_passed: ['database_connection', 'api_key_validation', 'data_access'],
        api_key_name: userData.key_name,
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Connection test failed:', error);
    return {
      success: false,
      error: 'Connection test failed',
      data: { error: error instanceof Error ? error.message : 'Unknown error' }
    };
  }
}