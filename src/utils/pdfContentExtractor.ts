/**
 * PDF Content Extractor
 * Extracts structured data from transcript and analysis objects for PDF generation
 */

import type { PDFContentData } from '@/types/pdfExport'
import { calculateDealHeat } from './dealHeatCalculator'
import { getDisplayTitle } from './titleUtils'

/**
 * Main extraction function - converts analysis data into PDF-ready structure
 */
export function extractPDFData(transcript: any, analysis: any): PDFContentData {
  return {
    header: extractHeaderData(transcript, analysis),
    dealCommandCenter: extractDealCommandCenter(analysis),
    callSummary: extractCallSummary(analysis),
    strategicIntelligence: extractStrategicIntelligence(analysis),
    strategicAssessment: extractStrategicAssessment(analysis),
    stakeholderNavigation: extractStakeholderNavigation(analysis),
    whyTheseActions: extractWhyTheseActions(analysis),
    actionItems: extractActionItems(analysis),
    dealInsights: extractDealInsights(analysis),
    competitivePositioning: extractCompetitivePositioning(analysis),
    coachingInsights: extractCoachingInsights(analysis),
    dealBlockers: extractDealBlockers(analysis)
  }
}

function extractHeaderData(transcript: any, analysis: any) {
  const participants = analysis?.participants || transcript?.participants || []
  const participantNames = Array.isArray(participants) 
    ? participants 
    : typeof participants === 'string' 
      ? [participants] 
      : []

  // Use centralized title logic for consistency with UI
  const displayTitle = getDisplayTitle({
    title: transcript?.title || '',
    extracted_company_name: transcript?.extracted_company_name,
    deal_context: transcript?.deal_context
  })

  // Match screen date format: "Saturday, October 18, 2025"
  const meetingDate = transcript?.meeting_date || transcript?.created_at
  const formattedDate = meetingDate ? new Date(meetingDate).toLocaleDateString('en-US', { 
    weekday: 'long',
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }) : ''

  return {
    title: displayTitle,
    date: formattedDate,
    duration: transcript?.duration_minutes ? `${transcript.duration_minutes} min` : '',
    participants: participantNames,
    dealStatus: analysis?.heat_level || ''
  }
}

function extractDealCommandCenter(analysis: any) {
  // PRIORITY 1: Use database heat_level (authoritative source - matches screen display)
  let dealHeatResult
  
  if (analysis?.heat_level) {
    const dbHeatLevel = analysis.heat_level.toUpperCase() as 'HIGH' | 'MEDIUM' | 'LOW'
    dealHeatResult = {
      level: dbHeatLevel,
      emoji: dbHeatLevel === 'HIGH' ? '🔥' : dbHeatLevel === 'MEDIUM' ? '🌡️' : '❄️',
      description: dbHeatLevel === 'HIGH' ? 'Immediate attention needed' : 
                  dbHeatLevel === 'MEDIUM' ? 'Active opportunity' : 'Long-term opportunity',
      evidence: analysis?.call_summary?.painSeverity?.indicators?.slice(0, 2) || [],
      businessImpact: analysis?.call_summary?.painSeverity?.businessImpact || '',
      bgColor: dbHeatLevel === 'HIGH' ? 'bg-red-500' : dbHeatLevel === 'MEDIUM' ? 'bg-orange-500' : 'bg-blue-500',
      color: dbHeatLevel === 'HIGH' ? 'text-red-300' : dbHeatLevel === 'MEDIUM' ? 'text-orange-300' : 'text-blue-300'
    }
  } else {
    // FALLBACK: Calculate for older analyses without heat_level stored in DB
    dealHeatResult = calculateDealHeat(analysis)
  }
  
  const recommendations = analysis?.recommendations || {}
  const callSummary = analysis?.call_summary || {}
  const buyingSignals = callSummary?.buyingSignalsAnalysis || {}
  const timeline = callSummary?.timelineAnalysis || {}
  
  // Priority 1: Use AI's designated power_center (v12.1+)
  let decisionMaker = { name: '', title: '', influence: '' }
  
  if (analysis?.guidance?.power_center) {
    const pc = analysis.guidance.power_center
    decisionMaker = {
      name: pc.name || '',
      title: pc.title || '',
      influence: pc.influence_level ? `${pc.influence_level.charAt(0).toUpperCase() + pc.influence_level.slice(1)} Influence` : ''
    }
  } else {
    // Fallback: Use scoring algorithm for older analyses
    const contacts = analysis?.participants?.clientContacts || []
    
    if (contacts.length > 0) {
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
        confidence
      }
    })
    
    const topContact = scoredContacts.sort((a, b) => b.authorityScore - a.authorityScore)[0]
    
    decisionMaker = {
      name: topContact.name || '',
      title: topContact.title || '',
      influence: topContact.confidence ? `${topContact.confidence} Influence` : ''
    }
    }
  }

  return {
    dealHeat: {
      level: dealHeatResult.level,
      emoji: dealHeatResult.emoji,
      description: dealHeatResult.description
    },
    powerCenter: decisionMaker,
    momentum: {
      score: (() => {
        const commitmentSignals = buyingSignals?.commitmentSignals || []
        const engagementSignals = buyingSignals?.engagementSignals || []
        const interestSignals = buyingSignals?.interestSignals || []
        
        const commitmentScore = commitmentSignals.length * 3
        const engagementScore = engagementSignals.length * 2
        const interestScore = interestSignals.length * 1
        
        const weightedScore = commitmentScore + engagementScore + interestScore
        const totalSignalCount = commitmentSignals.length + engagementSignals.length + interestSignals.length
        const maxPossibleScore = Math.max(totalSignalCount * 3, 12)
        
        return `${weightedScore}/${maxPossibleScore}`
      })(),
      strength: (() => {
        const commitmentSignals = buyingSignals?.commitmentSignals || []
        const engagementSignals = buyingSignals?.engagementSignals || []
        const interestSignals = buyingSignals?.interestSignals || []
        
        const commitmentScore = commitmentSignals.length * 3
        const engagementScore = engagementSignals.length * 2
        const interestScore = interestSignals.length * 1
        const weightedScore = commitmentScore + engagementScore + interestScore
        
        if (commitmentSignals.length >= 2 || weightedScore >= 8) {
          return 'Strong momentum'
        } else if (commitmentSignals.length >= 1 || weightedScore >= 4) {
          return 'Good momentum'
        }
        return 'Weak momentum'
      })()
    },
    competitiveEdge: {
      strategy: recommendations?.competitiveStrategy ? "Strategic Advantage" : "Integration Focus",
      driver: timeline?.businessDriver || timeline?.driver || "Positioning opportunity identified"
    },
    winStrategy: recommendations?.primaryStrategy || "Position as the solution that uniquely addresses their specific business challenges and competitive requirements"
  }
}

function extractCallSummary(analysis: any) {
  const callSummary = analysis?.call_summary || {}
  const timeline = callSummary?.timelineAnalysis || {}
  const mainTopics = callSummary?.mainTopics || []

  return {
    overview: callSummary?.overview || '',
    clientSituation: callSummary?.clientSituation || '',
    mainTopics: Array.isArray(mainTopics) && mainTopics.length > 0 
      ? mainTopics 
      : [],
    clientPriority: callSummary?.urgencyDrivers?.primary || '',
    urgencyDriver: timeline?.driver || ''
  }
}

function extractStrategicIntelligence(analysis: any) {
  const callSummary = analysis?.call_summary || {}
  const painSeverity = callSummary?.painSeverity || {}
  const competitiveIntel = callSummary?.competitiveIntelligence || {}
  const timeline = callSummary?.timelineAnalysis || {}
  const buyingSignals = callSummary?.buyingSignalsAnalysis || {}

  return {
    criticalPain: Array.isArray(painSeverity?.indicators) && painSeverity.indicators.length > 0
      ? painSeverity.indicators 
      : [],
    decisionCriteria: Array.isArray(competitiveIntel?.decisionCriteria) && competitiveIntel.decisionCriteria.length > 0
      ? competitiveIntel.decisionCriteria 
      : [],
    timelineDriver: timeline?.statedTimeline || '',
    buyingSignals: Array.isArray(buyingSignals?.commitmentSignals) && buyingSignals.commitmentSignals.length > 0
      ? buyingSignals.commitmentSignals 
      : [],
    competitiveLandscape: Array.isArray(competitiveIntel?.vendorsKnown) && competitiveIntel.vendorsKnown.length > 0
      ? competitiveIntel.vendorsKnown 
      : []
  }
}

function extractStrategicAssessment(analysis: any) {
  const recommendations = analysis?.recommendations || {}

  return {
    primaryStrategy: recommendations?.primaryStrategy || '',
    competitiveStrategy: recommendations?.competitiveStrategy || '',
    stakeholderPlan: recommendations?.stakeholderPlan || ''
  }
}

function extractStakeholderNavigation(analysis: any) {
  const participants = analysis?.participants?.clientContacts || []
  
  // Extract Economic Buyers - MATCH UI LOGIC EXACTLY
  const economicBuyers = participants
    .filter((contact: any) => 
      contact.challengerRole === 'Economic Buyer' || 
      contact.decisionLevel === 'high'
    )
    .map((contact: any) => ({
      name: contact.name || '',
      title: contact.title || '',
      evidence: contact.decisionEvidence?.[0] || contact.roleEvidence?.[0] || ''
    }))
  
  // Extract Key Influencers - MATCH UI LOGIC EXACTLY
  const keyInfluencers = participants
    .filter((contact: any) => 
      contact.challengerRole === 'Influencer' || 
      contact.decisionLevel === 'medium'
    )
    .map((contact: any) => ({
      name: contact.name || '',
      title: contact.title || '',
      evidence: contact.roleEvidence?.[0] || ''
    }))
  
  return {
    economicBuyers,
    keyInfluencers,
    navigationStrategy: analysis?.recommendations?.stakeholderPlan || ''
  }
}

function extractWhyTheseActions(analysis: any) {
  const actionPlan = analysis?.action_plan || {}
  const reasoning = analysis?.reasoning || {}

  return {
    rationale: reasoning?.whyTheseRecommendations || reasoning?.dealViabilityRationale || reasoning?.strategicRationale || '',
    supportingEvidence: Array.isArray(reasoning?.supportingEvidence) && reasoning.supportingEvidence.length > 0
      ? reasoning.supportingEvidence 
      : []
  }
}

function extractActionItems(analysis: any) {
  const actionPlan = analysis?.action_plan || {}
  const actions = actionPlan?.actions || []

  // Return empty array if no actions exist (no default fallback action)
  if (!Array.isArray(actions) || actions.length === 0) {
    return []
  }

  return actions.map((action: any) => ({
    action: action?.action || '',
    rationale: action?.objective || action?.rationale || '',
    timeline: action?.timeline || '',
    channels: action?.method ? [action.method] : (Array.isArray(action?.channels) && action.channels.length > 0 ? action.channels : []),
    emailTemplate: action?.copyPasteContent ? {
      subject: (action.copyPasteContent.subject || '').replace(/^[🎯📧✉️💬]\s*(VERBATIM:|EXACT COPY:)?\s*/i, '').trim(),
      body: action.copyPasteContent.body || '',
      tone: action.copyPasteContent.tone || ''
    } : null
  }))
}

function extractDealInsights(analysis: any) {
  const keyTakeaways = analysis?.key_takeaways

  if (Array.isArray(keyTakeaways) && keyTakeaways.length > 0) {
    return keyTakeaways
  }

  return []
}

function extractCompetitivePositioning(analysis: any) {
  const callSummary = analysis?.call_summary || {}
  const buyingSignals = callSummary?.buyingSignalsAnalysis || {}
  const painSeverity = callSummary?.painSeverity || {}
  const competitiveIntel = callSummary?.competitiveIntelligence || {}
  const resistanceAnalysis = callSummary?.resistanceAnalysis || {}
  const concerns = resistanceAnalysis?.signals || []

  return {
    buyingSignals: [
      ...(buyingSignals.commitmentSignals || []),
      ...(buyingSignals.engagementSignals || []),
      ...(buyingSignals.interestSignals || [])
    ],
    painIndicators: Array.isArray(painSeverity?.indicators) && painSeverity.indicators.length > 0
      ? painSeverity.indicators 
      : [],
    concerns: Array.isArray(concerns) && concerns.length > 0 
      ? concerns 
      : [],
    competitiveIntel: Array.isArray(competitiveIntel?.vendorsKnown) && competitiveIntel.vendorsKnown.length > 0
      ? competitiveIntel.vendorsKnown 
      : []
  }
}

function extractCoachingInsights(analysis: any) {
  const insights = analysis?.coaching_insights || {}
  
  const whatWorkedWell = Array.isArray(insights.whatWorkedWell) 
    ? insights.whatWorkedWell 
    : []
  
  const missedOpportunities = insights.missedOpportunities
  const focusArea = insights.focusArea
  
  // If all fields are empty/missing or only contain generic fallbacks, return null
  const hasRealInsights = (
    whatWorkedWell.length > 0 ||
    (missedOpportunities && missedOpportunities !== "No critical missed opportunities identified") ||
    (focusArea && focusArea !== "Continue building on current strengths")
  )
  
  if (!hasRealInsights) {
    return null
  }
  
  return {
    whatWorkedWell,
    missedOpportunities: missedOpportunities || "No critical missed opportunities identified",
    focusArea: focusArea || "Continue building on current strengths"
  }
}

function extractDealBlockers(analysis: any) {
  const blockers = analysis?.recommendations?.dealBlockers
  
  const isRealBlocker = blockers && 
                        blockers !== null && 
                        !blockers.includes('Analysis incomplete') &&
                        !blockers.includes('not provided')
  
  return {
    blockers: blockers,
    hasBlockers: isRealBlocker
  }
}
