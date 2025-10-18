/**
 * PDF Content Extractor
 * Extracts structured data from transcript and analysis objects for PDF generation
 */

import type { PDFContentData } from '@/types/pdfExport'

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
    whyTheseActions: extractWhyTheseActions(analysis),
    actionItems: extractActionItems(analysis),
    dealInsights: extractDealInsights(analysis),
    competitivePositioning: extractCompetitivePositioning(analysis)
  }
}

function extractHeaderData(transcript: any, analysis: any) {
  const participants = analysis?.participants || transcript?.participants || []
  const participantNames = Array.isArray(participants) 
    ? participants 
    : typeof participants === 'string' 
      ? [participants] 
      : []

  return {
    title: transcript?.title || '',
    date: transcript?.created_at ? new Date(transcript.created_at).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }) : '',
    duration: transcript?.duration_minutes ? `${transcript.duration_minutes} min` : '',
    participants: participantNames,
    dealStatus: analysis?.heat_level || ''
  }
}

function extractDealCommandCenter(analysis: any) {
  const heatLevel = analysis?.heat_level || 'MEDIUM'
  const heatEmojis: Record<string, string> = {
    HIGH: '🔥',
    MEDIUM: '🌡️',
    LOW: '❄️'
  }

  const recommendations = analysis?.recommendations || {}
  const callSummary = analysis?.call_summary || {}
  const decisionMaker = callSummary?.decisionMaker || {}
  const buyingSignals = callSummary?.buyingSignalsAnalysis || {}
  const timeline = callSummary?.timelineAnalysis || {}

  return {
    dealHeat: {
      level: heatLevel,
      emoji: heatEmojis[heatLevel] || '',
      description: heatLevel ? `${heatLevel.toLowerCase()} heat deal` : ''
    },
    powerCenter: {
      name: decisionMaker?.name || '',
      title: decisionMaker?.title || '',
      influence: decisionMaker?.influence || ''
    },
    momentum: {
      score: buyingSignals?.commitmentSignals?.length 
        ? `${buyingSignals.commitmentSignals.length}/12` 
        : '',
      strength: buyingSignals?.strength || ''
    },
    competitiveEdge: {
      strategy: recommendations?.competitiveStrategy || '',
      driver: timeline?.driver || ''
    }
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

function extractWhyTheseActions(analysis: any) {
  const actionPlan = analysis?.action_plan || {}
  const reasoning = analysis?.reasoning || {}

  return {
    rationale: actionPlan?.rationale || reasoning?.dealViabilityRationale || reasoning?.strategicRationale || '',
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
      subject: action.copyPasteContent.subject || '',
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
  const concerns = callSummary?.concerns || []

  return {
    buyingSignals: Array.isArray(buyingSignals?.commitmentSignals) && buyingSignals.commitmentSignals.length > 0
      ? buyingSignals.commitmentSignals 
      : [],
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
