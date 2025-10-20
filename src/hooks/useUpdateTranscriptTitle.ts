import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UpdateTranscriptTitleParams {
  transcriptId: string;
  newTitle: string;
}

export function useUpdateTranscriptTitle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ transcriptId, newTitle }: UpdateTranscriptTitleParams) => {
      const trimmedTitle = newTitle.trim();
      
      if (!trimmedTitle) {
        throw new Error("Title cannot be empty");
      }
      
      if (trimmedTitle.length > 200) {
        throw new Error("Title must be less than 200 characters");
      }

      const { error } = await supabase
        .from('transcripts')
        .update({ title: trimmedTitle })
        .eq('id', transcriptId);

      if (error) throw error;
      
      return { transcriptId, newTitle: trimmedTitle };
    },
    onMutate: async ({ transcriptId, newTitle }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['transcripts'] });
      await queryClient.cancelQueries({ queryKey: ['heat-transcripts'] });

      // Snapshot previous value
      const previousData = queryClient.getQueryData(['transcripts']);
      const previousHeatData = queryClient.getQueryData(['heat-transcripts']);

      // Optimistically update to the new value
      queryClient.setQueriesData({ queryKey: ['transcripts'] }, (old: any) => {
        if (!old) return old;
        
        // Handle array of transcripts
        if (Array.isArray(old)) {
          return old.map((t: any) => 
            t.id === transcriptId ? { ...t, title: newTitle.trim() } : t
          );
        }
        
        return old;
      });

      // Also optimistically update heat-transcripts
      queryClient.setQueriesData({ queryKey: ['heat-transcripts'] }, (old: any) => {
        if (!old) return old;
        
        if (Array.isArray(old)) {
          return old.map((t: any) => 
            t.id === transcriptId ? { ...t, title: newTitle.trim() } : t
          );
        }
        
        return old;
      });

      return { previousData, previousHeatData };
    },
    onError: (error: any, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(['transcripts'], context.previousData);
      }
      if (context?.previousHeatData) {
        queryClient.setQueryData(['heat-transcripts'], context.previousHeatData);
      }
      
      toast.error(error.message || "Failed to update title");
    },
    onSuccess: () => {
      toast.success("Title updated");
    },
    onSettled: () => {
      // Invalidate ALL transcript-related queries to ensure dashboard updates
      queryClient.invalidateQueries({ 
        queryKey: ['transcripts'],
        refetchType: 'all' // Force refetch of all matching queries
      });
      
      // CRITICAL: ActiveDashboard uses 'heat-transcripts' query key
      queryClient.invalidateQueries({ 
        queryKey: ['heat-transcripts'],
        refetchType: 'all'
      });
      
      // Also invalidate queue-related queries that may display transcripts
      queryClient.invalidateQueries({ 
        queryKey: ['queue'] 
      });
      
      // Invalidate transcript data hook queries
      queryClient.invalidateQueries({ 
        queryKey: ['transcript-data'] 
      });
      
      // Invalidate transcript count queries
      queryClient.invalidateQueries({ 
        queryKey: ['transcript-count'] 
      });
    }
  });
}
