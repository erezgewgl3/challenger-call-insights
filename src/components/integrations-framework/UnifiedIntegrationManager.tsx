import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Settings, Activity, TrendingUp } from 'lucide-react';
import { IntegrationList } from './IntegrationList';
import { IntegrationCard } from './IntegrationCard';
import { ZoomUserConnection } from '../integrations/zoom/ZoomUserConnection';
import { ZapierIntegrationManager } from './ZapierIntegrationManager';
import { toast } from '@/hooks/use-toast';

interface ConnectionStats {
  total_connections: number;
  active_connections: number;
  total_users: number;
  webhook_success_rate: number;
}

interface IntegrationData {
  id: string;
  name: string;
  description: string;
  category: string;
  status: string;
  capabilities: string[];
  webhook_events: string[];
  stats: {
    total_connections: number;
    active_connections: number;
    unique_users: number;
  };
  webhook_stats: {
    total_webhooks: number;
    successful_webhooks: number;
    failed_webhooks: number;
  };
}

export function UnifiedIntegrationManager() {
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null);

  // Fetch integration registry
  const { data: registryData, isLoading, error } = useQuery({
    queryKey: ['integration-registry'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_integration_registry');
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch user's connections
  const { data: userConnections, refetch: refetchConnections } = useQuery({
    queryKey: ['user-integration-connections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('integration_connections')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const handleConnect = async (integrationId: string) => {
    console.log('Connecting to integration:', integrationId);
    
    if (integrationId === 'zoom') {
      // Trigger Zoom OAuth flow
      window.location.href = '/integrations/zoom/connect';
    } else if (integrationId === 'zapier') {
      setSelectedIntegration('zapier');
    }
  };

  const handleDisconnect = async (connectionId: string) => {
    try {
      const { error } = await supabase.rpc('integration_framework_delete_connection', {
        connection_id: connectionId
      });

      if (error) throw error;

      toast({
        title: "Integration Disconnected",
        description: "The integration has been successfully disconnected.",
      });

      refetchConnections();
    } catch (error) {
      console.error('Disconnect error:', error);
      toast({
        title: "Error",
        description: "Failed to disconnect integration. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleConfigure = (connectionId: string) => {
    // Open configuration modal or navigate to settings
    console.log('Configure connection:', connectionId);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <span>Failed to load integrations. Please try again.</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const integrations = registryData?.integrations || {};
  const systemStats: ConnectionStats = registryData?.system_stats || {
    total_connections: 0,
    active_connections: 0,
    total_users: 0,
    webhook_success_rate: 0
  };

  // Convert registry data to IntegrationConfig format
  const integrationConfigs = Object.values(integrations).map((integration: any) => ({
    id: integration.id,
    name: integration.name,
    description: integration.description,
    version: '1.0.0',
    category: integration.category,
    authType: 'oauth2' as const,
    requiredFields: [],
    optionalFields: [],
    capabilities: integration.capabilities.map((cap: string) => ({
      type: cap,
      name: cap.replace('_', ' '),
      description: `${cap} capability`,
      dataTypes: ['transcript']
    })),
    webhookSupport: true,
    isActive: integration.status === 'active',
    isDeprecated: false
  }));

  // Convert user connections to IntegrationConnection format
  const connectionData = userConnections?.map(conn => ({
    id: conn.id,
    integrationId: conn.integration_type,
    userId: conn.user_id,
    connectionName: conn.connection_name,
    connectionStatus: conn.connection_status,
    credentials: conn.credentials,
    configuration: conn.configuration,
    lastSyncAt: conn.last_sync_at,
    nextSyncAt: null,
    syncFrequencyMinutes: conn.sync_frequency_minutes,
    lastError: conn.last_error,
    errorCount: conn.error_count || 0,
    createdAt: new Date(conn.created_at),
    updatedAt: new Date(conn.updated_at)
  })) || [];

  return (
    <div className="space-y-6">
      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Connections</p>
                <p className="text-xl font-bold">{systemStats.total_connections}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-xl font-bold">{systemStats.active_connections}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-xl font-bold">{systemStats.webhook_success_rate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Users</p>
                <p className="text-xl font-bold">{systemStats.total_users}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Integration Management */}
      <Tabs defaultValue="available" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="available">Available Integrations</TabsTrigger>
          <TabsTrigger value="connected">My Connections</TabsTrigger>
          <TabsTrigger value="monitor">Health Monitor</TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="space-y-4">
          <IntegrationList
            integrations={integrationConfigs}
            connections={connectionData}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
            onConfigure={handleConfigure}
          />
        </TabsContent>

        <TabsContent value="connected" className="space-y-4">
          {connectionData.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No integrations connected yet.</p>
                <Button 
                  className="mt-4"
                  onClick={() => setSelectedIntegration(null)}
                >
                  Browse Available Integrations
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {connectionData.map(connection => {
                const integration = integrationConfigs.find(i => i.id === connection.integrationId);
                if (!integration) return null;

                return (
                  <IntegrationCard
                    key={connection.id}
                    integration={integration}
                    connection={connection}
                    onDisconnect={handleDisconnect}
                    onConfigure={handleConfigure}
                  />
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="monitor" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(integrations).map(([key, integration]: [string, any]) => (
              <Card key={key}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {integration.name}
                    <Badge variant={integration.stats.active_connections > 0 ? "default" : "secondary"}>
                      {integration.stats.active_connections} active
                    </Badge>
                  </CardTitle>
                  <CardDescription>{integration.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Connections:</span>
                      <span>{integration.stats.total_connections}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Users:</span>
                      <span>{integration.stats.unique_users || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Webhooks (24h):</span>
                      <span>{integration.webhook_stats.total_webhooks || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Success Rate:</span>
                      <span className={
                        (integration.webhook_stats.successful_webhooks || 0) / 
                        Math.max(integration.webhook_stats.total_webhooks || 1, 1) * 100 >= 90 
                          ? 'text-green-600' : 'text-yellow-600'
                      }>
                        {Math.round(
                          (integration.webhook_stats.successful_webhooks || 0) / 
                          Math.max(integration.webhook_stats.total_webhooks || 1, 1) * 100
                        )}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Specialized Integration Managers */}
      {selectedIntegration === 'zapier' && (
        <ZapierIntegrationManager />
      )}
    </div>
  );
}