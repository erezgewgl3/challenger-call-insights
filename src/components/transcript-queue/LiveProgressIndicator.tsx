import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Loader2, Wifi, WifiOff } from 'lucide-react';
import { useRealtimeProgress } from '@/hooks/useRealtimeProgress';

interface LiveProgressIndicatorProps {
  transcriptId: string;
  className?: string;
}

export function LiveProgressIndicator({ transcriptId, className }: LiveProgressIndicatorProps) {
  const { progress, isConnected } = useRealtimeProgress(transcriptId);

  if (!progress || progress.status !== 'processing') {
    return null;
  }

  const stepLabels: Record<string, string> = {
    parsing: 'Parsing transcript',
    analysis: 'AI analysis in progress',
    insights: 'Generating insights',
    formatting: 'Formatting results',
    crm_prep: 'Preparing CRM updates',
    starting: 'Starting analysis',
    complete: 'Analysis complete'
  };

  const stepLabel = stepLabels[progress.current_step] || progress.current_step.replace('_', ' ');

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <Loader2 className="h-3 w-3 animate-spin text-primary" />
          <span className="capitalize text-muted-foreground">{stepLabel}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">{Math.round(progress.progress)}%</span>
          {isConnected ? (
            <Wifi className="h-3 w-3 text-green-600" />
          ) : (
            <WifiOff className="h-3 w-3 text-red-600" />
          )}
        </div>
      </div>
      <Progress value={progress.progress} className="h-1.5" />
      {!isConnected && (
        <div className="text-xs text-muted-foreground">
          Connection lost - progress may be outdated
        </div>
      )}
    </div>
  );
}