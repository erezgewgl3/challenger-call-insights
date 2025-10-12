
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  TrendingUp, 
  Target, 
  MessageSquare, 
  Mail, 
  CheckCircle, 
  ArrowRight, 
  Lightbulb, 
  Users,
  Copy,
  Share2,
  Upload,
  ArrowLeft,
  Star,
  Zap
} from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useQuery } from '@tanstack/react-query'

interface ChallengerScores {
  teaching: number | null
  tailoring: number | null
  control: number | null
}

interface Guidance {
  recommendation: string | null
  message: string | null
  keyInsights: string[]
  nextSteps: string[]
}

interface EmailFollowUp {
  subject: string | null
  body: string | null
  timing: string | null
  channel: string | null
}

interface AnalysisData {
  challengerScores: ChallengerScores
  guidance: Guidance
  emailFollowUp: EmailFollowUp
  transcriptTitle: string
}

interface AnalysisResultsViewProps {
  transcriptId: string
  onBackToDashboard: () => void
  onUploadAnother: () => void
}

export function AnalysisResultsView({ 
  transcriptId,
  onBackToDashboard,
  onUploadAnother
}: AnalysisResultsViewProps) {
  const [emailCopied, setEmailCopied] = useState(false)

  // Fetch real analysis data from database
  const { data: analysisData, isLoading, error } = useQuery({
    queryKey: ['conversation-analysis', transcriptId],
    queryFn: async () => {
      const { data: transcript, error: transcriptError } = await supabase
        .from('transcripts')
        .select(`
          id,
          title,
          extracted_company_name,
          deal_context,
          conversation_analysis (
            challenger_scores,
            guidance,
            email_followup
          )
        `)
        .eq('id', transcriptId)
        .single()

      if (transcriptError) throw transcriptError

      if (transcript?.conversation_analysis?.[0]) {
        const analysis = transcript.conversation_analysis[0]
        
        // Prioritize company name over generic title
        const dealContext = transcript.deal_context as { company_name?: string } | null
        const displayTitle = transcript.extracted_company_name || 
                           dealContext?.company_name || 
                           transcript.title
        
        return {
          challengerScores: (analysis.challenger_scores as unknown as ChallengerScores) || { teaching: null, tailoring: null, control: null },
          guidance: (analysis.guidance as unknown as Guidance) || {
            recommendation: null,
            message: null,
            keyInsights: [],
            nextSteps: []
          },
          emailFollowUp: (analysis.email_followup as unknown as EmailFollowUp) || {
            subject: null,
            body: null,
            timing: null,
            channel: null
          },
          transcriptTitle: displayTitle
        }
      }

      return null
    }
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-600">Loading your insights...</p>
        </div>
      </div>
    )
  }

  if (error || !analysisData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-slate-600">
            {error ? 'Failed to load analysis results' : 'Analysis not found'}
          </p>
          <Button onClick={onBackToDashboard}>Return to Dashboard</Button>
        </div>
      </div>
    )
  }

  

  const { challengerScores, guidance, emailFollowUp, transcriptTitle } = analysisData

  // Determine the biggest strength for hero section - handle null scores
  const getTopStrength = () => {
    const scores = {
      teaching: { score: challengerScores.teaching || 0, label: 'Teaching Impact', icon: Lightbulb, color: 'text-yellow-600' },
      tailoring: { score: challengerScores.tailoring || 0, label: 'Tailoring Effectiveness', icon: Users, color: 'text-blue-600' },
      control: { score: challengerScores.control || 0, label: 'Conversation Control', icon: Target, color: 'text-green-600' }
    }
    
    const topScore = Object.entries(scores).reduce((a, b) => 
      scores[a[0]].score > scores[b[0]].score ? a : b
    )
    
    return scores[topScore[0]]
  }

  const topStrength = getTopStrength()
  const TopIcon = topStrength.icon

  const getImpactLevel = (score: number | null) => {
    if (!score || score < 1) return { level: 'Pending', color: 'from-gray-500 to-gray-600', bgColor: 'bg-gray-50', textColor: 'text-gray-700' }
    if (score >= 4) return { level: 'Exceptional', color: 'from-green-500 to-emerald-600', bgColor: 'bg-green-50', textColor: 'text-green-700' }
    if (score >= 3) return { level: 'Strong', color: 'from-blue-500 to-blue-600', bgColor: 'bg-blue-50', textColor: 'text-blue-700' }
    return { level: 'Growing', color: 'from-purple-500 to-purple-600', bgColor: 'bg-purple-50', textColor: 'text-purple-700' }
  }

  const copyEmailTemplate = async () => {
    if (!emailFollowUp.subject || !emailFollowUp.body) {
      toast.error('No email template available to copy')
      return
    }
    
    const emailContent = `Subject: ${emailFollowUp.subject}\n\n${emailFollowUp.body}`
    
    try {
      await navigator.clipboard.writeText(emailContent)
      setEmailCopied(true)
      toast.success('Email template copied to clipboard!')
      setTimeout(() => setEmailCopied(false), 2000)
    } catch (error) {
      toast.error('Failed to copy email template')
    }
  }

  const CircularProgress = ({ value, size = 120, strokeWidth = 8, color = 'text-blue-500' }) => {
    const displayValue = value || 0
    const radius = (size - strokeWidth) / 2
    const circumference = radius * 2 * Math.PI
    const offset = circumference - (displayValue / 5) * circumference

    return (
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            className="text-gray-200"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={`${color} transition-all duration-1000 ease-out`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className={`text-2xl font-bold ${color.replace('text-', 'text-')}`}>
              {value ? `${value}/5` : 'N/A'}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      {/* Navigation Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={onBackToDashboard}
            className="text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Dashboard
          </Button>
          
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button onClick={onUploadAnother} className="bg-blue-600 hover:bg-blue-700">
              <Upload className="w-4 h-4 mr-2" />
              Analyze Another Call
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-6">
          <div className="space-y-4">
            <Badge className="bg-green-100 text-green-800 px-4 py-2 text-lg font-medium">
              <Star className="w-5 h-5 mr-2" />
              Analysis Complete
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 leading-tight">
              Your Conversation Insights
            </h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Analysis complete for "<span className="font-semibold text-slate-900">{transcriptTitle}</span>"
            </p>
          </div>

          {/* Hero Highlight */}
          <Card className="max-w-2xl mx-auto bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-8">
              <div className="flex items-center justify-center space-x-4 mb-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <TopIcon className={`w-8 h-8 ${topStrength.color}`} />
                </div>
                <div className="text-left">
                  <h3 className="text-2xl font-bold text-slate-900">
                    {topStrength.score > 0 ? `Outstanding ${topStrength.label}` : 'Analysis Completed'}
                  </h3>
                  <p className="text-blue-700 font-medium">
                    {topStrength.score > 0 ? 'Your strongest dimension in this conversation' : 'Transcript processed successfully'}
                  </p>
                </div>
              </div>
              <p className="text-slate-700 text-lg leading-relaxed">
                {guidance.message || 'Your conversation analysis has been completed. Review the detailed breakdown below.'}
              </p>
            </CardContent>
          </Card>
        </div>


        {/* Key Insights Section */}
        <Card className="hover:shadow-lg transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl">
              <CheckCircle className="w-7 h-7 mr-3 text-green-600" />
              Key Insights
            </CardTitle>
            <CardDescription className="text-lg">
              {guidance.keyInsights && guidance.keyInsights.length > 0 ? 
                'Key moments where your approach created significant impact' :
                'Analysis insights will appear here when available'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {guidance.keyInsights && guidance.keyInsights.length > 0 ? (
              <div className="grid gap-6">
                {guidance.keyInsights.map((insight, index) => (
                  <div key={index} className="flex items-start space-x-4 p-6 bg-green-50 rounded-xl border-l-4 border-l-green-500 hover:bg-green-100 transition-colors">
                    <div className="p-2 bg-green-100 rounded-full flex-shrink-0">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <p className="text-slate-900 text-lg leading-relaxed">{insight}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-slate-500">No insights available yet. The AI analysis may still be processing or incomplete.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Zone */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Email Follow-up */}
          <Card className="hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <Mail className="w-6 h-6 mr-3 text-purple-600" />
                Email Follow-up
              </CardTitle>
              <CardDescription>
                {emailFollowUp.subject || emailFollowUp.body ? 
                  'Personalized email template based on your conversation' :
                  'Email template will be generated when analysis is complete'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {emailFollowUp.subject || emailFollowUp.body ? (
                <>
                  <div>
                    <label className="text-sm font-semibold text-slate-700 mb-2 block">Subject Line</label>
                    <div className="p-3 bg-slate-50 rounded-lg border">
                      <p className="text-slate-900 font-medium">
                        {emailFollowUp.subject || 'No subject available'}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-semibold text-slate-700 mb-2 block">Message Preview</label>
                    <div className="p-4 bg-slate-50 rounded-lg border max-h-32 overflow-y-auto">
                      <p className="text-slate-900 text-sm leading-relaxed">
                        {emailFollowUp.body ? (
                          emailFollowUp.body.length > 200 
                            ? `${emailFollowUp.body.substring(0, 200)}...`
                            : emailFollowUp.body
                        ) : 'No email content available'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4">
                    <div className="text-sm text-slate-600">
                      <p>📅 Send in {emailFollowUp.timing || 'timing not specified'}</p>
                      <p>📧 via {emailFollowUp.channel || 'channel not specified'}</p>
                    </div>
                    <Button 
                      onClick={copyEmailTemplate}
                      className="bg-purple-600 hover:bg-purple-700"
                      disabled={!emailFollowUp.subject && !emailFollowUp.body}
                    >
                      {emailCopied ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy Template
                        </>
                      )}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-slate-500">Email template will be generated when AI analysis is complete.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card className="hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <ArrowRight className="w-6 h-6 mr-3 text-blue-600" />
                Your Next Steps
              </CardTitle>
              <CardDescription>
                {guidance.nextSteps && guidance.nextSteps.length > 0 ?
                  'Recommended actions to maximize your momentum' :
                  'Next steps will be provided when analysis is complete'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {guidance.nextSteps && guidance.nextSteps.length > 0 ? (
                <div className="space-y-4">
                  {guidance.nextSteps.map((step, index) => (
                    <div key={index} className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-white">{index + 1}</span>
                      </div>
                      <p className="text-slate-900 leading-relaxed">{step}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-slate-500">Recommended next steps will appear here when analysis is complete.</p>
                </div>
              )}
              
              <div className="mt-6 pt-6 border-t">
                <Button 
                  onClick={onUploadAnother}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-lg py-6"
                >
                  <Zap className="w-5 h-5 mr-2" />
                  Analyze Another Conversation
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
