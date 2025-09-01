import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { zapierService, type CRMFormattedAnalysis } from '@/services/zapierService'
import { toast } from '@/hooks/use-toast'

// Hook for managing Zapier API keys
export function useZapierApiKeys() {
  const queryClient = useQueryClient()

  const { data: apiKeys, isLoading, error } = useQuery({
    queryKey: ['zapier-api-keys'],
    queryFn: () => zapierService.listApiKeys()
  })

  const generateMutation = useMutation({
    mutationFn: ({ keyName, scopes }: { keyName: string; scopes?: string[] }) =>
      zapierService.generateApiKey(keyName, scopes),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['zapier-api-keys'] })
        toast({
          title: "API Key Generated",
          description: "Your new Zapier API key has been created successfully.",
          variant: "default"
        })
      } else {
        toast({
          title: "Generation Failed",
          description: result.error || "Failed to generate API key",
          variant: "destructive"
        })
      }
    },
    onError: (error) => {
      toast({
        title: "Generation Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      })
    }
  })

  const revokeMutation = useMutation({
    mutationFn: (keyId: string) => zapierService.revokeApiKey(keyId),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['zapier-api-keys'] })
        toast({
          title: "API Key Revoked",
          description: "The API key has been revoked successfully.",
          variant: "default"
        })
      } else {
        toast({
          title: "Revocation Failed",
          description: result.error || "Failed to revoke API key",
          variant: "destructive"
        })
      }
    }
  })

  return {
    apiKeys: apiKeys?.success ? apiKeys.data : [],
    isLoading,
    error,
    generateApiKey: generateMutation.mutate,
    revokeApiKey: revokeMutation.mutate,
    isGenerating: generateMutation.isPending,
    isRevoking: revokeMutation.isPending
  }
}

// Hook for managing Zapier webhooks
export function useZapierWebhooks() {
  const queryClient = useQueryClient()

  const { data: webhooks, isLoading, error } = useQuery({
    queryKey: ['zapier-webhooks'],
    queryFn: () => zapierService.listWebhooks()
  })

  const subscribeMutation = useMutation({
    mutationFn: (subscription: Parameters<typeof zapierService.subscribeWebhook>[0]) => {
      console.log('🚀 Mutation starting with subscription data:', subscription);
      return zapierService.subscribeWebhook(subscription);
    },
    onSuccess: (result) => {
      console.log('✅ Mutation success with result:', result);
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['zapier-webhooks'] })
        toast({
          title: "Webhook Subscribed",
          description: "Your webhook has been created successfully.",
          variant: "default"
        })
      } else {
        console.error('❌ Mutation success but result indicates failure:', result.error);
        const isAuthError = result.error?.includes('Authentication') || result.error?.includes('expired')
        toast({
          title: "Subscription Failed",
          description: result.error || "Failed to subscribe webhook",
          variant: "destructive"
        })
        if (isAuthError) {
          setTimeout(() => window.location.reload(), 2000)
        }
      }
    },
    onError: (error) => {
      console.error('❌ Mutation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
      const isAuthError = errorMessage.includes('Authentication') || errorMessage.includes('expired')
      toast({
        title: "Subscription Error", 
        description: errorMessage,
        variant: "destructive"
      })
      if (isAuthError) {
        setTimeout(() => window.location.reload(), 2000)
      }
    }
  })

  const unsubscribeMutation = useMutation({
    mutationFn: (webhookId: string) => zapierService.unsubscribeWebhook(webhookId),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['zapier-webhooks'] })
        toast({
          title: "Webhook Unsubscribed",
          description: "The webhook has been removed successfully.",
          variant: "default"
        })
      } else {
        toast({
          title: "Unsubscribe Failed",
          description: result.error || "Failed to unsubscribe webhook",
          variant: "destructive"
        })
      }
    }
  })

  const testMutation = useMutation({
    mutationFn: (webhookId: string) => zapierService.testWebhook(webhookId),
    onSuccess: (result) => {
      if (result.success) {
        toast({
          title: "Test Webhook Sent",
          description: "Test payload has been sent to your webhook URL.",
          variant: "default"
        })
      } else {
        toast({
          title: "Test Failed",
          description: result.error || "Failed to test webhook",
          variant: "destructive"
        })
      }
    }
  })

  return {
    webhooks: webhooks?.success ? webhooks.data : [],
    isLoading,
    error,
    subscribeWebhook: subscribeMutation.mutate,
    unsubscribeWebhook: unsubscribeMutation.mutate,
    testWebhook: testMutation.mutate,
    isSubscribing: subscribeMutation.isPending,
    isUnsubscribing: unsubscribeMutation.isPending,
    isTesting: testMutation.isPending
  }
}

// Hook for accessing Zapier data endpoints
export function useZapierData() {
  const [analysisCache, setAnalysisCache] = useState<Map<string, CRMFormattedAnalysis>>(new Map())

  const getAnalysisData = useCallback(async (analysisId: string) => {
    // Check cache first
    if (analysisCache.has(analysisId)) {
      return { success: true, data: analysisCache.get(analysisId)! }
    }

    const result = await zapierService.getAnalysisData(analysisId)
    if (result.success && result.data) {
      // Cache the result
      setAnalysisCache(prev => new Map(prev).set(analysisId, result.data!))
    }
    return result
  }, [analysisCache])

  const { data: recentAnalyses, isLoading: isLoadingRecent } = useQuery({
    queryKey: ['zapier-recent-analyses'],
    queryFn: () => zapierService.getRecentAnalyses(10),
    refetchInterval: 5 * 60 * 1000 // Refetch every 5 minutes
  })

  const submitContactMatchMutation = useMutation({
    mutationFn: ({ matchReviewId, confirmedContactId }: { 
      matchReviewId: string 
      confirmedContactId: string 
    }) => zapierService.submitContactMatchDecision(matchReviewId, confirmedContactId),
    onSuccess: (result) => {
      if (result.success) {
        toast({
          title: "Contact Match Confirmed",
          description: "The contact match has been saved successfully.",
          variant: "default"
        })
      } else {
        toast({
          title: "Match Failed",
          description: result.error || "Failed to confirm contact match",
          variant: "destructive"
        })
      }
    }
  })

  return {
    getAnalysisData,
    recentAnalyses: recentAnalyses?.success ? recentAnalyses.data : [],
    isLoadingRecent,
    submitContactMatch: submitContactMatchMutation.mutate,
    isSubmittingMatch: submitContactMatchMutation.isPending,
    clearCache: () => setAnalysisCache(new Map())
  }
}

// Hook for testing Zapier connectivity
export function useZapierConnection() {
  const [connectionStatus, setConnectionStatus] = useState<{
    status: 'idle' | 'testing' | 'connected' | 'error'
    lastTested?: Date
    error?: string
  }>({ status: 'idle' })

  const testConnection = useCallback(async () => {
    setConnectionStatus({ status: 'testing' })
    
    try {
      const result = await zapierService.testConnection()
      
      if (result.success) {
        setConnectionStatus({
          status: 'connected',
          lastTested: new Date()
        })
        toast({
          title: "Connection Successful",
          description: "Your Zapier integration is working correctly.",
          variant: "default"
        })
      } else {
        setConnectionStatus({
          status: 'error',
          error: result.error,
          lastTested: new Date()
        })
        toast({
          title: "Connection Failed",
          description: result.error || "Unable to connect to Zapier services",
          variant: "destructive"
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection test failed'
      setConnectionStatus({
        status: 'error',
        error: errorMessage,
        lastTested: new Date()
      })
      toast({
        title: "Connection Error",
        description: errorMessage,
        variant: "destructive"
      })
    }
  }, [])

  return {
    connectionStatus,
    testConnection,
    isConnected: connectionStatus.status === 'connected',
    isTesting: connectionStatus.status === 'testing'
  }
}

// Combined hook for complete Zapier integration
export function useZapierIntegration() {
  const apiKeys = useZapierApiKeys()
  const webhooks = useZapierWebhooks()
  const data = useZapierData()
  const connection = useZapierConnection()

  const isSetupComplete = useCallback(() => {
    return apiKeys.apiKeys.length > 0 && webhooks.webhooks.length > 0
  }, [apiKeys.apiKeys.length, webhooks.webhooks.length])

  const getSetupStatus = useCallback(() => {
    if (apiKeys.apiKeys.length === 0) {
      return { step: 'api-key', message: 'Generate your first API key to get started' }
    }
    if (webhooks.webhooks.length === 0) {
      return { step: 'webhook', message: 'Create a webhook to receive analysis data' }
    }
    return { step: 'complete', message: 'Zapier integration is ready to use' }
  }, [apiKeys.apiKeys.length, webhooks.webhooks.length])

  return {
    apiKeys,
    webhooks,
    data,
    connection,
    isSetupComplete: isSetupComplete(),
    setupStatus: getSetupStatus()
  }
}