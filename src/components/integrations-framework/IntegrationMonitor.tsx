import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, CheckCircle, Clock, TrendingUp, Activity, Zap } from "lucide-react";
import { IntegrationConnection, IntegrationSyncOperation, IntegrationWebhookLog, IntegrationMetrics } from "@/lib/integrations/types";

interface IntegrationMonitorProps {
  connection: IntegrationConnection;
  metrics?: IntegrationMetrics;
  syncOperations?: IntegrationSyncOperation[];
  webhookLogs?: IntegrationWebhookLog[];
  className?: string;
}

export function IntegrationMonitor({
  connection,
  metrics,
  syncOperations = [],
  webhookLogs = [],
  className
}: IntegrationMonitorProps) {
  const getOperationStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'running':
        return <Activity className="h-4 w-4 text-blue-600 animate-pulse" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'queued':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatDuration = (startTime?: Date, endTime?: Date) => {
    if (!startTime) return 'N/A';
    const end = endTime || new Date();
    const duration = end.getTime() - startTime.getTime();
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  return (
    <div className={`space-y-6 ${className || ""}`}>
      {/* Connection Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Connection Status
          </CardTitle>
          <CardDescription>
            Monitor the health and performance of your integration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {connection.connectionStatus}
              </div>
              <div className="text-sm text-muted-foreground">Status</div>
            </div>
            {metrics && (
              <>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {metrics.totalOperations}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Operations</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {Math.round(metrics.uptimePercentage)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Uptime</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.round(metrics.averageProcessingTime)}s
                  </div>
                  <div className="text-sm text-muted-foreground">Avg. Processing</div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Monitoring */}
      <Tabs defaultValue="operations" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="operations" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Sync Operations
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Webhook Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="operations">
          <Card>
            <CardHeader>
              <CardTitle>Recent Sync Operations</CardTitle>
              <CardDescription>
                Latest synchronization activities and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-80">
                <div className="space-y-4">
                  {syncOperations.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      No sync operations found
                    </div>
                  ) : (
                    syncOperations.map((operation) => (
                      <div 
                        key={operation.id} 
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          {getOperationStatusIcon(operation.operationStatus)}
                          <div>
                            <div className="font-medium capitalize">
                              {operation.operationType.replace('_', ' ')}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(operation.createdAt).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="text-right space-y-1">
                          <Badge 
                            variant={
                              operation.operationStatus === 'completed' ? 'default' :
                              operation.operationStatus === 'failed' ? 'destructive' :
                              operation.operationStatus === 'running' ? 'secondary' : 'outline'
                            }
                          >
                            {operation.operationStatus}
                          </Badge>
                          {operation.operationStatus === 'running' && (
                            <Progress value={operation.progress} className="w-20" />
                          )}
                          <div className="text-xs text-muted-foreground">
                            {formatDuration(operation.startedAt, operation.completedAt)}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks">
          <Card>
            <CardHeader>
              <CardTitle>Webhook Activity</CardTitle>
              <CardDescription>
                Incoming webhook events and processing status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-80">
                <div className="space-y-4">
                  {webhookLogs.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      No webhook activity found
                    </div>
                  ) : (
                    webhookLogs.map((log) => (
                      <div 
                        key={log.id} 
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          {getOperationStatusIcon(log.processingStatus)}
                          <div>
                            <div className="font-medium">
                              {log.webhookEvent}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(log.receivedAt).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge 
                            variant={
                              log.processingStatus === 'completed' ? 'default' :
                              log.processingStatus === 'failed' ? 'destructive' :
                              log.processingStatus === 'processing' ? 'secondary' : 'outline'
                            }
                          >
                            {log.processingStatus}
                          </Badge>
                          {log.retryCount > 0 && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {log.retryCount} retries
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}