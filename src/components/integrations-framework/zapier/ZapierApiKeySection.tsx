import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Copy, Trash2, Eye, EyeOff, Key, Calendar, Activity } from 'lucide-react';
import { useZapierApiKeys } from '@/hooks/useZapier';
import { useToast } from '@/hooks/use-toast';
import { format, formatDistanceToNow } from 'date-fns';

export function ZapierApiKeySection() {
  const { apiKeys, generateApiKey, revokeApiKey, isGenerating, isRevoking } = useZapierApiKeys();
  const { toast } = useToast();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [selectedScopes, setSelectedScopes] = useState<string[]>(['read:analysis']);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  const availableScopes = [
    { value: 'read:analysis', label: 'Read Analysis Data', description: 'Access conversation analysis results' },
    { value: 'webhook:subscribe', label: 'Manage Webhooks', description: 'Create and manage webhook subscriptions' },
    { value: 'read:transcripts', label: 'Read Transcripts', description: 'Access transcript metadata' },
    { value: 'write:contacts', label: 'Write Contacts', description: 'Update contact match decisions' }
  ];

  const handleGenerateKey = async () => {
    if (!keyName.trim() || selectedScopes.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please provide a key name and select at least one scope.',
        variant: 'destructive'
      });
      return;
    }

    try {
      generateApiKey({
        keyName: keyName.trim(),
        scopes: selectedScopes
      });
      
      // The mutation will handle success/error via onSuccess/onError callbacks
      setKeyName('');
      setSelectedScopes(['read:analysis']);
      setShowCreateForm(false);
    } catch (error) {
      // Error handling is done in the mutation callbacks
      console.error('Generate key error:', error);
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    revokeApiKey(keyId);
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: 'Copied',
        description: `${label} copied to clipboard`,
      });
    } catch (error) {
      toast({
        title: 'Copy Failed',
        description: 'Failed to copy to clipboard',
        variant: 'destructive'
      });
    }
  };

  const toggleKeyVisibility = (keyId: string) => {
    setShowKeys(prev => ({ ...prev, [keyId]: !prev[keyId] }));
  };

  const maskKey = (key: string) => {
    if (!key) return '';
    return `${key.substring(0, 8)}${'*'.repeat(24)}${key.substring(key.length - 8)}`;
  };

  return (
    <div className="space-y-6">
      {/* Generated Key Display */}
      {generatedKey && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <Key className="h-5 w-5" />
              API Key Generated Successfully
            </CardTitle>
            <CardDescription className="text-green-700">
              Copy your API key now. For security reasons, you won't be able to see it again.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                value={generatedKey}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                onClick={() => copyToClipboard(generatedKey, 'API key')}
                size="icon"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-3"
              onClick={() => setGeneratedKey(null)}
            >
              I've copied the key
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create API Key Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Generate New API Key
          </CardTitle>
          <CardDescription>
            Create API keys to authenticate your Zapier integrations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!showCreateForm ? (
            <Button onClick={() => setShowCreateForm(true)} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Create API Key
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="key-name">API Key Name</Label>
                <Input
                  id="key-name"
                  placeholder="e.g., Salesforce Integration"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                />
              </div>

              <div className="space-y-3">
                <Label>Permissions</Label>
                <div className="space-y-2">
                  {availableScopes.map((scope) => (
                    <div key={scope.value} className="flex items-start space-x-3">
                      <Checkbox
                        id={scope.value}
                        checked={selectedScopes.includes(scope.value)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedScopes([...selectedScopes, scope.value]);
                          } else {
                            setSelectedScopes(selectedScopes.filter(s => s !== scope.value));
                          }
                        }}
                      />
                      <div className="space-y-1">
                        <Label htmlFor={scope.value} className="text-sm font-medium">
                          {scope.label}
                        </Label>
                        <p className="text-xs text-muted-foreground">{scope.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={handleGenerateKey}
                  disabled={isGenerating || !keyName.trim() || selectedScopes.length === 0}
                  className="flex-1"
                >
                  {isGenerating ? 'Generating...' : 'Generate API Key'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowCreateForm(false);
                    setKeyName('');
                    setSelectedScopes(['read:analysis']);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active API Keys */}
      <Card>
        <CardHeader>
          <CardTitle>Active API Keys</CardTitle>
          <CardDescription>
            Manage your existing API keys and monitor their usage
          </CardDescription>
        </CardHeader>
        <CardContent>
          {apiKeys.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No API keys created yet</p>
              <p className="text-sm">Create your first API key to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {apiKeys.map((key) => (
                <div key={key.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{key.key_name}</h4>
                        <Badge variant={key.is_active ? 'default' : 'secondary'}>
                          {key.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Created recently
                        </div>
                        {key.last_used && (
                          <div className="flex items-center gap-1">
                            <Activity className="h-3 w-3" />
                            Last used {formatDistanceToNow(new Date(key.last_used))} ago
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(key.id, 'API key ID')}
                        title="Copy API key ID"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="icon">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Revoke API Key</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently revoke the API key "{key.key_name}". 
                              Any integrations using this key will stop working immediately.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleRevokeKey(key.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              disabled={isRevoking}
                            >
                              {isRevoking ? 'Revoking...' : 'Revoke Key'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Scopes:</span>
                      <div className="flex flex-wrap gap-1">
                        {key.scopes?.map((scope) => (
                          <Badge key={scope} variant="outline" className="text-xs">
                            {scope}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Usage Count:</span>
                        <span className="ml-2 font-medium">{key.usage_count || 0}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Expires:</span>
                        <span className="ml-2 font-medium">
                          {key.expires_at ? format(new Date(key.expires_at), 'MMM d, yyyy') : 'Never'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}