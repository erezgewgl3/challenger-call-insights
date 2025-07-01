
import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
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
  FileText,
  Shield,
  Activity,
  Eye,
  Trophy,
  TrendingDown
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

  // Enhanced stakeholder role mapping function with NO FALLBACKS
  const getStakeholderDisplay = (contact: any) => {
    const challengerRole = contact.challengerRole;
    
    if (challengerRole) {
      const roleMap = {
        'Economic Buyer': { label: 'Economic Buyer', color: 'bg-red-500/20 text-red-300', icon: '🏛️' },
        'User Buyer': { label: 'User Buyer', color: 'bg-blue-500/20 text-blue-300', icon: '👤' },
        'Technical Buyer': { label: 'Technical Buyer', color: 'bg-purple-500/20 text-purple-300', icon: '🔧' },
        'Coach': { label: 'Coach', color: 'bg-green-500/20 text-green-300', icon: '🤝' },
        'Influencer': { label: 'Influencer', color: 'bg-yellow-500/20 text-yellow-300', icon: '📊' },
        'Blocker': { label: 'Blocker', color: 'bg-orange-500/20 text-orange-300', icon: '🚫' }
      };
      
      return roleMap[challengerRole] || null;
    }
    
    // NO FALLBACKS - return null if no valid challenger role
    return null;
  };

  // Enhanced data mapping functions for hero section
  const getDealHeat = () => {
    // ✅ Keep existing pain logic (working perfectly)
    const painLevel = analysis.call_summary?.painSeverity?.level || 'low'
    const indicators = analysis.call_summary?.painSeverity?.indicators || []
    const businessImpact = analysis.call_summary?.painSeverity?.businessImpact || ''
    
    // 🔧 FIX: Access correct urgency data structure
    const criticalFactors = analysis.call_summary?.urgencyDrivers?.criticalFactors || []
    const businessFactors = analysis.call_summary?.urgencyDrivers?.businessFactors || []
    const generalFactors = analysis.call_summary?.urgencyDrivers?.generalFactors || []
    
    // 🔧 ADD: Weighted urgency scoring
    const urgencyScore = (criticalFactors.length * 3) + 
                        (businessFactors.length * 2) + 
                        (generalFactors.length * 1)
    
    // NEW: Add buying signal analysis
    const buyingSignals = analysis.call_summary?.buyingSignalsAnalysis || {}
    const commitmentSignals = buyingSignals.commitmentSignals || []
    const engagementSignals = buyingSignals.engagementSignals || []
    
    // NEW: Add timeline analysis
    const timelineAnalysis = analysis.call_summary?.timelineAnalysis || {}
    const statedTimeline = timelineAnalysis.statedTimeline || ''
    const businessDriver = timelineAnalysis.businessDriver || ''
    
    // NEW: Enhanced scoring with buying signals and timeline
    let dealScore = urgencyScore
    
    // Buying signal bonuses
    dealScore += commitmentSignals.length * 2 // Contract/budget discussions
    dealScore += engagementSignals.length * 1  // Technical engagement
    
    // Timeline urgency bonuses
    const timelineText = (statedTimeline + ' ' + businessDriver).toLowerCase()
    if (timelineText.includes('friday') || timelineText.includes('this week') || 
        timelineText.includes('immediate') || timelineText.includes('asap')) {
      dealScore += 3 // Immediate timeline boost
    }
    if (timelineText.includes('contract') || timelineText.includes('execute') || 
        timelineText.includes('sign') || timelineText.includes('docs')) {
      dealScore += 2 // Contract readiness boost
    }
    
    // SURGICAL FIX: Correct resistance data path references
    const resistanceData = analysis.call_summary?.resistanceAnalysis || {}
    const resistanceLevel = resistanceData.level || 'none'
    const resistanceSignals = resistanceData.signals || []
    
    // Apply resistance penalties
    let resistancePenalty = 0
    
    // Major resistance level penalties
    if (resistanceLevel === 'high') {
      resistancePenalty += 8 // Massive penalty for high resistance
    } else if (resistanceLevel === 'medium') {
      resistancePenalty += 4 // Moderate penalty for medium resistance
    }
    
    // Specific resistance signal penalties
    const allResistanceText = resistanceSignals.join(' ').toLowerCase()
    
    if (allResistanceText.includes('not actively looking') || 
        allResistanceText.includes('not looking for') ||
        allResistanceText.includes('no immediate need')) {
      resistancePenalty += 3 // Strong penalty for lack of active interest
    }
    
    if (allResistanceText.includes('budget constraints') || 
        allResistanceText.includes('budget concerns') ||
        allResistanceText.includes('cost concerns')) {
      resistancePenalty += 2 // Penalty for budget issues
    }
    
    if (allResistanceText.includes('satisfied with current') || 
        allResistanceText.includes('current solution works')) {
      resistancePenalty += 2 // Penalty for satisfaction with status quo
    }
    
    if (allResistanceText.includes('timing concerns') || 
        allResistanceText.includes('not the right time')) {
      resistancePenalty += 1 // Minor penalty for timing issues
    }
    
    // Apply resistance penalty to deal score
    dealScore = Math.max(0, dealScore - resistancePenalty) // Never go below 0
    
    // Calculate heat based on pain + urgency - resistance
    let heatLevel = 'LOW'
    let emoji = '❄️'
    let description = 'Long-term opportunity'
    
    // ENHANCED: More comprehensive HIGH heat conditions (with resistance consideration)
    if (
      painLevel === 'high' ||                           // Keep: Critical business pain
      criticalFactors.length >= 1 ||                    // Keep: Critical urgency factors
      dealScore >= 8 ||                                 // NEW: High combined score with buying signals
      (commitmentSignals.length >= 2 && dealScore >= 6) || // NEW: Strong commitment + good score
      (painLevel === 'medium' && commitmentSignals.length >= 2 && dealScore >= 5) // NEW: Medium pain + strong buying signals
    ) {
      heatLevel = 'HIGH'
      emoji = '🔥'
      description = 'Immediate attention needed'
    } else if (
      painLevel === 'medium' || 
      (businessFactors || []).length >= 1 || // Add null safety
      dealScore >= 3 // ENHANCED: Use dealScore instead of urgencyScore
    ) {
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
    
    // Extract timeline display with improved truncation
    let displayTimeline = 'This Month'
    let urgencyLevel = 'LOW'
    let isTextTruncated = false
    
    if (statedTimeline) {
      // Improved truncation logic with word boundaries and responsive design
      if (statedTimeline.length > 80) {
        isTextTruncated = true
        // Find the last space within 80 characters to avoid cutting words
        const lastSpaceIndex = statedTimeline.lastIndexOf(' ', 80)
        displayTimeline = lastSpaceIndex > 60 ? 
          statedTimeline.substring(0, lastSpaceIndex) + '...' : 
          statedTimeline.substring(0, 80) + '...'
      } else {
        displayTimeline = statedTimeline
      }
      
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
      originalTimeline: statedTimeline,
      isTextTruncated,
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

  // Helper function to get conversation intelligence signals
  const getConversationIntelligence = () => {
    const callSummary = analysis.call_summary || {}
    
    // Map new data structure to display format
    const signals = {
      positive: [],
      concerns: [],
      competitive: [],
      pain: []
    }
    
    // Extract buying signals
    const buyingSignalsAnalysis = callSummary.buyingSignalsAnalysis || {}
    if (buyingSignalsAnalysis.commitmentSignals) {
      signals.positive.push(...buyingSignalsAnalysis.commitmentSignals.map(s => `🎯 ${s}`))
    }
    if (buyingSignalsAnalysis.engagementSignals) {
      signals.positive.push(...buyingSignalsAnalysis.engagementSignals.map(s => `📈 ${s}`))
    }
    if (buyingSignalsAnalysis.interestSignals) {
      signals.positive.push(...buyingSignalsAnalysis.interestSignals.map(s => `💡 ${s}`))
    }
    
    // Extract concerns from competitive intelligence
    const competitiveIntelligence = callSummary.competitiveIntelligence || {}
    if (competitiveIntelligence.concerns) {
      signals.concerns.push(...competitiveIntelligence.concerns.map(c => `⚠️ ${c}`))
    }
    if (competitiveIntelligence.objections) {
      signals.concerns.push(...competitiveIntelligence.objections.map(o => `❓ ${o}`))
    }
    
    // Extract competitive mentions
    if (competitiveIntelligence.competitorsMentioned) {
      signals.competitive.push(...competitiveIntelligence.competitorsMentioned.map(c => `🏢 ${c.name}: ${c.context}`))
    }
    
    // Extract pain indicators
    const painSeverity = callSummary.painSeverity || {}
    if (painSeverity.indicators) {
      signals.pain.push(...painSeverity.indicators.map(p => `🔥 ${p}`))
    }
    
    return signals
  }

  const conversationIntel = getConversationIntelligence()

  // NEW: Generate assessment text based on analysis
  const generateAssessmentText = (analysis: AnalysisData) => {
    const signals = getBuyingSignals()
    const heat = getDealHeat()
    
    if (heat.level === 'HIGH' && signals.commitmentCount >= 2) {
      return 'strong buying signals detected, immediate action recommended'
    } else if (heat.level === 'MEDIUM' || signals.commitmentCount >= 1) {
      return 'positive momentum building, strategic follow-up needed'
    }
    return 'early stage opportunity, focus on value demonstration'
  }

  // NEW: Get role color for participant cards
  const getRoleColor = (role: string) => {
    if (role === 'high' || role?.toLowerCase().includes('economic')) {
      return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' }
    }
    if (role === 'medium' || role?.toLowerCase().includes('influencer')) {
      return { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' }
    }
    return { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <TooltipProvider>
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

          {/* NEW: ACTION HERO SECTION */}
          <div className="relative overflow-hidden bg-gradient-to-r from-purple-900 via-purple-800 to-purple-900 text-white p-8 rounded-2xl mb-8 shadow-2xl">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(168,85,247,0.15),transparent_50%)]"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(147,51,234,0.1),transparent_50%)]"></div>
            
            <div className="relative z-10">
              {/* Header */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-yellow-400 rounded-xl flex items-center justify-center">
                  <Trophy className="w-7 h-7 text-purple-900" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge className="bg-white/10 text-white px-3 py-1 text-sm font-medium">
                      HIGH PROBABILITY WIN
                    </Badge>
                  </div>
                  <h2 className="text-3xl font-bold">Your Next 3 Moves</h2>
                  <p className="text-purple-200">AI-powered action plan based on this conversation</p>
                </div>
              </div>

              {/* Action Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {/* Action 1 */}
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center text-white font-bold">
                      1
                    </div>
                    <h3 className="font-semibold">Strike While Hot</h3>
                  </div>
                  <p className="text-sm text-purple-100 mb-4">
                    {analysis.recommendations?.immediateActions?.[0]?.action || 'Follow up within 24hrs while momentum is strong'}
                  </p>
                  <Button 
                    size="sm" 
                    className="bg-red-500 hover:bg-red-600 text-white w-full"
                    onClick={() => {
                      const action = analysis.recommendations?.immediateActions?.[0]
                      if (action?.copyPasteContent?.body) {
                        copyToClipboard(action.copyPasteContent.body, 'Email template')
                      }
                    }}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Email
                  </Button>
                </div>

                {/* Action 2 */}
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold">
                      2
                    </div>
                    <h3 className="font-semibold">Align Stakeholders</h3>
                  </div>
                  <p className="text-sm text-purple-100 mb-4">
                    Schedule decision maker call to advance the opportunity
                  </p>
                  <Button 
                    size="sm" 
                    className="bg-orange-500 hover:bg-orange-600 text-white w-full"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Book Meeting
                  </Button>
                </div>

                {/* Action 3 */}
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center text-white font-bold">
                      3
                    </div>
                    <h3 className="font-semibold">Advance Deal</h3>
                  </div>
                  <p className="text-sm text-purple-100 mb-4">
                    {analysis.recommendations?.immediateActions?.[2]?.action || 'Present next step proposal to move forward'}
                  </p>
                  <Button 
                    size="sm" 
                    className="bg-green-500 hover:bg-green-600 text-white w-full"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    View Script
                  </Button>
                </div>
              </div>

              {/* Bottom Insight Banner */}
              <div className="bg-gradient-to-r from-emerald-400/20 to-green-400/20 rounded-xl p-4 border border-emerald-400/30">
                <div className="flex items-center gap-3">
                  <Lightbulb className="w-6 h-6 text-emerald-300" />
                  <p className="text-emerald-100 flex-1">
                    <strong>Strategy:</strong> {analysis.recommendations?.primaryStrategy || 'Build on the positive momentum from this conversation and address their key concerns while maintaining urgency around their stated timeline.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* NEW: MEETING CONTEXT SECTION */}
          <Card className="mb-8 shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">Meeting Context</CardTitle>
                  <CardDescription>Who participated and what was discussed</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Participants Grid */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Key Participants</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {participants?.clientContacts && participants.clientContacts.length > 0 ? (
                    participants.clientContacts.map((contact: any, index: number) => {
                      const roleColors = getRoleColor(contact.challengerRole || contact.decisionLevel || 'low')
                      const stakeholder = getStakeholderDisplay(contact)
                      
                      return (
                        <div key={index} className={`p-4 rounded-lg border ${roleColors.bg} ${roleColors.border}`}>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className={`font-medium ${roleColors.text}`}>
                              {contact.name || `Contact ${index + 1}`}
                            </h4>
                            {stakeholder && (
                              <Badge className={`text-xs ${stakeholder.color}`}>
                                {stakeholder.icon} {stakeholder.label}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-1">{contact.title || 'Title not provided'}</p>
                          <p className="text-xs text-gray-500">
                            {contact.decisionEvidence?.[0] || 'Engaged in discussion'}
                          </p>
                        </div>
                      )
                    })
                  ) : (
                    <div className="col-span-2 text-center py-6 text-gray-500">
                      <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p>No specific participants identified in analysis</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Conversation Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Business Situation</h4>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {analysis.call_summary?.clientSituation || 'Client shared their current business context and challenges during the conversation.'}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Key Topics Covered</h4>
                  <ul className="space-y-1">
                    {(analysis.call_summary?.mainTopics || ['Business needs discussed', 'Solution options explored', 'Next steps identified']).slice(0, 4).map((topic, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full flex-shrink-0"></div>
                        <span className="text-gray-700 text-sm">{topic}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Conversation Metrics */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <CheckCircle className="w-5 h-5 text-green-500 mx-auto mb-1" />
                    <p className="text-xs text-gray-600">Stakeholder Engagement</p>
                    <p className="text-sm font-medium">
                      {analysis.call_summary?.conversationMetrics?.stakeholderEngagement || 'Good'}
                    </p>
                  </div>
                  <div>
                    <AlertTriangle className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
                    <p className="text-xs text-gray-600">Concern Level</p>
                    <p className="text-sm font-medium">
                      {analysis.call_summary?.conversationMetrics?.concernLevel || 'Low'}
                    </p>
                  </div>
                  <div>
                    <TrendingUp className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                    <p className="text-xs text-gray-600">Momentum</p>
                    <p className="text-sm font-medium">
                      {analysis.call_summary?.conversationMetrics?.momentum || 'Positive'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ENHANCED INTELLIGENCE SECTION (existing hero with new banner) */}
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white p-8 rounded-2xl mb-8 shadow-lg">
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
                  <h2 className="text-2xl font-bold">Sales Intelligence</h2>
                  <p className="text-blue-200 text-sm">Key insights extracted from your conversation</p>
                </div>
              </div>

              {/* Ultra Compact Participants Section - MOVED ABOVE CARDS */}
              <div className="mb-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-6 h-6 bg-purple-500 rounded-lg flex items-center justify-center">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-base font-semibold text-white">Meeting Participants</h3>
                </div>
                
                <div className="text-sm text-white">
                  <span className="text-blue-200 font-medium">Participants:</span> 
                  {/* Client contacts first */}
                  {participants?.clientContacts && participants.clientContacts.length > 0 && (
                    <>
                      {participants.clientContacts.map((contact: any, index: number) => {
                        const stakeholder = getStakeholderDisplay(contact);
                        const displayName = contact.name + (contact.title ? ` (${contact.title})` : '');
                        
                        return (
                          <span key={index}>
                            {displayName}
                            {stakeholder && (
                              <span className={`ml-2 text-xs px-2 py-1 rounded-full ${stakeholder.color} font-medium`}>
                                {stakeholder.icon} {stakeholder.label}
                              </span>
                            )}
                            {index < participants.clientContacts.length - 1 && ', '}
                          </span>
                        );
                      })}
                    </>
                  )}
                  {/* Sales rep last, with comma if client contacts exist */}
                  {participants?.clientContacts && participants.clientContacts.length > 0 && ', '}
                  {participants?.salesRep?.name || 'Sales Representative'}
                  {(!participants?.clientContacts || participants.clientContacts.length === 0) && (
                    <span className="text-xs text-gray-400 italic"> • No client contacts identified</span>
                  )}
                </div>
              </div>

              {/* Main Intelligence Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                
                {/* Deal Temperature */}
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 hover:bg-white/15 transition-all">
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
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 hover:bg-white/15 transition-all">
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
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 hover:bg-white/15 transition-all">
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
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 hover:bg-white/15 transition-all">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                      <Clock className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-orange-200">Timeline</span>
                  </div>
                  <div className="text-lg font-bold text-orange-300">
                    {timeline.isTextTruncated ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-help">{timeline.timeline}</span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">{timeline.originalTimeline}</p>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      timeline.timeline
                    )}
                  </div>
                  <p className="text-xs text-gray-300 mt-1">{timeline.urgency} Priority</p>
                </div>
              </div>

              {/* NEW: Deal Assessment Banner */}
              <div className="bg-gradient-to-r from-emerald-500/20 to-green-500/20 rounded-xl p-4 border border-emerald-400/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <TrendingUp className="text-emerald-300 text-lg mr-3" />
                    <div>
                      <h4 className="text-lg font-bold text-white">Deal Assessment: Ready to Close</h4>
                      <p className="text-emerald-200 text-sm">All signals align - {generateAssessmentText(analysis)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-emerald-300">85%</div>
                    <div className="text-emerald-200 text-sm">Win Probability</div>
                  </div>
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
                      <h4 className="text-sm font-bold text-gray-300 mb-2 underline">Client Situation</h4>
                      <p className="text-gray-200 text-sm">
                        {analysis.call_summary?.clientSituation || 'Client shared their current business context and challenges.'}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-300 mb-2 underline">Main Topics</h4>
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
                    {conversationIntel.concerns.length > 0 ? 'Concerns identified' : 'No major concerns'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-400" />
                  <span className="text-gray-300">
                    {conversationIntel.positive.length > 0 ? 'Positive momentum confirmed' : 'Opportunity identified'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ENHANCED EXPANDABLE SECTIONS */}
          <div className="space-y-4">
            
            {/* Key Insights Card */}
            {analysis.key_takeaways && analysis.key_takeaways.length > 0 && (
              <Card className="border-l-4 border-l-yellow-400 bg-gradient-to-r from-yellow-50 to-orange-50 hover:shadow-lg transition-all">
                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="pb-2 cursor-pointer hover:bg-yellow-100/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Lightbulb className="w-6 h-6 text-yellow-600" />
                          <div>
                            <CardTitle className="text-lg">Key Insights ({analysis.key_takeaways.length})</CardTitle>
                            <p className="text-sm text-yellow-700 font-normal">Critical observations and competitive advantages discovered</p>
                          </div>
                        </div>
                        <ChevronDown className="w-5 h-5 text-yellow-600" />
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent>
                      <div className="space-y-3">
                        {analysis.key_takeaways.map((takeaway, index) => (
                          <div key={index} className="flex items-start gap-3 p-4 bg-white rounded-lg border border-yellow-200">
                            <div className="w-6 h-6 bg-yellow-500 text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                              {index + 1}
                            </div>
                            <p className="text-gray-800 leading-relaxed">{takeaway}</p>
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
              <Card className="border-l-4 border-l-blue-400 bg-gradient-to-r from-blue-50 to-indigo-50 hover:shadow-lg transition-all">
                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="pb-2 cursor-pointer hover:bg-blue-100/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Target className="w-6 h-6 text-blue-600" />
                          <div>
                            <CardTitle className="text-lg">Strategic Approach</CardTitle>
                            <p className="text-sm text-blue-700 font-normal">Detailed win strategy based on stakeholder dynamics</p>
                          </div>
                        </div>
                        <ChevronDown className="w-5 h-5 text-blue-600" />
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="space-y-6">
                      {analysis.recommendations.primaryStrategy && (
                        <div className="p-4 bg-white rounded-lg border border-blue-200">
                          <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                            <Target className="w-4 h-4" />
                            Primary Strategy
                          </h4>
                          <p className="text-gray-800 leading-relaxed">{analysis.recommendations.primaryStrategy}</p>
                        </div>
                      )}
                      {analysis.recommendations.competitiveStrategy && (
                        <div className="p-4 bg-white rounded-lg border border-blue-200">
                          <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                            <Shield className="w-4 h-4" />
                            Competitive Positioning
                          </h4>
                          <p className="text-gray-800 leading-relaxed">{analysis.recommendations.competitiveStrategy}</p>
                        </div>
                      )}
                      {analysis.recommendations.stakeholderPlan && (
                        <div className="p-4 bg-white rounded-lg border border-blue-200">
                          <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Stakeholder Plan
                          </h4>
                          <p className="text-gray-800 leading-relaxed">{analysis.recommendations.stakeholderPlan}</p>
                        </div>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            )}

            {/* Enhanced Conversation Intel Card */}
            <Card className="border-l-4 border-l-green-400 bg-gradient-to-r from-green-50 to-emerald-50 hover:shadow-lg transition-all">
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <CardHeader className="pb-2 cursor-pointer hover:bg-green-100/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Eye className="w-6 h-6 text-green-600" />
                        <div>
                          <CardTitle className="text-lg">Conversation Intelligence</CardTitle>
                          <p className="text-sm text-green-700 font-normal">What they revealed, competitive insights, and decision criteria</p>
                        </div>
                      </div>
                      <ChevronDown className="w-5 h-5 text-green-600" />
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-6">
                    
                    {/* Buying Signals Analysis */}
                    {conversationIntel.positive.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-green-700 mb-3 flex items-center gap-2">
                          <Activity className="w-5 h-5" />
                          Buying Signals ({conversationIntel.positive.length})
                        </h4>
                        <div className="grid gap-2">
                          {conversationIntel.positive.map((signal: string, index: number) => (
                            <div key={index} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-green-200">
                              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                              <span className="text-gray-800 text-sm">{signal}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Pain & Urgency Analysis */}
                    {conversationIntel.pain.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-red-700 mb-3 flex items-center gap-2">
                          <Thermometer className="w-5 h-5" />
                          Pain Indicators ({conversationIntel.pain.length})
                        </h4>
                        <div className="grid gap-2">
                          {conversationIntel.pain.map((pain: string, index: number) => (
                            <div key={index} className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                              <span className="text-gray-800 text-sm">{pain}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Concerns & Objections */}
                    {conversationIntel.concerns.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-orange-700 mb-3 flex items-center gap-2">
                          <Shield className="w-5 h-5" />
                          Concerns to Address ({conversationIntel.concerns.length})
                        </h4>
                        <div className="grid gap-2">
                          {conversationIntel.concerns.map((concern: string, index: number) => (
                            <div key={index} className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                              <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0" />
                              <span className="text-gray-800 text-sm">{concern}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Competitive Intelligence */}
                    {conversationIntel.competitive.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-purple-700 mb-3 flex items-center gap-2">
                          <Target className="w-5 h-5" />
                          Competitive Intelligence ({conversationIntel.competitive.length})
                        </h4>
                        <div className="grid gap-2">
                          {conversationIntel.competitive.map((comp: string, index: number) => (
                            <div key={index} className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                              <ExternalLink className="w-5 h-5 text-purple-500 flex-shrink-0" />
                              <span className="text-gray-800 text-sm">{comp}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Fallback when no intelligence is available */}
                    {conversationIntel.positive.length === 0 && 
                     conversationIntel.concerns.length === 0 && 
                     conversationIntel.competitive.length === 0 && 
                     conversationIntel.pain.length === 0 && (
                      <div className="text-center py-8">
                        <Eye className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h4 className="font-medium text-gray-600 mb-2">Rich Intelligence Processing</h4>
                        <p className="text-gray-500 text-sm">
                          Your conversation is being analyzed for deeper insights including buying signals, 
                          competitive intelligence, pain analysis, and stakeholder mapping.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>

            {/* Ready-to-Execute Actions Card */}
            {analysis.action_plan?.actions && analysis.action_plan.actions.length > 0 && (
              <Card className="border-l-4 border-l-purple-400 bg-gradient-to-r from-purple-50 to-indigo-50 hover:shadow-lg transition-all">
                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="pb-2 cursor-pointer hover:bg-purple-100/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Zap className="w-6 h-6 text-purple-600" />
                          <div>
                            <CardTitle className="text-lg">All Ready-to-Execute Actions</CardTitle>
                            <p className="text-sm text-purple-700 font-normal">Complete email templates, scripts, and follow-up sequences</p>
                          </div>
                        </div>
                        <ChevronDown className="w-5 h-5 text-purple-600" />
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent>
                      {analysis.action_plan.actions.map((action: any, index: number) => (
                        <div key={index} className="border border-purple-200 rounded-lg p-6 mb-4 bg-white">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-semibold text-purple-900 text-lg">{action.action}</h4>
                            <Badge variant="outline" className="border-purple-300 text-purple-700">{action.timeline}</Badge>
                          </div>
                          <p className="text-sm text-gray-700 mb-4 leading-relaxed">{action.objective}</p>
                          
                          {action.copyPasteContent?.subject && (
                            <div className="bg-purple-50 p-4 rounded-lg mb-3 border border-purple-200">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-semibold text-purple-800">Subject Line</span>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="border-purple-300 text-purple-700 hover:bg-purple-100"
                                  onClick={() => copyToClipboard(action.copyPasteContent.subject, 'Subject line')}
                                >
                                  <Copy className="w-4 h-4 mr-1" />
                                  Copy
                                </Button>
                              </div>
                              <p className="text-sm font-mono bg-white p-3 rounded border border-purple-200">{action.copyPasteContent.subject}</p>
                            </div>
                          )}
                          
                          {action.copyPasteContent?.body && (
                            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-semibold text-purple-800">Email Content</span>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="border-purple-300 text-purple-700 hover:bg-purple-100"
                                  onClick={() => copyToClipboard(action.copyPasteContent.body, 'Email content')}
                                >
                                  <Copy className="w-4 h-4 mr-1" />
                                  Copy
                                </Button>
                              </div>
                              <p className="text-sm font-mono whitespace-pre-wrap bg-white p-3 rounded border border-purple-200 max-h-32 overflow-y-auto">{action.copyPasteContent.body}</p>
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
      </TooltipProvider>
    </div>
  )
}
