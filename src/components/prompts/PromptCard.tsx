
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Edit, Calendar, MessageSquare, Trash2, TestTube, MoreHorizontal, Copy, Download } from 'lucide-react'

interface PromptCardProps {
  prompt: any
  onEdit?: (prompt: any) => void
  onDelete?: (id: string) => void
  onTest?: (prompt: any) => void
  onDuplicate?: (prompt: any) => void
  showActions?: boolean
}

export function PromptCard({ prompt, onEdit, onDelete, onTest, onDuplicate, showActions = true }: PromptCardProps) {
  const truncatedText = prompt.prompt_text?.length > 200 
    ? prompt.prompt_text.substring(0, 200) + '...'
    : prompt.prompt_text || ''

  const wordCount = prompt.prompt_text?.split(/\s+/).length || 0
  const charCount = prompt.prompt_text?.length || 0

  const handleExport = () => {
    const exportData = {
      prompt_name: prompt.prompt_name,
      prompt_text: prompt.prompt_text,
      version_number: prompt.version_number,
      change_description: prompt.change_description,
      created_at: prompt.created_at
    }
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${prompt.prompt_name || 'prompt'}-v${prompt.version_number}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

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
                {prompt.prompt_name || 'Untitled'}
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
              {onTest && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onTest(prompt)}
                  className="flex items-center space-x-1 text-blue-600 hover:text-blue-700"
                >
                  <TestTube className="h-4 w-4" />
                  <span>Test</span>
                </Button>
              )}
              {onEdit && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onEdit(prompt)}
                  className="flex items-center space-x-1"
                >
                  <Edit className="h-4 w-4" />
                  <span>Edit</span>
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {onDuplicate && (
                    <DropdownMenuItem onClick={() => onDuplicate(prompt)}>
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicate Prompt
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleExport}>
                    <Download className="h-4 w-4 mr-2" />
                    Export JSON
                  </DropdownMenuItem>
                  {onDelete && !prompt.is_active && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => onDelete(prompt.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Prompt
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
        <CardDescription className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-1">
            <Calendar className="h-3 w-3" />
            <span>Created {new Date(prompt.created_at).toLocaleDateString()}</span>
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
