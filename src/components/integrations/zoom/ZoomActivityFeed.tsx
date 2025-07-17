import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Video, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Calendar,
  Download,
  Mic
} from 'lucide-react';

interface ZoomActivityItem {
  id: string;
  type: 'meeting_started' | 'meeting_ended' | 'recording_completed' | 'transcript_completed' | 'analysis_completed';
  meetingId: string;
  meetingTitle: string;
  timestamp: Date;
  status: 'success' | 'error' | 'pending';
  details?: any;
  error?: string;
}

interface ZoomActivityFeedProps {
  connectionId: string;
  limit?: number;
}

export const ZoomActivityFeed: React.FC<ZoomActivityFeedProps> = ({
  connectionId,
  limit = 20
}) => {
  const { toast } = useToast();
  const [activities, setActivities] = useState<ZoomActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadActivities = async () => {
    try {
      setIsLoading(true);
      
      // Get webhook logs for this connection
      const { data, error } = await supabase.rpc('integration_framework_get_webhook_logs', {
        connection_id: connectionId,
        limit_count: limit
      });

      if (error) throw error;

      if (data && typeof data === 'object' && 'data' in data) {
        const logData = data.data as any[];
        const formattedActivities: ZoomActivityItem[] = logData.map((log: any) => ({
          id: log.id,
          type: log.webhook_event,
          meetingId: log.payload?.object?.uuid || 'unknown',
          meetingTitle: log.payload?.object?.topic || 'Untitled Meeting',
          timestamp: new Date(log.created_at),
          status: log.processing_status === 'completed' ? 'success' : 
                  log.processing_status === 'failed' ? 'error' : 'pending',
          details: log.payload,
          error: log.error_message
        }));

        setActivities(formattedActivities);
      }
    } catch (error) {
      console.error('Error loading Zoom activities:', error);
      toast({
        title: "Error",
        description: "Failed to load activity feed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const refreshActivities = async () => {
    setIsRefreshing(true);
    await loadActivities();
    setIsRefreshing(false);
  };

  useEffect(() => {
    loadActivities();
  }, [connectionId]);

  const getActivityIcon = (type: string, status: string) => {
    const iconProps = { className: "h-4 w-4" };
    
    switch (type) {
      case 'meeting_started':
        return <Video {...iconProps} className="h-4 w-4 text-blue-500" />;
      case 'meeting_ended':
        return <Clock {...iconProps} className="h-4 w-4 text-orange-500" />;
      case 'recording_completed':
        return <Mic {...iconProps} className="h-4 w-4 text-purple-500" />;
      case 'transcript_completed':
        return <FileText {...iconProps} className="h-4 w-4 text-green-500" />;
      case 'analysis_completed':
        return status === 'success' 
          ? <CheckCircle {...iconProps} className="h-4 w-4 text-green-500" />
          : <XCircle {...iconProps} className="h-4 w-4 text-red-500" />;
      default:
        return <Calendar {...iconProps} className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActivityTitle = (type: string) => {
    switch (type) {
      case 'meeting_started':
        return 'Meeting Started';
      case 'meeting_ended':
        return 'Meeting Ended';
      case 'recording_completed':
        return 'Recording Available';
      case 'transcript_completed':
        return 'Transcript Ready';
      case 'analysis_completed':
        return 'Analysis Complete';
      default:
        return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-100 text-green-700">Success</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Zoom Activity Feed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading activities...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Zoom Activity Feed
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshActivities}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No recent activity found</p>
            <p className="text-sm">Meeting events and transcript processing will appear here</p>
          </div>
        ) : (
          <ScrollArea className="h-96">
            <div className="space-y-4">
              {activities.map((activity, index) => (
                <div key={activity.id}>
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {getActivityIcon(activity.type, activity.status)}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">
                          {getActivityTitle(activity.type)}
                        </h4>
                        {getStatusBadge(activity.status)}
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        {activity.meetingTitle}
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Meeting ID: {activity.meetingId}</span>
                        <span>{activity.timestamp.toLocaleString()}</span>
                      </div>
                      
                      {activity.error && (
                        <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                          {activity.error}
                        </div>
                      )}
                    </div>
                  </div>
                  {index < activities.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};