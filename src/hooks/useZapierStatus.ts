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

export function useZapierStatus() {
  const { status, isLoading, error, refreshStatus, verifyConnection, markVerificationComplete } = useZapierStatusContext();

  return {
    status: status || {
      status: 'setup' as const,
      color: 'bg-yellow-500',
      text: 'Setup Required',
      successRate: 0,
      activeWebhooks: 0,
      activeApiKeys: 0,
      isSetupComplete: false,
      lastVerifiedAt: null
    },
    isLoading,
    error,
    refreshStatus,
    verifyConnection,
    markVerificationComplete
  };
}