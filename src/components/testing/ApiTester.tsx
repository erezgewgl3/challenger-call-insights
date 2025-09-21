import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ApiTestResult {
  endpoint: string;
  status: number;
  success: boolean;
  data?: any;
  error?: string;
  duration?: number;
}

const ApiTester: React.FC = () => {
  const [testResults, setTestResults] = useState<ApiTestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const { toast } = useToast();

  const addResult = (result: ApiTestResult) => {
    setTestResults(prev => [...prev, result]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  // Test Queue API endpoints
  const testQueueApis = async () => {
    const session = await supabase.auth.getSession();
    if (!session.data.session) {
      toast({
        title: "Authentication Error",
        description: "Please log in to test APIs",
        variant: "destructive"
      });
      return;
    }

    const token = session.data.session.access_token;
    const baseUrl = `https://jtunkyfoadoowpymibjr.supabase.co/functions/v1`;

    const queueTests = [
      {
        name: "get-transcript-queue (all)",
        url: `${baseUrl}/get-transcript-queue?assignment_type=all`,
      },
      {
        name: "get-transcript-queue (owned)",
        url: `${baseUrl}/get-transcript-queue?assignment_type=owned`,
      },
      {
        name: "get-transcript-queue (assigned)",
        url: `${baseUrl}/get-transcript-queue?assignment_type=assigned`,
      },
      {
        name: "get-transcript-queue (priority filter)",
        url: `${baseUrl}/get-transcript-queue?priority=urgent,high`,
      },
      {
        name: "get-transcript-queue (source filter)",
        url: `${baseUrl}/get-transcript-queue?source=zoho,zapier`,
      },
      {
        name: "get-transcript-queue (status filter)",
        url: `${baseUrl}/get-transcript-queue?status=pending,processing`,
      },
      {
        name: "get-transcript-queue (combined filters)",
        url: `${baseUrl}/get-transcript-queue?assignment_type=all&priority=high,urgent&source=manual,zoho`,
      }
    ];

    for (const test of queueTests) {
      try {
        const startTime = Date.now();
        const response = await fetch(test.url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();
        const duration = Date.now() - startTime;

        addResult({
          endpoint: test.name,
          status: response.status,
          success: response.ok,
          data,
          duration
        });
      } catch (error) {
        addResult({
          endpoint: test.name,
          status: 0,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  };

  // Test Assignment Action APIs
  const testAssignmentApis = async () => {
    const session = await supabase.auth.getSession();
    if (!session.data.session) return;

    const token = session.data.session.access_token;
    const baseUrl = `https://jtunkyfoadoowpymibjr.supabase.co/functions/v1`;

    // First, get available transcripts to test with
    const queueResponse = await fetch(`${baseUrl}/get-transcript-queue?assignment_type=all&status=pending,processing`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const queueData = await queueResponse.json();
    const assignedTranscripts = queueData.success ? queueData.queues.assigned : [];
    
    if (assignedTranscripts.length === 0) {
      addResult({
        endpoint: "assignment-actions (no test data)",
        status: 200,
        success: true,
        data: { message: "No assigned transcripts available for testing assignment actions" }
      });
      return;
    }

    const firstTranscript = assignedTranscripts[0];
    
    const assignmentTests = [
      {
        name: "queue-assignment-actions (accept)",
        payload: {
          action: "accept",
          transcript_id: firstTranscript.id,
          reason: "API Test - Accepting assignment"
        }
      },
      {
        name: "queue-assignment-actions (bulk_accept)",
        payload: {
          action: "bulk_accept",
          transcript_ids: assignedTranscripts.slice(0, 2).map((t: any) => t.id),
          reason: "API Test - Bulk accept"
        }
      }
    ];

    for (const test of assignmentTests) {
      try {
        const startTime = Date.now();
        const response = await fetch(`${baseUrl}/queue-assignment-actions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(test.payload)
        });

        const data = await response.json();
        const duration = Date.now() - startTime;

        addResult({
          endpoint: test.name,
          status: response.status,
          success: response.ok,
          data,
          duration
        });
      } catch (error) {
        addResult({
          endpoint: test.name,
          status: 0,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  };

  // Test Zapier Config APIs
  const testZapierApis = async () => {
    const baseUrl = `https://jtunkyfoadoowpymibjr.supabase.co/functions/v1`;

    const zapierTests = [
      {
        name: "zapier-config/test-connection",
        url: `${baseUrl}/zapier-config/test-connection`,
        method: 'GET'
      },
      {
        name: "zapier-config/field-discovery (zoho)",
        url: `${baseUrl}/zapier-config/field-discovery?format=zoho`,
        method: 'GET'
      },
      {
        name: "zapier-config/field-discovery (salesforce)",
        url: `${baseUrl}/zapier-config/field-discovery?format=salesforce`,
        method: 'GET'
      },
      {
        name: "zapier-config/sample-data",
        url: `${baseUrl}/zapier-config/sample-data`,
        method: 'GET'
      },
      {
        name: "zapier-config/queue-status",
        url: `${baseUrl}/zapier-config/queue-status`,
        method: 'GET'
      },
      {
        name: "zapier-config/webhook-test",
        url: `${baseUrl}/zapier-config/webhook-test`,
        method: 'POST',
        payload: {
          webhook_url: "https://httpbin.org/post",
          test_data: {
            test: true,
            timestamp: new Date().toISOString(),
            message: "API test from Sales Whisperer"
          }
        }
      }
    ];

    for (const test of zapierTests) {
      try {
        const startTime = Date.now();
        const response = await fetch(test.url, {
          method: test.method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: test.payload ? JSON.stringify(test.payload) : undefined
        });

        const data = await response.json();
        const duration = Date.now() - startTime;

        addResult({
          endpoint: test.name,
          status: response.status,
          success: response.ok,
          data,
          duration
        });
      } catch (error) {
        addResult({
          endpoint: test.name,
          status: 0,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    clearResults();
    
    toast({
      title: "API Testing Started",
      description: "Running comprehensive API endpoint tests..."
    });

    try {
      await testQueueApis();
      await testAssignmentApis();
      await testZapierApis();
      
      toast({
        title: "API Testing Completed",
        description: "All endpoint tests have been executed"
      });
    } catch (error) {
      toast({
        title: "Testing Error",
        description: "Some tests failed to complete",
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusBadge = (result: ApiTestResult) => {
    if (result.success) {
      return <Badge className="bg-green-500">Success ({result.status})</Badge>;
    } else if (result.status >= 400) {
      return <Badge variant="destructive">Error ({result.status})</Badge>;
    } else {
      return <Badge variant="secondary">Failed</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            🧪 API Endpoint Testing
            <div className="flex gap-2">
              <Button onClick={clearResults} variant="outline" size="sm">
                Clear Results
              </Button>
              <Button onClick={runAllTests} disabled={isRunning}>
                {isRunning ? "Running Tests..." : "Run All Tests"}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="results" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="results">Results ({testResults.length})</TabsTrigger>
              <TabsTrigger value="queue">Queue APIs</TabsTrigger>
              <TabsTrigger value="assignments">Assignment APIs</TabsTrigger>
              <TabsTrigger value="zapier">Zapier APIs</TabsTrigger>
            </TabsList>

            <TabsContent value="results" className="space-y-4">
              <ScrollArea className="h-[600px]">
                {testResults.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No test results yet. Click "Run All Tests" to begin.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {testResults.map((result, index) => (
                      <Card key={index}>
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm">{result.endpoint}</CardTitle>
                            <div className="flex items-center gap-2">
                              {result.duration && (
                                <Badge variant="outline">{result.duration}ms</Badge>
                              )}
                              {getStatusBadge(result)}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <ScrollArea className="h-32">
                            <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                              {result.error ? 
                                `Error: ${result.error}` : 
                                JSON.stringify(result.data, null, 2)
                              }
                            </pre>
                          </ScrollArea>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="queue" className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">Queue Management API Tests</h3>
                <p className="text-sm text-muted-foreground">
                  Testing get-transcript-queue endpoint with various filters:
                </p>
                <ul className="text-sm space-y-1 ml-4">
                  <li>• Assignment type filtering (owned, assigned, all)</li>
                  <li>• Priority filtering (urgent, high, normal, low)</li>
                  <li>• Source filtering (manual, zoom, zapier, zoho)</li>
                  <li>• Status filtering (pending, processing, completed)</li>
                  <li>• Combined filter scenarios</li>
                </ul>
                <Button onClick={testQueueApis} disabled={isRunning} size="sm">
                  Test Queue APIs Only
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="assignments" className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">Assignment Action API Tests</h3>
                <p className="text-sm text-muted-foreground">
                  Testing queue-assignment-actions endpoint:
                </p>
                <ul className="text-sm space-y-1 ml-4">
                  <li>• Single assignment accept/reject</li>
                  <li>• Bulk assignment operations</li>
                  <li>• Error handling for invalid requests</li>
                </ul>
                <Button onClick={testAssignmentApis} disabled={isRunning} size="sm">
                  Test Assignment APIs Only
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="zapier" className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">Zapier Config API Tests</h3>
                <p className="text-sm text-muted-foreground">
                  Testing zapier-config endpoints:
                </p>
                <ul className="text-sm space-y-1 ml-4">
                  <li>• Connection testing</li>
                  <li>• Field discovery for different CRM formats</li>
                  <li>• Sample data provision</li>
                  <li>• Queue status reporting</li>
                  <li>• Webhook delivery testing</li>
                </ul>
                <Button onClick={testZapierApis} disabled={isRunning} size="sm">
                  Test Zapier APIs Only
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApiTester;