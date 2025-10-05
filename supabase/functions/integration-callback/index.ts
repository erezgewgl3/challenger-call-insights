
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.2";

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

function validateOAuthState(state: string): { isValid: boolean; userId?: string; integrationId?: string; timestamp?: number } {
  try {
    const parts = state.split(':');
    if (parts.length !== 3) {
      console.error(`[CALLBACK-INTEGRATION] Invalid state format - expected 3 parts, got ${parts.length}: ${state}`);
      return { isValid: false };
    }
    
    const [userId, integrationId, timestampStr] = parts;
    const timestamp = parseInt(timestampStr, 10);
    const now = Date.now();
    
    // Validate format and expiry (1 hour = 3600000ms)
    if (!userId || !integrationId || isNaN(timestamp)) {
      console.error(`[CALLBACK-INTEGRATION] Invalid state components - userId: ${userId}, integrationId: ${integrationId}, timestamp: ${timestampStr}`);
      return { isValid: false };
    }
    
    if ((now - timestamp) > 3600000) {
      console.error(`[CALLBACK-INTEGRATION] State expired - age: ${now - timestamp}ms`);
      return { isValid: false };
    }
    
    console.log(`[CALLBACK-INTEGRATION] State validation successful - userId: ${userId}, integrationId: ${integrationId}, timestamp: ${timestamp}`);
    return { isValid: true, userId, integrationId, timestamp };
    
  } catch (error) {
    console.error(`[CALLBACK-INTEGRATION] State validation error: ${error}`);
    return { isValid: false };
  }
}

/**
 * Get properly formatted account name based on integration type and user info
 * @param integrationId The type of integration (zoom, github, etc.)
 * @param userInfo The user information from the integration
 * @returns Properly formatted account name
 */
function getFormattedAccountName(integrationId: string, userInfo: any): string {
  console.log(`[CALLBACK-INTEGRATION] Formatting account name for ${integrationId}`, userInfo);
  
  // Default fallback
  let formattedName = 'Account';
  
  try {
    switch (integrationId.toLowerCase()) {
      case 'zoom':
        // Log available fields for debugging
        console.log(`[CALLBACK-INTEGRATION] Zoom user info fields:`, 
          Object.keys(userInfo).filter(key => typeof userInfo[key] === 'string'));
        
        // Check if we have first and last name fields
        if (userInfo.first_name && userInfo.last_name) {
          // Format as "FirstName LastName"
          formattedName = `${userInfo.first_name} ${userInfo.last_name}`;
        } 
        // Check if we have an email
        else if (userInfo.email) {
          formattedName = userInfo.email;
        } 
        // Use display name if available
        else if (userInfo.display_name) {
          formattedName = userInfo.display_name;
        }
        break;
        
      case 'github':
        // For GitHub, prioritize name, then login (username)
        formattedName = userInfo.name || userInfo.login || formattedName;
        break;
        
      case 'google':
        // For Google, use name or email
        formattedName = userInfo.name || userInfo.email || formattedName;
        break;
        
      case 'slack':
        // For Slack, use team name or domain
        formattedName = userInfo.name || userInfo.domain || formattedName;
        break;
        
      default:
        // For other integrations, try common fields
        formattedName = userInfo.name || userInfo.email || 
                      userInfo.display_name || userInfo.login || 
                      formattedName;
    }
    
    console.log(`[CALLBACK-INTEGRATION] Using formatted account name: ${formattedName}`);
    return formattedName;
    
  } catch (error) {
    console.error(`[CALLBACK-INTEGRATION] Error formatting account name:`, error);
    // Fallback to a reliable field or default
    return userInfo.email || userInfo.id || 'Account';
  }
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
      return new Response(JSON.stringify({ error: 'Too many requests' }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
        status: 429,
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    let code: string | null = null;
    let state: string | null = null;
    let error: string | null = null;
    let isApiCall = false;

    // Handle both GET (direct OAuth redirect) and POST (API call from frontend)
    if (req.method === 'GET') {
      const url = new URL(req.url);
      code = url.searchParams.get('code');
      state = url.searchParams.get('state');
      error = url.searchParams.get('error');
      console.log(`[CALLBACK-INTEGRATION] GET request - code: ${code ? 'present' : 'missing'}, state: ${state}, error: ${error}`);
    } else if (req.method === 'POST') {
      try {
        const body = await req.json();
        code = body.code;
        state = body.state;
        error = body.error;
        isApiCall = true;
        console.log(`[CALLBACK-INTEGRATION] POST request - code: ${code ? 'present' : 'missing'}, state: ${state}, error: ${error}`);
      } catch (parseError) {
        console.error(`[CALLBACK-INTEGRATION] Failed to parse POST body:`, parseError);
        return new Response(JSON.stringify({ error: 'Invalid request body' }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
          status: 400,
        });
      }
    } else {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
        status: 405,
      });
    }

    if (error) {
      console.error(`[CALLBACK-INTEGRATION] OAuth error: ${error}`);
      if (isApiCall) {
        return new Response(JSON.stringify({ error: `OAuth error: ${error}` }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
          status: 400,
        });
      } else {
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
    }

    if (!code || !state) {
      console.error(`[CALLBACK-INTEGRATION] Missing required parameters - code: ${code ? 'present' : 'missing'}, state: ${state ? 'present' : 'missing'}`);
      const errorMsg = 'Missing required parameters (code or state)';
      if (isApiCall) {
        return new Response(JSON.stringify({ error: errorMsg }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
          status: 400,
        });
      } else {
        throw new Error(errorMsg);
      }
    }

    // Input sanitization
    const sanitizedCode = sanitizeInput(code);
    const sanitizedState = sanitizeInput(state);

    // Enhanced state validation
    const stateValidation = validateOAuthState(sanitizedState);
    if (!stateValidation.isValid || !stateValidation.userId || !stateValidation.integrationId) {
      console.error(`[CALLBACK-INTEGRATION] State validation failed for state: ${sanitizedState}`);
      const errorMsg = 'Invalid or expired OAuth state';
      if (isApiCall) {
        return new Response(JSON.stringify({ error: errorMsg }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
          status: 400,
        });
      } else {
        throw new Error(errorMsg);
      }
    }

    const { userId, integrationId } = stateValidation;

    console.log(`[CALLBACK-INTEGRATION] Processing callback for integration: ${integrationId}, user: ${userId}`);

    // Validate OAuth state against stored data
    const { data: storedState, error: stateError } = await supabase
      .from('integration_configs')
      .select('config_value')
      .eq('user_id', userId)
      .eq('integration_type', integrationId)
      .eq('config_key', 'oauth_state')
      .maybeSingle();

    if (stateError) {
      console.error(`[CALLBACK-INTEGRATION] Error fetching stored state:`, stateError);
      const errorMsg = 'Failed to validate OAuth state';
      if (isApiCall) {
        return new Response(JSON.stringify({ error: errorMsg }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
          status: 500,
        });
      } else {
        throw new Error(errorMsg);
      }
    }

    if (!storedState || storedState.config_value.state !== sanitizedState) {
      console.error(`[CALLBACK-INTEGRATION] State validation failed - stored: ${storedState?.config_value?.state}, received: ${sanitizedState}`);
      const errorMsg = 'OAuth state validation failed';
      if (isApiCall) {
        return new Response(JSON.stringify({ error: errorMsg }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
          status: 400,
        });
      } else {
        throw new Error(errorMsg);
      }
    }

    console.log(`[CALLBACK-INTEGRATION] State validation successful, proceeding with token exchange`);

    // Determine which OAuth app was used and get appropriate credentials
    const usingPersonalApp = storedState.config_value.using_personal_app || false;
    
    // Exchange code for access token based on integration type
    let accessToken = '';
    let refreshToken = '';
    let userInfo: any = {};

    switch (integrationId.toLowerCase()) {
      case 'zoom':
        let zoomClientId = '';
        let zoomClientSecret = '';

        if (usingPersonalApp) {
          // User's personal OAuth app - get credentials from user config
          const { data: userApp } = await supabase
            .from('integration_configs')
            .select('config_value')
            .eq('user_id', userId)
            .eq('integration_type', integrationId)
            .eq('config_key', 'user_oauth_app')
            .single();
          
          if (!userApp?.config_value) {
            throw new Error('Personal OAuth app configuration not found');
          }
          
          zoomClientId = userApp.config_value.client_id;
          zoomClientSecret = userApp.config_value.client_secret;
          console.log(`[CALLBACK-INTEGRATION] Using personal OAuth app for Zoom token exchange`);
        } else {
          // System OAuth app - use environment variables
          zoomClientId = Deno.env.get('ZOOM_CLIENT_ID') || '';
          zoomClientSecret = Deno.env.get('ZOOM_CLIENT_SECRET') || '';
          console.log(`[CALLBACK-INTEGRATION] Using system OAuth app for Zoom token exchange`);
        }

        if (!zoomClientId || !zoomClientSecret) {
          throw new Error('Zoom OAuth app credentials not available');
        }

        const zoomTokenResponse = await fetch('https://zoom.us/oauth/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${btoa(`${zoomClientId}:${zoomClientSecret}`)}`,
          },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            code: sanitizedCode,
            redirect_uri: storedState.config_value.redirect_uri,
          }),
        });
        
        const zoomTokenData = await zoomTokenResponse.json();
        console.log(`[CALLBACK-INTEGRATION] Zoom token response status: ${zoomTokenResponse.status}`);
        
        if (zoomTokenData.error) {
          console.error(`[CALLBACK-INTEGRATION] Zoom token exchange failed:`, zoomTokenData);
          throw new Error(`Zoom token exchange failed: ${zoomTokenData.error}`);
        }
        
        accessToken = zoomTokenData.access_token;
        refreshToken = zoomTokenData.refresh_token;

        // Get user info from Zoom
        const zoomUserResponse = await fetch('https://api.zoom.us/v2/users/me', {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        });
        userInfo = await zoomUserResponse.json();
        console.log(`[CALLBACK-INTEGRATION] Zoom user info retrieved: ${userInfo.email || 'no email'}`);
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
      const errorMsg = 'Failed to obtain access token';
      if (isApiCall) {
        return new Response(JSON.stringify({ error: errorMsg }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
          status: 400,
        });
      } else {
        throw new Error(errorMsg);
      }
    }

    console.log(`[CALLBACK-INTEGRATION] Token exchange successful, creating connection`);

    // SECURE: Store credentials in Vault instead of plaintext
    const { storeCredentialsInVault, generateSecretName } = await import('../_shared/vault-helpers.ts');
    
    const secretName = generateSecretName(integrationId, userId);
    const vaultSecretId = await storeCredentialsInVault(
      supabase,
      {
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_at: Date.now() + (3600 * 1000), // 1 hour default
      },
      secretName,
      userId,
      integrationId
    );

    console.log(`[CALLBACK-INTEGRATION] Credentials stored in vault: ${vaultSecretId}`);
    
    // Get a properly formatted account name based on the user info
    const formattedAccountName = getFormattedAccountName(integrationId, userInfo);
    
    const { data: connection, error: upsertError } = await supabase
      .from('integration_connections')
      .upsert({
        user_id: userId,
        integration_type: integrationId,
        connection_name: formattedAccountName,
        connection_status: 'active',
        vault_secret_id: vaultSecretId, // Reference to vault secret
        credentials: {}, // Empty - credentials in vault
        configuration: {
          user_info: userInfo,
          connected_at: new Date().toISOString(),
        },
        last_sync_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,integration_type',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (upsertError) {
      console.error(`[CALLBACK-INTEGRATION] Failed to upsert connection:`, upsertError);
      const errorMsg = `Failed to store connection: ${upsertError.message}`;
      if (isApiCall) {
        return new Response(JSON.stringify({ error: errorMsg }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
          status: 500,
        });
      } else {
        throw new Error(errorMsg);
      }
    }

    // Clean up OAuth state
    await supabase
      .from('integration_configs')
      .delete()
      .eq('user_id', userId)
      .eq('integration_type', integrationId)
      .eq('config_key', 'oauth_state');

    console.log(`[CALLBACK-INTEGRATION] Successfully connected ${integrationId} for user ${userId}, connection ID: ${connection.id}`);

    // Send success email notification with corrected parameter names
    try {
      const { data: userResult } = await supabase.auth.admin.getUserById(userId);
      if (userResult.user?.email) {
        const connectionDate = new Date().toISOString();
        
        // Use the properly formatted account name
        const accountName = formattedAccountName;
        console.log(`[CALLBACK-INTEGRATION] Sending email with account name: ${accountName}`);
        
        await supabase.functions.invoke('send-email', {
          body: {
            template: 'integration-connected',
            to: userResult.user.email,
            data: {
              integrationName: integrationId.charAt(0).toUpperCase() + integrationId.slice(1), // Capitalize integration name
              integrationIcon: getIntegrationIcon(integrationId),
              userEmail: accountName, // Use the formatted account name for clarity
              features: getIntegrationFeatures(integrationId),
              dashboardUrl: 'https://saleswhispererv2-0.lovable.app/dashboard',
              connectedAt: connectionDate
            }
          }
        })
      }
    } catch (emailError) {
      console.error('Failed to send connection success email:', emailError)
      // Don't fail the main operation for email errors
    }

    // Return appropriate response format
    if (isApiCall) {
      return new Response(JSON.stringify({
        success: true,
        integration_name: integrationId,
        connection_name: formattedAccountName,
        connection_id: connection.id,
        user_info: userInfo
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
        status: 200,
      });
    } else {
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
    }

  } catch (error) {
    console.error('[CALLBACK-INTEGRATION] Error:', error);
    
    // Send failure email notification if we have user context
    try {
      const url = new URL(req.url);
      const state = url.searchParams.get('state');
      if (state) {
        const stateValidation = validateOAuthState(state);
        if (stateValidation.isValid && stateValidation.userId) {
          const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            { auth: { persistSession: false } }
          );
          const { data: userResult } = await supabase.auth.admin.getUserById(stateValidation.userId);
          if (userResult.user?.email) {
            await supabase.functions.invoke('send-email', {
              body: {
                template: 'integration-failed',
                to: userResult.user.email,
                data: {
                  integration_name: stateValidation.integrationId || 'Integration',
                  integration_icon: getIntegrationIcon(stateValidation.integrationId || ''),
                  user_email: userResult.user.email,
                  error_message: error instanceof Error ? error.message : 'Unknown error',
                  retry_url: 'https://saleswhispererv2-0.lovable.app/integrations',
                  failed_at: new Date().toISOString()
                }
              }
            })
          }
        }
      }
    } catch (emailError) {
      console.error('Failed to send connection failure email:', emailError)
    }
    
    // Return appropriate error response format  
    if (req.method === 'POST') {
      return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
        status: 400,
      });
    } else {
      return new Response(`
        <html>
          <body>
            <h1>Connection Failed</h1>
            <p>Error: ${error instanceof Error ? error.message : 'Unknown error'}</p>
            <script>window.close();</script>
          </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' },
        status: 400,
      });
    }
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
