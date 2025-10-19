/**
 * TypeScript interfaces for PDF Export Data Structure
 * Defines the structure of data extracted from analysis for PDF generation
 */

export interface CoachingInsightsData {
  whatWorkedWell: string[]
  missedOpportunities: string[] | string
  focusArea: string
}

export interface DealBlockersData {
  blockers: string | null
  hasBlockers: boolean
}

export interface PDFContentData {
  header: PDFHeaderData
  dealCommandCenter: DealCommandCenterData
  callSummary: CallSummaryData
  strategicIntelligence: StrategicIntelligenceData
  strategicAssessment: StrategicAssessmentData
  stakeholderNavigation: StakeholderNavigationData
  whyTheseActions: WhyTheseActionsData
  actionItems: ActionItemData[]
  dealInsights: string[]
  competitivePositioning: CompetitivePositioningData
  coachingInsights: CoachingInsightsData
  dealBlockers: DealBlockersData
}

export interface PDFHeaderData {
  title: string
  date: string
  duration: string
  participants: string[]
  dealStatus: string
}

export interface DealCommandCenterData {
  dealHeat: {
    level: string
    emoji: string
    description: string
  }
  powerCenter: {
    name: string
    title: string
    influence: string
    authorityMismatch?: {
      detected: boolean
      technical_buyer: string
      economic_buyer: string
      risk_level: string
      warning: string
    } | null
  }
  momentum: {
    score: string
    strength: string
  }
  competitiveEdge: {
    strategy: string
    driver: string
  }
  winStrategy: string
}

export interface CallSummaryData {
  overview: string
  clientSituation: string
  mainTopics: string[]
  clientPriority: string
  urgencyDriver: string
}

export interface StrategicIntelligenceData {
  criticalPain: string[]
  decisionCriteria: string[]
  timelineDriver: string
  buyingSignals: string[]
  competitiveLandscape: string[]
}

export interface StrategicAssessmentData {
  primaryStrategy: string
  competitiveStrategy: string
  stakeholderPlan: string
}

export interface StakeholderContact {
  name: string
  title: string
  evidence: string
}

export interface StakeholderNavigationData {
  economicBuyers: StakeholderContact[]
  keyInfluencers: StakeholderContact[]
  navigationStrategy: string
}

export interface WhyTheseActionsData {
  rationale: string
  supportingEvidence: string[]
}

export interface ActionItemData {
  action: string
  rationale: string
  timeline: string
  channels: string[]
  emailTemplate: EmailTemplateData | null
}

export interface EmailTemplateData {
  subject: string
  body: string
  tone: string
}

export interface CompetitivePositioningData {
  buyingSignals: string[]
  painIndicators: string[]
  concerns: string[]
  competitiveIntel: string[]
}
