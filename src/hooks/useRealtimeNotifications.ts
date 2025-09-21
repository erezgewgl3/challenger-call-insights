import { useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface NotificationOptions {
  userId?: string;
  enableAssignmentNotifications?: boolean;
  enableProgressNotifications?: boolean;
  enableSystemNotifications?: boolean;
}

export function useRealtimeNotifications(options: NotificationOptions = {}) {
  const { toast } = useToast();

  const showAssignmentNotification = useCallback((payload: any) => {
    if (payload.new?.assigned_to === options.userId) {
      toast({
        title: "New Assignment",
        description: "You have been assigned a new transcript to review",
      });
    }
  }, [options.userId, toast]);

  const showProgressNotification = useCallback((payload: any) => {
    const { old: oldRecord, new: newRecord } = payload;
    
    if (oldRecord?.processing_status === 'processing' && 
        newRecord?.processing_status === 'completed') {
      toast({
        title: "Analysis Complete",
        description: `Transcript "${newRecord.title}" has been analyzed`,
      });
    }

    if (oldRecord?.processing_status !== 'failed' && 
        newRecord?.processing_status === 'failed') {
      toast({
        title: "Processing Failed",
        description: `Analysis failed for "${newRecord.title}"`,
        variant: "destructive"
      });
    }
  }, [toast]);

  useEffect(() => {
    if (!options.userId) return;

    const channels = [];

    // Assignment notifications
    if (options.enableAssignmentNotifications) {
      const assignmentChannel = supabase
        .channel('notifications_assignments')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'queue_assignments',
            filter: `assigned_to=eq.${options.userId}`
          },
          showAssignmentNotification
        );
      
      channels.push(assignmentChannel);
    }

    // Progress notifications
    if (options.enableProgressNotifications) {
      const progressChannel = supabase
        .channel('notifications_progress')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'transcripts',
            filter: `user_id=eq.${options.userId}`
          },
          showProgressNotification
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'transcripts',
            filter: `assigned_user_id=eq.${options.userId}`
          },
          showProgressNotification
        );
      
      channels.push(progressChannel);
    }

    // Subscribe to all channels
    channels.forEach(channel => channel.subscribe());

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [options, showAssignmentNotification, showProgressNotification]);
}