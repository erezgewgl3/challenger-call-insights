
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Video, CheckCircle, AlertCircle, Settings, Unlink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useZoomConnection } from '@/hooks/useZoomConnection';

interface ZoomUserConnectionProps {
  onConnectionChange?: (connected: boolean) => void;
}

interface ZoomConnection {
  id: string;
  connection_name: string;
  connection_status: 'active' | 'inactive' | 'error';
  credentials: {
    access_token?: string;
    email?: string;
    account_id?: string;
  };
  configuration: {
    auto_process?: boolean;
    notifications?: boolean;
    meeting_types?: string[];
    user_info?: any;
  };
  last_sync_at?: string;
  created_at: string;
}

export const ZoomUserConnection: React.FC<ZoomUserConnectionProps> = ({ onConnectionChange }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isConnected, isLoading, error } = useZoomConnection();
  const [connection, setConnection] = useState<ZoomConnection | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  // Load detailed connection data when connected
  React.useEffect(() => {
    if (isConnected && user?.id) {
      loadConnectionDetails();
      onConnectionChange?.(true);
    } else {
      setConnection(null);
      onConnectionChange?.(false);
    }
  }, [isConnected, user?.id, onConnectionChange]);

  const loadConnectionDetails = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase.rpc('integration_framework_get_connection', {
        user_uuid: user.id,
        integration_type_param: 'zoom'
      });

      if (error) throw error;

      if (data && typeof data === 'object' && 'status' in data && data.status === 'success' && 'data' in data && data.data) {
        setConnection(data.data as unknown as ZoomConnection);
      }
    } catch (error) {
      console.error('Error loading connection details:', error);
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      // First check if Zoom integration is enabled by admin
      const { data: systemConfig } = await supabase
        .from('system_integration_configs')
        .select('config_value')
        .eq('integration_type', 'zoom')
        .eq('config_key', 'system_config')
        .single();

      if (!systemConfig?.config_value || (typeof systemConfig.config_value === 'object' && 'enabled' in systemConfig.config_value && !systemConfig.config_value.enabled)) {
        toast({
          title: "Integration Disabled",
          description: "Zoom integration is not enabled by the administrator.",
          variant: "destructive",
        });
        return;
      }

      // Call the integration-connect Edge Function with integration_id in body
      const { data, error } = await supabase.functions.invoke('integration-connect', {
        body: {
          integration_id: 'zoom',
          configuration: systemConfig.config_value
        }
      });

      if (error) throw error;

      if (data?.auth_url) {
        // Redirect to Zoom OAuth
        window.location.href = data.auth_url;
      } else {
        throw new Error('No authorization URL received');
      }
    } catch (error) {
      console.error('Error connecting to Zoom:', error);
      toast({
        title: "Connection Error",
        description: "Failed to initiate Zoom connection. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!connection) return;

    setIsDisconnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke('integration-disconnect', {
        body: {
          connection_id: connection.id
        }
      });

      if (error) throw error;

      setConnection(null);
      onConnectionChange?.(false);
      
      toast({
        title: "Disconnected",
        description: "Your Zoom account has been disconnected successfully.",
      });
    } catch (error) {
      console.error('Error disconnecting from Zoom:', error);
      toast({
        title: "Error",
        description: "Failed to disconnect from Zoom. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDisconnecting(false);
    }
  };

  const updateUserSetting = async (setting: string, value: any) => {
    if (!connection) return;

    try {
      const newConfig = { ...connection.configuration, [setting]: value };
      
      const { error } = await supabase.rpc('integration_framework_update_connection', {
        connection_id: connection.id,
        updates: {
          configuration: newConfig
        }
      });

      if (error) throw error;

      setConnection(prev => prev ? { ...prev, configuration: newConfig } : null);
      
      toast({
        title: "Setting Updated",
        description: "Your Zoom preferences have been saved.",
      });
    } catch (error) {
      console.error('Error updating Zoom setting:', error);
      toast({
        title: "Error",
        description: "Failed to update setting. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Video className="h-5 w-5 text-blue-500" />
        <h3 className="text-lg font-semibold">Your Zoom Connection</h3>
      </div>

      {isConnected && connection ? (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Connected to Zoom
                </CardTitle>
                <CardDescription>
                  Your Zoom account is connected and ready to analyze meeting transcripts
                </CardDescription>
              </div>
              <Badge variant={connection.connection_status === 'active' ? 'default' : 'secondary'}>
                {connection.connection_status}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Connection Details */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Account:</span>
                <span className="font-medium">{connection.configuration.user_info?.email || connection.connection_name || 'Connected'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Connected:</span>
                <span>{new Date(connection.created_at).toLocaleDateString()}</span>
              </div>
              {connection.last_sync_at && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Last Activity:</span>
                  <span>{new Date(connection.last_sync_at).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            <Separator />

            {/* User Settings */}
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Personal Settings
              </h4>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-process" className="flex flex-col gap-1">
                    <span>Auto-process meeting transcripts</span>
                    <span className="text-sm text-muted-foreground font-normal">
                      Automatically analyze transcripts when meetings end
                    </span>
                  </Label>
                  <Switch
                    id="auto-process"
                    checked={connection.configuration.auto_process ?? true}
                    onCheckedChange={(checked) => updateUserSetting('auto_process', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="notifications" className="flex flex-col gap-1">
                    <span>Email notifications</span>
                    <span className="text-sm text-muted-foreground font-normal">
                      Get notified when transcript analysis is complete
                    </span>
                  </Label>
                  <Switch
                    id="notifications"
                    checked={connection.configuration.notifications ?? false}
                    onCheckedChange={(checked) => updateUserSetting('notifications', checked)}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Disconnect Button */}
            <div className="flex justify-end">
              <Button
                variant="destructive"
                onClick={handleDisconnect}
                disabled={isDisconnecting}
              >
                {isDisconnecting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Unlink className="h-4 w-4 mr-2" />
                )}
                Disconnect Zoom
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5 text-blue-600" />
              Connect Your Zoom Account
            </CardTitle>
            <CardDescription>
              Connect your personal Zoom account to automatically analyze meeting transcripts
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">What you'll get:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Automatic transcript processing after meetings</li>
                <li>• AI-powered meeting insights and analysis</li>
                <li>• Sales coaching recommendations</li>
                <li>• Follow-up suggestions and action items</li>
              </ul>
            </div>

            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-700">
                <strong>Privacy:</strong> Only you can access your meeting data. 
                Your transcripts are processed securely and remain private to your account.
              </p>
            </div>

            <Button
              onClick={handleConnect}
              disabled={isConnecting}
              className="w-full"
            >
              {isConnecting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Video className="h-4 w-4 mr-2" />
              )}
              Connect to Zoom
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
