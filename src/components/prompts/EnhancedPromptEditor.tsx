
import { useState, useEffect } from 'react'
import { useCreatePrompt, useUpdatePrompt, usePromptVersions } from '@/hooks/usePrompts'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { History } from 'lucide-react'
import { VariableInserter } from './VariableInserter'
import { VersionHistorySidebar } from './VersionHistorySidebar'

interface EnhancedPromptEditorProps {
  promptId?: string | null
  isOpen: boolean
  onClose: () => void
}

export function EnhancedPromptEditor({ promptId, isOpen, onClose }: EnhancedPromptEditorProps) {
  const [promptText, setPromptText] = useState('')
  const [changeDescription, setChangeDescription] = useState('')
  const [showVersionHistory, setShowVersionHistory] = useState(false)

  const createPrompt = useCreatePrompt()
  const updatePrompt = useUpdatePrompt()
  const { data: versions } = usePromptVersions(promptId || '')

  const isEditing = !!promptId
  const currentPrompt = versions?.find(v => v.is_active)

  useEffect(() => {
    if (isEditing && currentPrompt) {
      setPromptText(currentPrompt.prompt_text)
      setShowVersionHistory(true)
    } else {
      setPromptText('')
      setChangeDescription('')
      setShowVersionHistory(false)
    }
  }, [isEditing, currentPrompt])

  const handleSave = async () => {
    if (!promptText.trim()) return

    try {
      if (isEditing && promptId) {
        await updatePrompt.mutateAsync({
          parent_prompt_id: promptId,
          prompt_text: promptText,
          change_description: changeDescription
        })
      } else {
        await createPrompt.mutateAsync({
          prompt_text: promptText,
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
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{isEditing ? 'Edit AI Prompt' : 'Create New AI Prompt'}</span>
            {isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowVersionHistory(!showVersionHistory)}
              >
                <History className="h-4 w-4 mr-2" />
                {showVersionHistory ? 'Hide' : 'Show'} History
              </Button>
            )}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Create a new version of this prompt with your changes.'
              : 'Create a new AI coaching prompt for analyzing sales conversations.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="flex h-[calc(90vh-200px)]">
          <div className={`flex-1 space-y-4 pr-4 ${showVersionHistory ? 'border-r' : ''}`}>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-full">
              <div className="lg:col-span-3 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="prompt-text">Prompt Text</Label>
                  <Textarea
                    id="prompt-text"
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    placeholder="Enter your AI coaching prompt here..."
                    className="h-[300px] font-mono text-sm resize-none"
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
                    className="h-20 resize-none"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <VariableInserter onInsert={insertVariable} />
                
                {isEditing && currentPrompt && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Current Version</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Badge variant="default">v{currentPrompt.version_number}</Badge>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">Active</Badge>
                      </div>
                      <p className="text-xs text-slate-600">
                        {currentPrompt.change_description || 'No description'}
                      </p>
                      <p className="text-xs text-slate-500">
                        Created: {new Date(currentPrompt.created_at).toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>

          {showVersionHistory && isEditing && versions && (
            <VersionHistorySidebar 
              versions={versions}
              currentPromptId={promptId!}
              onVersionSelect={(version) => {
                setPromptText(version.prompt_text)
                setChangeDescription(`Based on v${version.version_number}`)
              }}
            />
          )}
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-slate-600">
            {isEditing && (
              <span>Creating version {(currentPrompt?.version_number || 0) + 1}</span>
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
