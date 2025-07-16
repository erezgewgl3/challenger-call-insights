import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Activity, Clock, CheckCircle, AlertCircle, Search, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';

interface SyncOperation {
  id: string;
  connection_id: string;
  operation_type: string;
  operation_status: string;
  started_at: string;
  completed_at: string | null;
  progress_percentage: number;
  records_processed: number;
  records_total: number;
  error_details: any;
}

interface WebhookLog {
  id: string;
  connection_id: string;
  webhook_event: string;
  processing_status: string;
  created_at: string;
  processed_at: string | null;
  error_message: string | null;
  retry_count: number;
}

interface ConnectionData {
  id: string;
  connection_name: string;
  integration_type: string;
  connection_status: string;
}

export function IntegrationActivity() {
  const [activeTab, setActiveTab] = useState<'syncs' | 'webhooks'>('syncs');
  const [syncOperations, setSyncOperations] = useState<SyncOperation[]>([]);
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([]);
  const [connections, setConnections] = useState<ConnectionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadConnections();
    loadSyncOperations();
    loadWebhookLogs();
  }, []);

  const loadConnections = async () => {
    try {
      const { data, error } = await supabase
        .from('integration_connections')
        .select('id, connection_name, integration_type, connection_status');

      if (error) throw error;
      setConnections(data || []);
    } catch (error) {
      console.error('Error loading connections:', error);
    }
  };

  const loadSyncOperations = async () => {
    try {
      const { data, error } = await supabase
        .from('integration_sync_operations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setSyncOperations(data || []);
    } catch (error) {
      console.error('Error loading sync operations:', error);
    }
  };

  const loadWebhookLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('integration_webhook_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setWebhookLogs(data || []);
    } catch (error) {
      console.error('Error loading webhook logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getConnectionName = (connectionId: string) => {
    const connection = connections.find(c => c.id === connectionId);
    return connection ? connection.connection_name : 'Unknown';
  };

  const getConnectionType = (connectionId: string) => {
    const connection = connections.find(c => c.id === connectionId);
    return connection ? connection.integration_type : 'unknown';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'processed':
        return 'bg-green-100 text-green-800';
      case 'running':
      case 'pending':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'queued':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'processed':
        return <CheckCircle className="h-4 w-4" />;
      case 'running':
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const filteredSyncOperations = syncOperations.filter(op => {
    const matchesSearch = searchTerm === '' || 
      getConnectionName(op.connection_id).toLowerCase().includes(searchTerm.toLowerCase()) ||
      op.operation_type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || op.operation_status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const filteredWebhookLogs = webhookLogs.filter(log => {
    const matchesSearch = searchTerm === '' || 
      getConnectionName(log.connection_id).toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.webhook_event.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || log.processing_status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

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
        <h2 className="text-2xl font-bold text-gray-900">Integration Activity</h2>
        <p className="text-gray-600">Monitor sync operations and webhook activity</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Label htmlFor="search">Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="search"
              placeholder="Search by connection name or operation type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="w-full sm:w-48">
          <Label htmlFor="status-filter">Status Filter</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="running">Running</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processed">Processed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('syncs')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'syncs'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Sync Operations ({filteredSyncOperations.length})
          </button>
          <button
            onClick={() => setActiveTab('webhooks')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'webhooks'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Webhook Logs ({filteredWebhookLogs.length})
          </button>
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'syncs' && (
        <Card>
          <CardHeader>
            <CardTitle>Sync Operations</CardTitle>
            <CardDescription>
              Recent synchronization operations across all integrations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredSyncOperations.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">No sync operations found</p>
                </div>
              ) : (
                filteredSyncOperations.map((operation) => (
                  <div key={operation.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        {getStatusIcon(operation.operation_status)}
                      </div>
                      <div>
                        <h3 className="font-medium">{getConnectionName(operation.connection_id)}</h3>
                        <p className="text-sm text-gray-600">
                          {operation.operation_type} • {getConnectionType(operation.connection_id)}
                        </p>
                        <p className="text-xs text-gray-500">
                          Started {formatDistanceToNow(new Date(operation.started_at))} ago
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {operation.records_processed || 0} / {operation.records_total || 0} records
                        </p>
                        <p className="text-xs text-gray-500">
                          {operation.progress_percentage || 0}% complete
                        </p>
                      </div>
                      <Badge className={getStatusColor(operation.operation_status)}>
                        {getStatusIcon(operation.operation_status)}
                        <span className="ml-1 capitalize">{operation.operation_status}</span>
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'webhooks' && (
        <Card>
          <CardHeader>
            <CardTitle>Webhook Logs</CardTitle>
            <CardDescription>
              Recent webhook events and processing status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredWebhookLogs.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">No webhook logs found</p>
                </div>
              ) : (
                filteredWebhookLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        {getStatusIcon(log.processing_status)}
                      </div>
                      <div>
                        <h3 className="font-medium">{getConnectionName(log.connection_id)}</h3>
                        <p className="text-sm text-gray-600">
                          {log.webhook_event} • {getConnectionType(log.connection_id)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(log.created_at))} ago
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      {log.retry_count > 0 && (
                        <div className="text-right">
                          <p className="text-sm text-orange-600">
                            {log.retry_count} retries
                          </p>
                        </div>
                      )}
                      <Badge className={getStatusColor(log.processing_status)}>
                        {getStatusIcon(log.processing_status)}
                        <span className="ml-1 capitalize">{log.processing_status}</span>
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}