
import { useState, useEffect } from 'react'
import { useCreatePrompt, useUpdatePrompt, usePromptVersions } from '@/hooks/usePrompts'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MessageSquare, User, Building, TestTube } from 'lucide-react'
import { PromptTester } from './PromptTester'

interface PromptEditorProps {
  promptId?: string | null
  isOpen: boolean
  onClose: () => void
}

export function PromptEditor({ promptId, isOpen, onClose }: PromptEditorProps) {
  const [promptText, setPromptText] = useState('')
  const [promptName, setPromptName] = useState('')
  const [changeDescription, setChangeDescription] = useState('')
  const [activeTab, setActiveTab] = useState('editor')

  const createPrompt = useCreatePrompt()
  const updatePrompt = useUpdatePrompt()
  const { data: versions } = usePromptVersions()

  const isEditing = !!promptId
  const currentPrompt = versions?.find(v => v.id === promptId)

  useEffect(() => {
    if (isEditing && currentPrompt) {
      setPromptText(currentPrompt.prompt_text)
      setPromptName(currentPrompt.prompt_name || '')
    } else {
      setPromptText('')
      setPromptName('')
      setChangeDescription('')
    }
    setActiveTab('editor')
  }, [isEditing, currentPrompt])

  const handleSave = async () => {
    if (!promptText.trim() || !promptName.trim()) return

    try {
      if (isEditing) {
        await updatePrompt.mutateAsync({
          prompt_text: promptText,
          prompt_name: promptName,
          change_description: changeDescription
        })
      } else {
        await createPrompt.mutateAsync({
          prompt_text: promptText,
          prompt_name: promptName,
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
            {isEditing ? 'Create New Prompt Version' : 'Create New AI Prompt'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Create a new version based on the selected prompt.'
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
              <div className="lg:col-span-2 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="prompt-name">Prompt Name</Label>
                  <Input
                    id="prompt-name"
                    value={promptName}
                    onChange={(e) => setPromptName(e.target.value)}
                    placeholder="Enter a descriptive name for this prompt..."
                  />
                </div>

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

              <div className="space-y-4">
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

                {isEditing && versions && versions.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">All Prompts</CardTitle>
                      <CardDescription className="text-xs">
                        All available prompts
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
              <PromptTester promptId={currentPrompt.id} />
            )}
          </TabsContent>
        </Tabs>

        <Separator />

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-slate-600">
            {isEditing && (
              <span>Creating new version</span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!promptText.trim() || !promptName.trim() || createPrompt.isPending || updatePrompt.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {createPrompt.isPending || updatePrompt.isPending ? 'Saving...' : 'Save & Activate'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
