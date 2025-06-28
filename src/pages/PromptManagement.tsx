import React, { useState, useMemo } from 'react'
import { useActivePrompt, usePrompts, useActivatePromptVersion, useDeletePrompt, useCreatePrompt } from '@/hooks/usePrompts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, MessageSquare, History, Settings, Zap, Play } from 'lucide-react'
import { SimplePromptEditor } from '@/components/prompts/SimplePromptEditor'
import { PromptCard } from '@/components/prompts/PromptCard'
import { PromptTester } from '@/components/prompts/PromptTester'
import { AiProviderSelector } from '@/components/prompts/AiProviderSelector'
import { SearchFilterControls } from '@/components/prompts/SearchFilterControls'
import { EmptySearchState } from '@/components/prompts/EmptySearchState'
import { BulkOperationsToolbar } from '@/components/prompts/BulkOperationsToolbar'
import { useDefaultAiProvider } from '@/hooks/useSystemSettings'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { toast } from 'sonner'

interface ApiKeyStatus {
  openai: boolean
  claude: boolean
}

export default function PromptManagement() {
  const [selectedPrompt, setSelectedPrompt] = useState<any>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [testingPrompt, setTestingPrompt] = useState<any>(null)
  const [apiKeyStatus, setApiKeyStatus] = useState<ApiKeyStatus>({ openai: false, claude: false })
  const [isValidatingKeys, setIsValidatingKeys] = useState(false)

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')

  // Bulk operations state
  const [selectedPrompts, setSelectedPrompts] = useState<Set<string>>(new Set())
  const [isBulkOperationLoading, setIsBulkOperationLoading] = useState(false)

  const { data: activePrompt, isLoading } = useActivePrompt()
  const { data: allPrompts } = usePrompts()
  const { data: defaultAiProvider } = useDefaultAiProvider()
  const activateVersion = useActivatePromptVersion()
  const deletePrompt = useDeletePrompt()
  const createPrompt = useCreatePrompt()

  React.useEffect(() => {
    validateApiKeys()
  }, [])

  // Filter and sort logic
  const filteredPrompts = useMemo(() => {
    if (!allPrompts) return []

    let filtered = [...allPrompts]

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(prompt => 
        (prompt.prompt_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        prompt.prompt_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (prompt.change_description?.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Apply status filter
    if (filterStatus === 'active') {
      filtered = filtered.filter(prompt => prompt.is_active)
    } else if (filterStatus === 'inactive') {
      filtered = filtered.filter(prompt => !prompt.is_active)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue

      switch (sortBy) {
        case 'version_number':
          aValue = a.version_number
          bValue = b.version_number
          break
        case 'prompt_name':
          aValue = (a.prompt_name || 'Untitled').toLowerCase()
          bValue = (b.prompt_name || 'Untitled').toLowerCase()
          break
        case 'created_at':
        default:
          aValue = new Date(a.created_at).getTime()
          bValue = new Date(b.created_at).getTime()
          break
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  }, [allPrompts, searchTerm, filterStatus, sortBy, sortOrder])

  const inactivePrompts = filteredPrompts.filter(p => !p.is_active)
  const hasActiveFilters = searchTerm !== '' || filterStatus !== 'all' || sortBy !== 'created_at' || sortOrder !== 'desc'

  const handleClearFilters = () => {
    setSearchTerm('')
    setFilterStatus('all')
    setSortBy('created_at')
    setSortOrder('desc')
  }

  const validateApiKeys = async () => {
    setIsValidatingKeys(true)
    try {
      const response = await fetch('/api/validate-api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (response.ok) {
        const data = await response.json()
        setApiKeyStatus(data)
      } else {
        setApiKeyStatus({ openai: true, claude: true })
      }
    } catch (error) {
      console.warn('Could not validate API keys:', error)
      setApiKeyStatus({ openai: true, claude: true })
    } finally {
      setIsValidatingKeys(false)
    }
  }

  const handleEditPrompt = (prompt: any) => {
    setSelectedPrompt(prompt)
  }

  const handleDeletePrompt = async (promptId: string) => {
    if (window.confirm('Are you sure you want to delete this prompt? This action cannot be undone.')) {
      try {
        await deletePrompt.mutateAsync(promptId)
      } catch (error) {
        console.error('Failed to delete prompt:', error)
      }
    }
  }

  const handleActivatePrompt = async (promptId: string) => {
    try {
      await activateVersion.mutateAsync({ promptId })
    } catch (error) {
      console.error('Failed to activate prompt:', error)
    }
  }

  const handleTestPrompt = (prompt: any) => {
    setTestingPrompt(prompt)
  }

  const handleDuplicatePrompt = async (prompt: any) => {
    try {
      await createPrompt.mutateAsync({
        prompt_text: prompt.prompt_text,
        prompt_name: `${prompt.prompt_name || 'Untitled'} (Copy)`,
        change_description: `Duplicated from v${prompt.version_number}`
      })
      toast.success('Prompt duplicated successfully')
    } catch (error) {
      console.error('Failed to duplicate prompt:', error)
      toast.error('Failed to duplicate prompt')
    }
  }

  // Bulk operations handlers
  const handleSelectPrompt = (promptId: string, checked: boolean) => {
    const newSelection = new Set(selectedPrompts)
    if (checked) {
      newSelection.add(promptId)
    } else {
      newSelection.delete(promptId)
    }
    setSelectedPrompts(newSelection)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allInactiveIds = new Set(inactivePrompts.map(p => p.id))
      setSelectedPrompts(allInactiveIds)
    } else {
      setSelectedPrompts(new Set())
    }
  }

  const handleBulkDelete = async () => {
    if (selectedPrompts.size === 0) return
    
    const confirmMessage = `Are you sure you want to delete ${selectedPrompts.size} prompt${selectedPrompts.size > 1 ? 's' : ''}? This action cannot be undone.`
    if (!window.confirm(confirmMessage)) return

    setIsBulkOperationLoading(true)
    try {
      const deletePromises = Array.from(selectedPrompts).map(id => 
        deletePrompt.mutateAsync(id)
      )
      await Promise.all(deletePromises)
      setSelectedPrompts(new Set())
      toast.success(`${selectedPrompts.size} prompt${selectedPrompts.size > 1 ? 's' : ''} deleted successfully`)
    } catch (error) {
      console.error('Failed to delete prompts:', error)
      toast.error('Failed to delete some prompts')
    } finally {
      setIsBulkOperationLoading(false)
    }
  }

  const handleBulkExport = () => {
    if (selectedPrompts.size === 0) return

    const selectedPromptData = inactivePrompts
      .filter(p => selectedPrompts.has(p.id))
      .map(prompt => ({
        prompt_name: prompt.prompt_name,
        prompt_text: prompt.prompt_text,
        version_number: prompt.version_number,
        change_description: prompt.change_description,
        created_at: prompt.created_at
      }))

    const blob = new Blob([JSON.stringify(selectedPromptData, null, 2)], { 
      type: 'application/json' 
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `prompts-export-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success(`${selectedPrompts.size} prompt${selectedPrompts.size > 1 ? 's' : ''} exported successfully`)
  }

  const handleBulkDuplicate = async () => {
    if (selectedPrompts.size === 0) return

    setIsBulkOperationLoading(true)
    try {
      const duplicatePromises = inactivePrompts
        .filter(p => selectedPrompts.has(p.id))
        .map(prompt => createPrompt.mutateAsync({
          prompt_text: prompt.prompt_text,
          prompt_name: `${prompt.prompt_name || 'Untitled'} (Copy)`,
          change_description: `Duplicated from v${prompt.version_number}`
        }))
      
      await Promise.all(duplicatePromises)
      setSelectedPrompts(new Set())
      toast.success(`${selectedPrompts.size} prompt${selectedPrompts.size > 1 ? 's' : ''} duplicated successfully`)
    } catch (error) {
      console.error('Failed to duplicate prompts:', error)
      toast.error('Failed to duplicate some prompts')
    } finally {
      setIsBulkOperationLoading(false)
    }
  }

  const handleClearSelection = () => {
    setSelectedPrompts(new Set())
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="p-8 bg-white min-h-full">
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">AI Prompt Management</h1>
              <p className="text-lg text-slate-600">
                Manage your AI coaching prompts with simplified flat versioning
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <AiProviderSelector 
                apiKeyStatus={apiKeyStatus}
                isValidating={isValidatingKeys}
              />
              <Button 
                onClick={() => setIsCreating(true)}
                className="bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg transition-all duration-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Prompt
              </Button>
            </div>
          </div>

          {/* Metrics Cards - MOVED TO POSITION 2 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-all duration-200 bg-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-700">Active Prompt</CardTitle>
                <MessageSquare className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {activePrompt ? (
                    <>
                      <div className="text-sm font-semibold truncate text-slate-900">
                        {activePrompt.prompt_name || 'Untitled'}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="default" className="text-xs bg-blue-600">v{activePrompt.version_number}</Badge>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                          System-Wide
                        </Badge>
                      </div>
                    </>
                  ) : (
                    <div className="text-sm text-slate-500">No active prompt</div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-all duration-200 bg-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-700">Total Prompts</CardTitle>
                <History className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">{allPrompts?.length || 0}</div>
                <p className="text-xs text-slate-500 mt-1">
                  All versions available
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-all duration-200 bg-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-700">AI Provider</CardTitle>
                <Zap className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <div className="text-2xl font-bold text-slate-900">
                    {defaultAiProvider?.toUpperCase() || 'Loading...'}
                  </div>
                  <Badge variant="outline" className="text-xs">Active</Badge>
                </div>
                <p className="text-xs text-slate-500 mt-1">Global default</p>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filter Controls - MOVED TO POSITION 3 */}
          <SearchFilterControls
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            filterStatus={filterStatus}
            onFilterStatusChange={setFilterStatus}
            sortBy={sortBy}
            onSortByChange={setSortBy}
            sortOrder={sortOrder}
            onSortOrderChange={setSortOrder}
            totalResults={filteredPrompts.length}
            onClearFilters={handleClearFilters}
            hasActiveFilters={hasActiveFilters}
          />

          {/* Active prompt section */}
          {activePrompt ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <h2 className="text-2xl font-bold text-slate-900">Current Active Prompt</h2>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 px-3 py-1">
                    Powering All AI Analysis
                  </Badge>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
                <PromptCard 
                  prompt={activePrompt}
                  onEdit={handleEditPrompt}
                  onDelete={handleDeletePrompt}
                  onTest={handleTestPrompt}
                  onDuplicate={handleDuplicatePrompt}
                />
              </div>
            </div>
          ) : (
            <Card className="shadow-md hover:shadow-lg transition-all duration-200 bg-white">
              <CardContent className="p-12 text-center">
                <div className="p-4 bg-slate-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                  <MessageSquare className="h-10 w-10 text-slate-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">No active prompt</h3>
                <p className="text-slate-600 mb-6 leading-relaxed">Create your first AI coaching prompt to get started with intelligent sales analysis.</p>
                <Button onClick={() => setIsCreating(true)} className="bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg transition-all duration-200">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Prompt
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Prompt versions section */}
          {inactivePrompts.length > 0 ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900">All Prompt Versions</h2>
                {inactivePrompts.length > 1 && (
                  <div className="flex items-center space-x-3 bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm">
                    <Checkbox
                      checked={selectedPrompts.size === inactivePrompts.length && inactivePrompts.length > 0}
                      onCheckedChange={handleSelectAll}
                      className="border-2 border-blue-500 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                    <span className="text-sm font-medium text-slate-700">
                      Select all ({inactivePrompts.length} prompts)
                    </span>
                  </div>
                )}
              </div>
              
              <BulkOperationsToolbar
                selectedCount={selectedPrompts.size}
                onBulkDelete={handleBulkDelete}
                onBulkExport={handleBulkExport}
                onBulkDuplicate={handleBulkDuplicate}
                onClearSelection={handleClearSelection}
                isLoading={isBulkOperationLoading}
              />
              
              <div className="space-y-4">
                {inactivePrompts.map((prompt) => (
                  <div key={prompt.id} className={`relative transition-all duration-200 ${
                    selectedPrompts.has(prompt.id) 
                      ? 'ring-2 ring-blue-500 ring-offset-2 rounded-lg' 
                      : ''
                  }`}>
                    <div className="flex items-start space-x-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 p-2">
                      <div className="flex-shrink-0 pt-4 pl-2">
                        <Checkbox
                          checked={selectedPrompts.has(prompt.id)}
                          onCheckedChange={(checked) => handleSelectPrompt(prompt.id, checked as boolean)}
                          className="border-2 border-blue-500 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 shadow-sm"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <PromptCard 
                          prompt={prompt}
                          onEdit={handleEditPrompt}
                          onDelete={handleDeletePrompt}
                          onTest={handleTestPrompt}
                          onDuplicate={handleDuplicatePrompt}
                        />
                      </div>
                      <div className="flex-shrink-0 pt-4 pr-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleActivatePrompt(prompt.id)}
                          disabled={activateVersion.isPending}
                          className="bg-white hover:bg-green-50 border-green-200 text-green-700 hover:text-green-800 shadow-sm hover:shadow-md transition-all duration-200"
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Activate
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : filteredPrompts.length === 0 && hasActiveFilters ? (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-900">Search Results</h2>
              <EmptySearchState
                searchTerm={searchTerm}
                onClearFilters={handleClearFilters}
                hasActiveFilters={hasActiveFilters}
              />
            </div>
          ) : null}

          {/* Modals */}
          {(isCreating || selectedPrompt) && (
            <SimplePromptEditor 
              prompt={selectedPrompt}
              isOpen={isCreating || !!selectedPrompt}
              onClose={() => {
                setIsCreating(false)
                setSelectedPrompt(null)
              }}
            />
          )}

          {testingPrompt && (
            <PromptTester
              prompt={testingPrompt}
              isOpen={!!testingPrompt}
              onClose={() => setTestingPrompt(null)}
            />
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
