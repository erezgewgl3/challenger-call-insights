import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import ZeroStateDashboard from './ZeroStateDashboard';
import ActiveDashboard from './ActiveDashboard';

export default function WelcomeDashboard() {
  const { user } = useAuth();

  const { data: transcriptCount = 0 } = useQuery({
    queryKey: ['transcript-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('transcripts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id);
      return count || 0;
    },
    enabled: !!user?.id,
  });

  // Conditional rendering based on transcript count
  if (transcriptCount === 0) {
    return <ZeroStateDashboard />;
  }

  return <ActiveDashboard />;
}
