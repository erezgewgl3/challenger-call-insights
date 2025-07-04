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
import { useToast } from "@/components/ui/use-toast"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Separator } from "@/components/ui/separator"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { usePdfExport } from '@/hooks/usePdfExport'
import { FileDown } from 'lucide-react'

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
  id: string
  transcript_id: string
  summary: string
  key_points: string[]
  action_items: string[]
  next_steps: string
  sentiment_score: number
  topics: string[]
  questions: string[]
  priority_level: string
  customer_needs: string[]
  objections: string[]
  opportunities: string[]
  follow_up_content: string
  talking_points: string[]
  conversation_flow: string
  engagement_levels: { time: number; level: number }[]
  custom_fields: Record<string, any>
}

interface NewAnalysisViewProps {
  transcriptId: string
  onBackToDashboard: () => void
  onUploadAnother: () => void
}

export const NewAnalysisView: React.FC<NewAnalysisViewProps> = ({
  transcriptId,
  onBackToDashboard,
  onUploadAnother
}) => {
  const navigate = useNavigate()
  const [transcript, setTranscript] = useState<TranscriptData | null>(null)
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const [date, setDate] = React.useState<Date | undefined>(new Date())
  
  const { status } = useAnalysisStatus(transcriptId)

  const { exportToPdf, isExporting } = usePdfExport()

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

        // Fetch analysis details
        const { data: analysisData, error: analysisError } = await supabase
          .from('sales_intelligence')
          .select('*')
          .eq('transcript_id', transcriptId)
          .single()

        if (analysisError) throw analysisError

        setAnalysis({
          id: analysisData.id,
          transcript_id: analysisData.transcript_id,
          summary: analysisData.summary,
          key_points: Array.isArray(analysisData.key_points) ? analysisData.key_points as string[] : [],
          action_items: Array.isArray(analysisData.action_items) ? analysisData.action_items as string[] : [],
          next_steps: analysisData.next_steps,
          sentiment_score: analysisData.sentiment_score || 0,
          topics: Array.isArray(analysisData.topics) ? analysisData.topics as string[] : [],
          questions: Array.isArray(analysisData.questions) ? analysisData.questions as string[] : [],
          priority_level: analysisData.priority_level,
          customer_needs: Array.isArray(analysisData.customer_needs) ? analysisData.customer_needs as string[] : [],
          objections: Array.isArray(analysisData.objections) ? analysisData.objections as string[] : [],
          opportunities: Array.isArray(analysisData.opportunities) ? analysisData.opportunities as string[] : [],
          follow_up_content: analysisData.follow_up_content,
          talking_points: Array.isArray(analysisData.talking_points) ? analysisData.talking_points as string[] : [],
          conversation_flow: analysisData.conversation_flow,
          engagement_levels: Array.isArray(analysisData.engagement_levels) ? analysisData.engagement_levels as { time: number; level: number }[] : [],
          custom_fields: analysisData.custom_fields || {}
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

  const handleExportPdf = () => {
    exportToPdf('analysis-content', transcript?.title)
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

  if (error || !transcript || !analysis) {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Button
              onClick={onBackToDashboard}
              variant="ghost"
              className="text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            
            <div className="flex items-center space-x-3">
              {/* Priority badges */}
              {analysis?.priority_level && (
                <Badge 
                  variant={analysis.priority_level.toLowerCase().includes('urgent') ? 'destructive' : 'secondary'}
                  className={analysis.priority_level.toLowerCase().includes('urgent') 
                    ? 'bg-red-100 text-red-800 border-red-200' 
                    : 'bg-blue-100 text-blue-800 border-blue-200'
                  }
                >
                  {analysis.priority_level}
                </Badge>
              )}
              
              {/* Replace Upload Another button with Export PDF button */}
              <Button
                onClick={handleExportPdf}
                disabled={isExporting}
                variant="outline"
                className="bg-white border-slate-200 hover:bg-slate-50"
              >
                <FileDown className="w-4 h-4 mr-2" />
                {isExporting ? 'Exporting...' : 'Export PDF'}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-slate-900">{transcript.title}</h1>
            <p className="text-slate-600">
              Meeting Date:{' '}
              {date ? format(date, "PPP") : <span>Pick a date</span>}
            </p>
          </div>
        </div>

        {/* Analysis Content - Add ID for PDF export */}
        <div id="analysis-content" className="space-y-8">
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
              <CardDescription>Key highlights from the conversation</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-slate-700">{analysis.summary}</p>
            </CardContent>
          </Card>

          {/* Key Points */}
          <Card>
            <CardHeader>
              <CardTitle>Key Points</CardTitle>
              <CardDescription>Important topics discussed</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside text-slate-700">
                {analysis.key_points.map((point, index) => (
                  <li key={index}>{point}</li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Action Items */}
          <Card>
            <CardHeader>
              <CardTitle>Action Items</CardTitle>
              <CardDescription>Tasks to be completed</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-decimal list-inside text-slate-700">
                {analysis.action_items.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card>
            <CardHeader>
              <CardTitle>Next Steps</CardTitle>
              <CardDescription>Recommended follow-up actions</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-slate-700">{analysis.next_steps}</p>
            </CardContent>
          </Card>

          {/* Sentiment Score */}
          <Card>
            <CardHeader>
              <CardTitle>Sentiment Score</CardTitle>
              <CardDescription>Overall sentiment of the conversation</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-slate-700">Sentiment Score: {analysis.sentiment_score}</p>
            </CardContent>
          </Card>

          {/* Topics */}
          <Card>
            <CardHeader>
              <CardTitle>Topics Discussed</CardTitle>
              <CardDescription>Main subjects covered in the conversation</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside text-slate-700">
                {analysis.topics.map((topic, index) => (
                  <li key={index}>{topic}</li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Questions Asked */}
           <Card>
            <CardHeader>
              <CardTitle>Questions Asked</CardTitle>
              <CardDescription>Questions raised during the conversation</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside text-slate-700">
                {analysis.questions.map((question, index) => (
                  <li key={index}>{question}</li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Customer Needs */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Needs</CardTitle>
              <CardDescription>Identified customer requirements</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside text-slate-700">
                {analysis.customer_needs.map((need, index) => (
                  <li key={index}>{need}</li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Objections */}
          <Card>
            <CardHeader>
              <CardTitle>Objections Raised</CardTitle>
              <CardDescription>Concerns or objections mentioned</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside text-slate-700">
                {analysis.objections.map((objection, index) => (
                  <li key={index}>{objection}</li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Opportunities */}
          <Card>
            <CardHeader>
              <CardTitle>Opportunities Identified</CardTitle>
              <CardDescription>Potential opportunities for sales or partnerships</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside text-slate-700">
                {analysis.opportunities.map((opportunity, index) => (
                  <li key={index}>{opportunity}</li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Follow-up Content */}
          <Card>
            <CardHeader>
              <CardTitle>Follow-up Content</CardTitle>
              <CardDescription>Suggested content for follow-up</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-slate-700">{analysis.follow_up_content}</p>
            </CardContent>
          </Card>

          {/* Talking Points */}
          <Card>
            <CardHeader>
              <CardTitle>Talking Points</CardTitle>
              <CardDescription>Key points to discuss in future conversations</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside text-slate-700">
                {analysis.talking_points.map((point, index) => (
                  <li key={index}>{point}</li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Conversation Flow */}
          <Card>
            <CardHeader>
              <CardTitle>Conversation Flow</CardTitle>
              <CardDescription>Overview of the conversation's structure</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-slate-700">{analysis.conversation_flow}</p>
            </CardContent>
          </Card>

          {/* Engagement Levels */}
          <Card>
            <CardHeader>
              <CardTitle>Engagement Levels</CardTitle>
              <CardDescription>Engagement levels over time</CardDescription>
            </CardHeader>
            <CardContent>
              {analysis.engagement_levels.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analysis.engagement_levels} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="level" stroke="#8884d8" fill="#8884d8" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-slate-700">No engagement data available.</p>
              )}
            </CardContent>
          </Card>

          {/* Custom Fields */}
          {Object.keys(analysis.custom_fields).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Custom Fields</CardTitle>
                <CardDescription>Additional information</CardDescription>
              </CardHeader>
              <CardContent>
                {Object.entries(analysis.custom_fields).map(([key, value]) => (
                  <div key={key} className="mb-4">
                    <h4 className="font-semibold">{key}</h4>
                    <p className="text-slate-700">{value}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
