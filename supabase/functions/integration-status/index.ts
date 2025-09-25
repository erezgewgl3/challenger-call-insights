import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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
    const connectionId = url.searchParams.get('connection_id');

    console.log(`[STATUS-INTEGRATION] Checking status for integration: ${integrationId || connectionId}`);

    let query = supabase
      .from('integration_connections')
      .select(`
        id,
        integration_type,
        connection_name,
        connection_status,
        last_sync_at,
        sync_frequency_minutes,
        created_at,
        updated_at,
        configuration,
        credentials
      `)
      .eq('user_id', userData.user.id);

    if (connectionId) {
      query = query.eq('id', connectionId);
    } else if (integrationId) {
      query = query.eq('integration_type', integrationId);
    }

    const { data: connections, error: connectionsError } = await query;

    if (connectionsError) {
      throw new Error(`Failed to fetch connections: ${connectionsError.message}`);
    }

    // For each active connection, validate the token if possible
    const connectionsWithStatus = await Promise.all(
      (connections || []).map(async (connection) => {
        let isTokenValid = true;
        let lastError = null;

        if (connection.connection_status === 'active') {
          try {
            // Test the connection based on integration type
            switch (connection.integration_type.toLowerCase()) {
              case 'github':
                const githubResponse = await fetch('https://api.github.com/user', {
                  headers: {
                    'Authorization': `Bearer ${connection.credentials?.access_token}`,
                    'User-Agent': 'Sales-Whisperer-Integration',
                  },
                });
                isTokenValid = githubResponse.ok;
                if (!isTokenValid) {
                  lastError = `GitHub API returned ${githubResponse.status}`;
                }
                break;

              case 'google':
                const googleResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                  headers: {
                    'Authorization': `Bearer ${connection.credentials?.access_token}`,
                  },
                });
                isTokenValid = googleResponse.ok;
                if (!isTokenValid) {
                  lastError = `Google API returned ${googleResponse.status}`;
                }
                break;

              case 'slack':
                const slackResponse = await fetch('https://slack.com/api/auth.test', {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${connection.credentials?.access_token}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                  },
                });
                const slackData = await slackResponse.json();
                isTokenValid = slackData.ok;
                if (!isTokenValid) {
                  lastError = slackData.error || 'Slack API error';
                }
                break;

              default:
                // For unknown integrations, assume valid if status is active
                isTokenValid = true;
                break;
            }
          } catch (error) {
            isTokenValid = false;
            lastError = error instanceof Error ? error.message : 'Unknown error';
          }

          // Update connection status if token is invalid
          if (!isTokenValid && connection.connection_status === 'active') {
            await supabase
              .from('integration_connections')
              .update({
                connection_status: 'error',
                updated_at: new Date().toISOString(),
              })
              .eq('id', connection.id);
          }
        }

        return {
          ...connection,
          is_token_valid: isTokenValid,
          last_error: lastError,
          health_status: isTokenValid ? 'healthy' : 'error',
        };
      })
    );

    // Get recent sync operations for these connections
    const connectionIds = connectionsWithStatus.map(c => c.id);
    const { data: recentSyncs } = await supabase
      .from('integration_sync_operations')
      .select('connection_id, operation_status, created_at, operation_type')
      .in('connection_id', connectionIds)
      .order('created_at', { ascending: false })
      .limit(5);

    // Get recent webhook logs
    const { data: recentWebhooks } = await supabase
      .from('integration_webhook_logs')
      .select('connection_id, processing_status, created_at, webhook_event')
      .in('connection_id', connectionIds)
      .order('created_at', { ascending: false })
      .limit(5);

    const response = {
      success: true,
      connections: connectionsWithStatus,
      recent_sync_operations: recentSyncs || [],
      recent_webhook_logs: recentWebhooks || [],
      summary: {
        total_connections: connectionsWithStatus.length,
        active_connections: connectionsWithStatus.filter(c => c.connection_status === 'active').length,
        healthy_connections: connectionsWithStatus.filter(c => c.health_status === 'healthy').length,
        error_connections: connectionsWithStatus.filter(c => c.health_status === 'error').length,
      }
    };

    console.log(`[STATUS-INTEGRATION] Status check complete for user ${userData.user.id}: ${response.summary.total_connections} connections found`);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('[STATUS-INTEGRATION] Error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});