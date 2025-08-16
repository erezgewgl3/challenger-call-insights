import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Copy, Eye, EyeOff, MoreHorizontal, Plus, Trash2, RotateCcw, Calendar, Activity } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useZapierApiKeys } from "@/hooks/useZapier";
import { toast } from "@/hooks/use-toast";
import { ZapierApiKey } from "@/types/zapier";

interface ZapierApiKeyManagerProps {
  className?: string;
}

export function ZapierApiKeyManager({ className }: ZapierApiKeyManagerProps) {
  const { apiKeys, generateApiKey, revokeApiKey, isGenerating, isRevoking } = useZapierApiKeys();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showRevokeDialog, setShowRevokeDialog] = useState<string | null>(null);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [newKeyData, setNewKeyData] = useState({
    name: '',
    scopes: ['read:analysis', 'webhook:subscribe'] as string[]
  });

  const handleCreateKey = () => {
    if (!newKeyData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a name for the API key",
        variant: "destructive"
      });
      return;
    }

    generateApiKey({
      keyName: newKeyData.name,
      scopes: newKeyData.scopes
    });

    setNewKeyData({ name: '', scopes: ['read:analysis', 'webhook:subscribe'] });
    setShowCreateDialog(false);
  };

  const handleRevokeKey = (keyId: string) => {
    revokeApiKey(keyId);
    setShowRevokeDialog(null);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
      variant: "default"
    });
  };

  const toggleKeyVisibility = (keyId: string) => {
    const newVisible = new Set(visibleKeys);
    if (newVisible.has(keyId)) {
      newVisible.delete(keyId);
    } else {
      newVisible.add(keyId);
    }
    setVisibleKeys(newVisible);
  };

  const maskApiKey = (key: string) => {
    return `sk_${'*'.repeat(20)}${key.slice(-4)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getExpirationStatus = (expiresAt: string) => {
    const expiry = new Date(expiresAt);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) return { status: 'expired', color: 'destructive', text: 'Expired' };
    if (daysUntilExpiry <= 7) return { status: 'expiring', color: 'warning', text: `${daysUntilExpiry}d left` };
    if (daysUntilExpiry <= 30) return { status: 'soon', color: 'secondary', text: `${daysUntilExpiry}d left` };
    return { status: 'active', color: 'default', text: 'Active' };
  };

  const availableScopes = [
    { id: 'read:analysis', name: 'Read Analysis Data', description: 'Access conversation analysis results' },
    { id: 'webhook:subscribe', name: 'Manage Webhooks', description: 'Create and manage webhook subscriptions' },
    { id: 'write:contacts', name: 'Write Contact Matches', description: 'Submit contact match decisions' },
    { id: 'read:transcripts', name: 'Read Transcripts', description: 'Access transcript metadata' }
  ];

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>API Key Management</CardTitle>
          <CardDescription>
            Generate and manage API keys for Zapier integration
          </CardDescription>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Generate Key
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Generate New API Key</DialogTitle>
              <DialogDescription>
                Create a new API key for your Zapier integration. Choose the appropriate scopes for your use case.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="key-name">Key Name</Label>
                <Input
                  id="key-name"
                  placeholder="e.g., Production Zapier Integration"
                  value={newKeyData.name}
                  onChange={(e) => setNewKeyData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              
              <div className="space-y-3">
                <Label>Permissions</Label>
                {availableScopes.map((scope) => (
                  <div key={scope.id} className="flex items-start space-x-3">
                    <Checkbox
                      id={scope.id}
                      checked={newKeyData.scopes.includes(scope.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setNewKeyData(prev => ({
                            ...prev,
                            scopes: [...prev.scopes, scope.id]
                          }));
                        } else {
                          setNewKeyData(prev => ({
                            ...prev,
                            scopes: prev.scopes.filter(s => s !== scope.id)
                          }));
                        }
                      }}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label
                        htmlFor={scope.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {scope.name}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {scope.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateKey} disabled={isGenerating}>
                {isGenerating ? "Generating..." : "Generate Key"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      
      <CardContent>
        {apiKeys.length === 0 ? (
          <div className="text-center py-8">
            <div className="mx-auto w-12 h-12 bg-muted rounded-lg flex items-center justify-center mb-4">
              <Plus className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No API Keys</h3>
            <p className="text-muted-foreground mb-4">
              Generate your first API key to start using Zapier integration
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Generate First Key
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {apiKeys.map((key: ZapierApiKey) => {
              const expiration = getExpirationStatus(key.expires_at);
              const isVisible = visibleKeys.has(key.id);
              
              return (
                <div
                  key={key.id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{key.key_name}</h4>
                        <Badge variant={expiration.color as any}>
                          {expiration.text}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Created {formatDate(key.created_at)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Activity className="h-3 w-3" />
                          {key.usage_count} requests
                        </div>
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => toggleKeyVisibility(key.id)}>
                          {isVisible ? (
                            <>
                              <EyeOff className="h-4 w-4 mr-2" />
                              Hide Key
                            </>
                          ) : (
                            <>
                              <Eye className="h-4 w-4 mr-2" />
                              Show Key
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => copyToClipboard(
                            isVisible ? key.api_key_hash : maskApiKey(key.api_key_hash), 
                            'API Key'
                          )}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Key
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setShowRevokeDialog(key.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Revoke Key
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">API Key</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleKeyVisibility(key.id)}
                      >
                        {isVisible ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      </Button>
                    </div>
                    <div className="font-mono text-sm bg-muted p-2 rounded border">
                      {isVisible ? key.api_key_hash : maskApiKey(key.api_key_hash)}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    {key.scopes.map((scope, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {scope}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Rate limit: {key.rate_limit_per_hour}/hour</span>
                    <span>
                      Last used: {key.last_used ? formatDate(key.last_used) : 'Never'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Revoke Confirmation Dialog */}
        <AlertDialog open={!!showRevokeDialog} onOpenChange={(open) => !open && setShowRevokeDialog(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Revoke API Key</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. The API key will be permanently deactivated 
                and any Zapier integrations using this key will stop working.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => showRevokeDialog && handleRevokeKey(showRevokeDialog)}
                disabled={isRevoking}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isRevoking ? "Revoking..." : "Revoke Key"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}