
import React, { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Zap, ArrowLeft } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ZoomUserConnection } from '@/components/integrations/zoom/ZoomUserConnection';
import { ZapierIntegrationManager } from '@/components/integrations-framework/ZapierIntegrationManager';
import { useQueryClient } from '@tanstack/react-query';
import { invalidateZoomConnection } from '@/hooks/useZoomConnection';

export default function UserIntegrations() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  // Handle OAuth return by invalidating cache
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const fromOAuth = searchParams.get('from_oauth');
    const refreshData = searchParams.get('refresh');
    
    if (fromOAuth === 'true' || refreshData === 'true') {
      console.log('Detected return from OAuth, invalidating cache...');
      
      // Invalidate Zoom connection cache to trigger fresh data fetch
      if (user?.id) {
        invalidateZoomConnection(queryClient, user.id);
      }
      
      // Clean up URL parameters
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }, [location.search, user?.id, queryClient]);

  // Handle back button click - invalidate cache before navigation
  const handleBackClick = () => {
    console.log('Invalidating Zoom connection cache before navigation');
    if (user?.id) {
      invalidateZoomConnection(queryClient, user.id);
    }
    navigate('/dashboard');
  };

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
