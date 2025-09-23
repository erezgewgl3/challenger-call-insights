import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { X, Key, Webhook, Activity, BookOpen, CheckCircle, AlertCircle } from 'lucide-react';
import { useZapierIntegration } from '@/hooks/useZapier';
import { ZapierApiKeySection } from './zapier/ZapierApiKeySection';
import { ZapierWebhookSection } from './zapier/ZapierWebhookSection';
import { ZapierConnectionTest } from './zapier/ZapierConnectionTest';
import { ZapierIntegrationGuide } from './zapier/ZapierIntegrationGuide';

interface ZapierManagementPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ZapierManagementPanel({ isOpen, onClose }: ZapierManagementPanelProps) {
  const { isSetupComplete, connection, apiKeys, webhooks } = useZapierIntegration();
  const [activeTab, setActiveTab] = useState('api-keys');
  const [lastVerifiedAt, setLastVerifiedAt] = useState<Date | null>(null);

  // Load last verified time from session storage on mount
  useEffect(() => {
    const stored = sessionStorage.getItem('zapier:lastConnectedAt');
    if (stored) {
      setLastVerifiedAt(new Date(stored));
    }
  }, []);

  // Background connection test when panel opens
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

    try {
      await connection.testConnection();
      // Check if connection is now successful
      if (connection.isConnected) {
        const now = new Date();
        setLastVerifiedAt(now);
        sessionStorage.setItem('zapier:lastConnectedAt', now.toISOString());
      }
    } catch (error) {
      // Silent failure for background test
      console.log('Background Zapier connection test failed:', error);
    }
  }, [isSetupComplete, connection, lastVerifiedAt]);

  // Run background test when panel opens
  useEffect(() => {
    if (isOpen) {
      runBackgroundTest();
    }
  }, [isOpen, runBackgroundTest]);

  const getOverallStatus = () => {
    // Check if basic setup is incomplete
    if (!isSetupComplete) {
      return { status: 'setup', color: 'bg-yellow-500', text: 'Setup Required' };
    }
    
    // Check if connection is active, recently tested successfully, or has recent verification
    const hasRecentVerification = lastVerifiedAt && Date.now() - lastVerifiedAt.getTime() < 15 * 60 * 1000;
    
    if (connection.isConnected || connection.connectionStatus.status === 'connected' || hasRecentVerification) {
      return { status: 'connected', color: 'bg-green-500', text: 'Connected' };
    }
    
    // If setup is complete but no successful connection, show connection issues
    return { status: 'error', color: 'bg-red-500', text: 'Connection Issues' };
  };

  const status = getOverallStatus();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <Key className="h-5 w-5 text-orange-600" />
              </div>
              <div className={`absolute -top-1 -right-1 h-3 w-3 rounded-full ${status.color}`} />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold">Zapier Integration</DialogTitle>
              <p className="text-sm text-muted-foreground">
                Automate workflows with 5,000+ apps
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={status.status === 'connected' ? 'default' : 'secondary'}>
              {status.text}
            </Badge>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <Separator />

        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="api-keys" className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                API Keys
                {apiKeys.apiKeys.filter(k => k.is_active).length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 w-5 text-xs flex items-center justify-center">
                    {apiKeys.apiKeys.filter(k => k.is_active).length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="webhooks" className="flex items-center gap-2">
                <Webhook className="h-4 w-4" />
                Webhooks
                {webhooks.webhooks.filter(w => w.is_active).length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 w-5 text-xs flex items-center justify-center">
                    {webhooks.webhooks.filter(w => w.is_active).length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="testing" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Testing
              </TabsTrigger>
              <TabsTrigger value="guide" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Guide
              </TabsTrigger>
            </TabsList>

            <div className="mt-6 h-[calc(100%-3rem)] overflow-y-auto">
              <TabsContent value="api-keys" className="space-y-6">
                <ZapierApiKeySection />
              </TabsContent>

              <TabsContent value="webhooks" className="space-y-6">
                <ZapierWebhookSection />
              </TabsContent>

              <TabsContent value="testing" className="space-y-6">
                <ZapierConnectionTest />
              </TabsContent>

              <TabsContent value="guide" className="space-y-6">
                <ZapierIntegrationGuide />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}