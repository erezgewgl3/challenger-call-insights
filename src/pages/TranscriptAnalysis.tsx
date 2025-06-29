
import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SalesIntelligenceView } from '@/components/analysis/SalesIntelligenceView'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useAnalysisStatus } from '@/hooks/useAnalysisStatus'
import { ArrowLeft } from 'lucide-react'

interface TranscriptData {
  id: string
  title: string
  participants: string[]
  duration_minutes: number
  meeting_date: string
  account_id?: string
  raw_text?: string
}

export default function TranscriptAnalysis() {
  const { transcriptId } = useParams<{ transcriptId: string }>()
  const navigate = useNavigate()
  const [transcript, setTranscript] = useState<TranscriptData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const { status } = useAnalysisStatus(transcriptId)

  useEffect(() => {
    if (!transcriptId) return

    const fetchData = async () => {
      try {
        setIsLoading(true)
        
        // Fetch transcript details
        const { data: transcriptData, error: transcriptError } = await supabase
          .from('transcripts')
          .select('*')
          .eq('id', transcriptId)
          .single()

        if (transcriptError) throw transcriptError
        
        setTranscript({
          id: transcriptData.id,
          title: transcriptData.title,
          participants: Array.isArray(transcriptData.participants) ? transcriptData.participants as string[] : [],
          duration_minutes: transcriptData.duration_minutes || 0,
          meeting_date: transcriptData.meeting_date,
          account_id: transcriptData.account_id,
          raw_text: transcriptData.raw_text
        })

      } catch (err) {
        console.error('Failed to fetch transcript data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load transcript')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [transcriptId])

  const handleBackToDashboard = () => {
    navigate('/dashboard')
  }

  const handleUploadAnother = () => {
    navigate('/dashboard')
    // Could add a query param to auto-open upload dialog
  }

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

  if (error || !transcript) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Intelligence Not Found</CardTitle>
            <CardDescription>
              The sales intelligence could not be loaded.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleBackToDashboard} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show processing state
  if (status?.status === 'processing') {
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

  // Show the sales intelligence view
  return (
    <SalesIntelligenceView
      transcriptId={transcriptId!}
      onBackToDashboard={handleBackToDashboard}
      onUploadAnother={handleUploadAnother}
    />
  )
}
