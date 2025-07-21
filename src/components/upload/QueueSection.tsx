import React from 'react';
import { Badge } from '@/components/ui/badge';
import { TranscriptItem } from './TranscriptItem';

interface QueueSectionProps {
  title: string;
  items: Array<{
    id: string;
    filename: string;
    created_at: string;
    processing_status: string;
    processing_started_at?: string;
    processing_error?: string;
  }>;
  type: 'processing' | 'failed' | 'manual';
  showRetryButton?: boolean;
  showAnalyzeButton?: boolean;
}

export function QueueSection({ 
  title, 
  items, 
  type, 
  showRetryButton = false, 
  showAnalyzeButton = false 
}: QueueSectionProps) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h3 className="font-semibold text-foreground">{title}</h3>
        <Badge variant="secondary">{items.length}</Badge>
      </div>
      
      <div className="space-y-2">
        {items.map(transcript => (
          <TranscriptItem 
            key={transcript.id}
            transcript={transcript}
            showRetryButton={showRetryButton}
            showAnalyzeButton={showAnalyzeButton}
          />
        ))}
      </div>
    </div>
  );
}