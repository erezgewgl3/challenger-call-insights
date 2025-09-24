import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { X, Key, Webhook, Activity, BookOpen } from 'lucide-react';
import { useZapierIntegration } from '@/hooks/useZapier';
import { useZapierStatus } from '@/hooks/useZapierStatus';
import { ZapierApiKeySection } from './zapier/ZapierApiKeySection';
import { ZapierWebhookSection } from './zapier/ZapierWebhookSection';
import { ZapierConnectionTest } from './zapier/ZapierConnectionTest';
import { ZapierIntegrationGuide } from './zapier/ZapierIntegrationGuide';

interface ZapierManagementPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ZapierManagementPanel({ isOpen, onClose }: ZapierManagementPanelProps) {
  const { isSetupComplete, apiKeys, webhooks } = useZapierIntegration();
  const { getStatus, runBackgroundTest } = useZapierStatus();
  const [activeTab, setActiveTab] = useState('api-keys');

  // Run background test when panel opens
  useEffect(() => {
    if (isOpen) {
      runBackgroundTest();
    }
  }, [isOpen, runBackgroundTest]);

  const status = getStatus();

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