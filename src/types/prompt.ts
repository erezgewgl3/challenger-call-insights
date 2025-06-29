
export interface Prompt {
  id: string
  version_number: number
  user_id: string | null
  prompt_text: string
  prompt_name: string | null
  is_default: boolean
  is_active: boolean
  change_description: string | null
  activated_at: string | null
  created_at: string | null
  updated_at: string | null
  created_by: string | null
}

export interface PromptTestingData {
  id: string
  prompt_text: string
  prompt_name: string | null
  version_number: number
}

export interface PromptFormData {
  prompt_text: string
  prompt_name?: string
  change_description?: string
}
