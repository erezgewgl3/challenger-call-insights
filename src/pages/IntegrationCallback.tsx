import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { invalidateZoomConnection } from '@/hooks/useZoomConnection';

export default function IntegrationCallback() {
  console.log('=== CALLBACK PAGE LOADED ===');
  console.log('URL:', window.location.href);
  console.log('Search params:', window.location.search);
  
  const location = useLocation();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing your connection...');
  const [isProcessed, setIsProcessed] = useState(false);

  useEffect(() => {
    console.log('=== CALLBACK USEEFFECT RUNNING ===');
    const searchParams = new URLSearchParams(location.search);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    console.log('Code:', code);
    console.log('State:', state);
    console.log('Error:', error);
    
    // Handle explicit OAuth error first
    if (error) {
      console.log('OAuth error detected:', error);
      setStatus('error');
      setMessage(`Connection failed: ${error}`);
      return;
    }
    
    // If we don't have required params or already processed, redirect
    if (!code || !state || isProcessed) {
      console.log('Missing params or already processed, redirecting...');
      window.location.replace('/integrations');
      return;
    }

    // Process the valid OAuth callback
    console.log('Valid OAuth callback detected, processing...');
    setIsProcessed(true);
    processCallback();
  }, [location, isProcessed]);

  const processCallback = async () => {
    try {
      const searchParams = new URLSearchParams(location.search);
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');

      // Handle OAuth error (user cancelled, permission denied, etc.)
      if (error) {
        setStatus('error');
        setMessage(`Connection failed: ${error}`);
        return;
      }

      // Validate required parameters
      if (!code || !state) {
        setStatus('error');
        setMessage('Invalid callback parameters. Missing required data.');
        return;
      }

      // Extract integration_id from state parameter (format: userId:integrationId:timestamp)
      let integrationId;
      try {
        const decodedState = decodeURIComponent(state);
        const stateParts = decodedState.split(':');
        if (stateParts.length >= 2) {
          integrationId = stateParts[1]; // integration_id is the second part
        }
      } catch (err) {
        console.error('Failed to parse state parameter:', err);
      }

      console.log('User callback parameters:', { 
        code: code?.substring(0, 10) + '...', 
        state, 
        integrationId,
        error 
      });

      if (!integrationId) {
        setStatus('error');
        setMessage('Invalid callback parameters. Could not extract integration ID from state.');
        return;
      }

      // Call the integration-callback Edge Function to process the OAuth callback
      console.log('Calling integration-callback Edge Function for user integration');
      const { data: result, error: callbackError } = await supabase.functions.invoke(
        'integration-callback',
        {
          body: {
            code,
            state,
            integration_id: integrationId,
          },
        }
      );

      if (callbackError) {
        console.error('User callback error:', callbackError);
        setStatus('error');
        setMessage(callbackError.message || 'Failed to process connection');
        return;
      }

      console.log('Edge Function completed successfully:', result);
      
      // Check if the Edge Function actually succeeded
      if (result?.success) {
        console.log('Connection created successfully:', result.connection_id);
        
        // Invalidate Zoom connection cache to ensure all components update immediately
        invalidateZoomConnection(queryClient, user?.id);
        
        // Redirect based on user role after database write is complete
        const redirectPath = user?.role === 'admin' ? '/admin/integrations' : '/integrations';
        window.location.replace(window.location.origin + redirectPath);
      } else {
        console.error('Edge Function returned failure:', result);
        setStatus('error');
        setMessage(result?.error || 'Integration connection failed');
      }

    } catch (err) {
      console.error('User callback processing error:', err);
      setStatus('error');
      setMessage('Failed to process connection');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center justify-center gap-2">
            {status === 'loading' && <Loader2 className="w-5 h-5 animate-spin" />}
            {status === 'success' && <CheckCircle className="w-5 h-5 text-green-600" />}
            {status === 'error' && <XCircle className="w-5 h-5 text-red-600" />}
            {status === 'loading' && 'Processing...'}
            {status === 'success' && 'Success!'}
            {status === 'error' && 'Error'}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-gray-600 mb-4">{message}</p>
          {status === 'error' && (
            <Button onClick={() => window.location.replace('/integrations')}>
              Return to Integrations
            </Button>
          )}
          {status === 'success' && (
            <p className="text-sm text-gray-500">
              Redirecting to integrations page...
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
