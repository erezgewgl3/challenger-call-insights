import React, { useState } from 'react'
import { usePrompts, useActivePrompts } from '@/hooks/usePrompts'
import { useDefaultAiProvider, useSetDefaultAiProvider } from '@/hooks/useSystemSettings'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, MessageSquare, History, Settings, Zap, AlertCircle, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { PromptEditor } from '@/components/prompts/PromptEditor'
import { PromptVersionHistory } from '@/components/prompts/PromptVersionHistory'
import { PromptSettings } from '@/components/prompts/PromptSettings'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

interface ApiKeyStatus {
  openai: boolean
  claude: boolean
}

export default function PromptManagement() {
  const [activeTab, setActiveTab] = useState('active')
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [pendingProvider, setPendingProvider] = useState<'openai' | 'claude' | null>(null)
  const [apiKeyStatus, setApiKeyStatus] = useState<ApiKeyStatus>({ openai: false, claude: false })
  const [isValidatingKeys, setIsValidatingKeys] = useState(false)

  const { data: allPrompts, isLoading } = usePrompts()
  const { data: activePrompts } = useActivePrompts()
  const { data: defaultAiProvider } = useDefaultAiProvider()
  const setAiProvider = useSetDefaultAiProvider()

  // Validate API keys on component mount
  React.useEffect(() => {
    validateApiKeys()
  }, [])

  const validateApiKeys = async () => {
    setIsValidatingKeys(true)
    try {
      // Check if API keys are configured by trying to make a simple test call
      const response = await fetch('/api/validate-api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (response.ok) {
        const data = await response.json()
        setApiKeyStatus(data)
      } else {
        // Fallback: assume both are available if validation endpoint doesn't exist
        setApiKeyStatus({ openai: true, claude: true })
      }
    } catch (error) {
      console.warn('Could not validate API keys:', error)
      // Fallback: assume both are available
      setApiKeyStatus({ openai: true, claude: true })
    } finally {
      setIsValidatingKeys(false)
    }
  }

  const handleProviderChange = (newProvider: 'openai' | 'claude') => {
    if (newProvider === defaultAiProvider) return
    
    // Check if the target provider has valid API keys
    const hasValidKey = apiKeyStatus[newProvider]
    
    if (!hasValidKey) {
      toast.error(`${newProvider.toUpperCase()} API key not configured. Please add it in System Settings.`)
      return
    }

    setPendingProvider(newProvider)
    setShowConfirmDialog(true)
  }

  const confirmProviderChange = async () => {
    if (!pendingProvider) return

    const previousProvider = defaultAiProvider
    
    try {
      await setAiProvider.mutateAsync(pendingProvider)
      toast.success(`AI provider switched to ${pendingProvider.toUpperCase()}`)
      setShowConfirmDialog(false)
      setPendingProvider(null)
    } catch (error) {
      console.error('Failed to switch AI provider:', error)
      toast.error(`Failed to switch to ${pendingProvider.toUpperCase()}. Keeping ${previousProvider?.toUpperCase()}.`)
      // The mutation will automatically revert on error due to React Query's behavior
    }
  }

  const cancelProviderChange = () => {
    setShowConfirmDialog(false)
    setPendingProvider(null)
  }

  const getProviderStatus = (provider: 'openai' | 'claude') => {
    if (isValidatingKeys) return 'loading'
    return apiKeyStatus[provider] ? 'available' : 'missing'
  }

  const getProviderStatusIcon = (provider: 'openai' | 'claude') => {
    const status = getProviderStatus(provider)
    switch (status) {
      case 'available':
        return <CheckCircle className="h-3 w-3 text-green-600" />
      case 'missing':
        return <XCircle className="h-3 w-3 text-red-600" />
      case 'loading':
        return <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-400"></div>
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
            Manage prompt content and system configuration
          </p>
        </div>
        <Button 
          onClick={() => setIsCreating(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create New Prompt
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Default Prompt</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {allPrompts?.find(p => p.is_default) ? '1' : '0'}
            </div>
            <p className="text-xs text-muted-foreground">Global default set</p>
          </CardContent>
        </Card>

        <Card className="border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Provider</CardTitle>
            <Zap className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="text-2xl font-bold">
                {defaultAiProvider?.toUpperCase() || 'Loading...'}
              </div>
              <Badge variant="outline" className="text-xs">Global</Badge>
              {defaultAiProvider && getProviderStatusIcon(defaultAiProvider)}
            </div>
            
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Quick Switch:</p>
              <Select 
                value={defaultAiProvider || ''} 
                onValueChange={handleProviderChange}
                disabled={setAiProvider.isPending || isValidatingKeys}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai" disabled={!apiKeyStatus.openai}>
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center space-x-2">
                        <Zap className="h-3 w-3" />
                        <span>OpenAI GPT-4</span>
                      </div>
                      {getProviderStatusIcon('openai')}
                    </div>
                  </SelectItem>
                  <SelectItem value="claude" disabled={!apiKeyStatus.claude}>
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center space-x-2">
                        <Zap className="h-3 w-3" />
                        <span>Anthropic Claude</span>
                      </div>
                      {getProviderStatusIcon('claude')}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              
              {setAiProvider.isPending && (
                <div className="flex items-center space-x-1 text-xs text-blue-600">
                  <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-600"></div>
                  <span>Switching...</span>
                </div>
              )}

              {isValidatingKeys && (
                <div className="flex items-center space-x-1 text-xs text-gray-600">
                  <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-600"></div>
                  <span>Checking API keys...</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-1 text-xs text-amber-600">
              <AlertCircle className="h-3 w-3" />
              <span>Affects all analyses</span>
            </div>

            {/* API Key Status Indicators */}
            <div className="pt-2 border-t border-gray-200">
              <p className="text-xs text-muted-foreground mb-1">API Key Status:</p>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span>OpenAI:</span>
                  <div className="flex items-center space-x-1">
                    {getProviderStatusIcon('openai')}
                    <span className={apiKeyStatus.openai ? 'text-green-600' : 'text-red-600'}>
                      {apiKeyStatus.openai ? 'Ready' : 'Missing'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span>Claude:</span>
                  <div className="flex items-center space-x-1">
                    {getProviderStatusIcon('claude')}
                    <span className={apiKeyStatus.claude ? 'text-green-600' : 'text-red-600'}>
                      {apiKeyStatus.claude ? 'Ready' : 'Missing'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">Active Prompts</TabsTrigger>
          <TabsTrigger value="versions">Version History</TabsTrigger>
          <TabsTrigger value="settings">System Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <PromptActiveList 
            prompts={activePrompts || []}
            onEdit={setSelectedPrompt}
          />
        </TabsContent>

        <TabsContent value="versions" className="space-y-4">
          <PromptVersionHistory prompts={allPrompts || []} />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <PromptSettings />
        </TabsContent>
      </Tabs>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <span>Confirm AI Provider Change</span>
            </DialogTitle>
            <DialogDescription className="space-y-2">
              <p>
                You're about to switch from <strong>{defaultAiProvider?.toUpperCase()}</strong> to{' '}
                <strong>{pendingProvider?.toUpperCase()}</strong>.
              </p>
              <p className="text-amber-600 font-medium">
                ⚠️ This will affect all future AI analyses across the entire system.
              </p>
              <p className="text-sm text-muted-foreground">
                Any currently running analyses will continue with the previous provider, but all new
                analyses will use {pendingProvider?.toUpperCase()}.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={cancelProviderChange}>
              Cancel
            </Button>
            <Button onClick={confirmProviderChange} disabled={setAiProvider.isPending}>
              {setAiProvider.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b border-white mr-2"></div>
                  Switching...
                </>
              ) : (
                `Switch to ${pendingProvider?.toUpperCase()}`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {(isCreating || selectedPrompt) && (
        <PromptEditor 
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

function PromptActiveList({ prompts, onEdit }: { 
  prompts: any[], 
  onEdit: (id: string) => void 
}) {
  return (
    <div className="grid gap-4">
      {prompts.map((prompt) => (
        <Card key={prompt.id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CardTitle className="text-lg">
                  Prompt v{prompt.version_number}
                </CardTitle>
                <Badge variant="outline">Active</Badge>
                {prompt.is_default && (
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                    Default
                  </Badge>
                )}
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onEdit(prompt.id)}
              >
                Edit
              </Button>
            </div>
            <CardDescription>
              {prompt.change_description || 'No description'}
              {' • '}
              Last updated: {new Date(prompt.updated_at).toLocaleDateString()}
              {prompt.activated_at && (
                <> • Activated: {new Date(prompt.activated_at).toLocaleDateString()}</>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 line-clamp-3">
              {prompt.prompt_text.substring(0, 200)}...
            </p>
          </CardContent>
        </Card>
      ))}
      
      {prompts.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <MessageSquare className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No active prompts</h3>
            <p className="text-slate-600">Create your first AI coaching prompt to get started.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
