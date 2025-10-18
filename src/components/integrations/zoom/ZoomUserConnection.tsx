
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Video, CheckCircle, AlertCircle, Settings, Unlink, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useZoomConnection, invalidateZoomConnection } from '@/hooks/useZoomConnection';
import { PersonalZoomSetup } from './PersonalZoomSetup';
import { useQueryClient } from '@tanstack/react-query';

// Helper functions for deep object access
const deepGet = (obj: any, path: string): any => {
  return path.split('.').reduce((current, key) => current?.[key], obj);
};

const deepSet = (obj: any, path: string, value: any): void => {
  const keys = path.split('.');
  const lastKey = keys.pop()!;
  const target = keys.reduce((current, key) => {
    if (!current[key]) current[key] = {};
    return current[key];
  }, obj);
  target[lastKey] = value;
};

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
  configuration?: {
    auto_process?: boolean;
    notifications?: boolean;
    auto_transcript_processing?: boolean;
    notification_preferences?: {
      email?: boolean;
    };
    meeting_types?: string[];
    user_info?: any;
  };
  last_sync_at?: string;
  created_at: string;
}

export const ZoomUserConnection: React.FC<ZoomUserConnectionProps> = ({ onConnectionChange }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isConnected, isLoading, error, connection: hookConnection, refetch: refetchConnection } = useZoomConnection();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [optimisticDisconnected, setOptimisticDisconnected] = useState(false);
  const [optimisticConfig, setOptimisticConfig] = useState<Record<string, any>>({});

  // Use connection data from hook
  const connection = hookConnection;

  // Notify parent of connection changes
  React.useEffect(() => {
    onConnectionChange?.(isConnected);
  }, [isConnected, onConnectionChange]);

  // Reset optimistic flag when server confirms disconnected state
  React.useEffect(() => {
    if (!isConnected && optimisticDisconnected) {
      setOptimisticDisconnected(false);
    }
  }, [isConnected, optimisticDisconnected]);


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
      const message = error instanceof Error ? error.message : 'Failed to initiate Zoom connection';
      setErrorMessage(message);
      toast({
        title: "Connection Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!connection) {
      console.warn('[ZoomUserConnection] Cannot disconnect - no connection object');
      return;
    }

    if (!connection.id) {
      console.error('[ZoomUserConnection] Cannot disconnect - connection missing ID');
      setErrorMessage('Invalid connection data - cannot disconnect');
      return;
    }

    setIsDisconnecting(true);
    try {
      console.log('[ZoomUserConnection] Disconnecting connection:', connection.id);
      
      const payload = { connection_id: connection.id };
      console.log('[ZoomUserConnection] Disconnect payload:', payload);

      const { data, error } = await supabase.functions.invoke('integration-disconnect', {
        body: payload
      });

      console.log('[ZoomUserConnection] Disconnect response:', { data, error });

      if (error) throw error;

      // Optimistic UI update
      setOptimisticDisconnected(true);
      
      // Force immediate cache refresh
      invalidateZoomConnection(queryClient, user?.id);
      await refetchConnection();
      
      // Notify parent
      onConnectionChange?.(false);
      
      toast({
        title: "Disconnected",
        description: "Your Zoom account has been disconnected successfully.",
      });
      
      console.log('Zoom disconnected, cache invalidated and refetched');
    } catch (error) {
      console.error('[ZoomUserConnection] Error disconnecting from Zoom:', error);
      const message = error instanceof Error ? error.message : 'Failed to disconnect from Zoom';
      setErrorMessage(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsDisconnecting(false);
    }
  };

  const updateUserSetting = async (settingType: 'notifications' | 'auto_process', value: boolean) => {
    if (!connection?.id || !user) return;

    try {
      // Create updated configuration with both nested and legacy keys
      const newConfig = { ...connection.configuration };
      
      if (settingType === 'notifications') {
        // Update both nested and legacy keys
        deepSet(newConfig, 'notification_preferences.email', value);
        newConfig.notifications = value; // Legacy key for backward compatibility
      } else {
        deepSet(newConfig, 'auto_transcript_processing', value);
        newConfig.auto_process = value; // Legacy key for backward compatibility
      }

      // Set optimistic state for immediate UI feedback
      const optimisticUpdate: Record<string, any> = {};
      if (settingType === 'notifications') {
        deepSet(optimisticUpdate, 'notification_preferences.email', value);
        optimisticUpdate.notifications = value;
      } else {
        deepSet(optimisticUpdate, 'auto_transcript_processing', value);
        optimisticUpdate.auto_process = value;
      }
      setOptimisticConfig(optimisticUpdate);

      const { error } = await supabase.rpc('integration_framework_update_connection', {
        connection_id: connection.id,
        updates: {
          configuration: newConfig
        }
      });

      if (error) throw error;

      // Force immediate cache refresh to update UI
      invalidateZoomConnection(queryClient, user?.id);
      await refetchConnection();
      
      // Clear optimistic state after successful update
      setOptimisticConfig({});
      
      toast({
        title: "Setting Updated",
        description: `Your preference has been saved.`,
      });
    } catch (error) {
      console.error('Error updating setting:', error);
      // Revert optimistic state on error
      setOptimisticConfig({});
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

  // Merge actual config with optimistic updates
  const baseConfig = connection?.configuration || {};
  const effectiveConfig: any = { 
    ...baseConfig, 
    ...optimisticConfig,
    notification_preferences: {
      ...(baseConfig as any)?.notification_preferences || {},
      ...(optimisticConfig as any)?.notification_preferences || {}
    }
  };
  
  // Normalize reading values - check both nested and legacy keys
  const emailNotifications = deepGet(effectiveConfig, 'notification_preferences.email') ?? effectiveConfig.notifications ?? false;
  const autoProcess = deepGet(effectiveConfig, 'auto_transcript_processing') ?? effectiveConfig.auto_process ?? true;
  
  // Safe config access for display purposes
  const safeConfig = connection?.configuration ?? {};

  return (
    <div className="h-full flex flex-col space-y-4">
      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{errorMessage}</span>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setErrorMessage(null)}
            >
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      {(isConnected && !optimisticDisconnected) ? (
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
                <span className="font-medium">{safeConfig.user_info?.email || connection.connection_name || 'Connected'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Connected:</span>
                <span className="font-medium">
                  {connection.created_at && !isNaN(new Date(connection.created_at).getTime())
                    ? new Date(connection.created_at).toLocaleDateString()
                    : 'Unknown'}
                </span>
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
                    checked={autoProcess}
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
                    checked={emailNotifications}
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
