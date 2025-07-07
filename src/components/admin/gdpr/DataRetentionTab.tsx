
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, AlertTriangle, CheckCircle, Calendar } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface RetentionStatus {
  immediate: number;
  upcoming: number;
  compliant: number;
  users: Array<{
    id: string;
    email: string;
    created_at: string;
    last_login?: string;
    status: 'immediate' | 'upcoming' | 'compliant';
    days_until_action: number;
  }>;
  transcripts: Array<{
    id: string;
    title: string;
    user_email: string;
    created_at: string;
    status: 'immediate' | 'upcoming' | 'compliant';
    days_until_action: number;
  }>;
  logs: Array<{
    id: string;
    event_type: string;
    created_at: string;
    status: 'immediate' | 'upcoming' | 'compliant';
    days_until_action: number;
  }>;
}

const retentionPolicies = {
  userProfiles: { period: 7, unit: 'years', trigger: 'account_deletion' },
  transcripts: { period: 5, unit: 'years', trigger: 'user_deletion' },
  activityLogs: { period: 3, unit: 'years', trigger: 'creation_date' },
  inviteTokens: { period: 1, unit: 'year', trigger: 'expiration_date' },
  securityLogs: { period: 6, unit: 'years', trigger: 'creation_date' },
  emailLogs: { period: 2, unit: 'years', trigger: 'creation_date' }
};

export function DataRetentionTab() {
  const [selectedType, setSelectedType] = useState<'users' | 'transcripts' | 'logs'>('users');

  const { data: retentionStatus, isLoading } = useQuery({
    queryKey: ['gdpr', 'retention-status'],
    queryFn: async (): Promise<RetentionStatus> => {
      // Calculate retention status for users (simplified - in real implementation would be more complex)
      const { data: users } = await supabase
        .from('users')
        .select('id, email, created_at')
        .order('created_at', { ascending: true });

      // Calculate retention status for transcripts
      const { data: transcripts } = await supabase
        .from('transcripts')
        .select(`
          id, 
          title, 
          created_at,
          user:users(email)
        `)
        .order('created_at', { ascending: true });

      // Mock calculation for demonstration
      const now = new Date();
      const calculateStatus = (createdAt: string, retentionYears: number) => {
        const created = new Date(createdAt);
        const retentionEnd = new Date(created.getTime() + retentionYears * 365 * 24 * 60 * 60 * 1000);
        const daysUntilAction = Math.floor((retentionEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
        
        if (daysUntilAction < 0) return { status: 'immediate' as const, days_until_action: daysUntilAction };
        if (daysUntilAction < 30) return { status: 'upcoming' as const, days_until_action: daysUntilAction };
        return { status: 'compliant' as const, days_until_action: daysUntilAction };
      };

      const processedUsers = (users || []).map(user => ({
        ...user,
        ...calculateStatus(user.created_at, 7) // 7 years retention
      }));

      const processedTranscripts = (transcripts || []).map(transcript => ({
        id: transcript.id,
        title: transcript.title,
        user_email: transcript.user?.email || 'Unknown',
        created_at: transcript.created_at,
        ...calculateStatus(transcript.created_at, 5) // 5 years retention
      }));

      return {
        immediate: processedUsers.filter(u => u.status === 'immediate').length,
        upcoming: processedUsers.filter(u => u.status === 'upcoming').length,
        compliant: processedUsers.filter(u => u.status === 'compliant').length,
        users: processedUsers,
        transcripts: processedTranscripts,
        logs: [] // Would be implemented similarly
      };
    },
    refetchInterval: 24 * 60 * 60 * 1000 // Refetch daily
  });

  const getStatusColor = (status: 'immediate' | 'upcoming' | 'compliant') => {
    switch (status) {
      case 'immediate': return 'bg-red-100 text-red-800';
      case 'upcoming': return 'bg-orange-100 text-orange-800';
      case 'compliant': return 'bg-green-100 text-green-800';
    }
  };

  const getStatusLabel = (status: 'immediate' | 'upcoming' | 'compliant') => {
    switch (status) {
      case 'immediate': return 'Action Required';
      case 'upcoming': return 'Review Soon';
      case 'compliant': return 'Compliant';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Alert>
        <Clock className="h-4 w-4" />
        <AlertTitle>Data Retention Monitoring</AlertTitle>
        <AlertDescription>
          Automated monitoring of data retention periods based on GDPR requirements.
          Items approaching retention limits are highlighted for review.
        </AlertDescription>
      </Alert>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Immediate Action Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {retentionStatus?.immediate || 0}
            </div>
            <p className="text-xs text-muted-foreground">Past retention period</p>
          </CardContent>
        </Card>

        <Card className="border-orange-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-600 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Review Soon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {retentionStatus?.upcoming || 0}
            </div>
            <p className="text-xs text-muted-foreground">Expiring within 30 days</p>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Within Policy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {retentionStatus?.compliant || 0}
            </div>
            <p className="text-xs text-muted-foreground">All requirements met</p>
          </CardContent>
        </Card>
      </div>

      {/* Retention Policies Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Data Retention Policies</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(retentionPolicies).map(([type, policy]) => (
              <div key={type} className="p-3 border rounded-lg">
                <h4 className="font-medium capitalize text-sm">
                  {type.replace(/([A-Z])/g, ' $1').toLowerCase()}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {policy.period} {policy.unit}
                </p>
                <p className="text-xs text-muted-foreground">
                  From {policy.trigger.replace('_', ' ')}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Data Tables */}
      <Tabs value={selectedType} onValueChange={(value) => setSelectedType(value as typeof selectedType)}>
        <TabsList>
          <TabsTrigger value="users">User Data</TabsTrigger>
          <TabsTrigger value="transcripts">Transcripts</TabsTrigger>
          <TabsTrigger value="logs">Activity Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Data Retention Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Days Until Action</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {retentionStatus?.users?.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="font-medium">{user.email}</div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(user.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(user.status)}>
                          {getStatusLabel(user.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.status === 'immediate' 
                          ? `${Math.abs(user.days_until_action)} days overdue`
                          : `${user.days_until_action} days`
                        }
                      </TableCell>
                      <TableCell>
                        {user.status === 'immediate' && (
                          <Button variant="outline" size="sm">
                            Take Action
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transcripts">
          <Card>
            <CardHeader>
              <CardTitle>Transcript Data Retention Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transcript</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Days Until Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {retentionStatus?.transcripts?.map((transcript) => (
                    <TableRow key={transcript.id}>
                      <TableCell>
                        <div className="font-medium truncate max-w-xs">
                          {transcript.title}
                        </div>
                      </TableCell>
                      <TableCell>{transcript.user_email}</TableCell>
                      <TableCell>
                        {format(new Date(transcript.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(transcript.status)}>
                          {getStatusLabel(transcript.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {transcript.status === 'immediate' 
                          ? `${Math.abs(transcript.days_until_action)} days overdue`
                          : `${transcript.days_until_action} days`
                        }
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">
                Activity logs retention monitoring will be implemented based on specific requirements
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
