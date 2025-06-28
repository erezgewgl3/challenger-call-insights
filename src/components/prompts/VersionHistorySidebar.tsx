
import { useState } from 'react'
import { useActivatePromptVersion } from '@/hooks/usePrompts'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Play, Eye, Calendar, AlertTriangle } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'

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

interface VersionHistorySidebarProps {
  versions: Prompt[]
  currentPromptId: string
  onVersionSelect: (version: Prompt) => void
}

export function VersionHistorySidebar({ versions, currentPromptId, onVersionSelect }: VersionHistorySidebarProps) {
  const [selectedVersion, setSelectedVersion] = useState<Prompt | null>(null)
  const activateVersion = useActivatePromptVersion()

  const sortedVersions = versions.sort((a, b) => b.version_number - a.version_number)

  const handleActivateVersion = async (version: Prompt) => {
    try {
      await activateVersion.mutateAsync({ promptId: version.id })
    } catch (error) {
      console.error('Failed to activate version:', error)
    }
  }

  return (
    <div className="w-80 pl-4">
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-sm flex items-center">
            <Calendar className="h-4 w-4 mr-2" />
            Version History
          </CardTitle>
          <CardDescription className="text-xs">
            {versions.length} version{versions.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[400px]">
            <div className="space-y-2 p-4">
              {sortedVersions.map((version) => (
                <div 
                  key={version.id}
                  className={`p-3 rounded-lg border ${
                    version.is_active ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                  } hover:shadow-sm transition-shadow`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Badge variant={version.is_active ? 'default' : 'outline'} className="text-xs">
                        v{version.version_number}
                      </Badge>
                      {version.is_active && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                          Active System-Wide
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-xs font-medium text-slate-900 mb-1">
                    {version.change_description || 'No description'}
                  </p>
                  
                  <p className="text-xs text-slate-500 mb-3">
                    {new Date(version.created_at).toLocaleDateString()}
                  </p>
                  
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-6 px-2"
                      onClick={() => setSelectedVersion(version)}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-6 px-2"
                      onClick={() => onVersionSelect(version)}
                    >
                      Use
                    </Button>
                    
                    {!version.is_active && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-6 px-2"
                        onClick={() => handleActivateVersion(version)}
                        disabled={activateVersion.isPending}
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Activate
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Version Preview Dialog */}
      {selectedVersion && (
        <Dialog open={!!selectedVersion} onOpenChange={() => setSelectedVersion(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <span>Version {selectedVersion.version_number}</span>
                {selectedVersion.is_active && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Active System-Wide
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription>
                {selectedVersion.change_description || 'No description provided'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {selectedVersion.is_active && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    This prompt is currently active system-wide and powers all AI analyses.
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="text-xs text-slate-500">
                Created: {new Date(selectedVersion.created_at).toLocaleDateString()}
                {selectedVersion.activated_at && (
                  <> • Activated: {new Date(selectedVersion.activated_at).toLocaleDateString()}</>
                )}
              </div>
              
              <div className="bg-slate-50 p-4 rounded-lg">
                <pre className="text-sm whitespace-pre-wrap font-mono">
                  {selectedVersion.prompt_text}
                </pre>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
