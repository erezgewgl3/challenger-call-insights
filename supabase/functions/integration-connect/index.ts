
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

    const url = new URL(req.url);
    const integrationId = url.searchParams.get('integration_id');
    
    // Input validation
    if (!integrationId) {
      throw new Error('Missing integration_id parameter');
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

    const { configuration } = await req.json();

    console.log(`[CONNECT-INTEGRATION] Starting OAuth for integration: ${integrationId}, user role: ${userRole?.role}`);

    // Determine callback URL based on user role
    const isAdmin = userRole?.role === 'admin';
    const callbackPath = isAdmin ? '/admin/integrations/callback' : '/integrations/callback';
    const redirectUri = `${url.origin}${callbackPath}?integration_id=${integrationId}`;
    const state = `${userData.user.id}:${integrationId}:${Date.now()}`;

    // Generic OAuth URL generation based on integration type
    let authUrl = '';

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

    console.log(`[CONNECT-INTEGRATION] Generated auth URL for ${integrationId}, callback: ${callbackPath}`);

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
