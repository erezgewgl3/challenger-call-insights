
import { useState } from 'react'
import { useActivatePromptVersion, useDeletePrompt } from '@/hooks/usePrompts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Play, Trash2, Eye, Calendar } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

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

interface PromptVersionHistoryProps {
  prompts: Prompt[]
}

export function PromptVersionHistory({ prompts }: PromptVersionHistoryProps) {
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null)
  const activateVersion = useActivatePromptVersion()
  const deletePrompt = useDeletePrompt()

  const promptGroups = prompts.reduce((acc, prompt) => {
    const rootId = prompt.parent_prompt_id || prompt.id
    if (!acc[rootId]) {
      acc[rootId] = []
    }
    acc[rootId].push(prompt)
    return acc
  }, {} as Record<string, Prompt[]>)

  const handleActivateVersion = async (promptId: string, parentPromptId?: string) => {
    try {
      await activateVersion.mutateAsync({ promptId, parentPromptId })
    } catch (error) {
      console.error('Failed to activate version:', error)
    }
  }

  const handleDeletePrompt = async (promptId: string) => {
    try {
      await deletePrompt.mutateAsync(promptId)
    } catch (error) {
      console.error('Failed to delete prompt:', error)
    }
  }

  return (
    <>
      <div className="space-y-6">
        {Object.entries(promptGroups).map(([rootId, versions]) => {
          const rootPrompt = versions.find(v => !v.parent_prompt_id) || versions[0]
          const sortedVersions = versions.sort((a, b) => b.version_number - a.version_number)

          return (
            <Card key={rootId}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <span>
                        {rootPrompt.is_default ? 'Default Prompt' : 'Custom Prompt'}
                      </span>
                      <Badge variant="default" className="text-sm">
                        System Prompt
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      {versions.length} version{versions.length !== 1 ? 's' : ''} • 
                      Created {new Date(rootPrompt.created_at).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete All
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Prompt</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete this prompt and all its versions. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleDeletePrompt(rootId)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sortedVersions.map((version) => (
                    <div 
                      key={version.id} 
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        version.is_active ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <Badge variant={version.is_active ? 'default' : 'outline'}>
                            v{version.version_number}
                          </Badge>
                          {version.is_active && (
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              Active
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {version.change_description || 'No description'}
                          </span>
                          <div className="flex items-center space-x-2 text-xs text-slate-500">
                            <Calendar className="h-3 w-3" />
                            <span>Created {new Date(version.created_at).toLocaleDateString()}</span>
                            {version.activated_at && (
                              <>
                                <span>•</span>
                                <span>Activated {new Date(version.activated_at).toLocaleDateString()}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedPrompt(version)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        {!version.is_active && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleActivateVersion(version.id, version.parent_prompt_id)}
                            disabled={activateVersion.isPending}
                          >
                            <Play className="h-4 w-4 mr-1" />
                            Activate
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}

        {Object.keys(promptGroups).length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-slate-400 mb-4">
                <Calendar className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">No prompt history</h3>
              <p className="text-slate-600">Create some prompts to see their version history here.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {selectedPrompt && (
        <Dialog open={!!selectedPrompt} onOpenChange={() => setSelectedPrompt(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <span>Prompt Version {selectedPrompt.version_number}</span>
                <Badge variant="default" className="text-sm">
                  System Prompt
                </Badge>
                {selectedPrompt.is_active && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Active
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription>
                {selectedPrompt.change_description || 'No description provided'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="text-xs text-slate-500 flex items-center space-x-4">
                <span>Created: {new Date(selectedPrompt.created_at).toLocaleDateString()}</span>
                {selectedPrompt.activated_at && (
                  <span>Activated: {new Date(selectedPrompt.activated_at).toLocaleDateString()}</span>
                )}
              </div>
              
              <div className="bg-slate-50 p-4 rounded-lg">
                <pre className="text-sm whitespace-pre-wrap font-mono">
                  {selectedPrompt.prompt_text}
                </pre>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
