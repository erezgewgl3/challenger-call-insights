import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  Activity, 
  Users, 
  Zap, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  TrendingDown,
  Download,
  RefreshCw,
  Settings,
  Eye,
  XCircle,
  BarChart3,
  PieChart,
  LineChart,
  Database,
  Globe,
  Bell,
  Shield
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ZapierZohoSetupGuide } from "@/components/integrations-framework/ZapierZohoSetupGuide";

interface IntegrationMetrics {
  totalActiveIntegrations: number;
  webhookSuccessRate24h: number;
  webhookSuccessRate7d: number;
  webhookSuccessRate30d: number;
  totalApiCalls24h: number;
  averageResponseTime: number;
  errorRate24h: number;
  queueDepth: number;
}

interface UserIntegrationStatus {
  userId: string;
  email: string;
  activeIntegrations: number;
  healthScore: number;
  lastActivity: string;
  issues: string[];
  apiUsage24h: number;
  webhookVolume24h: number;
}

interface SystemHealth {
  avgWebhookDeliveryTime: number;
  apiResponseTime: number;
  queueDepth: number;
  errorRate: number;
  dbPerformance: number;
  status: 'healthy' | 'warning' | 'critical';
}

interface IntegrationAnalytics {
  popularIntegrations: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
  adoptionRate: number;
  monthlyGrowth: number;
  usageTrends: Array<{
    date: string;
    apiCalls: number;
    webhooks: number;
    activeUsers: number;
  }>;
}

export default function AdminIntegrationDashboard() {
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');
  const [searchTerm, setSearchTerm] = useState('');
  const [alertThresholds, setAlertThresholds] = useState({
    errorRate: 5,
    responseTime: 2000,
    queueDepth: 100
  });

  // Fetch integration metrics
  const { data: metrics, refetch: refetchMetrics } = useQuery({
    queryKey: ['admin-integration-metrics', selectedTimeRange],
    queryFn: async (): Promise<IntegrationMetrics> => {
      const [connections, webhookLogs, apiKeys, syncOps] = await Promise.all([
        supabase.from('integration_connections').select('*').eq('connection_status', 'active'),
        supabase.from('integration_webhook_logs').select('*').gte('created_at', getTimeRangeDate(selectedTimeRange)),
        supabase.from('zapier_api_keys').select('*').eq('is_active', true),
        supabase.from('integration_sync_operations').select('*').gte('created_at', getTimeRangeDate(selectedTimeRange))
      ]);

      const totalWebhooks = webhookLogs.data?.length || 0;
      const successfulWebhooks = webhookLogs.data?.filter(log => log.processing_status === 'processed').length || 0;
      
      return {
        totalActiveIntegrations: connections.data?.length || 0,
        webhookSuccessRate24h: totalWebhooks > 0 ? (successfulWebhooks / totalWebhooks) * 100 : 0,
        webhookSuccessRate7d: 0, // Calculate based on 7d data
        webhookSuccessRate30d: 0, // Calculate based on 30d data
        totalApiCalls24h: webhookLogs.data?.length || 0,
        averageResponseTime: 150, // Mock data - would calculate from actual metrics
        errorRate24h: totalWebhooks > 0 ? ((totalWebhooks - successfulWebhooks) / totalWebhooks) * 100 : 0,
        queueDepth: syncOps.data?.filter(op => op.operation_status === 'running').length || 0
      };
    },
    refetchInterval: refreshInterval
  });

  // Fetch user integration statuses
  const { data: userStatuses } = useQuery({
    queryKey: ['admin-user-integration-status'],
    queryFn: async (): Promise<UserIntegrationStatus[]> => {
      const [usersResult, connectionsResult] = await Promise.all([
        supabase.from('users').select('id, email'),
        supabase.from('integration_connections').select('*')
      ]);

      if (usersResult.error || connectionsResult.error) {
        console.error('Error fetching data:', usersResult.error || connectionsResult.error);
        return [];
      }

      const users = usersResult.data || [];
      const connections = connectionsResult.data || [];

      return users.map(user => {
        const userConnections = connections.filter(conn => conn.user_id === user.id);
        
        return {
          userId: user.id,
          email: user.email,
          activeIntegrations: userConnections.length,
          healthScore: calculateHealthScore(userConnections),
          lastActivity: getLastActivity(userConnections),
          issues: getIntegrationIssues(userConnections),
          apiUsage24h: Math.floor(Math.random() * 1000), // Mock data
          webhookVolume24h: Math.floor(Math.random() * 100) // Mock data
        };
      });
    },
    refetchInterval: refreshInterval
  });

  // Fetch system health
  const { data: systemHealth } = useQuery({
    queryKey: ['admin-system-health'],
    queryFn: async (): Promise<SystemHealth> => {
      // Mock implementation - would fetch real metrics
      const avgDeliveryTime = 250 + Math.random() * 100;
      const apiResponseTime = 150 + Math.random() * 50;
      const errorRate = 2 + Math.random() * 3;
      
      return {
        avgWebhookDeliveryTime: avgDeliveryTime,
        apiResponseTime,
        queueDepth: Math.floor(Math.random() * 50),
        errorRate,
        dbPerformance: 95 + Math.random() * 5,
        status: errorRate > 5 ? 'critical' : errorRate > 2 ? 'warning' : 'healthy'
      };
    },
    refetchInterval: refreshInterval
  });

  // Fetch integration analytics
  const { data: analytics } = useQuery({
    queryKey: ['admin-integration-analytics'],
    queryFn: async (): Promise<IntegrationAnalytics> => {
      const { data: connections } = await supabase
        .from('integration_connections')
        .select('integration_type');

      const integrationCounts = connections?.reduce((acc, conn) => {
        acc[conn.integration_type] = (acc[conn.integration_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const total = Object.values(integrationCounts).reduce((sum, count) => sum + count, 0);

      return {
        popularIntegrations: Object.entries(integrationCounts).map(([type, count]) => ({
          type,
          count,
          percentage: total > 0 ? (count / total) * 100 : 0
        })).sort((a, b) => b.count - a.count),
        adoptionRate: 85.3, // Mock data
        monthlyGrowth: 12.5, // Mock data
        usageTrends: generateMockTrends() // Mock data
      };
    },
    refetchInterval: 60000 // Refresh every minute
  });

  const handleExportData = (type: string) => {
    // Implementation for data export
    toast({
      title: "Export Started",
      description: `Exporting ${type} data...`,
    });
  };

  const handleDisableIntegration = async (connectionId: string) => {
    try {
      await supabase
        .from('integration_connections')
        .update({ connection_status: 'disabled' })
        .eq('id', connectionId);
      
      toast({
        title: "Integration Disabled",
        description: "Integration has been successfully disabled.",
      });
      
      refetchMetrics();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to disable integration.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Integration Monitoring Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor and manage all customer integrations across Sales Whisperer
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => {
              refetchMetrics();
              toast({ title: "Data refreshed" });
            }}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* System Status Alert */}
      {systemHealth?.status !== 'healthy' && (
        <Alert variant={systemHealth?.status === 'critical' ? 'destructive' : 'default'}>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            System status: {systemHealth?.status}. 
            {systemHealth?.status === 'critical' && ' Immediate attention required.'}
            {systemHealth?.status === 'warning' && ' Monitor closely.'}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="health">System Health</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Documentation Resources */}
          <ZapierZohoSetupGuide />
          
          {/* Real-time Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Integrations</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.totalActiveIntegrations || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Across all users
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Webhook Success Rate</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics?.webhookSuccessRate24h.toFixed(1) || 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Last 24 hours
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">API Calls</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.totalApiCalls24h || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Last 24 hours
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics?.errorRate24h.toFixed(1) || 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Last 24 hours
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Response Times</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span>Average API Response</span>
                  <span className="font-mono">{metrics?.averageResponseTime || 0}ms</span>
                </div>
                <div className="flex justify-between">
                  <span>Webhook Delivery</span>
                  <span className="font-mono">{systemHealth?.avgWebhookDeliveryTime || 0}ms</span>
                </div>
                <Progress value={85} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Queue Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span>Queue Depth</span>
                  <span className="font-mono">{metrics?.queueDepth || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Processing Rate</span>
                  <span className="font-mono">95/min</span>
                </div>
                <Progress value={15} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">System Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${
                    systemHealth?.status === 'healthy' ? 'bg-green-500' :
                    systemHealth?.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                  }`} />
                  <span className={`capitalize ${getStatusColor(systemHealth?.status || 'healthy')}`}>
                    {systemHealth?.status || 'Healthy'}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  All systems operational
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <div className="flex items-center gap-4">
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export User Data
            </Button>
          </div>

          <div className="grid gap-4">
            {userStatuses?.filter(user => 
              user.email.toLowerCase().includes(searchTerm.toLowerCase())
            ).map((user) => (
              <Card key={user.userId}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{user.email}</span>
                        <Badge variant={user.healthScore >= 90 ? "default" : user.healthScore >= 70 ? "secondary" : "destructive"}>
                          Health Score: {user.healthScore}%
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {user.activeIntegrations} active integration(s) • Last activity: {user.lastActivity}
                      </div>
                      {user.issues.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {user.issues.map((issue, index) => (
                            <Badge key={index} variant="destructive" className="text-xs">
                              {issue}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="text-right text-sm">
                        <div>API: {user.apiUsage24h}</div>
                        <div>Webhooks: {user.webhookVolume24h}</div>
                      </div>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="health" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Delivery Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Avg Webhook Delivery</span>
                    <span className="font-mono">{systemHealth?.avgWebhookDeliveryTime.toFixed(0)}ms</span>
                  </div>
                  <Progress value={75} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>API Response Time</span>
                    <span className="font-mono">{systemHealth?.apiResponseTime.toFixed(0)}ms</span>
                  </div>
                  <Progress value={85} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Database Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Query Performance</span>
                    <span className="font-mono">{systemHealth?.dbPerformance.toFixed(1)}%</span>
                  </div>
                  <Progress value={systemHealth?.dbPerformance || 0} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Connection Pool</span>
                    <span className="font-mono">85%</span>
                  </div>
                  <Progress value={85} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Error Tracking
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Error Rate</span>
                    <span className={`font-mono ${getStatusColor(systemHealth?.status || 'healthy')}`}>
                      {systemHealth?.errorRate.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={systemHealth?.errorRate || 0} className="bg-red-100" />
                </div>
                <div className="text-sm text-muted-foreground">
                  Threshold: {alertThresholds.errorRate}%
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Popular Integrations</CardTitle>
                <CardDescription>Most used integration types</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics?.popularIntegrations.slice(0, 5).map((integration, index) => (
                    <div key={integration.type} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`h-3 w-3 rounded-full ${
                          index === 0 ? 'bg-blue-500' : 
                          index === 1 ? 'bg-green-500' :
                          index === 2 ? 'bg-yellow-500' :
                          index === 3 ? 'bg-purple-500' : 'bg-gray-500'
                        }`} />
                        <span className="font-medium capitalize">{integration.type}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-mono">{integration.count}</div>
                        <div className="text-xs text-muted-foreground">
                          {integration.percentage.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Growth Metrics</CardTitle>
                <CardDescription>User adoption and growth</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Adoption Rate</span>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="font-mono">{analytics?.adoptionRate}%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>Monthly Growth</span>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="font-mono">+{analytics?.monthlyGrowth}%</span>
                  </div>
                </div>
                <div className="pt-4">
                  <h4 className="font-medium mb-2">Usage Trends (Last 7 days)</h4>
                  <div className="space-y-2">
                    {analytics?.usageTrends.slice(-7).map((trend, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{trend.date}</span>
                        <span>{trend.apiCalls} calls</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alert Configuration</CardTitle>
              <CardDescription>Set thresholds for system monitoring</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Error Rate Threshold (%)</label>
                  <Input
                    type="number"
                    value={alertThresholds.errorRate}
                    onChange={(e) => setAlertThresholds(prev => ({
                      ...prev,
                      errorRate: Number(e.target.value)
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Response Time Threshold (ms)</label>
                  <Input
                    type="number"
                    value={alertThresholds.responseTime}
                    onChange={(e) => setAlertThresholds(prev => ({
                      ...prev,
                      responseTime: Number(e.target.value)
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Queue Depth Threshold</label>
                  <Input
                    type="number"
                    value={alertThresholds.queueDepth}
                    onChange={(e) => setAlertThresholds(prev => ({
                      ...prev,
                      queueDepth: Number(e.target.value)
                    }))}
                  />
                </div>
              </div>
              <Button>Save Alert Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Usage Statistics</CardTitle>
                <CardDescription>Export API usage and webhook data</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full" 
                  onClick={() => handleExportData('usage')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Integration Health</CardTitle>
                <CardDescription>Export health status reports</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full" 
                  onClick={() => handleExportData('health')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Metrics</CardTitle>
                <CardDescription>Export user success metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full" 
                  onClick={() => handleExportData('users')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Error Analysis</CardTitle>
                <CardDescription>Export error reports and analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full" 
                  onClick={() => handleExportData('errors')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Webhook Logs</CardTitle>
                <CardDescription>Export detailed webhook logs</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full" 
                  onClick={() => handleExportData('webhooks')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Complete Report</CardTitle>
                <CardDescription>Export comprehensive integration report</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full" 
                  onClick={() => handleExportData('complete')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper functions
function getTimeRangeDate(range: string): string {
  const now = new Date();
  switch (range) {
    case '1h':
      return new Date(now.getTime() - 60 * 60 * 1000).toISOString();
    case '24h':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    default:
      return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  }
}

function calculateHealthScore(connections: any[]): number {
  if (!connections || connections.length === 0) return 0;
  
  const activeConnections = connections.filter(conn => conn.connection_status === 'active').length;
  return Math.round((activeConnections / connections.length) * 100);
}

function getLastActivity(connections: any[]): string {
  if (!connections || connections.length === 0) return 'Never';
  
  const lastSync = connections
    .map(conn => conn.last_sync_at)
    .filter(date => date)
    .sort()
    .pop();
    
  if (!lastSync) return 'Never';
  
  const date = new Date(lastSync);
  const now = new Date();
  const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  
  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function getIntegrationIssues(connections: any[]): string[] {
  const issues: string[] = [];
  
  connections.forEach(conn => {
    if (conn.connection_status === 'error') {
      issues.push('Connection Error');
    }
    if (conn.connection_status === 'inactive') {
      issues.push('Inactive Connection');
    }
  });
  
  return issues;
}

function generateMockTrends() {
  const trends = [];
  const now = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    trends.push({
      date: date.toLocaleDateString(),
      apiCalls: Math.floor(Math.random() * 1000) + 500,
      webhooks: Math.floor(Math.random() * 200) + 100,
      activeUsers: Math.floor(Math.random() * 50) + 20
    });
  }
  
  return trends;
}