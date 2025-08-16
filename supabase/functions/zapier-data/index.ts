import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2'
import { corsHeaders } from '../_shared/cors.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

interface CRMFormattedAnalysis {
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
  metadata: {
    transcript_title?: string
    meeting_date?: string
    duration_minutes?: number
    analysis_timestamp: string
    version: string
  }
}

// Validate API key and get user context
async function validateApiKey(apiKey: string): Promise<{ valid: boolean; userId?: string; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('zapier_api_keys')
      .select('user_id, scopes, is_active, expires_at, usage_count, rate_limit_per_hour')
      .eq('api_key_hash', await hashApiKey(apiKey))
      .eq('is_active', true)
      .single()

    if (error || !data) {
      return { valid: false, error: 'Invalid API key' }
    }

    // Check expiration
    if (new Date(data.expires_at) < new Date()) {
      return { valid: false, error: 'API key expired' }
    }

    // Check rate limiting (simplified - in production would use Redis)
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count, error: countError } = await supabase
      .from('zapier_api_keys')
      .select('usage_count', { count: 'exact' })
      .eq('api_key_hash', await hashApiKey(apiKey))
      .gte('last_used', hourAgo)

    if (countError) {
      console.error('Rate limit check error:', countError)
    }

    // Simple rate limiting check
    if ((count || 0) >= data.rate_limit_per_hour) {
      return { valid: false, error: 'Rate limit exceeded' }
    }

    // Update usage count
    await supabase
      .from('zapier_api_keys')
      .update({
        usage_count: data.usage_count + 1,
        last_used: new Date().toISOString()
      })
      .eq('api_key_hash', await hashApiKey(apiKey))

    return { valid: true, userId: data.user_id }
  } catch (error) {
    console.error('API key validation error:', error)
    return { valid: false, error: 'Validation failed' }
  }
}

// Hash API key for lookup
async function hashApiKey(apiKey: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(apiKey)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// Transform analysis data to CRM-friendly format
function transformToCRMFormat(analysis: any): CRMFormattedAnalysis {
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
        stage: account?.deal_stage || 'Prospecting',
        record_type: 'Standard'
      },
      hubspot: {
        deal_stage: account?.deal_stage || 'appointment-scheduled',
        pipeline: 'default'
      },
      pipedrive: {
        stage_id: heatLevel === 'hot' ? 3 : heatLevel === 'warm' ? 2 : 1,
        status: 'open'
      },
      zoho: {
        stage: account?.deal_stage || 'Qualification',
        module: 'Deals'
      }
    },
    metadata: {
      transcript_title: transcript?.title,
      meeting_date: transcript?.meeting_date,
      duration_minutes: transcript?.duration_minutes,
      analysis_timestamp: analysis.created_at,
      version: '1.0'
    }
  }
}

// Get analysis data with CRM formatting
async function getAnalysisData(analysisId: string, userId: string): Promise<Response> {
  try {
    console.log('Getting analysis data for:', analysisId, 'user:', userId)

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
          duration_minutes,
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

    if (analysisError) {
      console.error('Analysis query error:', analysisError)
      return new Response(
        JSON.stringify({ error: 'Analysis not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Verify user owns this transcript (RLS enforcement)
    if (analysis.transcripts.user_id !== userId) {
      return new Response(
        JSON.stringify({ error: 'Access denied' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Transform to CRM-friendly format
    const crmFormatted = transformToCRMFormat(analysis)

    console.log('Analysis data retrieved successfully for:', analysisId)

    return new Response(
      JSON.stringify({
        success: true,
        data: crmFormatted
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Get analysis data error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}

// List recent analyses for user
async function getRecentAnalyses(userId: string, limit: number = 10): Promise<Response> {
  try {
    console.log('Getting recent analyses for user:', userId, 'limit:', limit)

    const { data: analyses, error } = await supabase
      .from('conversation_analysis')
      .select(`
        *,
        transcripts!inner(
          id,
          title,
          participants,
          meeting_date,
          duration_minutes,
          user_id,
          accounts(
            id,
            name,
            deal_stage
          )
        )
      `)
      .eq('transcripts.user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Recent analyses query error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch analyses' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Transform all analyses to CRM-friendly format
    const crmFormatted = analyses?.map(analysis => transformToCRMFormat(analysis)) || []

    console.log('Retrieved', crmFormatted.length, 'recent analyses for user:', userId)

    return new Response(
      JSON.stringify({
        success: true,
        data: crmFormatted,
        count: crmFormatted.length
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Get recent analyses error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}

// Submit contact match decision
async function submitContactMatchDecision(userId: string, requestBody: any): Promise<Response> {
  try {
    console.log('Submitting contact match for user:', userId)

    const { match_review_id, confirmed_contact_id, participant_name, crm_data } = requestBody

    if (!match_review_id || !confirmed_contact_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: match_review_id, confirmed_contact_id' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Update match review status
    const { data: matchReview, error: updateError } = await supabase
      .from('zapier_match_reviews')
      .update({
        status: 'confirmed',
        confirmed_contact_id: confirmed_contact_id,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', match_review_id)
      .eq('user_id', userId)
      .select()
      .single()

    if (updateError || !matchReview) {
      console.error('Match review update error:', updateError)
      return new Response(
        JSON.stringify({ error: 'Match review not found or access denied' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Log the match decision for audit purposes
    await supabase
      .from('crm_integration_logs')
      .insert({
        user_id: userId,
        analysis_id: matchReview.analysis_id,
        crm_type: 'zapier',
        operation_type: 'contact_match',
        crm_record_id: confirmed_contact_id,
        status: 'completed'
      })

    console.log('Contact match confirmed:', match_review_id, '→', confirmed_contact_id)

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          match_review_id: match_review_id,
          confirmed_contact_id: confirmed_contact_id,
          participant_name: participant_name,
          status: 'confirmed',
          reviewed_at: matchReview.reviewed_at
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Submit contact match error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/').filter(p => p)
    const endpoint = pathParts[pathParts.length - 1]
    const action = pathParts[pathParts.length - 2]

    console.log('Zapier data request:', req.method, url.pathname)

    // Extract API key from Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const apiKey = authHeader.split(' ')[1]
    
    // Validate API key and get user context
    const validation = await validateApiKey(apiKey)
    if (!validation.valid || !validation.userId) {
      return new Response(
        JSON.stringify({ error: validation.error || 'Invalid API key' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const userId = validation.userId

    // Route requests
    switch (true) {
      // GET /analysis/:id - Get specific analysis data
      case action === 'analysis' && req.method === 'GET':
        return await getAnalysisData(endpoint, userId)
      
      // GET /recent-analyses - List recent analyses
      case endpoint === 'recent-analyses' && req.method === 'GET':
        const limit = parseInt(url.searchParams.get('limit') || '10', 10)
        return await getRecentAnalyses(userId, limit)
      
      // POST /match-review - Submit contact match decision
      case endpoint === 'match-review' && req.method === 'POST':
        const requestBody = await req.json()
        return await submitContactMatchDecision(userId, requestBody)
      
      default:
        return new Response(
          JSON.stringify({ error: 'Endpoint not found' }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
    }

  } catch (error) {
    console.error('Zapier data function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})