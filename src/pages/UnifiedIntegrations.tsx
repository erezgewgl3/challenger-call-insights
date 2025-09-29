import React from 'react';
import { UnifiedIntegrationManager } from '@/components/integrations-framework/UnifiedIntegrationManager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Settings, Zap, Video } from 'lucide-react';

export default function UnifiedIntegrations() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
        <p className="text-muted-foreground">
          Connect your favorite tools and automate your sales workflow with unified integration management.
        </p>
      </div>

      {/* Quick Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="relative overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center space-x-2">
              <Video className="h-5 w-5 text-blue-500" />
              <CardTitle className="text-lg">Video Platforms</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-2">
              Automatically capture and analyze meeting transcripts
            </CardDescription>
            <div className="flex items-center gap-2">
              <Badge variant="outline">Zoom</Badge>
              <Badge variant="secondary">Auto-sync</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-orange-500" />
              <CardTitle className="text-lg">Automation</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-2">
              Connect 5,000+ apps through workflow automation
            </CardDescription>
            <div className="flex items-center gap-2">
              <Badge variant="outline">Zapier</Badge>
              <Badge variant="secondary">Webhooks</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-dashed">
          <CardHeader className="pb-2">
            <div className="flex items-center space-x-2">
              <Settings className="h-5 w-5 text-gray-400" />
              <CardTitle className="text-lg text-muted-foreground">Coming Soon</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-2">
              More integrations coming soon including CRM platforms
            </CardDescription>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-muted-foreground">
                Salesforce
              </Badge>
              <Badge variant="outline" className="text-muted-foreground">
                HubSpot
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Integration Manager */}
      <UnifiedIntegrationManager />
    </div>
  );
}