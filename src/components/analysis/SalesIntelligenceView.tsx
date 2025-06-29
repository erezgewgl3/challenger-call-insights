
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  Upload, 
  AlertCircle, 
  RefreshCw,
  Loader2
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { AnalysisResultsView } from './AnalysisResultsView'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { toast } from 'sonner'

interface TranscriptData {
  id: string
  title: string
  participants: string[]
  duration_minutes: number
  meeting_date: string
  status: 'uploaded' | 'processing' | 'completed' | 'error'
  error_message?: string
  account_id?: string
  raw_text?: string
}

interface AnalysisData {
  id: string
  challenger_scores: any
  guidance: any
  email_followup: any
  participants?: any
  call_summary?: any
  key_takeaways?: string[]
  recommendations?: any
  reasoning?: any
  action_plan?: any
}

interface SalesIntelligenceViewProps {
  transcriptId: string
  onBackToDashboard: () => void
  onUploadAnother: () => void
}

export function SalesIntelligenceView({ 
  transcriptId,
  onBackToDashboard,
  onUploadAnother
}: SalesIntelligenceViewProps) {
  const [transcript, setTranscript] = useState<TranscriptData | null>(null)
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRetrying, setIsRetrying] = useState(false)

  const fetchData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Fetch transcript with analysis data
      const { data: transcriptData, error: transcriptError } = await supabase
        .from('transcripts')
        .select(`
          *,
          conversation_analysis (*)
        `)
        .eq('id', transcriptId)
        .single()

      if (transcriptError) {
        console.error('Failed to fetch transcript:', transcriptError)
        throw new Error('Transcript not found')
      }
      
      setTranscript({
        id: transcriptData.id,
        title: transcriptData.title,
        participants: Array.isArray(transcriptData.participants) ? transcriptData.participants as string[] : [],
        duration_minutes: transcriptData.duration_minutes || 0,
        meeting_date: transcriptData.meeting_date,
        status: transcriptData.status,
        error_message: transcriptData.error_message,
        account_id: transcriptData.account_id,
        raw_text: transcriptData.raw_text
      })

      // Set analysis data if available
      if (transcriptData.conversation_analysis && transcriptData.conversation_analysis.length > 0) {
        setAnalysis(transcriptData.conversation_analysis[0])
      }

    } catch (err) {
      console.error('Failed to fetch transcript data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load transcript')
    } finally {
      setIsLoading(false)
    }
  }

  const retryAnalysis = async () => {
    if (!transcript) return
    
    try {
      setIsRetrying(true)
      toast.info('Retrying analysis...')
      
      // Call the analyze function
      const { data, error } = await supabase.functions.invoke('analyze-transcript', {
        body: {
          transcriptId: transcript.id,
          userId: (await supabase.auth.getUser()).data.user?.id,
          transcriptText: transcript.raw_text,
          durationMinutes: transcript.duration_minutes,
          accountId: transcript.account_id
        }
      })

      if (error) {
        console.error('Analysis retry failed:', error)
        toast.error('Analysis retry failed. Please try again.')
        return
      }

      toast.success('Analysis retry initiated. Please wait...')
      
      // Poll for completion
      setTimeout(() => {
        fetchData()
      }, 5000)
      
    } catch (error) {
      console.error('Retry analysis error:', error)
      toast.error('Failed to retry analysis')
    } finally {
      setIsRetrying(false)
    }
  }

  useEffect(() => {
    if (transcriptId) {
      fetchData()

      // Set up real-time subscription for status updates
      const channel = supabase
        .channel('transcript-updates')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'transcripts',
            filter: `id=eq.${transcriptId}`
          },
          (payload) => {
            const updatedTranscript = payload.new as any
            setTranscript(prev => prev ? {
              ...prev,
              status: updatedTranscript.status,
              error_message: updatedTranscript.error_message
            } : null)

            // Refetch data if completed
            if (updatedTranscript.status === 'completed') {
              setTimeout(fetchData, 1000)
            }
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [transcriptId])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <LoadingSpinner />
          <p className="text-slate-600">Loading sales intelligence...</p>
        </div>
      </div>
    )
  }

  if (!transcript) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              Transcript Not Found
            </CardTitle>
            <CardDescription>
              The requested transcript could not be loaded.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={onBackToDashboard} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show error state with retry option
  if (transcript.status === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center space-y-6">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-slate-900">{transcript.title}</h1>
              <Badge variant="destructive" className="bg-red-100 text-red-800">
                Analysis Failed
              </Badge>
            </div>
            
            <Card className="max-w-md mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center justify-center text-red-600">
                  <AlertCircle className="w-6 h-6 mr-2" />
                  Analysis Error
                </CardTitle>
                <CardDescription>
                  The AI analysis encountered an error and could not complete.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {transcript.error_message && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">{transcript.error_message}</p>
                  </div>
                )}
                
                <div className="flex flex-col space-y-2">
                  <Button 
                    onClick={retryAnalysis}
                    disabled={isRetrying}
                    className="w-full"
                  >
                    {isRetrying ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Retrying Analysis...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Retry Analysis
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={onBackToDashboard}
                    className="w-full"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // Show processing state
  if (transcript.status === 'processing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center space-y-6">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-slate-900">{transcript.title}</h1>
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                Intelligence Processing
              </Badge>
            </div>
            
            <Card className="max-w-md mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center justify-center">
                  <LoadingSpinner />
                  <span className="ml-3">Generating Sales Intelligence</span>
                </CardTitle>
                <CardDescription>
                  AI is analyzing your conversation for actionable insights
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-slate-600">
                  <p>🎯 Identifying client needs and buying signals</p>
                  <p>💡 Extracting key intelligence and opportunities</p>
                  <p>✉️ Creating ready-to-use follow-up content</p>
                </div>
                <p className="text-xs text-slate-500">
                  Estimated time: {transcript.duration_minutes <= 30 ? '8 seconds' : 
                                  transcript.duration_minutes <= 90 ? '20 seconds' : '45 seconds'}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // Show completed analysis or no analysis available
  if (transcript.status === 'completed' && analysis) {
    return (
      <AnalysisResultsView
        transcriptId={transcriptId}
        onBackToDashboard={onBackToDashboard}
        onUploadAnother={onUploadAnother}
      />
    )
  }

  // Show no analysis available state
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-slate-900">{transcript.title}</h1>
            <Badge variant="secondary" className="bg-gray-100 text-gray-800">
              No Analysis Available
            </Badge>
          </div>
          
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-center text-gray-600">
                <AlertCircle className="w-6 h-6 mr-2" />
                Analysis Unavailable
              </CardTitle>
              <CardDescription>
                No analysis results found for this transcript.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col space-y-2">
                <Button 
                  onClick={retryAnalysis}
                  disabled={isRetrying}
                  className="w-full"
                >
                  {isRetrying ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Starting Analysis...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Start Analysis
                    </>
                  )}
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={onBackToDashboard}
                  className="w-full"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
