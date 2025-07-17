import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

// Test Supabase client configuration
export const createTestSupabaseClient = () => {
  return createClient<Database>(
    process.env.VITE_SUPABASE_URL || 'https://test.supabase.co',
    process.env.VITE_SUPABASE_ANON_KEY || 'test-anon-key'
  );
};

// Test user management
export class TestUserManager {
  private supabase = createTestSupabaseClient();
  private createdUsers: string[] = [];

  async createTestUser(email: string = 'test@example.com'): Promise<string> {
    const userId = `test-user-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    // Insert test user into users table
    const { error } = await this.supabase
      .from('users')
      .insert({
        id: userId,
        email,
        role: 'sales_user',
        status: 'active'
      });

    if (error) {
      throw new Error(`Failed to create test user: ${error.message}`);
    }

    this.createdUsers.push(userId);
    return userId;
  }

  async cleanup(): Promise<void> {
    // Clean up all created test users
    for (const userId of this.createdUsers) {
      await this.supabase
        .from('users')
        .delete()
        .eq('id', userId);
    }
    this.createdUsers = [];
  }
}

// Test connection management
export class TestConnectionManager {
  private supabase = createTestSupabaseClient();
  private createdConnections: string[] = [];

  async createTestConnection(userId: string, integrationType: string = 'zoom'): Promise<string> {
    const { data, error } = await this.supabase.rpc(
      'integration_framework_create_connection',
      {
        user_uuid: userId,
        integration_type: integrationType,
        connection_name: `Test ${integrationType} Connection`,
        credentials: {
          access_token: 'test-access-token',
          refresh_token: 'test-refresh-token'
        },
        configuration: {
          auto_sync: true,
          webhook_url: `https://test.example.com/webhooks/${integrationType}`
        }
      }
    );

    if (error || data.status !== 'success') {
      throw new Error(`Failed to create test connection: ${error?.message || 'Unknown error'}`);
    }

    const connectionId = data.data.id;
    this.createdConnections.push(connectionId);
    return connectionId;
  }

  async cleanup(): Promise<void> {
    // Clean up all created test connections
    for (const connectionId of this.createdConnections) {
      await this.supabase.rpc('integration_framework_delete_connection', {
        connection_id: connectionId
      });
    }
    this.createdConnections = [];
  }
}

// Test data generators
export const generateTestWebhookPayload = (eventType: string, integration: string) => {
  const basePayload = {
    timestamp: Date.now(),
    event_id: `test-event-${Date.now()}`
  };

  switch (integration) {
    case 'zoom':
      return {
        ...basePayload,
        event: eventType,
        payload: {
          object: {
            id: `zoom-object-${Date.now()}`,
            topic: 'Test Meeting',
            start_time: new Date().toISOString(),
            duration: 30
          }
        }
      };
    
    case 'slack':
      return {
        ...basePayload,
        type: 'event_callback',
        event: {
          type: eventType,
          channel: 'C1234567890',
          user: 'U1234567890',
          text: 'Test message',
          ts: Date.now().toString()
        }
      };
    
    case 'github':
      return {
        ...basePayload,
        action: eventType.split('.')[1] || 'opened',
        repository: {
          name: 'test-repo',
          full_name: 'user/test-repo'
        },
        pull_request: {
          id: Date.now(),
          title: 'Test PR',
          state: 'open'
        }
      };
    
    default:
      return basePayload;
  }
};

// Test assertions
export const assertIntegrationStatus = (status: any, expectedStatus: string) => {
  expect(status).toBeDefined();
  expect(status.status).toBe(expectedStatus);
  if (expectedStatus === 'connected') {
    expect(status.connection).toBeDefined();
    expect(status.connection.id).toBeDefined();
  }
};

export const assertSyncOperation = (operation: any, expectedStatus: string) => {
  expect(operation).toBeDefined();
  expect(operation.operation_status).toBe(expectedStatus);
  expect(operation.id).toBeDefined();
  expect(operation.connection_id).toBeDefined();
};

export const assertWebhookLog = (log: any, expectedEvent: string) => {
  expect(log).toBeDefined();
  expect(log.webhook_event).toBe(expectedEvent);
  expect(log.payload).toBeDefined();
  expect(log.created_at).toBeDefined();
};

// Test environment setup
export class TestEnvironment {
  userManager = new TestUserManager();
  connectionManager = new TestConnectionManager();
  
  async setup(): Promise<{ userId: string; connectionId?: string }> {
    const userId = await this.userManager.createTestUser();
    return { userId };
  }

  async setupWithConnection(integrationType: string = 'zoom'): Promise<{ userId: string; connectionId: string }> {
    const userId = await this.userManager.createTestUser();
    const connectionId = await this.connectionManager.createTestConnection(userId, integrationType);
    return { userId, connectionId };
  }

  async cleanup(): Promise<void> {
    await this.connectionManager.cleanup();
    await this.userManager.cleanup();
  }
}

// Mock Edge Function responses
export const mockEdgeFunctionResponse = (data: any, error: any = null) => ({
  data,
  error
});

export const mockSuccessResponse = (data: any) => mockEdgeFunctionResponse(data, null);
export const mockErrorResponse = (message: string) => mockEdgeFunctionResponse(null, new Error(message));

// Test timing utilities
export const waitFor = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const waitForCondition = async (
  condition: () => boolean | Promise<boolean>,
  timeout: number = 5000,
  interval: number = 100
): Promise<void> => {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await waitFor(interval);
  }
  
  throw new Error(`Condition not met within ${timeout}ms`);
};

// Test data validation
export const validateIntegrationConfig = (config: any) => {
  const requiredFields = ['id', 'name', 'description', 'authType', 'capabilities'];
  
  for (const field of requiredFields) {
    if (!config[field]) {
      throw new Error(`Integration config missing required field: ${field}`);
    }
  }
  
  if (typeof config.capabilities !== 'object') {
    throw new Error('Integration config capabilities must be an object');
  }
  
  const capabilityFields = ['oauth', 'webhooks', 'sync', 'realtime'];
  for (const field of capabilityFields) {
    if (typeof config.capabilities[field] !== 'boolean') {
      throw new Error(`Integration capability ${field} must be a boolean`);
    }
  }
};

// Performance testing utilities
export const measurePerformance = async <T>(
  operation: () => Promise<T>,
  label: string = 'operation'
): Promise<{ result: T; duration: number }> => {
  const startTime = performance.now();
  const result = await operation();
  const endTime = performance.now();
  const duration = endTime - startTime;
  
  console.log(`Performance: ${label} took ${duration.toFixed(2)}ms`);
  
  return { result, duration };
};

export const runConcurrentOperations = async <T>(
  operations: (() => Promise<T>)[],
  maxConcurrency: number = 5
): Promise<T[]> => {
  const results: T[] = [];
  
  for (let i = 0; i < operations.length; i += maxConcurrency) {
    const batch = operations.slice(i, i + maxConcurrency);
    const batchResults = await Promise.all(batch.map(op => op()));
    results.push(...batchResults);
  }
  
  return results;
};

// Test reporting utilities
export const generateTestReport = (testResults: any[]) => {
  const passed = testResults.filter(r => r.status === 'passed').length;
  const failed = testResults.filter(r => r.status === 'failed').length;
  const total = testResults.length;
  
  return {
    total,
    passed,
    failed,
    passRate: ((passed / total) * 100).toFixed(2) + '%',
    summary: `${passed}/${total} tests passed (${((passed / total) * 100).toFixed(1)}%)`
  };
};