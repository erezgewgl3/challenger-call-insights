
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Zap, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ZoomUserConnection } from '@/components/integrations/zoom/ZoomUserConnection';
import { ZapierIntegrationManager } from '@/components/integrations-framework/ZapierIntegrationManager';

export default function UserIntegrations() {
  const navigate = useNavigate();

  const handleBackClick = () => {
    navigate('/dashboard');
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={handleBackClick}
          className="mb-4 hover:bg-muted"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold mb-2">Your Integrations</h1>
        <p className="text-muted-foreground">
          Connect your accounts to automatically analyze your meetings and communications
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Available Integrations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <div className="h-full">
              <ZoomUserConnection />
            </div>
            <div className="h-full">
              <ZapierIntegrationManager />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
