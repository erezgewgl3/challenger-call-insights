import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  TestTube, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Copy, 
  Send,
  AlertCircle,
  Zap,
  Globe,
  Code
} from "lucide-react";
import { useZapierConnection, useZapierWebhooks, useZapierData, useZapierApiKeys } from "@/hooks/useZapier";
import { toast } from "@/hooks/use-toast";

interface ZapierTestPanelProps {
  className?: string;
}

export function ZapierTestPanel({ className }: ZapierTestPanelProps) {
  const { connectionStatus, testConnection, isTesting } = useZapierConnection();
  const { webhooks, testWebhook, isTesting: isTestingWebhook } = useZapierWebhooks();
  const { recentAnalyses } = useZapierData();
  const { apiKeys } = useZapierApiKeys();
  
  const [customWebhookUrl, setCustomWebhookUrl] = useState('');
  const [customPayload, setCustomPayload] = useState('');
  const [selectedAnalysis, setSelectedAnalysis] = useState('');
  const [testResults, setTestResults] = useState<Array<{
    id: string;
    type: string;
    status: 'success' | 'error' | 'pending';
    message: string;
    timestamp: Date;
  }>>([]);
  const [selectedApiKey, setSelectedApiKey] = useState('');
  const [manualApiKey, setManualApiKey] = useState('');
  const [rawResponse, setRawResponse] = useState<any | null>(null);
  const [showRaw, setShowRaw] = useState(false);

  useEffect(() => {
    if (apiKeys.length > 0 && !selectedApiKey && !manualApiKey) {
      const firstActive = apiKeys.find(k => k.is_active);
      if (firstActive) setSelectedApiKey(firstActive.id);
    }
  }, [apiKeys, selectedApiKey, manualApiKey]);

  const addTestResult = (type: string, status: 'success' | 'error' | 'pending', message: string) => {
    const result = {
      id: Date.now().toString(),
      type,
      status,
      message,
      timestamp: new Date()
    };
    setTestResults(prev => [result, ...prev.slice(0, 9)]); // Keep last 10 results
  };

  const handleConnectionTest = async () => {
    const testApiKey = selectedApiKey || manualApiKey;
    if (!testApiKey) {
      toast({
        title: "API Key Required",
        description: "Select an API key or enter one manually.",
        variant: "destructive"
      });
      return;
    }

    addTestResult('connection', 'pending', 'Testing connection...');
    setRawResponse(null);
    setShowRaw(false);

    const result = await testConnection(testApiKey);
    const success = Boolean(result && (result as any).success !== false && !('error' in (result as any)));
    const message = (result as any)?.data?.message || (result as any)?.error || (success ? 'Connection test passed' : 'Connection test failed');

    addTestResult('connection', success ? 'success' : 'error', message);
    if ((result as any)?.data) setRawResponse((result as any).data);
  };
    
    // Add result based on connection status
    setTimeout(() => {
      if (connectionStatus.status === 'connected') {
        addTestResult('connection', 'success', 'Connection test passed');
      } else {
        addTestResult('connection', 'error', connectionStatus.error || 'Connection test failed');
      }
    }, 1000);
  };

  const handleWebhookTest = async (webhookId: string) => {
    const webhook = webhooks.find(w => w.id === webhookId);
    if (!webhook) return;

    addTestResult('webhook', 'pending', `Testing webhook: ${webhook.trigger_type}`);
    testWebhook(webhookId);
    
    // Simulate test result
    setTimeout(() => {
      addTestResult('webhook', 'success', `Webhook test sent to ${webhook.webhook_url}`);
    }, 2000);
  };

  const handleCustomWebhookTest = async () => {
    if (!customWebhookUrl.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a webhook URL",
        variant: "destructive"
      });
      return;
    }

    try {
      new URL(customWebhookUrl);
    } catch {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid webhook URL",
        variant: "destructive"
      });
      return;
    }

    addTestResult('custom-webhook', 'pending', 'Sending custom webhook...');
    
    try {
      const payload = customPayload ? JSON.parse(customPayload) : {
        test: true,
        timestamp: new Date().toISOString(),
        message: "Test webhook from Sales Whisperer"
      };

      const response = await fetch(customWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'no-cors', // Handle CORS for external webhooks
        body: JSON.stringify(payload)
      });

      addTestResult('custom-webhook', 'success', `Webhook sent to ${customWebhookUrl}`);
    } catch (error) {
      addTestResult('custom-webhook', 'error', `Failed to send webhook: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const copyTestPayload = (analysisId: string) => {
    const analysis = recentAnalyses.find(a => a.analysis_id === analysisId);
    if (!analysis) return;

    const payload = {
      trigger_type: 'analysis_completed',
      user_id: 'test_user',
      analysis_id: analysisId,
      timestamp: new Date().toISOString(),
      data: analysis
    };

    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    toast({
      title: "Copied!",
      description: "Test payload copied to clipboard",
      variant: "default"
    });
  };

  const samplePayloads = {
    analysis_completed: {
      trigger_type: 'analysis_completed',
      user_id: 'user_123',
      analysis_id: 'analysis_456',
      timestamp: new Date().toISOString(),
      data: {
        deal_intelligence: {
          heat_level: 'hot',
          priority_score: 85,
          next_action: 'Schedule follow-up call'
        },
        conversation_insights: {
          key_takeaways: ['Budget confirmed', 'Decision maker identified'],
          challenger_scores: { teaching: 4, tailoring: 3, control: 5 }
        }
      }
    },
    hot_deal_identified: {
      trigger_type: 'hot_deal_identified',
      user_id: 'user_123',
      analysis_id: 'analysis_789',
      timestamp: new Date().toISOString(),
      data: {
        priority_score: 95,
        heat_level: 'hot',
        recommended_actions: ['Send proposal', 'Schedule decision call'],
        urgency_indicators: ['Budget approved', 'Timeline confirmed']
      }
    }
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Loader2 className="h-4 w-4 text-yellow-500 animate-spin" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Connection Testing
        </CardTitle>
        <CardDescription>
          Test your Zapier integration setup and webhook deliveries
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="connection" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="connection">Connection</TabsTrigger>
            <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
            <TabsTrigger value="custom">Custom Test</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
          </TabsList>
          
          <TabsContent value="connection" className="space-y-4">
            <div className="space-y-4">
              <Alert>
                <Zap className="h-4 w-4" />
                <AlertDescription>
                  Test your basic connection to Sales Whisperer's Zapier services.
                </AlertDescription>
              </Alert>
              
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Connection Status</h4>
                    <p className="text-sm text-muted-foreground">
                      Verify your authentication and API access
                    </p>
                  </div>
                  <Badge 
                    variant={
                      connectionStatus.status === 'connected' ? 'default' :
                      connectionStatus.status === 'error' ? 'destructive' : 'secondary'
                    }
                  >
                    {connectionStatus.status}
                  </Badge>
                </div>
                
                {connectionStatus.lastTested && (
                  <p className="text-xs text-muted-foreground">
                    Last tested: {connectionStatus.lastTested.toLocaleString()}
                  </p>
                )}
                
                {connectionStatus.error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{connectionStatus.error}</AlertDescription>
                  </Alert>
                )}

                {/* API Key Selection */}
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Select API Key for Testing</Label>
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
                        {apiKeys.filter(k => k.is_active).map(k => (
                          <option key={k.id} value={k.id}>
                            {k.key_name} ({k.id})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-sm text-muted-foreground">No active API keys found</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Or enter API Key manually</Label>
                    <Input
                      type="text"
                      placeholder="Enter API Key ID or Secret..."
                      value={manualApiKey}
                      onChange={(e) => {
                        setManualApiKey(e.target.value);
                        setSelectedApiKey('');
                      }}
                    />
                  </div>
                </div>
                
                <Button 
                  onClick={handleConnectionTest} 
                  disabled={isTesting || (!selectedApiKey && !manualApiKey)}
                  className="w-full"
                >
                  {isTesting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Testing Connection...
                    </>
                  ) : (
                    <>
                      <TestTube className="h-4 w-4 mr-2" />
                      Test Connection
                    </>
                  )}
                </Button>

                {/* Raw response toggle */}
                {rawResponse && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Raw response</span>
                      <Button variant="secondary" size="sm" onClick={() => setShowRaw(!showRaw)}>
                        {showRaw ? 'Hide' : 'Show'} raw
                      </Button>
                    </div>
                    {showRaw && (
                      <pre className="max-h-64 overflow-auto rounded-md border p-3 text-xs">
                        {JSON.stringify(rawResponse, null, 2)}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="webhooks" className="space-y-4">
            <Alert>
              <Globe className="h-4 w-4" />
              <AlertDescription>
                Test your configured webhooks by sending sample payloads.
              </AlertDescription>
            </Alert>
            
            {webhooks.length === 0 ? (
              <div className="text-center py-8">
                <Globe className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No webhooks configured</p>
                <p className="text-xs text-muted-foreground">Create a webhook first to test it</p>
              </div>
            ) : (
              <div className="space-y-3">
                {webhooks.map((webhook) => (
                  <div key={webhook.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium">{webhook.trigger_type}</h4>
                        <p className="text-xs text-muted-foreground break-all">
                          {webhook.webhook_url}
                        </p>
                      </div>
                      <Badge variant={webhook.is_active ? "default" : "secondary"}>
                        {webhook.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    
                    <Button
                      onClick={() => handleWebhookTest(webhook.id)}
                      disabled={isTestingWebhook || !webhook.is_active}
                      size="sm"
                      className="w-full"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Send Test
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="custom" className="space-y-4">
            <Alert>
              <Code className="h-4 w-4" />
              <AlertDescription>
                Send custom webhook payloads to any URL for testing.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="webhook-url">Webhook URL</Label>
                <Input
                  id="webhook-url"
                  placeholder="https://hooks.zapier.com/hooks/catch/..."
                  value={customWebhookUrl}
                  onChange={(e) => setCustomWebhookUrl(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="payload">Custom Payload (JSON)</Label>
                  <div className="flex gap-2">
                    <Select
                      onValueChange={(value) => {
                        const payload = samplePayloads[value as keyof typeof samplePayloads];
                        setCustomPayload(JSON.stringify(payload, null, 2));
                      }}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Load sample" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="analysis_completed">Analysis Completed</SelectItem>
                        <SelectItem value="hot_deal_identified">Hot Deal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Textarea
                  id="payload"
                  placeholder="Leave empty for default test payload"
                  value={customPayload}
                  onChange={(e) => setCustomPayload(e.target.value)}
                  rows={8}
                  className="font-mono text-sm"
                />
              </div>
              
              {recentAnalyses.length > 0 && (
                <div className="space-y-2">
                  <Label>Use Real Analysis Data</Label>
                  <div className="flex gap-2">
                    <Select onValueChange={setSelectedAnalysis}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select analysis" />
                      </SelectTrigger>
                      <SelectContent>
                        {recentAnalyses.slice(0, 5).map((analysis) => (
                          <SelectItem key={analysis.analysis_id} value={analysis.analysis_id}>
                            Analysis {analysis.analysis_id.slice(-8)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      onClick={() => selectedAnalysis && copyTestPayload(selectedAnalysis)}
                      disabled={!selectedAnalysis}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
              
              <Button 
                onClick={handleCustomWebhookTest}
                className="w-full"
                disabled={!customWebhookUrl.trim()}
              >
                <Send className="h-4 w-4 mr-2" />
                Send Custom Webhook
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="results" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Test Results</h3>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setTestResults([])}
                disabled={testResults.length === 0}
              >
                Clear Results
              </Button>
            </div>
            
            {testResults.length === 0 ? (
              <div className="text-center py-8">
                <TestTube className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No test results yet</p>
                <p className="text-xs text-muted-foreground">Run some tests to see results here</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {testResults.map((result) => (
                  <div
                    key={result.id}
                    className="border rounded-lg p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(result.status)}
                        <span className="font-medium capitalize">{result.type}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatTimestamp(result.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{result.message}</p>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}