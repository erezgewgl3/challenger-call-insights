import React, { useState } from 'react'
import { AlertTriangle, RefreshCw, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

interface AnalysisQualityWarningProps {
  qualityScore: number | null
  wasRepaired: boolean | null
  missingSections: string[] | null
  transcriptId: string
  onRetrySuccess?: () => void
}

export function AnalysisQualityWarning({
  qualityScore,
  wasRepaired,
  missingSections,
  transcriptId,
  onRetrySuccess
}: AnalysisQualityWarningProps) {
  const [isRetrying, setIsRetrying] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  // Only show warning if quality score is low (< 70) OR was repaired with issues
  const shouldShowWarning = (qualityScore !== null && qualityScore < 70) || 
                           (wasRepaired && missingSections && missingSections.length > 0)

  if (!shouldShowWarning) {
    return null
  }

  const handleRetry = async () => {
    try {
      setIsRetrying(true)
      toast.info('Retrying analysis for better results...')
      
      // Fetch transcript data
      const { data: transcript, error: fetchError } = await supabase
        .from('transcripts')
        .select('raw_text, duration_minutes, account_id, user_id')
        .eq('id', transcriptId)
        .single()

      if (fetchError || !transcript) {
        throw new Error('Could not fetch transcript data')
      }

      // Update status to processing
      await supabase
        .from('transcripts')
        .update({ status: 'processing', error_message: null })
        .eq('id', transcriptId)

      // Call analyze function
      const { data, error } = await supabase.functions.invoke('analyze-transcript', {
        body: {
          transcriptId,
          userId: transcript.user_id,
          transcriptText: transcript.raw_text,
          durationMinutes: transcript.duration_minutes,
          accountId: transcript.account_id
        }
      })

      if (error) {
        throw error
      }

      toast.success('Analysis completed! Refreshing results...')
      
      // Callback to refresh the view
      if (onRetrySuccess) {
        setTimeout(onRetrySuccess, 1500)
      }
      
    } catch (error) {
      console.error('Retry analysis error:', error)
      toast.error('Failed to retry analysis. Please try again.')
    } finally {
      setIsRetrying(false)
    }
  }

  const getSeverityInfo = () => {
    if (qualityScore === null) {
      return { color: 'yellow', label: 'Incomplete', icon: AlertTriangle }
    }
    if (qualityScore < 50) {
      return { color: 'red', label: 'Incomplete Analysis', icon: AlertTriangle }
    }
    return { color: 'yellow', label: 'Partial Analysis', icon: AlertTriangle }
  }

  const { color, label } = getSeverityInfo()

  return (
    <Alert className="mb-4 border-amber-200 bg-amber-50">
      <AlertTriangle className="h-4 w-4 text-amber-600" />
      <AlertTitle className="text-amber-900 flex items-center justify-between">
        <span className="flex items-center gap-2">
          {label}
          {qualityScore !== null && (
            <Badge variant="outline" className="text-amber-700 border-amber-300">
              {qualityScore}% complete
            </Badge>
          )}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDetails(!showDetails)}
          className="h-6 px-2"
        >
          {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </AlertTitle>
      <AlertDescription className="text-amber-800">
        <p className="mb-3">
          Some sections of this analysis may be incomplete due to AI response truncation. 
          The insights shown are still accurate, but you might get more comprehensive results by retrying.
        </p>
        
        {showDetails && missingSections && missingSections.length > 0 && (
          <div className="mb-3 p-2 bg-white/50 rounded border border-amber-200">
            <p className="text-sm font-medium mb-1">Sections needing attention:</p>
            <ul className="text-sm list-disc list-inside">
              {missingSections.map((section, i) => (
                <li key={i}>{section.replace(/\./g, ' → ')}</li>
              ))}
            </ul>
          </div>
        )}
        
        <Button
          onClick={handleRetry}
          disabled={isRetrying}
          size="sm"
          variant="default"
          className="bg-amber-600 hover:bg-amber-700"
        >
          {isRetrying ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Retrying Analysis...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry for Better Results
            </>
          )}
        </Button>
      </AlertDescription>
    </Alert>
  )
}
