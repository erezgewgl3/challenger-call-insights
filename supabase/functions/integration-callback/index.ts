
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting map for callback endpoint
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const limit = rateLimitMap.get(identifier);
  
  if (!limit || now > limit.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + 300000 }); // 5 minute window for callbacks
    return true;
  }
  
  if (limit.count >= 5) { // 5 callback attempts per 5 minutes
    return false;
  }
  
  limit.count++;
  return true;
}

function sanitizeInput(input: string): string {
  // Remove potentially dangerous characters
  return input.replace(/[<>\"'&]/g, '');
}

function validateOAuthState(state: string, userId: string, integrationType: string): boolean {
  const parts = state.split(':');
  if (parts.length !== 3) return false;
  
  const [stateUserId, stateIntegrationType, stateTimestamp] = parts;
  const timestamp = parseInt(stateTimestamp, 10);
  const now = Date.now();
  
  // Validate format and expiry (1 hour)
  return stateUserId === userId && 
         stateIntegrationType === integrationType && 
         !isNaN(timestamp) && 
         (now - timestamp) < 3600000;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(clientIP)) {
      console.warn(`[CALLBACK-INTEGRATION] Rate limit exceeded for IP: ${clientIP}`);
      return new Response(`
        <html>
          <body>
            <h1>Too Many Requests</h1>
            <p>Please try again later.</p>
            <script>setTimeout(() => window.close(), 3000);</script>
          </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' },
        status: 429,
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    if (error) {
      console.error(`[CALLBACK-INTEGRATION] OAuth error: ${error}`);
      return new Response(`
        <html>
          <body>
            <h1>Connection Failed</h1>
            <p>Error: ${error}</p>
            <script>window.close();</script>
          </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' },
        status: 400,
      });
    }

    if (!code || !state) {
      throw new Error('Missing required parameters (code or state)');
    }

    // Input sanitization
    const sanitizedCode = sanitizeInput(code);
    const sanitizedState = sanitizeInput(state);

    // Extract integration_id from state parameter
    const [userId, integrationId, timestamp] = sanitizedState.split(':');
    
    if (!userId || !integrationId || !timestamp) {
      throw new Error('Invalid state parameter format');
    }

    console.log(`[CALLBACK-INTEGRATION] Processing callback for integration: ${integrationId}, user: ${userId}`);

    // Enhanced OAuth state validation
    if (!validateOAuthState(sanitizedState, userId, integrationId)) {
      throw new Error('Invalid or expired OAuth state');
    }

    // Validate OAuth state against stored data
    const { data: storedState } = await supabase
      .from('integration_configs')
      .select('config_value')
      .eq('user_id', userId)
      .eq('integration_type', integrationId)
      .eq('config_key', 'oauth_state')
      .single();

    if (!storedState || storedState.config_value.state !== sanitizedState) {
      console.error(`[CALLBACK-INTEGRATION] State validation failed - stored: ${storedState?.config_value?.state}, received: ${sanitizedState}`);
      throw new Error('OAuth state validation failed');
    }

    // Exchange code for access token based on integration type
    let accessToken = '';
    let refreshToken = '';
    let userInfo: any = {};

    switch (integrationId.toLowerCase()) {
      case 'zoom':
        const zoomTokenResponse = await fetch('https://zoom.us/oauth/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${btoa(`${Deno.env.get('ZOOM_CLIENT_ID')}:${Deno.env.get('ZOOM_CLIENT_SECRET')}`)}`,
          },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            code: sanitizedCode,
            redirect_uri: storedState.config_value.redirect_uri,
          }),
        });
        
        const zoomTokenData = await zoomTokenResponse.json();
        if (zoomTokenData.error) {
          throw new Error(`Zoom token exchange failed: ${zoomTokenData.error}`);
        }
        
        accessToken = zoomTokenData.access_token;
        refreshToken = zoomTokenData.refresh_token;

        // Get user info from Zoom
        const zoomUserResponse = await fetch('https://api.zoom.us/v2/users/me', {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        });
        userInfo = await zoomUserResponse.json();
        break;

      case 'github':
        const githubTokenResponse = await fetch('https://github.com/login/oauth/access_token', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_id: Deno.env.get('GITHUB_CLIENT_ID') || '',
            client_secret: Deno.env.get('GITHUB_CLIENT_SECRET') || '',
            code: sanitizedCode,
          }),
        });
        const githubTokenData = await githubTokenResponse.json();
        accessToken = githubTokenData.access_token;

        // Get user info
        const githubUserResponse = await fetch('https://api.github.com/user', {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        });
        userInfo = await githubUserResponse.json();
        break;

      case 'google':
        const googleTokenResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: Deno.env.get('GOOGLE_CLIENT_ID') || '',
            client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET') || '',
            code: sanitizedCode,
            grant_type: 'authorization_code',
            redirect_uri: storedState.config_value.redirect_uri,
          }),
        });
        const googleTokenData = await googleTokenResponse.json();
        accessToken = googleTokenData.access_token;
        refreshToken = googleTokenData.refresh_token;

        // Get user info
        const googleUserResponse = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`);
        userInfo = await googleUserResponse.json();
        break;

      case 'slack':
        const slackTokenResponse = await fetch('https://slack.com/api/oauth.v2.access', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: Deno.env.get('SLACK_CLIENT_ID') || '',
            client_secret: Deno.env.get('SLACK_CLIENT_SECRET') || '',
            code: sanitizedCode,
            redirect_uri: storedState.config_value.redirect_uri,
          }),
        });
        const slackTokenData = await slackTokenResponse.json();
        accessToken = slackTokenData.access_token;
        userInfo = slackTokenData.team;
        break;

      default:
        throw new Error(`Unsupported integration type: ${integrationId}`);
    }

    if (!accessToken) {
      throw new Error('Failed to obtain access token');
    }

    // Store the connection
    await supabase.from('integration_connections').upsert({
      user_id: userId,
      integration_type: integrationId,
      connection_name: userInfo.name || userInfo.login || userInfo.email || `${integrationId} Connection`,
      connection_status: 'active',
      credentials: {
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_at: Date.now() + (3600 * 1000), // 1 hour default
      },
      configuration: {
        user_info: userInfo,
        connected_at: new Date().toISOString(),
      },
    });

    // Clean up OAuth state
    await supabase
      .from('integration_configs')
      .delete()
      .eq('user_id', userId)
      .eq('integration_type', integrationId)
      .eq('config_key', 'oauth_state');

    console.log(`[CALLBACK-INTEGRATION] Successfully connected ${integrationId} for user ${userId}`);

    // Send success email notification
    try {
      const { data: userResult } = await supabase.auth.admin.getUserById(userId);
      if (userResult.user?.email) {
        await supabase.functions.invoke('send-email', {
          body: {
            template: 'integration-connected',
            to: userResult.user.email,
            data: {
              integration_name: integrationId,
              integration_icon: getIntegrationIcon(integrationId),
              user_email: userResult.user.email,
              features: getIntegrationFeatures(integrationId),
              dashboard_url: 'https://saleswhispererv2-0.lovable.app/dashboard',
              connected_at: new Date().toISOString()
            }
          }
        })
      }
    } catch (emailError) {
      console.error('Failed to send connection success email:', emailError)
      // Don't fail the main operation for email errors
    }

    return new Response(`
      <html>
        <head>
          <title>Connection Successful</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .success { color: #28a745; }
            .container { max-width: 400px; margin: 0 auto; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1 class="success">✓ Connection Successful</h1>
            <p>Your ${integrationId} integration has been connected successfully.</p>
            <p>You can now close this window.</p>
            <script>
              setTimeout(() => {
                window.close();
              }, 3000);
            </script>
          </div>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' },
      status: 200,
    });

  } catch (error) {
    console.error('[CALLBACK-INTEGRATION] Error:', error);
    
    // Send failure email notification if we have user context
    try {
      const url = new URL(req.url);
      const state = url.searchParams.get('state');
      if (state) {
        const [userId] = state.split(':');
        const { data: userResult } = await supabase.auth.admin.getUserById(userId);
        if (userResult.user?.email) {
          await supabase.functions.invoke('send-email', {
            body: {
              template: 'integration-failed',
              to: userResult.user.email,
              data: {
                integration_name: state.split(':')[1] || 'Integration',
                integration_icon: getIntegrationIcon(state.split(':')[1] || ''),
                user_email: userResult.user.email,
                error_message: error.message,
                retry_url: 'https://saleswhispererv2-0.lovable.app/integrations',
                failed_at: new Date().toISOString()
              }
            }
          })
        }
      }
    } catch (emailError) {
      console.error('Failed to send connection failure email:', emailError)
    }
    
    return new Response(`
      <html>
        <body>
          <h1>Connection Failed</h1>
          <p>Error: ${error.message}</p>
          <script>window.close();</script>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' },
      status: 400,
    });
  }
});

// Helper functions for email data
function getIntegrationIcon(integrationType: string): string {
  const icons: Record<string, string> = {
    github: '🐙',
    google: '🔍',
    slack: '💬',
    salesforce: '☁️',
    zoom: '📹',
    hubspot: '🔶'
  }
  return icons[integrationType.toLowerCase()] || '🔗'
}

function getIntegrationFeatures(integrationType: string): string[] {
  const features: Record<string, string[]> = {
    zoom: [
      'Automatic transcript processing after meetings',
      'AI-powered meeting insights and analysis', 
      'Sales coaching recommendations based on conversations'
    ],
    github: [
      'Sync repositories and commit data',
      'Track development activity and metrics',
      'Integrate code review feedback into sales insights'
    ],
    google: [
      'Import calendar events and meeting data',
      'Sync Google Drive documents and presentations',
      'Analyze meeting patterns and follow-ups'
    ],
    slack: [
      'Import conversation transcripts from channels',
      'Track team communication patterns',
      'Analyze customer interaction frequency'
    ],
    salesforce: [
      'Sync accounts, contacts, and opportunities',
      'Import call logs and meeting notes',
      'Track deal progression and sales activities'
    ]
  }
  return features[integrationType.toLowerCase()] || [
    'Sync data from your platform',
    'Analyze performance metrics',
    'Get AI-powered insights'
  ]
}
