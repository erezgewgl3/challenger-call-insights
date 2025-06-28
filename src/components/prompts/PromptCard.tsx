
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Edit, Calendar, MessageSquare, History } from 'lucide-react'

interface Prompt {
  id: string
  parent_prompt_id?: string
  version_number: number
  user_id?: string
  prompt_text: string
  is_default: boolean
  is_active: boolean
  change_description?: string
  activated_at?: string
  created_at: string
  updated_at: string
}

interface PromptCardProps {
  prompt: Prompt
  onEdit?: (id: string) => void
  onViewHistory?: (id: string) => void
  showActions?: boolean
}

export function PromptCard({ prompt, onEdit, onViewHistory, showActions = true }: PromptCardProps) {
  const truncatedText = prompt.prompt_text.length > 200 
    ? prompt.prompt_text.substring(0, 200) + '...'
    : prompt.prompt_text

  const wordCount = prompt.prompt_text.split(/\s+/).length
  const charCount = prompt.prompt_text.length

  return (
    <Card className={`transition-shadow ${
      prompt.is_active 
        ? 'hover:shadow-md border-green-200 bg-green-50/50' 
        : 'hover:shadow-md opacity-75 bg-gray-50/50 border-gray-200'
    }`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <MessageSquare className={`h-5 w-5 ${
              prompt.is_active ? 'text-green-600' : 'text-gray-400'
            }`} />
            <div>
              <CardTitle className={`text-lg ${
                prompt.is_active ? 'text-slate-900' : 'text-slate-600'
              }`}>
                {prompt.is_default ? 'Default System Prompt' : 'Custom Prompt'}
              </CardTitle>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant={prompt.is_active ? 'default' : 'outline'}>
                  v{prompt.version_number}
                </Badge>
                {prompt.is_active && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Active System-Wide
                  </Badge>
                )}
                {prompt.is_default && (
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                    Default
                  </Badge>
                )}
              </div>
            </div>
          </div>
          {showActions && (
            <div className="flex items-center space-x-2">
              {prompt.is_active && onEdit && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onEdit(prompt.id)}
                  className="flex items-center space-x-1"
                >
                  <Edit className="h-4 w-4" />
                  <span>Edit</span>
                </Button>
              )}
              {onViewHistory && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onViewHistory(prompt.id)}
                  className="flex items-center space-x-1"
                >
                  <History className="h-4 w-4" />
                  <span>History</span>
                </Button>
              )}
            </div>
          )}
        </div>
        <CardDescription className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-1">
            <Calendar className="h-3 w-3" />
            <span>Updated {new Date(prompt.updated_at).toLocaleDateString()}</span>
          </div>
          {prompt.activated_at && (
            <>
              <span>•</span>
              <span>Activated {new Date(prompt.activated_at).toLocaleDateString()}</span>
            </>
          )}
          <span>•</span>
          <span>{wordCount} words, {charCount} chars</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {prompt.change_description && (
            <p className={`text-sm font-medium ${
              prompt.is_active ? 'text-slate-700' : 'text-slate-500'
            }`}>
              {prompt.change_description}
            </p>
          )}
          <p className={`text-sm leading-relaxed ${
            prompt.is_active ? 'text-slate-600' : 'text-slate-400'
          }`}>
            {truncatedText}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
