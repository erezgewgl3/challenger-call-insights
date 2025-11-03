import { z } from 'zod'

/**
 * Zod Schema for Analysis Data Normalization
 * Ensures all nested fields have safe defaults to prevent render crashes
 */

export const analysisSchema = z.object({
  id: z.string(),
  challenger_scores: z.any().optional().default({}),
  guidance: z.object({
    power_center: z.object({
      name: z.string().default(''),
      title: z.string().default(''),
      influence_level: z.string().default('medium')
    }).optional().default({ name: '', title: '', influence_level: 'medium' })
  }).optional().default({}),
  email_followup: z.any().optional().default({}),
  participants: z.object({
    salesRep: z.object({
      name: z.string().default(''),
      company: z.string().default('')
    }).optional().default({ name: '', company: '' }),
    clientContacts: z.array(z.any()).optional().default([]),
    additionalReps: z.array(z.any()).optional().default([]),
    sellerTeam: z.array(z.any()).optional().default([])
  }).optional().default({
    salesRep: { name: '', company: '' },
    clientContacts: [],
    additionalReps: [],
    sellerTeam: []
  }),
  call_summary: z.object({
    painSeverity: z.object({
      indicators: z.array(z.string()).default([]),
      businessImpact: z.string().default('')
    }).optional().default({ indicators: [], businessImpact: '' }),
    buyingSignalsAnalysis: z.object({
      commitmentSignals: z.array(z.string()).default([]),
      engagementSignals: z.array(z.string()).default([]),
      interestSignals: z.array(z.string()).default([]),
      overallQuality: z.string().default('')
    }).optional().default({
      commitmentSignals: [],
      engagementSignals: [],
      interestSignals: [],
      overallQuality: ''
    }),
    timelineAnalysis: z.object({
      statedTimeline: z.string().default(''),
      flexibility: z.string().default('medium'),
      businessDriver: z.string().default(''),
      consequences: z.string().default('')
    }).optional().default({
      statedTimeline: '',
      flexibility: 'medium',
      businessDriver: '',
      consequences: ''
    }),
    competitiveIntelligence: z.object({
      decisionCriteria: z.array(z.string()).default([]),
      vendorsKnown: z.array(z.string()).default([])
    }).optional().default({
      decisionCriteria: [],
      vendorsKnown: []
    }),
    resistanceAnalysis: z.object({
      signals: z.array(z.string()).default([])
    }).optional().default({ signals: [] }),
    urgencyDrivers: z.object({
      primary: z.string().default(''),
      factors: z.array(z.string()).default([])
    }).optional().default({ primary: '', factors: [] })
  }).optional().default({
    painSeverity: { indicators: [], businessImpact: '' },
    buyingSignalsAnalysis: {
      commitmentSignals: [],
      engagementSignals: [],
      interestSignals: [],
      overallQuality: ''
    },
    timelineAnalysis: {
      statedTimeline: '',
      flexibility: 'medium',
      businessDriver: '',
      consequences: ''
    },
    competitiveIntelligence: {
      decisionCriteria: [],
      vendorsKnown: []
    },
    resistanceAnalysis: { signals: [] },
    urgencyDrivers: { primary: '', factors: [] }
  }),
  key_takeaways: z.array(z.string()).optional().default([]),
  recommendations: z.any().optional().default({}),
  reasoning: z.object({
    whyTheseRecommendations: z.string().default(''),
    dealViabilityRationale: z.string().default(''),
    strategicRationale: z.string().default(''),
    clientSignalsObserved: z.array(z.string()).default([])
  }).optional().default({
    whyTheseRecommendations: '',
    dealViabilityRationale: '',
    strategicRationale: '',
    clientSignalsObserved: []
  }),
  action_plan: z.object({
    actions: z.array(z.any()).default([])
  }).optional().default({ actions: [] }),
  heat_level: z.string().optional(),
  coaching_insights: z.object({
    whatWorkedWell: z.array(z.string()).default([]),
    missedOpportunities: z.union([
      z.array(z.string()),
      z.string()
    ]).default([]),
    focusArea: z.string().default('')
  }).optional().default({
    whatWorkedWell: [],
    missedOpportunities: [],
    focusArea: ''
  })
}).passthrough()

export type NormalizedAnalysis = z.infer<typeof analysisSchema>

/**
 * Normalizes raw analysis data to ensure all required fields exist
 * Prevents render crashes from missing nested properties
 */
export function normalizeAnalysis(rawAnalysis: any): NormalizedAnalysis {
  try {
    return analysisSchema.parse(rawAnalysis)
  } catch (error) {
    console.error('Analysis normalization failed:', error)
    // Return a safe default structure if parsing fails
    return analysisSchema.parse({
      id: rawAnalysis?.id || 'unknown',
      ...rawAnalysis
    })
  }
}
