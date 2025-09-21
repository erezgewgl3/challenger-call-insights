import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Building2, User, Calendar, ExternalLink, CheckCircle, XCircle } from 'lucide-react';
import { QueueItem } from './QueueDrawer';
import { ZohoContextCard } from './ZohoContextCard';

interface AssignedQueueSectionProps {
  items: QueueItem[];
  selectedItems: string[];
  isLoading: boolean;
  onItemSelect: (itemId: string, selected: boolean) => void;
  onItemAccept: (itemId: string, reason?: string) => void;
  onItemReject: (itemId: string, reason?: string) => void;
  isProcessing: boolean;
}

export function AssignedQueueSection({
  items,
  selectedItems,
  isLoading,
  onItemSelect,
  onItemAccept,
  onItemReject,
  isProcessing
}: AssignedQueueSectionProps) {
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
          <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground mb-2">
            No Assigned Transcripts
          </h3>
          <p className="text-sm text-muted-foreground max-w-md">
            You don't have any transcripts assigned to you right now. 
            Assigned transcripts from Zoho CRM will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="space-y-4">
        {items.map((item) => (
          <AssignedQueueItem
            key={item.id}
            item={item}
            isSelected={selectedItems.includes(item.id)}
            onSelect={(selected) => onItemSelect(item.id, selected)}
            onAccept={() => onItemAccept(item.id)}
            onReject={() => onItemReject(item.id)}
            isProcessing={isProcessing}
          />
        ))}
      </div>
    </div>
  );
}

function AssignedQueueItem({
  item,
  isSelected,
  onSelect,
  onAccept,
  onReject,
  isProcessing
}: {
  item: QueueItem;
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
  onAccept: () => void;
  onReject: () => void;
  isProcessing: boolean;
}) {
  const priorityColors = {
    urgent: 'destructive',
    high: 'orange',
    normal: 'secondary',
    low: 'outline'
  };

  return (
    <Card className={`transition-all duration-200 ${
      isSelected ? 'ring-2 ring-primary' : ''
    } hover:shadow-md`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={isSelected}
              onCheckedChange={onSelect}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-medium">{item.title}</h3>
                <Badge variant={priorityColors[item.priority_level] as any}>
                  {item.priority_level}
                </Badge>
                {item.external_source && (
                  <Badge variant="outline" className="text-xs">
                    {item.external_source}
                  </Badge>
                )}
              </div>
              
              {item.deal_context && (
                <ZohoContextCard
                  dealContext={item.deal_context}
                  zohoDealId={item.zoho_deal_id}
                  compact
                />
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={onReject}
              disabled={isProcessing}
              className="flex items-center gap-1"
            >
              <XCircle className="h-4 w-4" />
              Decline
            </Button>
            <Button
              size="sm"
              onClick={onAccept}
              disabled={isProcessing}
              className="flex items-center gap-1"
            >
              <CheckCircle className="h-4 w-4" />
              Accept
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {new Date(item.meeting_date).toLocaleDateString()}
            </div>
            {item.duration_minutes && (
              <span>{item.duration_minutes}min</span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <span>Queue #{item.queue_position}</span>
            {item.assignment_status && (
              <Badge variant="outline" className="text-xs">
                {item.assignment_status}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}