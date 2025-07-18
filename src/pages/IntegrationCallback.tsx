import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

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
      const integrationId = searchParams.get('integration_id');

      console.log('Callback parameters:', { code, state, error, integrationId });

      if (error) {
        setStatus('error');
        setMessage(`Connection failed: ${error}`);
        return;
      }

      if (code && state && integrationId) {
        setStatus('success');
        setMessage('Integration connected successfully!');
        
        setTimeout(() => {
          navigate('/integrations');
        }, 2000);
      } else {
        setStatus('error');
        setMessage('Invalid callback parameters. Missing required data.');
      }
    } catch (err) {
      console.error('Callback processing error:', err);
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