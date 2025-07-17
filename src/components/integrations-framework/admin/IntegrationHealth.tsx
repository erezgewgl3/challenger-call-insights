import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, CheckCircle, Clock, Shield, Activity, TrendingUp, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';

interface ConnectionHealth {
  connection_id: string;
  integration_type: string;
  connection_name: string;
  status: string;
  last_sync_at: string | null;
  recent_syncs_24h: number;
  recent_errors_24h: number;
  health_score: 'excellent' | 'good' | 'warning' | 'critical';
}

interface SystemHealth {
  total_connections: number;
  healthy_connections: number;
  warning_connections: number;
  critical_connections: number;
  average_health_score: number;
  last_updated: string;
}

export function IntegrationHealth() {
  const { user } = useAuth();
  const [healthData, setHealthData] = useState<ConnectionHealth[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadHealthData();
  }, []);

  const loadHealthData = async () => {
    try {
      // Load connections
      const { data: connections, error: connectionsError } = await supabase
        .from('integration_connections')
        .select('*')
        .eq('connection_status', 'active');

      if (connectionsError) throw connectionsError;

      // Load health data for each connection
      const healthPromises = (connections || []).map(async (connection) => {
        const { data, error } = await supabase.rpc('integration_framework_get_connection_health', {
          connection_id: connection.id
        });

        if (error) throw error;
        return (data && typeof data === 'object' && 'status' in data && data.status === 'success' && 'data' in data) ? data.data : null;
      });

      const healthResults = await Promise.all(healthPromises);
      const validHealthData = healthResults.filter(Boolean) as unknown as ConnectionHealth[];
      
      setHealthData(validHealthData);
      
      // Calculate system health
      const total = validHealthData.length;
      const healthy = validHealthData.filter(h => h.health_score === 'excellent' || h.health_score === 'good').length;
      const warning = validHealthData.filter(h => h.health_score === 'warning').length;
      const critical = validHealthData.filter(h => h.health_score === 'critical').length;
      
      setSystemHealth({
        total_connections: total,
        healthy_connections: healthy,
        warning_connections: warning,
        critical_connections: critical,
        average_health_score: total > 0 ? (healthy / total) * 100 : 0,
        last_updated: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error loading health data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getHealthColor = (score: string) => {
    switch (score) {
      case 'excellent': return 'bg-green-100 text-green-800';
      case 'good': return 'bg-blue-100 text-blue-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getHealthIcon = (score: string) => {
    switch (score) {
      case 'excellent': return <CheckCircle className="h-4 w-4" />;
      case 'good': return <CheckCircle className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'critical': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getHealthScore = (score: string) => {
    switch (score) {
      case 'excellent': return 100;
      case 'good': return 80;
      case 'warning': return 60;
      case 'critical': return 30;
      default: return 0;
    }
  };

  const runHealthCheck = async (connectionId: string) => {
    try {
      const { data, error } = await supabase.rpc('integration_framework_get_connection_health', {
        connection_id: connectionId
      });
      
      if (error) throw error;
      
      if (data && typeof data === 'object' && 'status' in data && data.status === 'success') {
        await loadHealthData();
      }
    } catch (error) {
      console.error('Error running health check:', error);
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
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Integration Health</h2>
        <p className="text-gray-600">Monitor connection health and performance metrics</p>
      </div>

      {/* System Health Overview */}
      {systemHealth && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Shield className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{systemHealth.total_connections}</p>
                  <p className="text-sm text-gray-600">Total Connections</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{systemHealth.healthy_connections}</p>
                  <p className="text-sm text-gray-600">Healthy</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-8 w-8 text-yellow-600" />
                <div>
                  <p className="text-2xl font-bold">{systemHealth.warning_connections}</p>
                  <p className="text-sm text-gray-600">Warning</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-8 w-8 text-red-600" />
                <div>
                  <p className="text-2xl font-bold">{systemHealth.critical_connections}</p>
                  <p className="text-sm text-gray-600">Critical</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* System Health Score */}
      {systemHealth && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>System Health Score</span>
            </CardTitle>
            <CardDescription>
              Overall health of all integration connections
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Overall Health</span>
                <span className="text-sm font-bold">{Math.round(systemHealth.average_health_score)}%</span>
              </div>
              <Progress value={systemHealth.average_health_score} className="h-2" />
              <p className="text-xs text-gray-500">
                Last updated {formatDistanceToNow(new Date(systemHealth.last_updated))} ago
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Individual Connection Health */}
      <Card>
        <CardHeader>
          <CardTitle>Connection Health Details</CardTitle>
          <CardDescription>
            Detailed health metrics for each integration connection
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {healthData.length === 0 ? (
              <div className="text-center py-8">
                <Shield className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No active connections to monitor</p>
              </div>
            ) : (
              healthData.map((health) => (
                <div key={health.connection_id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        {getHealthIcon(health.health_score)}
                      </div>
                      <div>
                        <h3 className="font-medium">{health.connection_name}</h3>
                        <p className="text-sm text-gray-600">{health.integration_type}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Badge className={getHealthColor(health.health_score)}>
                        {getHealthIcon(health.health_score)}
                        <span className="ml-1 capitalize">{health.health_score}</span>
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => runHealthCheck(health.connection_id)}
                      >
                        Check Health
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-lg font-bold text-blue-600">{health.recent_syncs_24h}</p>
                      <p className="text-xs text-gray-600">Syncs (24h)</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-lg font-bold text-red-600">{health.recent_errors_24h}</p>
                      <p className="text-xs text-gray-600">Errors (24h)</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-lg font-bold text-green-600">
                        {health.recent_syncs_24h > 0 
                          ? Math.round(((health.recent_syncs_24h - health.recent_errors_24h) / health.recent_syncs_24h) * 100)
                          : 0}%
                      </p>
                      <p className="text-xs text-gray-600">Success Rate</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Health Score</span>
                      <span className="text-sm font-bold">{getHealthScore(health.health_score)}%</span>
                    </div>
                    <Progress value={getHealthScore(health.health_score)} className="h-2" />
                    <p className="text-xs text-gray-500">
                      Last sync: {health.last_sync_at ? formatDistanceToNow(new Date(health.last_sync_at)) + ' ago' : 'Never'}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Health Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Health Actions</CardTitle>
          <CardDescription>
            Quick actions to maintain integration health
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              onClick={() => loadHealthData()}
              className="flex items-center space-x-2"
            >
              <Activity className="h-4 w-4" />
              <span>Refresh Health Data</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                // Run health check for all connections
                healthData.forEach(health => runHealthCheck(health.connection_id));
              }}
              className="flex items-center space-x-2"
            >
              <Shield className="h-4 w-4" />
              <span>Run All Health Checks</span>
            </Button>
            <Button
              variant="outline"
              className="flex items-center space-x-2"
            >
              <TrendingUp className="h-4 w-4" />
              <span>Export Health Report</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}