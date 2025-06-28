
import { useState } from 'react'
import { useDefaultAiProvider, useDefaultPromptId, useSetDefaultAiProvider, useSetDefaultPrompt } from '@/hooks/useSystemSettings'
import { useActivePrompts } from '@/hooks/usePrompts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Settings, Crown, Zap } from 'lucide-react'

export function SystemSettingsPanel() {
  const { data: currentAiProvider } = useDefaultAiProvider()
  const { data: currentPromptId } = useDefaultPromptId()
  const { data: activePrompts } = useActivePrompts()
  
  const setAiProvider = useSetDefaultAiProvider()
  const setDefaultPrompt = useSetDefaultPrompt()
  
  const [selectedAiProvider, setSelectedAiProvider] = useState<'openai' | 'claude'>()
  const [selectedPromptId, setSelectedPromptId] = useState<string>('')

  const currentPrompt = activePrompts?.find(p => p.id === currentPromptId)

  const handleUpdateAiProvider = async () => {
    if (selectedAiProvider) {
      await setAiProvider.mutateAsync(selectedAiProvider)
      setSelectedAiProvider(undefined)
    }
  }

  const handleUpdateDefaultPrompt = async () => {
    if (selectedPromptId) {
      await setDefaultPrompt.mutateAsync(selectedPromptId === 'none' ? null : selectedPromptId)
      setSelectedPromptId('')
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5 text-blue-600" />
            <span>Current System Settings</span>
          </CardTitle>
          <CardDescription>
            Global configuration that applies to all AI analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">AI Provider</Label>
              <div className="flex items-center space-x-2">
                <Badge variant={currentAiProvider === 'openai' ? 'default' : 'secondary'} className="text-sm">
                  <Zap className="h-3 w-3 mr-1" />
                  {currentAiProvider?.toUpperCase() || 'Loading...'}
                </Badge>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">Default Prompt</Label>
              <div className="flex items-center space-x-2">
                {currentPrompt ? (
                  <Badge variant="secondary" className="text-sm">
                    <Crown className="h-3 w-3 mr-1" />
                    v{currentPrompt.version_number}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-sm">No default set</Badge>
                )}
              </div>
            </div>
          </div>
          
          {currentPrompt && (
            <div className="bg-slate-50 p-3 rounded-lg">
              <p className="text-sm text-slate-600 line-clamp-2">
                {currentPrompt.prompt_text.substring(0, 150)}...
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>AI Provider Configuration</CardTitle>
          <CardDescription>
            Choose which AI service to use for all analyses
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ai-provider-select">Select AI Provider</Label>
            <Select 
              value={selectedAiProvider || currentAiProvider || ''} 
              onValueChange={(value: 'openai' | 'claude') => setSelectedAiProvider(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose AI provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openai">
                  <div className="flex items-center space-x-2">
                    <span>OpenAI GPT-4</span>
                    <Badge variant="outline" className="text-xs">Recommended</Badge>
                  </div>
                </SelectItem>
                <SelectItem value="claude">
                  <div className="flex items-center space-x-2">
                    <span>Anthropic Claude</span>
                    <Badge variant="outline" className="text-xs">Alternative</Badge>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={handleUpdateAiProvider}
            disabled={!selectedAiProvider || selectedAiProvider === currentAiProvider || setAiProvider.isPending}
            className="w-full"
          >
            {setAiProvider.isPending ? 'Updating...' : 'Update AI Provider'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Default Prompt Configuration</CardTitle>
          <CardDescription>
            Choose which prompt to use as the global default for all analyses
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prompt-select">Select Default Prompt</Label>
            <Select 
              value={selectedPromptId || currentPromptId || 'none'} 
              onValueChange={setSelectedPromptId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose default prompt" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  <span className="text-slate-500">No default prompt</span>
                </SelectItem>
                {activePrompts?.map((prompt) => (
                  <SelectItem key={prompt.id} value={prompt.id}>
                    <div className="flex items-center space-x-2">
                      <span>v{prompt.version_number}</span>
                      <span>-</span>
                      <span>{prompt.change_description || 'No description'}</span>
                      {prompt.is_default && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          <Crown className="h-2 w-2 mr-1" />
                          Current
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={handleUpdateDefaultPrompt}
            disabled={!selectedPromptId || selectedPromptId === (currentPromptId || 'none') || setDefaultPrompt.isPending}
            className="w-full"
          >
            {setDefaultPrompt.isPending ? 'Updating...' : 'Update Default Prompt'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
