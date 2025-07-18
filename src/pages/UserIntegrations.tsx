
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Zap } from 'lucide-react';
import { ZoomUserConnection } from '@/components/integrations/zoom/ZoomUserConnection';

export default function UserIntegrations() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Please log in to access integrations</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Your Integrations</h1>
        <p className="text-muted-foreground">
          Connect your accounts to automatically analyze your meetings and communications
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Available Integrations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <ZoomUserConnection />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Integration Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              <p>Your connected integrations and their activity will appear here.</p>
              <p className="mt-2">Connect an integration above to get started with automated transcript processing.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
