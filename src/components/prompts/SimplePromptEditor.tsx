
import { useState, useEffect } from 'react'
import { useCreatePrompt, useUpdatePrompt } from '@/hooks/usePrompts'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { VariableInserter } from './VariableInserter'

interface Prompt {
  id: string
  version_number: number
  user_id?: string
  prompt_text: string
  prompt_name: string
  is_default: boolean
  is_active: boolean
  change_description?: string
  activated_at?: string
  created_at: string
  updated_at: string
  created_by?: string
}

interface SimplePromptEditorProps {
  prompt?: Prompt | null
  isOpen: boolean
  onClose: () => void
}

export function SimplePromptEditor({ prompt, isOpen, onClose }: SimplePromptEditorProps) {
  const [promptText, setPromptText] = useState('')
  const [promptName, setPromptName] = useState('')
  const [changeDescription, setChangeDescription] = useState('')

  const createPrompt = useCreatePrompt()
  const updatePrompt = useUpdatePrompt()

  const isEditing = !!prompt

  useEffect(() => {
    if (isEditing && prompt) {
      setPromptText(prompt.prompt_text)
      setPromptName(prompt.prompt_name)
      setChangeDescription('')
    } else {
      setPromptText('')
      setPromptName('')
      setChangeDescription('')
    }
  }, [isEditing, prompt])

  const handleSave = async () => {
    if (!promptText.trim() || !promptName.trim()) return

    try {
      if (isEditing) {
        await updatePrompt.mutateAsync({
          prompt_text: promptText,
          prompt_name: promptName,
          change_description: changeDescription || 'Updated prompt'
        })
      } else {
        await createPrompt.mutateAsync({
          prompt_text: promptText,
          prompt_name: promptName,
          change_description: changeDescription || 'New prompt created'
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
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Create New Prompt Version' : 'Create New AI Prompt'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Create a new version based on the current prompt.'
              : 'Create a new AI coaching prompt for analyzing sales conversations.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-4">
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
                className="h-[300px] font-mono text-sm resize-none"
              />
              <p className="text-xs text-slate-500">
                Use variables like {`{{conversation}}`}, {`{{account_context}}`}, and {`{{user_context}}`} for dynamic content.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="change-description">Description</Label>
              <Textarea
                id="change-description"
                value={changeDescription}
                onChange={(e) => setChangeDescription(e.target.value)}
                placeholder="Describe this version or what you changed..."
                className="h-20 resize-none"
              />
            </div>
          </div>

          <div className="space-y-4">
            <VariableInserter onInsert={insertVariable} />
          </div>
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-600">
            {isEditing && (
              <span>This will create version {(prompt?.version_number || 0) + 1}</span>
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
