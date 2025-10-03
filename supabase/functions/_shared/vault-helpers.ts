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
  secretName: string
): Promise<string> {
  console.log(`[VAULT] Storing credentials in vault: ${secretName}`);
  
  try {
    // Store in vault using vault.create_secret RPC
    const { data, error } = await supabase.rpc('vault_create_secret', {
      secret_name: secretName,
      secret_value: JSON.stringify(credentials)
    });

    if (error) {
      console.error('[VAULT] Failed to store credentials:', error);
      throw new Error(`Vault storage failed: ${error.message}`);
    }

    console.log(`[VAULT] Credentials stored successfully with ID: ${data}`);
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
  vaultSecretId: string
): Promise<VaultCredentials> {
  console.log(`[VAULT] Retrieving credentials from vault: ${vaultSecretId}`);
  
  try {
    // Retrieve from vault using vault.read_secret RPC
    const { data, error } = await supabase.rpc('vault_read_secret', {
      secret_id: vaultSecretId
    });

    if (error) {
      console.error('[VAULT] Failed to retrieve credentials:', error);
      throw new Error(`Vault retrieval failed: ${error.message}`);
    }

    if (!data) {
      throw new Error('No credentials found in vault');
    }

    // Parse the JSON string back to object
    const credentials = typeof data === 'string' ? JSON.parse(data) : data;
    console.log('[VAULT] Credentials retrieved successfully');
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
  credentials: VaultCredentials
): Promise<void> {
  console.log(`[VAULT] Updating credentials in vault: ${vaultSecretId}`);
  
  try {
    const { error } = await supabase.rpc('vault_update_secret', {
      secret_id: vaultSecretId,
      secret_value: JSON.stringify(credentials)
    });

    if (error) {
      console.error('[VAULT] Failed to update credentials:', error);
      throw new Error(`Vault update failed: ${error.message}`);
    }

    console.log('[VAULT] Credentials updated successfully');
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
  vaultSecretId: string
): Promise<void> {
  console.log(`[VAULT] Deleting credentials from vault: ${vaultSecretId}`);
  
  try {
    const { error } = await supabase.rpc('vault_delete_secret', {
      secret_id: vaultSecretId
    });

    if (error) {
      console.error('[VAULT] Failed to delete credentials:', error);
      throw new Error(`Vault deletion failed: ${error.message}`);
    }

    console.log('[VAULT] Credentials deleted successfully');
  } catch (error) {
    console.error('[VAULT] Error deleting credentials:', error);
    throw error;
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
