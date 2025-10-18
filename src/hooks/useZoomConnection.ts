
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ZoomConnection {
  id: string;
  connection_name: string;
  connection_status: 'active' | 'inactive' | 'error';
  credentials: any;
  configuration?: {
    auto_process?: boolean;
    notifications?: boolean;
    meeting_types?: string[];
    user_info?: any;
  };
  last_sync_at?: string;
  created_at: string;
}

interface ZoomConnectionStatus {
  isConnected: boolean;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  connectionStatus: 'active' | 'error' | 'inactive' | 'not_found';
  connection: ZoomConnection | null;
}

export const useZoomConnection = (): ZoomConnectionStatus => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['zoom-connection-status', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        console.warn('useZoomConnection: User not authenticated');
        return { connected: false, connectionStatus: 'not_found' as const };
      }

      console.log('Fetching Zoom connection status for user:', user.id);

      try {
        const { data, error } = await supabase.rpc('integration_framework_get_connection', {
          user_uuid: user.id,
          integration_type_param: 'zoom'
        });

        if (error) {
          console.error('Error fetching Zoom connection (graceful):', error);
          return { connected: false, connectionStatus: 'not_found' as const };
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
          connectionStatus: connectionStatus as 'active' | 'error' | 'inactive' | 'not_found',
          connection: hasConnection && connectionRecord ? connectionRecord as ZoomConnection : null
        };
      } catch (err) {
        console.error('Unexpected error in useZoomConnection (caught):', err);
        return { connected: false, connectionStatus: 'not_found' as const };
      }
    },
    enabled: !!user?.id,
    staleTime: 0, // No staleness - always fetch fresh data
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchInterval: (query) => {
      // Poll every 3 seconds when not connected to quickly detect new connections
      const status = query.state.data?.connectionStatus;
      return (status === 'not_found' || status === 'inactive') ? 3000 : false;
    },
    retry: 1,
    retryDelay: 1000,
  });

  return {
    isConnected: data?.connected || false,
    isLoading,
    error: error as Error | null,
    refetch,
    connectionStatus: data?.connectionStatus || 'not_found',
    connection: data?.connection || null,
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
