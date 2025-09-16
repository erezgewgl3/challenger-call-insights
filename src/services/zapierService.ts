import { supabase } from '@/lib/supabase'

interface ZapierApiKey {
  id: string
  key_name: string
  scopes: string[]
  expires_at: string
  usage_count: number
  rate_limit_per_hour: number
  last_used: string | null
  is_active: boolean
}

interface ZapierWebhook {
  id: string
  trigger_type: string
  webhook_url: string
  is_active: boolean
  success_count: number
  failure_count: number
  last_triggered: string | null
  last_error: string | null
  created_at: string
}

interface WebhookSubscription {
  api_key_id: string
  trigger_type: string
  webhook_url: string
  secret_token?: string
}

export interface CRMFormattedAnalysis {
  analysis_id: string
  deal_intelligence: {
    heat_level: 'hot' | 'warm' | 'cold'
    deal_stage_recommendation: string
    priority_score: number
    next_action: string
    timeline: string
  }
  participant_data: {
    internal_participants: Array<{
      name: string
      role?: string
      email?: string
    }>
    external_participants: Array<{
      name: string
      company?: string
      role?: string
      email?: string
      contact_match_status?: 'matched' | 'pending' | 'no_match'
      crm_contact_id?: string
    }>
  }
  conversation_insights: {
    key_takeaways: string[]
    challenger_scores: {
      teaching: number
      tailoring: number
      control: number
    }
    next_steps: string[]
    follow_up_actions: Array<{
      action: string
      owner: string
      due_date?: string
    }>
  }
  crm_specific: {
    salesforce?: any
    hubspot?: any
    pipedrive?: any
    zoho?: any
  }
}

export const zapierService = {
  // Authentication endpoints
  async generateApiKey(keyName: string, scopes: string[] = ['read:analysis', 'webhook:subscribe']) {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Authentication required')

      const { data, error } = await supabase.functions.invoke('zapier-auth', {
        body: {
          action: 'generate',
          key_name: keyName,
          scopes
        }
      })

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Generate API key error:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Failed to generate API key' }
    }
  },

  async validateApiKey(apiKey: string) {
    try {
      const { data, error } = await supabase.functions.invoke('zapier-auth', {
        body: {
          action: 'validate',
          api_key: apiKey
        }
      })

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Validate API key error:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Failed to validate API key' }
    }
  },

  async revokeApiKey(keyId: string) {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Authentication required')

      const { data, error } = await supabase.functions.invoke('zapier-auth', {
        body: {
          action: 'revoke',
          key_id: keyId
        }
      })

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Revoke API key error:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Failed to revoke API key' }
    }
  },

  async listApiKeys(): Promise<{ success: boolean; data?: ZapierApiKey[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('zapier_api_keys')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      return { success: true, data: data || [] }
    } catch (error) {
      console.error('List API keys error:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Failed to list API keys' }
    }
  },

  // Webhook management endpoints
  async subscribeWebhook(subscription: WebhookSubscription) {
    try {
      console.log('🔐 Starting webhook subscription for:', subscription)
      
      // Simplified authentication - let Supabase handle token management
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        console.error('❌ No active session found')
        throw new Error('Authentication required - please log in')
      }

      console.log('✅ Session found, user ID:', session.user.id)

      const { data, error } = await supabase.functions.invoke('zapier-webhooks', {
        body: {
          action: 'subscribe',
          ...subscription
        }
      })

      console.log('📡 Edge function response:', { data, error })

      if (error) {
        console.error('❌ Edge function error:', error)
        throw error
      }
      
      if (!data || !data.success) {
        const errorMsg = data?.error || 'Unknown error from webhook service'
        console.error('❌ Service error:', errorMsg)
        throw new Error(errorMsg)
      }

      console.log('✅ Webhook subscription successful')
      return { success: true, data }
    } catch (error) {
      console.error('❌ Subscribe webhook error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to subscribe webhook'
      return { success: false, error: errorMessage }
    }
  },

  async listWebhooks(): Promise<{ success: boolean; data?: ZapierWebhook[]; error?: string }> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Authentication required')

      const { data, error } = await supabase.functions.invoke('zapier-webhooks', {
        body: { action: 'list' }
      })

      if (error) throw error
      return { success: true, data: data?.webhooks || [] }
    } catch (error) {
      console.error('List webhooks error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to list webhooks'
      return { success: false, error: errorMessage }
    }
  },

  async unsubscribeWebhook(webhookId: string) {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Authentication required')

      const { data, error } = await supabase.functions.invoke('zapier-webhooks', {
        body: {
          action: 'unsubscribe',
          webhook_id: webhookId
        }
      })

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Unsubscribe webhook error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to unsubscribe webhook'
      return { success: false, error: errorMessage }
    }
  },

  async testWebhook(webhookId: string) {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Authentication required')

      const { data, error } = await supabase.functions.invoke('zapier-webhooks', {
        body: {
          action: 'test',
          webhook_id: webhookId
        }
      })

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Test webhook error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to test webhook'
      return { success: false, error: errorMessage }
    }
  },

  // Data access endpoints for Zapier
  async getAnalysisData(analysisId: string): Promise<{ success: boolean; data?: CRMFormattedAnalysis; error?: string }> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Authentication required')

      // Get conversation analysis with transcript and account data
      const { data: analysis, error: analysisError } = await supabase
        .from('conversation_analysis')
        .select(`
          *,
          transcripts!inner(
            id,
            title,
            participants,
            meeting_date,
            user_id,
            accounts(
              id,
              name,
              deal_stage
            )
          )
        `)
        .eq('id', analysisId)
        .single()

      if (analysisError) throw analysisError

      // Transform to CRM-friendly format
      const crmFormatted = this.transformToCRMFormat(analysis)
      return { success: true, data: crmFormatted }
    } catch (error) {
      console.error('Get analysis data error:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Failed to get analysis data' }
    }
  },

  async getRecentAnalyses(limit: number = 10): Promise<{ success: boolean; data?: CRMFormattedAnalysis[]; error?: string }> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Authentication required')

      const { data: analyses, error } = await supabase
        .from('conversation_analysis')
        .select(`
          *,
          transcripts!inner(
            id,
            title,
            participants,
            meeting_date,
            user_id,
            accounts(
              id,
              name,
              deal_stage
            )
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error

      const crmFormatted = analyses?.map(analysis => this.transformToCRMFormat(analysis)) || []
      return { success: true, data: crmFormatted }
    } catch (error) {
      console.error('Get recent analyses error:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Failed to get recent analyses' }
    }
  },

  async submitContactMatchDecision(matchReviewId: string, confirmedContactId: string) {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Authentication required')

      const { data, error } = await supabase
        .from('zapier_match_reviews')
        .update({
          status: 'confirmed',
          confirmed_contact_id: confirmedContactId,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', matchReviewId)
        .eq('user_id', session.user.id)
        .select()
        .single()

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Submit contact match error:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Failed to submit contact match' }
    }
  },

  // Testing endpoints
  async testConnection(apiKey?: string) {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Authentication required')

      const { data, error } = await supabase.functions.invoke('zapier-test', {
        body: {
          test: 'connection',
          apiKey: apiKey
        }
      })

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Test connection error:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Connection test failed' }
    }
  },

  async testWebhookDelivery(webhookUrl: string) {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Authentication required')

      const { data, error } = await supabase.functions.invoke('zapier-test', {
        body: {
          test: 'webhook-delivery',
          webhookUrl: webhookUrl
        }
      })

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Test webhook delivery error:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Webhook delivery test failed' }
    }
  },

  // Data transformation helper
  transformToCRMFormat(analysis: any): CRMFormattedAnalysis {
    const transcript = analysis.transcripts
    const account = transcript?.accounts

    // Extract participant data
    const participants = transcript?.participants || []
    const internalParticipants = participants.filter((p: any) => p.internal === true)
    const externalParticipants = participants.filter((p: any) => p.internal !== true)

    // Calculate deal intelligence
    const challengerAvg = analysis.challenger_scores ? 
      (analysis.challenger_scores.teaching + analysis.challenger_scores.tailoring + analysis.challenger_scores.control) / 3 : 2.5

    const heatLevel = challengerAvg >= 4 ? 'hot' : challengerAvg >= 3 ? 'warm' : 'cold'
    const priorityScore = Math.round(challengerAvg * 20) // Convert to 0-100 scale

    return {
      analysis_id: analysis.id,
      deal_intelligence: {
        heat_level: heatLevel,
        deal_stage_recommendation: analysis.guidance?.recommendation || 'Continue',
        priority_score: priorityScore,
        next_action: analysis.action_plan?.immediate_actions?.[0] || 'Follow up',
        timeline: analysis.guidance?.timing || '48 hours'
      },
      participant_data: {
        internal_participants: internalParticipants.map((p: any) => ({
          name: p.name,
          role: p.role,
          email: p.email
        })),
        external_participants: externalParticipants.map((p: any) => ({
          name: p.name,
          company: account?.name,
          role: p.role,
          email: p.email,
          contact_match_status: 'pending'
        }))
      },
      conversation_insights: {
        key_takeaways: analysis.key_takeaways || [],
        challenger_scores: analysis.challenger_scores || { teaching: 0, tailoring: 0, control: 0 },
        next_steps: analysis.action_plan?.next_steps || [],
        follow_up_actions: analysis.email_followup ? [{
          action: analysis.email_followup.subject || 'Follow up email',
          owner: 'Sales Rep',
          due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }] : []
      },
      crm_specific: {
        salesforce: {
          object_type: 'Opportunity',
          stage: account?.deal_stage || 'Prospecting'
        },
        hubspot: {
          deal_stage: account?.deal_stage || 'appointment-scheduled'
        },
        pipedrive: {
          stage_id: 1,
          status: 'open'
        },
        zoho: {
          stage: account?.deal_stage || 'Qualification'
        }
      }
    }
  }
}