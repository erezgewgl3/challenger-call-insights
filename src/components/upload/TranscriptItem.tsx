import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, RotateCcw, Play, AlertCircle, Trash2, User, Building2, Calendar, Clock, Activity, ExternalLink } from 'lucide-react';
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
    duration_minutes?: number;
    priority_level?: string;
    zoho_deal_id?: string;
    zoho_meeting_id?: string;
    original_filename?: string;
    deal_context?: {
      company_name?: string;
      contact_name?: string;
      deal_name?: string;
      meeting_host?: string;
    };
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

  // Generate smart title from Zoho context or fallback to original
  const displayTitle = transcript.deal_context?.deal_name 
    || (transcript.deal_context?.contact_name ? `Call with ${transcript.deal_context.contact_name}` : null)
    || transcript.title;

  const hasZohoContext = transcript.deal_context && (
    transcript.deal_context.company_name || 
    transcript.deal_context.contact_name || 
    transcript.deal_context.deal_name
  );

  const zohoUrl = transcript.zoho_deal_id 
    ? `https://crm.zoho.com/crm/ShowEntityInfo.do?id=${transcript.zoho_deal_id}&module=Potentials`
    : null;

  return (
    <>
      <div className="flex items-start justify-between p-4 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors">
        <div className="flex-1 min-w-0 space-y-2">
          {/* Title and Priority */}
          <div className="flex items-start gap-2">
            <h3 className="font-semibold text-lg text-foreground leading-tight flex-1">
              {displayTitle}
            </h3>
            {transcript.priority_level === 'urgent' && (
              <Badge variant="destructive" className="text-xs shrink-0">🔥 Urgent</Badge>
            )}
            {transcript.priority_level === 'high' && (
              <Badge variant="destructive" className="text-xs shrink-0">High Priority</Badge>
            )}
          </div>

          {/* Zoho Context Card - Company and Contact */}
          {hasZohoContext && (
            <div className="flex items-center gap-3 text-sm">
              {transcript.deal_context.contact_name && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <User className="h-3.5 w-3.5" />
                  <span className="font-medium">{transcript.deal_context.contact_name}</span>
                </div>
              )}
              {transcript.deal_context.company_name && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5" />
                  <span>{transcript.deal_context.company_name}</span>
                </div>
              )}
            </div>
          )}

          {/* Host and Metadata Row */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
            {transcript.deal_context?.meeting_host && (
              <div className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                <span>Hosted by {transcript.deal_context.meeting_host}</span>
              </div>
            )}
            {transcript.meeting_date && (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span>{format(new Date(transcript.meeting_date), 'MMM d, yyyy')}</span>
              </div>
            )}
            {transcript.duration_minutes && (
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                <span>{transcript.duration_minutes} min</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5" />
              <span>{formatTimeAgo(transcript.created_at)}</span>
            </div>
            {transcript.external_source && (
              <SourceBadge source={transcript.external_source} />
            )}
          </div>

          {/* Error Display */}
          {transcript.processing_error && (
            <div className="flex items-start gap-2 p-2 bg-destructive/10 border border-destructive/20 rounded text-sm">
              <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-destructive flex-1">{transcript.processing_error}</p>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2 ml-4 shrink-0">
          {transcript.processing_status === 'processing' && (
            <div className="flex items-center gap-2 text-primary px-3 py-1.5 bg-primary/10 rounded-md">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm font-medium">Analyzing...</span>
            </div>
          )}
          
          {zohoUrl && (
            <Button
              size="sm"
              variant="outline"
              asChild
              className="shrink-0"
            >
              <a href={zohoUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-1" />
                View in Zoho
              </a>
            </Button>
          )}
          
          {showRetryButton && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleRetry}
              disabled={isLoading}
              className="shrink-0"
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
              className="shrink-0"
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
              className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
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