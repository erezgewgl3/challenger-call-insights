import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, RotateCcw, Play, AlertCircle, Trash2 } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { SourceBadge } from '@/components/ui/SourceBadge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface TranscriptItemProps {
  transcript: {
    id: string;
    title: string;
    created_at: string;
    processing_status: string;
    processing_started_at?: string;
    processing_error?: string;
    external_source?: string;
    meeting_date?: string;
    priority_level?: string;
    zoho_deal_id?: string;
    zoho_meeting_id?: string;
    original_filename?: string;
  };
  showRetryButton?: boolean;
  showAnalyzeButton?: boolean;
  onDelete?: (transcriptId: string) => Promise<void>;
}

export function TranscriptItem({ 
  transcript, 
  showRetryButton = false, 
  showAnalyzeButton = false,
  onDelete
}: TranscriptItemProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleRetry = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.functions.invoke('manual-process-transcript', {
        body: { transcript_id: transcript.id }
      });
      
      if (error) throw error;
      
      toast({
        title: "Analysis restarted",
        description: "The transcript is now being processed again.",
      });
    } catch (error) {
      console.error('Failed to restart analysis:', error);
      toast({
        title: "Failed to restart analysis",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyze = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manual-process-transcript', {
        body: { transcript_id: transcript.id }
      });
      
      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }
      
      toast({
        title: "Analysis started",
        description: "Your transcript is now being processed.",
      });
    } catch (error: any) {
      console.error('Failed to start analysis:', error);
      toast({
        title: "Failed to start analysis",
        description: error?.message || "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    
    setIsDeleting(true);
    try {
      await onDelete(transcript.id);
      setShowDeleteDialog(false);
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'Unknown time';
    }
  };

  return (
    <>
      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-medium text-foreground truncate">
              {transcript.original_filename || transcript.title}
            </p>
            {transcript.external_source && (
              <SourceBadge source={transcript.external_source} />
            )}
            {transcript.priority_level === 'high' && (
              <Badge variant="destructive" className="text-xs">High Priority</Badge>
            )}
          </div>
          
          {/* Deal and Meeting Context */}
          {(transcript.zoho_deal_id || transcript.zoho_meeting_id) && (
            <div className="flex items-center gap-3 mb-1 text-xs text-muted-foreground">
              {transcript.zoho_deal_id && (
                <span>Deal: #{transcript.zoho_deal_id}</span>
              )}
              {transcript.zoho_meeting_id && (
                <span>Meeting: {transcript.zoho_meeting_id}</span>
              )}
            </div>
          )}
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {transcript.meeting_date && (
              <span>{format(new Date(transcript.meeting_date), 'MMM d, yyyy')}</span>
            )}
            <span>{formatTimeAgo(transcript.created_at)}</span>
            {transcript.processing_error && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-destructive truncate max-w-48 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Error
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-sm">{transcript.processing_error}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2 ml-4">
          {transcript.processing_status === 'processing' && (
            <div className="flex items-center gap-1 text-primary">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Analyzing...</span>
            </div>
          )}
          
          {showRetryButton && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleRetry}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Retry
                </>
              )}
            </Button>
          )}
          
          {showAnalyzeButton && (
            <Button
              size="sm"
              onClick={handleAnalyze}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Play className="h-4 w-4 mr-1" />
                  Analyze
                </>
              )}
            </Button>
          )}

          {onDelete && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowDeleteDialog(true)}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transcript?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the transcript "{transcript.title}" and all its analysis data. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}