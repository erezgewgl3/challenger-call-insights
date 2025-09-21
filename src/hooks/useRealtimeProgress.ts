import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface ProgressUpdate {
  transcript_id: string;
  progress: number;
  current_step: string;
  status: string;
  timestamp: string;
}

export function useRealtimeProgress(transcriptId: string) {
  const [progress, setProgress] = useState<ProgressUpdate | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!transcriptId) return;

    const channel = supabase
      .channel(`progress_${transcriptId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'transcripts',
          filter: `id=eq.${transcriptId}`
        },
        (payload) => {
          if (payload.new && typeof payload.new === 'object') {
            const record = payload.new as any;
            if (record.processing_status || record.analysis_progress) {
              setProgress({
                transcript_id: transcriptId,
                progress: record.analysis_progress || 0,
                current_step: record.current_processing_step || 'parsing',
                status: record.processing_status,
                timestamp: new Date().toISOString()
              });
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transcript_progress',
          filter: `transcript_id=eq.${transcriptId}`
        },
        (payload) => {
          if (payload.new && typeof payload.new === 'object') {
            const record = payload.new as any;
            setProgress({
              transcript_id: transcriptId,
              progress: record.progress || 0,
              current_step: record.phase || 'starting',
              status: 'processing',
              timestamp: new Date().toISOString()
            });
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
      setIsConnected(false);
    };
  }, [transcriptId]);

  return { progress, isConnected };
}