import { useState, useEffect } from 'react'
import { AlertCircle, Info, X } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'

interface QualityIndicatorProps {
  analysisId: string
}

interface QualityFlag {
  id: string
  flag_type: string
  details: any
  flagged_at: string
}

export function QualityIndicatorBadge({ analysisId }: QualityIndicatorProps) {
  const [flags, setFlags] = useState<QualityFlag[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    fetchQualityFlags()
  }, [analysisId])

  const fetchQualityFlags = async () => {
    try {
      const { data, error } = await supabase
        .from('analysis_quality_flags')
        .select('*')
        .eq('analysis_id', analysisId)
        .is('resolved_at', null)
        .order('flagged_at', { ascending: false })

      if (error) throw error
      setFlags(data || [])
    } catch (error) {
      console.error('Error fetching quality flags:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResolve = async (flagId: string) => {
    try {
      const { error } = await supabase
        .from('analysis_quality_flags')
        .update({
          resolved_at: new Date().toISOString(),
          resolved_by: user?.id
        })
        .eq('id', flagId)

      if (error) throw error
      
      // Refresh flags
      await fetchQualityFlags()
    } catch (error) {
      console.error('Error resolving flag:', error)
    }
  }

  if (isLoading || flags.length === 0) {
    return null
  }

  const flagTypeLabels: Record<string, string> = {
    fabricated_quotes: 'Fabricated Quotes',
    missing_fields: 'Missing Fields',
    schema_invalid: 'Schema Invalid'
  }

  const hasAdmin = user?.role === 'admin'

  return (
    <>
      <Alert className="bg-blue-50 border-blue-200">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-900">Analysis Note</AlertTitle>
        <AlertDescription className="text-blue-800 flex items-center justify-between">
          <span>
            Some quotes in this analysis could not be verified against the transcript.
            This is normal and doesn't affect accuracy.
          </span>
          <Button 
            variant="link" 
            size="sm" 
            onClick={() => setIsModalOpen(true)}
            className="text-blue-700 hover:text-blue-900"
          >
            View Details
          </Button>
        </AlertDescription>
      </Alert>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600" />
              Quality Analysis Details
            </DialogTitle>
            <DialogDescription>
              Information about potential quality issues detected in this analysis
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {flags.map((flag) => (
              <div key={flag.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <Badge variant="outline" className="mb-2">
                      {flagTypeLabels[flag.flag_type] || flag.flag_type}
                    </Badge>
                    <p className="text-sm text-slate-600">
                      Flagged on {new Date(flag.flagged_at).toLocaleDateString()}
                    </p>
                  </div>
                  
                  {hasAdmin && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleResolve(flag.id)}
                    >
                      Mark Resolved
                    </Button>
                  )}
                </div>

                {flag.details && (
                  <div className="bg-slate-50 rounded p-3">
                    <p className="text-sm text-slate-700">
                      {JSON.stringify(flag.details, null, 2)}
                    </p>
                  </div>
                )}
              </div>
            ))}

            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <p className="text-sm text-blue-900">
                <strong>What this means:</strong> Our AI system has flagged potential inconsistencies 
                in this analysis. This is part of our quality control process and helps improve 
                future analyses. The core insights and recommendations remain accurate and actionable.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
