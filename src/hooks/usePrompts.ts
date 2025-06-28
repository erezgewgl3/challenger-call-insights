
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

// Get active prompts only
export function useActivePrompts() {
  return useQuery({
    queryKey: ['prompts', 'active'],
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

// Create new prompt
export function useCreatePrompt() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreatePromptData) => {
      const { data: result, error } = await supabase
        .from('prompts')
        .insert([{
          prompt_text: data.prompt_text,
          is_default: false,
          is_active: true,
          version_number: 1,
          change_description: data.change_description || 'Initial version'
        }])
        .select()
        .single()

      if (error) throw error
      return result as Prompt
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompts'] })
      toast.success('Prompt created successfully')
    },
    onError: (error) => {
      console.error('Failed to create prompt:', error)
      toast.error('Failed to create prompt')
    }
  })
}

// Update prompt (creates new version)
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

      // Deactivate current active version
      await supabase
        .from('prompts')
        .update({ is_active: false })
        .or(`id.eq.${data.parent_prompt_id},parent_prompt_id.eq.${data.parent_prompt_id}`)

      // Create new version
      const { data: result, error } = await supabase
        .from('prompts')
        .insert([{
          parent_prompt_id: data.parent_prompt_id,
          prompt_text: data.prompt_text,
          is_default: parent?.is_default || false,
          is_active: true,
          version_number: (parent?.version_number || 0) + 1,
          change_description: data.change_description || 'Updated prompt',
          activated_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) throw error
      return result as Prompt
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompts'] })
      toast.success('Prompt updated successfully')
    },
    onError: (error) => {
      console.error('Failed to update prompt:', error)
      toast.error('Failed to update prompt')
    }
  })
}

// Activate specific prompt version
export function useActivatePromptVersion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ promptId, parentPromptId }: { promptId: string, parentPromptId?: string }) => {
      const targetId = parentPromptId || promptId

      // Deactivate all versions of this prompt family
      await supabase
        .from('prompts')
        .update({ is_active: false })
        .or(`id.eq.${targetId},parent_prompt_id.eq.${targetId}`)

      // Activate the selected version
      const { data, error } = await supabase
        .from('prompts')
        .update({ 
          is_active: true,
          activated_at: new Date().toISOString()
        })
        .eq('id', promptId)
        .select()
        .single()

      if (error) throw error
      return data as Prompt
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompts'] })
      toast.success('Prompt version activated')
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
