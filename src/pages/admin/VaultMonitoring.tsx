import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, AlertTriangle, Activity, Database, Eye } from 'lucide-react';
import { AdminGuard } from '@/components/auth/AdminGuard';
import { AdminLayout } from '@/components/layout/AdminLayout';

const VaultMonitoring: React.FC = () => {
  const { data: recentOperations, isLoading: opsLoading } = useQuery({
    queryKey: ['vault-operations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vault_access_log')
        .select(`
          *,
          users!vault_access_log_user_id_fkey(email)
        `)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data;
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const { data: failedOperations, isLoading: failsLoading } = useQuery({
    queryKey: ['vault-failures'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vault_access_log')
        .select(`
          *,
          users!vault_access_log_user_id_fkey(email)
        `)
        .eq('success', false)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data;
    },
  });

  const { data: legacyConnections, isLoading: legacyLoading } = useQuery({
    queryKey: ['legacy-connections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('integration_connections')
        .select(`
          id,
          user_id,
          integration_type,
          connection_name,
          created_at,
          connection_status,
          users!integration_connections_user_id_fkey(email)
        `)
        .is('vault_secret_id', null)
        .eq('connection_status', 'active');
      
      if (error) throw error;
      return data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['vault-stats'],
    queryFn: async () => {
      const { count: totalOps } = await supabase
        .from('vault_access_log')
        .select('*', { count: 'exact', head: true });

      const { count: successOps } = await supabase
        .from('vault_access_log')
        .select('*', { count: 'exact', head: true })
        .eq('success', true);

      const { count: vaultConnections } = await supabase
        .from('integration_connections')
        .select('*', { count: 'exact', head: true })
        .not('vault_secret_id', 'is', null);

      const { count: totalConnections } = await supabase
        .from('integration_connections')
        .select('*', { count: 'exact', head: true });

      return {
        totalOperations: totalOps || 0,
        successRate: totalOps ? ((successOps || 0) / totalOps * 100).toFixed(1) : 0,
        vaultConnections: vaultConnections || 0,
        totalConnections: totalConnections || 0,
        migrationProgress: totalConnections ? ((vaultConnections || 0) / totalConnections * 100).toFixed(1) : 0,
      };
    },
  });

  const getOperationBadge = (operation: string) => {
    const variants = {
      store: 'default',
      retrieve: 'secondary',
      update: 'outline',
      delete: 'destructive',
    } as const;
    
    return <Badge variant={variants[operation as keyof typeof variants] || 'outline'}>{operation}</Badge>;
  };

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="h-8 w-8" />
              Vault Security Monitoring
            </h1>
            <p className="text-muted-foreground mt-2">
              Monitor credential security, vault operations, and migration status
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Operations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalOperations || 0}</div>
                <p className="text-xs text-muted-foreground">All vault operations</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.successRate}%</div>
                <p className="text-xs text-muted-foreground">Successful operations</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Vault Secured</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.vaultConnections}/{stats?.totalConnections}</div>
                <p className="text-xs text-muted-foreground">Connections using vault</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Migration Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.migrationProgress}%</div>
                <p className="text-xs text-muted-foreground">Legacy to vault</p>
              </CardContent>
            </Card>
          </div>

          {/* Legacy Connections Alert */}
          {legacyConnections && legacyConnections.length > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>{legacyConnections.length} legacy connections</strong> are still using plaintext credential storage. 
                These connections should be reconnected to use vault encryption.
              </AlertDescription>
            </Alert>
          )}

          {/* Main Content Tabs */}
          <Tabs defaultValue="operations" className="space-y-4">
            <TabsList>
              <TabsTrigger value="operations" className="gap-2">
                <Activity className="h-4 w-4" />
                Recent Operations
              </TabsTrigger>
              <TabsTrigger value="failures" className="gap-2">
                <AlertTriangle className="h-4 w-4" />
                Failed Operations
              </TabsTrigger>
              <TabsTrigger value="legacy" className="gap-2">
                <Database className="h-4 w-4" />
                Legacy Connections
              </TabsTrigger>
            </TabsList>

            <TabsContent value="operations" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Vault Operations</CardTitle>
                  <CardDescription>Last 50 vault access operations across all users</CardDescription>
                </CardHeader>
                <CardContent>
                  {opsLoading ? (
                    <p className="text-sm text-muted-foreground">Loading operations...</p>
                  ) : recentOperations && recentOperations.length > 0 ? (
                    <div className="space-y-2">
                      {recentOperations.map((op: any) => (
                        <div 
                          key={op.id} 
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-4 flex-1">
                            {getOperationBadge(op.operation)}
                            <div className="flex-1">
                              <p className="text-sm font-medium">{op.integration_type}</p>
                              <p className="text-xs text-muted-foreground">
                                {op.users?.email || 'Unknown user'}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">
                                {new Date(op.created_at).toLocaleString()}
                              </p>
                              {op.success ? (
                                <Badge variant="outline" className="text-xs mt-1">Success</Badge>
                              ) : (
                                <Badge variant="destructive" className="text-xs mt-1">Failed</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No vault operations yet</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="failures" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Failed Vault Operations</CardTitle>
                  <CardDescription>Operations that encountered errors</CardDescription>
                </CardHeader>
                <CardContent>
                  {failsLoading ? (
                    <p className="text-sm text-muted-foreground">Loading failures...</p>
                  ) : failedOperations && failedOperations.length > 0 ? (
                    <div className="space-y-3">
                      {failedOperations.map((op: any) => (
                        <div 
                          key={op.id} 
                          className="p-4 border border-destructive/50 rounded-lg bg-destructive/5"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="flex items-center gap-2">
                                {getOperationBadge(op.operation)}
                                <Badge variant="destructive">Failed</Badge>
                              </div>
                              <p className="text-sm font-medium mt-2">{op.integration_type}</p>
                              <p className="text-xs text-muted-foreground">
                                {op.users?.email || 'Unknown user'}
                              </p>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {new Date(op.created_at).toLocaleString()}
                            </p>
                          </div>
                          {op.error_message && (
                            <div className="mt-2 p-2 bg-background rounded text-xs font-mono">
                              {op.error_message}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No failed operations</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="legacy" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Legacy Connections</CardTitle>
                  <CardDescription>
                    Active connections not using vault encryption (requires reconnection)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {legacyLoading ? (
                    <p className="text-sm text-muted-foreground">Loading legacy connections...</p>
                  ) : legacyConnections && legacyConnections.length > 0 ? (
                    <div className="space-y-2">
                      {legacyConnections.map((conn: any) => (
                        <div 
                          key={conn.id} 
                          className="flex items-center justify-between p-3 border border-yellow-500/50 rounded-lg bg-yellow-500/5"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{conn.integration_type}</Badge>
                              <Badge variant="secondary">Legacy Storage</Badge>
                            </div>
                            <p className="text-sm font-medium mt-2">{conn.connection_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {conn.users?.email || 'Unknown user'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">
                              Created {new Date(conn.created_at).toLocaleDateString()}
                            </p>
                            <Badge variant="outline" className="mt-1">
                              {conn.connection_status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center p-8">
                      <Eye className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-sm font-medium">All connections are using vault encryption</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        No legacy connections found
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </AdminLayout>
    </AdminGuard>
  );
};

export default VaultMonitoring;
