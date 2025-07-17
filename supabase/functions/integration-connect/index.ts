import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      throw new Error('Invalid authentication token');
    }

    const url = new URL(req.url);
    const integrationId = url.searchParams.get('integration_id');
    const { configuration } = await req.json();

    if (!integrationId) {
      throw new Error('Missing integration_id parameter');
    }

    console.log(`[CONNECT-INTEGRATION] Starting OAuth for integration: ${integrationId}`);

    // Generic OAuth URL generation based on integration type
    let authUrl = '';
    const redirectUri = `${url.origin}/api/integrations-framework/callback?integration_id=${integrationId}`;
    const state = `${userData.user.id}:${integrationId}:${Date.now()}`;

    switch (integrationId.toLowerCase()) {
      case 'zoom':
        const zoomClientId = configuration?.client_id || Deno.env.get('ZOOM_CLIENT_ID');
        if (!zoomClientId) throw new Error('Zoom client ID not configured');
        const zoomScopes = configuration?.scopes || 'recording:read,user:read';
        authUrl = `https://zoom.us/oauth/authorize?client_id=${zoomClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(zoomScopes)}&response_type=code&state=${state}`;
        break;

      case 'salesforce':
        const salesforceClientId = configuration?.client_id || Deno.env.get('SALESFORCE_CLIENT_ID');
        if (!salesforceClientId) throw new Error('Salesforce client ID not configured');
        const salesforceInstance = configuration?.instance_url || 'https://login.salesforce.com';
        authUrl = `${salesforceInstance}/services/oauth2/authorize?client_id=${salesforceClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&state=${state}`;
        break;

      default:
        throw new Error(`Unsupported integration type: ${integrationId}`);
    }

    // Store OAuth state for validation
    await supabase.from('integration_configs').upsert({
      user_id: userData.user.id,
      integration_type: integrationId,
      config_key: 'oauth_state',
      config_value: { state, timestamp: Date.now(), redirect_uri: redirectUri },
      is_encrypted: false
    });

    console.log(`[CONNECT-INTEGRATION] Generated auth URL for ${integrationId}`);

    return new Response(JSON.stringify({
      success: true,
      auth_url: authUrl,
      state: state
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('[CONNECT-INTEGRATION] Error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});