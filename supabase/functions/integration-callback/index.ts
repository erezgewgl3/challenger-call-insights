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

    const url = new URL(req.url);
    const integrationId = url.searchParams.get('integration_id');
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

    if (!integrationId || !code || !state) {
      throw new Error('Missing required parameters');
    }

    // Validate OAuth state
    const [userId, integrationType, timestamp] = state.split(':');
    const { data: stateData } = await supabase
      .from('integration_configs')
      .select('config_value')
      .eq('user_id', userId)
      .eq('integration_type', integrationType)
      .eq('config_key', 'oauth_state')
      .single();

    if (!stateData || stateData.config_value.state !== state) {
      throw new Error('Invalid OAuth state');
    }

    console.log(`[CALLBACK-INTEGRATION] Processing callback for ${integrationId}`);

    // Exchange code for access token based on integration type
    let accessToken = '';
    let refreshToken = '';
    let userInfo: any = {};

    switch (integrationId.toLowerCase()) {
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
            code: code,
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
            code: code,
            grant_type: 'authorization_code',
            redirect_uri: stateData.config_value.redirect_uri,
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
            code: code,
            redirect_uri: stateData.config_value.redirect_uri,
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
      connection_name: userInfo.name || userInfo.login || `${integrationId} Connection`,
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
      .eq('integration_type', integrationType)
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
              dashboard_url: 'https://app.saleswhisperer.net/dashboard',
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
                integration_name: url.searchParams.get('integration_id') || 'Integration',
                integration_icon: getIntegrationIcon(url.searchParams.get('integration_id') || ''),
                user_email: userResult.user.email,
                error_message: error.message,
                retry_url: 'https://app.saleswhisperer.net/dashboard/integrations',
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