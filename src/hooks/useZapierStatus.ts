import { useZapierStatusContext } from '@/contexts/ZapierStatusContext';

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

const DEFAULT_STATUS: ZapierStatus = {
  status: 'setup' as const,
  color: 'bg-yellow-500',
  text: 'Setup Required',
  successRate: 0,
  activeWebhooks: 0,
  activeApiKeys: 0,
  isSetupComplete: false,
  lastVerifiedAt: null
};

export function useZapierStatus() {
  try {
    const { status, isLoading, error, refreshStatus, verifyConnection, markVerificationComplete } = useZapierStatusContext();

    return {
      status: status || DEFAULT_STATUS,
      isLoading,
      error,
      refreshStatus,
      verifyConnection,
      markVerificationComplete
    };
  } catch (error) {
    console.error('ZapierStatusContext not available:', error);
    // Return safe defaults if context is not available
    return {
      status: DEFAULT_STATUS,
      isLoading: false,
      error: null,
      refreshStatus: async () => {},
      verifyConnection: async () => ({ success: false, error: 'Context not available' }),
      markVerificationComplete: () => {}
    };
  }
}