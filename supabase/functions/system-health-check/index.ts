import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const healthCheck = {
      database: { status: 'unknown', responseTime: 0 },
      auth: { status: 'unknown', responseTime: 0 },
      prompts: { status: 'unknown', responseTime: 0, configured: false },
      aiServices: { status: 'unknown', responseTime: 0, configured: false, provider: null },
      overall: 'unknown'
    }

    // Check Database
    const dbStart = Date.now()
    try {
      const { error: dbError } = await supabase
        .from('users')
        .select('count')
        .limit(1)
      
      healthCheck.database = {
        status: dbError ? 'error' : 'healthy',
        responseTime: Date.now() - dbStart
      }
    } catch (err) {
      healthCheck.database = {
        status: 'error',
        responseTime: Date.now() - dbStart
      }
      console.error('Database health check failed:', err)
    }

    // Check Auth
    const authStart = Date.now()
    try {
      const { error: authError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 })
      
      healthCheck.auth = {
        status: authError ? 'error' : 'healthy',
        responseTime: Date.now() - authStart
      }
    } catch (err) {
      healthCheck.auth = {
        status: 'error',
        responseTime: Date.now() - authStart
      }
      console.error('Auth health check failed:', err)
    }

    // Check Prompt System Configuration
    const promptStart = Date.now()
    try {
      const { data: promptSettings, error: promptError } = await supabase
        .from('system_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['default_ai_provider', 'default_prompt_id'])

      const hasProvider = promptSettings?.some(s => s.setting_key === 'default_ai_provider')
      const hasPrompt = promptSettings?.some(s => s.setting_key === 'default_prompt_id')
      
      healthCheck.prompts = {
        status: promptError ? 'error' : 'healthy',
        responseTime: Date.now() - promptStart,
        configured: hasProvider && hasPrompt
      }
    } catch (err) {
      healthCheck.prompts = {
        status: 'error',
        responseTime: Date.now() - promptStart,
        configured: false
      }
      console.error('Prompt system health check failed:', err)
    }

    // Check AI Services Configuration
    const aiStart = Date.now()
    try {
      const { data: aiSettings, error: aiError } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'default_ai_provider')
        .maybeSingle()

      const isConfigured = aiSettings?.setting_value && 
        (aiSettings.setting_value === 'openai' || aiSettings.setting_value === 'claude')

      healthCheck.aiServices = {
        status: aiError ? 'error' : (isConfigured ? 'configured' : 'not_configured'),
        responseTime: Date.now() - aiStart,
        configured: isConfigured,
        provider: aiSettings?.setting_value || null
      }
    } catch (err) {
      healthCheck.aiServices = {
        status: 'error',
        responseTime: Date.now() - aiStart,
        configured: false,
        provider: null
      }
      console.error('AI services health check failed:', err)
    }

    // Determine overall health
    const errorCount = Object.values(healthCheck)
      .filter(v => typeof v === 'object' && 'status' in v && v.status === 'error')
      .length

    healthCheck.overall = errorCount === 0 ? 'healthy' : errorCount > 2 ? 'unhealthy' : 'degraded'

    return new Response(JSON.stringify(healthCheck), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })
  } catch (error) {
    console.error('System health check error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        overall: 'error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
