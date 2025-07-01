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
  TrendingDown,
  Building2,
  AlertCircle,
  XCircle,
  Coffee,
  Timer,
  Send
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

  const getRoleIcon = (role: string) => {
    if (role === 'Economic Buyer' || role === 'high') return '🏛️'
    if (role === 'Technical Buyer') return '🔧' 
    if (role === 'Coach') return '🤝'
    if (role === 'Influencer' || role === 'medium') return '📊'
    if (role === 'Blocker') return '🚫'
    return '👤'
  }

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
      strength: `${strength} momentum`,
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

  // 🚀 NEW: ADAPTIVE DEAL QUALITY LOGIC
  const getDealQuality = () => {
    const heat = getDealHeat().level
    const signals = getBuyingSignals()
    const resistance = analysis.call_summary?.resistanceAnalysis?.level || 'none'
    const timeline = getTimeline()
    
    // DISQUALIFY MODE: High resistance overrides everything
    if (resistance === 'high' || 
        (heat === 'LOW' && signals.strength.includes('Weak') && timeline.urgency === 'LOW')) {
      return 'DISQUALIFY'
    }
    
    // PURSUE MODE: High heat + good signals OR strong commitment signals
    if (heat === 'HIGH' || 
        (heat === 'MEDIUM' && signals.commitmentCount >= 1) ||
        signals.qualityScore >= 6) {
      return 'PURSUE'
    }
    
    // NURTURE MODE: Everything else
    return 'NURTURE'
  }

  const getCompetitiveEdge = () => {
    const competitive = analysis.call_summary?.competitiveIntelligence || {}
    const advantage = competitive.competitiveAdvantage || analysis.recommendations?.competitiveStrategy || ''
    const vendors = competitive.vendorsKnown || []
    
    // Enhanced barrier detection
    const advantageText = advantage.toLowerCase()
    const hasSignificantBarriers = advantageText.includes('significant barriers') ||
                                 advantageText.includes('major obstacles') ||
                                 advantageText.includes('strong resistance') ||
                                 advantageText.includes('not actively looking') ||
                                 advantageText.includes('satisfied with current')
    
    // Check for descriptive non-competitor content in vendorsKnown
    const hasRealCompetitors = vendors.length > 0 && 
      vendors.some((vendor: string) => 
        vendor && 
        !vendor.toLowerCase().includes('vendor') &&
        !vendor.toLowerCase().includes('solution') &&
        !vendor.toLowerCase().includes('provider') &&
        vendor.length < 50 // Avoid long descriptive sentences
      )
    
    // Enhanced competitive intelligence detection
    const hasCompetitiveContext = hasRealCompetitors || 
                                advantage.length > 20 ||
                                competitive.evaluationStage ||
                                (competitive.decisionCriteria && competitive.decisionCriteria.length > 0)
    
    if (!hasCompetitiveContext) {
      return null // Hide card completely
    }
    
    // Determine competitive status with sales coaching approach
    if (hasSignificantBarriers) {
      return {
        status: 'Competitive Challenge',
        description: 'Significant barriers identified',
        color: 'bg-red-500/20 text-red-300 border-red-500/30',
        icon: '🚫',
        content: advantage.length > 60 ? advantage.substring(0, 60) + '...' : advantage,
        fullContent: advantage
      }
    }
    
    if (hasRealCompetitors) {
      return {
        status: 'Active Evaluation',
        description: `Evaluating vs ${vendors.slice(0, 2).join(', ')}`,
        color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
        icon: '⚔️',
        content: advantage.length > 60 ? advantage.substring(0, 60) + '...' : advantage,
        fullContent: advantage
      }
    }
    
    return {
      status: 'Strategic Advantage',
      description: 'Positioning opportunity identified',
      color: 'bg-green-500/20 text-green-300 border-green-500/30',
      icon: '🎯',
      content: advantage.length > 60 ? advantage.substring(0, 60) + '...' : advantage,
      fullContent: advantage
    }
  }

  const dealHeat = getDealHeat()
  const decisionMaker = getDecisionMaker()
  const buyingSignals = getBuyingSignals()
  const timeline = getTimeline()
  const dealQuality = getDealQuality()
  const competitiveEdge = getCompetitiveEdge()

  // Extract participants data
  const participants = analysis.participants || {}

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

          {/* 🚀 HERO SECTION - UNTOUCHED (PERFECTED) */}
          <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 rounded-2xl p-8 text-white relative overflow-hidden mb-8">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.15),transparent_50%)]"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(168,85,247,0.1),transparent_50%)]"></div>
            
            <div className="relative z-10">
              {/* Strategic Context Header */}
              <div className="flex items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                    <Trophy className="w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Deal Command Center</h2>
                    <p className="text-blue-200">Strategic intelligence + competitive positioning</p>
                  </div>
                </div>
              </div>

              {/* Decision Architecture */}
              <div className="mb-6 flex flex-wrap items-center gap-3 text-sm">
                <span className="text-slate-300">Decision Architecture:</span>
                {participants?.clientContacts && participants.clientContacts.length > 0 ? (
                  participants.clientContacts.slice(0, 4).map((contact: any, index: number) => {
                    const stakeholderDisplay = getStakeholderDisplay(contact);
                    if (!stakeholderDisplay) {
                      const roleColor = contact.decisionLevel === 'high' ? 'bg-red-500/20 text-red-300' : 
                                       contact.decisionLevel === 'medium' ? 'bg-yellow-500/20 text-yellow-300' : 
                                       'bg-gray-500/20 text-gray-300';
                      return (
                        <Badge key={index} variant="secondary" className={`text-xs ${roleColor}`}>
                          {contact.name} ({contact.title}) {getRoleIcon(contact.decisionLevel)}
                        </Badge>
                      );
                    }
                    
                    return (
                      <Badge key={index} variant="secondary" className={`text-xs ${stakeholderDisplay.color}`}>
                        {contact.name} ({contact.title}) {stakeholderDisplay.icon}
                      </Badge>
                    );
                  })
                ) : (
                  <span className="text-slate-400 italic">No client contacts identified</span>
                )}
                {participants?.salesRep?.name && (
                  <Badge variant="secondary" className="text-xs bg-blue-500/20 text-blue-200 border-blue-400/30">
                    Rep: {participants.salesRep.name}
                  </Badge>
                )}
              </div>

              {/* Enhanced 4-Card Intelligence Grid with Conditional Competitive Edge */}
              <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 ${competitiveEdge ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
                
                {/* Deal Heat */}
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 hover:bg-white/15 transition-all">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-8 h-8 ${dealHeat.bgColor} rounded-lg flex items-center justify-center`}>
                      <Thermometer className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-red-200">Deal Heat</span>
                  </div>
                  <div className={`text-2xl font-bold ${dealHeat.color}`}>{dealHeat.emoji} {dealHeat.level}</div>
                  <p className="text-xs text-gray-300">{dealHeat.description}</p>
                </div>

                {/* Power Center */}
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 hover:bg-white/15 transition-all">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                      <Crown className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-blue-200">Power Center</span>
                  </div>
                  <div className="text-lg font-bold">{decisionMaker.name}</div>
                  <p className="text-xs text-gray-300">{decisionMaker.title} • {decisionMaker.influence}</p>
                </div>

                {/* Momentum */}
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 hover:bg-white/15 transition-all">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-green-200">Momentum</span>
                  </div>
                  <div className="text-2xl font-bold text-green-300">{buyingSignals.count}/{buyingSignals.total}</div>
                  <p className="text-xs text-gray-300">{buyingSignals.strength}</p>
                </div>

                {/* Competitive Edge - Conditional Display */}
                {competitiveEdge && (
                  <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 hover:bg-white/15 transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                        <Target className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-sm font-medium text-purple-200">Competitive Edge</span>
                    </div>
                    <div className="text-lg font-bold text-purple-300">
                      {competitiveEdge.content.length > 60 ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help">{competitiveEdge.status}</span>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs p-3">
                            <p className="text-sm">{competitiveEdge.fullContent}</p>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        competitiveEdge.status
                      )}
                    </div>
                    <p className="text-xs text-gray-300">{competitiveEdge.description}</p>
                  </div>
                )}
              </div>

              {/* Win Strategy Banner */}
              <div className={`bg-gradient-to-r ${competitiveEdge?.status === 'Competitive Challenge' ? 'from-red-500/20 to-orange-500/20 border-red-400/30' : 
                                  competitiveEdge?.status === 'Active Evaluation' ? 'from-yellow-500/20 to-orange-500/20 border-yellow-400/30' :
                                  'from-emerald-500/20 to-blue-500/20 border-emerald-400/30'} rounded-xl p-6 border mb-6`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Shield className="w-8 h-8 text-emerald-300" />
                    <div>
                      <h4 className="text-xl font-bold text-white">Win Strategy</h4>
                      <p className="text-emerald-200 text-sm max-w-2xl">
                        {analysis.recommendations?.primaryStrategy || 
                         "Position as the solution that uniquely addresses their specific business challenges and competitive requirements"}
                      </p>
                    </div>
                  </div>
                  <div className={`text-right ${competitiveEdge?.status === 'Competitive Challenge' ? 'text-red-300' :
                                    competitiveEdge?.status === 'Active Evaluation' ? 'text-yellow-300' :
                                    'text-emerald-300'}`}>
                    <div className="font-bold text-lg">{competitiveEdge?.status || 'Competitive'}</div>
                    <div className="text-sm">{competitiveEdge?.status === 'Competitive Challenge' ? 'Challenge' : 'Advantage'}</div>
                  </div>
                </div>
              </div>

              {/* Call Summary Section */}
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 mb-6">
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

              {/* Essential Business Context */}
              <div className="grid md:grid-cols-2 gap-6 text-sm">
                <div>
                  <h4 className="font-bold text-gray-300 mb-2 underline">Client Priority</h4>
                  <p className="text-gray-200">
                    {analysis.call_summary?.urgencyDrivers?.primary || 
                     timeline.driver || 
                     "Strategic business priority driving this opportunity"}
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-gray-300 mb-2 underline">Urgency Driver</h4>
                  <p className="text-gray-200">
                    {timeline.driver || 
                     analysis.call_summary?.urgencyDrivers?.primary || 
                     "Business pressure creating decision timeline"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 🚀 ADAPTIVE CONTENT BASED ON DEAL QUALITY */}
          {dealQuality === 'DISQUALIFY' && (
            <div className="space-y-6">
              {/* Honest Assessment Card */}
              <Card className="border-l-4 border-l-red-500 bg-gradient-to-r from-red-50 to-orange-50">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-red-100 rounded-lg">
                      <XCircle className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl text-red-900">Honest Assessment: Focus Elsewhere</CardTitle>
                      <p className="text-red-700">High resistance + low urgency = better opportunities exist</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-white p-4 rounded-lg border border-red-200">
                    <h4 className="font-semibold text-red-800 mb-2">Why This Deal Isn't Ready</h4>
                    <ul className="space-y-2 text-sm text-gray-700">
                      {analysis.call_summary?.resistanceAnalysis?.signals?.map((signal: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                          <span>{signal}</span>
                        </li>
                      )) || [
                        <li key="default" className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                          <span>Low urgency and buying signals indicate this isn't a priority for them right now</span>
                        </li>
                      ]}
                    </ul>
                  </div>
                  
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <h4 className="font-semibold text-yellow-800 mb-2">Recommended Action</h4>
                    <p className="text-yellow-700 text-sm mb-3">
                      Add to quarterly nurture sequence and focus on prospects with higher urgency and budget authority
                    </p>
                    <Button 
                      className="bg-yellow-600 hover:bg-yellow-700 text-white"
                      onClick={() => copyToClipboard(
                        "Hi [Name],\n\nThanks for our conversation about [topic]. I understand this isn't a current priority.\n\nI'll check back in Q[next quarter] to see if your situation has changed. In the meantime, feel free to reach out if anything urgent comes up.\n\nBest regards,\n[Your name]",
                        'Quarterly nurture template'
                      )}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Quarterly Nurture Template
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {dealQuality === 'NURTURE' && (
            <div className="space-y-6">
              {/* Strategic Nurture Card */}
              <Card className="border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Coffee className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl text-blue-900">Strategic Nurture Approach</CardTitle>
                      <p className="text-blue-700">Build relationship and stay positioned for when timing improves</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-white p-4 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-800 mb-3">Monthly Touch Points</h4>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <Timer className="w-5 h-5 text-blue-500 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-800">Share relevant industry insights</p>
                          <p className="text-sm text-gray-600">Keep them informed about trends affecting their business</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Users className="w-5 h-5 text-blue-500 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-800">Maintain stakeholder relationships</p>
                          <p className="text-sm text-gray-600">Stay connected with key decision makers</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Eye className="w-5 h-5 text-blue-500 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-800">Monitor for trigger events</p>
                          <p className="text-sm text-gray-600">Watch for changes that create urgency</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Nurture Email Template */}
                  {analysis.action_plan?.actions?.[0] && (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-blue-800">Nurture Email Template</h4>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => copyToClipboard(analysis.action_plan.actions[0].copyPasteContent?.body || "Nurture content", 'Nurture email')}
                        >
                          <Copy className="w-4 h-4 mr-1" />
                          Copy
                        </Button>
                      </div>
                      <div className="bg-white p-3 rounded border border-blue-200">
                        <p className="text-sm font-mono whitespace-pre-wrap">
                          {analysis.action_plan.actions[0].copyPasteContent?.body?.substring(0, 200) + "..." || 
                           "Hi [Name],\n\nHope you're doing well. I came across this article about [relevant topic] and thought of our conversation...\n\n[Continue nurture content]"}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Key Insights - Condensed */}
              {analysis.key_takeaways && analysis.key_takeaways.length > 0 && (
                <Card className="border border-gray-200">
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <CardHeader className="pb-2 cursor-pointer hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Lightbulb className="w-5 h-5 text-yellow-600" />
                            <CardTitle className="text-lg">Key Insights for Future ({analysis.key_takeaways.length})</CardTitle>
                          </div>
                          <ChevronDown className="w-5 h-5 text-gray-500" />
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent>
                        <div className="space-y-2">
                          {analysis.key_takeaways.slice(0, 3).map((takeaway, index) => (
                            <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                              <div className="w-5 h-5 bg-yellow-500 text-white rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0">
                                {index + 1}
                              </div>
                              <p className="text-gray-800 text-sm">{takeaway}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              )}
            </div>
          )}

          {dealQuality === 'PURSUE' && (
            <div className="space-y-6">
              {/* Immediate Action Cards - PROMINENTLY DISPLAYED */}
              <Card className="border-l-4 border-l-green-500 bg-gradient-to-r from-green-50 to-emerald-50">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <Zap className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl text-green-900">Strike While Hot - Execute Immediately</CardTitle>
                      <p className="text-green-700">High potential deal - maximize momentum with specific actions</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Top 2 Actions with Full Email Templates */}
                  {analysis.action_plan?.actions?.slice(0, 2).map((action: any, index: number) => (
                    <div key={index} className="bg-white p-6 rounded-lg border border-green-200">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold text-green-900 text-lg flex items-center gap-2">
                          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                            {index + 1}
                          </div>
                          {action.action}
                        </h4>
                        <Badge className="bg-green-100 text-green-800">
                          {action.timeline || 'Immediate'}
                        </Badge>
                      </div>
                      
                      <p className="text-gray-700 mb-4 leading-relaxed">{action.objective}</p>
                      
                      {/* Subject Line - Immediately Visible */}
                      {action.copyPasteContent?.subject && (
                        <div className="bg-green-50 p-4 rounded-lg mb-4 border border-green-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-green-800">Subject Line</span>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => copyToClipboard(action.copyPasteContent.subject, 'Subject line')}
                            >
                              <Copy className="w-4 h-4 mr-1" />
                              Copy
                            </Button>
                          </div>
                          <p className="text-sm bg-white p-3 rounded border border-green-200 font-mono">
                            {action.copyPasteContent.subject}
                          </p>
                        </div>
                      )}
                      
                      {/* Email Body - Immediately Visible */}
                      {action.copyPasteContent?.body && (
                        <div className="bg-green-50 p-4 rounded-lg mb-4 border border-green-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-green-800">Email Content</span>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => copyToClipboard(action.copyPasteContent.body, 'Email content')}
                              >
                                <Copy className="w-4 h-4 mr-1" />
                                Copy
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => openInEmailClient(action.copyPasteContent.subject || 'Follow-up', action.copyPasteContent.body)}
                              >
                                <Send className="w-4 h-4 mr-1" />
                                Send
                              </Button>
                            </div>
                          </div>
                          <div className="bg-white p-3 rounded border border-green-200 max-h-40 overflow-y-auto">
                            <p className="text-sm font-mono whitespace-pre-wrap">{action.copyPasteContent.body}</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Action Buttons */}
                      <div className="flex gap-3">
                        <Button className="bg-green-600 hover:bg-green-700 flex-1">
                          <Phone className="w-4 h-4 mr-2" />
                          Execute Action
                        </Button>
                        <Button variant="outline" className="flex-1">
                          <Calendar className="w-4 h-4 mr-2" />
                          Schedule Follow-up
                        </Button>
                      </div>
                    </div>
                  )) || (
                    <div className="bg-white p-6 rounded-lg border border-green-200">
                      <h4 className="font-bold text-green-900 mb-4">Execute Strategic Follow-up</h4>
                      <p className="text-gray-700 mb-4">
                        Contact key stakeholders immediately to advance this high-potential opportunity
                      </p>
                      <div className="flex gap-3">
                        <Button className="bg-green-600 hover:bg-green-700 flex-1">
                          <Phone className="w-4 h-4 mr-2" />
                          Execute Action
                        </Button>
                        <Button variant="outline" className="flex-1">
                          <Calendar className="w-4 h-4 mr-2" />
                          Schedule Follow-up
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Stakeholder Navigation - Only for Pursue Mode */}
              {participants?.clientContacts && participants.clientContacts.length > 0 && (
                <Card className="border border-gray-200">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Users className="w-6 h-6 text-blue-600" />
                      <CardTitle className="text-lg">Stakeholder Coordination</CardTitle>
                      <Badge variant="outline" className="text-xs">Multi-thread Strategy</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-4">
                      {/* Economic Buyers */}
                      {participants.clientContacts.filter((contact: any) => 
                        contact.challengerRole === 'Economic Buyer' || contact.decisionLevel === 'high'
                      ).length > 0 && (
                        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                          <h4 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
                            🏛️ Economic Buyers
                          </h4>
                          <div className="space-y-3">
                            {participants.clientContacts.filter((contact: any) => 
                              contact.challengerRole === 'Economic Buyer' || contact.decisionLevel === 'high'
                            ).map((contact: any, index: number) => (
                              <div key={index}>
                                <p className="font-medium">{contact.name} ({contact.title})</p>
                                <p className="text-sm text-gray-600">
                                  {contact.decisionEvidence?.[0] || contact.roleEvidence?.[0] || "Key decision authority"}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Technical/User Buyers */}
                      {participants.clientContacts.filter((contact: any) => 
                        contact.challengerRole === 'Technical Buyer' || contact.challengerRole === 'User Buyer'
                      ).length > 0 && (
                        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                          <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                            🔧 Technical/User Buyers
                          </h4>
                          <div className="space-y-3">
                            {participants.clientContacts.filter((contact: any) => 
                              contact.challengerRole === 'Technical Buyer' || contact.challengerRole === 'User Buyer'
                            ).map((contact: any, index: number) => (
                              <div key={index}>
                                <p className="font-medium">{contact.name} ({contact.title})</p>
                                <p className="text-sm text-gray-600">
                                  {contact.roleEvidence?.[0] || "Implementation stakeholder"}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Coordination Strategy */}
                      <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                        <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                          🎯 Next Steps
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <span>Engage economic buyers on business value</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span>Address technical requirements</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span>Coordinate decision timeline</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Single Expandable for Additional Intelligence */}
              <Card className="border border-gray-200">
                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="pb-2 cursor-pointer hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Target className="w-6 h-6 text-green-600" />
                          <CardTitle className="text-lg">Complete Battle Plan & Intelligence</CardTitle>
                        </div>
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="space-y-6">
                      {/* Key Takeaways */}
                      {analysis.key_takeaways && analysis.key_takeaways.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-green-700 mb-3">Key Strategic Insights</h4>
                          <div className="space-y-2">
                            {analysis.key_takeaways.map((takeaway, index) => (
                              <div key={index} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                                <div className="w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0">
                                  {index + 1}
                                </div>
                                <p className="text-gray-800 text-sm">{takeaway}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Strategic Recommendations */}
                      {analysis.recommendations && (
                        <div className="space-y-4">
                          {analysis.recommendations.primaryStrategy && (
                            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                              <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                                <Target className="w-4 h-4" />
                                Primary Strategy
                              </h4>
                              <p className="text-gray-800 leading-relaxed">{analysis.recommendations.primaryStrategy}</p>
                            </div>
                          )}
                          {analysis.recommendations.competitiveStrategy && (
                            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                              <h4 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                                <Shield className="w-4 h-4" />
                                Competitive Positioning
                              </h4>
                              <p className="text-gray-800 leading-relaxed">{analysis.recommendations.competitiveStrategy}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Additional Actions */}
                      {analysis.action_plan?.actions && analysis.action_plan.actions.length > 2 && (
                        <div>
                          <h4 className="font-semibold text-blue-700 mb-3">Additional Follow-up Actions</h4>
                          <div className="space-y-3">
                            {analysis.action_plan.actions.slice(2).map((action: any, index: number) => (
                              <div key={index} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="flex items-center justify-between mb-2">
                                  <h5 className="font-medium text-blue-900">{action.action}</h5>
                                  <Badge variant="outline" className="text-xs">{action.timeline}</Badge>
                                </div>
                                <p className="text-sm text-gray-700 mb-3">{action.objective}</p>
                                {action.copyPasteContent?.body && (
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => copyToClipboard(action.copyPasteContent.body, 'Action template')}
                                  >
                                    <Copy className="w-4 h-4 mr-1" />
                                    Copy Template
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            </div>
          )}
        </div>
      </TooltipProvider>
    </div>
  )
}