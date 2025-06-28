
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

// Get all system settings
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

// Get a specific system setting
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

// Get the default AI provider
export function useDefaultAiProvider() {
  return useQuery({
    queryKey: ['system-setting', 'default_ai_provider'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'default_ai_provider')
        .single()

      if (error) throw error
      return data.setting_value as 'openai' | 'claude'
    }
  })
}

// Get the default prompt ID
export function useDefaultPromptId() {
  return useQuery({
    queryKey: ['system-setting', 'default_prompt_id'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'default_prompt_id')
        .single()

      if (error) throw error
      return data.setting_value === 'none' ? null : data.setting_value
    }
  })
}

// Update system setting
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

// Set default AI provider
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

// Set default prompt
export function useSetDefaultPrompt() {
  const updateSetting = useUpdateSystemSetting()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (promptId: string | null) => {
      // First, remove default flag from all prompts
      await supabase
        .from('prompts')
        .update({ is_default: false })
        .eq('is_default', true)

      // Set the new default prompt if provided
      if (promptId) {
        await supabase
          .from('prompts')
          .update({ is_default: true })
          .eq('id', promptId)
      }

      // Update system setting
      return updateSetting.mutateAsync({
        settingKey: 'default_prompt_id',
        settingValue: promptId || 'none'
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompts'] })
      toast.success('Default prompt updated')
    },
    onError: (error) => {
      console.error('Failed to set default prompt:', error)
      toast.error('Failed to set default prompt')
    }
  })
}
