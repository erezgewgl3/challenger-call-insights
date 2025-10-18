
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
import { PersonalZoomSetup } from './PersonalZoomSetup';

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
      } else {
        console.warn('Unexpected RPC response shape or no connection data:', data);
        setConnection(null);
      }
    } catch (error) {
      console.error('Error loading connection details:', error);
      setConnection(null);
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      // Call the integration-connect Edge Function - it will handle system config validation internally
      const { data, error } = await supabase.functions.invoke('integration-connect', {
        body: {
          integration_id: 'zoom'
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
    <div className="h-full flex flex-col">
      {isConnected && connection ? (
        <Card className="flex-1 flex flex-col transition-all duration-200 hover:shadow-md">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Video className="h-8 w-8 text-blue-500" />
                  <div 
                    className={`absolute -top-1 -right-1 h-3 w-3 rounded-full ${
                      connection.connection_status === 'active' ? 'bg-green-500' : 'bg-yellow-500'
                    }`}
                    title={connection.connection_status}
                  />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold">
                    Zoom Integration
                  </CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">
                    Automatically analyze meeting transcripts
                  </CardDescription>
                </div>
              </div>
              <Badge variant={connection.connection_status === 'active' ? 'default' : 'secondary'} className="capitalize">
                {connection.connection_status}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col space-y-6 pt-0">
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
        <PersonalZoomSetup 
          onConnect={handleConnect}
          isConnecting={isConnecting}
        />
      )}
    </div>
  );
};
