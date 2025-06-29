
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface SystemSetting {
  id: string
  setting_key: string
  setting_value: string
  updated_at: string
  updated_by?: string
  created_at: string
}

export function useSystemSettings() {
  return useQuery({
    queryKey: ['system-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .order('setting_key')

      if (error) throw error
      return data as SystemSetting[]
    }
  })
}

export function useSystemSetting(settingKey: string) {
  return useQuery({
    queryKey: ['system-setting', settingKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('setting_key', settingKey)
        .maybeSingle()

      if (error) throw error
      return data as SystemSetting | null
    }
  })
}

export function useDefaultAiProvider() {
  return useQuery({
    queryKey: ['system-setting', 'default_ai_provider'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'default_ai_provider')
        .maybeSingle()

      if (error) throw error
      return data?.setting_value as 'openai' | 'claude' | null
    }
  })
}

export function useUpdateSystemSetting() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ settingKey, settingValue }: { settingKey: string, settingValue: string }) => {
      const { data, error } = await supabase
        .from('system_settings')
        .update({ 
          setting_value: settingValue,
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', settingKey)
        .select()
        .single()

      if (error) throw error
      return data as SystemSetting
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] })
      queryClient.invalidateQueries({ queryKey: ['system-setting'] })
      toast.success('Setting updated successfully')
    },
    onError: (error) => {
      console.error('Failed to update setting:', error)
      toast.error('Failed to update setting')
    }
  })
}

export function useSetDefaultAiProvider() {
  const updateSetting = useUpdateSystemSetting()

  return useMutation({
    mutationFn: async (provider: 'openai' | 'claude') => {
      return updateSetting.mutateAsync({
        settingKey: 'default_ai_provider',
        settingValue: provider
      })
    },
    onSuccess: () => {
      toast.success('Default AI provider updated')
    }
  })
}
