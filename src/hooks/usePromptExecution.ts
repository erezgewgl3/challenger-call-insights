
import { useMutation } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface ExecutePromptRequest {
  promptId: string
  testData?: {
    conversation?: string
    account_context?: string
    user_context?: string
  }
}

interface ExecutePromptResponse {
  success: boolean
  response: any
  processing_time_ms: number
  ai_provider: 'openai' | 'claude'
  prompt_version: number
  error?: string
}

export function useExecutePrompt() {
  return useMutation({
    mutationFn: async (data: ExecutePromptRequest): Promise<ExecutePromptResponse> => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('Not authenticated')
      }

      const response = await supabase.functions.invoke('execute-ai-prompt', {
        body: data,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      if (response.error) {
        throw new Error(response.error.message || 'Failed to execute prompt')
      }

      return response.data
    },
    onError: (error) => {
      console.error('Failed to execute prompt:', error)
      toast.error('Failed to execute prompt: ' + (error as Error).message)
    }
  })
}
