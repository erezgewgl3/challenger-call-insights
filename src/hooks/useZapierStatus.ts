import { useState, useEffect, useCallback } from 'react';
import { useZapierIntegration } from './useZapier';

export interface ZapierStatus {
  status: 'setup' | 'connected' | 'error';
  color: string;
  text: string;
  successRate: number;
  activeWebhooks: number;
  activeApiKeys: number;
}

export function useZapierStatus() {
  const { isSetupComplete, connection, apiKeys, webhooks } = useZapierIntegration();
  const [lastVerifiedAt, setLastVerifiedAt] = useState<Date | null>(null);

  // Load last verified time from session storage on mount
  useEffect(() => {
    const stored = sessionStorage.getItem('zapier:lastConnectedAt');
    if (stored) {
      setLastVerifiedAt(new Date(stored));
    }
  }, []);

  // Listen for successful verification events from child components
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { when?: string } | undefined;
      const when = detail?.when || new Date().toISOString();
      setLastVerifiedAt(new Date(when));
      sessionStorage.setItem('zapier:lastConnectedAt', when);
    };
    window.addEventListener('zapier:connectionVerified', handler as EventListener);
    return () => window.removeEventListener('zapier:connectionVerified', handler as EventListener);
  }, []);

  // Calculate webhook success rate over last 24 hours
  const calculateSuccessRate = useCallback(() => {
    if (!webhooks.webhooks.length) return 0;
    
    const totalHooks = webhooks.webhooks.length;
    const successfulHooks = webhooks.webhooks.filter(hook => 
      hook.success_count > hook.failure_count
    ).length;
    
    return Math.round((successfulHooks / totalHooks) * 100);
  }, [webhooks.webhooks]);

  // Get status with comprehensive logic
  const getStatus = useCallback((): ZapierStatus => {
    const successRate = calculateSuccessRate();
    const activeWebhooks = webhooks.webhooks.filter(hook => hook.is_active).length;
    const activeApiKeys = apiKeys.apiKeys.filter(key => key.is_active).length;

    // Check if basic setup is incomplete
    if (!isSetupComplete) {
      return { 
        status: 'setup', 
        color: 'bg-yellow-500', 
        text: 'Setup Required',
        successRate,
        activeWebhooks,
        activeApiKeys
      };
    }
    
    // Check if connection is active, recently tested successfully, or has recent verification
    const hasRecentVerification = lastVerifiedAt && Date.now() - lastVerifiedAt.getTime() < 15 * 60 * 1000;
    
    // Check for recent webhook activity (successful webhooks indicate connectivity)
    const hasRecentWebhookActivity = webhooks.webhooks.some(webhook => {
      if (!webhook.is_active) return false;
      const lastActivity = webhook.last_triggered || webhook.created_at;
      return lastActivity && Date.now() - new Date(lastActivity).getTime() < 15 * 60 * 1000;
    });
    
    const isConnected = connection.isConnected || 
                       connection.connectionStatus.status === 'connected' || 
                       hasRecentVerification || 
                       hasRecentWebhookActivity;
    
    if (isConnected) {
      // Determine health based on success rate
      if (successRate >= 90) {
        return { 
          status: 'connected', 
          color: 'bg-green-500', 
          text: 'Healthy',
          successRate,
          activeWebhooks,
          activeApiKeys
        };
      } else if (successRate >= 70) {
        return { 
          status: 'connected', 
          color: 'bg-yellow-500', 
          text: 'Degraded',
          successRate,
          activeWebhooks,
          activeApiKeys
        };
      } else {
        return { 
          status: 'connected', 
          color: 'bg-red-500', 
          text: 'Connected',
          successRate,
          activeWebhooks,
          activeApiKeys
        };
      }
    }
    
    // If setup is complete but no successful connection, show connection issues
    return { 
      status: 'error', 
      color: 'bg-red-500', 
      text: 'Issues Detected',
      successRate,
      activeWebhooks,
      activeApiKeys
    };
  }, [
    isSetupComplete, 
    connection.isConnected, 
    connection.connectionStatus.status, 
    lastVerifiedAt, 
    webhooks.webhooks,
    apiKeys.apiKeys,
    calculateSuccessRate
  ]);

  // Background connection test
  const runBackgroundTest = useCallback(async () => {
    if (!isSetupComplete) {
      return;
    }
    
    // Skip if we have a recent successful verification (within 15 minutes)
    if (lastVerifiedAt && Date.now() - lastVerifiedAt.getTime() < 15 * 60 * 1000) {
      return;
    }

    // Skip if already connected or currently testing
    if (connection.connectionStatus.status === 'connected' || connection.connectionStatus.status === 'testing') {
      return;
    }

    // Only run background test if we have at least one active API key
    const hasActiveApiKey = apiKeys.apiKeys.some(key => key.is_active);
    if (!hasActiveApiKey) {
      return;
    }

    try {
      const result = await connection.testConnection();
      // Check if connection is now successful
      if (result && (result as any).success) {
        const now = new Date();
        setLastVerifiedAt(now);
        sessionStorage.setItem('zapier:lastConnectedAt', now.toISOString());
      }
    } catch (error) {
      // Silent failure for background test
      console.log('Background Zapier connection test failed:', error);
    }
  }, [isSetupComplete, connection, lastVerifiedAt, apiKeys.apiKeys]);

  return {
    getStatus,
    runBackgroundTest,
    lastVerifiedAt,
    setLastVerifiedAt
  };
}