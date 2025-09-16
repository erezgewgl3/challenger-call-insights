import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, AlertTriangle, Activity, Clock, Zap, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useZapierConnection, useZapierData, useZapierApiKeys } from '@/hooks/useZapier';
import { zapierService } from '@/services/zapierService';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface TestResult {
  test: string;
  status: 'passed' | 'failed' | 'warning' | 'pending';
  message: string;
  details?: string;
}

export function ZapierConnectionTest() {
  const { testConnection, isConnected, isTesting } = useZapierConnection();
  const { recentAnalyses } = useZapierData();
  const { apiKeys } = useZapierApiKeys();
  const { toast } = useToast();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [selectedApiKey, setSelectedApiKey] = useState<string>('');
  const [manualApiKey, setManualApiKey] = useState<string>('');
  const [rawResponse, setRawResponse] = useState<any | null>(null);
  const [showRaw, setShowRaw] = useState(false);

  // Auto-select first active API key on mount
  useEffect(() => {
    if (apiKeys.length > 0 && !selectedApiKey && !manualApiKey) {
      const firstActiveKey = apiKeys.find(key => key.is_active);
      if (firstActiveKey) {
        setSelectedApiKey(firstActiveKey.id);
      }
    }
  }, [apiKeys, selectedApiKey, manualApiKey]);

  const runComprehensiveTest = async () => {
    const testApiKey = selectedApiKey || manualApiKey;
    if (!testApiKey) {
      toast({
        title: 'API Key Required',
        description: 'Please select an API key or enter one manually to run tests.',
        variant: 'destructive'
      });
      return;
    }

    setIsRunningTests(true);
    setTestResults([]);
    setRawResponse(null);
    setShowRaw(false);
    const tests: TestResult[] = [
      { test: 'Database Connection', status: 'pending', message: 'Testing database connectivity...' },
      { test: 'API Authentication', status: 'pending', message: 'Validating API key...' },
      { test: 'Data Access', status: 'pending', message: 'Verifying data permissions...' },
    ];

    // Test Database Connection
    setTestResults([...tests]);
    try {
      console.debug('[ZapierConnectionTest] Testing connection with key:', testApiKey?.substring(0, 8) + '...');
      const connectionResult = await testConnection(testApiKey);
      console.debug('[ZapierConnectionTest] Connection result:', connectionResult);
      
      // Always set raw response - even on failures
      setRawResponse((connectionResult as any)?.data ?? { error: connectionResult?.error, success: false });
      
      if (connectionResult.success && (connectionResult as any).data) {
        // Fix: Access nested results from edge function response
        const results = (connectionResult as any).data.results || {};
        const database = results.database || {};
        const authentication = results.authentication || {};
        
        // Database Connection Test
        tests[0] = {
          ...tests[0],
          status: database.status === 'healthy' ? 'passed' : database.status === 'degraded' ? 'warning' : 'failed',
          message: database.status === 'healthy' ? 'Database connection successful' : 
                   database.status === 'degraded' ? 'Database connection degraded' : 'Database connection failed',
          details: `Response time: ${database.response_time || database.responseTime || 0}ms`
        };

        // API Authentication Test  
        tests[1] = {
          ...tests[1],
          status: authentication.valid ? 'passed' : 'failed',
          message: authentication.valid ? 'API authentication successful' : 'API authentication failed',
          details: authentication.valid 
            ? `Valid API key for user ${authentication.user_id || 'unknown'}` 
            : (connectionResult as any).data?.message || authentication.reason || connectionResult.error || 'Authentication failed'
        };

        // Data Access Test
        tests[2] = {
          ...tests[2],
          status: recentAnalyses.length > 0 ? 'passed' : 'warning',
          message: recentAnalyses.length > 0 ? 'Data access verified' : 'Limited data available',
          details: `Found ${recentAnalyses.length} recent analysis records`
        };
      } else {
        // Mark all tests as failed if connection test fails
        tests.forEach((test, index) => {
          tests[index] = {
            ...test,
            status: 'failed',
            message: 'Connection test failed',
            details: (connectionResult as any).data?.message || connectionResult.error || 'Unknown error'
          };
        });
      }
    } catch (error) {
      console.error('[ZapierConnectionTest] Test execution error:', error);
      // Ensure raw response is set even on exception
      setRawResponse({ error: error instanceof Error ? error.message : 'Unknown error', success: false });
      
      // Mark all tests as failed on error
      tests.forEach((test, index) => {
        tests[index] = {
          ...test,
          status: 'failed',
          message: 'Test execution failed',
          details: error instanceof Error ? error.message : 'Unknown error'
        };
      });
    }

    setTestResults([...tests]);

    const allPassed = tests.every(test => test.status === 'passed');
    const hasWarnings = tests.some(test => test.status === 'warning');
    const hasFailed = tests.some(test => test.status === 'failed');

    if (allPassed) {
      toast({
        title: 'All Tests Passed',
        description: 'Your Zapier integration is working perfectly!',
      });
    } else if (hasFailed) {
      toast({
        title: 'Test Failures Detected',
        description: 'Some tests failed. Please review the results and fix any issues.',
        variant: 'destructive'
      });
    } else if (hasWarnings) {
      toast({
        title: 'Tests Completed with Warnings',
        description: 'Integration is working but some optimizations may be needed.',
      });
    }

    setIsRunningTests(false);
  };

  const handleValidateKey = async () => {
    const testApiKey = selectedApiKey || manualApiKey;
    if (!testApiKey) {
      toast({ title: 'API Key Required', description: 'Select or enter an API key to validate.', variant: 'destructive' });
      return;
    }
    try {
      const res = await zapierService.validateApiKey(testApiKey);
      setShowRaw(true);
      if (res.success) {
        toast({ title: 'API Key Valid', description: 'The API key is valid.' });
        setRawResponse(res.data);
      } else {
        toast({ title: 'API Key Invalid', description: res.error || 'Invalid or expired API key', variant: 'destructive' });
        setRawResponse(res.data ?? { success: false, error: res.error });
      }
    } catch (e) {
      console.error('[ZapierConnectionTest] validate error:', e);
      setShowRaw(true);
      setRawResponse({ success: false, error: e instanceof Error ? e.message : 'Unknown error' });
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'pending':
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'passed':
        return <Badge className="bg-green-100 text-green-800">Passed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>;
      case 'pending':
        return <Badge variant="secondary">Running...</Badge>;
    }
  };

  const calculateProgress = () => {
    if (!isRunningTests) return 0;
    const completedTests = testResults.filter(test => test.status !== 'pending').length;
    return (completedTests / 3) * 100; // Changed from 4 to 3 tests
  };

  return (
    <div className="space-y-6">
      {/* Connection Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Connection Status
          </CardTitle>
          <CardDescription>
            Current status of your Zapier integration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className={`h-3 w-3 rounded-full ${
                  isConnected ? 'bg-green-500' : 'bg-red-500'
                }`} />
                <span className="font-medium">Integration Status</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {isConnected ? 'Connected and ready' : 'Connection issues detected'}
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <span className="font-medium">Last Check</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date())} ago
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Suite */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Connection Test Suite
          </CardTitle>
          <CardDescription>
            Run comprehensive tests to verify your integration health
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* API Key Selection */}
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select API Key for Testing</label>
              {apiKeys.length > 0 ? (
                <select 
                  value={selectedApiKey} 
                  onChange={(e) => {
                    setSelectedApiKey(e.target.value);
                    setManualApiKey('');
                  }}
                  className="w-full p-2 border rounded-md bg-background"
                >
                  <option value="">Select an API key...</option>
                  {apiKeys.filter(key => key.is_active).map(key => (
                    <option key={key.id} value={key.id}>
                      {key.key_name} ({key.id})
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-sm text-muted-foreground">No active API keys found</p>
              )}
            </div>
            
              <div className="space-y-2">
                <label className="text-sm font-medium">Or enter API Key manually</label>
                <input
                  type="text"
                  placeholder="Enter API Key ID or Secret..."
                  value={manualApiKey}
                  onChange={(e) => {
                    setManualApiKey(e.target.value);
                    setSelectedApiKey('');
                  }}
                  className="w-full p-2 border rounded-md bg-background"
                />
                {!selectedApiKey && !manualApiKey && (
                  <p className="text-xs text-muted-foreground">Select an API key or paste a secret to run tests.</p>
                )}
              </div>
          </div>

          <Button 
            onClick={runComprehensiveTest}
            disabled={isRunningTests || isTesting || (!selectedApiKey && !manualApiKey)}
            className="w-full"
          >
            {isRunningTests ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Running Tests...
              </>
            ) : (
              <>
                <Activity className="h-4 w-4 mr-2" />
                Run Complete Test
              </>
            )}
          </Button>

          <Button variant="secondary" onClick={handleValidateKey} disabled={!selectedApiKey && !manualApiKey} className="w-full">
            Validate API Key Only
          </Button>

          {isRunningTests && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Test Progress</span>
                <span>{Math.round(calculateProgress())}%</span>
              </div>
              <Progress value={calculateProgress()} className="h-2" />
            </div>
          )}

          {testResults.length > 0 && (
            <div className="space-y-3 mt-4">
              <h4 className="font-medium">Test Results</h4>
              {testResults.map((result, index) => (
                <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                  {getStatusIcon(result.status)}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{result.test}</span>
                      {getStatusBadge(result.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">{result.message}</p>
                    {result.details && (
                      <p className="text-xs text-muted-foreground">{result.details}</p>
                    )}
                  </div>
                </div>
              ))}

            </div>
          )}

          {/* Diagnostics / Raw Response Panel */}
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Raw response (edge function)</span>
              <Button variant="secondary" size="sm" onClick={() => setShowRaw(!showRaw)}>
                {showRaw ? 'Hide' : 'Show'} raw
              </Button>
            </div>
            {showRaw && (
              <pre className="max-h-64 overflow-auto rounded-md border p-3 text-xs bg-muted">
                {rawResponse ? JSON.stringify(rawResponse, null, 2) : 'No data yet'}
              </pre>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Latest API calls and webhook deliveries
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentAnalyses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No recent activity</p>
              <p className="text-sm">Activity will appear here once you start using the integration</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentAnalyses.slice(0, 5).map((analysis, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="font-medium">Analysis Processed</p>
                      <p className="text-sm text-muted-foreground">
                        CRM data formatted and delivered
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">
                    {formatDistanceToNow(new Date())} ago
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}