import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle, RefreshCw, Zap, Clock, AlertTriangle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface ProviderResult {
  hasKey: boolean
  ping?: {
    ok: boolean
    status?: number
    error?: string
    model?: string
    responseTime?: number
  }
}

interface DiagnosticsResult {
  claude: ProviderResult
  openai: ProviderResult
  timestamp: string
}

export function AiDiagnosticsPanel() {
  const [diagnostics, setDiagnostics] = useState<DiagnosticsResult | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [lastRun, setLastRun] = useState<Date | null>(null)

  const runDiagnostics = async () => {
    setIsRunning(true)
    try {
      const { data, error } = await supabase.functions.invoke('ai-diagnostics')
      
      if (error) {
        toast.error('Failed to run diagnostics: ' + error.message)
        return
      }
      
      setDiagnostics(data)
      setLastRun(new Date())
      
      const claudeOk = data.claude?.hasKey && data.claude?.ping?.ok
      const openaiOk = data.openai?.hasKey && data.openai?.ping?.ok
      
      if (claudeOk && openaiOk) {
        toast.success('Both AI providers are connected and working')
      } else if (claudeOk || openaiOk) {
        toast.warning('One AI provider is not configured or responding')
      } else {
        toast.error('No AI providers are responding - check your API keys')
      }
    } catch (error) {
      console.error('Diagnostics error:', error)
      toast.error('Failed to run diagnostics')
    } finally {
      setIsRunning(false)
    }
  }

  const renderProviderCard = (name: string, provider: ProviderResult | undefined) => {
    const hasKey = provider?.hasKey ?? false
    const pingOk = provider?.ping?.ok ?? false
    const isConnected = hasKey && pingOk
    const responseTime = provider?.ping?.responseTime
    const model = provider?.ping?.model
    const error = provider?.ping?.error

    return (
      <div className={`flex-1 p-4 rounded-lg border-2 transition-all ${
        isConnected 
          ? 'border-green-200 bg-green-50' 
          : hasKey 
            ? 'border-yellow-200 bg-yellow-50'
            : 'border-destructive/30 bg-destructive/5'
      }`}>
        <div className="flex items-center gap-2 mb-2">
          {isConnected ? (
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          ) : hasKey ? (
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
          ) : (
            <XCircle className="h-5 w-5 text-destructive" />
          )}
          <span className="font-semibold text-foreground">{name}</span>
          <Badge 
            variant={isConnected ? 'default' : 'destructive'} 
            className={isConnected ? 'bg-green-600' : ''}
          >
            {isConnected ? 'Connected' : hasKey ? 'Error' : 'Not Configured'}
          </Badge>
        </div>
        
        {isConnected && (
          <div className="space-y-1 text-sm text-muted-foreground">
            {responseTime && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{responseTime}ms response</span>
              </div>
            )}
            {model && (
              <div className="flex items-center gap-1">
                <Zap className="h-3 w-3" />
                <span className="font-mono text-xs">{model}</span>
              </div>
            )}
          </div>
        )}
        
        {!isConnected && hasKey && error && (
          <p className="text-sm text-destructive mt-1">{error}</p>
        )}
        
        {!hasKey && (
          <p className="text-sm text-muted-foreground mt-1">
            Add {name === 'Claude' ? 'ANTHROPIC_API_KEY' : 'OPENAI_API_KEY'} in Supabase secrets
          </p>
        )}
      </div>
    )
  }

  return (
    <Card className="shadow-md bg-card">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">AI Provider Status</h3>
          </div>
          <div className="flex items-center gap-3">
            {lastRun && (
              <span className="text-xs text-muted-foreground">
                Last tested: {lastRun.toLocaleTimeString()}
              </span>
            )}
            <Button 
              size="sm" 
              variant="outline" 
              onClick={runDiagnostics}
              disabled={isRunning}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${isRunning ? 'animate-spin' : ''}`} />
              {isRunning ? 'Testing...' : 'Test Connections'}
            </Button>
          </div>
        </div>
        
        <div className="flex gap-4">
          {renderProviderCard('Claude', diagnostics?.claude)}
          {renderProviderCard('OpenAI', diagnostics?.openai)}
        </div>
        
        {!diagnostics && !isRunning && (
          <p className="text-center text-sm text-muted-foreground mt-4">
            Click "Test Connections" to verify AI provider configuration
          </p>
        )}
      </CardContent>
    </Card>
  )
}
