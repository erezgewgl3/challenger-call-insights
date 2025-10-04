import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const testSupabase = createClient(
  'https://test.supabase.co',
  'test-anon-key'
);

describe('End-to-End Integration Framework', () => {
  const testUserId = 'e2e-test-user';
  let connectionId: string;
  let syncId: string;

  beforeEach(async () => {
    // Setup clean test environment
  });

  afterEach(async () => {
    // Cleanup all test data
    if (connectionId) {
      await testSupabase.rpc('integration_framework_delete_connection', {
        connection_id: connectionId
      });
    }
  });

  describe('Complete Integration Lifecycle', () => {
    test('should complete full integration workflow from connection to data sync', async () => {
      // Phase 1: User initiates integration connection
      console.log('Phase 1: Initiating OAuth flow...');
      
      const { data: connectData, error: connectError } = await testSupabase.functions.invoke(
        'integration-connect',
        {
          body: {
            integration_type: 'zoom',
            user_id: testUserId,
            redirect_uri: 'http://localhost:3000/integration-callback'
          }
        }
      );

      expect(connectError).toBeNull();
      expect(connectData.auth_url).toBeDefined();
      expect(connectData.state).toBeDefined();

      // Phase 2: OAuth callback processing
      console.log('Phase 2: Processing OAuth callback...');
      
      const { data: callbackData, error: callbackError } = await testSupabase.functions.invoke(
        'integration-callback',
        {
          body: {
            code: 'e2e-test-auth-code',
            state: connectData.state,
            integration_id: 'zoom'
          }
        }
      );

      expect(callbackError).toBeNull();
      expect(callbackData.success).toBe(true);
      expect(callbackData.connection_id).toBeDefined();
      
      connectionId = callbackData.connection_id;

      // Phase 3: Verify connection status
      console.log('Phase 3: Verifying connection status...');
      
      const { data: statusData, error: statusError } = await testSupabase.functions.invoke(
        'integration-status',
        {
          body: {
            integration_type: 'zoom',
            user_id: testUserId
          }
        }
      );

      expect(statusError).toBeNull();
      expect(statusData.status).toBe('connected');
      expect(statusData.connection.id).toBe(connectionId);

      // Phase 4: Test initial data sync
      console.log('Phase 4: Triggering initial sync...');
      
      const { data: syncData, error: syncError } = await testSupabase.functions.invoke(
        'integration-sync',
        {
          body: {
            connection_id: connectionId,
            operation_type: 'initial_sync',
            operation_data: {
              sync_meetings: true,
              sync_recordings: false,
              date_range: '30_days'
            }
          }
        }
      );

      expect(syncError).toBeNull();
      expect(syncData.sync_id).toBeDefined();
      expect(syncData.status).toBe('started');
      
      syncId = syncData.sync_id;

      // Phase 5: Monitor sync progress
      console.log('Phase 5: Monitoring sync progress...');
      
      const { data: progressData, error: progressError } = await testSupabase.rpc(
        'integration_framework_get_sync_status',
        { sync_id: syncId }
      );

      expect(progressError).toBeNull();
      expect(progressData.status).toBe('success');
      expect(progressData.data.operation_status).toBeOneOf(['running', 'completed']);

      // Phase 6: Complete sync and verify results
      console.log('Phase 6: Completing sync operation...');
      
      const syncResults = {
        meetings_processed: 25,
        recordings_processed: 0,
        participants_synced: 75,
        duration_ms: 5000
      };

      const { data: completeData, error: completeError } = await testSupabase.rpc(
        'integration_framework_complete_sync',
        {
          sync_id: syncId,
          result_data: syncResults,
          sync_status: 'completed'
        }
      );

      expect(completeError).toBeNull();
      expect(completeData.status).toBe('success');
      expect(completeData.data.operation_status).toBe('completed');

      // Phase 7: Test webhook processing
      console.log('Phase 7: Testing webhook processing...');
      
      const webhookPayload = {
        event: 'meeting.started',
        payload: {
          object: {
            id: 'new-meeting-123',
            topic: 'E2E Test Meeting',
            start_time: new Date().toISOString()
          }
        }
      };

      const { data: webhookData, error: webhookError } = await testSupabase.rpc(
        'integration_framework_log_webhook',
        {
          connection_id: connectionId,
          webhook_event: 'meeting.started',
          payload: webhookPayload
        }
      );

      expect(webhookError).toBeNull();
      expect(webhookData.status).toBe('success');

      // Phase 8: Verify integration health
      console.log('Phase 8: Checking integration health...');
      
      const { data: healthData, error: healthError } = await testSupabase.rpc(
        'integration_framework_get_connection_health',
        { connection_id: connectionId }
      );

      expect(healthError).toBeNull();
      expect(healthData.status).toBe('success');
      expect(healthData.data.health_score).toBeOneOf(['excellent', 'good', 'warning', 'critical']);

      // Phase 9: Test configuration updates
      console.log('Phase 9: Testing configuration updates...');
      
      const configUpdates = {
        sync_frequency_minutes: 60,
        configuration: {
          auto_sync: true,
          sync_recordings: true
        }
      };

      const { data: updateData, error: updateError } = await testSupabase.rpc(
        'integration_framework_update_connection',
        {
          connection_id: connectionId,
          updates: configUpdates
        }
      );

      expect(updateError).toBeNull();
      expect(updateData.status).toBe('success');
      expect(updateData.data.sync_frequency_minutes).toBe(60);

      // Phase 10: Verify vault security
      console.log('Phase 10: Verifying vault security...');
      
      // Verify credentials are stored in vault, not in database
      const { data: connectionData } = await testSupabase
        .from('integration_connections')
        .select('vault_secret_id, credentials')
        .eq('id', connectionId)
        .single();

      expect(connectionData.vault_secret_id).toBeDefined();
      expect(connectionData.credentials).toEqual({});

      // Verify vault access was logged
      const { data: vaultLogs } = await testSupabase
        .from('vault_access_log')
        .select('*')
        .eq('user_id', testUserId)
        .order('created_at', { ascending: false });

      expect(vaultLogs.length).toBeGreaterThan(0);
      expect(vaultLogs.some(log => log.operation === 'store')).toBe(true);
      expect(vaultLogs.some(log => log.operation === 'retrieve')).toBe(true);

      console.log('✅ End-to-end integration workflow completed successfully with vault security!');
    });

    test('should handle integration error recovery', async () => {
      // Phase 1: Create connection that will fail
      const { data: connectData } = await testSupabase.functions.invoke(
        'integration-connect',
        {
          body: {
            integration_type: 'zoom',
            user_id: testUserId
          }
        }
      );

      // Phase 2: Simulate callback with invalid credentials
      const { data: callbackData } = await testSupabase.functions.invoke(
        'integration-callback',
        {
          body: {
            code: 'invalid-auth-code',
            state: connectData.state,
            integration_id: 'zoom'
          }
        }
      );

      expect(callbackData.success).toBe(false);
      expect(callbackData.error).toContain('Invalid authorization code');

      // Phase 3: Verify connection was not created
      const { data: statusData } = await testSupabase.functions.invoke(
        'integration-status',
        {
          body: {
            integration_type: 'zoom',
            user_id: testUserId
          }
        }
      );

      expect(statusData.status).toBe('disconnected');

      // Phase 4: Retry with valid credentials
      const { data: retryCallbackData } = await testSupabase.functions.invoke(
        'integration-callback',
        {
          body: {
            code: 'valid-auth-code',
            state: connectData.state,
            integration_id: 'zoom'
          }
        }
      );

      expect(retryCallbackData.success).toBe(true);
      connectionId = retryCallbackData.connection_id;

      // Phase 5: Verify recovery was successful
      const { data: recoveryStatusData } = await testSupabase.functions.invoke(
        'integration-status',
        {
          body: {
            integration_type: 'zoom',
            user_id: testUserId
          }
        }
      );

      expect(recoveryStatusData.status).toBe('connected');
    });
  });

  describe('Multi-Integration Management', () => {
    test('should handle multiple concurrent integrations', async () => {
      const integrations = ['zoom', 'slack', 'github'];
      const connectionIds: string[] = [];

      // Phase 1: Connect multiple integrations
      for (const integrationType of integrations) {
        const { data: connectData } = await testSupabase.functions.invoke(
          'integration-connect',
          {
            body: {
              integration_type: integrationType,
              user_id: testUserId
            }
          }
        );

        const { data: callbackData } = await testSupabase.functions.invoke(
          'integration-callback',
          {
            body: {
              code: `${integrationType}-auth-code`,
              state: connectData.state,
              integration_id: integrationType
            }
          }
        );

        expect(callbackData.success).toBe(true);
        connectionIds.push(callbackData.connection_id);
      }

      // Phase 2: Verify all connections are active
      for (let i = 0; i < integrations.length; i++) {
        const { data: statusData } = await testSupabase.functions.invoke(
          'integration-status',
          {
            body: {
              integration_type: integrations[i],
              user_id: testUserId
            }
          }
        );

        expect(statusData.status).toBe('connected');
        expect(statusData.connection.id).toBe(connectionIds[i]);
      }

      // Phase 3: Test concurrent syncing
      const syncPromises = connectionIds.map(async (connId, index) => {
        return await testSupabase.functions.invoke(
          'integration-sync',
          {
            body: {
              connection_id: connId,
              operation_type: 'concurrent_sync',
              operation_data: {
                integration_type: integrations[index]
              }
            }
          }
        );
      });

      const syncResults = await Promise.all(syncPromises);
      
      syncResults.forEach(({ data, error }) => {
        expect(error).toBeNull();
        expect(data.status).toBe('started');
      });

      // Phase 4: Cleanup all connections
      for (const connId of connectionIds) {
        await testSupabase.rpc('integration_framework_delete_connection', {
          connection_id: connId
        });
      }
    });
  });

  describe('Performance and Scalability', () => {
    test('should handle high-volume webhook processing', async () => {
      // Create a test connection
      const { data: connectData } = await testSupabase.functions.invoke(
        'integration-connect',
        { body: { integration_type: 'zoom', user_id: testUserId } }
      );

      const { data: callbackData } = await testSupabase.functions.invoke(
        'integration-callback',
        {
          body: {
            code: 'performance-test-code',
            state: connectData.state,
            integration_id: 'zoom'
          }
        }
      );

      connectionId = callbackData.connection_id;

      // Generate multiple webhook events
      const webhookPromises = Array.from({ length: 10 }, (_, i) => {
        return testSupabase.rpc('integration_framework_log_webhook', {
          connection_id: connectionId,
          webhook_event: 'performance.test',
          payload: {
            event_id: `perf-test-${i}`,
            timestamp: Date.now(),
            data: { batch: 'performance-test' }
          }
        });
      });

      const webhookResults = await Promise.all(webhookPromises);
      
      webhookResults.forEach(({ data, error }) => {
        expect(error).toBeNull();
        expect(data.status).toBe('success');
      });

      // Verify all webhooks were logged
      const { data: logsData } = await testSupabase.rpc(
        'integration_framework_get_webhook_logs',
        {
          connection_id: connectionId,
          limit_count: 20
        }
      );

      expect(logsData.data.length).toBeGreaterThanOrEqual(10);
    });

    test('should handle integration statistics calculation', async () => {
      // Test user stats
      const { data: userStats, error: userError } = await testSupabase.rpc(
        'integration_framework_get_user_stats',
        { user_uuid: testUserId }
      );

      expect(userError).toBeNull();
      expect(userStats.status).toBe('success');
      expect(userStats.data.active_connections).toBeDefined();

      // Test system stats
      const { data: systemStats, error: systemError } = await testSupabase.rpc(
        'integration_framework_get_system_stats'
      );

      expect(systemError).toBeNull();
      expect(systemStats.status).toBe('success');
      expect(systemStats.data.total_active_connections).toBeDefined();
    });
  });
});