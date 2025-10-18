export interface CoachingInsights {
  whatWorkedWell: string[]
  missedOpportunities: string[] | string
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
  fabricatedQuotes?: string[]
  schemaIssues?: string[]
}
