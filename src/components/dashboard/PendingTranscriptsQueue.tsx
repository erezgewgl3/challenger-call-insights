import React, { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle, Clock, Loader2, Building2, User, Calendar, Timer, ExternalLink, Trash2, Video, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { SourceBadge } from '@/components/ui/SourceBadge';

interface PendingTranscriptsQueueProps {
  user_id: string;
}

interface UnifiedQueueItem {
  id: string;
  title: string;
  meeting_date?: string;
  external_source?: string;
  priority_level?: string;
  processing_status: string;
  processing_started_at?: string;
  processing_error?: string;
  error_message?: string;
  created_at: string;
  zoho_deal_id?: string;
  zoho_meeting_id?: string;
  original_filename?: string;
  duration_minutes?: number;
  source: 'database' | 'zoom';
  sourceType: 'manual' | 'zoom' | 'zapier' | 'zoho';
  attendees?: string[];
  date?: string;
  isNew?: boolean;
  deal_context?: {
    company_name?: string;
    contact_name?: string;
    deal_name?: string;
    meeting_host?: string;
  };
}

interface QueueData {
  owned: {
    processing: UnifiedQueueItem[];
    failed: UnifiedQueueItem[];
    pending: UnifiedQueueItem[];
  };
  stats: {
    processing_count: number;
    error_count: number;
    pending_owned: number;
  };
}

export function PendingTranscriptsQueue({ user_id }: PendingTranscriptsQueueProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Check if user has Zoom integration
  const { data: hasZoomConnection } = useQuery({
    queryKey: ['zoom-connection-check', user_id],
    queryFn: async () => {
      const { data } = await supabase
        .from('integration_connections')
        .select('id')
        .eq('user_id', user_id)
        .eq('integration_type', 'zoom')
        .eq('connection_status', 'active')
        .maybeSingle();
      return !!data;
    },
    enabled: !!user_id,
  });

  // Fetch database transcripts
  const { data: dbQueueData, isLoading: dbLoading } = useQuery<QueueData>({
    queryKey: ['unified-queue', user_id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_unified_transcript_queue', {
        p_user_id: user_id
      });
      if (error) throw error;
      
      const result = data as any;
      
      // Transform to include source info (RPC now provides rich metadata directly)
      const transformItems = (items: any[]): UnifiedQueueItem[] => 
        items.map(item => ({
          ...item,
          source: 'database' as const,
          sourceType: (item.external_source === 'zoom' ? 'zoom' : 
                      item.external_source === 'zapier' ? 'zapier' : 
                      item.zoho_deal_id ? 'zoho' : 'manual') as 'manual' | 'zoom' | 'zapier' | 'zoho'
        }));

      return {
        owned: {
          processing: transformItems(result?.owned?.processing || []),
          failed: transformItems(result?.owned?.failed || []),
          pending: transformItems(result?.owned?.pending || [])
        },
        stats: result?.stats || { processing_count: 0, error_count: 0, pending_owned: 0 }
      };
    },
    refetchInterval: 10000,
    enabled: !!user_id,
  });

  // Fetch unprocessed Zoom meetings (only if user has Zoom connected)
  const { data: zoomMeetings = [], isLoading: zoomLoading } = useQuery({
    queryKey: ['zoom-meetings-queue', user_id],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('get-zoom-meetings');
      if (error) {
        console.error('Error fetching Zoom meetings:', error);
        return [];
      }
      
      // Transform Zoom meetings to UnifiedQueueItem format
      const meetings = data?.meetings || [];
      return meetings.map((meeting: any): UnifiedQueueItem => ({
        id: meeting.id,
        title: meeting.title,
        meeting_date: meeting.date,
        duration_minutes: meeting.duration,
        processing_status: 'pending',
        created_at: meeting.date,
        source: 'zoom' as const,
        sourceType: 'zoom' as const,
        attendees: meeting.attendees ? [meeting.attendees.toString()] : [],
        isNew: meeting.isRecent || false
      }));
    },
    enabled: !!user_id && hasZoomConnection === true,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const isLoading = dbLoading || zoomLoading;

  // Real-time subscriptions
  useEffect(() => {
    const channel = supabase
      .channel('queue-updates')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'transcripts' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['unified-queue'] });
          queryClient.invalidateQueries({ queryKey: ['zoom-meetings-queue'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Merge database transcripts and Zoom meetings
  const processingItems = dbQueueData?.owned?.processing || [];
  const failedItems = dbQueueData?.owned?.failed || [];
  const dbPendingItems = dbQueueData?.owned?.pending || [];
  
  // Combine DB pending items with Zoom meetings
  const allPendingItems = [...dbPendingItems, ...zoomMeetings];
  
  const stats = {
    processing_count: processingItems.length,
    error_count: failedItems.length,
    pending_owned: allPendingItems.length
  };

  // All items sorted by urgency and recency
  // Priority: Failed -> Processing -> Pending (with Zoom meetings marked as new)
  const displayItems = [
    ...failedItems,
    ...processingItems,
    ...allPendingItems
      .sort((a, b) => {
        // Prioritize new Zoom meetings
        if (a.isNew && !b.isNew) return -1;
        if (!a.isNew && b.isNew) return 1;
        // Then by date
        return new Date(b.created_at || b.meeting_date || '').getTime() - 
               new Date(a.created_at || a.meeting_date || '').getTime();
      })
  ];

  const totalItems = stats.processing_count + stats.error_count + stats.pending_owned;

  const handleAnalyze = async (item: UnifiedQueueItem) => {
    try {
      if (item.source === 'zoom') {
        // First process the Zoom meeting to create a transcript
        toast.info('Processing Zoom transcript...');
        const { data: processData, error: processError } = await supabase.functions.invoke('process-zoom-transcript', {
          body: {
            meetingId: item.id,
            meetingTitle: item.title,
            meetingDate: item.meeting_date,
            meetingDuration: item.duration_minutes,
            attendeeCount: item.attendees?.length || 0
          }
        });

        if (processError) throw processError;
        if (!processData.success) throw new Error(processData.error || 'Failed to process meeting');

        // Then analyze the created transcript
        toast.success('Zoom transcript created, starting analysis...');
        navigate(`/analysis/${processData.transcriptId}`, {
          state: { source: 'zoom', justCreated: true }
        });
      } else {
        // For database transcripts, just analyze directly
        const { data, error } = await supabase.functions.invoke('manual-process-transcript', {
          body: { transcript_id: item.id }
        });

        if (error) throw error;

        toast.success('Analysis started');
        navigate(`/analysis/${item.id}`);
      }
    } catch (error: any) {
      console.error('Error starting analysis:', error);
      const errorMessage = error.message?.includes('already processed') 
        ? 'This meeting has already been analyzed' 
        : 'Failed to start analysis';
      toast.error(errorMessage);
    }
  };

  const handleDelete = async (item: UnifiedQueueItem) => {
    if (item.source === 'zoom') {
      toast.info('Zoom meetings cannot be deleted from here');
      return;
    }

    try {
      const { error } = await supabase.functions.invoke('delete-transcript', {
        body: { transcriptId: item.id }
      });

      if (error) throw error;

      toast.success('Transcript deleted');
      queryClient.invalidateQueries({ queryKey: ['unified-queue'] });
    } catch (error) {
      console.error('Error deleting transcript:', error);
      toast.error('Failed to delete transcript');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
            Loading Queue...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (totalItems === 0) {
    return null; // Don't show if queue is empty
  }

  // Helper to get smart display title from deal context
  const getDisplayTitle = (item: UnifiedQueueItem): string => {
    return item.deal_context?.deal_name 
      || (item.deal_context?.contact_name ? `Call with ${item.deal_context.contact_name}` : null)
      || item.original_filename
      || item.title
      || 'Untitled Transcript';
  };

  return (
    <>
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 flex-wrap text-lg">
            <span>📋 Transcript Analysis Queue</span>
            {stats.processing_count > 0 && (
              <Badge variant="secondary" className="gap-1.5">
                <Loader2 className="h-3 w-3 animate-spin" />
                {stats.processing_count} Processing
              </Badge>
            )}
            {stats.error_count > 0 && (
              <Badge variant="destructive" className="gap-1.5">
                <AlertCircle className="h-3 w-3" />
                {stats.error_count} Failed
              </Badge>
            )}
            {stats.pending_owned > 0 && (
              <Badge className="gap-1.5 bg-green-600 hover:bg-green-700">
                <CheckCircle className="h-3 w-3" />
                {stats.pending_owned} Ready
              </Badge>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent>
          <ScrollArea className="max-h-[600px] pr-4">
            <div className="space-y-2">
              {displayItems.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                      {/* Title, Source Badge, and Status */}
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h4 className="font-semibold text-foreground truncate">
                          {getDisplayTitle(item)}
                        </h4>
                        <SourceBadge source={item.sourceType} />
                        {item.isNew && (
                          <Badge variant="default" className="text-xs bg-green-500">New</Badge>
                        )}
                        {item.priority_level === 'urgent' && (
                          <Badge variant="destructive" className="text-xs">Urgent</Badge>
                        )}
                        {item.processing_status === 'processing' && (
                          <Badge className="text-xs bg-blue-500">Processing</Badge>
                        )}
                        {item.processing_status === 'error' && (
                          <Badge variant="destructive" className="text-xs">Failed</Badge>
                        )}
                      </div>

                      {/* Rich Context from deal_context */}
                      {item.deal_context && (item.deal_context.contact_name || item.deal_context.company_name || item.deal_context.meeting_host) && (
                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-2">
                          {item.deal_context.contact_name && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {item.deal_context.contact_name}
                            </span>
                          )}
                          {item.deal_context.company_name && (
                            <span className="flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {item.deal_context.company_name}
                            </span>
                          )}
                          {item.deal_context.meeting_host && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              Hosted by {item.deal_context.meeting_host}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Standard Metadata */}
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-2">
                        {item.attendees && item.attendees.length > 0 && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {item.attendees[0]} participant{item.attendees.length > 1 ? 's' : ''}
                          </span>
                        )}
                        {(item.meeting_date || item.created_at) && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(item.meeting_date || item.created_at).toLocaleDateString()}
                          </span>
                        )}
                        {item.duration_minutes && (
                          <span className="flex items-center gap-1">
                            <Timer className="h-3 w-3" />
                            {item.duration_minutes}m
                          </span>
                        )}
                      </div>

                      {/* Error Message */}
                      {item.error_message && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                          {item.error_message}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {item.processing_status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => handleAnalyze(item)}
                          className="bg-blue-600 hover:bg-blue-700 gap-1"
                        >
                          {item.source === 'zoom' && <Video className="h-3 w-3" />}
                          Analyze
                        </Button>
                      )}
                      {item.zoho_deal_id && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(`https://crm.zoho.com/crm/org20098764813/tab/Potentials/${item.zoho_deal_id}`, '_blank')}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      )}
                      {item.source !== 'zoom' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(item)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </>
  );
}
