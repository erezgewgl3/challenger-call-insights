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

    const { connection_id } = await req.json();

    if (!connection_id) {
      throw new Error('Missing connection_id parameter');
    }

    console.log(`[DISCONNECT-INTEGRATION] Disconnecting connection: ${connection_id}`);

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

    // For some integrations, we might want to revoke the token at the provider
    try {
      switch (connection.integration_type.toLowerCase()) {
        case 'github':
          // GitHub doesn't have a standard revoke endpoint for OAuth apps
          // The token will naturally expire or can be revoked in user settings
          break;

        case 'google':
          if (connection.credentials.access_token) {
            await fetch(`https://oauth2.googleapis.com/revoke?token=${connection.credentials.access_token}`, {
              method: 'POST',
            });
          }
          break;

        case 'slack':
          // Slack apps can be uninstalled through the Slack UI
          // The token will be invalidated when the app is removed
          break;

        default:
          // For other integrations, just remove from our database
          break;
      }
    } catch (revokeError) {
      console.warn(`[DISCONNECT-INTEGRATION] Could not revoke token at provider: ${revokeError instanceof Error ? revokeError.message : 'Unknown error'}`);
      // Continue with local disconnection even if provider revocation fails
    }

    // SECURE: Delete credentials from vault if present
    if (connection.vault_secret_id) {
      try {
        const { deleteCredentialsFromVault } = await import('../_shared/vault-helpers.ts');
        await deleteCredentialsFromVault(supabase, connection.vault_secret_id);
        console.log('[DISCONNECT-INTEGRATION] Vault credentials deleted');
      } catch (vaultError) {
        console.warn('[DISCONNECT-INTEGRATION] Could not delete vault credentials:', vaultError);
        // Continue with disconnection even if vault deletion fails
      }
    }
    
    // Update connection status to inactive
    await supabase
      .from('integration_connections')
      .update({
        connection_status: 'inactive',
        last_sync_at: null,
        vault_secret_id: null, // Clear vault reference
        credentials: {}, // Clear any legacy credentials
        updated_at: new Date().toISOString(),
      })
      .eq('id', connection_id)
      .eq('user_id', userData.user.id);

    // Clean up any related configuration
    await supabase
      .from('integration_configs')
      .delete()
      .eq('user_id', userData.user.id)
      .eq('integration_type', connection.integration_type);

    console.log(`[DISCONNECT-INTEGRATION] Successfully disconnected ${connection.integration_type} for user ${userData.user.id}`);

    return new Response(JSON.stringify({
      success: true,
      message: `${connection.integration_type} integration disconnected successfully`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('[DISCONNECT-INTEGRATION] Error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});