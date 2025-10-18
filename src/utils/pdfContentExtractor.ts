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
    title: transcript?.title || 'Sales Analysis',
    date: transcript?.created_at ? new Date(transcript.created_at).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }) : 'N/A',
    duration: transcript?.duration_minutes ? `${transcript.duration_minutes} min` : 'N/A',
    participants: participantNames,
    dealStatus: analysis?.heat_level || 'MEDIUM'
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
      emoji: heatEmojis[heatLevel] || '🌡️',
      description: `${heatLevel.toLowerCase()} heat deal`
    },
    powerCenter: {
      name: decisionMaker?.name || 'Decision maker to be identified',
      title: decisionMaker?.title || 'Unknown',
      influence: decisionMaker?.influence || 'To be assessed'
    },
    momentum: {
      score: buyingSignals?.commitmentSignals?.length 
        ? `${buyingSignals.commitmentSignals.length}/12` 
        : '0/12',
      strength: buyingSignals?.strength || 'Neutral momentum'
    },
    competitiveEdge: {
      strategy: recommendations?.competitiveStrategy || 'Strategic positioning',
      driver: timeline?.driver || 'Opportunity identified'
    }
  }
}

function extractCallSummary(analysis: any) {
  const callSummary = analysis?.call_summary || {}
  const timeline = callSummary?.timelineAnalysis || {}
  const mainTopics = callSummary?.mainTopics || []

  return {
    overview: callSummary?.overview || 'Valuable insights discussed during the conversation',
    clientSituation: callSummary?.clientSituation || 'Client context and needs shared',
    mainTopics: Array.isArray(mainTopics) && mainTopics.length > 0 
      ? mainTopics 
      : ['Business needs discussed', 'Solutions explored', 'Next steps outlined'],
    clientPriority: callSummary?.urgencyDrivers?.primary || 'Strategic priority',
    urgencyDriver: timeline?.driver || 'Business pressure identified'
  }
}

function extractStrategicIntelligence(analysis: any) {
  const callSummary = analysis?.call_summary || {}
  const painSeverity = callSummary?.painSeverity || {}
  const competitiveIntel = callSummary?.competitiveIntelligence || {}
  const timeline = callSummary?.timelineAnalysis || {}
  const buyingSignals = callSummary?.buyingSignalsAnalysis || {}

  return {
    criticalPain: Array.isArray(painSeverity?.indicators) 
      ? painSeverity.indicators 
      : ['Pain points identified'],
    decisionCriteria: Array.isArray(competitiveIntel?.decisionCriteria) 
      ? competitiveIntel.decisionCriteria 
      : ['Decision criteria discussed'],
    timelineDriver: timeline?.statedTimeline || 'Timeline to be confirmed',
    buyingSignals: Array.isArray(buyingSignals?.commitmentSignals) 
      ? buyingSignals.commitmentSignals 
      : ['Buying signals detected'],
    competitiveLandscape: Array.isArray(competitiveIntel?.vendorsKnown) 
      ? competitiveIntel.vendorsKnown 
      : ['Competitive landscape assessed']
  }
}

function extractStrategicAssessment(analysis: any) {
  const recommendations = analysis?.recommendations || {}

  return {
    primaryStrategy: recommendations?.primaryStrategy || 'Strategic approach to be defined',
    competitiveStrategy: recommendations?.competitiveStrategy || 'Competitive positioning to be established',
    stakeholderPlan: recommendations?.stakeholderStrategy || 'Stakeholder engagement plan to be developed'
  }
}

function extractWhyTheseActions(analysis: any) {
  const actionPlan = analysis?.action_plan || {}
  const reasoning = analysis?.reasoning || {}

  return {
    rationale: actionPlan?.rationale || reasoning?.strategicRationale || 'Actions designed to move the deal forward strategically',
    supportingEvidence: Array.isArray(reasoning?.supportingEvidence) 
      ? reasoning.supportingEvidence 
      : ['Based on conversation analysis', 'Aligned with buyer journey', 'Optimized for deal momentum']
  }
}

function extractActionItems(analysis: any) {
  const actionPlan = analysis?.action_plan || {}
  const actions = actionPlan?.actions || []

  if (!Array.isArray(actions) || actions.length === 0) {
    return [{
      action: 'Follow up on discussion points',
      rationale: 'Continue engagement based on conversation insights',
      timeline: 'Within 48 hours',
      channels: ['Email'],
      emailTemplate: null
    }]
  }

  return actions.map((action: any) => ({
    action: action?.action || 'Action item',
    rationale: action?.rationale || 'Strategic follow-up',
    timeline: action?.timeline || 'TBD',
    channels: Array.isArray(action?.channels) ? action.channels : ['Email'],
    emailTemplate: action?.emailTemplate ? {
      subject: action.emailTemplate.subject || 'Follow-up',
      body: action.emailTemplate.body || 'Email content',
      tone: action.emailTemplate.tone || 'Professional'
    } : null
  }))
}

function extractDealInsights(analysis: any) {
  const keyTakeaways = analysis?.key_takeaways

  if (Array.isArray(keyTakeaways) && keyTakeaways.length > 0) {
    return keyTakeaways
  }

  return ['Deal insights generated from conversation analysis']
}

function extractCompetitivePositioning(analysis: any) {
  const callSummary = analysis?.call_summary || {}
  const buyingSignals = callSummary?.buyingSignalsAnalysis || {}
  const painSeverity = callSummary?.painSeverity || {}
  const competitiveIntel = callSummary?.competitiveIntelligence || {}
  const concerns = callSummary?.concerns || []

  return {
    buyingSignals: Array.isArray(buyingSignals?.commitmentSignals) 
      ? buyingSignals.commitmentSignals 
      : ['Buying signals identified'],
    painIndicators: Array.isArray(painSeverity?.indicators) 
      ? painSeverity.indicators 
      : ['Pain indicators detected'],
    concerns: Array.isArray(concerns) && concerns.length > 0 
      ? concerns 
      : ['Concerns to be addressed'],
    competitiveIntel: Array.isArray(competitiveIntel?.vendorsKnown) 
      ? competitiveIntel.vendorsKnown 
      : ['Competitive intelligence gathered']
  }
}
