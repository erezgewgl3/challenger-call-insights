import { useState } from 'react'
import { usePrompts, useActivePrompts } from '@/hooks/usePrompts'
import { useDefaultAiProvider, useSetDefaultAiProvider } from '@/hooks/useSystemSettings'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, MessageSquare, History, Settings, Zap, AlertCircle } from 'lucide-react'
import { PromptEditor } from '@/components/prompts/PromptEditor'
import { PromptVersionHistory } from '@/components/prompts/PromptVersionHistory'
import { PromptSettings } from '@/components/prompts/PromptSettings'
import { toast } from 'sonner'

export default function PromptManagement() {
  const [activeTab, setActiveTab] = useState('active')
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const { data: allPrompts, isLoading } = usePrompts()
  const { data: activePrompts } = useActivePrompts()
  const { data: defaultAiProvider } = useDefaultAiProvider()
  const setAiProvider = useSetDefaultAiProvider()

  const handleProviderChange = async (newProvider: 'openai' | 'claude') => {
    if (newProvider === defaultAiProvider) return
    
    try {
      await setAiProvider.mutateAsync(newProvider)
      toast.success(`AI provider switched to ${newProvider.toUpperCase()}`)
    } catch (error) {
      toast.error('Failed to switch AI provider')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">AI Prompt Management</h1>
          <p className="text-slate-600 mt-1">
            Manage prompt content and system configuration
          </p>
        </div>
        <Button 
          onClick={() => setIsCreating(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create New Prompt
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Prompts</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activePrompts?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Versions</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allPrompts?.length || 0}</div>
            <p className="text-xs text-muted-foreground">All versions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Default Prompt</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {allPrompts?.find(p => p.is_default) ? '1' : '0'}
            </div>
            <p className="text-xs text-muted-foreground">Global default set</p>
          </CardContent>
        </Card>

        <Card className="border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Provider</CardTitle>
            <Zap className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="text-2xl font-bold">
                {defaultAiProvider?.toUpperCase() || 'Loading...'}
              </div>
              <Badge variant="outline" className="text-xs">Global</Badge>
            </div>
            
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Quick Switch:</p>
              <Select 
                value={defaultAiProvider || ''} 
                onValueChange={handleProviderChange}
                disabled={setAiProvider.isPending}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai">
                    <div className="flex items-center space-x-2">
                      <Zap className="h-3 w-3" />
                      <span>OpenAI GPT-4</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="claude">
                    <div className="flex items-center space-x-2">
                      <Zap className="h-3 w-3" />
                      <span>Anthropic Claude</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              
              {setAiProvider.isPending && (
                <div className="flex items-center space-x-1 text-xs text-blue-600">
                  <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-600"></div>
                  <span>Switching...</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-1 text-xs text-amber-600">
              <AlertCircle className="h-3 w-3" />
              <span>Affects all analyses</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">Active Prompts</TabsTrigger>
          <TabsTrigger value="versions">Version History</TabsTrigger>
          <TabsTrigger value="settings">System Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <PromptActiveList 
            prompts={activePrompts || []}
            onEdit={setSelectedPrompt}
          />
        </TabsContent>

        <TabsContent value="versions" className="space-y-4">
          <PromptVersionHistory prompts={allPrompts || []} />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <PromptSettings />
        </TabsContent>
      </Tabs>

      {(isCreating || selectedPrompt) && (
        <PromptEditor 
          promptId={selectedPrompt}
          isOpen={isCreating || !!selectedPrompt}
          onClose={() => {
            setIsCreating(false)
            setSelectedPrompt(null)
          }}
        />
      )}
    </div>
  )
}

function PromptActiveList({ prompts, onEdit }: { 
  prompts: any[], 
  onEdit: (id: string) => void 
}) {
  return (
    <div className="grid gap-4">
      {prompts.map((prompt) => (
        <Card key={prompt.id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CardTitle className="text-lg">
                  Prompt v{prompt.version_number}
                </CardTitle>
                <Badge variant="outline">Active</Badge>
                {prompt.is_default && (
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                    Default
                  </Badge>
                )}
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onEdit(prompt.id)}
              >
                Edit
              </Button>
            </div>
            <CardDescription>
              {prompt.change_description || 'No description'}
              {' • '}
              Last updated: {new Date(prompt.updated_at).toLocaleDateString()}
              {prompt.activated_at && (
                <> • Activated: {new Date(prompt.activated_at).toLocaleDateString()}</>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 line-clamp-3">
              {prompt.prompt_text.substring(0, 200)}...
            </p>
          </CardContent>
        </Card>
      ))}
      
      {prompts.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <MessageSquare className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No active prompts</h3>
            <p className="text-slate-600">Create your first AI coaching prompt to get started.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
