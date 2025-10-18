
import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, MessageSquare, Play } from 'lucide-react'
import { SimplePromptEditor } from '@/components/prompts/SimplePromptEditor'
import { PromptCard } from '@/components/prompts/PromptCard'
import { PromptTester } from '@/components/prompts/PromptTester'
import { SearchFilterControls } from '@/components/prompts/SearchFilterControls'
import { EmptySearchState } from '@/components/prompts/EmptySearchState'
import { BulkOperationsToolbar } from '@/components/prompts/BulkOperationsToolbar'
import { PromptMetricsCards } from '@/components/prompts/PromptMetricsCards'
import { PromptControlsSection } from '@/components/prompts/PromptControlsSection'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { usePromptManagement } from '@/hooks/usePromptManagement'


export default function PromptManagement() {
  const {
    // State
    selectedPrompt,
    setSelectedPrompt,
    isCreating,
    setIsCreating,
    testingPrompt,
    setTestingPrompt,
    apiKeyStatus,
    isValidatingKeys,
    searchTerm,
    setSearchTerm,
    filterStatus,
    setFilterStatus,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    selectedPrompts,
    isBulkOperationLoading,

    // Data
    activePrompt,
    allPrompts,
    defaultAiProvider,
    isLoading,
    filteredPrompts,
    inactivePrompts,
    hasActiveFilters,

    // Mutations
    activateVersion,

    // Handlers
    handleClearFilters,
    validateApiKeys,
    handleEditPrompt,
    handleDeletePrompt,
    handleActivatePrompt,
    handleTestPrompt,
    handleDuplicatePrompt,
    handleSelectPrompt,
    handleSelectAll,
    handleBulkDelete,
    handleBulkExport,
    handleBulkDuplicate,
    handleClearSelection
  } = usePromptManagement()

  React.useEffect(() => {
    validateApiKeys()
  }, [])

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
          </div>

          {/* Metrics Cards */}
          <PromptMetricsCards 
            activePrompt={activePrompt}
            totalPrompts={allPrompts?.length || 0}
            defaultAiProvider={defaultAiProvider}
          />

          {/* Search and Filter Controls */}
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

          {/* Controls Section */}
          <PromptControlsSection
            apiKeyStatus={apiKeyStatus}
            isValidatingKeys={isValidatingKeys}
            onCreatePrompt={() => setIsCreating(true)}
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
