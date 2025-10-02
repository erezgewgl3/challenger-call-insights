import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";

interface TranscriptViewerDialogProps {
  transcriptId: string | null;
  onOpenChange: (open: boolean) => void;
}

export function TranscriptViewerDialog({
  transcriptId,
  onOpenChange,
}: TranscriptViewerDialogProps) {
  const { data: transcript, isLoading } = useQuery({
    queryKey: ["transcript-text", transcriptId],
    queryFn: async () => {
      if (!transcriptId) return null;
      
      const { data, error } = await supabase
        .from("transcripts")
        .select("raw_text, title")
        .eq("id", transcriptId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!transcriptId,
  });

  return (
    <Dialog open={!!transcriptId} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>
            {transcript?.title || "Transcript Preview"}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[calc(85vh-8rem)] pr-4">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          ) : !transcript?.raw_text ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                No transcript content available
              </p>
            </div>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-foreground bg-muted/50 p-4 rounded-lg">
                {transcript.raw_text}
              </pre>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
