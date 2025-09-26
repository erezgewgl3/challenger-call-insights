
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ZoomConnectionStatus {
  isConnected: boolean;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  connectionStatus: 'active' | 'error' | 'inactive' | 'not_found';
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

      console.log('Fetching Zoom connection status for user:', user.id);

      const { data, error } = await supabase.rpc('integration_framework_get_connection', {
        user_uuid: user.id,
        integration_type_param: 'zoom'
      });

      if (error) {
        console.error('Error fetching Zoom connection:', error);
        throw error;
      }

      // Check if we have a valid connection
      const hasConnection = data && 
        typeof data === 'object' && 
        'status' in data && 
        data.status === 'success' && 
        'data' in data && 
        data.data;

      // Extract connection status from database
      const connectionRecord = hasConnection && typeof data.data === 'object' && data.data !== null ? 
        data.data as { connection_status?: string } : null;
      
      const connectionStatus = connectionRecord?.connection_status || 'not_found';
      
      const isActive = connectionStatus === 'active';

      console.log('Zoom connection status result:', { hasConnection, connectionStatus, isActive, data });

      return { 
        connected: isActive,
        connectionStatus: connectionStatus as 'active' | 'error' | 'inactive' | 'not_found'
      };
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000, // 30 seconds - shorter for faster updates after OAuth
    refetchOnWindowFocus: true,
    refetchOnMount: true, // Always refetch when component mounts
    retry: 1,
    retryDelay: 1000,
  });

  return {
    isConnected: data?.connected || false,
    isLoading,
    error: error as Error | null,
    refetch,
    connectionStatus: data?.connectionStatus || 'not_found',
  };
};

// Export function to invalidate Zoom connection queries
export const invalidateZoomConnection = (queryClient: any, userId?: string) => {
  console.log('Invalidating Zoom connection cache for user:', userId);
  if (userId) {
    queryClient.invalidateQueries({ queryKey: ['zoom-connection-status', userId] });
    // Also remove from cache to force fresh fetch
    queryClient.removeQueries({ queryKey: ['zoom-connection-status', userId] });
  } else {
    queryClient.invalidateQueries({ queryKey: ['zoom-connection-status'] });
    queryClient.removeQueries({ queryKey: ['zoom-connection-status'] });
  }
};
