
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Eye, RefreshCw, AlertCircle } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { DataExportModal } from './DataExportModal';

interface DataRequest {
  id: string;
  user_id: string;
  requested_by: string;
  format: 'json' | 'csv' | 'xml';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  download_url?: string;
  expires_at?: string;
  created_at: string;
  completed_at?: string;
  user?: {
    email: string;
  };
  requested_by_user?: {
    email: string;
  };
}

const statusConfig = {
  pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
  processing: { color: 'bg-blue-100 text-blue-800', label: 'Processing' },
  completed: { color: 'bg-green-100 text-green-800', label: 'Completed' },
  failed: { color: 'bg-red-100 text-red-800', label: 'Failed' }
};

export function DataRequestsTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  // Fetch data export requests
  const { data: exportRequests, isLoading: exportLoading } = useQuery({
    queryKey: ['gdpr', 'export-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('data_export_requests')
        .select(`
          *,
          user:users!user_id(email),
          requested_by_user:users!requested_by(email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as DataRequest[];
    }
  });

  // Fetch deletion requests
  const { data: deletionRequests, isLoading: deletionLoading } = useQuery({
    queryKey: ['gdpr', 'deletion-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deletion_requests')
        .select(`
          *,
          user:users!user_id(email),
          requested_by_user:users!requested_by(email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  // Download export file
  const downloadMutation = useMutation({
    mutationFn: async (downloadUrl: string) => {
      window.open(downloadUrl, '_blank');
    },
    onError: () => {
      toast({
        title: "Download Failed",
        description: "Could not download the export file. It may have expired.",
        variant: "destructive",
      });
    }
  });

  const handleNewExport = (userId: string) => {
    setSelectedUserId(userId);
    setExportModalOpen(true);
  };

  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Exports</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {exportRequests?.filter(r => r.status === 'pending').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting processing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Exports</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {exportRequests?.filter(r => r.status === 'completed').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Ready for download
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deletion Requests</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {deletionRequests?.filter(r => r.status === 'pending').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Pending action
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {exportRequests?.filter(r => 
                new Date(r.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
              ).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Total requests
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Export Requests Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Data Export Requests</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Track and manage user data export requests
              </p>
            </div>
            <Button onClick={() => setExportModalOpen(true)}>
              <Download className="h-4 w-4 mr-2" />
              New Export
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {exportLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Format</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exportRequests?.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{request.user?.email}</div>
                        <div className="text-sm text-muted-foreground">
                          Requested by {request.requested_by_user?.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="uppercase">
                        {request.format}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusConfig[request.status].color}>
                        {statusConfig[request.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      {request.expires_at ? (
                        <div className={isExpired(request.expires_at) ? 'text-red-600' : ''}>
                          {format(new Date(request.expires_at), 'MMM d, yyyy')}
                        </div>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {request.status === 'completed' && request.download_url && !isExpired(request.expires_at) ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadMutation.mutate(request.download_url!)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      ) : (
                        <span className="text-muted-foreground text-sm">
                          {request.status === 'completed' ? 'Expired' : 'Processing'}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {(!exportRequests || exportRequests.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No export requests found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Deletion Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>User Deletion Requests</CardTitle>
          <p className="text-sm text-muted-foreground">
            Monitor user deletion requests and grace periods
          </p>
        </CardHeader>

        <CardContent>
          {deletionLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Scheduled For</TableHead>
                  <TableHead>Grace Period</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deletionRequests?.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{request.user?.email}</div>
                        <div className="text-sm text-muted-foreground">
                          By {request.requested_by_user?.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {request.reason}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusConfig[request.status as keyof typeof statusConfig]?.color || 'bg-gray-100 text-gray-800'}>
                        {request.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(request.scheduled_for), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      {request.grace_period_end ? (
                        format(new Date(request.grace_period_end), 'MMM d, yyyy')
                      ) : (
                        'Immediate'
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {(!deletionRequests || deletionRequests.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No deletion requests found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Data Export Modal */}
      <DataExportModal
        isOpen={exportModalOpen}
        onClose={() => {
          setExportModalOpen(false);
          setSelectedUserId('');
        }}
        userId={selectedUserId}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['gdpr', 'export-requests'] });
          setExportModalOpen(false);
          setSelectedUserId('');
        }}
      />
    </div>
  );
}
