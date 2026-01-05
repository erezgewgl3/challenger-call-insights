import React from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { AiProviderSelector } from '@/components/prompts/AiProviderSelector'
import { AiDiagnosticsPanel } from '@/components/prompts/AiDiagnosticsPanel'

interface ApiKeyStatus {
  openai: boolean
  claude: boolean
}

interface PromptControlsSectionProps {
  apiKeyStatus: ApiKeyStatus
  isValidatingKeys: boolean
  onCreatePrompt: () => void
}

export function PromptControlsSection({ 
  apiKeyStatus, 
  isValidatingKeys, 
  onCreatePrompt 
}: PromptControlsSectionProps) {
  return (
    <div className="space-y-4">
      <AiDiagnosticsPanel />
      
      <div className="flex items-center justify-end space-x-3">
        <AiProviderSelector 
          apiKeyStatus={apiKeyStatus}
          isValidating={isValidatingKeys}
        />
        <Button 
          onClick={onCreatePrompt}
          className="bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg transition-all duration-200"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Prompt
        </Button>
      </div>
    </div>
  )
}
