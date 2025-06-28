
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface Prompt {
  id: string
  version_number: number
  user_id?: string
  prompt_text: string
  prompt_name?: string | null
  is_default: boolean
  is_active: boolean
  change_description?: string
  activated_at?: string
  created_at: string
  updated_at: string
  created_by?: string
}

interface CreatePromptData {
  prompt_text: string
  prompt_name: string
  change_description?: string
}

interface UpdatePromptData {
  prompt_text: string
  prompt_name: string
  change_description?: string
}

// Get all prompts in chronological order
export function usePrompts() {
  return useQuery({
    queryKey: ['prompts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prompts')
        .select('*')
        .order('version_number', { ascending: false })

      if (error) throw error
      return data as Prompt[]
    }
  })
}

// Get the single active prompt (system-wide)
export function useActivePrompt() {
  return useQuery({
    queryKey: ['prompts', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_active_prompt')

      if (error) throw error
      return data?.[0] as Prompt | null
    }
  })
}

// Get the single global default prompt
export function useDefaultPrompt() {
  return useQuery({
    queryKey: ['prompts', 'default'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prompts')
        .select('*')
        .eq('is_default', true)
        .maybeSingle()

      if (error) throw error
      return data as Prompt | null
    }
  })
}

// Get all prompts for history view (simplified - just returns all prompts)
export function usePromptVersions() {
  return useQuery({
    queryKey: ['prompts', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prompts')
        .select('*')
        .order('version_number', { ascending: false })

      if (error) throw error
      return data as Prompt[]
    }
  })
}

// Create new prompt and make it active
export function useCreatePrompt() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreatePromptData) => {
      const { data: result, error: insertError } = await supabase
        .from('prompts')
        .insert([{
          prompt_text: data.prompt_text,
          prompt_name: data.prompt_name,
          is_default: false,
          is_active: false,
          change_description: data.change_description || 'New prompt created'
        }])
        .select()
        .single()

      if (insertError) throw insertError

      const { error: activateError } = await supabase
        .rpc('activate_single_prompt', { prompt_id_param: result.id })

      if (activateError) throw activateError

      return result as Prompt
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompts'] })
      toast.success('Prompt created and activated successfully')
    },
    onError: (error) => {
      console.error('Failed to create prompt:', error)
      toast.error('Failed to create prompt')
    }
  })
}

// Update prompt (creates new version) and make it active
export function useUpdatePrompt() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: UpdatePromptData) => {
      const { data: result, error } = await supabase
        .from('prompts')
        .insert([{
          prompt_text: data.prompt_text,
          prompt_name: data.prompt_name,
          is_default: false,
          is_active: false,
          change_description: data.change_description || 'Updated prompt'
        }])
        .select()
        .single()

      if (error) throw error

      const { error: activateError } = await supabase
        .rpc('activate_single_prompt', { prompt_id_param: result.id })

      if (activateError) throw activateError

      return result as Prompt
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompts'] })
      toast.success('Prompt updated and activated successfully')
    },
    onError: (error) => {
      console.error('Failed to update prompt:', error)
      toast.error('Failed to update prompt')
    }
  })
}

// Activate specific prompt version (system-wide)
export function useActivatePromptVersion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ promptId }: { promptId: string }) => {
      const { error } = await supabase
        .rpc('activate_single_prompt', { prompt_id_param: promptId })

      if (error) throw error

      const { data, error: selectError } = await supabase
        .from('prompts')
        .select('*')
        .eq('id', promptId)
        .single()

      if (selectError) throw selectError
      return data as Prompt
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompts'] })
      toast.success('Prompt activated successfully')
    },
    onError: (error) => {
      console.error('Failed to activate prompt version:', error)
      toast.error('Failed to activate prompt version')
    }
  })
}

// Delete prompt (simplified - just delete the specific prompt)
export function useDeletePrompt() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (promptId: string) => {
      const { error } = await supabase
        .from('prompts')
        .delete()
        .eq('id', promptId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompts'] })
      toast.success('Prompt deleted successfully')
    },
    onError: (error) => {
      console.error('Failed to delete prompt:', error)
      toast.error('Failed to delete prompt')
    }
  })
}
