
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting map (in production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const limit = rateLimitMap.get(identifier);
  
  if (!limit || now > limit.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + 60000 }); // 1 minute window
    return true;
  }
  
  if (limit.count >= 10) { // 10 requests per minute
    return false;
  }
  
  limit.count++;
  return true;
}

function validateInput(integrationId: string): string | null {
  // Validate integration_id
  const validIntegrations = ['zoom', 'github', 'google', 'slack', 'salesforce'];
  if (!validIntegrations.includes(integrationId.toLowerCase())) {
    return 'Invalid integration type';
  }
  
  // Sanitize integration ID
  if (!/^[a-zA-Z0-9_-]+$/.test(integrationId)) {
    return 'Integration ID contains invalid characters';
  }
  
  return null;
}

function sanitizeErrorMessage(error: Error): string {
  // Remove sensitive information from error messages
  const message = error.message;
  if (message.includes('secret') || message.includes('key') || message.includes('token')) {
    return 'Configuration error occurred';
  }
  return message.substring(0, 200); // Limit error message length
}

function getAppDomain(): string {
  // Use the correct app domain for OAuth redirects
  return 'https://saleswhispererv2-0.lovable.app';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get client IP for rate limiting
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    
    // Rate limiting check
    if (!checkRateLimit(clientIP)) {
      console.warn(`[CONNECT-INTEGRATION] Rate limit exceeded for IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Rate limit exceeded. Please try again later.' 
        }),
        { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
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

    // Get user role to determine callback URL
    const { data: userRole, error: roleError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userData.user.id)
      .single();

    if (roleError) {
      console.error('Error fetching user role:', roleError);
    }

    // Parse request body to get integration_id and configuration
    const requestBody = await req.json();
    const integrationId = requestBody.integration_id;
    const configuration = requestBody.configuration;
    
    // Input validation
    if (!integrationId) {
      throw new Error('Missing integration_id in request body');
    }
    
    const validationError = validateInput(integrationId);
    if (validationError) {
      return new Response(
        JSON.stringify({ success: false, error: validationError }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`[CONNECT-INTEGRATION] Starting OAuth for integration: ${integrationId}, user role: ${userRole?.role}`);

    // First check if user has their own OAuth app configured
    const { data: userOAuthApp } = await supabase
      .from('integration_configs')
      .select('config_value')
      .eq('user_id', userData.user.id)
      .eq('integration_type', integrationId)
      .eq('config_key', 'user_oauth_app')
      .maybeSingle();

    let configValue: any;
    let usingPersonalApp = false;

    if (userOAuthApp?.config_value) {
      // User has personal OAuth app - use it
      configValue = userOAuthApp.config_value;
      usingPersonalApp = true;
      console.log(`[CONNECT-INTEGRATION] Using user's personal OAuth app for ${integrationId}`);
    } else {
      // Fall back to system configuration (admin-managed)
      const { data: systemConfig, error: systemConfigError } = await supabase
        .from('system_integration_configs')
        .select('config_value')
        .eq('integration_type', integrationId)
        .eq('config_key', 'system_config')
        .single();

      if (systemConfigError || !systemConfig?.config_value) {
        throw new Error(`${integrationId} integration is not configured. Please set up your personal OAuth app or ask your administrator to configure system-wide access.`);
      }

      configValue = systemConfig.config_value;
      console.log(`[CONNECT-INTEGRATION] Using system OAuth app for ${integrationId}`);

      // Check if system integration is enabled
      if (typeof configValue === 'object' && 'enabled' in configValue && !configValue.enabled) {
        throw new Error(`${integrationId} integration is currently disabled by the administrator`);
      }
    }

    // Clean up any existing OAuth states for this user and integration
    await supabase
      .from('integration_configs')
      .delete()
      .eq('user_id', userData.user.id)
      .eq('integration_type', integrationId)
      .eq('config_key', 'oauth_state');

    // Determine callback URL based on user role using correct app domain - NO query parameters
    const isAdmin = userRole?.role === 'admin';
    const callbackPath = isAdmin ? '/admin/integrations/callback' : '/integrations/callback';
    const appDomain = getAppDomain();
    const redirectUri = `${appDomain}${callbackPath}`;
    
    // Generate proper state parameter with full timestamp
    const fullTimestamp = Date.now();
    const state = `${userData.user.id}:${integrationId}:${fullTimestamp}`;

    console.log(`[CONNECT-INTEGRATION] Generated state: ${state} with full timestamp: ${fullTimestamp}`);

    // Generic OAuth URL generation based on integration type
    let authUrl = '';

    switch (integrationId.toLowerCase()) {
      case 'zoom':
        const zoomClientId = configValue.client_id || Deno.env.get('ZOOM_CLIENT_ID');
        if (!zoomClientId) throw new Error('Zoom client ID not configured');
        const zoomScopes = configValue.scopes || 'recording:read,user:read';
        authUrl = `https://zoom.us/oauth/authorize?client_id=${zoomClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(zoomScopes)}&response_type=code&state=${state}`;
        break;

      case 'salesforce':
        const salesforceClientId = configValue.client_id || Deno.env.get('SALESFORCE_CLIENT_ID');
        if (!salesforceClientId) throw new Error('Salesforce client ID not configured');
        const salesforceInstance = configValue.instance_url || 'https://login.salesforce.com';
        authUrl = `${salesforceInstance}/services/oauth2/authorize?client_id=${salesforceClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&state=${state}`;
        break;

      default:
        throw new Error(`Unsupported integration type: ${integrationId}`);
    }

    // Store OAuth state for validation with proper redirect URI and app type
    await supabase.from('integration_configs').upsert({
      user_id: userData.user.id,
      integration_type: integrationId,
      config_key: 'oauth_state',
      config_value: { 
        state, 
        timestamp: fullTimestamp, 
        redirect_uri: redirectUri,
        integration_id: integrationId,
        using_personal_app: usingPersonalApp // Track which OAuth app is being used
      },
      is_encrypted: false
    });

    console.log(`[CONNECT-INTEGRATION] Generated auth URL for ${integrationId}, callback: ${callbackPath}`);
    console.log(`[CONNECT-INTEGRATION] Using clean redirect URI: ${redirectUri}`);
    console.log(`[CONNECT-INTEGRATION] State stored with timestamp: ${fullTimestamp}`);

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
      error: sanitizeErrorMessage(error as Error)
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
