import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Zap, 
  Settings, 
  Key, 
  Globe, 
  TestTube, 
  ExternalLink, 
  BookOpen,
  CheckCircle,
  AlertCircle,
  Clock
} from "lucide-react";
import { ZapierIntegrationCard } from "./ZapierIntegrationCard";
import { ZapierApiKeyManager } from "./ZapierApiKeyManager";
import { ZapierWebhookMonitor } from "./ZapierWebhookMonitor";
import { ZapierTestPanel } from "./ZapierTestPanel";
import { useZapierIntegration } from "@/hooks/useZapier";

interface ZapierIntegrationManagerProps {
  className?: string;
}

export function ZapierIntegrationManager({ className }: ZapierIntegrationManagerProps) {
  const [showFullManager, setShowFullManager] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const { isSetupComplete, setupStatus, apiKeys, webhooks, connection } = useZapierIntegration();

  const getSetupProgress = () => {
    let completed = 0;
    let total = 3;
    
    if (apiKeys.apiKeys.length > 0) completed++;
    if (webhooks.webhooks.length > 0) completed++;
    if (connection.isConnected) completed++;
    
    return { completed, total, percentage: Math.round((completed / total) * 100) };
  };

  const progress = getSetupProgress();

  const setupSteps = [
    {
      key: 'api-key',
      title: 'Generate API Key',
      description: 'Create authentication credentials for Zapier',
      completed: apiKeys.apiKeys.length > 0,
      icon: Key
    },
    {
      key: 'webhook',
      title: 'Create Webhooks',
      description: 'Set up triggers for automated workflows',
      completed: webhooks.webhooks.length > 0,
      icon: Globe
    },
    {
      key: 'testing',
      title: 'Test Connection',
      description: 'Verify integration is working correctly',
      completed: connection.isConnected,
      icon: TestTube
    }
  ];

  const documentationSections = [
    {
      title: "Quick Start Guide",
      description: "Get up and running with Zapier in 5 minutes",
      items: [
        "Generate your first API key",
        "Create a test webhook in Zapier",
        "Connect to your favorite apps",
        "Test the integration"
      ]
    },
    {
      title: "Available Triggers",
      description: "Events that can trigger your Zaps",
      items: [
        "Analysis Completed - When transcript analysis finishes",
        "Hot Deal Identified - When AI detects high-priority opportunities",
        "Follow-up Required - When action items are recommended",
        "Participant Matched - When contacts are matched to CRM",
        "Deal Stage Changed - When opportunity stages are updated"
      ]
    },
    {
      title: "Common Use Cases",
      description: "Popular automation scenarios",
      items: [
        "Auto-create CRM records from analysis results",
        "Send Slack notifications for hot deals",
        "Update deal stages in your CRM automatically",
        "Generate follow-up tasks in project management tools",
        "Send email summaries to team members"
      ]
    }
  ];

  return (
    <>
      <ZapierIntegrationCard 
        onOpenManager={() => setShowFullManager(true)}
        className={className}
      />

      <Dialog open={showFullManager} onOpenChange={setShowFullManager}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-orange-500" />
              Zapier Integration Manager
            </DialogTitle>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="api-keys">API Keys</TabsTrigger>
              <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
              <TabsTrigger value="testing">Testing</TabsTrigger>
              <TabsTrigger value="docs">Documentation</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Setup Progress */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Setup Progress</CardTitle>
                    <CardDescription>
                      Complete these steps to activate your Zapier integration
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span>Progress</span>
                      <span className="font-medium">{progress.completed}/{progress.total} steps</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all" 
                        style={{ width: `${progress.percentage}%` }}
                      />
                    </div>
                    
                    <div className="space-y-3">
                      {setupSteps.map((step) => {
                        const Icon = step.icon;
                        return (
                          <div key={step.key} className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${
                              step.completed ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                            }`}>
                              {step.completed ? (
                                <CheckCircle className="h-4 w-4" />
                              ) : (
                                <Icon className="h-4 w-4" />
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-sm">{step.title}</div>
                              <div className="text-xs text-muted-foreground">{step.description}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Current Status */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Current Status</CardTitle>
                    <CardDescription>
                      Overview of your integration health
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Integration Status</span>
                        <Badge variant={isSetupComplete ? "default" : "secondary"}>
                          {isSetupComplete ? "Active" : "Setup Required"}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm">API Keys</span>
                        <span className="font-medium">{apiKeys.apiKeys.length} active</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Webhooks</span>
                        <span className="font-medium">{webhooks.webhooks.length} configured</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Connection</span>
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${
                            connection.isConnected ? 'bg-green-500' : 'bg-red-500'
                          }`} />
                          <span className="text-sm">
                            {connection.isConnected ? 'Connected' : 'Disconnected'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {!isSetupComplete && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          {setupStatus.message}
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                  <CardDescription>
                    Common tasks to manage your Zapier integration
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button 
                      variant="outline" 
                      className="h-20 flex-col gap-2"
                      onClick={() => setActiveTab("api-keys")}
                    >
                      <Key className="h-5 w-5" />
                      <span>Manage API Keys</span>
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="h-20 flex-col gap-2"
                      onClick={() => setActiveTab("webhooks")}
                    >
                      <Globe className="h-5 w-5" />
                      <span>Configure Webhooks</span>
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="h-20 flex-col gap-2"
                      onClick={() => window.open('https://zapier.com/apps/sales-whisperer', '_blank')}
                    >
                      <ExternalLink className="h-5 w-5" />
                      <span>Open in Zapier</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="api-keys">
              <ZapierApiKeyManager />
            </TabsContent>

            <TabsContent value="webhooks">
              <ZapierWebhookMonitor />
            </TabsContent>

            <TabsContent value="testing">
              <ZapierTestPanel />
            </TabsContent>

            <TabsContent value="docs" className="space-y-6">
              <div className="text-center mb-6">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Zapier Integration Documentation</h2>
                <p className="text-muted-foreground">
                  Everything you need to know to get the most out of your Zapier integration
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {documentationSections.map((section, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="text-lg">{section.title}</CardTitle>
                      <CardDescription>{section.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {section.items.map((item, itemIndex) => (
                          <li key={itemIndex} className="flex items-start gap-2 text-sm">
                            <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Need Help?</CardTitle>
                  <CardDescription>
                    Additional resources and support options
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button 
                      variant="outline" 
                      className="justify-start"
                      onClick={() => window.open('https://zapier.com/help', '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Zapier Help Center
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="justify-start"
                      onClick={() => window.open('https://zapier.com/apps/sales-whisperer', '_blank')}
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Sales Whisperer App Page
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}