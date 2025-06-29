
import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AnalysisResults } from '@/components/analysis/AnalysisResults'
import { InsightsOverview } from '@/components/analysis/InsightsOverview'
import { ActionableGuidance } from '@/components/analysis/ActionableGuidance'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useAnalysisStatus } from '@/hooks/useAnalysisStatus'
import { ArrowLeft, Download, Share2, BookOpen } from 'lucide-react'
import { toast } from 'sonner'

interface TranscriptData {
  id: string
  title: string
  participants: string[]
  duration_minutes: number
  meeting_date: string
  account_id?: string
  raw_text?: string
}

interface AnalysisData {
  challenger_scores: {
    teaching: number
    tailoring: number
    control: number
  }
  guidance: {
    recommendation: string
    message: string
    keyInsights: string[]
    nextSteps: string[]
  }
  email_followup: {
    subject: string
    body: string
    timing: string
    channel: string
  }
}

export default function TranscriptAnalysis() {
  const { transcriptId } = useParams<{ transcriptId: string }>()
  const [transcript, setTranscript] = useState<TranscriptData | null>(null)
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null)
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

        // Fetch analysis results
        const { data: analysisData, error: analysisError } = await supabase
          .from('conversation_analysis')
          .select('*')
          .eq('transcript_id', transcriptId)
          .single()

        if (analysisError && analysisError.code !== 'PGRST116') {
          throw analysisError
        }

        if (analysisData) {
          setAnalysis({
            challenger_scores: analysisData.challenger_scores as {
              teaching: number
              tailoring: number
              control: number
            },
            guidance: analysisData.guidance as {
              recommendation: string
              message: string
              keyInsights: string[]
              nextSteps: string[]
            },
            email_followup: analysisData.email_followup as {
              subject: string
              body: string
              timing: string
              channel: string
            }
          })
        }

      } catch (err) {
        console.error('Failed to fetch transcript data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load transcript')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [transcriptId])

  const handleExportResults = () => {
    if (!transcript || !analysis) return
    
    const exportData = {
      transcript: transcript.title,
      date: new Date(transcript.meeting_date).toLocaleDateString(),
      challengerScores: analysis.challenger_scores,
      keyInsights: analysis.guidance.keyInsights,
      nextSteps: analysis.guidance.nextSteps,
      emailTemplate: analysis.email_followup
    }
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${transcript.title}-analysis.json`
    a.click()
    URL.revokeObjectURL(url)
    
    toast.success('Analysis exported successfully!')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <LoadingSpinner />
          <p className="text-slate-600">Loading your conversation insights...</p>
        </div>
      </div>
    )
  }

  if (error || !transcript) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Analysis Not Found</CardTitle>
            <CardDescription>
              The transcript analysis could not be loaded.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.history.back()} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show processing state
  if (status?.status === 'processing' || !analysis) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center space-y-6">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-slate-900">{transcript.title}</h1>
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                Analysis in Progress
              </Badge>
            </div>
            
            <Card className="max-w-md mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center justify-center">
                  <LoadingSpinner />
                  <span className="ml-3">Processing Your Conversation</span>
                </CardTitle>
                <CardDescription>
                  AI is analyzing your sales call using Challenger methodology
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-slate-600">
                  <p>📊 Evaluating Teaching, Tailoring, and Control dimensions</p>
                  <p>💡 Identifying key insights and opportunities</p>
                  <p>✉️ Crafting personalized follow-up recommendations</p>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              onClick={() => window.history.back()}
              className="text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={handleExportResults}>
              <Download className="w-4 h-4 mr-2" />
              Export Results
            </Button>
            <Button variant="outline">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="results" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="results">Analysis Results</TabsTrigger>
            <TabsTrigger value="insights">Insights Overview</TabsTrigger>
            <TabsTrigger value="guidance">Action Plan</TabsTrigger>
          </TabsList>

          <TabsContent value="results" className="space-y-6">
            <AnalysisResults
              challengerScores={analysis.challenger_scores}
              guidance={analysis.guidance}
              emailFollowUp={analysis.email_followup}
              transcriptTitle={transcript.title}
            />
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            <InsightsOverview
              challengerScores={analysis.challenger_scores}
              transcriptData={{
                duration: transcript.duration_minutes,
                participantCount: transcript.participants.length
              }}
            />
          </TabsContent>

          <TabsContent value="guidance" className="space-y-6">
            <ActionableGuidance
              nextSteps={analysis.guidance.nextSteps}
              emailFollowUp={analysis.email_followup}
              challengerScores={analysis.challenger_scores}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
