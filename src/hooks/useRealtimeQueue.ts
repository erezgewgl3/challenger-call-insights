import { useEffect, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface RealtimeQueueOptions {
  userId?: string;
  enableNotifications?: boolean;
  enableProgressUpdates?: boolean;
}

interface QueueUpdate {
  type: 'insert' | 'update' | 'delete';
  table: string;
  record: any;
  old_record?: any;
}

export function useRealtimeQueue(options: RealtimeQueueOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Handle queue updates
  const handleQueueUpdate = useCallback((update: QueueUpdate) => {
    console.log('🔄 [REALTIME] Queue update received:', update);

    // Invalidate relevant queries
    queryClient.invalidateQueries({ queryKey: ['transcript-queue'] });

    // Show notifications for relevant events
    if (options.enableNotifications) {
      handleNotifications(update);
    }

    // Update specific transcript data if needed
    if (update.table === 'transcripts' && update.type === 'update') {
      queryClient.setQueryData(
        ['transcript', update.record.id],
        (oldData: any) => oldData ? { ...oldData, ...update.record } : update.record
      );
    }
  }, [queryClient, options.enableNotifications]);

  // Handle notifications
  const handleNotifications = useCallback((update: QueueUpdate) => {
    if (update.table === 'queue_assignments' && update.type === 'insert') {
      // New assignment notification
      if (update.record.assigned_to === options.userId) {
        toast({
          title: "New Transcript Assigned",
          description: "You have a new transcript to review in your queue",
        });
      }
    }

    if (update.table === 'transcripts' && update.type === 'update') {
      // Processing status changes
      if (update.record.processing_status === 'completed' && 
          update.old_record?.processing_status === 'processing') {
        toast({
          title: "Analysis Complete",
          description: `Analysis finished for: ${update.record.title}`,
        });
      }
    }
  }, [options.userId, toast]);

  // Setup real-time subscriptions
  useEffect(() => {
    if (!options.userId) return;

    setConnectionStatus('connecting');

    const channels = [];

    // Subscribe to transcript updates for user's transcripts
    const transcriptChannel = supabase
      .channel('transcript_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transcripts',
          filter: `user_id=eq.${options.userId}`
        },
        (payload) => {
          handleQueueUpdate({
            type: payload.eventType as any,
            table: 'transcripts',
            record: payload.new,
            old_record: payload.old
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transcripts',
          filter: `assigned_user_id=eq.${options.userId}`
        },
        (payload) => {
          handleQueueUpdate({
            type: payload.eventType as any,
            table: 'transcripts',
            record: payload.new,
            old_record: payload.old
          });
        }
      );

    // Subscribe to assignment updates
    const assignmentChannel = supabase
      .channel('assignment_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'queue_assignments',
          filter: `assigned_to=eq.${options.userId}`
        },
        (payload) => {
          handleQueueUpdate({
            type: payload.eventType as any,
            table: 'queue_assignments',
            record: payload.new,
            old_record: payload.old
          });
        }
      );

    // Subscribe to external queue updates
    const externalQueueChannel = supabase
      .channel('external_queue_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'external_transcript_queue'
        },
        (payload) => {
          handleQueueUpdate({
            type: payload.eventType as any,
            table: 'external_transcript_queue',
            record: payload.new,
            old_record: payload.old
          });
        }
      );

    channels.push(transcriptChannel, assignmentChannel, externalQueueChannel);

    // Subscribe to all channels
    Promise.all(channels.map(channel => channel.subscribe()))
      .then((subscriptions) => {
        const allConnected = subscriptions.every(sub => sub === 'SUBSCRIBED');
        setIsConnected(allConnected);
        setConnectionStatus(allConnected ? 'connected' : 'disconnected');
        
        if (allConnected) {
          console.log('🔄 [REALTIME] All subscriptions active');
        }
      })
      .catch((error) => {
        console.error('🔄 [ERROR] Subscription failed:', error);
        setConnectionStatus('disconnected');
      });

    // Cleanup function
    return () => {
      channels.forEach(channel => {
        supabase.removeChannel(channel);
      });
      setIsConnected(false);
      setConnectionStatus('disconnected');
    };
  }, [options.userId, handleQueueUpdate]);

  // Manual refresh function
  const refreshQueue = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['transcript-queue'] });
  }, [queryClient]);

  return {
    isConnected,
    connectionStatus,
    refreshQueue
  };
}