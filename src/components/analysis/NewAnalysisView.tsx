import React, { useState } from 'react'
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
  ChevronUp,
  Lightbulb,
  FileText,
  Shield,
  Activity,
  Eye,
  Trophy,
  TrendingDown,
  Building2,
  AlertCircle,
  ArrowRight
} from 'lucide-react'
import { toast } from 'sonner'
import { HeroSection } from './HeroSection'
import { BattlePlanSection } from './BattlePlanSection'

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
      if (statedTimeline.length > 110) {
        isTextTruncated = true
        const lastSpaceIndex = statedTimeline.lastIndexOf(' ', 110)
        displayTimeline = lastSpaceIndex > 90 ? 
          statedTimeline.substring(0, lastSpaceIndex) + '...' : 
          statedTimeline.substring(0, 110) + '...'
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
  const participants = analysis.participants || {}

  // 🚀 SMART PRIORITY SYSTEM - Auto-expand based on deal heat
  const isHighPriorityDeal = dealHeat.level === 'HIGH'
  const isMediumPriorityDeal = dealHeat.level === 'MEDIUM'
  
  // State for collapsible sections with smart defaults - UPDATED: Removed battlePlan
  const [sectionsOpen, setSectionsOpen] = useState({
    insights: isHighPriorityDeal, // Open for high-priority deals
    competitive: false // Progressive disclosure
  })

  const toggleSection = (section: keyof typeof sectionsOpen) => {
    setSectionsOpen(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

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
        <div className="max-w-6xl mx-auto px-4 py-6 lg:py-8">
          
          {/* 📱 ENHANCED HEADER - Better Mobile + Priority Indicators */}
          <div className="mb-6 lg:mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
              <Button 
                variant="ghost" 
                onClick={onBackToDashboard}
                className="text-slate-600 hover:text-slate-900 self-start"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              
              <div className="flex items-center gap-3">
                {/* 🚀 PRIORITY INDICATOR */}
                {dealHeat.level === 'HIGH' && (
                  <Badge className="bg-red-100 text-red-800 px-3 py-1 animate-pulse">
                    🔥 HIGH PRIORITY
                  </Badge>
                )}
                {dealHeat.level === 'MEDIUM' && (
                  <Badge className="bg-orange-100 text-orange-800 px-3 py-1">
                    🌡️ ACTIVE DEAL
                  </Badge>
                )}
                
                <Button 
                  onClick={onUploadAnother}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Another
                </Button>
              </div>
            </div>
            
            <div className="space-y-3">
              <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 leading-tight">{transcript.title}</h1>
              <div className="flex flex-wrap items-center gap-2 lg:gap-4 text-sm text-slate-600">
                <span className="font-medium">{formatDate(transcript.meeting_date)}</span>
                <span className="hidden sm:inline">•</span>
                <span>Duration: {transcript.duration_minutes} min</span>
                <span className="hidden sm:inline">•</span>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <Star className="w-3 h-3 mr-1" />
                  Analysis Complete
                </Badge>
              </div>
            </div>
          </div>

          {/* 🏆 HERO SECTION */}
          <HeroSection
            transcript={transcript}
            analysis={analysis}
            dealHeat={dealHeat}
            decisionMaker={decisionMaker}
            buyingSignals={buyingSignals}
            timeline={timeline}
            participants={participants}
            getStakeholderDisplay={getStakeholderDisplay}
            getRoleIcon={getRoleIcon}
          />

          {/* 🚀 BATTLE PLAN SECTION */}
          <BattlePlanSection
            analysis={analysis}
            dealHeat={dealHeat}
            copyToClipboard={copyToClipboard}
            copyFullEmail={copyFullEmail}
            openInEmailClient={openInEmailClient}
          />

          {/* 🎯 ENHANCED STAKEHOLDER NAVIGATION - Better Mobile Layout - Only show if data exists */}
          {(() => {
            // Check if any stakeholder data exists
            const economicBuyers = analysis.participants?.clientContacts?.filter((contact: any) => 
              contact.challengerRole === 'Economic Buyer' || contact.decisionLevel === 'high'
            ) || []
            
            const keyInfluencers = analysis.participants?.clientContacts?.filter((contact: any) => 
              contact.challengerRole === 'Influencer' || contact.decisionLevel === 'medium'
            ) || []
            
            const hasNavigationStrategy = analysis.recommendations?.stakeholderPlan
            
            const hasAnyStakeholderData = economicBuyers.length > 0 || keyInfluencers.length > 0 || hasNavigationStrategy
            
            if (!hasAnyStakeholderData) return null
            
            return (
              <div className="bg-white rounded-xl p-4 lg:p-6 shadow-sm border border-gray-200 mb-6 lg:mb-8">
                <div className="flex flex-wrap items-center gap-3 mb-4 lg:mb-6">
                  <Users className="h-5 w-5 lg:h-6 lg:w-6 text-blue-600" />
                  <h3 className="text-base lg:text-lg font-semibold">Stakeholder Navigation Map</h3>
                  <Badge variant="outline" className="text-xs">Strategic Intelligence</Badge>
                </div>

                {(() => {
                  const cards = []
                  
                  // Add Economic Buyers card if data exists
                  if (economicBuyers.length > 0) {
                    cards.push(
                      <div key="economic" className="bg-red-50 rounded-lg p-4 border border-red-200">
                        <h4 className="font-semibold text-red-800 mb-3 flex items-center gap-2 text-sm lg:text-base">
                          🏛️ Economic Buyers
                        </h4>
                        <div className="space-y-3">
                          {economicBuyers.map((contact: any, index: number) => (
                            <div key={index}>
                              <p className="font-medium text-sm lg:text-base">{contact.name} ({contact.title})</p>
                              <p className="text-xs lg:text-sm text-gray-600 leading-relaxed">
                                {contact.decisionEvidence?.[0] || contact.roleEvidence?.[0] || "Key decision authority"}
                              </p>
                              <Badge variant="outline" className="text-xs mt-1">Primary Contact</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  }
                  
                  // Add Key Influencers card if data exists
                  if (keyInfluencers.length > 0) {
                    cards.push(
                      <div key="influencers" className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                        <h4 className="font-semibold text-yellow-800 mb-3 flex items-center gap-2 text-sm lg:text-base">
                          📊 Key Influencers
                        </h4>
                        <div className="space-y-3">
                          {keyInfluencers.map((contact: any, index: number) => (
                            <div key={index}>
                              <p className="font-medium text-sm lg:text-base">{contact.name} ({contact.title})</p>
                              <p className="text-xs lg:text-sm text-gray-600 leading-relaxed">
                                {contact.roleEvidence?.[0] || "Influences decision process"}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  }
                  
                  // Add Navigation Strategy card if data exists
                  if (hasNavigationStrategy) {
                    cards.push(
                      <div key="strategy" className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2 text-sm lg:text-base">
                          🎯 Navigation Strategy
                        </h4>
                        <div className="space-y-3">
                          <p className="text-sm font-medium text-blue-800 leading-relaxed">
                            {analysis.recommendations.stakeholderPlan}
                          </p>
                          <ul className="text-sm space-y-2">
                            <li className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></div>
                              <span>Lead with economic buyers</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-yellow-500 rounded-full flex-shrink-0"></div>
                              <span>Coordinate with influencers</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                              <span>Validate with end users</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    )
                  }
                  
                  // Determine grid classes based on number of cards
                  const gridClasses = cards.length === 1 ? "grid grid-cols-1 gap-4 lg:gap-6" :
                                     cards.length === 2 ? "grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6" :
                                     "grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6"
                  
                  return (
                    <div className={gridClasses}>
                      {cards}
                    </div>
                  )
                })()}
              </div>
            )
          })()}

          {/* 🎯 ENHANCED EXPANDABLE SECTIONS - Smart Defaults + Visual Priority */}
          <div className="space-y-4 lg:space-y-6">

            {/* 💡 Deal Acceleration Insights - High Priority Deals Auto-Open */}
            {analysis.key_takeaways && analysis.key_takeaways.length > 0 && (
              <Card className={`border-l-4 border-l-yellow-400 bg-gradient-to-r from-yellow-50 to-orange-50 transition-all ${
                sectionsOpen.insights ? 'shadow-lg' : 'hover:shadow-md'
              }`}>
                <Collapsible open={sectionsOpen.insights} onOpenChange={() => toggleSection('insights')}>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="pb-2 cursor-pointer hover:bg-yellow-100/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Lightbulb className="w-5 h-5 lg:w-6 lg:h-6 text-yellow-600" />
                          <div>
                            <CardTitle className="text-base lg:text-lg flex items-center gap-2">
                              Deal Acceleration Insights ({analysis.key_takeaways.length})
                              {isHighPriorityDeal && (
                                <Badge variant="secondary" className="bg-red-100 text-red-800 text-xs">
                                  AUTO-OPEN
                                </Badge>
                              )}
                            </CardTitle>
                            <p className="text-sm text-yellow-700 font-normal">What they revealed about decision criteria and competitive positioning</p>
                          </div>
                        </div>
                        {sectionsOpen.insights ? 
                          <ChevronUp className="w-5 h-5 text-yellow-600" /> : 
                          <ChevronDown className="w-5 h-5 text-yellow-600" />
                        }
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent>
                      <div className="space-y-3">
                        {analysis.key_takeaways.map((takeaway, index) => (
                          <div key={index} className="flex items-start gap-3 p-3 lg:p-4 bg-white rounded-lg border border-yellow-200">
                            <div className="w-6 h-6 bg-yellow-500 text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                              {index + 1}
                            </div>
                            <p className="text-gray-800 text-sm lg:text-base leading-relaxed">{takeaway}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            )}

            {/* 👁️ Competitive Positioning Arsenal - Progressive Disclosure */}
            <Card className={`border-l-4 border-l-green-400 bg-gradient-to-r from-green-50 to-emerald-50 transition-all ${
              sectionsOpen.competitive ? 'shadow-lg' : 'hover:shadow-md'
            }`}>
              <Collapsible open={sectionsOpen.competitive} onOpenChange={() => toggleSection('competitive')}>
                <CollapsibleTrigger asChild>
                  <CardHeader className="pb-2 cursor-pointer hover:bg-green-100/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Eye className="w-5 h-5 lg:w-6 lg:h-6 text-green-600" />
                        <div>
                          <CardTitle className="text-base lg:text-lg flex items-center gap-2">
                            Competitive Positioning Arsenal
                            <Badge variant="outline" className="text-xs border-green-300 text-green-700">
                              DETAILED
                            </Badge>
                          </CardTitle>
                          <p className="text-sm text-green-700 font-normal">What they revealed about evaluation process and decision criteria</p>
                        </div>
                      </div>
                      {sectionsOpen.competitive ? 
                        <ChevronUp className="w-5 h-5 text-green-600" /> : 
                        <ChevronDown className="w-5 h-5 text-green-600" />
                      }
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-4 lg:space-y-6">
                    
                    {conversationIntel.positive.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-green-700 mb-3 flex items-center gap-2 text-sm lg:text-base">
                          <Activity className="w-4 h-4 lg:w-5 lg:h-5" />
                          Buying Signals ({conversationIntel.positive.length})
                        </h4>
                        <div className="grid gap-2">
                          {conversationIntel.positive.map((signal: string, index: number) => (
                            <div key={index} className="flex items-center gap-3 p-2 lg:p-3 bg-white rounded-lg border border-green-200">
                              <CheckCircle className="w-4 h-4 lg:w-5 lg:h-5 text-green-500 flex-shrink-0" />
                              <span className="text-gray-800 text-sm lg:text-base">{signal}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {conversationIntel.pain.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-red-700 mb-3 flex items-center gap-2 text-sm lg:text-base">
                          <Thermometer className="w-4 h-4 lg:w-5 lg:h-5" />
                          Pain Indicators ({conversationIntel.pain.length})
                        </h4>
                        <div className="grid gap-2">
                          {conversationIntel.pain.map((pain: string, index: number) => (
                            <div key={index} className="flex items-center gap-3 p-2 lg:p-3 bg-red-50 rounded-lg border border-red-200">
                              <AlertTriangle className="w-4 h-4 lg:w-5 lg:h-5 text-red-500 flex-shrink-0" />
                              <span className="text-gray-800 text-sm lg:text-base">{pain}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {conversationIntel.concerns.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-orange-700 mb-3 flex items-center gap-2 text-sm lg:text-base">
                          <Shield className="w-4 h-4 lg:w-5 lg:h-5" />
                          Concerns to Address ({conversationIntel.concerns.length})
                        </h4>
                        <div className="grid gap-2">
                          {conversationIntel.concerns.map((concern: string, index: number) => (
                            <div key={index} className="flex items-center gap-3 p-2 lg:p-3 bg-orange-50 rounded-lg border border-orange-200">
                              <AlertTriangle className="w-4 h-4 lg:w-5 lg:h-5 text-orange-500 flex-shrink-0" />
                              <span className="text-gray-800 text-sm lg:text-base">{concern}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {conversationIntel.competitive.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-purple-700 mb-3 flex items-center gap-2 text-sm lg:text-base">
                          <Target className="w-4 h-4 lg:w-5 lg:h-5" />
                          Competitive Intelligence ({conversationIntel.competitive.length})
                        </h4>
                        <div className="grid gap-2">
                          {conversationIntel.competitive.map((comp: string, index: number) => (
                            <div key={index} className="flex items-center gap-3 p-2 lg:p-3 bg-purple-50 rounded-lg border border-purple-200">
                              <ExternalLink className="w-4 h-4 lg:w-5 lg:h-5 text-purple-500 flex-shrink-0" />
                              <span className="text-gray-800 text-sm lg:text-base">{comp}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {conversationIntel.positive.length === 0 && 
                     conversationIntel.concerns.length === 0 && 
                     conversationIntel.competitive.length === 0 && 
                     conversationIntel.pain.length === 0 && (
                      <div className="text-center py-6 lg:py-8">
                        <Eye className="w-10 h-10 lg:w-12 lg:h-12 text-gray-300 mx-auto mb-4" />
                        <h4 className="font-medium text-gray-600 mb-2 text-sm lg:text-base">Rich Intelligence Processing</h4>
                        <p className="text-gray-500 text-sm lg:text-base leading-relaxed max-w-md mx-auto">
                          Your conversation is being analyzed for deeper insights including buying signals, 
                          competitive intelligence, pain analysis, and stakeholder mapping.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          </div>
        </div>
      </TooltipProvider>
    </div>
  )
}
