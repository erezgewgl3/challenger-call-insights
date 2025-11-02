import React, { createContext, useContext, useCallback, ReactNode } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface ZapierStatus {
  status: 'setup' | 'connected' | 'error';
  color: string;
  text: string;
  successRate: number;
  activeWebhooks: number;
  activeApiKeys: number;
  isSetupComplete: boolean;
  lastVerifiedAt: string | null;
}

interface ZapierStatusContextType {
  status: ZapierStatus | null;
  isLoading: boolean;
  error: string | null;
  refreshStatus: () => void;
  verifyConnection: (apiKeyId: string) => Promise<{ success: boolean; error?: string }>;
  markVerificationComplete: (when?: string) => void;
}

const ZapierStatusContext = createContext<ZapierStatusContextType | undefined>(undefined);

export function useZapierStatusContext() {
  const context = useContext(ZapierStatusContext);
  if (context === undefined) {
    throw new Error('useZapierStatusContext must be used within a ZapierStatusProvider');
  }
  return context;
}

interface ZapierStatusProviderProps {
  children: ReactNode;
}

export function ZapierStatusProvider({ children }: ZapierStatusProviderProps) {
  const queryClient = useQueryClient();
  const { user, isAuthReady } = useAuth();

  // Query for fetching status from server - only when authenticated
  const {
    data: status,
    isLoading,
    error: queryError,
    refetch
  } = useQuery({
    queryKey: ['zapier-status'],
    queryFn: async () => {
      console.log('Fetching Zapier status from server...');
      
      const { data, error } = await supabase.functions.invoke('zapier-connection-status', {
        method: 'GET'
      });

      if (error) {
        console.error('Error fetching Zapier status:', error);
        throw new Error(error.message || 'Failed to fetch Zapier status');
      }

      console.log('Server status response:', data);
      return data as ZapierStatus;
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
    retryDelay: 500,
    enabled: !!user && isAuthReady
  });

  // Mutation for verifying connection
  const verifyConnectionMutation = useMutation({
    mutationFn: async ({ apiKeyId }: { apiKeyId: string }) => {
      console.log('Verifying connection for API key:', apiKeyId);
      
      const { data, error } = await supabase.functions.invoke('zapier-connection-status', {
        method: 'POST',
        body: { apiKeyId, testType: 'manual_test' }
      });

      if (error) {
        console.error('Connection verification error:', error);
        throw new Error(error.message || 'Connection verification failed');
      }

      return data;
    },
    onSuccess: (data) => {
      console.log('Connection verification successful:', data);
      
      // Invalidate and refetch status to get updated data
      queryClient.invalidateQueries({ queryKey: ['zapier-status'] });
      
      // Only show toast for MANUAL verification (not background tests)
      // Background tests are silent to avoid spamming the user
      if (user && !backgroundTestInProgress.current) {
        if (data.success) {
          toast({
            title: "Connection Verified",
            description: "Your Zapier integration is working correctly.",
          });
        } else {
          toast({
            title: "Connection Issues",
            description: data.error || "Connection test failed",
            variant: "destructive"
          });
        }
      }
    },
    onError: (error: Error) => {
      console.error('Connection verification failed:', error);
      
      // Only show toast for MANUAL tests (not background tests)
      if (user && !backgroundTestInProgress.current) {
        toast({
          title: "Verification Failed",
          description: error.message,
          variant: "destructive"
        });
      }
    }
  });

  const refreshStatus = useCallback(() => {
    console.log('Manually refreshing Zapier status...');
    refetch();
  }, [refetch]);

  const verifyConnection = useCallback(async (apiKeyId: string) => {
    try {
      const result = await verifyConnectionMutation.mutateAsync({ apiKeyId });
      return {
        success: result.success,
        error: result.error
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }, [verifyConnectionMutation]);

  const markVerificationComplete = useCallback((when?: string) => {
    console.log('Marking verification complete at:', when || 'now');
    
    // Invalidate the status query to trigger a refresh
    queryClient.invalidateQueries({ queryKey: ['zapier-status'] });
    
    // Also trigger a manual refresh
    refetch();
  }, [queryClient, refetch]);

  // Run background test on mount if verification needed - only when authenticated
  const backgroundTestInProgress = React.useRef(false);
  
  React.useEffect(() => {
    // Don't run if test already in progress
    if (backgroundTestInProgress.current) {
      console.log('Background test already in progress, skipping...');
      return;
    }

    // Only run for 'error' status with "Verification Needed" text
    // Don't run for "Delivery Issues" (that's not a connection problem)
    if (user && status && 
        status.isSetupComplete && 
        status.status === 'error' && 
        status.text === 'Verification Needed' &&
        status.activeApiKeys > 0) {
      
      console.log('Running one-time background connection test...');
      backgroundTestInProgress.current = true;
      
      const backgroundTest = async () => {
        try {
          const { data: apiKeys } = await supabase
            .from('zapier_api_keys')
            .select('id')
            .eq('is_active', true)
            .limit(1);
          
          if (apiKeys && apiKeys.length > 0) {
            await verifyConnectionMutation.mutateAsync({ 
              apiKeyId: apiKeys[0].id 
            });
          }
        } catch (error) {
          console.log('Background test failed:', error);
        } finally {
          // Reset flag after test completes
          backgroundTestInProgress.current = false;
        }
      };
      
      const timeoutId = setTimeout(backgroundTest, 1000);
      return () => {
        clearTimeout(timeoutId);
        backgroundTestInProgress.current = false;
      };
    }
  }, [user, status?.status, status?.text, status?.isSetupComplete, status?.activeApiKeys, verifyConnectionMutation]);

  const contextValue: ZapierStatusContextType = {
    status: status || null,
    isLoading: isLoading || verifyConnectionMutation.isPending,
    error: queryError?.message || null,
    refreshStatus,
    verifyConnection,
    markVerificationComplete
  };

  return (
    <ZapierStatusContext.Provider value={contextValue}>
      {children}
    </ZapierStatusContext.Provider>
  );
}