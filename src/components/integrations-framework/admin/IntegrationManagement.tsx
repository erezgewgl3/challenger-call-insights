import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle, Clock, Plug, Settings, Activity, Plus, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { IntegrationSettings } from './IntegrationSettings';
import { IntegrationActivity } from './IntegrationActivity';
import { IntegrationHealth } from './IntegrationHealth';
import { useAuth } from '@/hooks/useAuth';

interface Integration {
  id: string;
  integration_type: string;
  connection_name: string;
  connection_status: string;
  last_sync_at: string | null;
  created_at: string;
  user_id: string;
  user_email?: string;
}

interface IntegrationStats {
  total_active_connections: number;
  total_users_with_integrations: number;
  total_syncs_today: number;
  total_webhooks_today: number;
}

export function IntegrationManagement() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [stats, setStats] = useState<IntegrationStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadIntegrations();
    loadStats();
  }, []);

  const loadIntegrations = async () => {
    try {
      // Step 1: Fetch integration connections without FK embedding
      const { data: connections, error: connErr } = await supabase
        .from('integration_connections')
        .select('id, connection_name, integration_type, connection_status, user_id, last_sync_at, created_at')
        .order('created_at', { ascending: false });

      if (connErr) throw connErr;

      // Step 2: Fetch user emails separately
      const userIds = Array.from(new Set((connections ?? []).map(c => c.user_id).filter(Boolean)));
      let userMap = new Map<string, string>();

      if (userIds.length > 0) {
        const { data: usersData, error: usersErr } = await supabase
          .from('users')
          .select('id, email')
          .in('id', userIds);

        if (usersErr) {
          console.warn('Failed to fetch user emails for integrations:', usersErr);
        } else if (usersData) {
          userMap = new Map(usersData.map(u => [u.id, u.email]));
        }
      }

      // Step 3: Merge connections with user emails
      const transformedData = (connections ?? []).map((conn: any) => {
        const userEmail = userMap.get(conn.user_id);
        return {
          ...conn,
          user_email: typeof userEmail === 'string' && userEmail.trim() !== ''
            ? userEmail
            : 'Unknown User'
        };
      });

      setIntegrations(transformedData);
    } catch (error) {
      console.error('Error loading integrations:', error);
      setIntegrations([]);
    }
  };

  const loadStats = async () => {
    try {
      const { data, error } = await supabase.rpc('integration_framework_get_system_stats');
      if (error) throw error;
      
      if (data && typeof data === 'object' && 'status' in data && data.status === 'success' && 'data' in data) {
        setStats(data.data as unknown as IntegrationStats);
      }
    } catch (error) {
      console.error('Error loading integration stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'disconnected': return 'bg-gray-100 text-gray-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />;
      case 'disconnected': return <AlertCircle className="h-4 w-4" />;
      case 'error': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const handleDisconnect = async (connectionId: string) => {
    try {
      const { data, error } = await supabase.rpc('integration_framework_delete_connection', {
        connection_id: connectionId
      });
      
      if (error) throw error;
      
      if (data && typeof data === 'object' && 'status' in data && data.status === 'success') {
        await loadIntegrations();
      } else {
        const errorMsg = data && typeof data === 'object' && 'message' in data ? String(data.message) : 'Failed to disconnect integration';
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error('Error disconnecting integration:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Integration Management</h2>
          <p className="text-gray-600">Manage external integrations and connections</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Integration
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Plug className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{stats?.total_active_connections || 0}</p>
                <p className="text-sm text-gray-600">Active Connections</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Settings className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{stats?.total_users_with_integrations || 0}</p>
                <p className="text-sm text-gray-600">Connected Users</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{stats?.total_syncs_today || 0}</p>
                <p className="text-sm text-gray-600">Syncs Today</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{stats?.total_webhooks_today || 0}</p>
                <p className="text-sm text-gray-600">Webhooks Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="health">Health</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Integrations</CardTitle>
              <CardDescription>
                All configured integrations across the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {integrations.length === 0 ? (
                  <div className="text-center py-8">
                    <Plug className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">No integrations configured yet</p>
                  </div>
                ) : (
                  integrations.map((integration) => (
                    <div key={integration.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Plug className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-medium">{integration.connection_name}</h3>
                          <p className="text-sm text-gray-600">{integration.integration_type}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <Users className="h-3 w-3 text-gray-500" />
                            <p className="text-xs text-gray-500">{integration.user_email}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Badge className={getStatusColor(integration.connection_status)}>
                          {getStatusIcon(integration.connection_status)}
                          <span className="ml-1 capitalize">{integration.connection_status}</span>
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDisconnect(integration.id)}
                          disabled={integration.connection_status === 'disconnected'}
                        >
                          Disconnect
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <IntegrationSettings />
        </TabsContent>

        <TabsContent value="activity">
          <IntegrationActivity />
        </TabsContent>

        <TabsContent value="health">
          <IntegrationHealth />
        </TabsContent>
      </Tabs>
    </div>
  );
}