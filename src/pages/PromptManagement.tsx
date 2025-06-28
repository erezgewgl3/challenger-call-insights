
import React, { useState } from 'react'
import { useActivePrompt, usePrompts, useActivatePromptVersion, useDeletePrompt } from '@/hooks/usePrompts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, MessageSquare, History, Settings, Zap, Play } from 'lucide-react'
import { SimplePromptEditor } from '@/components/prompts/SimplePromptEditor'
import { PromptCard } from '@/components/prompts/PromptCard'
import { AiProviderSelector } from '@/components/prompts/AiProviderSelector'
import { useDefaultAiProvider } from '@/hooks/useSystemSettings'
import { AdminLayout } from '@/components/layout/AdminLayout'

interface ApiKeyStatus {
  openai: boolean
  claude: boolean
}

export default function PromptManagement() {
  const [selectedPrompt, setSelectedPrompt] = useState<any>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [apiKeyStatus, setApiKeyStatus] = useState<ApiKeyStatus>({ openai: false, claude: false })
  const [isValidatingKeys, setIsValidatingKeys] = useState(false)

  const { data: activePrompt, isLoading } = useActivePrompt()
  const { data: allPrompts } = usePrompts()
  const { data: defaultAiProvider } = useDefaultAiProvider()
  const activateVersion = useActivatePromptVersion()
  const deletePrompt = useDeletePrompt()

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

  const handleEditPrompt = (prompt: any) => {
    setSelectedPrompt(prompt)
  }

  const handleDeletePrompt = async (promptId: string) => {
    if (window.confirm('Are you sure you want to delete this prompt? This action cannot be undone.')) {
      try {
        await deletePrompt.mutateAsync(promptId)
      } catch (error) {
        console.error('Failed to delete prompt:', error)
      }
    }
  }

  const handleActivatePrompt = async (promptId: string) => {
    try {
      await activateVersion.mutateAsync({ promptId })
    } catch (error) {
      console.error('Failed to activate prompt:', error)
    }
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    )
  }

  const inactivePrompts = allPrompts?.filter(p => !p.is_active) || []

  return (
    <AdminLayout>
      <div className="p-8 bg-gradient-to-br from-slate-50 to-gray-100 min-h-full">
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">AI Prompt Management</h1>
              <p className="text-lg text-slate-600">
                Manage your AI coaching prompts with simplified flat versioning
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <AiProviderSelector 
                apiKeyStatus={apiKeyStatus}
                isValidating={isValidatingKeys}
              />
              <Button 
                onClick={() => setIsCreating(true)}
                className="bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg transition-all duration-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Prompt
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-all duration-200 bg-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-700">Active Prompt</CardTitle>
                <MessageSquare className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {activePrompt ? (
                    <>
                      <div className="text-sm font-semibold truncate text-slate-900">
                        {activePrompt.prompt_name || 'Untitled'}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="default" className="text-xs bg-green-600">v{activePrompt.version_number}</Badge>
                        <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                          System-Wide
                        </Badge>
                      </div>
                    </>
                  ) : (
                    <div className="text-sm text-slate-500">No active prompt</div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-all duration-200 bg-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-700">Total Prompts</CardTitle>
                <History className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">{allPrompts?.length || 0}</div>
                <p className="text-xs text-slate-500 mt-1">
                  All versions available
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-all duration-200 bg-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-700">AI Provider</CardTitle>
                <Zap className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <div className="text-2xl font-bold text-slate-900">
                    {defaultAiProvider?.toUpperCase() || 'Loading...'}
                  </div>
                  <Badge variant="outline" className="text-xs">Active</Badge>
                </div>
                <p className="text-xs text-slate-500 mt-1">Global default</p>
              </CardContent>
            </Card>
          </div>

          {activePrompt ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <h2 className="text-2xl font-bold text-slate-900">Current Active Prompt</h2>
                  <Badge variant="secondary" className="bg-green-100 text-green-800 px-3 py-1">
                    Powering All AI Analysis
                  </Badge>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
                <PromptCard 
                  prompt={activePrompt}
                  onEdit={handleEditPrompt}
                  onDelete={handleDeletePrompt}
                />
              </div>
            </div>
          ) : (
            <Card className="shadow-md hover:shadow-lg transition-all duration-200 bg-white">
              <CardContent className="p-12 text-center">
                <div className="p-4 bg-slate-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                  <MessageSquare className="h-10 w-10 text-slate-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">No active prompt</h3>
                <p className="text-slate-600 mb-6 leading-relaxed">Create your first AI coaching prompt to get started with intelligent sales analysis.</p>
                <Button onClick={() => setIsCreating(true)} className="bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg transition-all duration-200">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Prompt
                </Button>
              </CardContent>
            </Card>
          )}

          {inactivePrompts.length > 0 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-900">All Prompt Versions</h2>
              <div className="space-y-4">
                {inactivePrompts.map((prompt) => (
                  <div key={prompt.id} className="relative bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
                    <PromptCard 
                      prompt={prompt}
                      onEdit={handleEditPrompt}
                      onDelete={handleDeletePrompt}
                    />
                    <div className="absolute top-6 right-6">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleActivatePrompt(prompt.id)}
                        disabled={activateVersion.isPending}
                        className="bg-white hover:bg-green-50 border-green-200 text-green-700 hover:text-green-800 shadow-sm hover:shadow-md transition-all duration-200"
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Activate
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(isCreating || selectedPrompt) && (
            <SimplePromptEditor 
              prompt={selectedPrompt}
              isOpen={isCreating || !!selectedPrompt}
              onClose={() => {
                setIsCreating(false)
                setSelectedPrompt(null)
              }}
            />
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
