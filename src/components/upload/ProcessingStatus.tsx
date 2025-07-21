import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AlertCircle, Clock, Loader2 } from 'lucide-react';

interface ProcessingStatusProps {
  user_id: string;
}

export function ProcessingStatus({ user_id }: ProcessingStatusProps) {
  const { data: queueData } = useQuery({
    queryKey: ['transcript-queue', user_id],
    queryFn: async () => {
      const { data } = await supabase.functions.invoke('get-transcript-queue');
      return data;
    },
    refetchInterval: 10000, // Check every 10 seconds
    enabled: !!user_id,
  });

  const processingCount = queueData?.processing?.length || 0;
  const failedCount = queueData?.failed?.length || 0;
  const pendingCount = queueData?.pending?.length || 0;
  const hasAnyItems = processingCount + failedCount + pendingCount > 0;

  // Only render if there are items to show
  if (!hasAnyItems) return null;

  return (
    <div className="mt-4 text-sm text-muted-foreground flex items-center justify-center gap-4">
      {processingCount > 0 && (
        <span className="flex items-center gap-1">
          <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
          <span className="text-blue-600">{processingCount} processing</span>
        </span>
      )}
      {failedCount > 0 && (
        <span className="flex items-center gap-1 text-red-600">
          <AlertCircle className="h-3 w-3" />
          {failedCount} need attention
        </span>
      )}
      {pendingCount > 0 && (
        <span className="flex items-center gap-1 text-muted-foreground">
          <Clock className="h-3 w-3" />
          {pendingCount} ready for analysis
        </span>
      )}
    </div>
  );
}