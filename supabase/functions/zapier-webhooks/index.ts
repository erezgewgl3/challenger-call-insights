import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2'
import { corsHeaders } from '../_shared/cors.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

interface WebhookSubscription {
  api_key_id: string
  trigger_type: string
  webhook_url: string
  secret_token?: string
}

interface DeliveryAttempt {
  webhook_id: string
  trigger_data: any
  attempt_count: number
  max_attempts: number
}

// Validate webhook URL format and security (SSRF protection)
function validateWebhookUrl(url: string): { valid: boolean; error?: string } {
  try {
    const parsedUrl = new URL(url)
    
    // Must be HTTPS for security
    if (parsedUrl.protocol !== 'https:') {
      return { valid: false, error: 'Webhook URL must use HTTPS' }
    }
    
    // Block private/internal networks (SSRF protection)
    const hostname = parsedUrl.hostname.toLowerCase()
    
    // Block localhost variants
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
      return { valid: false, error: 'Localhost URLs are not allowed for security reasons' }
    }
    
    // Block private IP ranges (RFC 1918)
    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/
    const ipMatch = hostname.match(ipv4Regex)
    
    if (ipMatch) {
      const [, a, b, c, d] = ipMatch.map(Number)
      // 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 169.254.0.0/16 (link-local)
      if ((a === 10) || 
          (a === 172 && b >= 16 && b <= 31) || 
          (a === 192 && b === 168) ||
          (a === 169 && b === 254) || // Link-local
          (a >= 224) || // Multicast and reserved
          (a === 0) || (a === 127)) { // Reserved
        return { valid: false, error: 'Private IP addresses are not allowed for security reasons' }
      }
    }
    
    // Block internal domains
    const internalDomains = ['.local', '.internal', '.corp', '.home', '.lan', '.intranet']
    if (internalDomains.some(domain => hostname.endsWith(domain))) {
      return { valid: false, error: 'Internal domain names are not allowed for security reasons' }
    }
    
    // URL length validation (prevent DoS)
    if (url.length > 2048) {
      return { valid: false, error: 'Webhook URL is too long (max 2048 characters)' }
    }
    
    // Validate hostname format
    if (hostname.length > 253 || hostname === '' || hostname.startsWith('.') || hostname.endsWith('.')) {
      return { valid: false, error: 'Invalid hostname format' }
    }
    
    return { valid: true }
  } catch (error) {
    return { valid: false, error: 'Invalid URL format' }
  }
}

// Generate HMAC-SHA256 signature for webhook security
async function generateWebhookSignature(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder()
  const keyData = encoder.encode(secret)
  const messageData = encoder.encode(payload)
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData)
  const hashArray = Array.from(new Uint8Array(signature))
  
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// Calculate exponential backoff delay
function getRetryDelay(attemptCount: number): number {
  const delays = [1000, 5000, 15000, 45000, 135000] // 1s, 5s, 15s, 45s, 135s
  return delays[Math.min(attemptCount - 1, delays.length - 1)]
}

// Check if webhook should be disabled due to circuit breaker
async function checkCircuitBreaker(webhookId: string): Promise<boolean> {
  const { data: recentLogs, error } = await supabase
    .from('zapier_webhook_logs')
    .select('delivery_status')
    .eq('webhook_id', webhookId)
    .order('created_at', { ascending: false })
    .limit(10)
  
  if (error || !recentLogs) {
    console.error('Circuit breaker check error:', error)
    return false
  }
  
  // If last 10 attempts all failed, trigger circuit breaker
  const allFailed = recentLogs.length === 10 && 
    recentLogs.every(log => log.delivery_status === 'failed')
  
  if (allFailed) {
    console.log(`Circuit breaker triggered for webhook ${webhookId}`)
    // Disable the webhook
    await supabase
      .from('zapier_webhooks')
      .update({ 
        is_active: false,
        last_error: 'Webhook disabled due to consecutive failures (circuit breaker)'
      })
      .eq('id', webhookId)
  }
  
  return allFailed
}

// Deliver webhook with retry logic
async function deliverWebhook(deliveryAttempt: DeliveryAttempt): Promise<void> {
  const { webhook_id, trigger_data, attempt_count, max_attempts } = deliveryAttempt
  
  console.log(`Delivering webhook ${webhook_id}, attempt ${attempt_count}/${max_attempts}`)
  
  try {
    // Get webhook details
    const { data: webhook, error: webhookError } = await supabase
      .from('zapier_webhooks')
      .select('*')
      .eq('id', webhook_id)
      .eq('is_active', true)
      .single()
    
    if (webhookError || !webhook) {
      console.error('Webhook not found or inactive:', webhookError)
      return
    }
    
    // Check circuit breaker before delivery
    const circuitBreakerTriggered = await checkCircuitBreaker(webhook_id)
    if (circuitBreakerTriggered) {
      console.log('Circuit breaker active, skipping delivery')
      return
    }
    
    // Prepare payload
    const payload = JSON.stringify(trigger_data)
    let headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'Sales-Whisperer-Webhook/1.0',
      'X-SW-Delivery-Id': crypto.randomUUID(),
      'X-SW-Timestamp': new Date().toISOString(),
      'X-SW-Attempt': attempt_count.toString()
    }
    
    // Add signature if secret token exists
    if (webhook.secret_token) {
      const signature = await generateWebhookSignature(payload, webhook.secret_token)
      headers['X-SW-Signature'] = `sha256=${signature}`
    }
    
    // Create log entry
    const { data: logEntry } = await supabase
      .from('zapier_webhook_logs')
      .insert({
        webhook_id: webhook_id,
        trigger_data: trigger_data,
        delivery_status: 'pending',
        attempt_count: attempt_count
      })
      .select()
      .single()
    
    if (!logEntry) {
      console.error('Failed to create webhook log entry')
      return
    }
    
    // Deliver webhook with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout
    
    try {
      const response = await fetch(webhook.webhook_url, {
        method: 'POST',
        headers,
        body: payload,
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      const responseBody = await response.text().catch(() => 'Unable to read response')
      
      // Update log with delivery result
      const deliveryStatus = response.ok ? 'delivered' : 'failed'
      const deliveredAt = response.ok ? new Date().toISOString() : null
      
      await supabase
        .from('zapier_webhook_logs')
        .update({
          delivery_status: deliveryStatus,
          http_status_code: response.status,
          response_body: responseBody.substring(0, 1000), // Limit response body size
          delivered_at: deliveredAt,
          error_message: response.ok ? null : `HTTP ${response.status}: ${response.statusText}`
        })
        .eq('id', logEntry.id)
      
      // Update webhook success/failure counts
      if (response.ok) {
        await supabase
          .from('zapier_webhooks')
          .update({
            success_count: webhook.success_count + 1,
            last_triggered: new Date().toISOString(),
            last_error: null
          })
          .eq('id', webhook_id)
        
        console.log(`Webhook delivered successfully: ${webhook_id}`)
      } else {
        await supabase
          .from('zapier_webhooks')
          .update({
            failure_count: webhook.failure_count + 1,
            last_error: `HTTP ${response.status}: ${response.statusText}`
          })
          .eq('id', webhook_id)
        
        // Schedule retry if attempts remaining
        if (attempt_count < max_attempts) {
          const delay = getRetryDelay(attempt_count)
          console.log(`Scheduling retry for webhook ${webhook_id} in ${delay}ms`)
          
          // Schedule retry (using setTimeout for demo, in production would use a queue system)
          setTimeout(() => {
            deliverWebhook({
              webhook_id,
              trigger_data,
              attempt_count: attempt_count + 1,
              max_attempts
            })
          }, delay)
        } else {
          console.log(`Max attempts reached for webhook ${webhook_id}`)
        }
      }
      
    } catch (fetchError) {
      clearTimeout(timeoutId)
      
      const errorMessage = fetchError instanceof Error ? fetchError.message : 'Unknown fetch error'
      console.error(`Webhook delivery error: ${errorMessage}`)
      
      // Update log with error
      await supabase
        .from('zapier_webhook_logs')
        .update({
          delivery_status: 'failed',
          error_message: errorMessage,
          http_status_code: null,
          response_body: null
        })
        .eq('id', logEntry.id)
      
      // Update webhook failure count
      await supabase
        .from('zapier_webhooks')
        .update({
          failure_count: webhook.failure_count + 1,
          last_error: errorMessage
        })
        .eq('id', webhook_id)
      
      // Schedule retry if attempts remaining
      if (attempt_count < max_attempts) {
        const delay = getRetryDelay(attempt_count)
        console.log(`Scheduling retry for webhook ${webhook_id} in ${delay}ms`)
        
        setTimeout(() => {
          deliverWebhook({
            webhook_id,
            trigger_data,
            attempt_count: attempt_count + 1,
            max_attempts
          })
        }, delay)
      }
    }
    
  } catch (error) {
    console.error('Webhook delivery system error:', error)
  }
}

// Subscribe to webhook
async function subscribeWebhook(subscription: WebhookSubscription, userId: string): Promise<Response> {
  try {
    console.log('=== SUBSCRIBE WEBHOOK DEBUG ===')
    console.log('User ID:', userId)
    console.log('Subscription data:', subscription)
    
    // Validate webhook URL
    const urlValidation = validateWebhookUrl(subscription.webhook_url)
    if (!urlValidation.valid) {
      console.error('❌ URL validation failed:', urlValidation.error)
      return new Response(
        JSON.stringify({ success: false, error: urlValidation.error }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }
    console.log('✅ URL validation passed')
    
    // Validate API key ID format first
    if (!subscription.api_key_id || subscription.api_key_id === 'default' || !subscription.api_key_id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      console.log('❌ Invalid API key ID format:', subscription.api_key_id);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Invalid API key ID format. Please ensure you have generated a valid API key.',
          details: 'API key ID must be a valid UUID',
          code: 'INVALID_API_KEY_FORMAT'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Verify API key exists and belongs to user
    console.log('🔍 Checking API key:', subscription.api_key_id)
    const { data: apiKey, error: keyError } = await supabase
      .from('zapier_api_keys')
      .select('*')
      .eq('id', subscription.api_key_id)
      .eq('user_id', userId)
      .eq('is_active', true)
      .single()
    
    console.log('API key query result:', { apiKey: !!apiKey, keyError })
    
    if (keyError || !apiKey) {
      console.error('❌ API key validation failed:', keyError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid API key - not found or not owned by user',
          details: keyError?.message 
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }
    console.log('✅ API key found:', apiKey.key_name)
    
    // Check if webhook scopes include webhook:subscribe
    console.log('🔍 Checking API key scopes:', apiKey.scopes)
    if (!apiKey.scopes.includes('webhook:subscribe')) {
      console.error('❌ API key missing webhook:subscribe scope')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'API key does not have webhook:subscribe scope' 
        }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }
    console.log('✅ API key has webhook:subscribe scope')
    
    // Generate secret token if not provided
    const secretToken = subscription.secret_token || crypto.randomUUID()
    
    // Create webhook subscription
    console.log('💾 Inserting webhook into database...')
    const insertData = {
      user_id: userId,
      api_key_id: subscription.api_key_id,
      trigger_type: subscription.trigger_type,
      webhook_url: subscription.webhook_url,
      secret_token: secretToken,
      is_active: true
    }
    console.log('Insert data:', insertData)
    
    const { data: webhook, error: insertError } = await supabase
      .from('zapier_webhooks')
      .insert(insertData)
      .select()
      .single()
    
    if (insertError) {
      console.error('❌ Database insertion error:', insertError)
      console.error('Insert error details:', {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code
      })
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to create webhook subscription',
          details: insertError.message,
          code: 'DATABASE_ERROR'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }
    
    console.log('✅ Webhook subscription created successfully:', webhook.id)
    
    return new Response(
      JSON.stringify({
        success: true,
        webhook_id: webhook.id,
        trigger_type: webhook.trigger_type,
        webhook_url: webhook.webhook_url,
        secret_token: secretToken,
        created_at: webhook.created_at
      }),
      { 
        status: 201, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
    
  } catch (error) {
    console.error('💥 Subscribe webhook error:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error during webhook creation',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}

// List user's webhooks
async function listWebhooks(userId: string): Promise<Response> {
  try {
    const { data: webhooks, error } = await supabase
      .from('zapier_webhooks')
      .select(`
        id,
        trigger_type,
        webhook_url,
        is_active,
        success_count,
        failure_count,
        last_triggered,
        last_error,
        created_at,
        zapier_api_keys!inner(key_name)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('List webhooks error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch webhooks' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        webhooks: webhooks || []
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
    
  } catch (error) {
    console.error('List webhooks error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}

// Unsubscribe webhook
async function unsubscribeWebhook(webhookId: string, userId: string): Promise<Response> {
  try {
    const { data: webhook, error: deleteError } = await supabase
      .from('zapier_webhooks')
      .delete()
      .eq('id', webhookId)
      .eq('user_id', userId)
      .select()
      .single()
    
    if (deleteError || !webhook) {
      return new Response(
        JSON.stringify({ error: 'Webhook not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }
    
    console.log('Webhook unsubscribed:', webhookId)
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Webhook unsubscribed successfully'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
    
  } catch (error) {
    console.error('Unsubscribe webhook error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}

// Test webhook delivery
async function testWebhook(webhookId: string, userId: string): Promise<Response> {
  try {
    // Verify webhook exists and belongs to user
    const { data: webhook, error: webhookError } = await supabase
      .from('zapier_webhooks')
      .select('*')
      .eq('id', webhookId)
      .eq('user_id', userId)
      .single()
    
    if (webhookError || !webhook) {
      return new Response(
        JSON.stringify({ error: 'Webhook not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }
    
    // Create test payload
    const testPayload = {
      test: true,
      webhook_id: webhookId,
      trigger_type: webhook.trigger_type,
      timestamp: new Date().toISOString(),
      message: 'This is a test webhook delivery from Sales Whisperer',
      sample_data: {
        analysis_id: 'test-analysis-id',
        user_id: userId,
        trigger_type: webhook.trigger_type
      }
    }
    
    // Deliver webhook asynchronously (no await to prevent blocking)
    deliverWebhook({
      webhook_id: webhookId,
      trigger_data: testPayload,
      attempt_count: 1,
      max_attempts: 1 // Single attempt for tests
    }).catch(error => {
      console.error('Test webhook delivery error:', error)
    })
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Test webhook delivery started',
        webhook_id: webhookId
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
    
  } catch (error) {
    console.error('Test webhook error:', error)
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
  
  // Request size limit (prevent DoS)
  const contentLength = req.headers.get('content-length')
  if (contentLength && parseInt(contentLength) > 1024 * 1024) { // 1MB limit
    return new Response(
      JSON.stringify({ error: 'Request too large (max 1MB)' }),
      { 
        status: 413,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
  
  try {
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/').filter(p => p)
    const endpoint = pathParts[pathParts.length - 1]
    let action = pathParts[pathParts.length - 2]
    
    // Read request body once and try to get action from it as fallback for Supabase client calls
    let body = null
    if (req.method !== 'GET') {
      try {
        body = await req.json()
        // If no action from path or endpoint is the base function name, use action from body
        if (!action || endpoint === 'zapier-webhooks') {
          action = body.action
        }
      } catch {
        // If no body or invalid JSON, stick with path-based action
      }
    }
    
    console.log('Zapier webhooks request:', req.method, action, endpoint)
    
    // Validate authentication with enhanced error handling
    const authHeader = req.headers.get('authorization')
    console.log('Authorization header present:', !!authHeader)
    console.log('Authorization format correct:', authHeader?.startsWith('Bearer '))
    
    if (!authHeader) {
      console.error('Authentication failed: No authorization header provided')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing Authorization header. Please include "Authorization: Bearer <token>" in your request.' 
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!authHeader.startsWith('Bearer ')) {
      console.error('Authentication failed: Malformed authorization header format')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid Authorization header format. Expected "Bearer <token>".' 
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }
    
    const token = authHeader.replace('Bearer ', '').trim()
    console.log('Token extracted, length:', token?.length)
    console.log('Token preview:', token ? token.substring(0, 20) + '...' : 'empty')
    
    if (!token) {
      console.error('Authentication failed: Empty token')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Empty authentication token provided' 
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Verify JWT token with detailed error logging
    let user, authError
    try {
      const authResult = await supabase.auth.getUser(token)
      user = authResult.data?.user
      authError = authResult.error
    } catch (tokenError) {
      console.error('Token verification error:', tokenError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Token verification failed - invalid token format or network error'
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }
    
    if (authError) {
      console.error('Authentication error details:', {
        message: authError.message,
        name: authError.name,
        status: authError.status,
        code: authError.code
      })
      
      // Provide specific error messages based on common auth error types
      let errorMessage = 'Authentication failed'
      if (authError.message?.includes('expired')) {
        errorMessage = 'Authentication token has expired. Please log in again.'
      } else if (authError.message?.includes('invalid')) {
        errorMessage = 'Invalid authentication token. Please log in again.'
      } else if (authError.message?.includes('malformed')) {
        errorMessage = 'Malformed authentication token. Please log in again.'
      }
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: errorMessage,
          auth_error: authError.message
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }
    
    if (!user) {
      console.error('Authentication failed: No user found for valid token')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No user found for the provided token. Please log in again.'
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }
    
    console.log('Authenticated user:', user.id)
    console.log('User email:', user.email)
    console.log('User roles:', user.user_metadata?.roles || 'none')
    
    // Route requests based on action from body or path
    switch (action) {
      case 'subscribe':
        if (req.method !== 'POST') {
          return new Response(
            JSON.stringify({ error: 'Method not allowed' }),
            { 
              status: 405, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }
        
        const subscriptionData = body || await req.json()
        if (!subscriptionData.api_key_id || !subscriptionData.trigger_type || !subscriptionData.webhook_url) {
          return new Response(
            JSON.stringify({ error: 'Missing required fields: api_key_id, trigger_type, webhook_url' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }
        
        return await subscribeWebhook(subscriptionData, user.id)
      
      case 'list':
        if (req.method !== 'GET' && req.method !== 'POST') {
          return new Response(
            JSON.stringify({ error: 'Method not allowed' }),
            { 
              status: 405, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }
        
        return await listWebhooks(user.id)

      case 'unsubscribe':
        if (req.method !== 'POST') {
          return new Response(
            JSON.stringify({ error: 'Method not allowed' }),
            { 
              status: 405, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }
        
        const unsubscribeData = body || {}
        const webhookId = unsubscribeData.webhook_id || endpoint
        return await unsubscribeWebhook(webhookId, user.id)

      case 'test':
        if (req.method !== 'POST') {
          return new Response(
            JSON.stringify({ error: 'Method not allowed' }),
            { 
              status: 405, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }
        
        const testData = body || {}
        const testWebhookId = testData.webhook_id || endpoint
        return await testWebhook(testWebhookId, user.id)
      
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
    console.error('Zapier webhooks function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

// Export delivery function for use by other services
export { deliverWebhook }