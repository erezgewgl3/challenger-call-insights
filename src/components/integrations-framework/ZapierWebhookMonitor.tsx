import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Globe, 
  Plus, 
  Trash2, 
  TestTube, 
  Activity, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  ExternalLink,
  MoreHorizontal,
  RefreshCw
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useZapierWebhooks, useZapierApiKeys } from "@/hooks/useZapier";
import { toast } from "@/hooks/use-toast";
import { ZapierWebhook, ZapierTriggerType } from "@/types/zapier";

interface ZapierWebhookMonitorProps {
  className?: string;
}

// Mock webhook logs for demonstration
const mockWebhookLogs = [
  {
    id: '1',
    webhook_id: 'wh_1',
    trigger_data: { analysis_id: 'analysis_123', trigger_type: 'analysis_completed' },
    delivery_status: 'delivered' as const,
    http_status_code: 200,
    response_body: '{"success": true}',
    error_message: null,
    attempt_count: 1,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    delivered_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '2',
    webhook_id: 'wh_1',
    trigger_data: { analysis_id: 'analysis_124', trigger_type: 'hot_deal_identified' },
    delivery_status: 'failed' as const,
    http_status_code: 404,
    response_body: '{"error": "Endpoint not found"}',
    error_message: 'Webhook endpoint returned 404',
    attempt_count: 3,
    created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    delivered_at: null
  }
];

export function ZapierWebhookMonitor({ className }: ZapierWebhookMonitorProps) {
  const { 
    webhooks, 
    subscribeWebhook, 
    unsubscribeWebhook, 
    testWebhook, 
    isSubscribing, 
    isUnsubscribing, 
    isTesting 
  } = useZapierWebhooks();
  const { apiKeys } = useZapierApiKeys();
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null);
  const [newWebhookData, setNewWebhookData] = useState({
    api_key_id: '',
    trigger_type: '' as ZapierTriggerType,
    webhook_url: '',
    secret_token: ''
  });

  const triggerTypes = [
    { value: 'analysis_completed', label: 'Analysis Completed', description: 'Triggered when a transcript analysis is finished' },
    { value: 'hot_deal_identified', label: 'Hot Deal Identified', description: 'Triggered when AI identifies a high-priority deal' },
    { value: 'follow_up_required', label: 'Follow-up Required', description: 'Triggered when follow-up actions are recommended' },
    { value: 'participant_matched', label: 'Participant Matched', description: 'Triggered when participants are matched to CRM contacts' },
    { value: 'deal_stage_changed', label: 'Deal Stage Changed', description: 'Triggered when deal stage is updated' }
  ];

  const handleCreateWebhook = () => {
    if (!newWebhookData.api_key_id || !newWebhookData.trigger_type || !newWebhookData.webhook_url) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    // Basic URL validation
    try {
      new URL(newWebhookData.webhook_url);
    } catch {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid webhook URL",
        variant: "destructive"
      });
      return;
    }

    subscribeWebhook(newWebhookData);
    setNewWebhookData({
      api_key_id: '',
      trigger_type: '' as ZapierTriggerType,
      webhook_url: '',
      secret_token: ''
    });
    setShowCreateDialog(false);
  };

  const handleDeleteWebhook = (webhookId: string) => {
    unsubscribeWebhook(webhookId);
    setShowDeleteDialog(null);
  };

  const handleTestWebhook = (webhookId: string) => {
    testWebhook(webhookId);
  };

  const calculateSuccessRate = (webhook: ZapierWebhook) => {
    const total = webhook.success_count + webhook.failure_count;
    return total > 0 ? Math.round((webhook.success_count / total) * 100) : 0;
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Webhook Monitor</CardTitle>
          <CardDescription>
            Monitor webhook delivery status and manage subscriptions
          </CardDescription>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Webhook
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Webhook</DialogTitle>
              <DialogDescription>
                Set up a webhook to receive real-time notifications from Sales Whisperer.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="api-key">API Key</Label>
                <Select
                  value={newWebhookData.api_key_id}
                  onValueChange={(value) => setNewWebhookData(prev => ({ ...prev, api_key_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an API key" />
                  </SelectTrigger>
                  <SelectContent>
                    {apiKeys.map((key) => (
                      <SelectItem key={key.id} value={key.id}>
                        {key.key_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="trigger-type">Trigger Type</Label>
                <Select
                  value={newWebhookData.trigger_type}
                  onValueChange={(value) => setNewWebhookData(prev => ({ ...prev, trigger_type: value as ZapierTriggerType }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select trigger type" />
                  </SelectTrigger>
                  <SelectContent>
                    {triggerTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div>
                          <div className="font-medium">{type.label}</div>
                          <div className="text-xs text-muted-foreground">{type.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="webhook-url">Webhook URL</Label>
                <Input
                  id="webhook-url"
                  placeholder="https://hooks.zapier.com/hooks/catch/..."
                  value={newWebhookData.webhook_url}
                  onChange={(e) => setNewWebhookData(prev => ({ ...prev, webhook_url: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="secret-token">Secret Token (Optional)</Label>
                <Input
                  id="secret-token"
                  placeholder="Optional webhook signature validation"
                  value={newWebhookData.secret_token}
                  onChange={(e) => setNewWebhookData(prev => ({ ...prev, secret_token: e.target.value }))}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateWebhook} disabled={isSubscribing}>
                {isSubscribing ? "Creating..." : "Create Webhook"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="active">Active Webhooks</TabsTrigger>
            <TabsTrigger value="logs">Delivery Logs</TabsTrigger>
          </TabsList>
          
          <TabsContent value="active" className="space-y-4">
            {webhooks.length === 0 ? (
              <div className="text-center py-8">
                <div className="mx-auto w-12 h-12 bg-muted rounded-lg flex items-center justify-center mb-4">
                  <Globe className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No Webhooks</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first webhook to start receiving real-time notifications
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Webhook
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {webhooks.map((webhook: ZapierWebhook) => {
                  const successRate = calculateSuccessRate(webhook);
                  const triggerType = triggerTypes.find(t => t.value === webhook.trigger_type);
                  
                  return (
                    <div
                      key={webhook.id}
                      className="border rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{triggerType?.label || webhook.trigger_type}</h4>
                            <Badge variant={webhook.is_active ? "default" : "secondary"}>
                              {webhook.is_active ? "Active" : "Inactive"}
                            </Badge>
                            <Badge 
                              variant={successRate >= 90 ? "default" : successRate >= 70 ? "secondary" : "destructive"}
                            >
                              {successRate}% success
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {triggerType?.description}
                          </p>
                        </div>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={() => handleTestWebhook(webhook.id)}
                              disabled={isTesting}
                            >
                              <TestTube className="h-4 w-4 mr-2" />
                              Test Webhook
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => window.open(webhook.webhook_url, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Open URL
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setShowDeleteDialog(webhook.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="text-sm">
                          <span className="font-medium">URL: </span>
                          <span className="font-mono text-xs break-all">{webhook.webhook_url}</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="font-medium text-green-600">{webhook.success_count}</div>
                          <div className="text-muted-foreground">Successful</div>
                        </div>
                        <div>
                          <div className="font-medium text-red-600">{webhook.failure_count}</div>
                          <div className="text-muted-foreground">Failed</div>
                        </div>
                        <div>
                          <div className="font-medium">
                            {webhook.last_triggered ? formatRelativeTime(webhook.last_triggered) : 'Never'}
                          </div>
                          <div className="text-muted-foreground">Last triggered</div>
                        </div>
                      </div>
                      
                      {webhook.last_error && (
                        <div className="rounded-lg bg-destructive/10 p-2">
                          <div className="flex items-center gap-2 text-sm text-destructive font-medium">
                            <AlertCircle className="h-4 w-4" />
                            Last Error
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{webhook.last_error}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="logs" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Recent Deliveries</h3>
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
            
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {mockWebhookLogs.map((log) => (
                  <div
                    key={log.id}
                    className="border rounded-lg p-3 space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(log.delivery_status)}
                        <span className="font-medium capitalize">
                          {log.delivery_status}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {log.trigger_data.trigger_type}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatRelativeTime(log.created_at)}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="font-medium">Status Code: </span>
                        <span className={log.http_status_code === 200 ? "text-green-600" : "text-red-600"}>
                          {log.http_status_code || 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">Attempts: </span>
                        <span>{log.attempt_count}</span>
                      </div>
                    </div>
                    
                    {log.error_message && (
                      <div className="text-xs text-destructive bg-destructive/10 p-2 rounded">
                        {log.error_message}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!showDeleteDialog} onOpenChange={(open) => !open && setShowDeleteDialog(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Webhook</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. The webhook will be permanently deleted 
                and will stop receiving notifications.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => showDeleteDialog && handleDeleteWebhook(showDeleteDialog)}
                disabled={isUnsubscribing}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isUnsubscribing ? "Deleting..." : "Delete Webhook"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}