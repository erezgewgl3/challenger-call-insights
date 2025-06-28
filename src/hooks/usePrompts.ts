import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface Prompt {
  id: string
  parent_prompt_id?: string
  version_number: number
  user_id?: string
  prompt_text: string
  is_default: boolean
  is_active: boolean
  change_description?: string
  activated_at?: string
  created_at: string
  updated_at: string
}

interface CreatePromptData {
  prompt_text: string
  change_description?: string
}

interface UpdatePromptData extends CreatePromptData {
  parent_prompt_id: string
}

// Get all prompts with version info
export function usePrompts() {
  return useQuery({
    queryKey: ['prompts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prompts')
        .select('*')
        .order('created_at', { ascending: false })

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

// Keep this for backward compatibility but mark as deprecated
export function useActivePrompts() {
  return useQuery({
    queryKey: ['prompts', 'active-legacy'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prompts')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as Prompt[]
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

// Get prompt version history
export function usePromptVersions(parentPromptId: string) {
  return useQuery({
    queryKey: ['prompt-versions', parentPromptId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prompts')
        .select('*')
        .or(`id.eq.${parentPromptId},parent_prompt_id.eq.${parentPromptId}`)
        .order('version_number', { ascending: false })

      if (error) throw error
      return data as Prompt[]
    },
    enabled: !!parentPromptId
  })
}

// Create new prompt and make it active
export function useCreatePrompt() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreatePromptData) => {
      // Use the database function to ensure only one prompt is active
      const { data: result, error: insertError } = await supabase
        .from('prompts')
        .insert([{
          prompt_text: data.prompt_text,
          is_default: false,
          is_active: false, // Will be activated by the function
          version_number: 1,
          change_description: data.change_description || 'Initial version'
        }])
        .select()
        .single()

      if (insertError) throw insertError

      // Activate the new prompt using the database function
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
      // First, get current version number
      const { data: parent, error: parentError } = await supabase
        .from('prompts')
        .select('version_number, is_default')
        .eq('id', data.parent_prompt_id)
        .single()

      if (parentError) throw parentError

      // Create new version (inactive initially)
      const { data: result, error } = await supabase
        .from('prompts')
        .insert([{
          parent_prompt_id: data.parent_prompt_id,
          prompt_text: data.prompt_text,
          is_default: parent?.is_default || false,
          is_active: false, // Will be activated by the function
          version_number: (parent?.version_number || 0) + 1,
          change_description: data.change_description || 'Updated prompt'
        }])
        .select()
        .single()

      if (error) throw error

      // Activate the new version using the database function
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
      // Use the database function to ensure only one prompt is active
      const { error } = await supabase
        .rpc('activate_single_prompt', { prompt_id_param: promptId })

      if (error) throw error

      // Get the activated prompt to return
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

// Delete prompt (and all versions if parent)
export function useDeletePrompt() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (promptId: string) => {
      // Delete all related versions and the prompt itself
      const { error } = await supabase
        .from('prompts')
        .delete()
        .or(`id.eq.${promptId},parent_prompt_id.eq.${promptId}`)

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
