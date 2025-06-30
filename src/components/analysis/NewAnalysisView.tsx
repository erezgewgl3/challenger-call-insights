import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
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
  Crown,
  ChevronDown,
  Lightbulb
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

  // Enhanced data mapping functions for hero section
  const getUrgencyLevel = () => {
    const timing = analysis.reasoning?.timing || analysis.call_summary?.timeline || ''
    const lowerTiming = timing.toLowerCase()
    
    if (lowerTiming.includes('promptly') || lowerTiming.includes('quickly') || 
        lowerTiming.includes('urgent') || lowerTiming.includes('asap') || 
        lowerTiming.includes('immediately')) {
      return { level: 'HIGH', color: 'text-red-300', temp: '🔥', bgColor: 'bg-red-500' }
    } else if (lowerTiming.includes('this month') || lowerTiming.includes('soon') || 
               lowerTiming.includes('week')) {
      return { level: 'MEDIUM', color: 'text-orange-300', temp: '🌡️', bgColor: 'bg-orange-500' }
    } else {
      return { level: 'LOW', color: 'text-blue-300', temp: '❄️', bgColor: 'bg-blue-500' }
    }
  }

  const getPrimaryContact = () => {
    if (!analysis.participants?.clientContacts || analysis.participants.clientContacts.length === 0) {
      return { name: 'Key Contact', title: 'Decision Maker', influence: 'High' }
    }
    
    // Look for high decision level or senior titles
    const decisionMakerKeywords = ['ceo', 'president', 'director', 'vp', 'head', 'chief', 'manager', 'lead']
    
    const priorityContact = analysis.participants.clientContacts.find((contact: any) => 
      contact.decisionLevel === 'high'
    ) || analysis.participants.clientContacts.find((contact: any) => {
      const title = (contact.title || '').toLowerCase()
      return decisionMakerKeywords.some(keyword => title.includes(keyword))
    }) || analysis.participants.clientContacts[0]
    
    return {
      name: priorityContact.name || 'Key Contact',
      title: priorityContact.title || 'Decision Maker',
      influence: priorityContact.decisionLevel === 'high' ? 'High' : 'Medium'
    }
  }

  const getBuyingSignals = () => {
    const positiveSignals = analysis.call_summary?.positiveSignals || []
    return {
      count: positiveSignals.length,
      total: Math.max(3, positiveSignals.length),
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
        content: action.content || action.copyPasteContent?.body || ''
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
                  <div className={`w-8 h-8 ${urgency.bgColor} rounded-lg flex items-center justify-center`}>
                    <Thermometer className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-red-200">Deal Heat</span>
                </div>
                <div className={`text-2xl font-bold ${urgency.color}`}>{urgency.temp} {urgency.level}</div>
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
          </div>
        </div>

        {/* PROGRESSIVE DISCLOSURE SECTION */}
        <div className="space-y-4">
          
          {/* Expandable Intelligence Cards */}
          <div className="space-y-4">
            
            {/* Key Insights Card */}
            {analysis.key_takeaways && analysis.key_takeaways.length > 0 && (
              <Card className="border-l-4 border-l-yellow-500">
                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="pb-2 cursor-pointer hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Lightbulb className="w-5 h-5 text-yellow-600" />
                          <CardTitle className="text-lg">Key Insights ({analysis.key_takeaways.length})</CardTitle>
                        </div>
                        <ChevronDown className="w-4 h-4" />
                      </div>
                      <p className="text-sm text-gray-600">What matters most about this conversation</p>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent>
                      <div className="space-y-3">
                        {analysis.key_takeaways.map((takeaway, index) => (
                          <div key={index} className="flex items-start gap-3">
                            <div className="w-6 h-6 bg-yellow-100 text-yellow-700 rounded-full flex items-center justify-center text-sm font-medium">
                              {index + 1}
                            </div>
                            <p className="text-gray-700">{takeaway}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            )}

            {/* Strategic Recommendations Card */}
            {analysis.recommendations && (
              <Card className="border-l-4 border-l-blue-500">
                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="pb-2 cursor-pointer hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Target className="w-5 h-5 text-blue-600" />
                          <CardTitle className="text-lg">Strategic Approach</CardTitle>
                        </div>
                        <ChevronDown className="w-4 h-4" />
                      </div>
                      <p className="text-sm text-gray-600">How to win this deal</p>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="space-y-4">
                      {analysis.recommendations.primaryStrategy && (
                        <div>
                          <h4 className="font-medium mb-2">Primary Strategy</h4>
                          <p className="text-gray-700">{analysis.recommendations.primaryStrategy}</p>
                        </div>
                      )}
                      {analysis.recommendations.competitiveStrategy && (
                        <div>
                          <h4 className="font-medium mb-2">Competitive Positioning</h4>
                          <p className="text-gray-700">{analysis.recommendations.competitiveStrategy}</p>
                        </div>
                      )}
                      {analysis.recommendations.stakeholderPlan && (
                        <div>
                          <h4 className="font-medium mb-2">Stakeholder Plan</h4>
                          <p className="text-gray-700">{analysis.recommendations.stakeholderPlan}</p>
                        </div>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            )}

            {/* Conversation Intel Card */}
            {analysis.call_summary && (
              <Card className="border-l-4 border-l-green-500">
                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="pb-2 cursor-pointer hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="w-5 h-5 text-green-600" />
                          <CardTitle className="text-lg">Conversation Intelligence</CardTitle>
                        </div>
                        <ChevronDown className="w-4 h-4" />
                      </div>
                      <p className="text-sm text-gray-600">What they revealed and what it means</p>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="space-y-4">
                      {analysis.call_summary.positiveSignals && analysis.call_summary.positiveSignals.length > 0 && (
                        <div>
                          <h4 className="font-medium text-green-600 mb-2">Positive Signals</h4>
                          <ul className="space-y-1">
                            {analysis.call_summary.positiveSignals.map((signal: string, index: number) => (
                              <li key={index} className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span className="text-gray-700">{signal}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {analysis.call_summary.clientConcerns && analysis.call_summary.clientConcerns.length > 0 && (
                        <div>
                          <h4 className="font-medium text-orange-600 mb-2">Concerns to Address</h4>
                          <ul className="space-y-1">
                            {analysis.call_summary.clientConcerns.map((concern: string, index: number) => (
                              <li key={index} className="flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-orange-500" />
                                <span className="text-gray-700">{concern}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            )}

            {/* Ready-to-Execute Actions Card */}
            {analysis.action_plan?.actions && analysis.action_plan.actions.length > 0 && (
              <Card className="border-l-4 border-l-purple-500">
                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="pb-2 cursor-pointer hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Zap className="w-5 h-5 text-purple-600" />
                          <CardTitle className="text-lg">Ready-to-Execute Actions</CardTitle>
                        </div>
                        <ChevronDown className="w-4 h-4" />
                      </div>
                      <p className="text-sm text-gray-600">Copy-paste emails and next steps</p>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent>
                      {analysis.action_plan.actions.map((action: any, index: number) => (
                        <div key={index} className="border rounded-lg p-4 mb-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium">{action.action}</h4>
                            <Badge variant="outline">{action.timeline}</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{action.objective}</p>
                          
                          {action.copyPasteContent?.subject && (
                            <div className="bg-gray-50 p-3 rounded mb-2">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium text-gray-700">Subject Line</span>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => copyToClipboard(action.copyPasteContent.subject, 'Subject line')}
                                >
                                  <Copy className="w-4 h-4 mr-1" />
                                  Copy
                                </Button>
                              </div>
                              <p className="text-sm font-mono">{action.copyPasteContent.subject}</p>
                            </div>
                          )}
                          
                          {action.copyPasteContent?.body && (
                            <div className="bg-gray-50 p-3 rounded">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium text-gray-700">Email Content</span>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => copyToClipboard(action.copyPasteContent.body, 'Email content')}
                                >
                                  <Copy className="w-4 h-4 mr-1" />
                                  Copy
                                </Button>
                              </div>
                              <p className="text-sm font-mono whitespace-pre-wrap">{action.copyPasteContent.body}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
