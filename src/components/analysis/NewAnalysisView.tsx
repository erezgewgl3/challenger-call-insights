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
  AlertCircle
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

  // NEW: Stage 4 Alternative Functions
  const getSectionPriority = () => {
    const dealHeat = getDealHeat()
    const buyingSignals = getBuyingSignals()
    
    // Extract resistance data for priority assessment
    const resistanceData = analysis.call_summary?.resistanceAnalysis || {}
    const resistanceLevel = resistanceData.level || 'none'
    
    // Determine overall deal probability for priority guidance
    let dealProbability = 'medium'
    if (dealHeat.level === 'HIGH' && buyingSignals.strength.includes('Strong') && resistanceLevel !== 'high') {
      dealProbability = 'high'
    } else if (dealHeat.level === 'LOW' || resistanceLevel === 'high') {
      dealProbability = 'low'
    }
    
    // Define section priorities based on deal assessment
    const sectionConfig = {
      insights: {
        priority: dealProbability === 'high' ? 1 : dealProbability === 'medium' ? 1 : 2,
        defaultOpen: dealProbability !== 'low',
        importance: dealProbability === 'high' ? 'critical' : 'standard',
        badge: dealProbability === 'high' ? 'KEY INSIGHTS' : null
      },
      battleplan: {
        priority: dealProbability === 'high' ? 2 : dealProbability === 'medium' ? 2 : 4,
        defaultOpen: dealProbability === 'high',
        importance: dealProbability === 'high' ? 'critical' : dealProbability === 'medium' ? 'important' : 'standard',
        badge: dealProbability === 'high' ? 'EXECUTE NOW' : dealProbability === 'medium' ? 'QUALIFY FIRST' : null
      },
      competitive: {
        priority: 3,
        defaultOpen: dealProbability === 'high',
        importance: 'standard',
        badge: null
      },
      templates: {
        priority: dealProbability === 'high' ? 4 : 5,
        defaultOpen: false, // Templates already prominent above
        importance: 'standard',
        badge: 'REFERENCE'
      }
    }
    
    return {
      dealProbability,
      sectionConfig
    }
  }

  const getSectionStyling = (sectionId: string) => {
    const { sectionConfig } = getSectionPriority()
    const config = sectionConfig[sectionId as keyof typeof sectionConfig]
    
    if (!config) return {
      containerClass: 'shadow-sm hover:shadow-md transition-all',
      headerClass: 'hover:bg-gray-50',
      badgeClass: 'bg-gray-500 text-white',
      iconColor: 'text-gray-600',
      borderClass: 'border-l-4 border-l-gray-300',
      defaultOpen: false,
      badge: null
    }
    
    const styleMap = {
      critical: {
        containerClass: 'shadow-lg ring-2 ring-red-200 bg-gradient-to-r from-red-50 to-pink-50',
        headerClass: 'bg-red-100/70',
        badgeClass: 'bg-red-500 text-white',
        iconColor: 'text-red-600',
        borderClass: 'border-l-4 border-l-red-500'
      },
      important: {
        containerClass: 'shadow-md ring-1 ring-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50',
        headerClass: 'bg-yellow-100/50',
        badgeClass: 'bg-yellow-500 text-white',
        iconColor: 'text-yellow-600',
        borderClass: 'border-l-4 border-l-yellow-400'
      },
      standard: {
        containerClass: 'shadow-sm hover:shadow-md transition-all',
        headerClass: 'hover:bg-gray-50',
        badgeClass: 'bg-gray-500 text-white',
        iconColor: 'text-gray-600',
        borderClass: 'border-l-4 border-l-gray-300'
      }
    }
    
    return {
      ...styleMap[config.importance as keyof typeof styleMap],
      defaultOpen: config.defaultOpen,
      badge: config.badge,
      priority: config.priority
    }
  }

  // Stage 1: Stakeholder data checking
  const hasStakeholderData = () => {
    const contacts = analysis.participants?.clientContacts || []
    
    // Check for meaningful stakeholder data
    const hasEconomicBuyers = contacts.some(contact => 
      contact.challengerRole === 'Economic Buyer' || contact.decisionLevel === 'high'
    )
    const hasInfluencers = contacts.some(contact => 
      contact.challengerRole === 'Influencer' || contact.decisionLevel === 'medium'
    )
    
    return {
      hasEconomicBuyers,
      hasInfluencers,
      hasAnyStakeholders: contacts.length > 0,
      stakeholderCount: contacts.length
    }
  }

  // Stage 2: Template extraction
  const getReadyToExecuteTemplates = () => {
    const actions = analysis.action_plan?.actions || []
    if (actions.length === 0) return null
    
    return actions.filter(action => 
      action.copyPasteContent?.subject || action.copyPasteContent?.body
    )
  }

  // Stage 3: Deal assessment for enhanced action guidance  
  const getDealAssessment = () => {
    const dealHeat = getDealHeat()
    const buyingSignals = getBuyingSignals()
    
    // Extract resistance data
    const resistanceData = analysis.call_summary?.resistanceAnalysis || {}
    const resistanceLevel = resistanceData.level || 'none'
    const resistanceSignals = resistanceData.signals || []
    
    // Extract timeline reality
    const timelineAnalysis = analysis.call_summary?.timelineAnalysis || {}
    const flexibility = timelineAnalysis.flexibility || 'medium'
    
    // Calculate deal probability
    let probability = 'medium'
    let assessment = 'QUALIFY'
    let strategy = 'verify'
    let urgency = 'medium'
    let color = 'yellow'
    
    // High probability conditions
    if (
      dealHeat.level === 'HIGH' && 
      buyingSignals.strength.includes('Strong') &&
      resistanceLevel !== 'high'
    ) {
      probability = 'high'
      assessment = 'EXECUTE'
      strategy = 'advance'
      urgency = 'high'
      color = 'green'
    }
    // Low probability conditions  
    else if (
      dealHeat.level === 'LOW' || 
      resistanceLevel === 'high' ||
      (resistanceSignals.length >= 2 && buyingSignals.strength === 'Weak')
    ) {
      probability = 'low'
      assessment = 'NURTURE'
      strategy = 'qualify'
      urgency = 'low'
      color = 'blue'
    }
    // Very low probability (disqualify consideration)
    else if (
      dealHeat.level === 'LOW' && 
      resistanceLevel === 'high' &&
      buyingSignals.strength === 'Weak' &&
      resistanceSignals.length >= 3
    ) {
      probability = 'very-low'
      assessment = 'EVALUATE'
      strategy = 'reassess'
      urgency = 'low'
      color = 'gray'
    }
    
    return {
      probability,
      assessment,
      strategy,
      urgency,
      color,
      resistanceLevel,
      resistanceSignals: resistanceSignals.slice(0, 2) // Top 2 resistance signals
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
      signals.positive.push(...buyingSignalsAnalysis.commitmentSignals.map((s: string) => `🎯 ${s}`))
    }
    if (buyingSignalsAnalysis.engagementSignals) {
      signals.positive.push(...buyingSignalsAnalysis.engagementSignals.map((s: string) => `📈 ${s}`))
    }
    if (buyingSignalsAnalysis.interestSignals) {
      signals.positive.push(...buyingSignalsAnalysis.interestSignals.map((s: string) => `💡 ${s}`))
    }
    
    // Extract concerns from competitive intelligence
    const competitiveIntelligence = callSummary.competitiveIntelligence || {}
    if (competitiveIntelligence.concerns) {
      signals.concerns.push(...competitiveIntelligence.concerns.map((c: string) => `⚠️ ${c}`))
    }
    if (competitiveIntelligence.objections) {
      signals.concerns.push(...competitiveIntelligence.objections.map((o: string) => `❓ ${o}`))
    }
    
    // Extract competitive mentions
    if (competitiveIntelligence.competitorsMentioned) {
      signals.competitive.push(...competitiveIntelligence.competitorsMentioned.map((c: any) => `🏢 ${c.name}: ${c.context}`))
    }
    
    // Extract pain indicators
    const painSeverity = callSummary.painSeverity || {}
    if (painSeverity.indicators) {
      signals.pain.push(...painSeverity.indicators.map((p: string) => `🔥 ${p}`))
    }
    
    return signals
  }

  const conversationIntel = getConversationIntelligence()

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

          {/* REVOLUTIONARY STRATEGIC INTELLIGENCE HERO - DO NOT TOUCH */}
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

              {/* Decision Architecture (Enhanced Participants) */}
              <div className="mb-6 flex flex-wrap items-center gap-3 text-sm">
                <span className="text-slate-300">Decision Architecture:</span>
                {participants?.clientContacts && participants.clientContacts.length > 0 ? (
                  participants.clientContacts.slice(0, 4).map((contact: any, index: number) => {
                    const stakeholderDisplay = getStakeholderDisplay(contact);
                    if (!stakeholderDisplay) {
                      // Fallback for contacts without challenger roles
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

              {/* Enhanced 4-Card Intelligence Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                
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

                {/* Competitive Edge */}
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 hover:bg-white/15 transition-all">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                      <Target className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-purple-200">Competitive Edge</span>
                  </div>
                  <div className="text-lg font-bold text-purple-300">
                    {analysis.recommendations?.competitiveStrategy ? "Strategic Advantage" : "Integration Focus"}
                  </div>
                  <p className="text-xs text-gray-300">
                    {timeline.driver || "Positioning opportunity identified"}
                  </p>
                </div>
              </div>

              {/* STRATEGIC POSITIONING BANNER - GAME CHANGER */}
              <div className="bg-gradient-to-r from-emerald-500/20 to-blue-500/20 rounded-xl p-6 border border-emerald-400/30 mb-6">
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
                  <div className="text-right text-emerald-300">
                    <div className="font-bold text-lg">Competitive</div>
                    <div className="text-sm">Advantage</div>
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

              {/* Essential Business Context (Integrated, No Redundancy) */}
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

          {/* STAGE 3: DEAL REALITY ASSESSMENT BANNER */}
          {(() => {
            const assessment = getDealAssessment()
            
            const bannerConfig = {
              'high': {
                bgColor: 'bg-gradient-to-r from-green-500/20 to-emerald-500/20',
                borderColor: 'border-green-400/30',
                textColor: 'text-green-300',
                icon: '🎯',
                title: 'HIGH-PROBABILITY OPPORTUNITY',
                message: 'Strong signals indicate qualified prospect with genuine need and timeline'
              },
              'medium': {
                bgColor: 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20',
                borderColor: 'border-yellow-400/30', 
                textColor: 'text-yellow-300',
                icon: '⚡',
                title: 'QUALIFICATION REQUIRED',
                message: 'Mixed signals require strategic qualification before major resource investment'
              },
              'low': {
                bgColor: 'bg-gradient-to-r from-blue-500/20 to-indigo-500/20',
                borderColor: 'border-blue-400/30',
                textColor: 'text-blue-300', 
                icon: '📅',
                title: 'LONG-TERM NURTURE CANDIDATE',
                message: 'Current signals suggest timing or fit challenges - maintain relationship for future opportunity'
              },
              'very-low': {
                bgColor: 'bg-gradient-to-r from-gray-500/20 to-slate-500/20',
                borderColor: 'border-gray-400/30',
                textColor: 'text-gray-300',
                icon: '🔍',
                title: 'STRATEGIC EVALUATION NEEDED', 
                message: 'Multiple resistance indicators suggest reassessing fit and resource allocation priorities'
              }
            }
            
            const config = bannerConfig[assessment.probability as keyof typeof bannerConfig]
            
            return (
              <div className={`${config.bgColor} rounded-xl p-6 border ${config.borderColor} mb-8`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-3xl">{config.icon}</div>
                    <div>
                      <h3 className={`text-xl font-bold ${config.textColor}`}>{config.title}</h3>
                      <p className="text-gray-200 max-w-2xl">{config.message}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold text-lg ${config.textColor}`}>{assessment.assessment}</div>
                    <div className="text-sm text-gray-300 capitalize">{assessment.strategy}</div>
                  </div>
                </div>
                
                {/* Show resistance signals for low probability deals */}
                {assessment.probability === 'low' || assessment.probability === 'very-low' ? (
                  <div className="mt-4 pt-4 border-t border-gray-400/20">
                    <h4 className="text-sm font-semibold text-gray-300 mb-2">Key Resistance Indicators:</h4>
                    <div className="flex flex-wrap gap-2">
                      {assessment.resistanceSignals.map((signal, index) => (
                        <span key={index} className="text-xs bg-gray-600/30 px-2 py-1 rounded text-gray-300">
                          {signal}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            )
          })()}

          {/* STAGE 2: PRIORITY TEMPLATES SECTION - Moved up for immediate access */}
          {(() => {
            const templates = getReadyToExecuteTemplates()
            if (!templates || templates.length === 0) return null
            
            return (
              <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-l-green-500 mb-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <Mail className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Ready-to-Execute Templates</h3>
                      <p className="text-sm text-green-600">Copy-paste content ready for immediate use</p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800 px-3 py-1 text-sm">PRIORITY ACCESS</Badge>
                </div>

                <div className="grid gap-4">
                  {templates.map((action, index) => (
                    <div key={index} className="border border-green-200 rounded-lg p-4 bg-green-50">
                      <h4 className="font-semibold text-green-900 mb-3">{action.action}</h4>
                      
                      {action.copyPasteContent?.subject && (
                        <div className="mb-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-green-800">Subject Line</span>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="border-green-300 text-green-700 hover:bg-green-100"
                              onClick={() => copyToClipboard(action.copyPasteContent.subject, 'Subject line')}
                            >
                              <Copy className="w-4 h-4 mr-1" />
                              Copy
                            </Button>
                          </div>
                          <p className="text-sm font-mono bg-white p-2 rounded border border-green-200">
                            {action.copyPasteContent.subject}
                          </p>
                        </div>
                      )}
                      
                      {action.copyPasteContent?.body && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-green-800">Email Content</span>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="border-green-300 text-green-700 hover:bg-green-100"
                                onClick={() => copyToClipboard(action.copyPasteContent.body, 'Email content')}
                              >
                                <Copy className="w-4 h-4 mr-1" />
                                Copy
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="border-green-300 text-green-700 hover:bg-green-100"
                                onClick={() => openInEmailClient(action.copyPasteContent.subject, action.copyPasteContent.body)}
                              >
                                <ExternalLink className="w-4 h-4 mr-1" />
                                Open
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm font-mono whitespace-pre-wrap bg-white p-3 rounded border border-green-200 max-h-40 overflow-y-auto">
                            {action.copyPasteContent.body.length > 300 ? 
                              action.copyPasteContent.body.substring(0, 300) + '...' : 
                              action.copyPasteContent.body
                            }
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}

          {/* STAGE 3: ENHANCED ACTION COMMAND */}
          <div className="bg-white rounded-xl p-6 border-l-4 border-red-500 shadow-lg mb-8">
            {(() => {
              const assessment = getDealAssessment()
              
              const actionConfig = {
                'high': {
                  title: 'Strike Now',
                  subtitle: 'Execute immediate advancement strategy',
                  priority: 'EXECUTE IMMEDIATELY',
                  bgColor: 'bg-red-50',
                  borderColor: 'border-red-200'
                },
                'medium': {
                  title: 'Qualify & Advance',
                  subtitle: 'Strategic qualification before major investment',
                  priority: 'QUALIFY FIRST',
                  bgColor: 'bg-yellow-50', 
                  borderColor: 'border-yellow-200'
                },
                'low': {
                  title: 'Nurture Strategy',
                  subtitle: 'Maintain relationship for future opportunity',
                  priority: 'LONG-TERM NURTURE',
                  bgColor: 'bg-blue-50',
                  borderColor: 'border-blue-200'
                },
                'very-low': {
                  title: 'Strategic Evaluation',
                  subtitle: 'Assess resource allocation priorities', 
                  priority: 'EVALUATE FIT',
                  bgColor: 'bg-gray-50',
                  borderColor: 'border-gray-200'
                }
              }
              
              const config = actionConfig[assessment.probability as keyof typeof actionConfig]
              
              return (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-red-100 rounded-lg">
                        <Zap className="h-6 w-6 text-red-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{config.title}</h3>
                        <p className="text-sm text-red-600">{config.subtitle}</p>
                      </div>
                    </div>
                    <Badge className="bg-red-100 text-red-800 px-3 py-1 text-sm">{config.priority}</Badge>
                  </div>

                  {/* Primary Strategic Action with assessment-based guidance */}
                  {analysis.recommendations?.immediateActions?.slice(0, 1).map((action: any, index: number) => (
                    <div key={index} className={`${config.bgColor} rounded-lg p-6 mb-4 border ${config.borderColor}`}>
                      <h4 className="font-bold text-gray-900 mb-4 text-lg flex items-center gap-2">
                        <Phone className="h-5 w-5 text-red-600" />
                        {action.action || `Execute ${assessment.strategy} approach`}
                      </h4>
                      
                      {/* Strategic Context */}
                      <div className="space-y-4 mb-6">
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">1</div>
                          <div>
                            <p className="font-semibold text-gray-800">Lead with business urgency</p>
                            <p className="text-gray-600 text-sm">
                              Reference their specific pain points and timeline pressures discussed
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">2</div>
                          <div>
                            <p className="font-semibold text-gray-800">Position competitive advantages</p>
                            <p className="text-gray-600 text-sm">
                              {analysis.recommendations?.competitiveStrategy?.substring(0, 100) + "..." || 
                               "Highlight unique capabilities that competitors cannot match"}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">3</div>
                          <div>
                            <p className="font-semibold text-gray-800">Create decision momentum</p>
                            <p className="text-gray-600 text-sm">
                              {action.objective || "Propose specific next steps that move toward commitment"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* PRESERVE EXACT BUTTON FUNCTIONALITY */}
                      <div className="flex gap-3">
                        <Button 
                          className="bg-red-600 hover:bg-red-700 flex-1"
                          onClick={() => copyToClipboard(action.copyPasteContent?.body || "Action content", 'Action template')}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Full Script
                        </Button>
                        <Button variant="outline" className="flex-1">
                          <Calendar className="h-4 w-4 mr-2" />
                          Schedule Follow-up
                        </Button>
                      </div>
                    </div>
                  )) || (
                    <div className={`${config.bgColor} rounded-lg p-6 mb-4 border ${config.borderColor}`}>
                      <h4 className="font-bold text-gray-900 mb-4 text-lg">
                        {assessment.probability === 'high' ? 'Execute Strategic Follow-up' :
                         assessment.probability === 'medium' ? 'Qualification Strategy' :
                         assessment.probability === 'low' ? 'Nurture Approach' :
                         'Strategic Evaluation'}
                      </h4>
                      <p className="text-gray-600 mb-4">
                        {assessment.probability === 'high' ? 'Advance opportunity aggressively based on strong signals' :
                         assessment.probability === 'medium' ? 'Qualify thoroughly before major resource investment' :
                         assessment.probability === 'low' ? 'Maintain relationship for future timing when conditions improve' :
                         'Evaluate whether continued pursuit aligns with resource allocation priorities'}
                      </p>
                      <div className="flex gap-3">
                        <Button className="bg-red-600 hover:bg-red-700 flex-1">
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Action Plan
                        </Button>
                        <Button variant="outline" className="flex-1">
                          <Calendar className="h-4 w-4 mr-2" />
                          Schedule Follow-up
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Strategic Why */}
                  <div className="bg-yellow-50 rounded-lg p-4 border-l-4 border-yellow-400">
                    <div className="flex items-start gap-3">
                      <Lightbulb className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div>
                        <h5 className="font-semibold text-yellow-800 mb-1">Why This Approach Wins</h5>
                        <p className="text-yellow-700 text-sm">
                          {analysis.reasoning?.whyTheseRecommendations?.substring(0, 200) + "..." || 
                           "This approach leverages stakeholder dynamics and competitive positioning to accelerate decision-making while addressing key concerns."}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )
            })()}
          </div>

          {/* STAGE 1: STAKEHOLDER NAVIGATION MAP - Only show if meaningful data exists */}
          {(() => {
            const stakeholderData = hasStakeholderData()
            if (!stakeholderData.hasAnyStakeholders) return null
            
            return (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
                <div className="flex items-center gap-3 mb-6">
                  <Users className="h-6 w-6 text-blue-600" />
                  <h3 className="text-lg font-semibold">Stakeholder Navigation Map</h3>
                  <Badge variant="outline" className="text-xs">Strategic Intelligence</Badge>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  {/* Economic Buyers - Only show if data exists */}
                  {stakeholderData.hasEconomicBuyers && (
                    <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                      <h4 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
                        🏛️ Economic Buyers
                      </h4>
                      <div className="space-y-3">
                        {analysis.participants?.clientContacts?.filter((contact: any) => 
                          contact.challengerRole === 'Economic Buyer' || contact.decisionLevel === 'high'
                        ).map((contact: any, index: number) => (
                          <div key={index}>
                            <p className="font-medium">{contact.name} ({contact.title})</p>
                            <p className="text-sm text-gray-600">
                              {contact.decisionEvidence?.[0] || contact.roleEvidence?.[0] || "Key decision authority"}
                            </p>
                            <Badge variant="outline" className="text-xs mt-1">Primary Contact</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Influencers - Only show if data exists */}
                  {stakeholderData.hasInfluencers && (
                    <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                      <h4 className="font-semibold text-yellow-800 mb-3 flex items-center gap-2">
                        📊 Key Influencers
                      </h4>
                      <div className="space-y-3">
                        {analysis.participants?.clientContacts?.filter((contact: any) => 
                          contact.challengerRole === 'Influencer' || contact.decisionLevel === 'medium'
                        ).map((contact: any, index: number) => (
                          <div key={index}>
                            <p className="font-medium">{contact.name} ({contact.title})</p>
                            <p className="text-sm text-gray-600">
                              {contact.roleEvidence?.[0] || "Influences decision process"}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Navigation Strategy - Always show if any stakeholders exist */}
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                      🎯 Navigation Strategy
                    </h4>
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-blue-800">
                        {analysis.recommendations?.stakeholderPlan || "Multi-stakeholder coordination approach"}
                      </p>
                      <ul className="text-sm space-y-2">
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          Lead with economic buyers
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                          Coordinate with influencers
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          Validate with end users
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )
          })()}

          {/* STAGE 4 ALTERNATIVE: PRIORITY GUIDANCE BANNER */}
          {(() => {
            const { dealProbability } = getSectionPriority()
            
            const guidanceConfig = {
              high: {
                icon: '🎯',
                title: 'High-Priority Analysis',
                message: 'Focus on execution planning and competitive positioning',
                bgColor: 'bg-green-50',
                borderColor: 'border-green-200',
                textColor: 'text-green-700'
              },
              medium: {
                icon: '⚡',
                title: 'Qualification-Focused Review',
                message: 'Prioritize insights and strategic planning sections',
                bgColor: 'bg-yellow-50',
                borderColor: 'border-yellow-200', 
                textColor: 'text-yellow-700'
              },
              low: {
                icon: '📋',
                title: 'Intelligence Gathering Mode',
                message: 'Review insights for future opportunity development',
                bgColor: 'bg-blue-50',
                borderColor: 'border-blue-200',
                textColor: 'text-blue-700'
              }
            }
            
            const config = guidanceConfig[dealProbability as keyof typeof guidanceConfig]
            
            return (
              <div className={`${config.bgColor} border ${config.borderColor} rounded-lg p-4 mb-6`}>
                <div className="flex items-center gap-3">
                  <span className="text-xl">{config.icon}</span>
                  <div>
                    <h4 className={`font-semibold ${config.textColor}`}>{config.title}</h4>
                    <p className={`text-sm ${config.textColor}`}>{config.message}</p>
                  </div>
                </div>
              </div>
            )
          })()}

          {/* STAGE 4 ALTERNATIVE: ENHANCED EXPANDABLE SECTIONS WITH VISUAL PRIORITY */}
          <div className="space-y-4">
            
            {/* Deal Acceleration Insights - Enhanced with priority styling */}
            {analysis.key_takeaways && analysis.key_takeaways.length > 0 && (
              <Card className={`${getSectionStyling('insights').containerClass} ${getSectionStyling('insights').borderClass} transition-all`}>
                <Collapsible defaultOpen={getSectionStyling('insights').defaultOpen}>
                  <CollapsibleTrigger asChild>
                    <CardHeader className={`pb-2 cursor-pointer ${getSectionStyling('insights').headerClass} transition-colors rounded-t-lg`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Lightbulb className={`w-6 h-6 ${getSectionStyling('insights').iconColor}`} />
                          <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                              Deal Acceleration Insights ({analysis.key_takeaways.length})
                              {getSectionStyling('insights').badge && (
                                <Badge className={`text-xs ${getSectionStyling('insights').badgeClass}`}>
                                  {getSectionStyling('insights').badge}
                                </Badge>
                              )}
                            </CardTitle>
                            <p className="text-sm text-yellow-700 font-normal">What they revealed about decision criteria and competitive positioning</p>
                          </div>
                        </div>
                        <ChevronDown className={`w-5 h-5 ${getSectionStyling('insights').iconColor}`} />
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

            {/* Complete Battle Plan - Enhanced with priority styling */}
            {analysis.recommendations && (
              <Card className={`${getSectionStyling('battleplan').containerClass} ${getSectionStyling('battleplan').borderClass} transition-all`}>
                <Collapsible defaultOpen={getSectionStyling('battleplan').defaultOpen}>
                  <CollapsibleTrigger asChild>
                    <CardHeader className={`pb-2 cursor-pointer ${getSectionStyling('battleplan').headerClass} transition-colors rounded-t-lg`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Target className={`w-6 h-6 ${getSectionStyling('battleplan').iconColor}`} />
                          <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                              Complete Battle Plan
                              {getSectionStyling('battleplan').badge && (
                                <Badge className={`text-xs ${getSectionStyling('battleplan').badgeClass}`}>
                                  {getSectionStyling('battleplan').badge}
                                </Badge>
                              )}
                            </CardTitle>
                            <p className="text-sm text-blue-700 font-normal">How to position against competitors based on their specific needs</p>
                          </div>
                        </div>
                        <ChevronDown className={`w-5 h-5 ${getSectionStyling('battleplan').iconColor}`} />
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

            {/* Competitive Positioning Arsenal - Enhanced with priority styling */}
            <Card className={`${getSectionStyling('competitive').containerClass} ${getSectionStyling('competitive').borderClass} transition-all`}>
              <Collapsible defaultOpen={getSectionStyling('competitive').defaultOpen}>
                <CollapsibleTrigger asChild>
                  <CardHeader className={`pb-2 cursor-pointer ${getSectionStyling('competitive').headerClass} transition-colors rounded-t-lg`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Eye className={`w-6 h-6 ${getSectionStyling('competitive').iconColor}`} />
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            Competitive Positioning Arsenal
                            {getSectionStyling('competitive').badge && (
                              <Badge className={`text-xs ${getSectionStyling('competitive').badgeClass}`}>
                                {getSectionStyling('competitive').badge}
                              </Badge>
                            )}
                          </CardTitle>
                          <p className="text-sm text-green-700 font-normal">What they revealed about evaluation process and decision criteria</p>
                        </div>
                      </div>
                      <ChevronDown className={`w-5 h-5 ${getSectionStyling('competitive').iconColor}`} />
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

            {/* Ready-to-Execute Playbook (detailed version) - Enhanced with priority styling */}
            {analysis.action_plan?.actions && analysis.action_plan.actions.length > 0 && (
              <Card className={`${getSectionStyling('templates').containerClass} ${getSectionStyling('templates').borderClass} transition-all`}>
                <Collapsible defaultOpen={getSectionStyling('templates').defaultOpen}>
                  <CollapsibleTrigger asChild>
                    <CardHeader className={`pb-2 cursor-pointer ${getSectionStyling('templates').headerClass} transition-colors rounded-t-lg`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Zap className={`w-6 h-6 ${getSectionStyling('templates').iconColor}`} />
                          <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                              Detailed Execution Context
                              {getSectionStyling('templates').badge && (
                                <Badge className={`text-xs ${getSectionStyling('templates').badgeClass}`}>
                                  {getSectionStyling('templates').badge}
                                </Badge>
                              )}
                            </CardTitle>
                            <p className="text-sm text-purple-700 font-normal">Additional context and supporting materials for template execution</p>
                          </div>
                        </div>
                        <ChevronDown className={`w-5 h-5 ${getSectionStyling('templates').iconColor}`} />
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent>
                      <div className="bg-purple-50 p-4 rounded-lg border border-purple-200 mb-4">
                        <p className="text-purple-700 text-sm">
                          ℹ️ Ready-to-use templates are displayed above for immediate access. 
                          This section provides additional context, timing considerations, and supporting materials.
                        </p>
                      </div>
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

          {/* Deal Assessment Context Footer */}
          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full text-sm text-slate-600">
              <Target className="w-4 h-4" />
              Analysis optimized for {getDealAssessment().assessment.toLowerCase()} strategy
            </div>
          </div>
        </div>
      </TooltipProvider>
    </div>
  )
}