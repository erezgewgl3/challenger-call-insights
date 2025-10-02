import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { PendingTranscriptsQueue } from './PendingTranscriptsQueue';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface CollapsibleProcessingQueueProps {
  user_id: string;
}

export function CollapsibleProcessingQueue({ user_id }: CollapsibleProcessingQueueProps) {
  const [isOpen, setIsOpen] = useState(true);

  // Fetch queue stats to show summary when collapsed
  const { data: queueStats } = useQuery({
    queryKey: ['queue-stats', user_id],
    queryFn: async () => {
      const { data } = await supabase.rpc('get_unified_transcript_queue', {
        p_user_id: user_id
      });
      
      const stats = (data as any)?.stats || { processing_count: 0, error_count: 0, pending_owned: 0 };
      
      // Also check for Zoom meetings
      const hasZoom = await supabase
        .from('integration_connections')
        .select('id')
        .eq('user_id', user_id)
        .eq('integration_type', 'zoom')
        .eq('connection_status', 'active')
        .maybeSingle();

      let zoomCount = 0;
      if (hasZoom.data) {
        const { data: zoomData } = await supabase.functions.invoke('get-zoom-meetings');
        zoomCount = zoomData?.meetings?.length || 0;
      }

      return {
        processing: stats.processing_count,
        failed: stats.error_count,
        pending: stats.pending_owned + zoomCount,
        total: stats.processing_count + stats.error_count + stats.pending_owned + zoomCount
      };
    },
    enabled: !!user_id,
    refetchInterval: 10000,
  });

  // Don't render if queue is empty
  if (!queueStats || queueStats.total === 0) {
    return null;
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="rounded-lg border bg-card">
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-between px-6 py-4 h-auto hover:bg-accent/50"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg font-semibold">
                {queueStats.total} transcript{queueStats.total !== 1 ? 's' : ''} need your attention
              </span>
            </div>
            {isOpen ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="animate-accordion-down">
          <div className="px-6 pb-6">
            <PendingTranscriptsQueue user_id={user_id} />
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
