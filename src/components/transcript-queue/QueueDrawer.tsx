import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { AlertTriangle, Clock, CheckCircle, XCircle, Filter } from 'lucide-react';
import { QueueFilters } from './QueueFilters';
import { AssignedQueueSection } from './AssignedQueueSection';
import { OwnedQueueSection } from './OwnedQueueSection';
import { BulkActions } from './BulkActions';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface QueueDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface QueueData {
  queues: {
    owned: QueueItem[];
    assigned: QueueItem[];
    combined: QueueItem[];
  };
  summary: {
    total_pending: number;
    urgent_count: number;
    assigned_pending: number;
    owned_pending: number;
  };
}

export interface QueueItem {
  id: string;
  title: string;
  meeting_date: string;
  duration_minutes: number | null;
  processing_status: string;
  external_source: string | null;
  priority_level: string;
  zoho_deal_id: string | null;
  assignment_metadata: any;
  created_at: string;
  queue_position: number;
  is_assigned: boolean;
  assignment_status: string | null;
  deal_context?: {
    company_name?: string;
    contact_name?: string;
    deal_name?: string;
  };
}

export function QueueDrawer({ open, onOpenChange }: QueueDrawerProps) {
  const [activeTab, setActiveTab] = useState<'owned' | 'assigned'>('owned');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    status: ['pending'],
    priority: [],
    source: []
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch queue data with filters
  const { data: queueData, isLoading, error } = useQuery({
    queryKey: ['transcript-queue', filters, activeTab],
    queryFn: async () => {
      const params = new URLSearchParams({
        assignment_type: 'all',
        ...Object.fromEntries(
          Object.entries(filters).map(([key, values]) => [key, values.join(',')])
        )
      });

      const response = await supabase.functions.invoke('get-transcript-queue', {
        method: 'GET',
        body: params.toString()
      });

      if (response.error) throw response.error;
      return response.data as QueueData;
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Assignment action mutation
  const assignmentMutation = useMutation({
    mutationFn: async ({ action, transcriptIds, reason }: {
      action: string;
      transcriptIds: string[];
      reason?: string;
    }) => {
      const payload = transcriptIds.length === 1 
        ? { action, transcript_id: transcriptIds[0], reason }
        : { action: `bulk_${action}`, transcript_ids: transcriptIds, reason };

      const response = await supabase.functions.invoke('queue-assignment-actions', {
        body: payload
      });

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['transcript-queue'] });
      toast({
        title: "Assignment Updated",
        description: `Successfully ${variables.action}ed ${variables.transcriptIds.length} transcript(s)`,
      });
      setSelectedItems([]);
    },
    onError: (error) => {
      toast({
        title: "Assignment Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleBulkAction = (action: 'accept' | 'reject', reason?: string) => {
    if (selectedItems.length === 0) return;
    assignmentMutation.mutate({ action, transcriptIds: selectedItems, reason });
  };

  const handleItemSelect = (itemId: string, selected: boolean) => {
    setSelectedItems(prev => 
      selected 
        ? [...prev, itemId]
        : prev.filter(id => id !== itemId)
    );
  };

  const currentQueue = activeTab === 'owned' 
    ? queueData?.queues.owned || []
    : queueData?.queues.assigned || [];

  const summary = queueData?.summary;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[600px] sm:w-[900px] p-0">
        <SheetHeader className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Transcript Processing Queue
            </SheetTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
              </Button>
              <QueueSummaryBadges summary={summary} />
            </div>
          </div>

          {showFilters && (
            <QueueFilters
              filters={filters}
              onFiltersChange={setFilters}
              onClose={() => setShowFilters(false)}
            />
          )}
        </SheetHeader>

        <div className="flex flex-col h-[calc(100vh-120px)]">
          {/* Tab Navigation */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
            <div className="px-6 border-b">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="owned" className="flex items-center gap-2">
                  My Uploads
                  {summary?.owned_pending > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {summary.owned_pending}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="assigned" className="flex items-center gap-2">
                  Assigned to Me
                  {summary?.assigned_pending > 0 && (
                    <Badge variant="default" className="ml-1">
                      {summary.assigned_pending}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Bulk Actions */}
            {selectedItems.length > 0 && activeTab === 'assigned' && (
              <div className="px-6 py-3 border-b bg-muted/50">
                <BulkActions
                  selectedCount={selectedItems.length}
                  onAccept={(reason) => handleBulkAction('accept', reason)}
                  onReject={(reason) => handleBulkAction('reject', reason)}
                  onClearSelection={() => setSelectedItems([])}
                  isLoading={assignmentMutation.isPending}
                />
              </div>
            )}

            {/* Queue Content */}
            <div className="flex-1 overflow-auto">
              <TabsContent value="owned" className="m-0">
                <OwnedQueueSection
                  items={currentQueue}
                  isLoading={isLoading}
                  onItemProcess={(id) => {
                    // Handle processing - integrate with existing analyze flow
                    console.log('Process transcript:', id);
                  }}
                />
              </TabsContent>
              
              <TabsContent value="assigned" className="m-0">
                <AssignedQueueSection
                  items={currentQueue}
                  selectedItems={selectedItems}
                  isLoading={isLoading}
                  onItemSelect={handleItemSelect}
                  onItemAccept={(id, reason) => handleBulkAction('accept', reason)}
                  onItemReject={(id, reason) => handleBulkAction('reject', reason)}
                  isProcessing={assignmentMutation.isPending}
                />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function QueueSummaryBadges({ summary }: { summary?: any }) {
  if (!summary) return null;

  return (
    <div className="flex items-center gap-2">
      {summary.urgent_count > 0 && (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          {summary.urgent_count} Urgent
        </Badge>
      )}
      {summary.total_pending > 0 && (
        <Badge variant="outline">
          {summary.total_pending} Pending
        </Badge>
      )}
    </div>
  );
}