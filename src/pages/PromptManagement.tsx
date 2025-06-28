
import { useState } from 'react'
import { usePrompts, useActivePrompts } from '@/hooks/usePrompts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, MessageSquare, History, Settings } from 'lucide-react'
import { PromptEditor } from '@/components/prompts/PromptEditor'
import { PromptVersionHistory } from '@/components/prompts/PromptVersionHistory'
import { PromptSettings } from '@/components/prompts/PromptSettings'

export default function PromptManagement() {
  const [activeTab, setActiveTab] = useState('active')
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const { data: allPrompts, isLoading } = usePrompts()
  const { data: activePrompts } = useActivePrompts()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">AI Prompt Management</h1>
          <p className="text-slate-600 mt-1">
            Manage and version control your AI coaching prompts
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

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Prompts</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activePrompts?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Currently in use</p>
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
            <CardTitle className="text-sm font-medium">AI Providers</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">OpenAI & Claude</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs Interface */}
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

      {/* Prompt Editor Modal/Drawer */}
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

// Helper component for active prompts list
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
                  {prompt.is_default ? 'Default Prompt' : 'Custom Prompt'}
                </CardTitle>
                <Badge variant={prompt.ai_provider === 'openai' ? 'default' : 'secondary'}>
                  {prompt.ai_provider.toUpperCase()}
                </Badge>
                <Badge variant="outline">v{prompt.version_number}</Badge>
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
              Last updated: {new Date(prompt.updated_at).toLocaleDateString()}
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
