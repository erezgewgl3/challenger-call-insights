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
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if we have valid token and email parameters
    const validateToken = () => {
      const token = searchParams.get('token');
      const email = searchParams.get('email');
      
      if (!token || !email) {
        setIsValidToken(false);
        setError('Invalid reset link. Token or email parameter is missing.');
        return;
      }
      
      const validation = validateResetToken(token, email);
      if (!validation.valid) {
        setIsValidToken(false);
        setError(validation.error || 'Invalid or expired reset token.');
        return;
      }
      
      setIsValidToken(true);
    };

    validateToken();
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
      // Call the reset-password edge function to update password securely
      const { data: resetData, error: resetError } = await supabase.functions.invoke('reset-password', {
        body: {
          email,
          newPassword: password,
          token
        }
      });

      if (resetError) {
        console.error('Password update error:', resetError);
        setError(resetError.message || 'Failed to update password. Please try again.');
        return;
      }

      if (!resetData?.success) {
        setError('Failed to update password. Please try again.');
        return;
      }

      // Mark token as used
      markTokenAsUsed(token);

      toast({
        title: 'Password Updated',
        description: 'Your password has been successfully updated. You can now sign in with your new password.',
      });
      
      // Redirect to login after a short delay
      setTimeout(() => {
        navigate('/login');
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

  // Loading state while checking token
  if (isValidToken === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Validating reset token...</span>
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