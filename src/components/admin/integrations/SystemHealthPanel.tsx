import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Clock, 
  Database, 
  Shield, 
  Activity,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown
} from "lucide-react";

interface SystemHealth {
  avgWebhookDeliveryTime: number;
  apiResponseTime: number;
  queueDepth: number;
  errorRate: number;
  dbPerformance: number;
  status: 'healthy' | 'warning' | 'critical';
}

interface AlertThresholds {
  errorRate: number;
  responseTime: number;
  queueDepth: number;
}

interface SystemHealthPanelProps {
  systemHealth: SystemHealth;
  alertThresholds: AlertThresholds;
}

export function SystemHealthPanel({ systemHealth, alertThresholds }: SystemHealthPanelProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getProgressColor = (value: number, threshold: number, inverse = false) => {
    const isOverThreshold = inverse ? value < threshold : value > threshold;
    return isOverThreshold ? 'bg-red-500' : value > threshold * 0.8 ? 'bg-yellow-500' : 'bg-green-500';
  };

  const getPerformanceIndicator = (current: number, previous: number) => {
    const change = ((current - previous) / previous) * 100;
    if (Math.abs(change) < 1) return null;
    
    return change > 0 ? (
      <div className="flex items-center gap-1 text-red-500">
        <TrendingUp className="h-3 w-3" />
        <span className="text-xs">+{change.toFixed(1)}%</span>
      </div>
    ) : (
      <div className="flex items-center gap-1 text-green-500">
        <TrendingDown className="h-3 w-3" />
        <span className="text-xs">{change.toFixed(1)}%</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Status Alert */}
      {systemHealth.status !== 'healthy' && (
        <Alert variant={systemHealth.status === 'critical' ? 'destructive' : 'default'}>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            System health status: <strong className="capitalize">{systemHealth.status}</strong>
            {systemHealth.status === 'critical' && ' - Immediate attention required.'}
            {systemHealth.status === 'warning' && ' - Monitor closely for potential issues.'}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Response Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span>Webhook Delivery</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono">{systemHealth.avgWebhookDeliveryTime.toFixed(0)}ms</span>
                  {getPerformanceIndicator(systemHealth.avgWebhookDeliveryTime, 200)}
                </div>
              </div>
              <Progress 
                value={Math.min((systemHealth.avgWebhookDeliveryTime / alertThresholds.responseTime) * 100, 100)} 
                className="h-2"
              />
              <div className="text-xs text-muted-foreground">
                Threshold: {alertThresholds.responseTime}ms
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span>API Response</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono">{systemHealth.apiResponseTime.toFixed(0)}ms</span>
                  {getPerformanceIndicator(systemHealth.apiResponseTime, 150)}
                </div>
              </div>
              <Progress 
                value={Math.min((systemHealth.apiResponseTime / 500) * 100, 100)} 
                className="h-2"
              />
              <div className="text-xs text-muted-foreground">
                Target: &lt;500ms
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Database Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Health
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span>Query Performance</span>
                <span className="font-mono">{systemHealth.dbPerformance.toFixed(1)}%</span>
              </div>
              <Progress value={systemHealth.dbPerformance} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Connection Pool</span>
                <span className="font-mono">85%</span>
              </div>
              <Progress value={85} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Queue Depth</span>
                <span className="font-mono">{systemHealth.queueDepth}</span>
              </div>
              <Progress 
                value={Math.min((systemHealth.queueDepth / alertThresholds.queueDepth) * 100, 100)} 
                className="h-2"
              />
              <div className="text-xs text-muted-foreground">
                Alert at: {alertThresholds.queueDepth}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Monitoring */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Error Monitoring
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span>Error Rate</span>
                <div className="flex items-center gap-2">
                  <span className={`font-mono ${getStatusColor(systemHealth.status)}`}>
                    {systemHealth.errorRate.toFixed(1)}%
                  </span>
                  {systemHealth.errorRate > alertThresholds.errorRate && (
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  )}
                </div>
              </div>
              <Progress 
                value={Math.min((systemHealth.errorRate / (alertThresholds.errorRate * 2)) * 100, 100)} 
                className="h-2"
              />
              <div className="text-xs text-muted-foreground">
                Alert threshold: {alertThresholds.errorRate}%
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <div className="font-medium text-green-600">1,245</div>
                <div className="text-muted-foreground">Successful</div>
              </div>
              <div>
                <div className="font-medium text-red-600">23</div>
                <div className="text-muted-foreground">Failed</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Status Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Status Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold mb-1">
                {systemHealth.status === 'healthy' ? '🟢' : 
                 systemHealth.status === 'warning' ? '🟡' : '🔴'}
              </div>
              <div className="text-sm">Overall Status</div>
              <div className={`text-xs capitalize ${getStatusColor(systemHealth.status)}`}>
                {systemHealth.status}
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold mb-1">
                {systemHealth.avgWebhookDeliveryTime < 500 ? '🟢' : 
                 systemHealth.avgWebhookDeliveryTime < 1000 ? '🟡' : '🔴'}
              </div>
              <div className="text-sm">Delivery Speed</div>
              <div className="text-xs text-muted-foreground">
                {systemHealth.avgWebhookDeliveryTime.toFixed(0)}ms avg
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold mb-1">
                {systemHealth.errorRate < 2 ? '🟢' : 
                 systemHealth.errorRate < 5 ? '🟡' : '🔴'}
              </div>
              <div className="text-sm">Error Rate</div>
              <div className="text-xs text-muted-foreground">
                {systemHealth.errorRate.toFixed(1)}%
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold mb-1">
                {systemHealth.queueDepth < 50 ? '🟢' : 
                 systemHealth.queueDepth < 100 ? '🟡' : '🔴'}
              </div>
              <div className="text-sm">Queue Status</div>
              <div className="text-xs text-muted-foreground">
                {systemHealth.queueDepth} pending
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}