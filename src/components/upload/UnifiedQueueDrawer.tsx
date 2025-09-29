import React, { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ClipboardList, User, Users, Activity, CheckCircle, AlertTriangle } from 'lucide-react';
import { QueueSection } from './QueueSection';

interface UnifiedQueueDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user_id: string;
}

interface QueueStats {
  total_owned: number;
  total_assigned: number;
  pending_owned: number;
  pending_assigned: number;
  processing_count: number;
  error_count: number;
}

interface QueueData {
  owned: {
    pending: any[];
    processing: any[];
    failed: any[];
    completed: any[];
  };
  assigned: {
    pending: any[];
    processing: any[];
    completed: any[];
  };
  stats: QueueStats;
}

export function UnifiedQueueDrawer({ isOpen, onClose, user_id }: UnifiedQueueDrawerProps) {
  const queryClient = useQueryClient();

  const { data: queueData, isLoading } = useQuery({
    queryKey: ['unified-transcript-queue', user_id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_unified_transcript_queue', {
        p_user_id: user_id
      });
      if (error) throw error;
      return data as unknown as QueueData;
    },
    enabled: isOpen && !!user_id,
    refetchInterval: isOpen ? 5000 : false, // Real-time updates when open
  });

  // Enhanced real-time updates
  useEffect(() => {
    if (!isOpen || !user_id) return;

    const channel = supabase
      .channel('unified-queue-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'transcripts'
      }, (payload) => {
        // Check if this update affects the current user
        const transcript = (payload.new || payload.old) as any;
        if (transcript?.user_id === user_id || transcript?.assigned_user_id === user_id) {
          queryClient.invalidateQueries({ queryKey: ['unified-transcript-queue'] });
        }
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'conversation_analysis'
      }, () => {
        // Analysis updates affect queue display
        queryClient.invalidateQueries({ queryKey: ['unified-transcript-queue'] });
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'integration_connections'
      }, () => {
        // Integration changes might affect queue
        queryClient.invalidateQueries({ queryKey: ['unified-transcript-queue'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, user_id, queryClient]);

  const stats = queueData?.stats || {
    total_owned: 0,
    total_assigned: 0,
    pending_owned: 0,
    pending_assigned: 0,
    processing_count: 0,
    error_count: 0
  };

  const totalItems = stats.pending_owned + stats.pending_assigned + stats.processing_count;
  const hasAnyItems = totalItems > 0 || stats.error_count > 0;

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Unified Transcript Queue
          </DrawerTitle>
          <DrawerDescription>
            Manage your owned and assigned transcripts across all integrations
          </DrawerDescription>
          
          {/* Quick Stats */}
          <div className="flex gap-4 mt-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-blue-500" />
              <span className="text-sm">
                <strong>{stats.pending_owned}</strong> owned pending
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-green-500" />
              <span className="text-sm">
                <strong>{stats.pending_assigned}</strong> assigned pending
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-purple-500" />
              <span className="text-sm">
                <strong>{stats.processing_count}</strong> processing
              </span>
            </div>
            {stats.error_count > 0 && (
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <span className="text-sm text-destructive">
                  <strong>{stats.error_count}</strong> failed
                </span>
              </div>
            )}
          </div>
        </DrawerHeader>
        
        <ScrollArea className="flex-1">
          <div className="p-6">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
                    <div className="h-20 bg-muted rounded"></div>
                  </div>
                ))}
              </div>
            ) : !hasAnyItems ? (
              <div className="text-center py-12">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">All caught up!</h3>
                <p className="text-muted-foreground mb-1">No transcripts in queue</p>
                <p className="text-sm text-muted-foreground">
                  Your transcripts from Zoom, Zapier, and uploads are all processed
                </p>
              </div>
            ) : (
              <Tabs defaultValue="owned" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="owned" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    My Transcripts
                    {stats.pending_owned > 0 && (
                      <Badge variant="secondary" className="ml-1">
                        {stats.pending_owned}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="assigned" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Assigned to Me
                    {stats.pending_assigned > 0 && (
                      <Badge variant="secondary" className="ml-1">
                        {stats.pending_assigned}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="owned" className="space-y-6 mt-6">
                  {/* Processing Owned */}
                  {queueData?.owned?.processing?.length > 0 && (
                    <QueueSection
                      title="⚡ Currently Processing"
                      items={queueData.owned.processing}
                      type="processing"
                    />
                  )}
                  
                  {/* Failed Owned */}
                  {queueData?.owned?.failed?.length > 0 && (
                    <QueueSection
                      title="❌ Needs Attention"
                      items={queueData.owned.failed}
                      type="failed"
                      showRetryButton={true}
                    />
                  )}
                  
                  {/* Pending Owned */}
                  {queueData?.owned?.pending?.length > 0 && (
                    <QueueSection
                      title="💡 Ready for Analysis"
                      items={queueData.owned.pending}
                      type="manual"
                      showAnalyzeButton={true}
                    />
                  )}
                  
                  {/* Recent Completed Owned */}
                  {queueData?.owned?.completed?.length > 0 && (
                    <QueueSection
                      title="✅ Recently Completed"
                      items={queueData.owned.completed.slice(0, 5)}
                      type="completed"
                    />
                  )}

                  {/* Empty State for Owned */}
                  {!queueData?.owned?.processing?.length && 
                   !queueData?.owned?.failed?.length && 
                   !queueData?.owned?.pending?.length && (
                    <div className="text-center py-8">
                      <User className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">No owned transcripts in queue</p>
                      <p className="text-sm text-muted-foreground">
                        Upload transcripts or connect integrations to get started
                      </p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="assigned" className="space-y-6 mt-6">
                  {/* Processing Assigned */}
                  {queueData?.assigned?.processing?.length > 0 && (
                    <QueueSection
                      title="⚡ Currently Processing"
                      items={queueData.assigned.processing}
                      type="processing"
                    />
                  )}
                  
                  {/* Pending Assigned */}
                  {queueData?.assigned?.pending?.length > 0 && (
                    <QueueSection
                      title="💼 Assigned to You"
                      items={queueData.assigned.pending}
                      type="assigned"
                      showAnalyzeButton={true}
                    />
                  )}
                  
                  {/* Recent Completed Assigned */}
                  {queueData?.assigned?.completed?.length > 0 && (
                    <QueueSection
                      title="✅ Recently Completed"
                      items={queueData.assigned.completed.slice(0, 3)}
                      type="completed"
                    />
                  )}

                  {/* Empty State for Assigned */}
                  {!queueData?.assigned?.processing?.length && 
                   !queueData?.assigned?.pending?.length && (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">No assigned transcripts</p>
                      <p className="text-sm text-muted-foreground">
                        Transcripts assigned to you by team members will appear here
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </div>
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  );
}