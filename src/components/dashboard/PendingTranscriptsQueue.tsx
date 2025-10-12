import React, { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle, Loader2, FileText, Trash2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { SourceBadge } from '@/components/ui/SourceBadge';
import { formatDistanceToNow, parseISO, differenceInDays, format } from 'date-fns';
import { TranscriptViewerDialog } from './TranscriptViewerDialog';

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
  const [viewingTranscriptId, setViewingTranscriptId] = React.useState<string | null>(null);

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

  const isGenericTitle = (title: string): boolean => {
    const genericPatterns = [
      /^the (client|prospect|customer|company)$/i,
      /^(call|meeting|conversation|discussion)$/i,
      /^compliance risks?$/i,
      /^transcript\.?(txt|docx|vtt)?$/i,
      /^unnamed/i,
      /^untitled/i
    ];
    return genericPatterns.some(pattern => pattern.test(title.trim()));
  };

  const getParticipantNames = (item: UnifiedQueueItem): string[] => {
    const names: string[] = [];
    
    // Priority 1: extracted_participants from metadata extraction
    if (Array.isArray((item as any).extracted_participants) && (item as any).extracted_participants.length > 0) {
      const extractedNames = (item as any).extracted_participants
        .map((p: any) => typeof p === 'string' ? p : p.name)
        .filter(Boolean);
      names.push(...extractedNames);
    }
    
    // Priority 2: participants from transcript (simple array)
    if (Array.isArray((item as any).participants) && (item as any).participants.length > 0) {
      const transcriptNames = (item as any).participants
        .map((p: any) => typeof p === 'string' ? p : (p.name || null))
        .filter(Boolean);
      names.push(...transcriptNames);
    }
    
    // Priority 3: conversation_analysis structured participants (for completed items)
    const analysis: any = (item as any).conversation_analysis?.[0];
    if (analysis?.participants) {
      // Extract client contacts
      if (Array.isArray(analysis.participants.clientContacts)) {
        const clientNames = analysis.participants.clientContacts
          .map((c: any) => c.name)
          .filter(Boolean);
        names.push(...clientNames);
      }
      
      // Extract sales rep(s)
      if (analysis.participants.salesRep?.name) {
        names.push(`${analysis.participants.salesRep.name} (${analysis.participants.salesRep.company || 'Rep'})`);
      }
    }
    
    // Fallback to attendees for Zoom meetings
    if (names.length === 0 && item.attendees?.length) {
      names.push(...item.attendees);
    }
    
    // Remove duplicates and return
    return [...new Set(names)];
  };

  const buildSmartFallbackTitle = (item: UnifiedQueueItem): string => {
    const parts: string[] = [];
    
    // Get participant/contact name
    const names = getParticipantNames(item);
    const contactName = item.deal_context?.contact_name || names[0];
    if (contactName) {
      const firstName = contactName.split(' ')[0];
      parts.push(firstName);
    }
    
    // Add date context
    const date = item.created_at || item.meeting_date;
    if (date) {
      const callDate = new Date(date);
      const daysAgo = differenceInDays(new Date(), callDate);
      
      if (daysAgo === 0) {
        parts.push("(Today)");
      } else if (daysAgo === 1) {
        parts.push("(Yesterday)");
      } else if (daysAgo <= 7) {
        parts.push(`(${format(callDate, 'EEEE')})`);
      } else {
        parts.push(`(${format(callDate, 'MMM d')})`);
      }
    }
    
    if (parts.length === 0) {
      return "Unknown Prospect";
    }
    
    return parts.join(" ");
  };

  // Helper to get smart display title from deal context
  const getDisplayTitle = (item: UnifiedQueueItem): string => {
    // Priority 1: Company name from deal context
    if (item.deal_context?.company_name) return item.deal_context.company_name;
    
    // Priority 2: Deal name (if substantive)
    const dealName = item.deal_context?.deal_name || item.title;
    if (dealName && !isGenericTitle(dealName)) {
      return dealName;
    }
    
    // Priority 3: Original filename (if not generic)
    if (item.original_filename && !isGenericTitle(item.original_filename)) {
      return item.original_filename;
    }
    
    // Priority 4: Smart fallback
    return buildSmartFallbackTitle(item);
  };

  return (
    <ScrollArea className="max-h-[500px] pr-4">
      <div className="space-y-3">
        {displayItems.map((item) => {
          const displayTitle = getDisplayTitle(item);
          const isProcessing = item.processing_status === 'processing';
          const isFailed = item.processing_status === 'error';
          
          // Determine primary metadata to show (max 2 items)
          const metadata = [];
          if (item.deal_context?.contact_name || item.deal_context?.company_name) {
            metadata.push(item.deal_context.contact_name || item.deal_context.company_name);
          }
          if (item.created_at || item.meeting_date) {
            const daysAgo = Math.floor(
              (Date.now() - new Date(item.created_at || item.meeting_date).getTime()) / (1000 * 60 * 60 * 24)
            );
            if (daysAgo <= 7) {
              metadata.push(formatDistanceToNow(parseISO(item.created_at || item.meeting_date), { addSuffix: true }));
            }
          }
          
          return (
            <div 
              key={item.id} 
              className={`border rounded-lg p-5 bg-card hover:bg-accent/5 transition-colors ${
                isFailed ? 'border-l-4 border-l-destructive' : ''
              } ${isProcessing ? 'bg-accent/20' : ''}`}
            >
              <div className="flex items-center justify-between gap-6">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {isFailed && <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />}
                    <h3 className="font-semibold text-base truncate">
                      {displayTitle}
                    </h3>
                    <SourceBadge source={item.sourceType} />
                  </div>
                  
                  {metadata.length > 0 && (
                    <p className="text-sm text-muted-foreground truncate">
                      {metadata.join(' • ')}
                    </p>
                  )}
                  
                  {isFailed && item.error_message && (
                    <div className="mt-3 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                      <p className="text-sm text-destructive">{item.error_message}</p>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2 flex-shrink-0">
                {isProcessing ? (
                  <>
                    <div className="flex flex-col items-end gap-1 px-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Processing...</span>
                      </div>
                      {item.duration_minutes && (
                        <span className="text-xs text-muted-foreground">
                          {item.duration_minutes} min meeting
                        </span>
                      )}
                    </div>
                    
                    {item.source !== 'zoom' && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDelete(item)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        title="Delete transcript"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </>
                ) : (
                    <>
                      <Button
                        onClick={() => handleAnalyze(item)}
                        className="bg-primary hover:bg-primary/90"
                      >
                        {isFailed ? 'Retry Analysis' : 'Start Analysis'}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                      
                      {item.source !== 'zoom' && item.id && (
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => setViewingTranscriptId(item.id)}
                          title="View transcript"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {item.source !== 'zoom' && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(item)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <TranscriptViewerDialog
        transcriptId={viewingTranscriptId}
        onOpenChange={(open) => !open && setViewingTranscriptId(null)}
      />
    </ScrollArea>
  );
}
