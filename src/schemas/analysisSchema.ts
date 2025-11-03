import { z } from 'zod'

/**
 * Zod Schema for Analysis Data Normalization
 * Ensures all nested fields have safe defaults to prevent render crashes
 */

export const analysisSchema = z.object({
  id: z.string(),
  challenger_scores: z.any().nullable().optional().default({}).transform(val => val ?? {}),
  guidance: z.object({
    power_center: z.object({
      name: z.string().default(''),
      title: z.string().default(''),
      influence_level: z.string().default('medium')
    }).optional().default({ name: '', title: '', influence_level: 'medium' })
  }).nullable().optional().default({}).transform(val => val ?? {}),
  email_followup: z.any().nullable().optional().default({}).transform(val => val ?? {}),
  participants: z.object({
    salesRep: z.object({
      name: z.string().default(''),
      company: z.string().default('')
    }).optional().default({ name: '', company: '' }),
    clientContacts: z.array(z.any()).nullable().optional().default([]).transform(val => val ?? []),
    additionalReps: z.array(z.any()).nullable().optional().default([]).transform(val => val ?? []),
    sellerTeam: z.array(z.any()).nullable().optional().default([]).transform(val => val ?? [])
  }).nullable().optional().default({
    salesRep: { name: '', company: '' },
    clientContacts: [],
    additionalReps: [],
    sellerTeam: []
  }).transform(val => val ?? {
    salesRep: { name: '', company: '' },
    clientContacts: [],
    additionalReps: [],
    sellerTeam: []
  }),
  call_summary: z.object({
    painSeverity: z.object({
      indicators: z.array(z.string()).nullable().default([]).transform(val => val ?? []),
      businessImpact: z.string().default('')
    }).optional().default({ indicators: [], businessImpact: '' }),
    buyingSignalsAnalysis: z.object({
      commitmentSignals: z.array(z.string()).nullable().default([]).transform(val => val ?? []),
      engagementSignals: z.array(z.string()).nullable().default([]).transform(val => val ?? []),
      interestSignals: z.array(z.string()).nullable().default([]).transform(val => val ?? []),
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
      decisionCriteria: z.array(z.string()).nullable().default([]).transform(val => val ?? []),
      vendorsKnown: z.array(z.string()).nullable().default([]).transform(val => val ?? [])
    }).optional().default({
      decisionCriteria: [],
      vendorsKnown: []
    }),
    resistanceAnalysis: z.object({
      signals: z.array(z.string()).nullable().default([]).transform(val => val ?? [])
    }).optional().default({ signals: [] }),
    urgencyDrivers: z.object({
      primary: z.string().default(''),
      factors: z.array(z.string()).nullable().default([]).transform(val => val ?? [])
    }).optional().default({ primary: '', factors: [] })
  }).nullable().optional().default({
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
  }).transform(val => val ?? {
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
  key_takeaways: z.array(z.string()).nullable().optional().default([]).transform(val => val ?? []),
  recommendations: z.any().nullable().optional().default({}).transform(val => val ?? {}),
  reasoning: z.object({
    whyTheseRecommendations: z.string().default(''),
    dealViabilityRationale: z.string().default(''),
    strategicRationale: z.string().default(''),
    clientSignalsObserved: z.array(z.string()).nullable().default([]).transform(val => val ?? [])
  }).nullable().optional().default({
    whyTheseRecommendations: '',
    dealViabilityRationale: '',
    strategicRationale: '',
    clientSignalsObserved: []
  }).transform(val => val ?? {
    whyTheseRecommendations: '',
    dealViabilityRationale: '',
    strategicRationale: '',
    clientSignalsObserved: []
  }),
  action_plan: z.object({
    actions: z.array(z.any()).nullable().default([]).transform(val => val ?? [])
  }).nullable().optional().default({ actions: [] }).transform(val => val ?? { actions: [] }),
  heat_level: z.string().optional(),
  coaching_insights: z.object({
    whatWorkedWell: z.array(z.string()).nullable().default([]).transform(val => val ?? []),
    missedOpportunities: z.union([
      z.array(z.string()),
      z.string()
    ]).nullable().default([]).transform(val => val ?? []),
    focusArea: z.string().default('')
  }).nullable().optional().default({
    whatWorkedWell: [],
    missedOpportunities: [],
    focusArea: ''
  }).transform(val => val ?? {
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
