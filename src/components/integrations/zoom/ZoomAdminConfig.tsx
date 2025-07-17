import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Video, Save, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface ZoomAdminConfigProps {
  onConfigUpdate?: (config: any) => void;
}

export const ZoomAdminConfig: React.FC<ZoomAdminConfigProps> = ({ onConfigUpdate }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [config, setConfig] = useState({
    client_id: '',
    client_secret: '',
    webhook_secret: '',
    enabled: false,
    scopes: 'recording:read,user:read'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSecrets, setShowSecrets] = useState({
    client_secret: false,
    webhook_secret: false
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('integration_configs')
        .select('*')
        .eq('integration_type', 'zoom')
        .eq('config_key', 'system_config');

      if (error) throw error;

      if (data && data.length > 0 && data[0].config_value && typeof data[0].config_value === 'object') {
        setConfig(prev => ({ ...prev, ...(data[0].config_value as any) }));
      }
    } catch (error) {
      console.error('Error loading Zoom admin config:', error);
      toast({
        title: "Error",
        description: "Failed to load Zoom configuration.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveConfig = async () => {
    if (!user?.id) return;

    setIsSaving(true);
    try {
      const { error } = await supabase.rpc('integration_framework_update_config', {
        user_uuid: user.id,
        integration_type_param: 'zoom',
        config_key_param: 'system_config',
        config_value: config
      });

      if (error) throw error;

      onConfigUpdate?.(config);
      toast({
        title: "Configuration Saved",
        description: "Zoom system configuration has been updated successfully.",
      });
    } catch (error) {
      console.error('Error saving Zoom admin config:', error);
      toast({
        title: "Error",
        description: "Failed to save configuration. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateConfigField = (field: string, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const toggleSecretVisibility = (field: string) => {
    setShowSecrets(prev => ({ ...prev, [field]: !prev[field] }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5 text-blue-500" />
          Zoom System Configuration
        </CardTitle>
        <CardDescription>
          Configure OAuth credentials for all users to connect their Zoom accounts.
          These settings are required before users can connect to Zoom.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/Disable Integration */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-1">
            <Label className="text-base font-medium">Enable Zoom Integration</Label>
            <p className="text-sm text-muted-foreground">
              Allow users to connect their Zoom accounts to the system
            </p>
          </div>
          <Switch
            checked={config.enabled}
            onCheckedChange={(checked) => updateConfigField('enabled', checked)}
          />
        </div>

        {/* OAuth Configuration */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="zoom-client-id">OAuth Client ID</Label>
            <Input
              id="zoom-client-id"
              type="text"
              placeholder="Enter Zoom OAuth Client ID"
              value={config.client_id}
              onChange={(e) => updateConfigField('client_id', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Get this from your Zoom Marketplace app's OAuth credentials
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="zoom-client-secret">OAuth Client Secret</Label>
            <div className="relative">
              <Input
                id="zoom-client-secret"
                type={showSecrets.client_secret ? "text" : "password"}
                placeholder="Enter Zoom OAuth Client Secret"
                value={config.client_secret}
                onChange={(e) => updateConfigField('client_secret', e.target.value)}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => toggleSecretVisibility('client_secret')}
              >
                {showSecrets.client_secret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="zoom-webhook-secret">Webhook Secret Token</Label>
            <div className="relative">
              <Input
                id="zoom-webhook-secret"
                type={showSecrets.webhook_secret ? "text" : "password"}
                placeholder="Enter Zoom webhook secret token"
                value={config.webhook_secret}
                onChange={(e) => updateConfigField('webhook_secret', e.target.value)}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => toggleSecretVisibility('webhook_secret')}
              >
                {showSecrets.webhook_secret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Used to verify webhook requests from Zoom
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="zoom-scopes">Required OAuth Scopes</Label>
            <Input
              id="zoom-scopes"
              type="text"
              placeholder="recording:read,user:read"
              value={config.scopes}
              onChange={(e) => updateConfigField('scopes', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Comma-separated list of OAuth scopes required for the integration
            </p>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t">
          <Button onClick={saveConfig} disabled={isSaving}>
            {isSaving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Configuration
          </Button>
        </div>

        {/* Configuration Status */}
        <div className="p-4 bg-muted rounded-lg">
          <h4 className="font-medium text-sm mb-2">Configuration Status</h4>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span>Integration Enabled:</span>
              <span className={config.enabled ? "text-green-600" : "text-red-600"}>
                {config.enabled ? "Yes" : "No"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Client ID Set:</span>
              <span className={config.client_id ? "text-green-600" : "text-red-600"}>
                {config.client_id ? "Yes" : "No"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Client Secret Set:</span>
              <span className={config.client_secret ? "text-green-600" : "text-red-600"}>
                {config.client_secret ? "Yes" : "No"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Ready for Users:</span>
              <span className={config.enabled && config.client_id && config.client_secret ? "text-green-600" : "text-red-600"}>
                {config.enabled && config.client_id && config.client_secret ? "Yes" : "No"}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};