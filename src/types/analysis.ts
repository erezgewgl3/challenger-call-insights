export interface RichMissedOpportunity {
  "THE MOMENT": string
  "SURFACE vs UNDERLYING"?: {
    Surface: string
    Underlying: string
  }
  "WHY THIS MATTERS"?: {
    "Deal impact"?: string
    "Time impact"?: string
    "Relationship impact"?: string
  }
  EVIDENCE?: string[]
  "WHAT TOP 0.01% REPS DO"?: {
    [key: string]: string
  }
  [key: string]: any
}

export interface CoachingInsights {
  whatWorkedWell: string[]
  missedOpportunities: string[] | string | RichMissedOpportunity[]
  focusArea: string
}

export interface Recommendations {
  dealViability: 'high' | 'medium' | 'low'
  primaryStrategy: string
  dealBlockers: string | null
  criticalPath: string
  dealDynamics: string
  nextBestActions: string[]
}

export interface DealAssessment {
  heat: 'HIGH' | 'MEDIUM' | 'LOW'
  heatRationale: string
}

export interface ParsedAnalysis {
  challengerScores: {
    teaching: number
    tailoring: number
    control: number
  }
  callSummary: any
  recommendations: Recommendations
  coachingInsights: CoachingInsights
  participants: any
  keyTakeaways: string[]
  actionPlan: any
  guidance: any
  reasoning: any
  dealAssessment?: DealAssessment
  fabricatedQuotes?: string[]
  schemaIssues?: string[]
}
