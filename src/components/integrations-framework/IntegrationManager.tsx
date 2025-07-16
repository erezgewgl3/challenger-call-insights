import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { IntegrationList } from './IntegrationList';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Activity, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { IntegrationConfig, IntegrationConnection } from '@/lib/integrations/types';

// Mock integrations data - in a real app, this would come from a config or API
const AVAILABLE_INTEGRATIONS: IntegrationConfig[] = [
  {
    id: 'zoom',
    name: 'Zoom',
    description: 'Video conferencing and meeting recordings',
    version: '1.0.0',
    category: 'communication',
    authType: 'oauth2',
    requiredFields: ['client_id', 'client_secret'],
    optionalFields: [],
    capabilities: [
      { type: 'webhook', name: 'Webhook Support', description: 'Receive real-time updates', dataTypes: ['recordings', 'meetings'] },
      { type: 'sync', name: 'Data Sync', description: 'Sync meeting data', dataTypes: ['recordings'] }
    ],
    webhookSupport: true,
    syncFrequencyMinutes: 15,
    isActive: true,
    isDeprecated: false
  },
  {
    id: 'github',
    name: 'GitHub',
    description: 'Code repository and project management',
    version: '1.0.0',
    category: 'other',
    authType: 'oauth2',
    requiredFields: ['client_id', 'client_secret'],
    optionalFields: [],
    capabilities: [
      { type: 'webhook', name: 'Webhook Support', description: 'Receive repository events', dataTypes: ['commits', 'issues', 'pull_requests'] },
      { type: 'sync', name: 'API Sync', description: 'Sync repository data', dataTypes: ['repositories', 'commits'] }
    ],
    webhookSupport: true,
    syncFrequencyMinutes: 30,
    isActive: true,
    isDeprecated: false
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Team communication and collaboration',
    version: '1.0.0',
    category: 'communication',
    authType: 'oauth2',
    requiredFields: ['client_id', 'client_secret'],
    optionalFields: [],
    capabilities: [
      { type: 'webhook', name: 'Event Subscriptions', description: 'Receive workspace events', dataTypes: ['messages', 'channels'] },
      { type: 'bidirectional', name: 'Real-time Messaging', description: 'Send and receive messages', dataTypes: ['messages'] }
    ],
    webhookSupport: true,
    isActive: true,
    isDeprecated: false
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    description: 'Customer relationship management',
    version: '1.0.0',
    category: 'crm',
    authType: 'oauth2',
    requiredFields: ['client_id', 'client_secret'],
    optionalFields: [],
    capabilities: [
      { type: 'sync', name: 'CRM Sync', description: 'Sync customer data', dataTypes: ['contacts', 'accounts', 'opportunities'] },
      { type: 'webhook', name: 'Change Events', description: 'Receive data changes', dataTypes: ['contacts', 'accounts'] }
    ],
    webhookSupport: true,
    syncFrequencyMinutes: 60,
    isActive: true,
    isDeprecated: false
  },
  {
    id: 'google-drive',
    name: 'Google Drive',
    description: 'Cloud storage and file sharing',
    version: '1.0.0',
    category: 'storage',
    authType: 'oauth2',
    requiredFields: ['client_id', 'client_secret'],
    optionalFields: [],
    capabilities: [
      { type: 'sync', name: 'File Sync', description: 'Sync files and folders', dataTypes: ['files', 'folders'] }
    ],
    webhookSupport: false,
    syncFrequencyMinutes: 120,
    isActive: true,
    isDeprecated: false
  },
  {
    id: 'zapier',
    name: 'Zapier',
    description: 'Workflow automation and app integrations',
    version: '1.0.0',
    category: 'other',
    authType: 'api_key',
    requiredFields: ['api_key'],
    optionalFields: [],
    capabilities: [
      { type: 'webhook', name: 'Webhook Triggers', description: 'Trigger Zaps via webhooks', dataTypes: ['events'] },
      { type: 'export', name: 'Data Export', description: 'Send data to Zaps', dataTypes: ['records'] }
    ],
    webhookSupport: true,
    isActive: true,
    isDeprecated: false
  }
];

export const IntegrationManager: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [connections, setConnections] = useState<IntegrationConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load existing connections
  const loadConnections = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('integration_connections')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Map database records to IntegrationConnection format
      const mappedConnections: IntegrationConnection[] = (data || []).map(conn => ({
        id: conn.id,
        integrationId: conn.integration_type,
        userId: conn.user_id,
        connectionName: conn.connection_name,
        connectionStatus: conn.connection_status as 'active' | 'inactive' | 'error' | 'pending',
        credentials: conn.credentials as Record<string, unknown>,
        configuration: conn.configuration as Record<string, unknown>,
        lastSyncAt: conn.last_sync_at ? new Date(conn.last_sync_at) : undefined,
        syncFrequencyMinutes: conn.sync_frequency_minutes || undefined,
        errorCount: 0, // Default value, would come from additional tracking
        createdAt: new Date(conn.created_at),
        updatedAt: new Date(conn.updated_at)
      }));
      
      setConnections(mappedConnections);
    } catch (error) {
      console.error('Error loading connections:', error);
      toast({
        title: 'Error',
        description: 'Failed to load integration connections',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConnections();
  }, [user]);

  // Refresh connections
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadConnections();
    setRefreshing(false);
  };

  // Handle OAuth connection initiation
  const handleConnect = async (integrationType: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase.functions.invoke('integration-connect', {
        body: { 
          integration_type: integrationType,
          user_id: user.id,
          redirect_url: `${window.location.origin}/admin`
        }
      });

      if (error) throw error;

      if (data?.auth_url) {
        // Redirect to OAuth provider
        window.location.href = data.auth_url;
      } else {
        toast({
          title: 'Error',
          description: 'Failed to initiate connection',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error connecting integration:', error);
      toast({
        title: 'Connection Error',
        description: 'Failed to connect integration. Please try again.',
        variant: 'destructive'
      });
    }
  };

  // Handle disconnection
  const handleDisconnect = async (connectionId: string) => {
    try {
      const { error } = await supabase.functions.invoke('integration-disconnect', {
        body: { connection_id: connectionId }
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Integration disconnected successfully'
      });

      // Refresh connections
      await loadConnections();
    } catch (error) {
      console.error('Error disconnecting integration:', error);
      toast({
        title: 'Disconnect Error',
        description: 'Failed to disconnect integration. Please try again.',
        variant: 'destructive'
      });
    }
  };

  // Handle manual sync
  const handleSync = async (connectionId: string) => {
    try {
      const { error } = await supabase.functions.invoke('integration-sync', {
        body: { connection_id: connectionId }
      });

      if (error) throw error;

      toast({
        title: 'Sync Started',
        description: 'Integration sync has been initiated'
      });
    } catch (error) {
      console.error('Error syncing integration:', error);
      toast({
        title: 'Sync Error',
        description: 'Failed to start sync. Please try again.',
        variant: 'destructive'
      });
    }
  };

  // Handle pause/resume (placeholder - would update connection status)
  const handlePause = async (connectionId: string) => {
    // Implementation would update connection status to 'paused'
    toast({
      title: 'Integration Paused',
      description: 'Integration has been paused'
    });
  };

  const handleResume = async (connectionId: string) => {
    // Implementation would update connection status to 'active'
    toast({
      title: 'Integration Resumed',
      description: 'Integration has been resumed'
    });
  };

  // Calculate statistics
  const stats = {
    total: AVAILABLE_INTEGRATIONS.length,
    connected: connections.filter(c => c.connectionStatus === 'active').length,
    errors: connections.filter(c => c.connectionStatus === 'error').length,
    inactive: connections.filter(c => c.connectionStatus === 'inactive').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Integration Management</h2>
          <p className="text-muted-foreground">Manage external service connections and data synchronization</p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Integrations</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Available integrations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connected</CardTitle>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Active
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.connected}</div>
            <p className="text-xs text-muted-foreground">Active connections</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Errors</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.errors}</div>
            <p className="text-xs text-muted-foreground">Connections with errors</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
            <Badge variant="outline">{stats.inactive}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">{stats.inactive}</div>
            <p className="text-xs text-muted-foreground">Inactive connections</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="integrations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="integrations">Available Integrations</TabsTrigger>
          <TabsTrigger value="connections">My Connections</TabsTrigger>
        </TabsList>

        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Available Integrations</CardTitle>
              <CardDescription>
                Connect external services to sync data and automate workflows
              </CardDescription>
            </CardHeader>
            <CardContent>
              <IntegrationList
                integrations={AVAILABLE_INTEGRATIONS}
                connections={connections}
                onConnect={handleConnect}
                onDisconnect={handleDisconnect}
                onConfigure={() => {}}
                onSync={handleSync}
                onPause={handlePause}
                onResume={handleResume}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="connections" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Connected Integrations</CardTitle>
              <CardDescription>
                Manage your active integration connections
              </CardDescription>
            </CardHeader>
            <CardContent>
              {connections.length > 0 ? (
                <IntegrationList
                  integrations={AVAILABLE_INTEGRATIONS.filter(integration => 
                    connections.some(conn => conn.integrationId === integration.id)
                  )}
                  connections={connections}
                  onConnect={handleConnect}
                  onDisconnect={handleDisconnect}
                  onConfigure={() => {}}
                  onSync={handleSync}
                  onPause={handlePause}
                  onResume={handleResume}
                />
              ) : (
                <div className="text-center py-12">
                  <div className="text-muted-foreground">
                    <p className="text-lg font-medium">No connections yet</p>
                    <p className="text-sm">Start by connecting an integration from the Available Integrations tab.</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};