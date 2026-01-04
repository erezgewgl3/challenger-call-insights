
import { useState, useMemo } from 'react'
import { useActivePrompt, usePrompts, useActivatePromptVersion, useDeletePrompt, useCreatePrompt } from '@/hooks/usePrompts'
import { useDefaultAiProvider } from '@/hooks/useSystemSettings'
import { toast } from 'sonner'
import { Prompt, PromptTestingData } from '@/types/prompt'
import { supabase } from '@/lib/supabase'

interface ApiKeyStatus {
  openai: boolean
  claude: boolean
}

export function usePromptManagement() {
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [testingPrompt, setTestingPrompt] = useState<PromptTestingData | null>(null)
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
    setApiKeyStatus({ openai: false, claude: false })
    try {
      // Use real ai-diagnostics endpoint
      const { data, error } = await supabase.functions.invoke('ai-diagnostics')
      
      if (error) {
        console.warn('AI diagnostics failed:', error)
        setApiKeyStatus({ openai: true, claude: true }) // Assume available if can't check
        return
      }
      
      if (data) {
        setApiKeyStatus({
          openai: data.openai?.hasKey && data.openai?.ping?.ok,
          claude: data.claude?.hasKey && data.claude?.ping?.ok
        })
        console.log('API key validation result:', data)
      }
    } catch (error) {
      console.warn('Could not validate API keys:', error)
      setApiKeyStatus({ openai: true, claude: true })
    } finally {
      setIsValidatingKeys(false)
    }
  }

  const handleEditPrompt = (prompt: Prompt) => {
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

  return {
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
    deletePrompt,
    createPrompt,

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
  }
}
