import type { IntegrationConfig } from '@/lib/integrations/types';

export const mockIntegrationConfig: IntegrationConfig = {
  id: 'zoom',
  name: 'Zoom',
  description: 'Video conferencing and webinar platform',
  version: '1.0.0',
  category: 'Communication',
  authType: 'oauth',
  requiredFields: ['client_id', 'client_secret'],
  optionalFields: ['webhook_url'],
  capabilities: {
    oauth: true,
    webhooks: true,
    sync: true,
    realtime: false
  },
  syncFrequency: 'daily'
};

export const mockIntegrationConnection = {
  id: 'test-connection-id',
  user_id: 'test-user-id',
  integration_type: 'zoom',
  connection_name: 'Test Zoom Connection',
  connection_status: 'active' as const,
  credentials: {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    expires_at: new Date(Date.now() + 3600000).toISOString()
  },
  configuration: {
    auto_sync: true,
    sync_recordings: true,
    webhook_url: 'https://app.example.com/webhooks/zoom'
  },
  last_sync_at: new Date().toISOString(),
  sync_frequency_minutes: 60,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

export const mockSlackIntegrationConfig: IntegrationConfig = {
  id: 'slack',
  name: 'Slack',
  description: 'Team communication and collaboration platform',
  version: '1.0.0',
  category: 'Communication',
  authType: 'oauth',
  requiredFields: ['client_id', 'client_secret'],
  optionalFields: ['bot_token', 'signing_secret'],
  capabilities: {
    oauth: true,
    webhooks: true,
    sync: true,
    realtime: true
  },
  syncFrequency: 'real-time'
};

export const mockGitHubIntegrationConfig: IntegrationConfig = {
  id: 'github',
  name: 'GitHub',
  description: 'Version control and code collaboration platform',
  version: '1.0.0',
  category: 'Development',
  authType: 'oauth',
  requiredFields: ['client_id', 'client_secret'],
  optionalFields: ['webhook_secret'],
  capabilities: {
    oauth: true,
    webhooks: true,
    sync: false,
    realtime: false
  },
  syncFrequency: 'manual'
};

export const mockSyncOperation = {
  id: 'sync-operation-123',
  connection_id: 'test-connection-id',
  operation_type: 'full_sync',
  operation_status: 'completed' as const,
  operation_data: {
    records_total: 100,
    records_processed: 100,
    sync_type: 'meetings'
  },
  progress_percentage: 100,
  records_processed: 100,
  records_total: 100,
  started_at: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
  completed_at: new Date().toISOString(),
  created_at: new Date(Date.now() - 300000).toISOString(),
  error_details: null
};

export const mockWebhookLog = {
  id: 'webhook-log-456',
  connection_id: 'test-connection-id',
  webhook_event: 'meeting.ended',
  payload: {
    event: 'meeting.ended',
    payload: {
      object: {
        id: 'meeting-789',
        topic: 'Sales Call',
        duration: 45,
        participant_count: 3
      }
    }
  },
  headers: {
    'content-type': 'application/json',
    'user-agent': 'Zoom-Webhook/1.0',
    'x-zm-signature': 'signature-hash'
  },
  processing_status: 'success' as const,
  processed_at: new Date().toISOString(),
  retry_count: 0,
  error_message: null,
  created_at: new Date().toISOString()
};

export const mockConnectionMetrics = {
  total_operations: 150,
  successful_operations: 145,
  failed_operations: 5,
  average_processing_time: 2.3,
  uptime_percentage: 99.7,
  last_24h_operations: 25,
  last_24h_errors: 1,
  health_score: 'excellent' as const
};

export const mockUserStats = {
  active_connections: 3,
  total_syncs_30d: 45,
  error_rate_30d: 2.1,
  active_syncs: 0,
  last_updated: new Date().toISOString()
};

export const mockSystemStats = {
  total_active_connections: 1250,
  total_users_with_integrations: 320,
  total_syncs_today: 89,
  total_webhooks_today: 456,
  last_updated: new Date().toISOString()
};

export const mockOAuthState = {
  state: 'oauth-state-token-123',
  integration_type: 'zoom',
  user_id: 'test-user-id',
  redirect_uri: 'http://localhost:3000/integration-callback',
  created_at: new Date().toISOString(),
  expires_at: new Date(Date.now() + 600000).toISOString() // 10 minutes from now
};

export const mockOAuthCallback = {
  code: 'authorization-code-123',
  state: 'oauth-state-token-123',
  integration_id: 'zoom'
};

export const mockOAuthError = {
  error: 'access_denied',
  error_description: 'The user denied the request',
  state: 'oauth-state-token-123'
};

// Helper functions for creating test data
export const createMockConnection = (overrides: Partial<typeof mockIntegrationConnection> = {}) => ({
  ...mockIntegrationConnection,
  ...overrides,
  id: overrides.id || `connection-${Date.now()}`
});

export const createMockSyncOperation = (overrides: Partial<typeof mockSyncOperation> = {}) => ({
  ...mockSyncOperation,
  ...overrides,
  id: overrides.id || `sync-${Date.now()}`
});

export const createMockWebhookLog = (overrides: Partial<typeof mockWebhookLog> = {}) => ({
  ...mockWebhookLog,
  ...overrides,
  id: overrides.id || `webhook-${Date.now()}`
});

export const createMockIntegrationConfig = (overrides: Partial<IntegrationConfig> = {}): IntegrationConfig => ({
  ...mockIntegrationConfig,
  ...overrides
});

// Test scenarios data
export const testScenarios = {
  successfulOAuth: {
    initiate: {
      integration_type: 'zoom',
      user_id: 'test-user-id',
      redirect_uri: 'http://localhost:3000/integration-callback'
    },
    callback: {
      code: 'valid-auth-code',
      state: 'valid-state-token',
      integration_id: 'zoom'
    },
    expectedResult: {
      success: true,
      connection_id: expect.any(String)
    }
  },
  failedOAuth: {
    callback: {
      error: 'access_denied',
      error_description: 'User denied access',
      state: 'valid-state-token'
    },
    expectedResult: {
      success: false,
      error: expect.stringContaining('access_denied')
    }
  },
  webhookEvents: {
    zoom: {
      event: 'meeting.ended',
      payload: {
        object: {
          id: 'meeting-123',
          topic: 'Test Meeting',
          duration: 30
        }
      }
    },
    slack: {
      event: 'message',
      payload: {
        channel: 'C1234567890',
        user: 'U1234567890',
        text: 'Hello, world!',
        ts: '1234567890.123456'
      }
    },
    github: {
      event: 'pull_request.opened',
      payload: {
        action: 'opened',
        pull_request: {
          id: 456789,
          title: 'Add new feature',
          state: 'open'
        }
      }
    }
  }
};