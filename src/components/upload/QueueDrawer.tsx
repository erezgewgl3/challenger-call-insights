import React, { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { QueueSection } from './QueueSection';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ClipboardList } from 'lucide-react';

interface QueueDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user_id: string;
}

export function QueueDrawer({ isOpen, onClose, user_id }: QueueDrawerProps) {
  const queryClient = useQueryClient();

  const { data: queueData } = useQuery({
    queryKey: ['transcript-queue', user_id],
    queryFn: async () => {
      const { data } = await supabase.functions.invoke('get-transcript-queue');
      return data;
    },
    enabled: isOpen, // Only fetch when drawer is open
    refetchInterval: isOpen ? 5000 : false, // Real-time updates when open
  });

  // Real-time updates via WebSocket
  useEffect(() => {
    if (!isOpen || !user_id) return;

    const channel = supabase
      .channel('transcript-updates')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'transcripts',
        filter: `user_id=eq.${user_id}`
      }, (payload) => {
        // Auto-refresh when transcript status changes
        queryClient.invalidateQueries({ queryKey: ['transcript-queue'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, user_id, queryClient]);

  const hasAnyItems = (queueData?.processing?.length || 0) + 
                    (queueData?.failed?.length || 0) + 
                    (queueData?.pending?.length || 0) > 0;

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="max-h-[80vh]">
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Transcript Processing Queue
          </DrawerTitle>
          <DrawerDescription>
            Manage your meeting transcripts and analysis pipeline
          </DrawerDescription>
        </DrawerHeader>
        
        <ScrollArea className="flex-1">
          <div className="space-y-6 p-6">
            {!hasAnyItems ? (
              <div className="text-center py-8">
                <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No transcripts in queue</p>
                <p className="text-sm text-muted-foreground">All your transcripts have been processed</p>
              </div>
            ) : (
              <>
                {queueData?.processing?.length > 0 && (
                  <QueueSection
                    title="⚡ Currently Processing"
                    items={queueData.processing}
                    type="processing"
                  />
                )}
                
                {queueData?.failed?.length > 0 && (
                  <QueueSection
                    title="❌ Needs Attention"
                    items={queueData.failed}
                    type="failed"
                    showRetryButton={true}
                  />
                )}
                
                {queueData?.pending?.length > 0 && (
                  <QueueSection
                    title="💡 Ready for Analysis"
                    items={queueData.pending}
                    type="manual"
                    showAnalyzeButton={true}
                  />
                )}
              </>
            )}
          </div>
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  );
}