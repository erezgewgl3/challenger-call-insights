
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  ArrowLeft, 
  Upload, 
  Copy,
  Users,
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  CheckCircle
} from 'lucide-react'
import { toast } from 'sonner'

interface AnalysisData {
  id: string
  participants?: any
  call_summary?: any
  key_takeaways?: string[]
  recommendations?: any
  reasoning?: any
  action_plan?: any
}

interface TranscriptData {
  id: string
  title: string
  participants: string[]
  duration_minutes: number
  meeting_date: string
}

interface NewAnalysisViewProps {
  transcript: TranscriptData
  analysis: AnalysisData
  onBackToDashboard: () => void
  onUploadAnother: () => void
}

export function NewAnalysisView({ 
  transcript, 
  analysis, 
  onBackToDashboard, 
  onUploadAnother 
}: NewAnalysisViewProps) {
  
  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`${type} copied to clipboard!`)
    } catch (error) {
      toast.error('Failed to copy to clipboard')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getMethodIcon = (method: string) => {
    switch (method?.toLowerCase()) {
      case 'email':
        return <Mail className="w-4 h-4" />
      case 'phone':
        return <Phone className="w-4 h-4" />
      case 'whatsapp':
        return <MessageSquare className="w-4 h-4" />
      default:
        return <Mail className="w-4 h-4" />
    }
  }

  const getMethodColor = (method: string) => {
    switch (method?.toLowerCase()) {
      case 'email':
        return 'bg-blue-100 text-blue-800'
      case 'phone':
        return 'bg-green-100 text-green-800'
      case 'whatsapp':
        return 'bg-emerald-100 text-emerald-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const renderParticipants = (participants: any) => {
    if (!participants) return null

    // Handle different data types the AI might return
    if (typeof participants === 'string') {
      return <p className="text-slate-700">{participants}</p>
    }

    if (Array.isArray(participants)) {
      return (
        <div className="space-y-2">
          {participants.map((participant, index) => (
            <div key={index} className="p-3 bg-slate-50 rounded-lg">
              <div className="font-medium">
                {typeof participant === 'object' ? JSON.stringify(participant) : participant}
              </div>
            </div>
          ))}
        </div>
      )
    }

    if (typeof participants === 'object') {
      return (
        <div className="space-y-2">
          {Object.entries(participants).map(([key, value], index) => (
            <div key={index} className="p-3 bg-slate-50 rounded-lg">
              <div className="font-medium">{key}</div>
              <div className="text-sm text-slate-600">
                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
              </div>
            </div>
          ))}
        </div>
      )
    }

    return <p className="text-slate-700">{String(participants)}</p>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="max-w-5xl mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Button 
              variant="ghost" 
              onClick={onBackToDashboard}
              className="text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            
            <Button 
              onClick={onUploadAnother}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Another
            </Button>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-slate-900">{transcript.title}</h1>
            <div className="flex items-center space-x-4 text-sm text-slate-600">
              <span>{formatDate(transcript.meeting_date)}</span>
              <span>•</span>
              <span>{transcript.duration_minutes} minutes</span>
              <span>•</span>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Analysis Complete
              </Badge>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          
          {/* 1. Participants - Display exactly as stored */}
          {analysis.participants && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Participants
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderParticipants(analysis.participants)}
              </CardContent>
            </Card>
          )}

          {/* 2. Detailed Call Summary */}
          {analysis.call_summary && (
            <Card>
              <CardHeader>
                <CardTitle>Detailed Call Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysis.call_summary.overview && (
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">Overview</h4>
                      <p className="text-slate-700 leading-relaxed">{analysis.call_summary.overview}</p>
                    </div>
                  )}
                  
                  {analysis.call_summary.main_topics && analysis.call_summary.main_topics.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">Main Topics Discussed</h4>
                      <ul className="space-y-1">
                        {analysis.call_summary.main_topics.map((topic: string, index: number) => (
                          <li key={index} className="flex items-start">
                            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                            <span className="text-slate-700">{topic}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {analysis.call_summary.client_situation && (
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">Client Situation</h4>
                      <p className="text-slate-700 leading-relaxed">{analysis.call_summary.client_situation}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 3. Key Takeaways */}
          {analysis.key_takeaways && analysis.key_takeaways.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Key Takeaways</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysis.key_takeaways.map((takeaway, index) => (
                    <div key={index} className="flex items-start p-4 bg-amber-50 border-l-4 border-amber-400 rounded-r-lg">
                      <div className="flex-shrink-0 w-6 h-6 bg-amber-400 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                        {index + 1}
                      </div>
                      <p className="text-slate-800 leading-relaxed">{takeaway}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 4. Recommendations */}
          {analysis.recommendations && (
            <Card>
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysis.recommendations.competitive_strategy && (
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">Competitive Strategy</h4>
                      <p className="text-slate-700 leading-relaxed">{analysis.recommendations.competitive_strategy}</p>
                    </div>
                  )}
                  
                  {analysis.recommendations.primary_strategy && (
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">Primary Strategy</h4>
                      <p className="text-slate-700 leading-relaxed">{analysis.recommendations.primary_strategy}</p>
                    </div>
                  )}
                  
                  {analysis.recommendations.stakeholder_plan && (
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">Stakeholder Plan</h4>
                      <p className="text-slate-700 leading-relaxed">{analysis.recommendations.stakeholder_plan}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 5. Here's Why (Reasoning) */}
          {analysis.reasoning && (
            <Card>
              <CardHeader>
                <CardTitle>Here's Why</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysis.reasoning.business_context && (
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">Business Context</h4>
                      <p className="text-slate-700 leading-relaxed">{analysis.reasoning.business_context}</p>
                    </div>
                  )}
                  
                  {analysis.reasoning.client_signals_observed && analysis.reasoning.client_signals_observed.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">Client Signals Observed</h4>
                      <ul className="space-y-1">
                        {analysis.reasoning.client_signals_observed.map((signal: string, index: number) => (
                          <li key={index} className="flex items-start">
                            <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                            <span className="text-slate-700">{signal}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {analysis.reasoning.why_these_recommendations && (
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">Why These Recommendations</h4>
                      <p className="text-slate-700 leading-relaxed">{analysis.reasoning.why_these_recommendations}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 6. Proposed Follow-up Plan */}
          {analysis.action_plan && (
            <Card>
              <CardHeader>
                <CardTitle>Proposed Follow-up Plan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {analysis.action_plan.key_objectives && (
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">Key Objectives</h4>
                      <p className="text-slate-700 leading-relaxed">{analysis.action_plan.key_objectives}</p>
                    </div>
                  )}
                  
                  {analysis.action_plan.actions && analysis.action_plan.actions.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-4">Action Items</h4>
                      <div className="space-y-4">
                        {analysis.action_plan.actions.map((action: any, index: number) => (
                          <div key={index} className="border border-slate-200 rounded-lg p-4 bg-white">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h5 className="font-medium text-slate-900 mb-1">{action.action}</h5>
                                <div className="flex items-center space-x-4 text-sm text-slate-600">
                                  <div className="flex items-center">
                                    <Calendar className="w-4 h-4 mr-1" />
                                    {action.timeline}
                                  </div>
                                  <Badge 
                                    variant="secondary" 
                                    className={`${getMethodColor(action.method)} flex items-center`}
                                  >
                                    {getMethodIcon(action.method)}
                                    <span className="ml-1">{action.method}</span>
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            
                            {action.content && (
                              <div className="mt-3 p-3 bg-slate-50 rounded border">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium text-slate-700">Suggested Content:</span>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => copyToClipboard(action.content, 'Content')}
                                    className="h-7 px-2"
                                  >
                                    <Copy className="w-3 h-3 mr-1" />
                                    Copy
                                  </Button>
                                </div>
                                <div className="text-sm text-slate-800 whitespace-pre-wrap">{action.content}</div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </div>
  )
}
