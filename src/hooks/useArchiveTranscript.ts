import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ArchiveTranscriptParams {
  transcriptId: string;
  shouldArchive: boolean;
}

export const useArchiveTranscript = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ transcriptId, shouldArchive }: ArchiveTranscriptParams) => {
      const { data, error } = await supabase.functions.invoke('archive-transcript', {
        body: { transcriptId, shouldArchive },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      toast.success(variables.shouldArchive ? 'Deal archived' : 'Deal restored');
      queryClient.invalidateQueries({ queryKey: ['heat-transcripts'] });
      queryClient.invalidateQueries({ queryKey: ['archived-transcripts'] });
    },
    onError: (error) => {
      console.error('Archive error:', error);
      toast.error('Failed to archive deal');
    },
  });
};
