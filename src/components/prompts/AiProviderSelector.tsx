
import { useState } from 'react'
import { useDefaultAiProvider, useSetDefaultAiProvider } from '@/hooks/useSystemSettings'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Zap, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'sonner'

interface ApiKeyStatus {
  openai: boolean
  claude: boolean
}

interface AiProviderSelectorProps {
  apiKeyStatus: ApiKeyStatus
  isValidating: boolean
}

export function AiProviderSelector({ apiKeyStatus, isValidating }: AiProviderSelectorProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [pendingProvider, setPendingProvider] = useState<'openai' | 'claude' | null>(null)

  const { data: defaultAiProvider } = useDefaultAiProvider()
  const setAiProvider = useSetDefaultAiProvider()

  const handleProviderChange = (newProvider: 'openai' | 'claude') => {
    if (newProvider === defaultAiProvider) return
    
    const hasValidKey = apiKeyStatus[newProvider]
    
    if (!hasValidKey) {
      toast.error(`${newProvider.toUpperCase()} API key not configured. Please add it in System Settings.`)
      return
    }

    setPendingProvider(newProvider)
    setShowConfirmDialog(true)
  }

  const confirmProviderChange = async () => {
    if (!pendingProvider) return

    try {
      await setAiProvider.mutateAsync(pendingProvider)
      toast.success(`AI provider switched to ${pendingProvider.toUpperCase()}`)
      setShowConfirmDialog(false)
      setPendingProvider(null)
    } catch (error) {
      console.error('Failed to switch AI provider:', error)
      toast.error(`Failed to switch to ${pendingProvider.toUpperCase()}`)
    }
  }

  const cancelProviderChange = () => {
    setShowConfirmDialog(false)
    setPendingProvider(null)
  }

  const getProviderStatusIcon = (provider: 'openai' | 'claude') => {
    if (isValidating) {
      return <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-400"></div>
    }
    return apiKeyStatus[provider] ? 
      <CheckCircle className="h-3 w-3 text-green-600" /> : 
      <XCircle className="h-3 w-3 text-red-600" />
  }

  return (
    <>
      <div className="flex items-center space-x-2">
        <Badge variant="outline" className="flex items-center space-x-1">
          <Zap className="h-3 w-3" />
          <span>{defaultAiProvider?.toUpperCase() || 'Loading...'}</span>
        </Badge>
        
        <Select 
          value={defaultAiProvider || ''} 
          onValueChange={handleProviderChange}
          disabled={setAiProvider.isPending || isValidating}
        >
          <SelectTrigger className="w-32 h-8 text-xs">
            <SelectValue placeholder="Provider" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="openai" disabled={!apiKeyStatus.openai}>
              <div className="flex items-center justify-between w-full">
                <span>OpenAI</span>
                {getProviderStatusIcon('openai')}
              </div>
            </SelectItem>
            <SelectItem value="claude" disabled={!apiKeyStatus.claude}>
              <div className="flex items-center justify-between w-full">
                <span>Claude</span>
                {getProviderStatusIcon('claude')}
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <span>Confirm AI Provider Change</span>
            </DialogTitle>
            <DialogDescription className="space-y-2">
              <p>
                You're about to switch from <strong>{defaultAiProvider?.toUpperCase()}</strong> to{' '}
                <strong>{pendingProvider?.toUpperCase()}</strong>.
              </p>
              <p className="text-amber-600 font-medium">
                ⚠️ This will affect all future AI analyses across the entire system.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={cancelProviderChange}>
              Cancel
            </Button>
            <Button onClick={confirmProviderChange} disabled={setAiProvider.isPending}>
              {setAiProvider.isPending ? 'Switching...' : `Switch to ${pendingProvider?.toUpperCase()}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
