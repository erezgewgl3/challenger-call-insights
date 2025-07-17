import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Video, Zap, Settings, Globe, Clock, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface IntegrationConfig {
  id: string;
  integration_type: string;
  config_key: string;
  config_value: any;
  is_encrypted: boolean;
}

const INTEGRATION_TYPES = [
  { id: 'zoom', name: 'Zoom', icon: Video, description: 'Connect to Zoom for meeting transcripts' },
  { id: 'zapier', name: 'Zapier', icon: Zap, description: 'Automate workflows with Zapier' },
  { id: 'salesforce', name: 'Salesforce', icon: Globe, description: 'Sync with Salesforce CRM' },
];

export function IntegrationSettings() {
  const { user } = useAuth();
  const [configs, setConfigs] = useState<IntegrationConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeIntegration, setActiveIntegration] = useState('zoom');
  const [pendingUpdates, setPendingUpdates] = useState<Set<string>>(new Set());
  const [localValues, setLocalValues] = useState<Record<string, any>>({});

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      const { data, error } = await supabase
        .from('integration_configs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setConfigs(data || []);
    } catch (error) {
      console.error('Error loading integration configs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateConfig = useCallback(async (integrationType: string, configKey: string, value: any) => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "User not authenticated.",
        variant: "destructive",
      });
      return;
    }

    const updateKey = `${integrationType}-${configKey}`;
    setPendingUpdates(prev => new Set([...prev, updateKey]));

    try {
      const { data, error } = await supabase.rpc('integration_framework_update_config', {
        user_uuid: user.id,
        integration_type_param: integrationType,
        config_key_param: configKey,
        config_value: value
      });

      if (error) throw error;
      
      if (data && typeof data === 'object' && 'status' in data && data.status === 'success') {
        toast({
          title: "Configuration Updated",
          description: `${configKey} has been saved successfully.`,
        });
        await loadConfigs();
      } else {
        const errorMsg = data && typeof data === 'object' && 'error' in data ? String(data.error) : 'Unknown error';
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error('Error updating config:', error);
      toast({
        title: "Error",
        description: "Failed to update configuration. Please try again.",
        variant: "destructive",
      });
    } finally {
      setPendingUpdates(prev => {
        const updated = new Set(prev);
        updated.delete(updateKey);
        return updated;
      });
    }
  }, [user?.id, toast]);

  const getConfigValue = (integrationType: string, configKey: string, defaultValue: any = '') => {
    const config = configs.find(c => c.integration_type === integrationType && c.config_key === configKey);
    return config ? config.config_value : defaultValue;
  };

  const renderIntegrationSettings = (integrationType: string) => {
    const integration = INTEGRATION_TYPES.find(i => i.id === integrationType);
    if (!integration) return null;

    const Icon = integration.icon;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Icon className="h-5 w-5" />
            <span>{integration.name} Configuration</span>
          </CardTitle>
          <CardDescription>
            Configure {integration.name} integration settings and authentication
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Common Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`${integrationType}-enabled`}>Enable Integration</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id={`${integrationType}-enabled`}
                  checked={getConfigValue(integrationType, 'enabled', false)}
                  onCheckedChange={(checked) => updateConfig(integrationType, 'enabled', checked)}
                  disabled={pendingUpdates.has(`${integrationType}-enabled`)}
                />
                <span className="text-sm text-gray-600">
                  {getConfigValue(integrationType, 'enabled', false) ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${integrationType}-auto-sync`}>Auto-sync</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id={`${integrationType}-auto-sync`}
                  checked={getConfigValue(integrationType, 'auto_sync', false)}
                  onCheckedChange={(checked) => updateConfig(integrationType, 'auto_sync', checked)}
                  disabled={pendingUpdates.has(`${integrationType}-auto_sync`)}
                />
                <span className="text-sm text-gray-600">
                  {getConfigValue(integrationType, 'auto_sync', false) ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          </div>

          {/* Integration-specific Settings */}
          {integrationType === 'zoom' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="zoom-client-id">Zoom Client ID</Label>
                <Input
                  id="zoom-client-id"
                  value={getConfigValue('zoom', 'client_id', '')}
                  onChange={(e) => setLocalValues(prev => ({ ...prev, 'zoom-client_id': e.target.value }))}
                  onBlur={(e) => updateConfig('zoom', 'client_id', e.target.value)}
                  placeholder="Enter Zoom OAuth Client ID"
                  disabled={pendingUpdates.has('zoom-client_id')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zoom-client-secret">Client Secret</Label>
                <Input
                  id="zoom-client-secret"
                  type="password"
                  value={getConfigValue('zoom', 'client_secret', '')}
                  onChange={(e) => setLocalValues(prev => ({ ...prev, 'zoom-client_secret': e.target.value }))}
                  onBlur={(e) => updateConfig('zoom', 'client_secret', e.target.value)}
                  placeholder="Enter Zoom OAuth Client Secret"
                  disabled={pendingUpdates.has('zoom-client_secret')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zoom-webhook-secret">Webhook Secret</Label>
                <Input
                  id="zoom-webhook-secret"
                  type="password"
                  value={getConfigValue('zoom', 'webhook_secret', '')}
                  onChange={(e) => setLocalValues(prev => ({ ...prev, 'zoom-webhook_secret': e.target.value }))}
                  onBlur={(e) => updateConfig('zoom', 'webhook_secret', e.target.value)}
                  placeholder="Enter Zoom webhook secret"
                  disabled={pendingUpdates.has('zoom-webhook_secret')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zoom-scopes">Required Scopes</Label>
                <Input
                  id="zoom-scopes"
                  value={getConfigValue('zoom', 'scopes', 'recording:read,user:read')}
                  onChange={(e) => setLocalValues(prev => ({ ...prev, 'zoom-scopes': e.target.value }))}
                  onBlur={(e) => updateConfig('zoom', 'scopes', e.target.value)}
                  placeholder="recording:read,user:read"
                  disabled={pendingUpdates.has('zoom-scopes')}
                />
              </div>
            </div>
          )}

          {integrationType === 'zapier' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="zapier-webhook-url">Webhook URL</Label>
                <Input
                  id="zapier-webhook-url"
                  value={getConfigValue('zapier', 'webhook_url', '')}
                  onChange={(e) => updateConfig('zapier', 'webhook_url', e.target.value)}
                  placeholder="https://hooks.zapier.com/hooks/catch/..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zapier-api-key">API Key</Label>
                <Input
                  id="zapier-api-key"
                  type="password"
                  value={getConfigValue('zapier', 'api_key', '')}
                  onChange={(e) => updateConfig('zapier', 'api_key', e.target.value)}
                  placeholder="Enter Zapier API key"
                />
              </div>
            </div>
          )}

          {integrationType === 'salesforce' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="salesforce-client-id">Salesforce Client ID</Label>
                <Input
                  id="salesforce-client-id"
                  value={getConfigValue('salesforce', 'client_id', '')}
                  onChange={(e) => updateConfig('salesforce', 'client_id', e.target.value)}
                  placeholder="Enter Salesforce Connected App Client ID"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salesforce-instance-url">Instance URL</Label>
                <Input
                  id="salesforce-instance-url"
                  value={getConfigValue('salesforce', 'instance_url', '')}
                  onChange={(e) => updateConfig('salesforce', 'instance_url', e.target.value)}
                  placeholder="https://your-instance.salesforce.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salesforce-scopes">Required Scopes</Label>
                <Input
                  id="salesforce-scopes"
                  value={getConfigValue('salesforce', 'scopes', 'api,refresh_token')}
                  onChange={(e) => updateConfig('salesforce', 'scopes', e.target.value)}
                  placeholder="api,refresh_token"
                />
              </div>
            </div>
          )}

          {/* Sync Settings */}
          <div className="border-t pt-4">
            <h3 className="font-medium mb-4 flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>Sync Settings</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`${integrationType}-sync-frequency`}>Sync Frequency</Label>
                <Select
                  value={getConfigValue(integrationType, 'sync_frequency', '60')}
                  onValueChange={(value) => updateConfig(integrationType, 'sync_frequency', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">Every 15 minutes</SelectItem>
                    <SelectItem value="30">Every 30 minutes</SelectItem>
                    <SelectItem value="60">Every hour</SelectItem>
                    <SelectItem value="360">Every 6 hours</SelectItem>
                    <SelectItem value="1440">Daily</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor={`${integrationType}-retry-attempts`}>Retry Attempts</Label>
                <Select
                  value={getConfigValue(integrationType, 'retry_attempts', '3')}
                  onValueChange={(value) => updateConfig(integrationType, 'retry_attempts', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select retry attempts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 attempt</SelectItem>
                    <SelectItem value="3">3 attempts</SelectItem>
                    <SelectItem value="5">5 attempts</SelectItem>
                    <SelectItem value="10">10 attempts</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Integration Settings</h2>
        <p className="text-gray-600">Configure integration settings and authentication</p>
      </div>

      <Tabs value={activeIntegration} onValueChange={setActiveIntegration} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          {INTEGRATION_TYPES.map((integration) => {
            const Icon = integration.icon;
            return (
              <TabsTrigger key={integration.id} value={integration.id} className="flex items-center space-x-2">
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{integration.name}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {INTEGRATION_TYPES.map((integration) => (
          <TabsContent key={integration.id} value={integration.id}>
            {renderIntegrationSettings(integration.id)}
          </TabsContent>
        ))}
      </Tabs>

      {/* Global Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Global Settings</span>
          </CardTitle>
          <CardDescription>
            System-wide integration settings and security preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="global-timeout">Default Timeout (seconds)</Label>
                <Input
                  id="global-timeout"
                  type="number"
                  value={getConfigValue('global', 'timeout', '30')}
                  onChange={(e) => setLocalValues(prev => ({ ...prev, 'global-timeout': e.target.value }))}
                  onBlur={(e) => updateConfig('global', 'timeout', e.target.value)}
                  placeholder="30"
                  disabled={pendingUpdates.has('global-timeout')}
                />
            </div>
            <div className="space-y-2">
              <Label htmlFor="global-max-retries">Max Retries</Label>
              <Input
                id="global-max-retries"
                type="number"
                value={getConfigValue('global', 'max_retries', '3')}
                onChange={(e) => updateConfig('global', 'max_retries', e.target.value)}
                placeholder="3"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="global-logging"
              checked={getConfigValue('global', 'enable_logging', true)}
              onCheckedChange={(checked) => updateConfig('global', 'enable_logging', checked)}
              disabled={pendingUpdates.has('global-enable_logging')}
            />
            <Label htmlFor="global-logging">Enable Integration Logging</Label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}