
import React, { useState } from 'react'
import { usePrompts, useActivePrompts } from '@/hooks/usePrompts'
import { useDefaultAiProvider, useSetDefaultAiProvider } from '@/hooks/useSystemSettings'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, MessageSquare, History, Settings, Zap, AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import { EnhancedPromptEditor } from '@/components/prompts/EnhancedPromptEditor'
import { PromptCard } from '@/components/prompts/PromptCard'
import { AiProviderSelector } from '@/components/prompts/AiProviderSelector'
import { toast } from 'sonner'

interface ApiKeyStatus {
  openai: boolean
  claude: boolean
}

export default function PromptManagement() {
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [apiKeyStatus, setApiKeyStatus] = useState<ApiKeyStatus>({ openai: false, claude: false })
  const [isValidatingKeys, setIsValidatingKeys] = useState(false)

  const { data: allPrompts, isLoading } = usePrompts()
  const { data: activePrompts } = useActivePrompts()
  const { data: defaultAiProvider } = useDefaultAiProvider()

  // Validate API keys on component mount
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

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Prompts</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activePrompts?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Versions</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allPrompts?.length || 0}</div>
            <p className="text-xs text-muted-foreground">All versions</p>
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

      {/* Prompt List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-900">Your Prompts</h2>
        
        <div className="grid gap-4">
          {activePrompts?.map((prompt) => (
            <PromptCard 
              key={prompt.id}
              prompt={prompt}
              onEdit={setSelectedPrompt}
            />
          ))}
          
          {activePrompts?.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <MessageSquare className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">No prompts yet</h3>
                <p className="text-slate-600 mb-4">Create your first AI coaching prompt to get started.</p>
                <Button onClick={() => setIsCreating(true)} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Prompt
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Enhanced Prompt Editor */}
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
