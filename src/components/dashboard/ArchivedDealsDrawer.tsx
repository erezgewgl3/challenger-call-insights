import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Archive, RotateCcw } from 'lucide-react';
import { useArchiveTranscript } from '@/hooks/useArchiveTranscript';
import { format } from 'date-fns';

export function ArchivedDealsDrawer() {
  const archiveMutation = useArchiveTranscript();

  const { data: archivedTranscripts, isLoading } = useQuery({
    queryKey: ['archived-transcripts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transcripts')
        .select(`
          id,
          title,
          meeting_date,
          archived_at,
          conversation_analysis (
            heat_level,
            challenger_scores
          )
        `)
        .eq('is_archived', true)
        .eq('processing_status', 'completed')
        .order('archived_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const handleRestore = (transcriptId: string) => {
    archiveMutation.mutate({ transcriptId, shouldArchive: false });
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <Archive className="w-4 h-4 mr-2" />
          Archived Deals
          {archivedTranscripts && archivedTranscripts.length > 0 && (
            <span className="ml-2 bg-muted px-2 py-0.5 rounded-full text-xs">
              {archivedTranscripts.length}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Archived Deals</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          {isLoading ? (
            <div className="text-center text-muted-foreground py-8">Loading...</div>
          ) : !archivedTranscripts || archivedTranscripts.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No archived deals
            </div>
          ) : (
            archivedTranscripts.map((transcript) => (
              <div
                key={transcript.id}
                className="p-4 border rounded-lg space-y-2 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium">{transcript.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      Archived {transcript.archived_at && format(new Date(transcript.archived_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRestore(transcript.id)}
                    disabled={archiveMutation.isPending}
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Restore
                  </Button>
                </div>
                {transcript.conversation_analysis?.[0] && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      transcript.conversation_analysis[0].heat_level === 'HIGH'
                        ? 'bg-red-100 text-red-700'
                        : transcript.conversation_analysis[0].heat_level === 'MEDIUM'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {transcript.conversation_analysis[0].heat_level}
                    </span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
