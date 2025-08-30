import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Webhook, Trash2, TestTube, Clock, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { useZapierIntegration } from '@/hooks/useZapier';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

const triggerTypes = [
  { value: 'analysis_completed', label: 'Analysis Completed', description: 'Triggered when a conversation analysis is finished' },
  { value: 'hot_deal_identified', label: 'Hot Deal Identified', description: 'Triggered when a deal is marked as high-priority' },
  { value: 'follow_up_required', label: 'Follow-up Required', description: 'Triggered when immediate follow-up is recommended' },
  { value: 'participant_matched', label: 'Participant Matched', description: 'Triggered when a participant is matched to a CRM contact' }
];

export function ZapierWebhookSection() {
  const { webhooks, apiKeys, setupStatus } = useZapierIntegration();
  const { subscribeWebhook, unsubscribeWebhook, testWebhook, isSubscribing, isUnsubscribing, isTesting } = webhooks;
  const { toast } = useToast();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [triggerType, setTriggerType] = useState<string>('');

  const validateWebhookUrl = (url: string): boolean => {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const handleSubscribeWebhook = async () => {
    if (!webhookUrl.trim() || !triggerType) {
      toast({
        title: 'Validation Error',
        description: 'Please provide a valid HTTPS webhook URL and select a trigger type.',
        variant: 'destructive'
      });
      return;
    }

    if (!validateWebhookUrl(webhookUrl)) {
      toast({
        title: 'Invalid URL',
        description: 'Webhook URL must be a valid HTTPS URL.',
        variant: 'destructive'
      });
      return;
    }

    // Find first active API key with webhook:subscribe scope
    const validApiKey = apiKeys.apiKeys.find(key => 
      key.is_active && key.scopes?.includes('webhook:subscribe')
    );

    if (!validApiKey) {
      toast({
        title: 'No Valid API Key',
        description: 'Please generate an API key with webhook:subscribe permissions first.',
        variant: 'destructive'
      });
      return;
    }

    subscribeWebhook({
      api_key_id: validApiKey.id,
      webhook_url: webhookUrl.trim(),
      trigger_type: triggerType
    });
    
    setWebhookUrl('');
    setTriggerType('');
    setShowCreateForm(false);
  };

  const handleUnsubscribeWebhook = async (webhookId: string) => {
    unsubscribeWebhook(webhookId);
  };

  const handleTestWebhook = async (webhookId: string) => {
    testWebhook(webhookId);
  };

  const getSuccessRate = (webhook: any) => {
    const total = webhook.success_count + webhook.failure_count;
    if (total === 0) return 0;
    return Math.round((webhook.success_count / total) * 100);
  };

  const truncateUrl = (url: string, maxLength: number = 40) => {
    if (url.length <= maxLength) return url;
    return `${url.substring(0, maxLength - 3)}...`;
  };

  return (
    <div className="space-y-6">
      {/* Create Webhook Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New Webhook
          </CardTitle>
          <CardDescription>
            Subscribe to events and automatically trigger your Zapier workflows
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {setupStatus.step === 'api-key' ? (
            <div className="text-center py-4 text-muted-foreground">
              <p className="mb-2">{setupStatus.message}</p>
              <p className="text-sm">Go to the API Keys tab to generate your first API key.</p>
            </div>
          ) : !showCreateForm ? (
            <Button onClick={() => setShowCreateForm(true)} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Create Webhook
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="webhook-url">Webhook URL</Label>
                <Input
                  id="webhook-url"
                  type="url"
                  placeholder="https://hooks.zapier.com/hooks/catch/..."
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Must be a valid HTTPS URL. Get this from your Zapier webhook trigger.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="trigger-type">Trigger Event</Label>
                <Select value={triggerType} onValueChange={setTriggerType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select when to trigger this webhook" />
                  </SelectTrigger>
                  <SelectContent>
                    {triggerTypes.map((trigger) => (
                      <SelectItem key={trigger.value} value={trigger.value}>
                        <div className="space-y-1">
                          <div className="font-medium">{trigger.label}</div>
                          <div className="text-xs text-muted-foreground">{trigger.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={handleSubscribeWebhook}
                  disabled={isSubscribing || !webhookUrl.trim() || !triggerType}
                  className="flex-1"
                >
                  {isSubscribing ? 'Creating...' : 'Subscribe Webhook'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowCreateForm(false);
                    setWebhookUrl('');
                    setTriggerType('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Webhooks */}
      <Card>
        <CardHeader>
          <CardTitle>Active Webhooks</CardTitle>
          <CardDescription>
            Monitor and manage your webhook subscriptions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {webhooks.webhooks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Webhook className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No webhooks configured yet</p>
              <p className="text-sm">Create your first webhook to start automating workflows</p>
            </div>
          ) : (
            <div className="space-y-4">
              {webhooks.webhooks.map((webhook) => {
                const successRate = getSuccessRate(webhook);
                const statusColor = webhook.is_active ? 
                  (successRate >= 90 ? 'text-green-600' : successRate >= 70 ? 'text-yellow-600' : 'text-red-600') :
                  'text-gray-400';
                
                return (
                  <div key={webhook.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{truncateUrl(webhook.webhook_url)}</h4>
                          <Badge variant={webhook.is_active ? 'default' : 'secondary'}>
                            {webhook.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                          <Badge variant="outline">
                            {triggerTypes.find(t => t.value === webhook.trigger_type)?.label || webhook.trigger_type}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {triggerTypes.find(t => t.value === webhook.trigger_type)?.description}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleTestWebhook(webhook.id)}
                          disabled={isTesting}
                          title="Test webhook"
                        >
                          <TestTube className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => window.open(webhook.webhook_url, '_blank')}
                          title="Open webhook URL"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="icon">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Webhook</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete this webhook subscription. 
                                Your Zapier workflow will stop receiving events.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleUnsubscribeWebhook(webhook.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                disabled={isUnsubscribing}
                              >
                                {isUnsubscribing ? 'Deleting...' : 'Delete Webhook'}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-muted-foreground">Success:</span>
                        <span className="font-medium">{webhook.success_count || 0}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-500" />
                        <span className="text-muted-foreground">Failed:</span>
                        <span className="font-medium">{webhook.failure_count || 0}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${statusColor.replace('text-', 'bg-')}`} />
                        <span className="text-muted-foreground">Rate:</span>
                        <span className={`font-medium ${statusColor}`}>{successRate}%</span>
                      </div>
                    </div>

                    {webhook.last_triggered && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        Last triggered {formatDistanceToNow(new Date(webhook.last_triggered))} ago
                      </div>
                    )}

                    {webhook.last_error && (
                      <div className="p-2 bg-red-50 border border-red-200 rounded text-sm">
                        <span className="font-medium text-red-800">Last Error:</span>
                        <span className="text-red-700 ml-2">{webhook.last_error}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}