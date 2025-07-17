import React from 'react';
import { IntegrationConnection } from '@/lib/integrations/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Video, 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  Activity
} from 'lucide-react';

interface ZoomConnectionStatusProps {
  connection: IntegrationConnection;
  recentActivity?: {
    totalMeetings: number;
    processedTranscripts: number;
    errorCount: number;
    lastActivity: Date;
  };
}

export const ZoomConnectionStatus: React.FC<ZoomConnectionStatusProps> = ({
  connection,
  recentActivity
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'error':
        return 'destructive';
      case 'pending':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const successRate = recentActivity 
    ? ((recentActivity.processedTranscripts / (recentActivity.totalMeetings || 1)) * 100)
    : 0;

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Video className="h-5 w-5 text-blue-500" />
            Zoom Connection Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon(connection.connectionStatus)}
              <span className="font-medium">{connection.connectionName}</span>
            </div>
            <Badge variant={getStatusColor(connection.connectionStatus)}>
              {connection.connectionStatus}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Connected</p>
              <p className="font-medium">
                {new Date(connection.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Last Sync</p>
              <p className="font-medium">
                {connection.lastSyncAt 
                  ? new Date(connection.lastSyncAt).toLocaleDateString()
                  : 'Never'
                }
              </p>
            </div>
          </div>

          {connection.lastError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium text-red-700">Last Error</span>
              </div>
              <p className="text-sm text-red-600 mt-1">{connection.lastError}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity Overview */}
      {recentActivity && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="h-5 w-5 text-green-500" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-muted-foreground">Total Meetings</span>
                </div>
                <p className="text-2xl font-bold">{recentActivity.totalMeetings}</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-muted-foreground">Processed</span>
                </div>
                <p className="text-2xl font-bold">{recentActivity.processedTranscripts}</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Success Rate</span>
                <span>{Math.round(successRate)}%</span>
              </div>
              <Progress value={successRate} className="h-2" />
            </div>

            {recentActivity.errorCount > 0 && (
              <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm text-yellow-700">
                  {recentActivity.errorCount} error(s) in recent activity
                </span>
              </div>
            )}

            <div className="text-sm text-muted-foreground">
              Last activity: {new Date(recentActivity.lastActivity).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};