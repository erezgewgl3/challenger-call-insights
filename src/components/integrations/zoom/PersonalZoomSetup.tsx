import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Video, ExternalLink, Settings, Shield, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface PersonalZoomSetupProps {
  onConnect: () => void;
  isConnecting: boolean;
}

export const PersonalZoomSetup: React.FC<PersonalZoomSetupProps> = ({ onConnect, isConnecting }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [setupMode, setSetupMode] = useState<'system' | 'personal'>('system');
  const [isSettingUpPersonal, setIsSettingUpPersonal] = useState(false);
  const [personalApp, setPersonalApp] = useState({
    client_id: '',
    client_secret: '',
    app_name: ''
  });

  const handleSystemConnect = async () => {
    // Try system-wide connection first
    onConnect();
  };

  const handlePersonalAppSave = async () => {
    if (!personalApp.client_id || !personalApp.client_secret) {
      toast({
        title: "Missing Information",
        description: "Please provide both Client ID and Client Secret",
        variant: "destructive",
      });
      return;
    }

    setIsSettingUpPersonal(true);
    try {
      // Store user's personal OAuth app credentials (encrypted)
      const { error } = await supabase.rpc('integration_framework_update_config', {
        user_uuid: user?.id,
        integration_type_param: 'zoom',
        config_key_param: 'user_oauth_app',
        config_value: {
          client_id: personalApp.client_id,
          client_secret: personalApp.client_secret,
          app_name: personalApp.app_name || 'Personal Zoom App',
          created_at: new Date().toISOString(),
          scopes: 'recording:read,user:read'
        }
      });

      if (error) throw error;

      // Mark that user is using personal app
      await supabase.rpc('integration_framework_update_config', {
        user_uuid: user?.id,
        integration_type_param: 'zoom',
        config_key_param: 'oauth_app_mode',
        config_value: { mode: 'personal' }
      });

      toast({
        title: "Personal App Configured",
        description: "Your Zoom app is ready. Click Connect to authorize access.",
      });

      // Reset form
      setPersonalApp({ client_id: '', client_secret: '', app_name: '' });
      
    } catch (error) {
      console.error('Error setting up personal app:', error);
      toast({
        title: "Setup Error",
        description: "Failed to save your OAuth app. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSettingUpPersonal(false);
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5 text-blue-600" />
          Connect Your Zoom Account
        </CardTitle>
        <CardDescription>
          Connect your Zoom account to automatically analyze meeting transcripts
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col">
        <Tabs value={setupMode} onValueChange={(value) => setSetupMode(value as 'system' | 'personal')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="system">Quick Connect</TabsTrigger>
            <TabsTrigger value="personal">Personal Setup</TabsTrigger>
          </TabsList>
          
          <TabsContent value="system" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">What you'll get:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Automatic transcript processing after meetings</li>
                  <li>• AI-powered meeting insights and analysis</li>
                  <li>• Sales coaching recommendations</li>
                  <li>• Follow-up suggestions and action items</li>
                </ul>
              </div>

              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs text-blue-700">
                  <strong>Privacy:</strong> Only you can access your meeting data. 
                  Your transcripts are processed securely and remain private to your account.
                </p>
              </div>

              <Button
                onClick={handleSystemConnect}
                disabled={isConnecting}
                className="w-full"
              >
                {isConnecting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Video className="h-4 w-4 mr-2" />
                )}
                Connect to Zoom
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="personal" className="space-y-4">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Set up your own Zoom OAuth app for maximum control and privacy. 
                Your credentials are encrypted and stored securely.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">Step 1: Create a Zoom OAuth App</h4>
                <p className="text-sm text-muted-foreground">
                  You'll need to create your own Zoom app to get the required credentials.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('https://marketplace.zoom.us/develop/create', '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Create Zoom App
                </Button>
                
                <div className="text-xs text-muted-foreground space-y-1 mt-2">
                  <p><strong>App Type:</strong> OAuth</p>
                  <p><strong>Scopes needed:</strong> user:read, recording:read</p>
                  <p><strong>Redirect URI:</strong> {window.location.origin}/integrations/callback</p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Step 2: Enter Your App Credentials</h4>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="app_name">App Name (optional)</Label>
                    <Input
                      id="app_name"
                      placeholder="My Zoom App"
                      value={personalApp.app_name}
                      onChange={(e) => setPersonalApp(prev => ({ ...prev, app_name: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="client_id">Client ID *</Label>
                    <Input
                      id="client_id"
                      placeholder="Your Zoom app Client ID"
                      value={personalApp.client_id}
                      onChange={(e) => setPersonalApp(prev => ({ ...prev, client_id: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="client_secret">Client Secret *</Label>
                    <Input
                      id="client_secret"
                      type="password"
                      placeholder="Your Zoom app Client Secret"
                      value={personalApp.client_secret}
                      onChange={(e) => setPersonalApp(prev => ({ ...prev, client_secret: e.target.value }))}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handlePersonalAppSave}
                  disabled={isSettingUpPersonal || !personalApp.client_id || !personalApp.client_secret}
                  variant="outline"
                >
                  {isSettingUpPersonal ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                  ) : (
                    <Settings className="h-4 w-4 mr-2" />
                  )}
                  Save OAuth App
                </Button>
                
                <Button
                  onClick={onConnect}
                  disabled={isConnecting}
                  className="flex-1"
                >
                  {isConnecting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Connect with Personal App
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};