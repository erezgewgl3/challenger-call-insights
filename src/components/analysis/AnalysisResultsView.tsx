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

interface ChallengerScores {
  teaching: number
  tailoring: number
  control: number
}

interface Guidance {
  recommendation: string
  message: string
  keyInsights: string[]
  nextSteps: string[]
}

interface EmailFollowUp {
  subject: string
  body: string
  timing: string
  channel: string
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
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch analysis data
  useEffect(() => {
    const fetchAnalysisData = async () => {
      try {
        // Fetch transcript and analysis data
        const { data: transcript, error: transcriptError } = await supabase
          .from('transcripts')
          .select(`
            id,
            title,
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
          setAnalysisData({
            challengerScores: (analysis.challenger_scores as unknown as ChallengerScores) || { teaching: 3, tailoring: 3, control: 3 },
            guidance: (analysis.guidance as unknown as Guidance) || {
              recommendation: 'Continue',
              message: 'Good conversation with room for improvement.',
              keyInsights: ['Engaged with prospect effectively'],
              nextSteps: ['Follow up within 48 hours']
            },
            emailFollowUp: (analysis.email_followup as unknown as EmailFollowUp) || {
              subject: 'Following up on our conversation',
              body: 'Thank you for taking the time to speak with me today...',
              timing: '48 hours',
              channel: 'Email'
            },
            transcriptTitle: transcript.title
          })
        } else {
          // Fallback data if analysis doesn't exist yet
          setAnalysisData({
            challengerScores: { teaching: 3, tailoring: 3, control: 3 },
            guidance: {
              recommendation: 'Continue',
              message: 'Analysis in progress. Please check back shortly.',
              keyInsights: ['Analysis is being processed'],
              nextSteps: ['Check back in a few minutes']
            },
            emailFollowUp: {
              subject: 'Following up on our conversation',
              body: 'Thank you for taking the time to speak with me today...',
              timing: '48 hours',
              channel: 'Email'
            },
            transcriptTitle: transcript.title
          })
        }
      } catch (error) {
        console.error('Failed to fetch analysis data:', error)
        toast.error('Failed to load analysis results')
      } finally {
        setIsLoading(false)
      }
    }

    fetchAnalysisData()
  }, [transcriptId])

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

  if (!analysisData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-slate-600">Failed to load analysis results</p>
          <Button onClick={onBackToDashboard}>Return to Dashboard</Button>
        </div>
      </div>
    )
  }

  const { challengerScores, guidance, emailFollowUp, transcriptTitle } = analysisData

  // Determine the biggest strength for hero section
  const getTopStrength = () => {
    const scores = {
      teaching: { score: challengerScores.teaching, label: 'Teaching Impact', icon: Lightbulb, color: 'text-yellow-600' },
      tailoring: { score: challengerScores.tailoring, label: 'Tailoring Effectiveness', icon: Users, color: 'text-blue-600' },
      control: { score: challengerScores.control, label: 'Conversation Control', icon: Target, color: 'text-green-600' }
    }
    
    const topScore = Object.entries(scores).reduce((a, b) => 
      scores[a[0]].score > scores[b[0]].score ? a : b
    )
    
    return scores[topScore[0]]
  }

  const topStrength = getTopStrength()
  const TopIcon = topStrength.icon

  const getImpactLevel = (score: number) => {
    if (score >= 4) return { level: 'Exceptional', color: 'from-green-500 to-emerald-600', bgColor: 'bg-green-50', textColor: 'text-green-700' }
    if (score >= 3) return { level: 'Strong', color: 'from-blue-500 to-blue-600', bgColor: 'bg-blue-50', textColor: 'text-blue-700' }
    return { level: 'Growing', color: 'from-purple-500 to-purple-600', bgColor: 'bg-purple-50', textColor: 'text-purple-700' }
  }

  const copyEmailTemplate = async () => {
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
    const radius = (size - strokeWidth) / 2
    const circumference = radius * 2 * Math.PI
    const offset = circumference - (value / 5) * circumference

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
              {getImpactLevel(value).level}
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
                  <h3 className="text-2xl font-bold text-slate-900">Outstanding {topStrength.label}</h3>
                  <p className="text-blue-700 font-medium">Your strongest dimension in this conversation</p>
                </div>
              </div>
              <p className="text-slate-700 text-lg leading-relaxed">
                {guidance.message}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Challenger Methodology Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="text-center hover:shadow-lg transition-all duration-300">
            <CardHeader className="pb-4">
              <div className="flex justify-center mb-4">
                <CircularProgress 
                  value={challengerScores.teaching} 
                  color="text-yellow-500"
                />
              </div>
              <CardTitle className="flex items-center justify-center text-xl">
                <Lightbulb className="w-6 h-6 mr-2 text-yellow-600" />
                Teaching Impact
              </CardTitle>
              <CardDescription className="text-base">
                How effectively you challenged assumptions and shared insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className={`p-4 rounded-lg ${getImpactLevel(challengerScores.teaching).bgColor}`}>
                <p className="text-sm text-slate-700">
                  Your insights are creating {getImpactLevel(challengerScores.teaching).level.toLowerCase()} value for prospects
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-all duration-300">
            <CardHeader className="pb-4">
              <div className="flex justify-center mb-4">
                <CircularProgress 
                  value={challengerScores.tailoring} 
                  color="text-blue-500"
                />
              </div>
              <CardTitle className="flex items-center justify-center text-xl">
                <Users className="w-6 h-6 mr-2 text-blue-600" />
                Tailoring Effectiveness
              </CardTitle>
              <CardDescription className="text-base">
                How well you customize your message to their specific needs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className={`p-4 rounded-lg ${getImpactLevel(challengerScores.tailoring).bgColor}`}>
                <p className="text-sm text-slate-700">
                  Your personalization shows {getImpactLevel(challengerScores.tailoring).level.toLowerCase()} connection
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-all duration-300">
            <CardHeader className="pb-4">
              <div className="flex justify-center mb-4">
                <CircularProgress 
                  value={challengerScores.control} 
                  color="text-green-500"
                />
              </div>
              <CardTitle className="flex items-center justify-center text-xl">
                <Target className="w-6 h-6 mr-2 text-green-600" />
                Conversation Control
              </CardTitle>
              <CardDescription className="text-base">
                How confidently you guide conversations toward outcomes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className={`p-4 rounded-lg ${getImpactLevel(challengerScores.control).bgColor}`}>
                <p className="text-sm text-slate-700">
                  Your leadership demonstrates {getImpactLevel(challengerScores.control).level.toLowerCase()} guidance
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Key Insights Section */}
        <Card className="hover:shadow-lg transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl">
              <CheckCircle className="w-7 h-7 mr-3 text-green-600" />
              What's Working Exceptionally Well
            </CardTitle>
            <CardDescription className="text-lg">
              Key moments where your approach created significant impact
            </CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        {/* Action Zone */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Email Follow-up */}
          <Card className="hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <Mail className="w-6 h-6 mr-3 text-purple-600" />
                Ready-to-Send Follow-up
              </CardTitle>
              <CardDescription>
                Personalized email template based on your conversation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">Subject Line</label>
                <div className="p-3 bg-slate-50 rounded-lg border">
                  <p className="text-slate-900 font-medium">{emailFollowUp.subject}</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">Message Preview</label>
                <div className="p-4 bg-slate-50 rounded-lg border max-h-32 overflow-y-auto">
                  <p className="text-slate-900 text-sm leading-relaxed">
                    {emailFollowUp.body.substring(0, 200)}...
                  </p>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-4">
                <div className="text-sm text-slate-600">
                  <p>📅 Send in {emailFollowUp.timing}</p>
                  <p>📧 via {emailFollowUp.channel}</p>
                </div>
                <Button 
                  onClick={copyEmailTemplate}
                  className="bg-purple-600 hover:bg-purple-700"
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
                Recommended actions to maximize your momentum
              </CardDescription>
            </CardHeader>
            <CardContent>
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
