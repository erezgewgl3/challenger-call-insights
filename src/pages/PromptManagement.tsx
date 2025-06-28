
import React, { useState } from 'react'
import { useActivePrompt } from '@/hooks/usePrompts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, MessageSquare, History, Settings, Zap } from 'lucide-react'
import { EnhancedPromptEditor } from '@/components/prompts/EnhancedPromptEditor'
import { PromptCard } from '@/components/prompts/PromptCard'
import { AiProviderSelector } from '@/components/prompts/AiProviderSelector'
import { useDefaultAiProvider } from '@/hooks/useSystemSettings'

interface ApiKeyStatus {
  openai: boolean
  claude: boolean
}

export default function PromptManagement() {
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [apiKeyStatus, setApiKeyStatus] = useState<ApiKeyStatus>({ openai: false, claude: false })
  const [isValidatingKeys, setIsValidatingKeys] = useState(false)

  const { data: activePrompt, isLoading } = useActivePrompt()
  const { data: defaultAiProvider } = useDefaultAiProvider()

  React.useEffect(() => {
    validateApiKeys()
  }, [])

  const validateApiKeys = async () => {
    setIsValidatingKeys(true)
    try {
      const response = await fetch('/api/validate-api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (response.ok) {
        const data = await response.json()
        setApiKeyStatus(data)
      } else {
        setApiKeyStatus({ openai: true, claude: true })
      }
    } catch (error) {
      console.warn('Could not validate API keys:', error)
      setApiKeyStatus({ openai: true, claude: true })
    } finally {
      setIsValidatingKeys(false)
    }
  }

  const handleEditPrompt = (promptId: string) => {
    setSelectedPrompt(promptId)
  }

  const handleViewHistory = (promptId: string) => {
    setSelectedPrompt(promptId)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">AI Prompt Management</h1>
          <p className="text-slate-600 mt-1">
            Manage your AI coaching prompts and system configuration
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <AiProviderSelector 
            apiKeyStatus={apiKeyStatus}
            isValidating={isValidatingKeys}
          />
          <Button 
            onClick={() => setIsCreating(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Prompt
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Prompt</CardTitle>
            <MessageSquare className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {activePrompt ? (
                <>
                  <div className="text-sm font-medium truncate">
                    {activePrompt.is_default ? 'Default System Prompt' : 'Custom Prompt'}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="default" className="text-xs">v{activePrompt.version_number}</Badge>
                    <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                      System-Wide
                    </Badge>
                  </div>
                </>
              ) : (
                <div className="text-sm text-muted-foreground">No active prompt</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Management</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Integrated</div>
            <p className="text-xs text-muted-foreground">
              Version history within editor
            </p>
          </CardContent>
        </Card>

        <Card className="border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Provider</CardTitle>
            <Zap className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className="text-2xl font-bold">
                {defaultAiProvider?.toUpperCase() || 'Loading...'}
              </div>
              <Badge variant="outline" className="text-xs">Active</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Global default</p>
          </CardContent>
        </Card>
      </div>

      {activePrompt ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-semibold text-slate-900">Current Active Prompt</h2>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Powering All AI Analysis
              </Badge>
            </div>
          </div>
          <PromptCard 
            prompt={activePrompt}
            onEdit={handleEditPrompt}
            onViewHistory={handleViewHistory}
          />
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <MessageSquare className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No active prompt</h3>
            <p className="text-slate-600 mb-4">Create your first AI coaching prompt to get started.</p>
            <Button onClick={() => setIsCreating(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Prompt
            </Button>
          </CardContent>
        </Card>
      )}

      {(isCreating || selectedPrompt) && (
        <EnhancedPromptEditor 
          promptId={selectedPrompt}
          isOpen={isCreating || !!selectedPrompt}
          onClose={() => {
            setIsCreating(false)
            setSelectedPrompt(null)
          }}
        />
      )}
    </div>
  )
}
