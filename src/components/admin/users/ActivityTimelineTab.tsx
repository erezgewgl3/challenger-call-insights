
import React, { useState, useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  Brain, 
  Building, 
  Search, 
  Filter,
  ChevronDown,
  Calendar,
  RefreshCw
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface ActivityEvent {
  id: string;
  type: 'upload' | 'analysis' | 'account_created';
  timestamp: string;
  description: string;
  metadata: Record<string, any>;
}

interface ActivityFilters {
  eventTypes: string[];
  dateRange: string;
  searchTerm: string;
}

interface ActivityTimelineTabProps {
  userId: string;
}

export function ActivityTimelineTab({ userId }: ActivityTimelineTabProps) {
  const [filters, setFilters] = useState<ActivityFilters>({
    eventTypes: ['all'],
    dateRange: '30d',
    searchTerm: ''
  });

  const fetchUserActivity = async ({ pageParam = 0 }) => {
    const pageSize = 20;
    const offset = pageParam * pageSize;

    // Fetch transcripts (uploads)
    let transcriptQuery = supabase
      .from('transcripts')
      .select('id, title, created_at, status')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    // Fetch analyses
    let analysisQuery = supabase
      .from('conversation_analysis')
      .select(`
        id, 
        created_at,
        transcript:transcripts!inner(title, user_id)
      `)
      .eq('transcript.user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    // Fetch accounts
    let accountQuery = supabase
      .from('accounts')
      .select('id, name, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    const [transcriptResult, analysisResult, accountResult] = await Promise.all([
      transcriptQuery,
      analysisQuery,
      accountQuery
    ]);

    if (transcriptResult.error) throw transcriptResult.error;
    if (analysisResult.error) throw analysisResult.error;
    if (accountResult.error) throw accountResult.error;

    // Convert to activity events
    const events: ActivityEvent[] = [
      ...(transcriptResult.data || []).map(t => ({
        id: `upload-${t.id}`,
        type: 'upload' as const,
        timestamp: t.created_at,
        description: `Uploaded transcript: ${t.title}`,
        metadata: { transcriptId: t.id, status: t.status, title: t.title }
      })),
      ...(analysisResult.data || []).map(a => ({
        id: `analysis-${a.id}`,
        type: 'analysis' as const,
        timestamp: a.created_at,
        description: `Completed AI analysis for: ${a.transcript.title}`,
        metadata: { analysisId: a.id, transcriptTitle: a.transcript.title }
      })),
      ...(accountResult.data || []).map(acc => ({
        id: `account-${acc.id}`,
        type: 'account_created' as const,
        timestamp: acc.created_at,
        description: `Created account: ${acc.name}`,
        metadata: { accountId: acc.id, accountName: acc.name }
      }))
    ];

    // Sort by timestamp
    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return {
      events,
      nextCursor: events.length === pageSize ? pageParam + 1 : null,
      hasMore: events.length === pageSize
    };
  };

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: ['user-activity', userId, filters],
    queryFn: fetchUserActivity,
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextCursor : undefined,
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const eventTypeConfig = {
    upload: { icon: Upload, color: 'bg-green-100 text-green-800', label: 'Upload' },
    analysis: { icon: Brain, color: 'bg-purple-100 text-purple-800', label: 'Analysis' },
    account_created: { icon: Building, color: 'bg-blue-100 text-blue-800', label: 'Account Created' }
  };

  const allEvents = useMemo(() => {
    return data?.pages?.flatMap(page => page.events) || [];
  }, [data]);

  // Apply client-side filtering
  const filteredEvents = useMemo(() => {
    let filtered = allEvents;

    // Filter by event type
    if (filters.eventTypes.length > 0 && !filters.eventTypes.includes('all')) {
      filtered = filtered.filter(event => filters.eventTypes.includes(event.type));
    }

    // Filter by search term
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(event => 
        event.description.toLowerCase().includes(searchLower) ||
        Object.values(event.metadata).some(value => 
          String(value).toLowerCase().includes(searchLower)
        )
      );
    }

    return filtered;
  }, [allEvents, filters]);

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-2">Failed to load activity timeline</p>
            <p className="text-gray-500 text-sm">{error.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search activities..."
                value={filters.searchTerm}
                onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                className="pl-9"
              />
            </div>
            <Select
              value={filters.eventTypes.includes('all') ? 'all' : filters.eventTypes[0] || 'all'}
              onValueChange={(value) => setFilters(prev => ({ 
                ...prev, 
                eventTypes: value === 'all' ? ['all'] : [value] 
              }))}
            >
              <SelectTrigger className="w-full sm:w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Event type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                <SelectItem value="upload">Uploads</SelectItem>
                <SelectItem value="analysis">Analyses</SelectItem>
                <SelectItem value="account_created">Accounts</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.dateRange}
              onValueChange={(value) => setFilters(prev => ({ ...prev, dateRange: value }))}
            >
              <SelectTrigger className="w-full sm:w-32">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
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

      {/* Activity Timeline */}
      <Card>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-start space-x-4 p-4 animate-pulse">
                  <div className="h-10 w-10 bg-gray-200 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Search className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Activity Found</h3>
              <p className="text-gray-500">
                {filters.searchTerm || filters.eventTypes[0] !== 'all' 
                  ? 'Try adjusting your filters to see more results.'
                  : 'This user hasn\'t performed any activities yet.'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEvents.map((event, index) => {
                const config = eventTypeConfig[event.type];
                const Icon = config.icon;
                
                return (
                  <div key={event.id} className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full ${config.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">
                          {event.description}
                        </p>
                        <Badge variant="outline" className={config.color}>
                          {config.label}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 mt-1">
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(event.timestamp), 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                      {/* Expandable metadata */}
                      {Object.keys(event.metadata).length > 0 && (
                        <details className="mt-2">
                          <summary className="text-xs text-muted-foreground cursor-pointer hover:text-gray-700">
                            View details
                          </summary>
                          <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                            {Object.entries(event.metadata).map(([key, value]) => (
                              <div key={key} className="flex justify-between">
                                <span className="font-medium">{key}:</span>
                                <span>{String(value)}</span>
                              </div>
                            ))}
                          </div>
                        </details>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Load More Button */}
              {hasNextPage && (
                <div className="text-center pt-4">
                  <Button
                    variant="outline"
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                  >
                    {isFetchingNextPage ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4 mr-2" />
                        Load More Activities
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
