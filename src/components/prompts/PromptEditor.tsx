
import { useState, useEffect } from 'react'
import { useCreatePrompt, useUpdatePrompt, usePromptVersions } from '@/hooks/usePrompts'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { MessageSquare, Code, User, Building, TestTube, Crown } from 'lucide-react'
import { PromptTester } from './PromptTester'

interface PromptEditorProps {
  promptId?: string | null
  isOpen: boolean
  onClose: () => void
}

export function PromptEditor({ promptId, isOpen, onClose }: PromptEditorProps) {
  const [promptText, setPromptText] = useState('')
  const [aiProvider, setAiProvider] = useState<'openai' | 'claude'>('openai')
  const [changeDescription, setChangeDescription] = useState('')
  const [isDefault, setIsDefault] = useState(false)
  const [defaultAiProvider, setDefaultAiProvider] = useState<'openai' | 'claude'>('openai')
  const [activeTab, setActiveTab] = useState('editor')

  const createPrompt = useCreatePrompt()
  const updatePrompt = useUpdatePrompt()
  const { data: versions } = usePromptVersions(promptId || '')

  const isEditing = !!promptId
  const currentPrompt = versions?.find(v => v.is_active)

  useEffect(() => {
    if (isEditing && currentPrompt) {
      setPromptText(currentPrompt.prompt_text)
      setAiProvider(currentPrompt.ai_provider as 'openai' | 'claude')
      setIsDefault(currentPrompt.is_default)
      setDefaultAiProvider((currentPrompt.default_ai_provider || 'openai') as 'openai' | 'claude')
    } else {
      // Reset for new prompt
      setPromptText('')
      setAiProvider('openai')
      setChangeDescription('')
      setIsDefault(false)
      setDefaultAiProvider('openai')
    }
    setActiveTab('editor')
  }, [isEditing, currentPrompt])

  const handleSave = async () => {
    if (!promptText.trim()) return

    try {
      if (isEditing && promptId) {
        await updatePrompt.mutateAsync({
          parent_prompt_id: promptId,
          prompt_text: promptText,
          ai_provider: aiProvider,
          is_default: isDefault,
          default_ai_provider: isDefault ? defaultAiProvider : undefined,
          change_description: changeDescription
        })
      } else {
        await createPrompt.mutateAsync({
          prompt_text: promptText,
          ai_provider: aiProvider,
          is_default: isDefault,
          default_ai_provider: isDefault ? defaultAiProvider : undefined,
          change_description: changeDescription || 'Initial version'
        })
      }
      onClose()
    } catch (error) {
      console.error('Failed to save prompt:', error)
    }
  }

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById('prompt-text') as HTMLTextAreaElement
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newText = promptText.substring(0, start) + variable + promptText.substring(end)
      setPromptText(newText)
      
      // Restore cursor position
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(start + variable.length, start + variable.length)
      }, 0)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit AI Prompt' : 'Create New AI Prompt'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Create a new version of this prompt with your changes.'
              : 'Create a new AI coaching prompt for analyzing sales conversations.'
            }
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="editor">Editor</TabsTrigger>
            <TabsTrigger value="test" disabled={!isEditing || !currentPrompt}>
              <TestTube className="h-4 w-4 mr-2" />
              Test Prompt
            </TabsTrigger>
          </TabsList>

          <TabsContent value="editor">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Editor */}
              <div className="lg:col-span-2 space-y-4">
                {/* Provider Selection */}
                <div className="space-y-2">
                  <Label htmlFor="ai-provider">AI Provider</Label>
                  <Select value={aiProvider} onValueChange={(value) => setAiProvider(value as 'openai' | 'claude')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select AI provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openai">ChatGPT (OpenAI GPT-4.1)</SelectItem>
                      <SelectItem value="claude">Claude (Anthropic 3.5 Sonnet)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Default Prompt Settings */}
                <Card className="border-yellow-200 bg-yellow-50">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center space-x-2">
                      <Crown className="h-4 w-4 text-yellow-600" />
                      <span>Default Prompt Settings</span>
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Set this prompt as the global default for all analyses
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="is-default"
                        checked={isDefault}
                        onCheckedChange={(checked) => setIsDefault(checked as boolean)}
                      />
                      <Label htmlFor="is-default" className="text-sm">
                        Set as global default prompt
                      </Label>
                    </div>
                    
                    {isDefault && (
                      <div className="space-y-2">
                        <Label htmlFor="default-ai-provider" className="text-sm">
                          Default AI Provider
                        </Label>
                        <Select 
                          value={defaultAiProvider} 
                          onValueChange={(value) => setDefaultAiProvider(value as 'openai' | 'claude')}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="openai">ChatGPT (OpenAI GPT-4.1)</SelectItem>
                            <SelectItem value="claude">Claude (Anthropic 3.5 Sonnet)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Prompt Text Editor */}
                <div className="space-y-2">
                  <Label htmlFor="prompt-text">Prompt Text</Label>
                  <Textarea
                    id="prompt-text"
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    placeholder="Enter your AI coaching prompt here..."
                    className="min-h-[400px] font-mono text-sm"
                  />
                  <p className="text-xs text-slate-500">
                    Use variables like {`{{conversation}}`}, {`{{account_context}}`}, and {`{{user_context}}`} for dynamic content.
                  </p>
                </div>

                {/* Change Description */}
                <div className="space-y-2">
                  <Label htmlFor="change-description">
                    {isEditing ? 'Change Description' : 'Initial Description'}
                  </Label>
                  <Textarea
                    id="change-description"
                    value={changeDescription}
                    onChange={(e) => setChangeDescription(e.target.value)}
                    placeholder="Describe what changed in this version..."
                    className="h-20"
                  />
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-4">
                {/* Variable Insertion */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Insert Variables</CardTitle>
                    <CardDescription className="text-xs">
                      Click to insert dynamic variables into your prompt
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => insertVariable('{{conversation}}')}
                    >
                      <MessageSquare className="h-3 w-3 mr-2" />
                      Conversation
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => insertVariable('{{account_context}}')}
                    >
                      <Building className="h-3 w-3 mr-2" />
                      Account Context
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => insertVariable('{{user_context}}')}
                    >
                      <User className="h-3 w-3 mr-2" />
                      User Context
                    </Button>
                  </CardContent>
                </Card>

                {/* Version History (if editing) */}
                {isEditing && versions && versions.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Version History</CardTitle>
                      <CardDescription className="text-xs">
                        Previous versions of this prompt
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {versions.slice(0, 5).map((version) => (
                        <div key={version.id} className="flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-2">
                            <Badge variant={version.is_active ? 'default' : 'outline'} className="text-xs">
                              v{version.version_number}
                            </Badge>
                            {version.is_active && <Badge variant="secondary" className="text-xs">Active</Badge>}
                            {version.is_default && (
                              <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                                <Crown className="h-2 w-2 mr-1" />
                                Default
                              </Badge>
                            )}
                          </div>
                          <span className="text-slate-500">
                            {new Date(version.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="test">
            {isEditing && currentPrompt && (
              <PromptTester
                promptId={currentPrompt.id}
                aiProvider={currentPrompt.default_ai_provider || currentPrompt.ai_provider}
              />
            )}
          </TabsContent>
        </Tabs>

        <Separator />

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-slate-600">
            {isEditing && (
              <span>Creating version {(currentPrompt?.version_number || 0) + 1}</span>
            )}
            {isDefault && (
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                <Crown className="h-3 w-3 mr-1" />
                Will be set as default
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!promptText.trim() || createPrompt.isPending || updatePrompt.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {createPrompt.isPending || updatePrompt.isPending ? 'Saving...' : 'Save Prompt'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
