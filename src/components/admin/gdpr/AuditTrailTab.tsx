
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Download, Filter, Eye } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface GDPRAuditEvent {
  id: string;
  event_type: 'data_export' | 'data_deletion' | 'consent_updated' | 'retention_action';
  user_id: string;
  admin_id: string;
  timestamp: string;
  details: Record<string, any>;
  legal_basis?: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
  user?: {
    email: string;
  };
  admin?: {
    email: string;
  };
}

interface AuditFilters {
  eventType: string;
  status: string;
  dateRange: string;
  searchTerm: string;
}

const eventTypeConfig = {
  data_export: { label: 'Data Export', color: 'bg-blue-100 text-blue-800' },
  data_deletion: { label: 'Data Deletion', color: 'bg-red-100 text-red-800' },
  consent_updated: { label: 'Consent Updated', color: 'bg-green-100 text-green-800' },
  retention_action: { label: 'Retention Action', color: 'bg-purple-100 text-purple-800' }
};

const statusConfig = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-800' },
  failed: { label: 'Failed', color: 'bg-red-100 text-red-800' }
};

export function AuditTrailTab() {
  const [filters, setFilters] = useState<AuditFilters>({
    eventType: 'all',
    status: 'all',
    dateRange: '30d',
    searchTerm: ''
  });
  const [selectedEvent, setSelectedEvent] = useState<GDPRAuditEvent | null>(null);

  const { data: auditEvents, isLoading } = useQuery({
    queryKey: ['gdpr', 'audit-trail', filters],
    queryFn: async (): Promise<GDPRAuditEvent[]> => {
      let query = supabase
        .from('gdpr_audit_log')
        .select(`
          *,
          user:users!user_id(email),
          admin:users!admin_id(email)
        `)
        .order('timestamp', { ascending: false });

      // Apply filters
      if (filters.eventType !== 'all') {
        query = query.eq('event_type', filters.eventType);
      }

      if (filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters.dateRange !== 'all') {
        const days = parseInt(filters.dateRange.replace('d', ''));
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        query = query.gte('timestamp', startDate.toISOString());
      }

      const { data, error } = await query.limit(100);
      if (error) throw error;

      // Client-side search filtering
      let filteredData = data || [];
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        filteredData = filteredData.filter(event =>
          event.user?.email?.toLowerCase().includes(searchLower) ||
          event.admin?.email?.toLowerCase().includes(searchLower) ||
          event.event_type.toLowerCase().includes(searchLower)
        );
      }

      return filteredData;
    }
  });

  const exportAuditTrail = () => {
    if (!auditEvents) return;
    
    const csvContent = [
      'Date,Event Type,User,Admin,Status,Legal Basis,Details',
      ...auditEvents.map(event => [
        format(new Date(event.timestamp), 'yyyy-MM-dd HH:mm:ss'),
        event.event_type,
        event.user?.email || 'Unknown',
        event.admin?.email || 'System',
        event.status,
        event.legal_basis || '',
        JSON.stringify(event.details)
      ].map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gdpr-audit-trail-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                GDPR Audit Trail
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Complete log of all GDPR-related activities and data processing events
              </p>
            </div>
            <Button variant="outline" onClick={exportAuditTrail}>
              <Download className="h-4 w-4 mr-2" />
              Export Audit Log
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by user, admin, or event type..."
                value={filters.searchTerm}
                onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                className="pl-9"
              />
            </div>
            
            <Select
              value={filters.eventType}
              onValueChange={(value) => setFilters(prev => ({ ...prev, eventType: value }))}
            >
              <SelectTrigger className="w-full sm:w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Event type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                <SelectItem value="data_export">Data Export</SelectItem>
                <SelectItem value="data_deletion">Data Deletion</SelectItem>
                <SelectItem value="consent_updated">Consent Updated</SelectItem>
                <SelectItem value="retention_action">Retention Action</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.status}
              onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.dateRange}
              onValueChange={(value) => setFilters(prev => ({ ...prev, dateRange: value }))}
            >
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="Date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Audit Events Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date/Time</TableHead>
                  <TableHead>Event Type</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Legal Basis</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditEvents?.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {format(new Date(event.timestamp), 'MMM d, yyyy')}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(event.timestamp), 'h:mm a')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={eventTypeConfig[event.event_type].color}>
                        {eventTypeConfig[event.event_type].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {event.user?.email || 'System'}
                    </TableCell>
                    <TableCell>
                      {event.admin?.email || 'Automated'}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusConfig[event.status].color}>
                        {statusConfig[event.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {event.legal_basis || '-'}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedEvent(event)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {(!auditEvents || auditEvents.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No audit events found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Event Details Modal */}
      {selectedEvent && (
        <Card className="fixed inset-0 z-50 bg-white m-4 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Audit Event Details</CardTitle>
              <Button variant="ghost" onClick={() => setSelectedEvent(null)}>
                ×
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-medium">Event ID</Label>
                  <p className="text-sm font-mono">{selectedEvent.id}</p>
                </div>
                <div>
                  <Label className="font-medium">Timestamp</Label>
                  <p className="text-sm">{format(new Date(selectedEvent.timestamp), 'PPpp')}</p>
                </div>
                <div>
                  <Label className="font-medium">Event Type</Label>
                  <Badge className={eventTypeConfig[selectedEvent.event_type].color}>
                    {eventTypeConfig[selectedEvent.event_type].label}
                  </Badge>
                </div>
                <div>
                  <Label className="font-medium">Status</Label>
                  <Badge className={statusConfig[selectedEvent.status].color}>
                    {statusConfig[selectedEvent.status].label}
                  </Badge>
                </div>
                <div>
                  <Label className="font-medium">User</Label>
                  <p className="text-sm">{selectedEvent.user?.email || 'System'}</p>
                </div>
                <div>
                  <Label className="font-medium">Admin</Label>
                  <p className="text-sm">{selectedEvent.admin?.email || 'Automated'}</p>
                </div>
              </div>
              
              {selectedEvent.legal_basis && (
                <div>
                  <Label className="font-medium">Legal Basis</Label>
                  <p className="text-sm">{selectedEvent.legal_basis}</p>
                </div>
              )}
              
              <div>
                <Label className="font-medium">Event Details</Label>
                <pre className="text-xs bg-gray-50 p-3 rounded-lg mt-2 overflow-auto">
                  {JSON.stringify(selectedEvent.details, null, 2)}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
