
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ZoomConnectionStatus {
  isConnected: boolean;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export const useZoomConnection = (): ZoomConnectionStatus => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['zoom-connection-status', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase.rpc('integration_framework_get_connection', {
        user_uuid: user.id,
        integration_type_param: 'zoom'
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
    staleTime: 2 * 60 * 1000, // 2 minutes (shorter for better responsiveness)
    refetchOnWindowFocus: true,
    retry: 1,
    retryDelay: 1000,
  });

  return {
    isConnected: data?.connected || false,
    isLoading,
    error: error as Error | null,
    refetch,
  };
};

// Export function to invalidate Zoom connection queries
export const invalidateZoomConnection = (queryClient: any, userId?: string) => {
  if (userId) {
    queryClient.invalidateQueries({ queryKey: ['zoom-connection-status', userId] });
  } else {
    queryClient.invalidateQueries({ queryKey: ['zoom-connection-status'] });
  }
};
