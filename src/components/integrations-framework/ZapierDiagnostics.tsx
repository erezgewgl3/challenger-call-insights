import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Clock, 
  Activity, 
  Zap, 
  Database, 
  Globe, 
  Link,
  RefreshCw,
  AlertTriangle,
  Info,
  TrendingUp,
  Settings
} from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ZapierWebhookMonitor } from './ZapierWebhookMonitor';

interface DiagnosticResult {
  success: boolean;
  message: string;
  responseTime?: number;
  details?: Record<string, any>;
  timestamp: string;
}

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    database: ServiceHealth;
    webhooks: ServiceHealth;
    matching: ServiceHealth;
    crm: ServiceHealth;
  };
  metrics: {
    responseTime: number;
    activeConnections: number;
    errorRate: number;
    uptime: number;
  };
}

interface ServiceHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime?: number;
  lastCheck: string;
  error?: string;
  details?: Record<string, any>;
}

interface ConnectionTestResult {
  success: boolean;
  timestamp: string;
  tests: {
    authentication: DiagnosticResult;
    database: DiagnosticResult;
    webhooks: DiagnosticResult;
  };
  metrics: {
    totalResponseTime: number;
    rateLimitRemaining?: number;
  };
  recommendations?: string[];
}

export function ZapierDiagnostics() {
  const [isLoading, setIsLoading] = useState(false);
  const [healthData, setHealthData] = useState<HealthCheckResult | null>(null);
  const [connectionTest, setConnectionTest] = useState<ConnectionTestResult | null>(null);
  const [diagnosticHistory, setDiagnosticHistory] = useState<DiagnosticResult[]>([]);
  const [apiKey, setApiKey] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    // Load initial health check
    performHealthCheck();
  }, []);

  const performHealthCheck = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('zapier-health');
      
      if (error) {
        toast({
          title: "Health Check Failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setHealthData(data);
      
      if (data.status === 'unhealthy') {
        toast({
          title: "System Issues Detected",
          description: "Some services are experiencing problems. Check the details below.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Health check error:', error);
      toast({
        title: "Health Check Error",
        description: "Failed to perform health check",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const performConnectionTest = async () => {
    if (!apiKey) {
      toast({
        title: "API Key Required",
        description: "Please enter your API key to test the connection",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('zapier-test', {
        body: { apiKey }
      });
      
      if (error) {
        toast({
          title: "Connection Test Failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setConnectionTest(data);
      
      if (data.success) {
        toast({
          title: "Connection Test Passed",
          description: "All connection tests completed successfully",
        });
      } else {
        toast({
          title: "Connection Issues Found",
          description: "Some connection tests failed. Check the details below.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Connection test error:', error);
      toast({
        title: "Connection Test Error",
        description: "Failed to perform connection test",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testWebhookDelivery = async () => {
    if (!webhookUrl) {
      toast({
        title: "Webhook URL Required",
        description: "Please enter a webhook URL to test delivery",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('zapier-test', {
        body: { 
          webhookUrl,
          test: 'webhook-delivery'
        }
      });
      
      if (error) {
        toast({
          title: "Webhook Test Failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      const result: DiagnosticResult = {
        success: data.success,
        message: data.message,
        responseTime: data.responseTime,
        details: data.results,
        timestamp: new Date().toISOString()
      };

      setDiagnosticHistory(prev => [result, ...prev.slice(0, 9)]);
      
      if (data.success) {
        toast({
          title: "Webhook Test Successful",
          description: "Webhook was delivered successfully",
        });
      } else {
        toast({
          title: "Webhook Test Failed",
          description: data.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Webhook test error:', error);
      toast({
        title: "Webhook Test Error",
        description: "Failed to test webhook delivery",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'degraded':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'unhealthy':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500/10 text-green-700 border-green-200';
      case 'degraded':
        return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
      case 'unhealthy':
        return 'bg-red-500/10 text-red-700 border-red-200';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Zapier Integration Diagnostics</h2>
          <p className="text-muted-foreground">
            Monitor integration health and diagnose connection issues
          </p>
        </div>
        <Button onClick={performHealthCheck} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="connection">Connection Test</TabsTrigger>
          <TabsTrigger value="webhooks">Webhook Test</TabsTrigger>
          <TabsTrigger value="monitoring">Live Monitor</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {healthData && (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">System Status</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(healthData.status)}
                      <Badge className={getStatusColor(healthData.status)}>
                        {healthData.status.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Last updated: {new Date(healthData.timestamp).toLocaleTimeString()}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Response Time</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{healthData.metrics.responseTime}ms</div>
                    <p className="text-xs text-muted-foreground">
                      Average system response
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Connections</CardTitle>
                    <Link className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{healthData.metrics.activeConnections}</div>
                    <p className="text-xs text-muted-foreground">
                      Currently connected
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatUptime(healthData.metrics.uptime)}</div>
                    <p className="text-xs text-muted-foreground">
                      {healthData.metrics.errorRate.toFixed(1)}% error rate
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Database className="w-5 h-5" />
                      <span>Database Service</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Status</span>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(healthData.services.database.status)}
                        <span className="text-sm font-medium">
                          {healthData.services.database.status}
                        </span>
                      </div>
                    </div>
                    {healthData.services.database.responseTime && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Response Time</span>
                        <span className="text-sm">{healthData.services.database.responseTime}ms</span>
                      </div>
                    )}
                    {healthData.services.database.error && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription className="text-sm">
                          {healthData.services.database.error}
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Zap className="w-5 h-5" />
                      <span>Webhook Service</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Status</span>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(healthData.services.webhooks.status)}
                        <span className="text-sm font-medium">
                          {healthData.services.webhooks.status}
                        </span>
                      </div>
                    </div>
                    {healthData.services.webhooks.details && (
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>24h Deliveries</span>
                          <span>{healthData.services.webhooks.details.totalWebhooks24h}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Success Rate</span>
                          <span>{healthData.services.webhooks.details.errorRate}</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Settings className="w-5 h-5" />
                      <span>Contact Matching</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Status</span>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(healthData.services.matching.status)}
                        <span className="text-sm font-medium">
                          {healthData.services.matching.status}
                        </span>
                      </div>
                    </div>
                    {healthData.services.matching.details && (
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>24h Matches</span>
                          <span>{healthData.services.matching.details.totalMatches24h}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Pending Rate</span>
                          <span>{healthData.services.matching.details.pendingRate}</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Globe className="w-5 h-5" />
                      <span>CRM Integration</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Status</span>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(healthData.services.crm.status)}
                        <span className="text-sm font-medium">
                          {healthData.services.crm.status}
                        </span>
                      </div>
                    </div>
                    {healthData.services.crm.details && (
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>24h Operations</span>
                          <span>{healthData.services.crm.details.totalOperations24h}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Error Rate</span>
                          <span>{healthData.services.crm.details.errorRate}</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="connection" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Connection Test</CardTitle>
              <CardDescription>
                Test your API key and verify system connectivity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="api-key">API Key</Label>
                <Input
                  id="api-key"
                  type="password"
                  placeholder="Enter your Zapier API key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
              </div>
              
              <Button onClick={performConnectionTest} disabled={isLoading}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Test Connection
              </Button>

              {connectionTest && (
                <div className="space-y-4 mt-6">
                  <div className="flex items-center space-x-2">
                    {connectionTest.success ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                    <span className="font-medium">
                      Connection Test {connectionTest.success ? 'Passed' : 'Failed'}
                    </span>
                  </div>

                  <div className="grid gap-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Authentication</span>
                        <div className="flex items-center space-x-2">
                          {connectionTest.tests.authentication.success ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500" />
                          )}
                          <span className="text-sm">
                            {connectionTest.tests.authentication.responseTime}ms
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {connectionTest.tests.authentication.message}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Database</span>
                        <div className="flex items-center space-x-2">
                          {connectionTest.tests.database.success ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500" />
                          )}
                          <span className="text-sm">
                            {connectionTest.tests.database.responseTime}ms
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {connectionTest.tests.database.message}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Webhooks</span>
                        <div className="flex items-center space-x-2">
                          {connectionTest.tests.webhooks.success ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500" />
                          )}
                          <span className="text-sm">
                            {connectionTest.tests.webhooks.responseTime}ms
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {connectionTest.tests.webhooks.message}
                      </p>
                    </div>
                  </div>

                  {connectionTest.recommendations && (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertTitle>Recommendations</AlertTitle>
                      <AlertDescription>
                        <ul className="list-disc list-inside space-y-1 mt-2">
                          {connectionTest.recommendations.map((rec, index) => (
                            <li key={index} className="text-sm">{rec}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="text-xs text-muted-foreground">
                    Test completed at {new Date(connectionTest.timestamp).toLocaleString()}
                    {connectionTest.metrics.rateLimitRemaining && (
                      <span className="ml-2">
                        • {connectionTest.metrics.rateLimitRemaining} requests remaining
                      </span>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <ZapierWebhookMonitor />
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Webhook Delivery Test</CardTitle>
              <CardDescription>
                Test webhook delivery to verify your endpoint is working correctly
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="webhook-url">Webhook URL</Label>
                <Input
                  id="webhook-url"
                  type="url"
                  placeholder="https://your-endpoint.com/webhook"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                />
              </div>
              
              <Button onClick={testWebhookDelivery} disabled={isLoading}>
                <Zap className="w-4 h-4 mr-2" />
                Test Webhook
              </Button>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  This will send a test payload to your webhook URL. Make sure your endpoint 
                  can accept POST requests with JSON content.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Diagnostic History</CardTitle>
              <CardDescription>
                Recent diagnostic test results and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {diagnosticHistory.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No diagnostic tests performed yet. Run some tests to see results here.
                    </p>
                  ) : (
                    diagnosticHistory.map((result, index) => (
                      <div key={index} className="border rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {result.success ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-500" />
                            )}
                            <span className="font-medium text-sm">
                              {result.success ? 'Success' : 'Failed'}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(result.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm">{result.message}</p>
                        {result.responseTime && (
                          <p className="text-xs text-muted-foreground">
                            Response time: {result.responseTime}ms
                          </p>
                        )}
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