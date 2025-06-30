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
  CheckCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  ExternalLink,
  Target,
  Zap,
  Star
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

  const copyFullEmail = async (subject: string, body: string, attachments: string[]) => {
    const attachmentText = attachments && attachments.length > 0 
      ? `\n\nAttachments:\n${attachments.map(att => `- ${att}`).join('\n')}`
      : ''
    const fullEmail = `Subject: ${subject}\n\n${body}${attachmentText}`
    await copyToClipboard(fullEmail, 'Complete email')
  }

  const openInEmailClient = (subject: string, body: string) => {
    const encodedSubject = encodeURIComponent(subject)
    const encodedBody = encodeURIComponent(body)
    const mailtoUrl = `mailto:?subject=${encodedSubject}&body=${encodedBody}`
    window.open(mailtoUrl, '_blank')
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

  const formatParticipantDisplay = (participant: any) => {
    const { name, title, company } = participant
    
    if (!name) return null
    
    const extras = []
    if (title) extras.push(title)
    if (company) extras.push(company)
    
    return extras.length > 0 ? `${name} (${extras.join(', ')})` : name
  }

  // Helper functions to extract key information for hero section
  const getUrgencyLevel = () => {
    const timing = analysis.reasoning?.timing || analysis.call_summary?.timeline || ''
    const urgencyKeywords = {
      high: ['urgent', 'asap', 'immediately', 'critical', 'emergency', 'deadline'],
      medium: ['soon', 'week', 'month', 'quarter', 'planning'],
      low: ['future', 'eventually', 'considering', 'exploring']
    }
    
    const lowerTiming = timing.toLowerCase()
    
    if (urgencyKeywords.high.some(keyword => lowerTiming.includes(keyword))) {
      return { level: 'High Urgency', color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200' }
    } else if (urgencyKeywords.medium.some(keyword => lowerTiming.includes(keyword))) {
      return { level: 'Medium Priority', color: 'text-yellow-600', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' }
    } else {
      return { level: 'Standard Timeline', color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200' }
    }
  }

  const getPrimaryContact = () => {
    if (!analysis.participants?.clientContacts || analysis.participants.clientContacts.length === 0) {
      return null
    }
    
    // Look for decision-makers based on title keywords
    const decisionMakerKeywords = ['ceo', 'president', 'director', 'vp', 'head', 'chief', 'manager', 'lead']
    
    const sortedContacts = analysis.participants.clientContacts.sort((a: any, b: any) => {
      const aTitle = (a.title || '').toLowerCase()
      const bTitle = (b.title || '').toLowerCase()
      
      const aScore = decisionMakerKeywords.reduce((score, keyword) => 
        aTitle.includes(keyword) ? score + 1 : score, 0)
      const bScore = decisionMakerKeywords.reduce((score, keyword) => 
        bTitle.includes(keyword) ? score + 1 : score, 0)
      
      return bScore - aScore
    })
    
    return sortedContacts[0]
  }

  const getPrimaryAction = () => {
    if (analysis.action_plan?.actions && analysis.action_plan.actions.length > 0) {
      return analysis.action_plan.actions[0]
    }
    return null
  }

  const urgency = getUrgencyLevel()
  const primaryContact = getPrimaryContact()
  const primaryAction = getPrimaryAction()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="max-w-5xl mx-auto px-4 py-8">
        
        {/* Header Navigation */}
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
                <Star className="w-3 h-3 mr-1" />
                Analysis Complete
              </Badge>
            </div>
          </div>
        </div>

        <div className="space-y-8">

          {/* HERO SECTION - Sales Intelligence Dashboard */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 p-6 rounded-lg">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                <Zap className="w-5 h-5 inline mr-2 text-blue-600" />
                Sales Intelligence Summary
              </h2>
              <p className="text-slate-700">Key insights and next actions for this opportunity</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Urgency & Timeline */}
              <div className={`bg-white p-4 rounded-lg border ${urgency.borderColor} ${urgency.bgColor}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Clock className={`w-5 h-5 ${urgency.color}`} />
                  <span className={`font-semibold ${urgency.color}`}>{urgency.level}</span>
                </div>
                <p className="text-sm text-slate-700">
                  {analysis.call_summary?.timeline || analysis.reasoning?.timing || 'Timeline information not available'}
                </p>
              </div>
              
              {/* Key Contact */}
              <div className="bg-white p-4 rounded-lg border border-blue-200 bg-blue-50">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-blue-500" />
                  <span className="font-semibold text-blue-800">Priority Contact</span>
                </div>
                {primaryContact ? (
                  <>
                    <p className="font-medium text-slate-900">{primaryContact.name}</p>
                    <p className="text-sm text-slate-600">
                      {primaryContact.title && primaryContact.company 
                        ? `${primaryContact.title} at ${primaryContact.company}`
                        : primaryContact.title || primaryContact.company || 'Key decision maker'}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-slate-600">Contact information available in participants section</p>
                )}
              </div>
              
              {/* Primary Action */}
              <div className="bg-white p-4 rounded-lg border border-green-200 bg-green-50">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-green-800">Next Action</span>
                </div>
                {primaryAction ? (
                  <>
                    <Button className="w-full mb-2 bg-green-600 hover:bg-green-700" size="sm">
                      {primaryAction.action}
                    </Button>
                    <p className="text-xs text-slate-600">
                      Timeline: {primaryAction.timeline || 'As soon as possible'}
                    </p>
                  </>
                ) : (
                  <>
                    <Button className="w-full mb-2 bg-green-600 hover:bg-green-700" size="sm">
                      Follow Up
                    </Button>
                    <p className="text-xs text-slate-600">See action plan below for details</p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg border text-center">
              <div className="text-2xl font-bold text-blue-600">
                {analysis.participants?.clientContacts?.length || 0}
              </div>
              <div className="text-sm text-slate-600">Client Contacts</div>
            </div>
            <div className="bg-white p-4 rounded-lg border text-center">
              <div className="text-2xl font-bold text-green-600">
                {analysis.call_summary?.positiveSignals?.length || 0}
              </div>
              <div className="text-sm text-slate-600">Positive Signals</div>
            </div>
            <div className="bg-white p-4 rounded-lg border text-center">
              <div className="text-2xl font-bold text-amber-600">
                {analysis.call_summary?.clientConcerns?.length || 0}
              </div>
              <div className="text-sm text-slate-600">Concerns</div>
            </div>
            <div className="bg-white p-4 rounded-lg border text-center">
              <div className="text-2xl font-bold text-purple-600">
                {analysis.action_plan?.actions?.length || 0}
              </div>
              <div className="text-sm text-slate-600">Action Items</div>
            </div>
          </div>

          {/* Rest of existing sections - keep all existing detailed analysis cards */}
          
          {/* 1. Participants - Compact Display */}
          {analysis.participants && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Participants
                </CardTitle>
              </CardHeader>
              <CardContent>
                
                <div className="text-slate-900">
                  {analysis.participants.salesRep && (
                    <div className="mb-2">
                      <strong>Sales Rep:</strong> {formatParticipantDisplay(analysis.participants.salesRep)}
                    </div>
                  )}
                  {analysis.participants.clientContacts && analysis.participants.clientContacts.length > 0 && (
                    <div>
                      <strong>Client Contacts:</strong>{' '}
                      {analysis.participants.clientContacts
                        .map((contact: any) => formatParticipantDisplay(contact))
                        .filter((display: any) => display !== null)
                        .join(', ')}
                    </div>
                  )}
                </div>
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
                  
                  {analysis.call_summary.mainTopics && analysis.call_summary.mainTopics.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">Main Topics Discussed</h4>
                      <ul className="space-y-1">
                        {analysis.call_summary.mainTopics.map((topic: string, index: number) => (
                          <li key={index} className="flex items-start">
                            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                            <span className="text-slate-700">{topic}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {analysis.call_summary.clientSituation && (
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">Client Situation</h4>
                      <p className="text-slate-700 leading-relaxed">{analysis.call_summary.clientSituation}</p>
                    </div>
                  )}

                  {analysis.call_summary.clientConcerns && analysis.call_summary.clientConcerns.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">Client Concerns</h4>
                      <ul className="space-y-1">
                        {analysis.call_summary.clientConcerns.map((concern: string, index: number) => (
                          <li key={index} className="flex items-start">
                            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 mr-2 flex-shrink-0" />
                            <span className="text-slate-700">{concern}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {analysis.call_summary.positiveSignals && analysis.call_summary.positiveSignals.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">Positive Signals</h4>
                      <ul className="space-y-1">
                        {analysis.call_summary.positiveSignals.map((signal: string, index: number) => (
                          <li key={index} className="flex items-start">
                            <TrendingUp className="w-4 h-4 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                            <span className="text-slate-700">{signal}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {analysis.call_summary.budget && (
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">Budget Discussion</h4>
                      <div className="flex items-start p-3 bg-green-50 border-l-4 border-green-400 rounded-r-lg">
                        <DollarSign className="w-4 h-4 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                        <p className="text-slate-700 leading-relaxed">{analysis.call_summary.budget}</p>
                      </div>
                    </div>
                  )}

                  {analysis.call_summary.timeline && (
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">Timeline</h4>
                      <div className="flex items-start p-3 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg">
                        <Calendar className="w-4 h-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                        <p className="text-slate-700 leading-relaxed">{analysis.call_summary.timeline}</p>
                      </div>
                    </div>
                  )}

                  {analysis.call_summary.competitiveLandscape && (
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">Competitive Landscape</h4>
                      <p className="text-slate-700 leading-relaxed">{analysis.call_summary.competitiveLandscape}</p>
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
                  {analysis.recommendations.competitiveStrategy && (
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">Competitive Strategy</h4>
                      <p className="text-slate-700 leading-relaxed">{analysis.recommendations.competitiveStrategy}</p>
                    </div>
                  )}
                  
                  {analysis.recommendations.primaryStrategy && (
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">Primary Strategy</h4>
                      <p className="text-slate-700 leading-relaxed">{analysis.recommendations.primaryStrategy}</p>
                    </div>
                  )}
                  
                  {analysis.recommendations.stakeholderPlan && (
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">Stakeholder Plan</h4>
                      <p className="text-slate-700 leading-relaxed">{analysis.recommendations.stakeholderPlan}</p>
                    </div>
                  )}

                  {analysis.recommendations.riskMitigation && (
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">Risk Mitigation</h4>
                      <p className="text-slate-700 leading-relaxed">{analysis.recommendations.riskMitigation}</p>
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
                  {analysis.reasoning.businessContext && (
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">Business Context</h4>
                      <p className="text-slate-700 leading-relaxed">{analysis.reasoning.businessContext}</p>
                    </div>
                  )}
                  
                  {analysis.reasoning.timing && (
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">Timing Considerations</h4>
                      <div className="flex items-start p-3 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg">
                        <Clock className="w-4 h-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                        <p className="text-slate-700 leading-relaxed">{analysis.reasoning.timing}</p>
                      </div>
                    </div>
                  )}
                  
                  {analysis.reasoning.clientSignalsObserved && analysis.reasoning.clientSignalsObserved.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">Client Signals Observed</h4>
                      <ul className="space-y-1">
                        {analysis.reasoning.clientSignalsObserved.map((signal: string, index: number) => (
                          <li key={index} className="flex items-start">
                            <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                            <span className="text-slate-700">{signal}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {analysis.reasoning.whyTheseRecommendations && (
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">Why These Recommendations</h4>
                      <p className="text-slate-700 leading-relaxed">{analysis.reasoning.whyTheseRecommendations}</p>
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
                                <h5 className="font-medium text-slate-900 mb-1">
                                  {action.objective ? `${action.action}: ${action.objective}` : action.action}
                                </h5>
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

          {/* Email Follow-up Suggestions */}
          {analysis.action_plan?.actions?.some((action: any) => action.copyPasteContent?.subject) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Mail className="w-5 h-5 mr-2" />
                  Email Follow-up Suggestions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysis.action_plan.actions
                    .filter((action: any) => action.copyPasteContent?.subject)
                    .map((action: any, index: number) => (
                      <div key={index} className="border border-slate-200 rounded-lg p-4 bg-white">
                        <div className="space-y-4">
                          {/* Email Subject */}
                          <div>
                            <h5 className="font-semibold text-slate-900 mb-2">Subject Line</h5>
                            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                              <p className="text-slate-900 font-medium">{action.copyPasteContent.subject}</p>
                            </div>
                          </div>

                          {/* Email Body */}
                          {action.copyPasteContent.body && (
                            <div>
                              <h5 className="font-semibold text-slate-900 mb-2">Email Content</h5>
                              <div className="p-3 bg-slate-50 rounded-lg border max-h-48 overflow-y-auto">
                                <div className="text-slate-800 text-sm leading-relaxed whitespace-pre-wrap">
                                  {action.copyPasteContent.body}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Attachments */}
                          {action.copyPasteContent.attachments && action.copyPasteContent.attachments.length > 0 && (
                            <div>
                              <h5 className="font-semibold text-slate-900 mb-2">Suggested Attachments</h5>
                              <ul className="space-y-1">
                                {action.copyPasteContent.attachments.map((attachment: string, attIndex: number) => (
                                  <li key={attIndex} className="flex items-start">
                                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                                    <span className="text-slate-700 text-sm">{attachment}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex flex-wrap gap-2 pt-4 border-t">
                            {action.copyPasteContent.body && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openInEmailClient(action.copyPasteContent.subject, action.copyPasteContent.body)}
                                className="h-8"
                              >
                                <ExternalLink className="w-3 h-3 mr-1" />
                                Open in Email
                              </Button>
                            )}
                            
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyFullEmail(
                                action.copyPasteContent.subject, 
                                action.copyPasteContent.body || '', 
                                action.copyPasteContent.attachments || []
                              )}
                              className="h-8"
                            >
                              <Copy className="w-3 h-3 mr-1" />
                              Copy All
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </div>
  )
}
