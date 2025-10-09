import React, { useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { 
  ArrowLeft, 
  Download,
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
  ArrowRight,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import { HeroSection } from './HeroSection'
import { BattlePlanSection } from './BattlePlanSection'
import { StakeholderNavigation } from './StakeholderNavigation'
import { ExpandableSections } from './ExpandableSections'
import { usePDFExport } from '@/hooks/usePDFExport'
import { calculateDealHeat, type DealHeatResult } from '@/utils/dealHeatCalculator'

interface AnalysisData {
  id: string
  participants?: any
  call_summary?: any
  key_takeaways?: string[]
  recommendations?: any
  reasoning?: any
  action_plan?: any
  heat_level?: string
}

interface TranscriptData {
  id: string
  title: string
  participants: string[]
  duration_minutes: number
  meeting_date: string
  extracted_company_name?: string
  deal_context?: {
    company_name?: string
  }
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
  
  const { exportToPDF } = usePDFExport({ filename: 'sales-analysis-report' })
  const [isExporting, setIsExporting] = useState(false)

  // Prioritize company name over generic title
  const displayTitle = transcript.extracted_company_name || 
                      transcript.deal_context?.company_name || 
                      transcript.title

  // Enhanced data mapping functions - moved before usage
  const getDealHeat = (): DealHeatResult => {
    // PRIORITY 1: Use database heat_level if available (single source of truth)
    if (analysis.heat_level) {
      const dbHeatLevel = analysis.heat_level.toUpperCase() as 'HIGH' | 'MEDIUM' | 'LOW'
      
      return {
        level: dbHeatLevel,
        emoji: dbHeatLevel === 'HIGH' ? '🔥' : dbHeatLevel === 'MEDIUM' ? '🌡️' : '❄️',
        description: dbHeatLevel === 'HIGH' ? 'Immediate attention needed' : 
                    dbHeatLevel === 'MEDIUM' ? 'Active opportunity' : 'Long-term opportunity',
        evidence: analysis.call_summary?.painSeverity?.indicators?.slice(0, 2) || [],
        businessImpact: analysis.call_summary?.painSeverity?.businessImpact || '',
        bgColor: dbHeatLevel === 'HIGH' ? 'bg-red-500' : dbHeatLevel === 'MEDIUM' ? 'bg-orange-500' : 'bg-blue-500',
        color: dbHeatLevel === 'HIGH' ? 'text-red-300' : dbHeatLevel === 'MEDIUM' ? 'text-orange-300' : 'text-blue-300'
      }
    }
    
    // FALLBACK: Calculate using shared utility for older records without heat_level
    return calculateDealHeat(analysis)
  }

  const getConversationIntelligence = () => {
    // Extract conversation intelligence from analysis data
    const callSummary = analysis.call_summary || {}
    const buyingSignals = callSummary.buyingSignalsAnalysis || {}
    const painAnalysis = callSummary.painSeverity || {}
    const resistanceAnalysis = callSummary.resistanceAnalysis || {}
    
    return {
      positive: [
        ...(buyingSignals.commitmentSignals || []),
        ...(buyingSignals.engagementSignals || []),
        ...(buyingSignals.interestSignals || [])
      ],
      pain: painAnalysis.indicators || [],
      concerns: resistanceAnalysis.signals || [],
      competitive: [] // Add competitive intelligence if available in analysis
    }
  }

  // 🚀 SMART PRIORITY SYSTEM - Auto-expand based on deal heat
  const dealHeat = getDealHeat()
  const isHighPriorityDeal = dealHeat.level === 'HIGH'
  const isMediumPriorityDeal = dealHeat.level === 'MEDIUM'
  
  // State for collapsible sections with smart defaults
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

  const handleExportPDF = useCallback(async () => {
    setIsExporting(true)
    try {
      const cleanTitle = displayTitle.trim()
      // 🚀 NEW: Pass React state control to PDF export
      await exportToPDF('analysis-content', cleanTitle, {
        sectionsOpen,
        toggleSection
      })
    } finally {
      setIsExporting(false)
    }
  }, [exportToPDF, displayTitle, sectionsOpen, toggleSection])
  
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

  const decisionMaker = getDecisionMaker()
  const buyingSignals = getBuyingSignals()
  const timeline = getTimeline()
  const conversationIntel = getConversationIntelligence()

  // 🚀 Build enhanced participants object with sellerTeam
  const participantsRaw = analysis.participants || {}
  const clients = (participantsRaw.clientContacts || []).map((c: any) => (c?.name || '').trim().toLowerCase())
  const clientSet = new Set(clients)

  const sellerTeam: Array<{name: string; company?: string}> = []
  
  // Add primary sales rep
  if (participantsRaw.salesRep?.name) {
    sellerTeam.push({ 
      name: participantsRaw.salesRep.name, 
      company: participantsRaw.salesRep.company || 'Actifile' 
    })
  }

  // Merge any pre-existing seller team from AI
  const preExisting = (participantsRaw.sellerTeam || participantsRaw.additionalReps || [])
    .map((p: any) => ({ name: p.name, company: p.company || 'Actifile' }))
    .filter((p: any) => p.name)

  for (const p of preExisting) sellerTeam.push(p)

  // Infer additional internal attendees from transcript.participants
  for (const n of (transcript.participants || [])) {
    const name = typeof n === 'string' ? n : (n as any)?.name
    if (!name) continue
    const lower = name.trim().toLowerCase()
    const repNameLower = (participantsRaw.salesRep?.name || '').trim().toLowerCase()
    if (!clientSet.has(lower) && lower !== repNameLower) {
      sellerTeam.push({ name, company: 'Actifile' })
    }
  }

  // Deduplicate by name
  const seen = new Set<string>()
  const sellerTeamDedup = sellerTeam.filter(p => {
    const key = (p.name || '').trim().toLowerCase()
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })

  const participantsEnhanced = { ...participantsRaw, sellerTeam: sellerTeamDedup }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      {/* ENHANCED: Add pdf-optimized class to main content container */}
      <div id="analysis-content" className="max-w-6xl mx-auto px-4 py-6 lg:py-8 pdf-optimized">
          
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
                  onClick={handleExportPDF}
                  disabled={isExporting}
                  className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating PDF...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Export PDF
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            <div className="space-y-3">
              <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 leading-tight">{displayTitle}</h1>
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
            participants={participantsEnhanced}
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

          {/* 🎯 STAKEHOLDER NAVIGATION */}
          <StakeholderNavigation analysis={analysis} />

          {/* 🎯 EXPANDABLE SECTIONS */}
          <ExpandableSections
            analysis={analysis}
            dealHeat={dealHeat}
            sectionsOpen={sectionsOpen}
            toggleSection={toggleSection}
            conversationIntel={conversationIntel}
          />
      </div>
    </div>
  )
}
