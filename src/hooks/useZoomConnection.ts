
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ZoomConnectionStatus {
  isConnected: boolean;
  isLoading: boolean;
  error: Error | null;
}

export const useZoomConnection = (): ZoomConnectionStatus => {
  const { user } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ['zoom-connection-status', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase.rpc('integration_framework_get_connection', {
        user_uuid: user.id,
        integration_type: 'zoom'
      });

      if (error) {
        throw error;
      }

      // Check if we have a valid connection
      const hasConnection = data && 
        typeof data === 'object' && 
        'status' in data && 
        data.status === 'success' && 
        'data' in data && 
        data.data;

      return { connected: !!hasConnection };
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
    retryDelay: 1000,
  });

  return {
    isConnected: data?.connected || false,
    isLoading,
    error: error as Error | null,
  };
};
