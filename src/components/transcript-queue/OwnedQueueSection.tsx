import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Loader2, Play, Upload } from 'lucide-react';
import { QueueItem } from './QueueDrawer';
import { LiveProgressIndicator } from './LiveProgressIndicator';

interface OwnedQueueSectionProps {
  items: QueueItem[];
  isLoading: boolean;
  onItemProcess: (itemId: string) => void;
}

export function OwnedQueueSection({ items, isLoading, onItemProcess }: OwnedQueueSectionProps) {
  if (isLoading) {
    return (
      <div className="p-6">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="flex flex-col items-center justify-center py-12">
          <Upload className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground mb-2">
            No Transcripts in Queue
          </h3>
          <p className="text-sm text-muted-foreground max-w-md">
            All your uploaded transcripts have been processed. 
            Upload new meeting transcripts to see them here.
          </p>
        </div>
      </div>
    );
  }

  const pendingItems = items.filter(item => item.processing_status === 'pending');
  const processingItems = items.filter(item => item.processing_status === 'processing');
  const failedItems = items.filter(item => item.processing_status === 'failed');

  return (
    <div className="p-6 space-y-6">
      {processingItems.length > 0 && (
        <QueueGroup
          title="Currently Processing"
          icon={<Loader2 className="h-4 w-4 animate-spin" />}
          items={processingItems}
          onItemProcess={onItemProcess}
          showProcessButton={false}
        />
      )}

      {failedItems.length > 0 && (
        <QueueGroup
          title="Failed - Needs Attention"
          icon={<Clock className="h-4 w-4" />}
          items={failedItems}
          onItemProcess={onItemProcess}
          showProcessButton={true}
          variant="destructive"
        />
      )}

      {pendingItems.length > 0 && (
        <QueueGroup
          title="Ready for Analysis"
          icon={<Play className="h-4 w-4" />}
          items={pendingItems}
          onItemProcess={onItemProcess}
          showProcessButton={true}
        />
      )}
    </div>
  );
}

function QueueGroup({
  title,
  icon,
  items,
  onItemProcess,
  showProcessButton,
  variant = 'default'
}: {
  title: string;
  icon: React.ReactNode;
  items: QueueItem[];
  onItemProcess: (itemId: string) => void;
  showProcessButton: boolean;
  variant?: 'default' | 'destructive';
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="font-semibold">{title}</h3>
        </div>
        <Badge variant={variant === 'destructive' ? 'destructive' : 'secondary'}>
          {items.length}
        </Badge>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <OwnedQueueItem
            key={item.id}
            item={item}
            onProcess={() => onItemProcess(item.id)}
            showProcessButton={showProcessButton}
          />
        ))}
      </div>
    </div>
  );
}

function OwnedQueueItem({
  item,
  onProcess,
  showProcessButton
}: {
  item: QueueItem;
  onProcess: () => void;
  showProcessButton: boolean;
}) {
  const statusColors = {
    pending: 'outline',
    processing: 'default',
    failed: 'destructive',
    completed: 'secondary'
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-medium">{item.title}</h4>
              <Badge variant={statusColors[item.processing_status] as any}>
                {item.processing_status}
              </Badge>
              {item.priority_level !== 'normal' && (
                <Badge variant="outline" className="text-xs">
                  {item.priority_level}
                </Badge>
              )}
            </div>
          </div>

          {showProcessButton && (
            <Button size="sm" onClick={onProcess} className="flex items-center gap-1">
              <Play className="h-3 w-3" />
              {item.processing_status === 'failed' ? 'Retry' : 'Analyze'}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Live Progress Indicator */}
        {item.processing_status === 'processing' && (
          <div className="mb-3">
            <LiveProgressIndicator transcriptId={item.id} />
          </div>
        )}
        
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {new Date(item.meeting_date).toLocaleDateString()}
            </div>
            {item.duration_minutes && (
              <span>{item.duration_minutes}min</span>
            )}
            {item.external_source && (
              <Badge variant="outline" className="text-xs">
                {item.external_source}
              </Badge>
            )}
          </div>
          
          <span>Queue #{item.queue_position}</span>
        </div>
      </CardContent>
    </Card>
  );
}