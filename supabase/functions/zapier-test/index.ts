import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2'
import { corsHeaders } from '../_shared/cors.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

interface ConnectionTestResult {
  authenticated: boolean
  user_id: string | null
  api_key_valid: boolean
  database_connection: 'healthy' | 'degraded' | 'down'
  webhook_service: 'healthy' | 'degraded' | 'down'
  rate_limit_status: {
    remaining: number
    reset_time: string
  }
  permissions: string[]
  system_status: {
    supabase: 'healthy' | 'degraded' | 'down'
    edge_functions: 'healthy' | 'degraded' | 'down'
    last_successful_request: string | null
  }
  response_time_ms: number
  timestamp: string
}

// Validate API key and get user context
async function validateApiKey(apiKey: string): Promise<{ valid: boolean; userId?: string; scopes?: string[]; error?: string }> {
  try {
    console.log('Testing API key validation')
    
    const keyHash = await hashApiKey(apiKey)
    
    const { data, error } = await supabase
      .from('zapier_api_keys')
      .select('user_id, scopes, is_active, expires_at, usage_count, rate_limit_per_hour, last_used')
      .eq('api_key_hash', keyHash)
      .eq('is_active', true)
      .single()

    if (error || !data) {
      console.log('API key not found or inactive')
      return { valid: false, error: 'Invalid or inactive API key' }
    }

    // Check expiration
    if (new Date(data.expires_at) < new Date()) {
      console.log('API key expired')
      return { valid: false, error: 'API key expired' }
    }

    console.log('API key validation successful for user:', data.user_id)
    return { 
      valid: true, 
      userId: data.user_id, 
      scopes: data.scopes 
    }
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

// Test database connectivity
async function testDatabaseConnection(): Promise<'healthy' | 'degraded' | 'down'> {
  try {
    const start = Date.now()
    
    // Simple query to test database
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1)

    const duration = Date.now() - start
    
    if (error) {
      console.error('Database test error:', error)
      return 'down'
    }

    // Consider degraded if query takes longer than 500ms
    return duration > 500 ? 'degraded' : 'healthy'
  } catch (error) {
    console.error('Database connection test failed:', error)
    return 'down'
  }
}

// Test webhook service connectivity
async function testWebhookService(): Promise<'healthy' | 'degraded' | 'down'> {
  try {
    const start = Date.now()
    
    // Test webhook service by checking webhook logs table
    const { data, error } = await supabase
      .from('zapier_webhook_logs')
      .select('id')
      .limit(1)

    const duration = Date.now() - start
    
    if (error) {
      console.error('Webhook service test error:', error)
      return 'down'
    }

    return duration > 1000 ? 'degraded' : 'healthy'
  } catch (error) {
    console.error('Webhook service test failed:', error)
    return 'down'
  }
}

// Get rate limit status for user
async function getRateLimitStatus(userId: string): Promise<{ remaining: number; reset_time: string }> {
  try {
    // Get user's API keys and calculate combined rate limit usage
    const { data: apiKeys, error } = await supabase
      .from('zapier_api_keys')
      .select('rate_limit_per_hour, usage_count, last_used')
      .eq('user_id', userId)
      .eq('is_active', true)

    if (error || !apiKeys) {
      return { remaining: 0, reset_time: new Date().toISOString() }
    }

    // Calculate total rate limit (sum of all keys)
    const totalRateLimit = apiKeys.reduce((sum, key) => sum + key.rate_limit_per_hour, 0)
    
    // Calculate current hour usage (simplified - in production would use Redis)
    const currentHour = new Date()
    currentHour.setMinutes(0, 0, 0)
    const nextHour = new Date(currentHour.getTime() + 60 * 60 * 1000)
    
    // For demo purposes, use a simple calculation
    const totalUsage = apiKeys.reduce((sum, key) => {
      // Only count usage from current hour
      const lastUsed = new Date(key.last_used || 0)
      return lastUsed >= currentHour ? sum + (key.usage_count % key.rate_limit_per_hour) : sum
    }, 0)

    return {
      remaining: Math.max(0, totalRateLimit - totalUsage),
      reset_time: nextHour.toISOString()
    }
  } catch (error) {
    console.error('Rate limit status error:', error)
    return { remaining: 0, reset_time: new Date().toISOString() }
  }
}

// Test API connectivity comprehensively
async function testConnection(apiKey?: string): Promise<Response> {
  const testStart = Date.now()
  
  try {
    console.log('Starting comprehensive connection test')

    let authResult = { valid: false, userId: '', scopes: [] as string[] }
    
    if (apiKey) {
      authResult = await validateApiKey(apiKey)
    }

    // Run system tests in parallel
    const [databaseStatus, webhookStatus] = await Promise.all([
      testDatabaseConnection(),
      testWebhookService()
    ])

    let rateLimitStatus = { remaining: 0, reset_time: new Date().toISOString() }
    if (authResult.valid && authResult.userId) {
      rateLimitStatus = await getRateLimitStatus(authResult.userId)
    }

    // Determine overall system health
    const edgeFunctionStatus = 'healthy' // If we're running, edge functions are healthy
    const supabaseStatus = databaseStatus === 'down' ? 'down' : 
                          databaseStatus === 'degraded' ? 'degraded' : 'healthy'

    const responseTime = Date.now() - testStart

    const testResult: ConnectionTestResult = {
      authenticated: authResult.valid,
      user_id: authResult.userId || null,
      api_key_valid: authResult.valid,
      database_connection: databaseStatus,
      webhook_service: webhookStatus,
      rate_limit_status: rateLimitStatus,
      permissions: authResult.scopes || [],
      system_status: {
        supabase: supabaseStatus,
        edge_functions: edgeFunctionStatus,
        last_successful_request: new Date().toISOString()
      },
      response_time_ms: responseTime,
      timestamp: new Date().toISOString()
    }

    console.log('Connection test completed:', {
      authenticated: testResult.authenticated,
      database: testResult.database_connection,
      webhook: testResult.webhook_service,
      response_time: testResult.response_time_ms
    })

    return new Response(
      JSON.stringify({
        success: true,
        data: testResult
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Connection test error:', error)
    
    const errorResult: ConnectionTestResult = {
      authenticated: false,
      user_id: null,
      api_key_valid: false,
      database_connection: 'down',
      webhook_service: 'down',
      rate_limit_status: { remaining: 0, reset_time: new Date().toISOString() },
      permissions: [],
      system_status: {
        supabase: 'down',
        edge_functions: 'degraded',
        last_successful_request: null
      },
      response_time_ms: Date.now() - testStart,
      timestamp: new Date().toISOString()
    }

    return new Response(
      JSON.stringify({
        success: false,
        data: errorResult,
        error: error instanceof Error ? error.message : 'Connection test failed'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}

// Test webhook delivery (for debugging)
async function testWebhookDelivery(userId: string, webhookUrl?: string): Promise<Response> {
  try {
    console.log('Testing webhook delivery for user:', userId)

    const testPayload = {
      test: true,
      trigger_type: 'connection_test',
      user_id: userId,
      timestamp: new Date().toISOString(),
      message: 'This is a test webhook delivery from Sales Whisperer Zapier integration',
      data: {
        connection_status: 'healthy',
        test_id: crypto.randomUUID()
      }
    }

    if (webhookUrl) {
      // Test specific webhook URL
      try {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Sales-Whisperer-Test/1.0'
          },
          body: JSON.stringify(testPayload)
        })

        const success = response.ok
        
        return new Response(
          JSON.stringify({
            success: true,
            data: {
              webhook_url: webhookUrl,
              delivery_status: success ? 'delivered' : 'failed',
              http_status: response.status,
              response_time_ms: 0, // Would measure in real implementation
              test_payload: testPayload
            }
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      } catch (fetchError) {
        return new Response(
          JSON.stringify({
            success: false,
            error: `Webhook delivery failed: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`,
            data: {
              webhook_url: webhookUrl,
              delivery_status: 'failed',
              test_payload: testPayload
            }
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }
    } else {
      // Test all user's webhooks
      const { data: webhooks, error } = await supabase
        .from('zapier_webhooks')
        .select('id, webhook_url, trigger_type, is_active')
        .eq('user_id', userId)
        .eq('is_active', true)

      if (error) {
        throw error
      }

      const results = await Promise.all(
        (webhooks || []).map(async (webhook) => {
          try {
            const response = await fetch(webhook.webhook_url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Sales-Whisperer-Test/1.0'
              },
              body: JSON.stringify({
                ...testPayload,
                webhook_id: webhook.id,
                trigger_type: webhook.trigger_type
              })
            })

            return {
              webhook_id: webhook.id,
              webhook_url: webhook.webhook_url,
              trigger_type: webhook.trigger_type,
              delivery_status: response.ok ? 'delivered' : 'failed',
              http_status: response.status
            }
          } catch (error) {
            return {
              webhook_id: webhook.id,
              webhook_url: webhook.webhook_url,
              trigger_type: webhook.trigger_type,
              delivery_status: 'failed',
              error: error instanceof Error ? error.message : 'Unknown error'
            }
          }
        })
      )

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            webhooks_tested: results.length,
            test_results: results,
            test_payload: testPayload
          }
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }
  } catch (error) {
    console.error('Webhook delivery test error:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Webhook test failed' 
      }),
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

    console.log('Zapier test request:', req.method, url.pathname)

    // Extract API key from Authorization header (optional for basic connection test)
    const authHeader = req.headers.get('Authorization')
    const apiKey = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : undefined

    // Route requests
    switch (endpoint) {
      case 'connection':
        if (req.method === 'GET') {
          return await testConnection(apiKey)
        } else {
          return new Response(
            JSON.stringify({ error: 'Method not allowed' }),
            { 
              status: 405, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }
      
      case 'webhook':
        if (req.method === 'POST') {
          if (!apiKey) {
            return new Response(
              JSON.stringify({ error: 'API key required for webhook testing' }),
              { 
                status: 401, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
              }
            )
          }

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

          const body = await req.json().catch(() => ({}))
          const webhookUrl = body.webhook_url

          return await testWebhookDelivery(validation.userId, webhookUrl)
        } else {
          return new Response(
            JSON.stringify({ error: 'Method not allowed' }),
            { 
              status: 405, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }
      
      default:
        return new Response(
          JSON.stringify({ 
            error: 'Endpoint not found',
            available_endpoints: ['/connection', '/webhook']
          }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
    }

  } catch (error) {
    console.error('Zapier test function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})