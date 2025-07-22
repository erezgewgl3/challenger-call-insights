
import React, { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Zap, ArrowLeft } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ZoomUserConnection } from '@/components/integrations/zoom/ZoomUserConnection';

export default function UserIntegrations() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Force page refresh when returning from OAuth
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const fromOAuth = searchParams.get('from_oauth');
    const refreshData = searchParams.get('refresh');
    const isFromZoom = document.referrer.includes('zoom.us');
    
    if (fromOAuth === 'true' || refreshData === 'true' || isFromZoom) {
      console.log('Detected return from OAuth, waiting for DB commit...');
      
      // Clean up URL parameters immediately
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
      
      // Wait 2 seconds for database transaction to commit, then force page reload
      setTimeout(() => {
        console.log('Forcing page refresh to get fresh data...');
        window.location.reload();
      }, 2000);
    }
  }, [location.search]);

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
