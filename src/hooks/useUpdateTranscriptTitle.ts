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

      // Snapshot previous value
      const previousData = queryClient.getQueryData(['transcripts']);

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

      return { previousData };
    },
    onError: (error: any, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(['transcripts'], context.previousData);
      }
      
      toast.error(error.message || "Failed to update title");
    },
    onSuccess: () => {
      toast.success("Title updated");
    },
    onSettled: () => {
      // Refetch to ensure sync
      queryClient.invalidateQueries({ queryKey: ['transcripts'] });
    }
  });
}
