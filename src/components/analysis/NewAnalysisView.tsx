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
  Star,
  Thermometer,
  Crown
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
      high: ['urgent', 'asap', 'immediately', 'critical', 'emergency', 'deadline', 'promptly'],
      medium: ['soon', 'week', 'month', 'quarter', 'planning'],
      low: ['future', 'eventually', 'considering', 'exploring']
    }
    
    const lowerTiming = timing.toLowerCase()
    
    if (urgencyKeywords.high.some(keyword => lowerTiming.includes(keyword))) {
      return { level: 'HIGH', color: 'text-red-300', temp: '🔥' }
    } else if (urgencyKeywords.medium.some(keyword => lowerTiming.includes(keyword))) {
      return { level: 'MEDIUM', color: 'text-yellow-300', temp: '🌡️' }
    } else {
      return { level: 'LOW', color: 'text-green-300', temp: '❄️' }
    }
  }

  const getPrimaryContact = () => {
    if (!analysis.participants?.clientContacts || analysis.participants.clientContacts.length === 0) {
      return { name: 'Key Contact', title: 'Decision Maker', influence: 'High' }
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
    
    const contact = sortedContacts[0]
    return {
      name: contact.name || 'Key Contact',
      title: contact.title || 'Decision Maker',
      influence: 'High'
    }
  }

  const getBuyingSignals = () => {
    const positiveSignals = analysis.call_summary?.positiveSignals || []
    return {
      count: positiveSignals.length,
      total: 3,
      status: positiveSignals.length >= 3 ? 'Strong' : positiveSignals.length >= 2 ? 'Good' : 'Weak'
    }
  }

  const getPrimaryAction = () => {
    if (analysis.action_plan?.actions && analysis.action_plan.actions.length > 0) {
      const action = analysis.action_plan.actions[0]
      return {
        action: action.action || 'Follow Up',
        objective: action.objective || 'Continue the conversation',
        timeline: action.timeline || 'Within 24 hours',
        content: action.content || ''
      }
    }
    return {
      action: 'Follow Up',
      objective: 'Continue the conversation',
      timeline: 'Within 24 hours',
      content: ''
    }
  }

  const urgency = getUrgencyLevel()
  const primaryContact = getPrimaryContact()
  const buyingSignals = getBuyingSignals()
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

          {/* ELITE HERO SECTION - "YOUR SALES EDGE" */}
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white p-8 rounded-2xl mb-8">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.15),transparent_50%)]"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(168,85,247,0.1),transparent_50%)]"></div>
            
            <div className="relative z-10">
              {/* Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Your Sales Edge</h2>
                  <p className="text-blue-200 text-sm">Intelligence extracted from your conversation</p>
                </div>
              </div>

              {/* Main Intelligence Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                
                {/* Deal Temperature */}
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                      <Thermometer className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-red-200">Deal Heat</span>
                  </div>
                  <div className="text-2xl font-bold text-red-300">{urgency.temp} {urgency.level}</div>
                  <p className="text-xs text-gray-300 mt-1">
                    {urgency.level === 'HIGH' ? 'Immediate attention needed' : 
                     urgency.level === 'MEDIUM' ? 'Good momentum building' : 
                     'Long-term opportunity'}
                  </p>
                </div>

                {/* Key Contact */}
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                      <Crown className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-blue-200">Decision Maker</span>
                  </div>
                  <div className="text-lg font-bold">{primaryContact.name}</div>
                  <p className="text-xs text-gray-300">{primaryContact.title} • {primaryContact.influence} Influence</p>
                </div>

                {/* Buying Signals */}
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-green-200">Buying Signals</span>
                  </div>
                  <div className="text-2xl font-bold text-green-300">{buyingSignals.count}/{buyingSignals.total}</div>
                  <p className="text-xs text-gray-300 mt-1">{buyingSignals.status} positive indicators</p>
                </div>

                {/* Timeline */}
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                      <Clock className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-orange-200">Timeline</span>
                  </div>
                  <div className="text-lg font-bold text-orange-300">
                    {urgency.level === 'HIGH' ? 'ASAP' : urgency.level === 'MEDIUM' ? 'This Week' : 'This Month'}
                  </div>
                  <p className="text-xs text-gray-300">
                    {analysis.call_summary?.timeline ? 
                      analysis.call_summary.timeline.substring(0, 25) + (analysis.call_summary.timeline.length > 25 ? '...' : '') :
                      'Timeline from analysis'
                    }
                  </p>
                </div>
              </div>

              {/* Primary Action Section */}
              <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/30 rounded-xl p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-5 h-5 text-green-300" />
                      <span className="text-green-200 font-medium">Your Move</span>
                    </div>
                    <h3 className="text-xl font-bold mb-2">{primaryAction.action}</h3>
                    <p className="text-gray-300 text-sm mb-4">
                      {primaryAction.objective || 'Take the next step to advance this opportunity.'}
                    </p>
                    
                    <div className="flex flex-wrap gap-3">
                      <Button 
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2"
                        onClick={() => primaryAction.content && copyToClipboard(primaryAction.content, 'Action content')}
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        Send Email Now
                      </Button>
                      <Button 
                        variant="outline" 
                        className="border-green-400 text-green-300 hover:bg-green-400/10"
                        onClick={() => primaryAction.content && copyToClipboard(primaryAction.content, 'Template')}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Template
                      </Button>
                      <Button variant="outline" className="border-blue-400 text-blue-300 hover:bg-blue-400/10">
                        <Calendar className="w-4 h-4 mr-2" />
                        Schedule Follow-up
                      </Button>
                    </div>
                  </div>
                  
                  <div className="text-right ml-6">
                    <div className="text-xs text-gray-400 mb-1">Recommended Timing</div>
                    <div className="text-lg font-bold text-green-300">{primaryAction.timeline}</div>
                    <div className="w-12 h-1 bg-green-500 rounded-full mt-2"></div>
                  </div>
                </div>
              </div>

              {/* Intelligence Summary */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-gray-300">
                    {analysis.participants?.clientContacts?.length > 1 ? 'Multiple stakeholders engaged' : 'Key stakeholder identified'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-400" />
                  <span className="text-gray-300">
                    {analysis.call_summary?.clientConcerns?.length > 0 ? 'Concerns identified' : 'No major concerns'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-400" />
                  <span className="text-gray-300">
                    {analysis.call_summary?.positiveSignals?.length > 0 ? 'Positive momentum confirmed' : 'Opportunity identified'}
                  </span>
                </div>
              </div>
            </div>
          </div>

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
