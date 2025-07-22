
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Zap, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ZoomUserConnection } from '@/components/integrations/zoom/ZoomUserConnection';

export default function UserIntegrations() {
  const { user } = useAuth();
  const navigate = useNavigate();

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
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
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
          <div className="space-y-4">
            <ZoomUserConnection />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
