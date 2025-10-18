/**
 * Vault Helpers for Secure Credential Management
 * 
 * These functions abstract Supabase Vault operations for storing and retrieving
 * sensitive credentials like OAuth tokens. All credentials should be stored in
 * the vault rather than in plaintext database columns.
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

export interface VaultCredentials {
  access_token?: string;
  refresh_token?: string;
  expires_at?: number | string;
  [key: string]: any;
}

/**
 * Store credentials in Supabase Vault and return the vault secret ID
 * @param supabase Supabase client with service role key
 * @param credentials Credentials object to store
 * @param secretName Descriptive name for the secret (e.g., "zoom_token_user_123")
 * @returns The vault secret ID
 */
export async function storeCredentialsInVault(
  supabase: SupabaseClient,
  credentials: VaultCredentials,
  secretName: string,
  userId: string,
  integrationType: string
): Promise<string> {
  console.log(`[VAULT] Storing credentials in vault: ${secretName}`);
  
  try {
    // Use Vault RPC to create secret
    const { data, error } = await supabase.rpc('vault.create_secret', {
      new_secret: JSON.stringify(credentials),
      new_name: secretName,
      new_description: `OAuth credentials for ${integrationType}`
    });

    if (error) {
      console.error('[VAULT] Failed to store credentials:', error);
      
      // Log the failure
      await logVaultAccess(supabase, userId, integrationType, 'store', null, false, error.message);
      
      throw new Error(`Vault storage failed: ${error.message}`);
    }

    console.log(`[VAULT] Credentials stored successfully with ID: ${data}`);
    
    // Log the successful operation
    await logVaultAccess(supabase, userId, integrationType, 'store', data, true);
    
    return data;
  } catch (error) {
    console.error('[VAULT] Error storing credentials:', error);
    throw error;
  }
}

/**
 * Retrieve credentials from Supabase Vault using the secret ID
 * @param supabase Supabase client with service role key
 * @param vaultSecretId The vault secret ID
 * @returns The decrypted credentials object
 */
export async function getCredentialsFromVault(
  supabase: SupabaseClient,
  vaultSecretId: string,
  userId: string,
  integrationType: string
): Promise<VaultCredentials> {
  console.log(`[VAULT] Retrieving credentials from vault: ${vaultSecretId}`);
  
  try {
    // Query vault schema directly for decrypted secrets
    const { data, error } = await supabase
      .schema('vault')
      .from('decrypted_secrets')
      .select('decrypted_secret')
      .eq('id', vaultSecretId)
      .single();

    if (error) {
      console.error('[VAULT] Failed to retrieve credentials:', error);
      
      // Log the failure
      await logVaultAccess(supabase, userId, integrationType, 'retrieve', vaultSecretId, false, error.message);
      
      throw new Error(`Vault retrieval failed: ${error.message}`);
    }

    if (!data || !data.decrypted_secret) {
      const errorMsg = 'No credentials found in vault';
      await logVaultAccess(supabase, userId, integrationType, 'retrieve', vaultSecretId, false, errorMsg);
      throw new Error(errorMsg);
    }

    // Parse the JSON string back to object
    const credentials = typeof data.decrypted_secret === 'string' 
      ? JSON.parse(data.decrypted_secret) 
      : data.decrypted_secret;
    
    console.log('[VAULT] Credentials retrieved successfully');
    
    // Log the successful operation
    await logVaultAccess(supabase, userId, integrationType, 'retrieve', vaultSecretId, true);
    
    return credentials;
  } catch (error) {
    console.error('[VAULT] Error retrieving credentials:', error);
    throw error;
  }
}

/**
 * Update existing credentials in Supabase Vault
 * @param supabase Supabase client with service role key
 * @param vaultSecretId The vault secret ID
 * @param credentials Updated credentials object
 */
export async function updateCredentialsInVault(
  supabase: SupabaseClient,
  vaultSecretId: string,
  credentials: VaultCredentials,
  userId: string,
  integrationType: string
): Promise<void> {
  console.log(`[VAULT] Updating credentials in vault: ${vaultSecretId}`);
  
  try {
    // Use Vault RPC to update secret
    const { error } = await supabase.rpc('vault.update_secret', {
      secret_id: vaultSecretId,
      new_secret: JSON.stringify(credentials)
    });

    if (error) {
      console.error('[VAULT] Failed to update credentials:', error);
      
      // Log the failure
      await logVaultAccess(supabase, userId, integrationType, 'update', vaultSecretId, false, error.message);
      
      throw new Error(`Vault update failed: ${error.message}`);
    }

    console.log('[VAULT] Credentials updated successfully');
    
    // Log the successful operation
    await logVaultAccess(supabase, userId, integrationType, 'update', vaultSecretId, true);
  } catch (error) {
    console.error('[VAULT] Error updating credentials:', error);
    throw error;
  }
}

/**
 * Delete credentials from Supabase Vault
 * @param supabase Supabase client with service role key
 * @param vaultSecretId The vault secret ID
 */
export async function deleteCredentialsFromVault(
  supabase: SupabaseClient,
  vaultSecretId: string,
  userId: string,
  integrationType: string
): Promise<void> {
  console.log(`[VAULT] Deleting credentials from vault: ${vaultSecretId}`);
  
  try {
    // Query vault schema directly for deletion
    const { error } = await supabase
      .schema('vault')
      .from('secrets')
      .delete()
      .eq('id', vaultSecretId);

    if (error) {
      console.error('[VAULT] Failed to delete credentials:', error);
      
      // Log the failure
      await logVaultAccess(supabase, userId, integrationType, 'delete', vaultSecretId, false, error.message);
      
      throw new Error(`Vault deletion failed: ${error.message}`);
    }

    console.log('[VAULT] Credentials deleted successfully');
    
    // Log the successful operation
    await logVaultAccess(supabase, userId, integrationType, 'delete', vaultSecretId, true);
  } catch (error) {
    console.error('[VAULT] Error deleting credentials:', error);
    throw error;
  }
}

/**
 * Log vault access for audit trail
 * @param supabase Supabase client
 * @param userId User ID performing the operation
 * @param integrationType Integration type
 * @param operation Type of operation (store, retrieve, update, delete)
 * @param vaultSecretId Vault secret ID (if applicable)
 * @param success Whether the operation succeeded
 * @param errorMessage Error message if operation failed
 */
async function logVaultAccess(
  supabase: SupabaseClient,
  userId: string,
  integrationType: string,
  operation: string,
  vaultSecretId: string | null,
  success: boolean,
  errorMessage?: string
): Promise<void> {
  try {
    await supabase
      .from('vault_access_log')
      .insert({
        user_id: userId,
        integration_type: integrationType,
        operation,
        vault_secret_id: vaultSecretId,
        success,
        error_message: errorMessage || null,
      });
  } catch (error) {
    // Don't throw on logging errors - just log to console
    console.error('[VAULT] Failed to log vault access:', error);
  }
}

/**
 * Generate a unique secret name for vault storage
 * @param integrationType Type of integration (zoom, github, etc.)
 * @param userId User ID
 * @returns Formatted secret name
 */
export function generateSecretName(integrationType: string, userId: string): string {
  return `${integrationType}_token_${userId}_${Date.now()}`;
}
