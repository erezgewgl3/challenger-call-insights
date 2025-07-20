
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function IntegrationCallback() {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing your connection...');

  useEffect(() => {
    processCallback();
  }, [location]);

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

      console.log('User OAuth callback successful:', result);
      setStatus('success');
      setMessage('Integration connected successfully!');
      
      // Redirect to user integrations page after 2 seconds
      setTimeout(() => {
        navigate('/integrations');
      }, 2000);

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
            <Button onClick={() => navigate('/integrations')}>
              Return to Integrations
            </Button>
          )}
          {status === 'success' && (
            <p className="text-sm text-gray-500">
              Redirecting you back to integrations...
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
