import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, AlertTriangle, Activity, Clock, Zap, RefreshCw, Eye, EyeOff, Copy } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useZapierConnection, useZapierData, useZapierApiKeys } from '@/hooks/useZapier';
import { zapierService } from '@/services/zapierService';
import { useToast } from '@/hooks/use-toast';

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
  const [selectedApiKey, setSelectedApiKey] = useState('');
  const [manualApiKey, setManualApiKey] = useState('');
  const [rawResponse, setRawResponse] = useState<any>(null);
  const [showRaw, setShowRaw] = useState(false);

  // Helper function to format time ago
  const timeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'less than a minute ago';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  };

  // Auto-select first active API key on mount
  useEffect(() => {
    if (apiKeys.length > 0 && !selectedApiKey && !manualApiKey) {
      const firstActiveKey = apiKeys.find(key => key.is_active);
      if (firstActiveKey) {
        setSelectedApiKey(firstActiveKey.id);
      }
    }
  }, [apiKeys, selectedApiKey, manualApiKey]);

  // Helper function to determine API key type and preview
  const analyzeApiKey = (key: string) => {
    if (!key) return { type: 'none', preview: 'No key provided' };
    
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidPattern.test(key)) {
      return { type: 'UUID', preview: `${key.substring(0, 8)}...` };
    }
    
    if (key.startsWith('sw_')) {
      return { type: 'Secret', preview: `${key.substring(0, 8)}...` };
    }
    
    return { type: 'Unknown', preview: `${key.substring(0, 8)}...` };
  };

  // Robust response parser that handles multiple possible structures
  const parseEdgeFunctionResponse = (connectionResult: any) => {
    console.log('[ZapierConnectionTest] Raw connection result:', JSON.stringify(connectionResult, null, 2));
    
    let responseData = null;
    let success = false;
    
    if (connectionResult?.data) {
      responseData = connectionResult.data;
      success = connectionResult.success || responseData.success || false;
    } else if (connectionResult?.success !== undefined) {
      responseData = connectionResult;
      success = connectionResult.success;
    } else {
      responseData = { error: 'Unknown response structure', connectionResult };
      success = false;
    }
    
    setRawResponse(responseData);
    setShowRaw(true);
    
    return { responseData, success };
  };

  const runComprehensiveTest = async () => {
    alert('DEBUG: runComprehensiveTest function called!');
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

    setTestResults([...tests]);

    try {
      console.log('[ZapierConnectionTest] Testing connection with key:', testApiKey?.substring(0, 8) + '...');
      const connectionResult = await testConnection(testApiKey);
      console.log('[ZapierConnectionTest] Connection result:', connectionResult);

      const { responseData, success } = parseEdgeFunctionResponse(connectionResult);

      if (success && responseData) {
        const results = responseData.results || responseData.data?.results || {};
        const database = results.database || responseData.database || {};
        const authentication = results.authentication || responseData.authentication || {};
        
        console.log('[ZapierConnectionTest] Parsed results:', { database, authentication });

        // Database Connection Test
        const dbStatus = database.status || (database.response_time ? 'healthy' : 'unknown');
        tests[0] = {
          ...tests[0],
          status: dbStatus === 'healthy' ? 'passed' : dbStatus === 'degraded' ? 'warning' : 'failed',
          message: dbStatus === 'healthy' ? 'Database connection successful' : 
                   dbStatus === 'degraded' ? 'Database connection degraded' : 
                   dbStatus === 'failed' ? 'Database connection failed' : 'Database status unknown',
          details: `Response time: ${database.response_time || database.responseTime || 'unknown'}ms`
        };

        // API Authentication Test with detailed error handling
        const authValid = authentication.valid || authentication === true || 
                          (typeof authentication === 'string' && authentication !== 'failed');
        
        let authMessage = 'API authentication failed';
        let authDetails = 'Unknown authentication error';
        
        if (authValid) {
          authMessage = 'API authentication successful';
          authDetails = authentication.user_id 
            ? `Valid API key for user ${authentication.user_id.substring(0, 8)}...`
            : 'API key validation passed';
        } else {
          authDetails = responseData.message || 
                       authentication.reason || 
                       authentication.error ||
                       (authentication === 'failed' ? 'Authentication failed' : 'Invalid API key');
        }
        
        tests[1] = {
          ...tests[1],
          status: authValid ? 'passed' : 'failed',
          message: authMessage,
          details: authDetails
        };

        // Data Access Test
        tests[2] = {
          ...tests[2],
          status: recentAnalyses.length > 0 ? 'passed' : 'warning',
          message: recentAnalyses.length > 0 ? 'Data access verified' : 'Limited data available',
          details: `Found ${recentAnalyses.length} recent analysis records`
        };
      } else {
        const errorMessage = responseData?.message || 
                            responseData?.error || 
                            connectionResult?.error || 
                            'Unknown connection error';
        
        console.error('[ZapierConnectionTest] Connection test failed:', errorMessage);
        
        tests.forEach((test, index) => {
          tests[index] = {
            ...test,
            status: 'failed',
            message: 'Connection test failed',
            details: errorMessage
          };
        });
      }
    } catch (error) {
      console.error('[ZapierConnectionTest] Test execution error:', error);
      
      const errorData = { 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false,
        timestamp: new Date().toISOString()
      };
      setRawResponse(errorData);
      setShowRaw(true);

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
      console.log('[ZapierConnectionTest] Validating key:', testApiKey.substring(0, 8) + '...');
      const res = await zapierService.validateApiKey(testApiKey);
      console.log('[ZapierConnectionTest] Validation result:', res);
      
      setShowRaw(true);
      
      if (res.success) {
        toast({ title: 'API Key Valid', description: 'The API key is valid and active.' });
        setRawResponse(res.data || res);
      } else {
        toast({ 
          title: 'API Key Invalid', 
          description: res.error || 'Invalid or expired API key', 
          variant: 'destructive' 
        });
        setRawResponse(res.data || { success: false, error: res.error });
      }
    } catch (e) {
      console.error('[ZapierConnectionTest] Validation error:', e);
      setShowRaw(true);
      setRawResponse({ 
        success: false, 
        error: e instanceof Error ? e.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
      toast({
        title: 'Validation Error',
        description: 'Failed to validate API key. Check console for details.',
        variant: 'destructive'
      });
    }
  };

  const copyRawResponse = async () => {
    if (rawResponse) {
      await navigator.clipboard.writeText(JSON.stringify(rawResponse, null, 2));
      toast({ title: 'Copied', description: 'Raw response copied to clipboard' });
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
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'passed':
        return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">Passed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">Warning</Badge>;
      case 'pending':
        return <Badge variant="outline">Running...</Badge>;
    }
  };

  const calculateProgress = () => {
    if (!isRunningTests) return 0;
    const completedTests = testResults.filter(test => test.status !== 'pending').length;
    return (completedTests / 3) * 100;
  };

  const currentApiKey = selectedApiKey || manualApiKey;
  const apiKeyAnalysis = analyzeApiKey(currentApiKey);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Connection Status
          </CardTitle>
          <CardDescription>Current status of your Zapier integration</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                {isConnected ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                <span className="font-medium">Integration Status</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {isConnected ? 'Connected and ready' : 'Connection issues detected'}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-blue-500" />
                <span className="font-medium">Last Check</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {timeAgo(new Date())}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Connection Test Suite
          </CardTitle>
          <CardDescription>Run comprehensive tests to verify your integration health</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-2 block">Select API Key for Testing</label>
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
                      {key.key_name} ({key.id.substring(0, 8)}...)
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-sm text-muted-foreground">No active API keys found</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Or enter API Key manually</label>
              <Input
                type="password"
                placeholder="Enter API key or secret..."
                value={manualApiKey}
                onChange={(e) => {
                  setManualApiKey(e.target.value);
                  setSelectedApiKey('');
                }}
                className="w-full"
              />
            </div>

            {currentApiKey && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-900">Diagnostic Info</span>
                </div>
                <p className="text-sm text-blue-800">
                  API key detected as <strong>{apiKeyAnalysis.type}</strong> format, preview: <code>{apiKeyAnalysis.preview}</code>
                </p>
              </div>
            )}

            {!currentApiKey && (
              <p className="text-sm text-muted-foreground">Select an API key or paste a secret to run tests.</p>
            )}
          </div>

          <div className="flex gap-2">
            {isRunningTests ? (
              <Button disabled className="flex-1">
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Running Tests...
              </Button>
            ) : (
              <Button onClick={runComprehensiveTest} disabled={!currentApiKey} className="flex-1">
                <Zap className="mr-2 h-4 w-4" />
                Run Complete Test
              </Button>
            )}
            
            <Button 
              variant="outline" 
              onClick={handleValidateKey} 
              disabled={!currentApiKey || isRunningTests}
            >
              Validate API Key Only
            </Button>
          </div>

          {isRunningTests && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Test Progress</span>
                <span>{Math.round(calculateProgress())}%</span>
              </div>
              <Progress value={calculateProgress()} className="w-full" />
            </div>
          )}

          {testResults.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium">Test Results</h4>
              {testResults.map((result, index) => (
                <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                  {getStatusIcon(result.status)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{result.test}</span>
                      {getStatusBadge(result.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">{result.message}</p>
                    {result.details && (
                      <p className="text-xs text-muted-foreground mt-1 font-mono bg-gray-50 p-1 rounded">
                        {result.details}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Raw Response (Edge Function)
              </h4>
              <div className="flex gap-2">
                {rawResponse && (
                  <Button size="sm" variant="outline" onClick={copyRawResponse}>
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => setShowRaw(!showRaw)}>
                  {showRaw ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
                  {showRaw ? 'Hide' : 'Show'} Raw
                </Button>
              </div>
            </div>
            
            {showRaw && (
              <div className="border rounded-lg">
                <div className="bg-gray-50 px-3 py-2 border-b">
                  <span className="text-sm font-medium">Edge Function Response JSON</span>
                </div>
                <pre className="p-3 text-xs overflow-auto max-h-96 bg-white">
                  {rawResponse ? JSON.stringify(rawResponse, null, 2) : 'No response data yet - run a test to see results'}
                </pre>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest API calls and webhook deliveries</CardDescription>
        </CardHeader>
        <CardContent>
          {recentAnalyses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="font-medium">No recent activity</p>
              <p className="text-sm">Activity will appear here once you start using the integration</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentAnalyses.slice(0, 5).map((analysis, index) => (
                <div key={index} className="flex items-center gap-3 p-2 border rounded-lg">
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">Analysis Processed</p>
                    <p className="text-sm text-muted-foreground">
                      CRM data formatted and delivered
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {timeAgo(new Date())}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}