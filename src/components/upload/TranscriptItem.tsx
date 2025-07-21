import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, RotateCcw, Play, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface TranscriptItemProps {
  transcript: {
    id: string;
    filename: string;
    created_at: string;
    processing_status: string;
    processing_started_at?: string;
    processing_error?: string;
  };
  showRetryButton?: boolean;
  showAnalyzeButton?: boolean;
}

export function TranscriptItem({ 
  transcript, 
  showRetryButton = false, 
  showAnalyzeButton = false 
}: TranscriptItemProps) {
  const [isLoading, setIsLoading] = useState(false);
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
      const { error } = await supabase.functions.invoke('manual-process-transcript', {
        body: { transcript_id: transcript.id }
      });
      
      if (error) throw error;
      
      toast({
        title: "Analysis started",
        description: "Your transcript is now being processed.",
      });
    } catch (error) {
      console.error('Failed to start analysis:', error);
      toast({
        title: "Failed to start analysis",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
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
    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate">
          {transcript.filename}
        </p>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{formatTimeAgo(transcript.created_at)}</span>
          {transcript.processing_error && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-destructive truncate max-w-48 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {transcript.processing_error}
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
      </div>
    </div>
  );
}