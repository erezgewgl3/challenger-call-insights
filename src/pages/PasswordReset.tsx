import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { validateResetToken, markTokenAsUsed } from '@/utils/passwordResetUtils';

export default function PasswordReset() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isValidatingToken, setIsValidatingToken] = useState(true);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Secure token validation using database (guide rail implementation)
    const validateTokenSecurely = async () => {
      setIsValidatingToken(true);
      const token = searchParams.get('token');
      const email = searchParams.get('email');
      
      console.log('Starting secure token validation');
      
      if (!token || !email) {
        console.error('Missing token or email parameters');
        setIsValidToken(false);
        setError('Invalid reset link. Token or email parameter is missing.');
        setIsValidatingToken(false);
        return;
      }
      
      try {
        // Use secure database validation (guide rail)
        const validation = await validateResetToken(token, email);
        if (!validation.valid) {
          console.error('Token validation failed:', validation.error);
          setIsValidToken(false);
          setError(validation.error || 'Invalid or expired reset token.');
        } else {
          console.log('Token validated successfully');
          setIsValidToken(true);
          setError(null);
        }
      } catch (error) {
        console.error('Token validation error:', error);
        setIsValidToken(false);
        setError('Failed to validate reset token. Please try again.');
      }
      
      setIsValidatingToken(false);
    };

    validateTokenSecurely();
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const token = searchParams.get('token');
    const email = searchParams.get('email');
    
    if (!isValidToken || !token || !email) {
      setError('Invalid reset token. Please request a new password reset.');
      return;
    }

    // Validation
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Updating password via secure edge function');
      
      // Call the secure reset-password edge function (guide rail implementation)
      const { data: resetData, error: resetError } = await supabase.functions.invoke('reset-password', {
        body: {
          email,
          newPassword: password,
          token
        }
      });

      console.log('Password reset response:', { data: resetData, error: resetError });

      // Comprehensive error handling (guide rail)
      if (resetError) {
        console.error('Password update error:', resetError);
        
        // Handle specific error types (guide rail)
        if (resetError.message.includes('rate limit')) {
          setError('Too many password reset attempts. Please wait before trying again.');
        } else if (resetError.message.includes('expired')) {
          setError('Reset token has expired. Please request a new password reset.');
        } else {
          setError(resetError.message || 'Failed to update password. Please try again.');
        }
        return;
      }

      // Validate response structure (guide rail)
      if (!resetData || resetData.error) {
        console.error('Invalid response from password reset function:', resetData);
        setError(resetData?.error || 'Failed to update password. Please try again.');
        return;
      }

      if (!resetData.success) {
        console.error('Password update was not successful:', resetData);
        setError('Failed to update password. Please try again.');
        return;
      }

      console.log('Password updated successfully');

      // Mark token as used (dual cleanup for both database and localStorage)
      await markTokenAsUsed(token);

      // Success feedback (guide rail)
      toast({
        title: 'Password Updated Successfully',
        description: 'Your password has been securely updated. You can now sign in with your new password.',
      });
      
      // Secure redirect with cleanup (guide rail)
      setTimeout(() => {
        // Clear form data for security
        setPassword('');
        setConfirmPassword('');
        
        // Navigate to login
        navigate('/login', { replace: true });
      }, 2000);

    } catch (err) {
      console.error('Unexpected error during password update:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  // Loading state while securely validating token (guide rail)
  if (isValidatingToken || isValidToken === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Securely validating reset token...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Invalid token state
  if (!isValidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <AlertCircle className="h-12 w-12 text-destructive" />
            </div>
            <CardTitle>Invalid Reset Token</CardTitle>
            <CardDescription>
              This password reset token is invalid or has expired.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error || 'Please request a new password reset from the login page.'}
              </AlertDescription>
            </Alert>
            <Button 
              onClick={handleBackToLogin} 
              className="w-full"
              variant="outline"
            >
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <CheckCircle className="h-12 w-12 text-primary" />
          </div>
          <CardTitle>Reset Your Password</CardTitle>
          <CardDescription>
            Enter your new password below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your new password"
                disabled={isLoading}
                required
                minLength={8}
              />
              <p className="text-sm text-muted-foreground">
                Password must be at least 8 characters long
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your new password"
                disabled={isLoading}
                required
                minLength={8}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || !password || !confirmPassword}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Password
            </Button>

            <Button 
              type="button"
              variant="outline" 
              className="w-full" 
              onClick={handleBackToLogin}
              disabled={isLoading}
            >
              Back to Login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}