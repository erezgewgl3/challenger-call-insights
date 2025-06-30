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
  Lightbulb,
  FileText
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

  // Enhanced stakeholder role mapping function
  const getStakeholderDisplay = (contact: any) => {
    // Primary: Use enhanced challengerRole if available
    const challengerRole = contact.challengerRole?.toLowerCase();
    
    if (challengerRole) {
      const roleMap = {
        'economic': { label: 'Economic', color: 'bg-red-500/20 text-red-300', icon: '🏛️' },
        'user': { label: 'User', color: 'bg-blue-500/20 text-blue-300', icon: '👤' },
        'technical': { label: 'Technical', color: 'bg-purple-500/20 text-purple-300', icon: '🔧' },
        'coach': { label: 'Coach', color: 'bg-green-500/20 text-green-300', icon: '🤝' },
        'influencer': { label: 'Influencer', color: 'bg-yellow-500/20 text-yellow-300', icon: '📊' },
        'blocker': { label: 'Blocker', color: 'bg-orange-500/20 text-orange-300', icon: '🚫' }
      };
      
      return roleMap[challengerRole] || { 
        label: 'Contact', 
        color: 'bg-gray-500/20 text-gray-300', 
        icon: '👥' 
      };
    }
    
    // Fallback: Use existing decisionLevel mapping
    const decisionLevel = contact.decisionLevel?.toLowerCase();
    const fallbackMap = {
      'high': { label: 'Key', color: 'bg-red-500/20 text-red-300', icon: '⭐' },
      'medium': { label: 'Inf', color: 'bg-yellow-500/20 text-yellow-300', icon: '📈' },
      'low': { label: 'Low', color: 'bg-gray-500/20 text-gray-300', icon: '📋' }
    };
    
    return fallbackMap[decisionLevel] || { 
      label: 'Contact', 
      color: 'bg-gray-500/20 text-gray-300', 
      icon: '👥' 
    };
  };

  // Enhanced data mapping functions for hero section
  const getDealHeat = () => {
    // Use enhanced pain severity analysis
    const painLevel = analysis.call_summary?.painSeverity?.level || 'low'
    const indicators = analysis.call_summary?.painSeverity?.indicators || []
    const businessImpact = analysis.call_summary?.painSeverity?.businessImpact || ''
    
    const urgencyFactors = analysis.call_summary?.urgencyDrivers?.factors || []
    
    // Calculate heat based on pain + urgency
    let heatLevel = 'LOW'
    let emoji = '❄️'
    let description = 'Long-term opportunity'
    
    if (painLevel === 'high' || urgencyFactors.length >= 3) {
      heatLevel = 'HIGH'
      emoji = '🔥'
      description = 'Immediate attention needed'
    } else if (painLevel === 'medium' || urgencyFactors.length >= 2) {
      heatLevel = 'MEDIUM'
      emoji = '🌡️'
      description = 'Active opportunity'
    }
    
    return {
      level: heatLevel,
      emoji,
      description,
      evidence: indicators.slice(0, 2), // Top 2 pain indicators
      businessImpact,
      bgColor: heatLevel === 'HIGH' ? 'bg-red-500' : heatLevel === 'MEDIUM' ? 'bg-orange-500' : 'bg-blue-500',
      color: heatLevel === 'HIGH' ? 'text-red-300' : heatLevel === 'MEDIUM' ? 'text-orange-300' : 'text-blue-300'
    }
  }

  const getDecisionMaker = () => {
    const contacts = analysis.participants?.clientContacts || []
    
    if (contacts.length === 0) {
      return {
        name: 'Key Contact',
        title: 'To be identified',
        influence: 'Unknown',
        confidence: 'Low',
        evidence: []
      }
    }
    
    // Score contacts based on behavioral evidence
    const scoredContacts = contacts.map((contact: any) => {
      const evidence = contact.decisionEvidence || []
      const decisionLevel = contact.decisionLevel || 'low'
      
      let authorityScore = 0
      
      // Score based on behavioral evidence
      evidence.forEach((ev: string) => {
        const evidence_lower = ev.toLowerCase()
        if (evidence_lower.includes('budget') || evidence_lower.includes('approval')) {
          authorityScore += 4
        } else if (evidence_lower.includes('timeline') || evidence_lower.includes('decision')) {
          authorityScore += 3
        } else if (evidence_lower.includes('deferred') || evidence_lower.includes('strategic')) {
          authorityScore += 2
        } else {
          authorityScore += 1
        }
      })
      
      // Add declared decision level
      if (decisionLevel === 'high') authorityScore += 3
      else if (decisionLevel === 'medium') authorityScore += 1
      
      const confidence = authorityScore >= 6 ? 'High' : 
                       authorityScore >= 3 ? 'Medium' : 'Low'
      
      return {
        ...contact,
        authorityScore,
        confidence,
        evidence
      }
    })
    
    // Return highest scoring contact
    const topContact = scoredContacts.sort((a, b) => b.authorityScore - a.authorityScore)[0]
    
    return {
      name: topContact.name || 'Key Contact',
      title: topContact.title || 'Decision Maker',
      influence: `${topContact.confidence} Influence`,
      confidence: topContact.confidence,
      evidence: topContact.evidence.slice(0, 1) // Show top evidence
    }
  }

  const getBuyingSignals = () => {
    const signalsAnalysis = analysis.call_summary?.buyingSignalsAnalysis || {}
    
    const commitmentSignals = signalsAnalysis.commitmentSignals || []
    const engagementSignals = signalsAnalysis.engagementSignals || []
    const interestSignals = signalsAnalysis.interestSignals || []
    
    // Calculate weighted score
    const commitmentScore = commitmentSignals.length * 3 // High value
    const engagementScore = engagementSignals.length * 2  // Medium value  
    const interestScore = interestSignals.length * 1      // Low value
    
    const totalScore = commitmentScore + engagementScore + interestScore
    const totalSignals = commitmentSignals.length + engagementSignals.length + interestSignals.length
    
    // Determine signal strength
    let strength = 'Weak'
    let color = 'red'
    
    if (commitmentSignals.length >= 2 || totalScore >= 8) {
      strength = 'Strong'
      color = 'green'
    } else if (commitmentSignals.length >= 1 || totalScore >= 4) {
      strength = 'Good'
      color = 'yellow'
    }
    
    return {
      count: totalSignals,
      total: Math.max(totalSignals, 3), // Show at least 3 for display
      strength: `${strength} positive indicators`,
      commitmentCount: commitmentSignals.length,
      qualityScore: totalScore,
      color
    }
  }

  const getTimeline = () => {
    const timelineAnalysis = analysis.call_summary?.timelineAnalysis || {}
    const urgencyDrivers = analysis.call_summary?.urgencyDrivers || {}
    
    const statedTimeline = timelineAnalysis.statedTimeline || ''
    const businessDriver = timelineAnalysis.businessDriver || urgencyDrivers.primary || ''
    const flexibility = timelineAnalysis.flexibility || 'medium'
    const consequences = timelineAnalysis.consequences || ''
    
    // Extract timeline display
    let displayTimeline = 'This Month'
    let urgencyLevel = 'LOW'
    
    if (statedTimeline) {
      // Use actual stated timeline
      displayTimeline = statedTimeline.length > 20 ? 
        statedTimeline.substring(0, 20) + '...' : statedTimeline
      
      // Determine urgency from flexibility and consequences
      if (flexibility === 'low' || consequences.toLowerCase().includes('critical')) {
        urgencyLevel = 'HIGH'
      } else if (flexibility === 'medium' || businessDriver) {
        urgencyLevel = 'MEDIUM'
      }
    } else {
      // Fallback to urgency drivers
      const urgencyFactors = urgencyDrivers.factors || []
      if (urgencyFactors.length >= 3) {
        displayTimeline = 'ASAP'
        urgencyLevel = 'HIGH'
      } else if (urgencyFactors.length >= 2) {
        displayTimeline = 'This Week'
        urgencyLevel = 'MEDIUM'
      }
    }
    
    return {
      timeline: displayTimeline,
      urgency: urgencyLevel,
      driver: businessDriver,
      flexibility,
      description: businessDriver || 'Timeline from analysis'
    }
  }

  const dealHeat = getDealHeat()
  const decisionMaker = getDecisionMaker()
  const buyingSignals = getBuyingSignals()
  const timeline = getTimeline()

  // Extract participants data for the new section
  const participants = analysis.participants || {}

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
              <span>Meeting/Call Duration: {transcript.duration_minutes} min</span>
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
                  <div className={`w-8 h-8 ${dealHeat.bgColor} rounded-lg flex items-center justify-center`}>
                    <Thermometer className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-red-200">Deal Heat</span>
                </div>
                <div className={`text-2xl font-bold ${dealHeat.color}`}>{dealHeat.emoji} {dealHeat.level}</div>
                <p className="text-xs text-gray-300 mt-1">{dealHeat.description}</p>
              </div>

              {/* Key Contact */}
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                    <Crown className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-blue-200">Decision Maker</span>
                </div>
                <div className="text-lg font-bold">{decisionMaker.name}</div>
                <p className="text-xs text-gray-300">{decisionMaker.title} • {decisionMaker.influence}</p>
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
                <p className="text-xs text-gray-300 mt-1">{buyingSignals.strength}</p>
              </div>

              {/* Timeline */}
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                    <Clock className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-orange-200">Timeline</span>
                </div>
                <div className="text-lg font-bold text-orange-300">{timeline.timeline}</div>
                <p className="text-xs text-gray-300">{timeline.description}</p>
              </div>
            </div>

            {/* Ultra Compact Participants Section */}
            <div className="mt-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-6 h-6 bg-purple-500 rounded-lg flex items-center justify-center">
                  <Users className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-base font-semibold text-white">Meeting Participants</h3>
              </div>
              
              <div className="text-sm text-white">
                <span className="text-blue-200 font-medium">Participants:</span> {participants?.salesRep?.name || 'Sales Representative'}
                {participants?.clientContacts && participants.clientContacts.length > 0 && (
                  <>
                    {', '}
                    {participants.clientContacts.map((contact: any, index: number) => {
                      const stakeholder = getStakeholderDisplay(contact);
                      const displayName = contact.name + (contact.title ? ` (${contact.title})` : '');
                      
                      return (
                        <span key={index}>
                          {displayName}
                          <span className={`ml-2 text-xs px-2 py-1 rounded-full ${stakeholder.color} font-medium`}>
                            {stakeholder.icon} {stakeholder.label}
                          </span>
                          {index < participants.clientContacts.length - 1 && ', '}
                        </span>
                      );
                    })}
                  </>
                )}
                {(!participants?.clientContacts || participants.clientContacts.length === 0) && (
                  <span className="text-xs text-gray-400 italic"> • No client contacts identified</span>
                )}
              </div>
            </div>

            {/* Call Summary Section */}
            <div className="mt-6 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white">Call Summary</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-gray-200 leading-relaxed">
                    {analysis.call_summary?.overview || 'This conversation provided valuable insights into the client\'s needs and current challenges.'}
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-300 mb-2">Client Situation</h4>
                    <p className="text-gray-200 text-sm">
                      {analysis.call_summary?.clientSituation || 'Client shared their current business context and challenges.'}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-300 mb-2">Main Topics</h4>
                    <ul className="space-y-1">
                      {(analysis.call_summary?.mainTopics || ['Business needs discussed', 'Solution options explored', 'Next steps identified']).slice(0, 3).map((topic, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                          <span className="text-gray-200 text-sm">{topic}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Intelligence Summary */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-gray-300">Multiple stakeholders engaged</span>
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
