// 🎯 NewAnalysisView.tsx v11.0 - DECISION-FOCUSED TRANSFORMATION
// PURSUE → NURTURE → DISQUALIFY architecture with Sales Whisperer intelligence
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
  Pause,
  PlayCircle,
  Timer,
  Trash2
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

  // 🎯 CORE DECISION LOGIC - PURSUE/NURTURE/DISQUALIFY
  const getDealAssessment = () => {
    const resistance = analysis.call_summary?.resistanceAnalysis?.level || 'none'
    const resistanceSignals = analysis.call_summary?.resistanceAnalysis?.signals || []
    const criticalFactors = analysis.call_summary?.urgencyDrivers?.criticalFactors || []
    const businessFactors = analysis.call_summary?.urgencyDrivers?.businessFactors || []
    const commitmentSignals = analysis.call_summary?.buyingSignalsAnalysis?.commitmentSignals || []
    const engagementSignals = analysis.call_summary?.buyingSignalsAnalysis?.engagementSignals || []
    const painLevel = analysis.call_summary?.painSeverity?.level || 'low'
    const overallQuality = analysis.call_summary?.buyingSignalsAnalysis?.overallQuality || 'weak'
    
    // 🚨 DISQUALIFY CONDITIONS
    if (resistance === 'high') {
      return {
        decision: 'DISQUALIFY',
        confidence: 'high',
        reason: 'High resistance patterns detected',
        colorScheme: 'red',
        icon: XCircle,
        action: 'Move to nurture or disqualify',
        timeline: 'Reassess in 6 months'
      }
    }
    
    // Check for satisfaction signals
    const satisfactionSignals = resistanceSignals.filter(signal => 
      signal.toLowerCase().includes('satisfied with current') ||
      signal.toLowerCase().includes('not a priority') ||
      signal.toLowerCase().includes('working fine') ||
      signal.toLowerCase().includes('no need')
    )
    
    if (satisfactionSignals.length >= 2 || (painLevel === 'low' && resistance === 'medium')) {
      return {
        decision: 'DISQUALIFY',
        confidence: 'high',
        reason: 'Satisfied with status quo - no compelling reason to change',
        colorScheme: 'red',
        icon: XCircle,
        action: 'Add to nurture campaign',
        timeline: 'Check back in 3-6 months'
      }
    }
    
    // 🟢 PURSUE CONDITIONS
    if (criticalFactors.length >= 1 && commitmentSignals.length >= 1) {
      return {
        decision: 'PURSUE',
        confidence: 'high',
        reason: 'Critical urgency with buying signals',
        colorScheme: 'green',
        icon: PlayCircle,
        action: 'Execute immediately',
        timeline: 'Follow up within 24-48 hours'
      }
    }
    
    if (painLevel === 'high' && resistance !== 'high' && commitmentSignals.length >= 1) {
      return {
        decision: 'PURSUE',
        confidence: 'high',
        reason: 'High pain with commitment signals',
        colorScheme: 'green',
        icon: PlayCircle,
        action: 'Accelerate deal process',
        timeline: 'Follow up within 24-48 hours'
      }
    }
    
    if (businessFactors.length >= 2 && resistance === 'low' && overallQuality !== 'weak') {
      return {
        decision: 'PURSUE',
        confidence: 'medium',
        reason: 'Business drivers with manageable resistance',
        colorScheme: 'green',
        icon: PlayCircle,
        action: 'Advance strategically',
        timeline: 'Follow up within 1 week'
      }
    }
    
    // 🟡 NURTURE CONDITIONS
    if (engagementSignals.length >= 2 && resistance !== 'high') {
      return {
        decision: 'NURTURE',
        confidence: 'medium',
        reason: 'Engagement without urgency - build relationship',
        colorScheme: 'yellow',
        icon: Timer,
        action: 'Nurture relationship',
        timeline: 'Monthly check-ins'
      }
    }
    
    if (painLevel === 'medium' && resistance === 'low') {
      return {
        decision: 'NURTURE',
        confidence: 'medium',
        reason: 'Medium pain without urgency',
        colorScheme: 'yellow',
        icon: Timer,
        action: 'Build case for change',
        timeline: 'Quarterly follow-ups'
      }
    }
    
    // 🔴 DEFAULT DISQUALIFY (when no clear positive signals)
    if (resistance === 'medium' && painLevel === 'low' && commitmentSignals.length === 0) {
      return {
        decision: 'DISQUALIFY',
        confidence: 'medium',
        reason: 'No compelling business case or urgency',
        colorScheme: 'red',
        icon: Pause,
        action: 'Add to nurture list',
        timeline: 'Reassess in 6 months'
      }
    }
    
    // 🟡 FALLBACK NURTURE
    return {
      decision: 'NURTURE',
      confidence: 'low',
      reason: 'Mixed signals - relationship building needed',
      colorScheme: 'yellow',
      icon: Timer,
      action: 'Stay in touch',
      timeline: 'Quarterly check-ins'
    }
  }

  // Enhanced stakeholder role mapping
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

  // Enhanced data mapping functions for intelligence cards
  const getDealHeat = () => {
    const painLevel = analysis.call_summary?.painSeverity?.level || 'low'
    const indicators = analysis.call_summary?.painSeverity?.indicators || []
    const businessImpact = analysis.call_summary?.painSeverity?.businessImpact || ''
    
    const criticalFactors = analysis.call_summary?.urgencyDrivers?.criticalFactors || []
    const businessFactors = analysis.call_summary?.urgencyDrivers?.businessFactors || []
    const generalFactors = analysis.call_summary?.urgencyDrivers?.generalFactors || []
    
    const urgencyScore = (criticalFactors.length * 3) + (businessFactors.length * 2) + (generalFactors.length * 1)
    
    const buyingSignals = analysis.call_summary?.buyingSignalsAnalysis || {}
    const commitmentSignals = buyingSignals.commitmentSignals || []
    const engagementSignals = buyingSignals.engagementSignals || []
    
    let dealScore = urgencyScore + (commitmentSignals.length * 2) + (engagementSignals.length * 1)
    
    // Apply resistance penalties
    const resistanceData = analysis.call_summary?.resistanceAnalysis || {}
    const resistanceLevel = resistanceData.level || 'none'
    const resistanceSignals = resistanceData.signals || []
    
    let resistancePenalty = 0
    if (resistanceLevel === 'high') resistancePenalty += 8
    else if (resistanceLevel === 'medium') resistancePenalty += 4
    
    dealScore = Math.max(0, dealScore - resistancePenalty)
    
    let heatLevel = 'LOW'
    let emoji = '❄️'
    let description = 'Long-term opportunity'
    
    if (painLevel === 'high' || criticalFactors.length >= 1 || dealScore >= 8) {
      heatLevel = 'HIGH'
      emoji = '🔥'
      description = 'Immediate attention needed'
    } else if (painLevel === 'medium' || businessFactors.length >= 1 || dealScore >= 3) {
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
      
      const confidence = authorityScore >= 6 ? 'High' : authorityScore >= 3 ? 'Medium' : 'Low'
      
      return { ...contact, authorityScore, confidence, evidence }
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
    
    const totalSignals = commitmentSignals.length + engagementSignals.length + interestSignals.length
    const commitmentScore = commitmentSignals.length * 3
    const engagementScore = engagementSignals.length * 2
    const interestScore = interestSignals.length * 1
    const totalScore = commitmentScore + engagementScore + interestScore
    
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

  // Get priority actions based on deal assessment
  const getPriorityActions = () => {
    const actions = analysis.action_plan?.actions || []
    const dealAssessment = getDealAssessment()
    
    // Filter and prioritize actions based on deal decision
    return actions
      .filter(action => action.priority === 'high' || action.priority === 'medium')
      .sort((a, b) => {
        const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 }
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      })
      .slice(0, dealAssessment.decision === 'PURSUE' ? 3 : 1) // More actions for PURSUE
  }

  // Helper function to get conversation intelligence signals
  const getConversationIntelligence = () => {
    const callSummary = analysis.call_summary || {}
    
    const signals = { positive: [], concerns: [], competitive: [], pain: [] }
    
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

  // Initialize data
  const dealAssessment = getDealAssessment()
  const dealHeat = getDealHeat()
  const decisionMaker = getDecisionMaker()
  const buyingSignals = getBuyingSignals()
  const priorityActions = getPriorityActions()
  const conversationIntel = getConversationIntelligence()
  const participants = analysis.participants || {}

  // Color schemes based on decision
  const getDecisionColors = (decision: string) => {
    const schemes = {
      'PURSUE': {
        bg: 'from-green-500/20 to-emerald-500/20',
        border: 'border-green-400/30',
        text: 'text-green-300',
        badge: 'bg-green-100 text-green-800'
      },
      'NURTURE': {
        bg: 'from-yellow-500/20 to-orange-500/20',
        border: 'border-yellow-400/30',
        text: 'text-yellow-300',
        badge: 'bg-yellow-100 text-yellow-800'
      },
      'DISQUALIFY': {
        bg: 'from-red-500/20 to-pink-500/20',
        border: 'border-red-400/30',
        text: 'text-red-300',
        badge: 'bg-red-100 text-red-800'
      }
    }
    return schemes[decision] || schemes['NURTURE']
  }

  const decisionColors = getDecisionColors(dealAssessment.decision)

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
                <span>Duration: {transcript.duration_minutes} min</span>
                <span>•</span>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <Star className="w-3 h-3 mr-1" />
                  Analysis Complete
                </Badge>
              </div>
            </div>
          </div>

          {/* 🎯 TIER 1: DEAL DECISION (Top Priority) */}
          <div className={`bg-gradient-to-r ${decisionColors.bg} rounded-2xl p-8 border ${decisionColors.border} mb-8`}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                  <dealAssessment.icon className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-white">{dealAssessment.decision}</h2>
                  <p className="text-lg text-white/80">{dealAssessment.reason}</p>
                </div>
              </div>
              <Badge className={`${decisionColors.badge} px-4 py-2`}>
                {dealAssessment.confidence.toUpperCase()} CONFIDENCE
              </Badge>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-xl font-semibold text-white mb-3">Recommended Action</h3>
                <p className="text-white/90 text-lg">{dealAssessment.action}</p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-3">Timeline</h3>
                <p className="text-white/90 text-lg">{dealAssessment.timeline}</p>
              </div>
            </div>

            {/* Intelligence Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-8 h-8 ${dealHeat.bgColor} rounded-lg flex items-center justify-center`}>
                    <Thermometer className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-white/80">Deal Heat</span>
                </div>
                <div className={`text-2xl font-bold ${dealHeat.color}`}>{dealHeat.emoji} {dealHeat.level}</div>
                <p className="text-xs text-white/70">{dealHeat.description}</p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                    <Crown className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-white/80">Power Center</span>
                </div>
                <div className="text-lg font-bold text-white">{decisionMaker.name}</div>
                <p className="text-xs text-white/70">{decisionMaker.title} • {decisionMaker.influence}</p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-white/80">Momentum</span>
                </div>
                <div className="text-2xl font-bold text-green-300">{buyingSignals.count}/{buyingSignals.total}</div>
                <p className="text-xs text-white/70">{buyingSignals.strength}</p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                    <Target className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-white/80">Next Step</span>
                </div>
                <div className="text-lg font-bold text-purple-300">{dealAssessment.decision}</div>
                <p className="text-xs text-white/70">{dealAssessment.timeline}</p>
              </div>
            </div>
          </div>

          {/* 🎯 TIER 2: IMMEDIATE ACTIONS (High Priority) */}
          {priorityActions.length > 0 && (
            <div className="bg-white rounded-xl p-6 border-l-4 border-blue-500 shadow-lg mb-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Zap className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Ready to Execute</h3>
                    <p className="text-sm text-blue-600">Copy-paste templates and scripts ready to use</p>
                  </div>
                </div>
                <Badge className="bg-blue-100 text-blue-800 px-3 py-1 text-sm">
                  {priorityActions.length} ACTION{priorityActions.length > 1 ? 'S' : ''}
                </Badge>
              </div>

              <div className="space-y-4">
                {priorityActions.map((action: any, index: number) => (
                  <div key={index} className="border border-blue-200 rounded-lg p-6 bg-blue-50/50">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-blue-900 text-lg">{action.action}</h4>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="border-blue-300 text-blue-700">
                          {action.timeline}
                        </Badge>
                        <Badge variant="outline" className="border-blue-300 text-blue-700">
                          {action.priority?.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 mb-4 leading-relaxed">{action.objective}</p>
                    
                    {action.copyPasteContent && (
                      <div className="space-y-3">
                        {action.copyPasteContent.subject && (
                          <div className="bg-white p-4 rounded-lg border border-blue-200">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-semibold text-blue-800">Subject Line</span>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="border-blue-300 text-blue-700 hover:bg-blue-100"
                                onClick={() => copyToClipboard(action.copyPasteContent.subject, 'Subject line')}
                              >
                                <Copy className="w-4 h-4 mr-1" />
                                Copy
                              </Button>
                            </div>
                            <p className="text-sm font-mono bg-gray-50 p-3 rounded border">
                              {action.copyPasteContent.subject}
                            </p>
                          </div>
                        )}
                        
                        {action.copyPasteContent.body && (
                          <div className="bg-white p-4 rounded-lg border border-blue-200">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-semibold text-blue-800">Email Content</span>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="border-blue-300 text-blue-700 hover:bg-blue-100"
                                onClick={() => copyToClipboard(action.copyPasteContent.body, 'Email content')}
                              >
                                <Copy className="w-4 h-4 mr-1" />
                                Copy
                              </Button>
                            </div>
                            <p className="text-sm font-mono whitespace-pre-wrap bg-gray-50 p-3 rounded border max-h-32 overflow-y-auto">
                              {action.copyPasteContent.body}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 🎯 TIER 3: SUPPORTING CONTEXT (Expandable) */}
          <div className="space-y-4">
            
            {/* Call Summary */}
            <Card className="bg-white shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <CardTitle className="text-lg">Call Summary</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-800 leading-relaxed mb-4">
                  {analysis.call_summary?.overview || 'This conversation provided valuable insights into the client\'s needs and current challenges.'}
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-gray-700 mb-2">Client Situation</h4>
                    <p className="text-gray-600 text-sm">
                      {analysis.call_summary?.clientSituation || 'Client shared their current business context and challenges.'}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-700 mb-2">Main Topics</h4>
                    <ul className="space-y-1">
                      {(analysis.call_summary?.mainTopics || ['Business needs discussed', 'Solution options explored', 'Next steps identified']).slice(0, 3).map((topic, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                          <span className="text-gray-600 text-sm">{topic}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stakeholder Navigation Map - Only show if we have stakeholders */}
            {participants?.clientContacts && participants.clientContacts.length > 0 && (
              <Card className="bg-white shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-blue-600" />
                    <CardTitle className="text-lg">Stakeholder Navigation Map</CardTitle>
                    <Badge variant="outline" className="text-xs">Strategic Intelligence</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6">
                    {/* Economic Buyers */}
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
                            <Badge variant="outline" className="text-xs mt-1">Primary Contact</Badge>
                          </div>
                        ))}
                        {participants.clientContacts.filter((contact: any) => 
                          contact.challengerRole === 'Economic Buyer' || contact.decisionLevel === 'high'
                        ).length === 0 && (
                          <p className="text-sm text-gray-500 italic">No economic buyers identified</p>
                        )}
                      </div>
                    </div>

                    {/* Influencers */}
                    <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                      <h4 className="font-semibold text-yellow-800 mb-3 flex items-center gap-2">
                        📊 Key Influencers
                      </h4>
                      <div className="space-y-3">
                        {participants.clientContacts.filter((contact: any) => 
                          contact.challengerRole === 'Influencer' || contact.decisionLevel === 'medium'
                        ).map((contact: any, index: number) => (
                          <div key={index}>
                            <p className="font-medium">{contact.name} ({contact.title})</p>
                            <p className="text-sm text-gray-600">
                              {contact.roleEvidence?.[0] || "Influences decision process"}
                            </p>
                          </div>
                        ))}
                        {participants.clientContacts.filter((contact: any) => 
                          contact.challengerRole === 'Influencer' || contact.decisionLevel === 'medium'
                        ).length === 0 && (
                          <p className="text-sm text-gray-500 italic">No key influencers identified</p>
                        )}
                      </div>
                    </div>

                    {/* Navigation Strategy */}
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
                </CardContent>
              </Card>
            )}

            {/* Deal Acceleration Insights */}
            {analysis.key_takeaways && analysis.key_takeaways.length > 0 && (
              <Card className="border-l-4 border-l-yellow-400 bg-gradient-to-r from-yellow-50 to-orange-50">
                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="pb-2 cursor-pointer hover:bg-yellow-100/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Lightbulb className="w-6 h-6 text-yellow-600" />
                          <div>
                            <CardTitle className="text-lg">Deal Acceleration Insights ({analysis.key_takeaways.length})</CardTitle>
                            <p className="text-sm text-yellow-700 font-normal">What they revealed about decision criteria and positioning</p>
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
              <Card className="border-l-4 border-l-blue-400 bg-gradient-to-r from-blue-50 to-indigo-50">
                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="pb-2 cursor-pointer hover:bg-blue-100/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Target className="w-6 h-6 text-blue-600" />
                          <div>
                            <CardTitle className="text-lg">Complete Battle Plan</CardTitle>
                            <p className="text-sm text-blue-700 font-normal">Strategic approach and competitive positioning</p>
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
            <Card className="border-l-4 border-l-green-400 bg-gradient-to-r from-green-50 to-emerald-50">
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <CardHeader className="pb-2 cursor-pointer hover:bg-green-100/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Eye className="w-6 h-6 text-green-600" />
                        <div>
                          <CardTitle className="text-lg">Intelligence Analysis</CardTitle>
                          <p className="text-sm text-green-700 font-normal">Signals, concerns, and competitive intelligence</p>
                        </div>
                      </div>
                      <ChevronDown className="w-5 h-5 text-green-600" />
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-6">
                    
                    {/* Show relevant intelligence based on deal assessment */}
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

                    {/* Fallback when no intelligence is available */}
                    {conversationIntel.positive.length === 0 && 
                     conversationIntel.concerns.length === 0 && 
                     conversationIntel.competitive.length === 0 && 
                     conversationIntel.pain.length === 0 && (
                      <div className="text-center py-8">
                        <Eye className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h4 className="font-medium text-gray-600 mb-2">Intelligence Processing</h4>
                        <p className="text-gray-500 text-sm">
                          Analyzing conversation for signals, concerns, and competitive intelligence.
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