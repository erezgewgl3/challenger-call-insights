import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';

// Mock Supabase client for testing
const mockSupabase = createClient(
  'https://test.supabase.co',
  'test-anon-key'
);

describe('Integration Edge Functions', () => {
  beforeEach(() => {
    // Setup test environment
  });

  afterEach(() => {
    // Cleanup test environment
  });

  describe('integration-connect Edge Function', () => {
    test('should initiate OAuth flow for Zoom integration', async () => {
      const mockRequest = {
        integration_type: 'zoom',
        user_id: 'test-user-id',
        redirect_uri: 'http://localhost:3000/integration-callback'
      };

      const { data, error } = await mockSupabase.functions.invoke(
        'integration-connect',
        { body: mockRequest }
      );

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.auth_url).toContain('zoom.us');
      expect(data.state).toBeDefined();
    });

    test('should handle invalid integration type', async () => {
      const mockRequest = {
        integration_type: 'invalid',
        user_id: 'test-user-id'
      };

      const { data, error } = await mockSupabase.functions.invoke(
        'integration-connect',
        { body: mockRequest }
      );

      expect(error).toBeDefined();
      expect(error.message).toContain('Unsupported integration type');
    });

    test('should require user authentication', async () => {
      const mockRequest = {
        integration_type: 'zoom'
        // Missing user_id
      };

      const { data, error } = await mockSupabase.functions.invoke(
        'integration-connect',
        { body: mockRequest }
      );

      expect(error).toBeDefined();
      expect(error.message).toContain('User ID is required');
    });
  });

  describe('integration-callback Edge Function', () => {
    test('should process successful OAuth callback', async () => {
      const mockRequest = {
        code: 'test-authorization-code',
        state: 'test-state-value',
        integration_id: 'zoom'
      };

      const { data, error } = await mockSupabase.functions.invoke(
        'integration-callback',
        { body: mockRequest }
      );

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.success).toBe(true);
      expect(data.connection_id).toBeDefined();
    });

    test('should handle OAuth errors', async () => {
      const mockRequest = {
        error: 'access_denied',
        error_description: 'User denied access',
        state: 'test-state-value'
      };

      const { data, error } = await mockSupabase.functions.invoke(
        'integration-callback',
        { body: mockRequest }
      );

      expect(data.success).toBe(false);
      expect(data.error).toContain('access_denied');
    });

    test('should validate state parameter', async () => {
      const mockRequest = {
        code: 'test-code',
        state: 'invalid-state',
        integration_id: 'zoom'
      };

      const { data, error } = await mockSupabase.functions.invoke(
        'integration-callback',
        { body: mockRequest }
      );

      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid state parameter');
    });
  });

  describe('integration-status Edge Function', () => {
    test('should return connection status for existing integration', async () => {
      const mockRequest = {
        integration_type: 'zoom',
        user_id: 'test-user-id'
      };

      const { data, error } = await mockSupabase.functions.invoke(
        'integration-status',
        { body: mockRequest }
      );

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.status).toBeOneOf(['connected', 'disconnected', 'error']);
      expect(data.integration_type).toBe('zoom');
    });

    test('should handle non-existent integration', async () => {
      const mockRequest = {
        integration_type: 'zoom',
        user_id: 'non-existent-user'
      };

      const { data, error } = await mockSupabase.functions.invoke(
        'integration-status',
        { body: mockRequest }
      );

      expect(data.status).toBe('disconnected');
      expect(data.connection).toBeNull();
    });
  });

  describe('integration-disconnect Edge Function', () => {
    test('should disconnect existing integration', async () => {
      const mockRequest = {
        connection_id: 'test-connection-id',
        user_id: 'test-user-id'
      };

      const { data, error } = await mockSupabase.functions.invoke(
        'integration-disconnect',
        { body: mockRequest }
      );

      expect(error).toBeNull();
      expect(data.success).toBe(true);
      expect(data.message).toContain('disconnected');
    });

    test('should handle non-existent connection', async () => {
      const mockRequest = {
        connection_id: 'non-existent-id',
        user_id: 'test-user-id'
      };

      const { data, error } = await mockSupabase.functions.invoke(
        'integration-disconnect',
        { body: mockRequest }
      );

      expect(data.success).toBe(false);
      expect(data.error).toContain('Connection not found');
    });
  });

  describe('integration-sync Edge Function', () => {
    test('should trigger manual sync for connection', async () => {
      const mockRequest = {
        connection_id: 'test-connection-id',
        operation_type: 'full_sync'
      };

      const { data, error } = await mockSupabase.functions.invoke(
        'integration-sync',
        { body: mockRequest }
      );

      expect(error).toBeNull();
      expect(data.sync_id).toBeDefined();
      expect(data.status).toBe('started');
    });

    test('should validate sync parameters', async () => {
      const mockRequest = {
        connection_id: 'test-connection-id'
        // Missing operation_type
      };

      const { data, error } = await mockSupabase.functions.invoke(
        'integration-sync',
        { body: mockRequest }
      );

      expect(error).toBeDefined();
      expect(error.message).toContain('operation_type is required');
    });
  });

  describe('Vault Integration Security', () => {
    test('should store credentials in Vault on connection', async () => {
      const mockRequest = {
        code: 'test-authorization-code',
        state: 'test-state-value',
        integration_id: 'zoom'
      };

      const { data, error } = await mockSupabase.functions.invoke(
        'integration-callback',
        { body: mockRequest }
      );

      expect(error).toBeNull();
      expect(data.success).toBe(true);
      
      // Verify connection has vault_secret_id but no plaintext credentials
      const { data: connection } = await mockSupabase
        .from('integration_connections')
        .select('vault_secret_id, credentials')
        .eq('id', data.connection_id)
        .single();

      expect(connection.vault_secret_id).toBeDefined();
      expect(connection.credentials).toEqual({});
    });

    test('should retrieve credentials from Vault for sync operations', async () => {
      const mockRequest = {
        connection_id: 'test-connection-with-vault-id',
        operation_type: 'full_sync'
      };

      const { data, error } = await mockSupabase.functions.invoke(
        'integration-sync',
        { body: mockRequest }
      );

      expect(error).toBeNull();
      expect(data.success).toBe(true);
      
      // Verify vault access was logged
      const { data: vaultLogs } = await mockSupabase
        .from('vault_access_log')
        .select('*')
        .eq('operation', 'retrieve')
        .order('created_at', { ascending: false })
        .limit(1);

      expect(vaultLogs.length).toBeGreaterThan(0);
      expect(vaultLogs[0].success).toBe(true);
    });

    test('should delete credentials from Vault on disconnect', async () => {
      const mockRequest = {
        connection_id: 'test-connection-id',
        user_id: 'test-user-id'
      };

      const { data, error } = await mockSupabase.functions.invoke(
        'integration-disconnect',
        { body: mockRequest }
      );

      expect(error).toBeNull();
      expect(data.success).toBe(true);

      // Verify vault deletion was logged
      const { data: vaultLogs } = await mockSupabase
        .from('vault_access_log')
        .select('*')
        .eq('operation', 'delete')
        .order('created_at', { ascending: false })
        .limit(1);

      expect(vaultLogs.length).toBeGreaterThan(0);
      expect(vaultLogs[0].success).toBe(true);
    });

    test('should fallback to legacy credentials if Vault fails', async () => {
      // Create connection with legacy credentials (no vault_secret_id)
      const { data: legacyConnection } = await mockSupabase
        .from('integration_connections')
        .insert({
          user_id: 'test-user-id',
          integration_type: 'zoom',
          connection_name: 'Legacy Connection',
          credentials: { access_token: 'legacy-token' },
          vault_secret_id: null
        })
        .select()
        .single();

      const mockRequest = {
        connection_id: legacyConnection.id,
        operation_type: 'full_sync'
      };

      const { data, error } = await mockSupabase.functions.invoke(
        'integration-sync',
        { body: mockRequest }
      );

      // Should succeed using legacy credentials
      expect(error).toBeNull();
      expect(data.success).toBe(true);
    });

    test('should log vault access failures', async () => {
      const mockRequest = {
        connection_id: 'connection-with-invalid-vault-id',
        operation_type: 'full_sync'
      };

      const { data, error } = await mockSupabase.functions.invoke(
        'integration-sync',
        { body: mockRequest }
      );

      // Verify vault access failure was logged
      const { data: vaultLogs } = await mockSupabase
        .from('vault_access_log')
        .select('*')
        .eq('success', false)
        .order('created_at', { ascending: false })
        .limit(1);

      expect(vaultLogs.length).toBeGreaterThan(0);
      expect(vaultLogs[0].error_message).toBeDefined();
    });
  });
});