import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { toast } from 'sonner'
import { 
  Users, FileText, Lightbulb, Target, Brain, Zap, 
  ArrowLeft, Upload, AlertCircle, CheckCircle, 
  Clock, Mail, Phone, MessageCircle, Copy,
  ArrowRight, RefreshCw
} from 'lucide-react'

interface SalesIntelligenceViewProps {
  transcriptId: string
  onBackToDashboard: () => void
  onUploadAnother: () => void
}

interface AnalysisData {
  id: string
  transcript_id: string
  challenger_scores: any
  guidance: any
  email_followup: any
  participants?: any
  call_summary?: any
  key_takeaways?: string[]
  recommendations?: any
  reasoning?: any
  action_plan?: any
  created_at: string
}

interface TranscriptData {
  id: string
  title: string
  participants: string[]
  duration_minutes: number
  meeting_date: string
  status: string
}

export function SalesIntelligenceView({ 
  transcriptId, 
  onBackToDashboard, 
  onUploadAnother 
}: SalesIntelligenceViewProps) {
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null)
  const [transcript, setTranscript] = useState<TranscriptData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRetrying, setIsRetrying] = useState(false)

  const fetchData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      console.log('🔍 Fetching transcript and analysis for ID:', transcriptId)

      // Fetch transcript details
      const { data: transcriptData, error: transcriptError } = await supabase
        .from('transcripts')
        .select('*')
        .eq('id', transcriptId)
        .single()

      if (transcriptError) {
        console.error('🔍 Transcript fetch error:', transcriptError)
        throw new Error(`Transcript not found: ${transcriptError.message}`)
      }

      console.log('🔍 Transcript data:', transcriptData)
      
      // Transform the data to match our interface, handling the participants type conversion
      const transformedTranscript: TranscriptData = {
        id: transcriptData.id,
        title: transcriptData.title,
        participants: Array.isArray(transcriptData.participants) 
          ? transcriptData.participants as string[]
          : typeof transcriptData.participants === 'string'
          ? [transcriptData.participants]
          : [],
        duration_minutes: transcriptData.duration_minutes || 0,
        meeting_date: transcriptData.meeting_date,
        status: transcriptData.status
      }
      
      setTranscript(transformedTranscript)

      // Fetch analysis results
      const { data: analysisData, error: analysisError } = await supabase
        .from('conversation_analysis')
        .select('*')
        .eq('transcript_id', transcriptId)
        .single()

      if (analysisError) {
        console.error('🔍 Analysis fetch error:', analysisError)
        
        // Check if transcript is still processing
        if (transcriptData.status === 'processing') {
          setError('Analysis is still processing. Please wait a moment and try again.')
        } else if (transcriptData.status === 'error') {
          setError('Analysis failed. Please try uploading the transcript again.')
        } else {
          setError('Analysis results not found. The analysis may have failed to save.')
        }
        return
      }

      console.log('🔍 Analysis data:', analysisData)
      setAnalysis(analysisData)

    } catch (err) {
      console.error('🔍 Failed to fetch data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load analysis data')
    } finally {
      setIsLoading(false)
    }
  }

  const retryAnalysis = async () => {
    setIsRetrying(true)
    try {
      // Trigger re-analysis
      const { error } = await supabase.functions.invoke('analyze-transcript', {
        body: {
          transcriptId,
          userId: (await supabase.auth.getUser()).data.user?.id,
          transcriptText: 'retry', // This will be fetched by the edge function
          durationMinutes: transcript?.duration_minutes || 30
        }
      })

      if (error) {
        console.error('🔍 Retry analysis error:', error)
        toast.error('Failed to retry analysis')
      } else {
        toast.success('Analysis restarted. Please wait a moment.')
        // Refresh data after a short delay
        setTimeout(() => {
          fetchData()
        }, 3000)
      }
    } catch (err) {
      console.error('🔍 Retry analysis failed:', err)
      toast.error('Failed to retry analysis')
    } finally {
      setIsRetrying(false)
    }
  }

  useEffect(() => {
    if (transcriptId) {
      fetchData()
    }
  }, [transcriptId])

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Copied to clipboard!', { duration: 2000 })
    } catch (err) {
      console.error('Failed to copy: ', err)
      toast.error('Failed to copy to clipboard')
    }
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center space-y-6">
            <Card className="max-w-md mx-auto">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <AlertCircle className="w-6 h-6 text-red-500" />
                  <CardTitle className="text-red-600">Intelligence Not Available</CardTitle>
                </div>
                <CardDescription>
                  {error || 'Unable to load sales intelligence data'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {transcript?.status === 'processing' && (
                  <div className="text-center">
                    <LoadingSpinner />
                    <p className="text-sm text-gray-600 mt-2">Analysis is still processing...</p>
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Button onClick={onBackToDashboard} variant="outline" className="flex-1">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Dashboard
                  </Button>
                  <Button 
                    onClick={retryAnalysis} 
                    disabled={isRetrying}
                    className="flex-1"
                  >
                    {isRetrying ? (
                      <>
                        <LoadingSpinner />
                        <span className="ml-2">Retrying...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Retry Analysis
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // If we have transcript but no analysis, show processing state
  if (!analysis) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center space-y-6">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-slate-900">{transcript.title}</h1>
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                Analysis Processing
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
                <Button onClick={retryAnalysis} variant="outline" className="w-full">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Check Status
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // Extract data from analysis
  const participants = analysis.participants || {}
  const callSummary = analysis.call_summary || {}
  const keyTakeaways = analysis.key_takeaways || []
  const recommendations = analysis.recommendations || {}
  const reasoning = analysis.reasoning || {}
  const actionPlan = analysis.action_plan || {}

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button onClick={onBackToDashboard} variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
              <div className="h-6 w-px bg-gray-300" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{transcript.title}</h1>
                <p className="text-sm text-gray-600">
                  {new Date(transcript.meeting_date).toLocaleDateString()} • 
                  {transcript.duration_minutes}min • 
                  {transcript.participants.length} participants
                </p>
              </div>
            </div>
            <Button onClick={onUploadAnother} className="bg-blue-600 hover:bg-blue-700">
              <Upload className="w-4 h-4 mr-2" />
              Upload Another
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Participants & Overview */}
        {participants.clientContacts && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 p-6 rounded-lg">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Client Intelligence</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Key Contacts</h3>
                <div className="space-y-3">
                  {participants.clientContacts.map((contact: any, index: number) => (
                    <div key={index} className="bg-white p-4 rounded-lg border">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-gray-900">{contact.name}</p>
                          <p className="text-sm text-gray-600">{contact.title}</p>
                        </div>
                        <Badge variant="outline">{contact.influence}</Badge>
                      </div>
                      
                      <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                        contact.decisionLevel === 'high' ? 'bg-red-100 text-red-800' :
                        contact.decisionLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {contact.decisionLevel} influence
                      </span>
                      
                      {contact.buyingSignals?.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs text-gray-500 mb-1">Buying Signals:</p>
                          <div className="flex flex-wrap gap-1">
                            {contact.buyingSignals.map((signal: string, signalIndex: number) => (
                              <span key={signalIndex} className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded">
                                {signal}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Deal Context</h3>
                <div className="bg-white p-4 rounded-lg border space-y-3">
                  <div>
                    <span className="text-sm text-gray-500">Timeline:</span>
                    <p className="font-medium">{callSummary.timeline || 'Not specified'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Budget Indicators:</span>
                    <p className="font-medium">{callSummary.budget || 'Not discussed'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Competition:</span>
                    <p className="font-medium">{callSummary.competitiveLandscape || 'Not mentioned'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Call Summary */}
        {callSummary.overview && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-gray-600" />
                <CardTitle>What Happened</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-gray-700 text-lg leading-relaxed">
                {callSummary.overview}
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Client Situation</h4>
                  <p className="text-gray-700">{callSummary.clientSituation}</p>
                </div>
                
                {callSummary.mainTopics?.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Topics Discussed</h4>
                    <ul className="space-y-1">
                      {callSummary.mainTopics.map((topic: string, index: number) => (
                        <li key={index} className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                          <span className="text-gray-700">{topic}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {callSummary.clientConcerns?.length > 0 && (
                  <div>
                    <h4 className="font-medium text-red-600 mb-2">Client Concerns</h4>
                    <ul className="space-y-1">
                      {callSummary.clientConcerns.map((concern: string, index: number) => (
                        <li key={index} className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-red-500" />
                          <span className="text-gray-700">{concern}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {callSummary.positiveSignals?.length > 0 && (
                  <div>
                    <h4 className="font-medium text-green-600 mb-2">Positive Signals</h4>
                    <ul className="space-y-1">
                      {callSummary.positiveSignals.map((signal: string, index: number) => (
                        <li key={index} className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-gray-700">{signal}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Key Takeaways */}
        {keyTakeaways.length > 0 && (
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-500 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Lightbulb className="w-6 h-6 text-yellow-600" />
              <h2 className="text-xl font-semibold text-gray-900">Key Intelligence</h2>
            </div>
            
            <div className="space-y-3">
              {keyTakeaways.map((takeaway: string, index: number) => (
                <div key={index} className="flex items-start gap-3 bg-white p-4 rounded-lg">
                  <div className="w-6 h-6 bg-yellow-100 text-yellow-700 rounded-full flex items-center justify-center text-sm font-medium mt-0.5">
                    {index + 1}
                  </div>
                  <p className="text-gray-700 leading-relaxed">{takeaway}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {recommendations.primaryStrategy && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Target className="w-6 h-6 text-blue-600" />
                <CardTitle>Your Next Moves</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Primary Strategy</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-900 font-medium">{recommendations.primaryStrategy}</p>
                </div>
              </div>
              
              {recommendations.immediateActions?.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Immediate Actions</h3>
                  <div className="space-y-2">
                    {recommendations.immediateActions.map((action: string, index: number) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-medium mt-0.5">
                          {index + 1}
                        </div>
                        <p className="text-gray-700">{action}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recommendations.stakeholderPlan && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Stakeholder Plan</h4>
                    <p className="text-gray-700 text-sm">{recommendations.stakeholderPlan}</p>
                  </div>
                )}
                {recommendations.competitiveStrategy && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Competitive Strategy</h4>
                    <p className="text-gray-700 text-sm">{recommendations.competitiveStrategy}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reasoning */}
        {reasoning.whyTheseRecommendations && (
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-l-4 border-purple-500 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Brain className="w-6 h-6 text-purple-600" />
              <h2 className="text-xl font-semibold text-gray-900">Here's Why</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">The Reasoning</h3>
                <p className="text-gray-700 leading-relaxed">{reasoning.whyTheseRecommendations}</p>
              </div>
              
              {reasoning.clientSignalsObserved?.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Client Signals We Observed</h3>
                  <ul className="space-y-2">
                    {reasoning.clientSignalsObserved.map((signal: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <ArrowRight className="w-4 h-4 text-purple-500 mt-0.5" />
                        <span className="text-gray-700">{signal}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reasoning.businessContext && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Business Context</h4>
                    <p className="text-gray-700 text-sm">{reasoning.businessContext}</p>
                  </div>
                )}
                {reasoning.timing && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Why Now</h4>
                    <p className="text-gray-700 text-sm">{reasoning.timing}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action Plan */}
        {actionPlan.actions?.length > 0 && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Zap className="w-6 h-6 text-green-600" />
              <h2 className="text-xl font-semibold text-gray-900">Your Action Plan</h2>
            </div>
            
            {actionPlan.objectives?.length > 0 && (
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-3">Objectives</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {actionPlan.objectives.map((objective: string, index: number) => (
                    <div key={index} className="bg-white p-3 rounded-lg border">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-5 h-5 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-medium">
                          {index + 1}
                        </div>
                        <span className="text-sm font-medium text-gray-900">Week {index + 1}</span>
                      </div>
                      <p className="text-sm text-gray-700">{objective}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div>
              <h3 className="font-medium text-gray-900 mb-4">Ready-to-Execute Actions</h3>
              <div className="space-y-4">
                {actionPlan.actions.map((action: any, index: number) => (
                  <div key={index} className="bg-white border rounded-lg overflow-hidden">
                    <div className="p-4 border-b bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                            action.priority === 'high' ? 'bg-red-100 text-red-700' :
                            action.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{action.action}</h4>
                            <p className="text-sm text-gray-600">{action.objective}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="w-4 h-4" />
                            <span>{action.timeline}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                            {action.method === 'email' && <Mail className="w-4 h-4" />}
                            {action.method === 'phone' && <Phone className="w-4 h-4" />}
                            {action.method === 'whatsapp' && <MessageCircle className="w-4 h-4" />}
                            <span className="capitalize">{action.method}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {action.copyPasteContent && (
                      <div className="p-4">
                        <div className="space-y-4">
                          {action.copyPasteContent.subject && (
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium text-gray-700">Subject Line</label>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => copyToClipboard(action.copyPasteContent.subject)}
                                >
                                  <Copy className="w-4 h-4 mr-1" />
                                  Copy
                                </Button>
                              </div>
                              <div className="bg-gray-50 p-3 rounded border font-mono text-sm">
                                {action.copyPasteContent.subject}
                              </div>
                            </div>
                          )}
                          
                          {action.copyPasteContent.body && (
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium text-gray-700">Email Content</label>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => copyToClipboard(action.copyPasteContent.body)}
                                >
                                  <Copy className="w-4 h-4 mr-1" />
                                  Copy
                                </Button>
                              </div>
                              <div className="bg-gray-50 p-3 rounded border font-mono text-sm whitespace-pre-wrap max-h-32 overflow-y-auto">
                                {action.copyPasteContent.body}
                              </div>
                            </div>
                          )}
                          
                          {action.copyPasteContent.script && (
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium text-gray-700">Phone Script</label>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => copyToClipboard(action.copyPasteContent.script)}
                                >
                                  <Copy className="w-4 h-4 mr-1" />
                                  Copy
                                </Button>
                              </div>
                              <div className="bg-gray-50 p-3 rounded border font-mono text-sm">
                                {action.copyPasteContent.script}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Fallback Content */}
        {!participants.clientContacts && !callSummary.overview && !keyTakeaways.length && !recommendations.primaryStrategy && !reasoning.whyTheseRecommendations && !actionPlan.actions?.length && (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Limited Intelligence Available</h3>
            <p className="text-gray-600 mb-4">
              The analysis completed but with limited actionable intelligence. This may be due to:
            </p>
            <ul className="text-left text-sm text-gray-600 max-w-md mx-auto space-y-1">
              <li>• Transcript quality or length</li>
              <li>• Limited sales conversation content</li>
              <li>• Technical issues during analysis</li>
            </ul>
            <div className="mt-6 flex gap-2 justify-center">
              <Button onClick={onBackToDashboard} variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <Button onClick={retryAnalysis} disabled={isRetrying}>
                {isRetrying ? (
                  <>
                    <LoadingSpinner />
                    <span className="ml-2">Retrying...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry Analysis
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
