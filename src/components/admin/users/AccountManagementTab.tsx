
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Building, 
  FileText, 
  Search, 
  ExternalLink,
  Calendar,
  MoreHorizontal,
  Eye,
  Download
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';

interface UserAccount {
  id: string;
  name: string;
  deal_stage: string | null;
  created_at: string;
  transcript_count: number;
  last_activity: string | null;
}

interface UserTranscript {
  id: string;
  title: string;
  account_name: string | null;
  created_at: string;
  status: 'uploaded' | 'processing' | 'completed' | 'error';
  duration_minutes: number | null;
  has_analysis: boolean;
}

interface AccountManagementTabProps {
  userId: string;
}

export function AccountManagementTab({ userId }: AccountManagementTabProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch user's accounts
  const { data: accounts, isLoading: accountsLoading, error: accountsError } = useQuery({
    queryKey: ['user-accounts', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('accounts')
        .select(`
          *,
          transcript_count:transcripts(count)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get last activity for each account
      const accountsWithActivity = await Promise.all(
        data.map(async (account) => {
          const { data: lastTranscript } = await supabase
            .from('transcripts')
            .select('created_at')
            .eq('account_id', account.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          return {
            ...account,
            transcript_count: account.transcript_count?.[0]?.count || 0,
            last_activity: lastTranscript?.created_at || null
          } as UserAccount;
        })
      );

      return accountsWithActivity;
    }
  });

  // Fetch user's transcripts
  const { data: transcripts, isLoading: transcriptsLoading, error: transcriptsError } = useQuery({
    queryKey: ['user-transcripts', userId, searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('transcripts')
        .select(`
          *,
          account:accounts(name),
          has_analysis:conversation_analysis(id)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,accounts.name.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data.map(t => ({
        id: t.id,
        title: t.title,
        account_name: t.account?.name || null,
        created_at: t.created_at,
        status: t.status,
        duration_minutes: t.duration_minutes,
        has_analysis: t.has_analysis && t.has_analysis.length > 0
      })) as UserTranscript[];
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDealStageColor = (stage: string | null) => {
    if (!stage) return 'bg-gray-100 text-gray-800';
    switch (stage.toLowerCase()) {
      case 'discovery': return 'bg-blue-100 text-blue-800';
      case 'proposal': return 'bg-yellow-100 text-yellow-800';
      case 'negotiation': return 'bg-orange-100 text-orange-800';
      case 'closed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (accountsError || transcriptsError) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-2">Failed to load account data</p>
            <p className="text-gray-500 text-sm">
              {accountsError?.message || transcriptsError?.message}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Accounts Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            User's Accounts ({accounts?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {accountsLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg animate-pulse">
                  <div className="h-12 w-12 bg-gray-200 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : accounts?.length === 0 ? (
            <div className="text-center py-8">
              <Building className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Accounts Created</h3>
              <p className="text-gray-500">This user hasn't created any client accounts yet.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {accounts?.map((account) => (
                <div key={account.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
                      <Building className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{account.name}</h4>
                      <div className="flex items-center space-x-3 mt-1">
                        {account.deal_stage && (
                          <Badge variant="outline" className={getDealStageColor(account.deal_stage)}>
                            {account.deal_stage}
                          </Badge>
                        )}
                        <span className="text-sm text-muted-foreground">
                          {account.transcript_count} transcript(s)
                        </span>
                        <span className="text-sm text-muted-foreground">
                          Created {formatDistanceToNow(new Date(account.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {account.last_activity && (
                      <span className="text-xs text-muted-foreground">
                        Last activity {formatDistanceToNow(new Date(account.last_activity), { addSuffix: true })}
                      </span>
                    )}
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transcripts Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              User's Transcripts ({transcripts?.length || 0})
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transcripts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {transcriptsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 bg-gray-50 rounded animate-pulse" />
              ))}
            </div>
          ) : transcripts?.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Transcripts Found</h3>
              <p className="text-gray-500">
                {searchTerm 
                  ? 'No transcripts match your search criteria.'
                  : 'This user hasn\'t uploaded any transcripts yet.'
                }
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Upload Date</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transcripts?.map((transcript) => (
                  <TableRow key={transcript.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{transcript.title}</span>
                        {transcript.has_analysis && (
                          <Badge variant="outline" className="bg-purple-100 text-purple-800">
                            Analyzed
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {transcript.account_name ? (
                        <span className="text-sm">{transcript.account_name}</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">No account</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusColor(transcript.status)}>
                        {transcript.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {transcript.duration_minutes ? (
                        <span className="text-sm">{transcript.duration_minutes}m</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">Unknown</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {formatDistanceToNow(new Date(transcript.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            View Analysis
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="mr-2 h-4 w-4" />
                            Export Data
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
