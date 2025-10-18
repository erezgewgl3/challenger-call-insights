import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface SystemHealthStatus {
  services: {
    name: string
    status: 'connected' | 'active' | 'ready' | 'error'
    statusText: string
    icon: string
    colorClass: string
    details?: string
  }[]
  overall: 'healthy' | 'degraded' | 'unhealthy'
}

export function useSystemHealth() {
  return useQuery({
    queryKey: ['system-health'],
    queryFn: async () => {
      const healthStatus: SystemHealthStatus = {
        services: [],
        overall: 'healthy'
      }

      // Check Database
      try {
        const { error } = await supabase.from('users').select('count').limit(1)
        healthStatus.services.push({
          name: 'Database',
          status: error ? 'error' : 'connected',
          statusText: error ? 'Error' : 'Connected',
          icon: error ? '✗' : '✓',
          colorClass: error 
            ? 'bg-gradient-to-br from-red-50 to-rose-50 border border-red-100 text-red-600'
            : 'bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 text-green-600',
          details: error?.message
        })
        if (error) healthStatus.overall = 'degraded'
      } catch (err) {
        healthStatus.services.push({
          name: 'Database',
          status: 'error',
          statusText: 'Disconnected',
          icon: '✗',
          colorClass: 'bg-gradient-to-br from-red-50 to-rose-50 border border-red-100 text-red-600',
          details: err instanceof Error ? err.message : 'Unknown error'
        })
        healthStatus.overall = 'unhealthy'
      }

      // Check Authentication
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        healthStatus.services.push({
          name: 'Authentication',
          status: error ? 'error' : 'active',
          statusText: error ? 'Error' : 'Active',
          icon: error ? '✗' : '✓',
          colorClass: error 
            ? 'bg-gradient-to-br from-red-50 to-rose-50 border border-red-100 text-red-600'
            : 'bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 text-green-600',
          details: error?.message
        })
        if (error) healthStatus.overall = 'degraded'
      } catch (err) {
        healthStatus.services.push({
          name: 'Authentication',
          status: 'error',
          statusText: 'Error',
          icon: '✗',
          colorClass: 'bg-gradient-to-br from-red-50 to-rose-50 border border-red-100 text-red-600',
          details: err instanceof Error ? err.message : 'Unknown error'
        })
        healthStatus.overall = 'unhealthy'
      }

      // Check Prompt System
      try {
        const { data: promptSettings, error: promptError } = await supabase
          .from('system_settings')
          .select('setting_key, setting_value')
          .in('setting_key', ['default_ai_provider', 'default_prompt_id'])
        
        const hasProvider = promptSettings?.some(s => s.setting_key === 'default_ai_provider')
        const hasPrompt = promptSettings?.some(s => s.setting_key === 'default_prompt_id')
        
        healthStatus.services.push({
          name: 'Prompt System',
          status: promptError ? 'error' : (hasProvider && hasPrompt ? 'active' : 'ready'),
          statusText: promptError ? 'Error' : (hasProvider && hasPrompt ? 'Active' : 'Ready'),
          icon: promptError ? '✗' : '✓',
          colorClass: promptError 
            ? 'bg-gradient-to-br from-red-50 to-rose-50 border border-red-100 text-red-600'
            : 'bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 text-green-600',
          details: promptError?.message
        })
        if (promptError) healthStatus.overall = 'degraded'
      } catch (err) {
        healthStatus.services.push({
          name: 'Prompt System',
          status: 'error',
          statusText: 'Error',
          icon: '✗',
          colorClass: 'bg-gradient-to-br from-red-50 to-rose-50 border border-red-100 text-red-600',
          details: err instanceof Error ? err.message : 'Unknown error'
        })
        healthStatus.overall = 'unhealthy'
      }

      // Check AI Services Configuration
      try {
        const { data: aiSettings, error: aiError } = await supabase
          .from('system_settings')
          .select('setting_value')
          .eq('setting_key', 'default_ai_provider')
          .maybeSingle()

        const isConfigured = aiSettings?.setting_value && 
          (aiSettings.setting_value === 'openai' || aiSettings.setting_value === 'claude')

        healthStatus.services.push({
          name: 'AI Services',
          status: aiError ? 'error' : (isConfigured ? 'active' : 'ready'),
          statusText: aiError ? 'Error' : (isConfigured ? 'Active' : 'Ready for setup'),
          icon: aiError ? '✗' : (isConfigured ? '✓' : 'i'),
          colorClass: aiError 
            ? 'bg-gradient-to-br from-red-50 to-rose-50 border border-red-100 text-red-600'
            : isConfigured
              ? 'bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 text-green-600'
              : 'bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 text-indigo-600',
          details: aiError?.message || (isConfigured ? `Provider: ${aiSettings.setting_value}` : 'Configure AI provider in settings')
        })
        if (aiError) healthStatus.overall = 'degraded'
      } catch (err) {
        healthStatus.services.push({
          name: 'AI Services',
          status: 'error',
          statusText: 'Error',
          icon: '✗',
          colorClass: 'bg-gradient-to-br from-red-50 to-rose-50 border border-red-100 text-red-600',
          details: err instanceof Error ? err.message : 'Unknown error'
        })
        healthStatus.overall = 'unhealthy'
      }

      return healthStatus
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 15000 // Consider data stale after 15 seconds
  })
}
