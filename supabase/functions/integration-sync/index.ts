import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

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

    const { connection_id, operation_type = 'full_sync' } = await req.json();

    if (!connection_id) {
      throw new Error('Missing connection_id parameter');
    }

    console.log(`[SYNC-INTEGRATION] Starting ${operation_type} for connection: ${connection_id}`);

    // Get the connection details
    const { data: connection, error: connectionError } = await supabase
      .from('integration_connections')
      .select('*')
      .eq('id', connection_id)
      .eq('user_id', userData.user.id)
      .single();

    if (connectionError || !connection) {
      throw new Error('Connection not found or access denied');
    }

    if (connection.connection_status !== 'active') {
      throw new Error('Connection is not active');
    }

    // Create a sync operation record
    const { data: syncOperation, error: syncError } = await supabase
      .from('integration_sync_operations')
      .insert({
        connection_id: connection_id,
        operation_type: operation_type,
        operation_status: 'running',
        started_at: new Date().toISOString(),
        operation_data: {
          initiated_by: userData.user.id,
          integration_type: connection.integration_type,
        },
      })
      .select()
      .single();

    if (syncError) {
      throw new Error(`Failed to create sync operation: ${syncError.message}`);
    }

    try {
      let syncResult = { records_processed: 0, records_total: 0 };

      // Perform integration-specific sync logic
      switch (connection.integration_type.toLowerCase()) {
        case 'github':
          syncResult = await performGitHubSync(connection, operation_type, supabase);
          break;

        case 'google':
          syncResult = await performGoogleSync(connection, operation_type, supabase);
          break;

        case 'slack':
          syncResult = await performSlackSync(connection, operation_type, supabase);
          break;

        case 'salesforce':
          syncResult = await performSalesforceSync(connection, operation_type, supabase);
          break;

        default:
          throw new Error(`Sync not implemented for integration type: ${connection.integration_type}`);
      }

      // Update sync operation as completed
      await supabase
        .from('integration_sync_operations')
        .update({
          operation_status: 'completed',
          completed_at: new Date().toISOString(),
          records_processed: syncResult.records_processed,
          records_total: syncResult.records_total,
          progress_percentage: 100,
        })
        .eq('id', syncOperation.id);

      // Update connection last sync time
      await supabase
        .from('integration_connections')
        .update({
          last_sync_at: new Date().toISOString(),
        })
        .eq('id', connection_id);

      console.log(`[SYNC-INTEGRATION] Successfully completed ${operation_type} for ${connection.integration_type}: ${syncResult.records_processed}/${syncResult.records_total} records`);

      return new Response(JSON.stringify({
        success: true,
        sync_operation_id: syncOperation.id,
        records_processed: syncResult.records_processed,
        records_total: syncResult.records_total,
        message: `Sync completed successfully`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });

    } catch (syncError) {
      // Update sync operation as failed
      await supabase
        .from('integration_sync_operations')
        .update({
          operation_status: 'failed',
          completed_at: new Date().toISOString(),
          error_details: { error: syncError instanceof Error ? syncError.message : 'Unknown error' },
        })
        .eq('id', syncOperation.id);

      // Send error email notification
      try {
        const { data: userResult } = await supabase.auth.admin.getUserById(userData.user.id);
        if (userResult.user?.email) {
          await supabase.functions.invoke('send-email', {
            body: {
              template: 'integration-error',
              to: userResult.user.email,
              data: {
                integration_name: connection.integration_type,
                integration_icon: getIntegrationIcon(connection.integration_type),
                user_email: userResult.user.email,
                error_type: 'Sync Error',
                error_message: syncError instanceof Error ? syncError.message : 'Unknown error',
                sync_id: syncOperation.id,
                dashboard_url: 'https://app.saleswhisperer.net/dashboard',
                occurred_at: new Date().toISOString()
              }
            }
          })
        }
      } catch (emailError) {
        console.error('Failed to send sync error email:', emailError)
      }

      throw syncError;
    }

  } catch (error) {
    console.error('[SYNC-INTEGRATION] Error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});

// Integration-specific sync functions
async function getCredentialsForConnection(connection: any, supabase: any) {
  // SECURE: Retrieve credentials from vault
  const { getCredentialsFromVault } = await import('../_shared/vault-helpers.ts');
  
  if (connection.vault_secret_id) {
    try {
      return await getCredentialsFromVault(supabase, connection.vault_secret_id);
    } catch (vaultError) {
      console.warn('[SYNC] Vault retrieval failed, falling back to database:', vaultError);
      return connection.credentials;
    }
  }
  
  // Legacy fallback
  console.warn('[SYNC] Using legacy plaintext credentials - migration to vault recommended');
  return connection.credentials;
}

async function performGitHubSync(connection: any, operationType: string, supabase: any) {
  console.log(`[GITHUB-SYNC] Performing ${operationType} sync`);
  
  const credentials = await getCredentialsForConnection(connection, supabase);
  const accessToken = credentials.access_token;
  
  // Get user repositories
  const reposResponse = await fetch('https://api.github.com/user/repos', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'User-Agent': 'Sales-Whisperer-Integration',
    },
  });
  
  if (!reposResponse.ok) {
    throw new Error(`GitHub API error: ${reposResponse.status}`);
  }
  
  const repos = await reposResponse.json();
  
  // For demo purposes, just return the count
  return {
    records_processed: repos.length,
    records_total: repos.length,
  };
}

async function performGoogleSync(connection: any, operationType: string, supabase: any) {
  console.log(`[GOOGLE-SYNC] Performing ${operationType} sync`);
  
  // Example: Sync Google Drive files or Calendar events
  const credentials = await getCredentialsForConnection(connection, supabase);
  const accessToken = credentials.access_token;
  
  const driveResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });
  
  if (!driveResponse.ok) {
    throw new Error(`Google API error: ${driveResponse.status}`);
  }
  
  const driveData = await driveResponse.json();
  
  return {
    records_processed: driveData.files?.length || 0,
    records_total: driveData.files?.length || 0,
  };
}

async function performSlackSync(connection: any, operationType: string, supabase: any) {
  console.log(`[SLACK-SYNC] Performing ${operationType} sync`);
  
  const credentials = await getCredentialsForConnection(connection, supabase);
  const accessToken = credentials.access_token;
  
  // Get channels list
  const channelsResponse = await fetch('https://slack.com/api/conversations.list', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });
  
  if (!channelsResponse.ok) {
    throw new Error(`Slack API error: ${channelsResponse.status}`);
  }
  
  const channelsData = await channelsResponse.json();
  
  if (!channelsData.ok) {
    throw new Error(`Slack API error: ${channelsData.error}`);
  }
  
  return {
    records_processed: channelsData.channels?.length || 0,
    records_total: channelsData.channels?.length || 0,
  };
}

async function performSalesforceSync(connection: any, operationType: string, supabase: any) {
  console.log(`[SALESFORCE-SYNC] Performing ${operationType} sync`);
  
  const credentials = await getCredentialsForConnection(connection, supabase);
  const accessToken = credentials.access_token;
  const instanceUrl = connection.configuration.instance_url;
  
  // Get accounts from Salesforce
  const accountsResponse = await fetch(`${instanceUrl}/services/data/v58.0/sobjects/Account`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });
  
  if (!accountsResponse.ok) {
    throw new Error(`Salesforce API error: ${accountsResponse.status}`);
  }
  
  const accountsData = await accountsResponse.json();
  
  return {
    records_processed: accountsData.recentItems?.length || 0,
    records_total: accountsData.recentItems?.length || 0,
  };
}

// Helper function for email data
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