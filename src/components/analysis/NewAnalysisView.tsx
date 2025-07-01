// 🎯 NewAnalysisView.tsx v10.1 - STRATEGIC CONTENT INTEGRATION
// Enhanced Win Strategy banner with actual strategic recommendations
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

  // Enhanced stakeholder detection logic
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

  // NEW: Extract template section helper
  const getReadyToExecuteTemplates = () => {
    const actions = analysis.action_plan?.actions || []
    if (actions.length === 0) return null
    
    return actions.filter(action => 
      action.copyPasteContent?.subject || action.copyPasteContent?.body
    )
  }

  // 🚨 ENHANCED: Win Strategy Display Function - STRATEGIC CONTENT INTEGRATION
  const getWinStrategyDisplay = () => {
    const primaryStrategy = analysis.recommendations?.primaryStrategy || ''
    const competitiveStrategy = analysis.recommendations?.competitiveStrategy || ''
    
    const competitiveIntelligence = analysis.call_summary?.competitiveIntelligence || {}
    const competitiveAdvantage = competitiveIntelligence.competitiveAdvantage || ''
    const vendorsKnown = competitiveIntelligence.vendorsKnown || []
    const evaluationStage = competitiveIntelligence.evaluationStage || 'not_evaluating'
    
    if (primaryStrategy && primaryStrategy.length > 20) {
      const strategyLower = primaryStrategy.toLowerCase()
      
      if (strategyLower.includes('contract') || strategyLower.includes('finalize') || 
          strategyLower.includes('close') || strategyLower.includes('agreement') ||
          strategyLower.includes('execute') || strategyLower.includes('complete')) {
        return {
          text1: 'Closing',
          text2: 'Strategy',
          colorClass: 'text-green-300',
          description: primaryStrategy.length > 100 ? 
            primaryStrategy.substring(0, 100) + '...' : primaryStrategy,
          strategicContent: primaryStrategy
        }
      }
      
      if (strategyLower.includes('differentiate') || strategyLower.includes('unique') || 
          strategyLower.includes('advantage') || strategyLower.includes('position') ||
          strategyLower.includes('competitive')) {
        return {
          text1: 'Competitive',
          text2: 'Positioning',
          colorClass: 'text-blue-300',
          description: primaryStrategy.length > 100 ? 
            primaryStrategy.substring(0, 100) + '...' : primaryStrategy,
          strategicContent: primaryStrategy
        }
      }
      
      if (strategyLower.includes('stakeholder') || strategyLower.includes('relationship') || 
          strategyLower.includes('engage') || strategyLower.includes('alignment') ||
          strategyLower.includes('coordinate') || strategyLower.includes('involve')) {
        return {
          text1: 'Stakeholder',
          text2: 'Alignment',
          colorClass: 'text-purple-300',
          description: primaryStrategy.length > 100 ? 
            primaryStrategy.substring(0, 100) + '...' : primaryStrategy,
          strategicContent: primaryStrategy
        }
      }
      
      if (strategyLower.includes('value') || strategyLower.includes('roi') || 
          strategyLower.includes('benefit') || strategyLower.includes('impact') ||
          strategyLower.includes('demonstrate') || strategyLower.includes('show')) {
        return {
          text1: 'Value',
          text2: 'Demonstration',
          colorClass: 'text-emerald-300',
          description: primaryStrategy.length > 100 ? 
            primaryStrategy.substring(0, 100) + '...' : primaryStrategy,
          strategicContent: primaryStrategy
        }
      }
      
      return {
        text1: 'Strategic',
        text2: 'Approach',
        colorClass: 'text-indigo-300',
        description: primaryStrategy.length > 100 ? 
          primaryStrategy.substring(0, 100) + '...' : primaryStrategy,
        strategicContent: primaryStrategy
      }
    }
    
    const hasSignificantBarriers = competitiveAdvantage.toLowerCase().includes('significant barriers') ||
                                  competitiveAdvantage.toLowerCase().includes('major obstacles') ||
                                  competitiveAdvantage.toLowerCase().includes('strong resistance') ||
                                  competitiveAdvantage.toLowerCase().includes('considerable challenges')
    
    const hasVendorLockIn = competitiveAdvantage.toLowerCase().includes('locked in') ||
                           competitiveAdvantage.toLowerCase().includes('satisfied with current') ||
                           competitiveAdvantage.toLowerCase().includes('long-term contract')
    
    if (hasSignificantBarriers || hasVendorLockIn) {
      return {
        text1: 'Competitive',
        text2: 'Challenge',
        colorClass: 'text-red-300',
        description: 'Address barriers and positioning challenges',
        strategicContent: 'Focus on overcoming competitive challenges and positioning obstacles'
      }
    }
    
    if (competitiveAdvantage && 
        !competitiveAdvantage.includes('vs Competitors') && 
        !competitiveAdvantage.includes('were not explicitly mentioned') &&
        competitiveAdvantage.length > 50) {
      return {
        text1: 'Competitive',
        text2: 'Advantage',
        colorClass: 'text-emerald-300',
        description: 'Leverage positioning strengths',
        strategicContent: 'Capitalize on competitive advantages and positioning strengths'
      }
    }
    
    if (vendorsKnown.length > 0 || evaluationStage === 'active' || evaluationStage === 'final') {
      return {
        text1: 'Market',
        text2: 'Position',
        colorClass: 'text-yellow-300',
        description: 'Navigate competitive evaluation',
        strategicContent: 'Navigate competitive evaluation and market positioning'
      }
    }
    
    return {
      text1: 'Strategic',
      text2: 'Focus',
      colorClass: 'text-blue-300',
      description: 'Execute strategic positioning',
      strategicContent: 'Focus on strategic positioning and opportunity advancement'
    }
  }

  // Enhanced data mapping functions for hero section
  const getDealHeat = () => {
    const painLevel = analysis.call_summary?.painSeverity?.level || 'low'
    const indicators = analysis.call_summary?.painSeverity?.indicators || []
    const businessImpact = analysis.call_summary?.painSeverity?.businessImpact || ''
    
    const criticalFactors = analysis.call_summary?.urgencyDrivers?.criticalFactors || []
    const businessFactors = analysis.call_summary?.urgencyDrivers?.businessFactors || []
    const generalFactors = analysis.call_summary?.urgencyDrivers?.generalFactors || []
    
    const urgencyScore = (criticalFactors.length * 3) + 
                        (businessFactors.length * 2) + 
                        (generalFactors.length * 1)
    
    const buyingSignals = analysis.call_summary?.buyingSignalsAnalysis || {}
    const commitmentSignals = buyingSignals.commitmentSignals || []
    const engagementSignals = buyingSignals.engagementSignals || []
    
    const timelineAnalysis = analysis.call_summary?.timelineAnalysis || {}
    const statedTimeline = timelineAnalysis.statedTimeline || ''
    const businessDriver = timelineAnalysis.businessDriver || ''
    
    let dealScore = urgencyScore
    
    dealScore += commitmentSignals.length * 2
    dealScore += engagementSignals.length * 1
    
    const timelineText = (statedTimeline + ' ' + businessDriver).toLowerCase()
    if (timelineText.includes('friday') || timelineText.includes('this week') || 
        timelineText.includes('immediate') || timelineText.includes('asap')) {
      dealScore += 3
    }
    if (timelineText.includes('contract') || timelineText.includes('execute') || 
        timelineText.includes('sign') || timelineText.includes('docs')) {
      dealScore += 2
    }
    
    const resistanceData = analysis.call_summary?.resistanceAnalysis || {}
    const resistanceLevel = resistanceData.level || 'none'
    const resistanceSignals = resistanceData.signals || []
    
    let resistancePenalty = 0
    
    if (resistanceLevel === 'high') {
      resistancePenalty += 8
    } else if (resistanceLevel === 'medium') {
      resistancePenalty += 4
    }
    
    const allResistanceText = resistanceSignals.join(' ').toLowerCase()
    
    if (allResistanceText.includes('not actively looking') || 
        allResistanceText.includes('not looking for') ||
        allResistanceText.includes('no immediate need')) {
      resistancePenalty += 3
    }
    
    if (allResistanceText.includes('budget constraints') || 
        allResistanceText.includes('budget concerns') ||
        allResistanceText.includes('cost concerns')) {
      resistancePenalty += 2
    }
    
    if (allResistanceText.includes('satisfied with current') || 
        allResistanceText.includes('current solution works')) {
      resistancePenalty += 2
    }
    
    if (allResistanceText.includes('timing concerns') || 
        allResistanceText.includes('not the right time')) {
      resistancePenalty += 1
    }
    
    dealScore = Math.max(0, dealScore - resistancePenalty)
    
    let heatLevel = 'LOW'
    let emoji = '❄️'
    let description = 'Long-term opportunity'
    
    if (
      painLevel === 'high' ||
      criticalFactors.length >= 1 ||
      dealScore >= 8 ||
      (commitmentSignals.length >= 2 && dealScore >= 6) ||
      (painLevel === 'medium' && commitmentSignals.length >= 2 && dealScore >= 5)
    ) {
      heatLevel = 'HIGH'
      emoji = '🔥'
      description = 'Immediate attention needed'
    } else if (
      painLevel === 'medium' || 
      (businessFactors || []).length >= 1 ||
      dealScore >= 3
    ) {
      heatLevel = 'MEDIUM'
      emoji = '🌡️'
      description = 'Active opportunity'
    }
    
    return {
      level: heatLevel,
      emoji,
      description,
      evidence: indicators.slice(0, 2),
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
    
    const scoredContacts = contacts.map((contact: any) => {
      const evidence = contact.decisionEvidence || []
      const decisionLevel = contact.decisionLevel || 'low'
      
      let authorityScore = 0
      
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
    
    const topContact = scoredContacts.sort((a, b) => b.authorityScore - a.authorityScore)[0]
    
    return {
      name: topContact.name || 'Key Contact',
      title: topContact.title || 'Decision Maker',
      influence: `${topContact.confidence} Influence`,
      confidence: topContact.confidence,
      evidence: topContact.evidence.slice(0, 1)
    }
  }

  const getBuyingSignals = () => {
    const signalsAnalysis = analysis.call_summary?.buyingSignalsAnalysis || {}
    
    const commitmentSignals = signalsAnalysis.commitmentSignals || []
    const engagementSignals = signalsAnalysis.engagementSignals || []
    const interestSignals = signalsAnalysis.interestSignals || []
    
    const commitmentScore = commitmentSignals.length * 3
    const engagementScore = engagementSignals.length * 2
    const interestScore = interestSignals.length * 1
    
    const totalScore = commitmentScore + engagementScore + interestScore
    const totalSignals = commitmentSignals.length + engagementSignals.length + interestSignals.length
    
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
      total: Math.max(totalSignals, 3),
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
    
    let displayTimeline = 'This Month'
    let urgencyLevel = 'LOW'
    let isTextTruncated = false
    
    if (statedTimeline) {
      if (statedTimeline.length > 80) {
        isTextTruncated = true
        const lastSpaceIndex = statedTimeline.lastIndexOf(' ', 80)
        displayTimeline = lastSpaceIndex > 60 ? 
          statedTimeline.substring(0, lastSpaceIndex) + '...' : 
          statedTimeline.substring(0, 80) + '...'
      } else {
        displayTimeline = statedTimeline
      }
      
      if (flexibility === 'low' || consequences.toLowerCase().includes('critical')) {
        urgencyLevel = 'HIGH'
      } else if (flexibility === 'medium' || businessDriver) {
        urgencyLevel = 'MEDIUM'
      }
    } else {
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
  const winStrategyDisplay = getWinStrategyDisplay()

  // Extract participants data for the new section
  const participants = analysis.participants || {}

  // Helper function to get conversation intelligence signals
  const getConversationIntelligence = () => {
    const callSummary = analysis.call_summary || {}
    
    const signals = {
      positive: [],
      concerns: [],
      competitive: [],
      pain: []
    }
    
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
    
    const competitiveIntelligence = callSummary.competitiveIntelligence || {}
    if (competitiveIntelligence.concerns) {
      signals.concerns.push(...competitiveIntelligence.concerns.map(c => `⚠️ ${c}`))
    }
    if (competitiveIntelligence.objections) {
      signals.concerns.push(...competitiveIntelligence.objections.map(o => `❓ ${o}`))
    }
    
    if (competitiveIntelligence.competitorsMentioned) {
      signals.competitive.push(...competitiveIntelligence.competitorsMentioned.map(c => `🏢 ${c.name}: ${c.context}`))
    }
    
    const painSeverity = callSummary.painSeverity || {}
    if (painSeverity.indicators) {
      signals.pain.push(...painSeverity.indicators.map(p => `🔥 ${p}`))
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

          {/* REVOLUTIONARY STRATEGIC INTELLIGENCE HERO */}
          <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 rounded-2xl p-8 text-white relative overflow-hidden mb-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.15),transparent_50%)]"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(168,85,247,0.1),transparent_50%)]"></div>
            
            <div className="relative z-10">
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

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                
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

              <div className="bg-gradient-to-r from-emerald-500/20 to-blue-500/20 rounded-xl p-6 border border-emerald-400/30 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Shield className="w-8 h-8 text-emerald-300" />
                    <div className="flex-1">
                      <h4 className="text-xl font-bold text-white">Win Strategy</h4>
                      <p className="text-emerald-200 text-sm max-w-2xl leading-relaxed">
                        {winStrategyDisplay.strategicContent || 
                         "Position as the solution that uniquely addresses their specific business challenges and competitive requirements"}
                      </p>
                    </div>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className={`text-right ${winStrategyDisplay.colorClass} cursor-help`}>
                        <div className="font-bold text-lg">{winStrategyDisplay.text1}</div>
                        <div className="text-sm">{winStrategyDisplay.text2}</div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-sm max-w-xs">
                        {winStrategyDisplay.description}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>

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

          {/* PRIORITY TEMPLATES SECTION - Moved up for immediate access */}
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

          {/* HYPER-SPECIFIC ACTION COMMAND */}
          <div className="bg-white rounded-xl p-6 border-l-4 border-red-500 shadow-lg mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-100 rounded-lg">
                  <Zap className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Strike Now</h3>
                  <p className="text-sm text-red-600">Competitive window + stakeholder alignment</p>
                </div>
              </div>
              <Badge className="bg-red-100 text-red-800 px-3 py-1 text-sm">HIGH PRIORITY</Badge>
            </div>

            {analysis.recommendations?.immediateActions?.slice(0, 1).map((action: any, index: number) => (
              <div key={index} className="bg-red-50 rounded-lg p-6 mb-4 border border-red-200">
                <h4 className="font-bold text-gray-900 mb-4 text-lg flex items-center gap-2">
                  <Phone className="h-5 w-5 text-red-600" />
                  {action.action || "Execute Strategic Follow-up"}
                </h4>
                
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
              <div className="bg-red-50 rounded-lg p-6 mb-4 border border-red-200">
                <h4 className="font-bold text-gray-900 mb-4 text-lg">Execute Strategic Follow-up</h4>
                <p className="text-gray-600 mb-4">
                  Contact key stakeholders to advance the opportunity based on conversation insights
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
          </div>

          {/* STAKEHOLDER NAVIGATION MAP - Only show if meaningful data exists */}
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

                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                      🎯 Navigation Strategy
                    </h4>
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-blue-800">
                        {analysis.recommendations?.stakeholderPlan || "Multi-stakeholder coordination approach"}
                      </p>
                      <ul className="text-sm space-y-2">
                        {stakeholderData.hasEconomicBuyers && (
                          <li className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            Lead with economic buyers
                          </li>
                        )}
                        {stakeholderData.hasInfluencers && (
                          <li className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                            Coordinate with influencers
                          </li>
                        )}
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

          {/* ENHANCED EXPANDABLE SECTIONS */}
          <div className="space-y-4">
            
            {/* Deal Acceleration Insights */}
            {analysis.key_takeaways && analysis.key_takeaways.length > 0 && (
              <Card className="border-l-4 border-l-yellow-400 bg-gradient-to-r from-yellow-50 to-orange-50 hover:shadow-lg transition-all">
                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="pb-2 cursor-pointer hover:bg-yellow-100/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Lightbulb className="w-6 h-6 text-yellow-600" />
                          <div>
                            <CardTitle className="text-lg">Deal Acceleration Insights ({analysis.key_takeaways.length})</CardTitle>
                            <p className="text-sm text-yellow-700 font-normal">What they revealed about decision criteria and competitive positioning</p>
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

            {/* Complete Battle Plan */}
            {analysis.recommendations && (
              <Card className="border-l-4 border-l-blue-400 bg-gradient-to-r from-blue-50 to-indigo-50 hover:shadow-lg transition-all">
                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="pb-2 cursor-pointer hover:bg-blue-100/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Target className="w-6 h-6 text-blue-600" />
                          <div>
                            <CardTitle className="text-lg">Complete Battle Plan</CardTitle>
                            <p className="text-sm text-blue-700 font-normal">How to position against competitors based on their specific needs</p>
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

            {/* Competitive Positioning Arsenal */}
            <Card className="border-l-4 border-l-green-400 bg-gradient-to-r from-green-50 to-emerald-50 hover:shadow-lg transition-all">
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <CardHeader className="pb-2 cursor-pointer hover:bg-green-100/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Eye className="w-6 h-6 text-green-600" />
                        <div>
                          <CardTitle className="text-lg">Competitive Positioning Arsenal</CardTitle>
                          <p className="text-sm text-green-700 font-normal">What they revealed about evaluation process and decision criteria</p>
                        </div>
                      </div>
                      <ChevronDown className="w-5 h-5 text-green-600" />
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-6">
                    
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

            {/* Ready-to-Execute Playbook */}
            {analysis.action_plan?.actions && analysis.action_plan.actions.length > 0 && (
              <Card className="border-l-4 border-l-purple-400 bg-gradient-to-r from-purple-50 to-indigo-50 hover:shadow-lg transition-all">
                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="pb-2 cursor-pointer hover:bg-purple-100/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Zap className="w-6 h-6 text-purple-600" />
                          <div>
                            <CardTitle className="text-lg">Ready-to-Execute Playbook</CardTitle>
                            <p className="text-sm text-purple-700 font-normal">Email templates and scripts ready to use immediately</p>
                          </div>
                        </div>
                        <ChevronDown className="w-5 h-5 text-purple-600" />
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent>
                      {/* Note: Primary templates now shown above for priority access */}
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
                        <p className="text-blue-700 text-sm">
                          ℹ️ Most important templates are now displayed above for immediate access. 
                          Additional detailed action plans and context available here.
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
        </div>
      </TooltipProvider>
    </div>
  )
}
