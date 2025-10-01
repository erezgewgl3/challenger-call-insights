import React from 'react';
import { Badge } from '@/components/ui/badge';
import { TranscriptItem } from './TranscriptItem';

interface QueueSectionProps {
  title: string;
  items: Array<{
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
  }>;
  type: 'processing' | 'failed' | 'manual' | 'completed' | 'assigned';
  showRetryButton?: boolean;
  showAnalyzeButton?: boolean;
  onDelete?: (transcriptId: string) => Promise<void>;
}

export function QueueSection({ 
  title, 
  items, 
  type, 
  showRetryButton = false, 
  showAnalyzeButton = false,
  onDelete
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
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}