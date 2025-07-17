import { describe, test, expect, beforeEach } from 'vitest';
import { IntegrationsRegistry } from '@/lib/integrations/registry';
import { BaseIntegrationHandler } from '@/lib/integrations/base-handler';

describe('Integrations Registry', () => {
  let registry: IntegrationsRegistry;

  beforeEach(() => {
    registry = new IntegrationsRegistry();
  });

  describe('Integration Registration', () => {
    test('should register new integration handler', () => {
      const mockHandler = new BaseIntegrationHandler('test-integration');
      
      registry.register('test-integration', mockHandler);
      
      expect(registry.isRegistered('test-integration')).toBe(true);
    });

    test('should throw error when registering duplicate integration', () => {
      const mockHandler1 = new BaseIntegrationHandler('test-integration');
      const mockHandler2 = new BaseIntegrationHandler('test-integration');
      
      registry.register('test-integration', mockHandler1);
      
      expect(() => {
        registry.register('test-integration', mockHandler2);
      }).toThrow('Integration test-integration is already registered');
    });

    test('should validate integration handler interface', () => {
      const invalidHandler = {};
      
      expect(() => {
        registry.register('invalid', invalidHandler as any);
      }).toThrow('Handler must implement IntegrationHandler interface');
    });
  });

  describe('Integration Retrieval', () => {
    test('should retrieve registered integration handler', () => {
      const mockHandler = new BaseIntegrationHandler('zoom');
      registry.register('zoom', mockHandler);
      
      const retrieved = registry.get('zoom');
      
      expect(retrieved).toBe(mockHandler);
    });

    test('should throw error for unregistered integration', () => {
      expect(() => {
        registry.get('non-existent');
      }).toThrow('Integration non-existent is not registered');
    });

    test('should return all registered integrations', () => {
      const handler1 = new BaseIntegrationHandler('zoom');
      const handler2 = new BaseIntegrationHandler('slack');
      
      registry.register('zoom', handler1);
      registry.register('slack', handler2);
      
      const all = registry.getAll();
      
      expect(Object.keys(all)).toEqual(['zoom', 'slack']);
      expect(all.zoom).toBe(handler1);
      expect(all.slack).toBe(handler2);
    });
  });

  describe('Integration Capabilities', () => {
    test('should return integration capabilities', () => {
      const mockHandler = new BaseIntegrationHandler('zoom');
      mockHandler.capabilities = {
        oauth: true,
        webhooks: true,
        sync: true,
        realtime: false
      };
      
      registry.register('zoom', mockHandler);
      
      const capabilities = registry.getCapabilities('zoom');
      
      expect(capabilities.oauth).toBe(true);
      expect(capabilities.webhooks).toBe(true);
      expect(capabilities.sync).toBe(true);
      expect(capabilities.realtime).toBe(false);
    });

    test('should return default capabilities for unregistered integration', () => {
      const capabilities = registry.getCapabilities('non-existent');
      
      expect(capabilities.oauth).toBe(false);
      expect(capabilities.webhooks).toBe(false);
      expect(capabilities.sync).toBe(false);
      expect(capabilities.realtime).toBe(false);
    });
  });

  describe('Integration Status', () => {
    test('should check if integration is registered', () => {
      const mockHandler = new BaseIntegrationHandler('slack');
      registry.register('slack', mockHandler);
      
      expect(registry.isRegistered('slack')).toBe(true);
      expect(registry.isRegistered('non-existent')).toBe(false);
    });

    test('should return list of registered integration types', () => {
      const handler1 = new BaseIntegrationHandler('zoom');
      const handler2 = new BaseIntegrationHandler('slack');
      const handler3 = new BaseIntegrationHandler('github');
      
      registry.register('zoom', handler1);
      registry.register('slack', handler2);
      registry.register('github', handler3);
      
      const types = registry.getRegisteredTypes();
      
      expect(types).toEqual(['zoom', 'slack', 'github']);
    });
  });

  describe('Integration Validation', () => {
    test('should validate OAuth configuration', () => {
      const mockHandler = new BaseIntegrationHandler('zoom');
      mockHandler.config = {
        oauth: {
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
          scopes: ['read:user'],
          authUrl: 'https://zoom.us/oauth/authorize',
          tokenUrl: 'https://zoom.us/oauth/token'
        }
      };
      
      registry.register('zoom', mockHandler);
      
      const isValid = registry.validateOAuthConfig('zoom');
      
      expect(isValid).toBe(true);
    });

    test('should detect invalid OAuth configuration', () => {
      const mockHandler = new BaseIntegrationHandler('zoom');
      mockHandler.config = {
        oauth: {
          clientId: 'test-client-id'
          // Missing required fields
        }
      };
      
      registry.register('zoom', mockHandler);
      
      const isValid = registry.validateOAuthConfig('zoom');
      
      expect(isValid).toBe(false);
    });

    test('should validate webhook configuration', () => {
      const mockHandler = new BaseIntegrationHandler('slack');
      mockHandler.config = {
        webhooks: {
          events: ['message.created', 'user.joined'],
          verifySignature: true,
          secretKey: 'webhook-secret'
        }
      };
      
      registry.register('slack', mockHandler);
      
      const isValid = registry.validateWebhookConfig('slack');
      
      expect(isValid).toBe(true);
    });
  });

  describe('Integration Lifecycle', () => {
    test('should unregister integration', () => {
      const mockHandler = new BaseIntegrationHandler('github');
      registry.register('github', mockHandler);
      
      expect(registry.isRegistered('github')).toBe(true);
      
      registry.unregister('github');
      
      expect(registry.isRegistered('github')).toBe(false);
    });

    test('should clear all registrations', () => {
      const handler1 = new BaseIntegrationHandler('zoom');
      const handler2 = new BaseIntegrationHandler('slack');
      
      registry.register('zoom', handler1);
      registry.register('slack', handler2);
      
      expect(registry.getRegisteredTypes()).toEqual(['zoom', 'slack']);
      
      registry.clear();
      
      expect(registry.getRegisteredTypes()).toEqual([]);
    });
  });
});