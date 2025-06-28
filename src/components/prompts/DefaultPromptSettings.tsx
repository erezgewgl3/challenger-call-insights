
import { useState } from 'react'
import { useDefaultPrompt, usePrompts } from '@/hooks/usePrompts'
import { useSetDefaultPrompt } from '@/hooks/useSystemSettings'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Settings, Crown } from 'lucide-react'

export function DefaultPromptSettings() {
  const { data: defaultPrompt, isLoading: defaultLoading } = useDefaultPrompt()
  const { data: allPrompts, isLoading: promptsLoading } = usePrompts()
  const setDefaultPrompt = useSetDefaultPrompt()
  
  const [selectedPromptId, setSelectedPromptId] = useState<string>('')

  // Filter for active prompts from all prompts
  const activePrompts = allPrompts?.filter(prompt => prompt.is_active) || []

  const handleSetDefault = async () => {
    if (!selectedPromptId) return
    
    try {
      await setDefaultPrompt.mutateAsync(selectedPromptId === 'none' ? null : selectedPromptId)
      setSelectedPromptId('')
    } catch (error) {
      console.error('Failed to set default prompt:', error)
    }
  }

  if (defaultLoading || promptsLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {defaultPrompt && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Crown className="h-5 w-5 text-yellow-600" />
              <span>Current Default Prompt</span>
            </CardTitle>
            <CardDescription>
              This prompt is used when no specific prompt is selected
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Badge variant="outline">v{defaultPrompt.version_number}</Badge>
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  Default
                </Badge>
              </div>
              
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-sm text-slate-600 line-clamp-3">
                  {defaultPrompt.prompt_text.substring(0, 200)}...
                </p>
              </div>
              
              <div className="text-xs text-slate-500">
                <p>Created: {new Date(defaultPrompt.created_at).toLocaleDateString()}</p>
                {defaultPrompt.activated_at && (
                  <p>Activated: {new Date(defaultPrompt.activated_at).toLocaleDateString()}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5 text-blue-600" />
            <span>Set New Default Prompt</span>
          </CardTitle>
          <CardDescription>
            Choose which prompt should be the global default for all analyses
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prompt-select">Select Prompt</Label>
            <Select value={selectedPromptId} onValueChange={setSelectedPromptId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a prompt to set as default" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  <span className="text-slate-500">No default prompt</span>
                </SelectItem>
                {activePrompts.map((prompt) => (
                  <SelectItem key={prompt.id} value={prompt.id}>
                    <div className="flex items-center space-x-2">
                      <span>v{prompt.version_number}</span>
                      <span>-</span>
                      <span>{prompt.change_description || 'No description'}</span>
                      {prompt.is_default && (
                        <Badge variant="secondary" className="ml-2 text-xs">Current</Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={handleSetDefault}
            disabled={!selectedPromptId || setDefaultPrompt.isPending}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {setDefaultPrompt.isPending ? 'Setting Default...' : 'Set as Default'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Available Active Prompts</CardTitle>
          <CardDescription>
            All currently active prompts that can be set as default
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {activePrompts.map((prompt) => (
              <div 
                key={prompt.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  prompt.is_default ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">v{prompt.version_number}</Badge>
                    {prompt.is_default && (
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                        <Crown className="h-3 w-3 mr-1" />
                        Default
                      </Badge>
                    )}
                  </div>
                  <span className="text-sm font-medium">
                    {prompt.change_description || 'No description'}
                  </span>
                </div>
                <div className="text-xs text-slate-500">
                  {new Date(prompt.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
