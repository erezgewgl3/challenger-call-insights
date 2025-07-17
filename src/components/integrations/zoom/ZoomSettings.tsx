import React, { useState, useEffect } from 'react';
import { IntegrationConnection } from '@/lib/integrations/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Video, Mic, FileText, Clock, Bell } from 'lucide-react';

interface ZoomSettingsProps {
  connection: IntegrationConnection;
  onSettingsUpdate?: (settings: any) => void;
}

export const ZoomSettings: React.FC<ZoomSettingsProps> = ({
  connection,
  onSettingsUpdate
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    auto_transcript_processing: true,
    meeting_types: 'all',
    notification_preferences: {
      email: true,
      in_app: true
    },
    analysis_settings: {
      real_time: false,
      include_recordings: true,
      min_duration_minutes: 5
    },
    webhook_events: {
      recording_completed: true,
      meeting_ended: false,
      transcript_completed: true
    }
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (connection?.configuration) {
      setSettings({
        ...settings,
        ...connection.configuration
      });
    }
  }, [connection]);

  const updateSetting = async (key: string, value: any) => {
    if (!user) return;

    setIsLoading(true);
    try {
      const newSettings = { ...settings };
      const keys = key.split('.');
      let current = newSettings;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;

      const { data, error } = await supabase.rpc('integration_framework_update_connection', {
        connection_id: connection.id,
        updates: {
          configuration: newSettings
        }
      });

      if (error) throw error;

      setSettings(newSettings);
      onSettingsUpdate?.(newSettings);
      
      toast({
        title: "Settings updated",
        description: "Zoom integration settings have been saved successfully.",
      });
    } catch (error) {
      console.error('Error updating Zoom settings:', error);
      toast({
        title: "Error",
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Video className="h-5 w-5 text-blue-500" />
        <h3 className="text-lg font-semibold">Zoom Integration Settings</h3>
      </div>

      {/* Auto Processing Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Transcript Processing
          </CardTitle>
          <CardDescription>
            Configure how meeting transcripts are automatically processed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="auto-processing" className="flex flex-col gap-1">
              <span>Auto-process transcripts</span>
              <span className="text-sm text-muted-foreground">
                Automatically analyze transcripts when meetings end
              </span>
            </Label>
            <Switch
              id="auto-processing"
              checked={settings.auto_transcript_processing}
              onCheckedChange={(checked) => updateSetting('auto_transcript_processing', checked)}
              disabled={isLoading}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Meeting types to analyze</Label>
            <Select
              value={settings.meeting_types}
              onValueChange={(value) => updateSetting('meeting_types', value)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All meetings</SelectItem>
                <SelectItem value="scheduled">Scheduled meetings only</SelectItem>
                <SelectItem value="instant">Instant meetings only</SelectItem>
                <SelectItem value="webinar">Webinars only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Minimum meeting duration (minutes)</Label>
            <Select
              value={settings.analysis_settings.min_duration_minutes.toString()}
              onValueChange={(value) => updateSetting('analysis_settings.min_duration_minutes', parseInt(value))}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 minute</SelectItem>
                <SelectItem value="5">5 minutes</SelectItem>
                <SelectItem value="10">10 minutes</SelectItem>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </CardTitle>
          <CardDescription>
            Choose how you want to be notified about transcript analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="email-notifications">Email notifications</Label>
            <Switch
              id="email-notifications"
              checked={settings.notification_preferences.email}
              onCheckedChange={(checked) => updateSetting('notification_preferences.email', checked)}
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="app-notifications">In-app notifications</Label>
            <Switch
              id="app-notifications"
              checked={settings.notification_preferences.in_app}
              onCheckedChange={(checked) => updateSetting('notification_preferences.in_app', checked)}
              disabled={isLoading}
            />
          </div>
        </CardContent>
      </Card>

      {/* Webhook Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Webhook Events
          </CardTitle>
          <CardDescription>
            Configure which Zoom events trigger automatic processing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="recording-completed">Recording completed</Label>
            <Switch
              id="recording-completed"
              checked={settings.webhook_events.recording_completed}
              onCheckedChange={(checked) => updateSetting('webhook_events.recording_completed', checked)}
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="transcript-completed">Transcript completed</Label>
            <Switch
              id="transcript-completed"
              checked={settings.webhook_events.transcript_completed}
              onCheckedChange={(checked) => updateSetting('webhook_events.transcript_completed', checked)}
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="meeting-ended">Meeting ended</Label>
            <Switch
              id="meeting-ended"
              checked={settings.webhook_events.meeting_ended}
              onCheckedChange={(checked) => updateSetting('webhook_events.meeting_ended', checked)}
              disabled={isLoading}
            />
          </div>
        </CardContent>
      </Card>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle>Connection Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">Connection: {connection.connectionName}</p>
              <p className="text-sm text-muted-foreground">
                Status: <Badge variant={connection.connectionStatus === 'active' ? 'default' : 'secondary'}>
                  {connection.connectionStatus}
                </Badge>
              </p>
              {connection.lastSyncAt && (
                <p className="text-sm text-muted-foreground">
                  Last sync: {new Date(connection.lastSyncAt).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};