import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2'
import { corsHeaders } from '../_shared/cors.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

interface TriggerEvent {
  trigger_type: string
  user_id: string
  analysis_id?: string
  data: any
}

// Exponential backoff retry delays
function getRetryDelay(attemptCount: number): number {
  const delays = [1000, 5000, 15000, 45000, 135000] // 1s, 5s, 15s, 45s, 135s
  return delays[Math.min(attemptCount - 1, delays.length - 1)]
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

// Check circuit breaker status
async function checkCircuitBreaker(webhookId: string): Promise<boolean> {
  const { data: recentLogs, error } = await supabase
    .from('zapier_webhook_logs')
    .select('delivery_status')
    .eq('webhook_id', webhookId)
    .order('created_at', { ascending: false })
    .limit(10)
  
  if (error || !recentLogs) {
    return false
  }
  
  // Check if last 10 attempts all failed
  const allFailed = recentLogs.length === 10 && 
    recentLogs.every(log => log.delivery_status === 'failed')
  
  if (allFailed) {
    // Disable webhook due to circuit breaker
    await supabase
      .from('zapier_webhooks')
      .update({ 
        is_active: false,
        last_error: 'Webhook disabled due to consecutive failures (circuit breaker)'
      })
      .eq('id', webhookId)
    
    console.log(`Circuit breaker triggered for webhook ${webhookId}`)
    return true
  }
  
  return false
}

// Deliver webhook with retry logic
async function deliverWebhook(webhookId: string, payload: any, attemptCount: number = 1): Promise<void> {
  const maxAttempts = 5
  
  try {
    console.log(`Delivering webhook ${webhookId}, attempt ${attemptCount}/${maxAttempts}`)
    
    // Get webhook details
    const { data: webhook, error: webhookError } = await supabase
      .from('zapier_webhooks')
      .select('*')
      .eq('id', webhookId)
      .eq('is_active', true)
      .single()
    
    if (webhookError || !webhook) {
      console.error('Webhook not found or inactive:', webhookId)
      return
    }
    
    // Check circuit breaker
    const circuitBreakerActive = await checkCircuitBreaker(webhookId)
    if (circuitBreakerActive) {
      console.log('Circuit breaker active, skipping delivery')
      return
    }
    
    // Prepare payload
    const payloadString = JSON.stringify(payload)
    let headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'Sales-Whisperer-Webhook/1.0',
      'X-SW-Delivery-Id': crypto.randomUUID(),
      'X-SW-Timestamp': new Date().toISOString(),
      'X-SW-Attempt': attemptCount.toString(),
      'X-SW-Trigger-Type': webhook.trigger_type
    }
    
    // Add HMAC signature if secret exists
    if (webhook.secret_token) {
      const signature = await generateWebhookSignature(payloadString, webhook.secret_token)
      headers['X-SW-Signature'] = `sha256=${signature}`
    }
    
    // Create log entry
    const { data: logEntry } = await supabase
      .from('zapier_webhook_logs')
      .insert({
        webhook_id: webhookId,
        trigger_data: payload,
        delivery_status: 'pending',
        attempt_count: attemptCount
      })
      .select()
      .single()
    
    if (!logEntry) {
      console.error('Failed to create webhook log entry')
      return
    }
    
    // Deliver with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)
    
    try {
      const response = await fetch(webhook.webhook_url, {
        method: 'POST',
        headers,
        body: payloadString,
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      const responseBody = await response.text().catch(() => 'Unable to read response')
      const deliveryStatus = response.ok ? 'delivered' : 'failed'
      const deliveredAt = response.ok ? new Date().toISOString() : null
      
      // Update log entry
      await supabase
        .from('zapier_webhook_logs')
        .update({
          delivery_status: deliveryStatus,
          http_status_code: response.status,
          response_body: responseBody.substring(0, 1000),
          delivered_at: deliveredAt,
          error_message: response.ok ? null : `HTTP ${response.status}: ${response.statusText}`
        })
        .eq('id', logEntry.id)
      
      if (response.ok) {
        // Success - update webhook stats
        await supabase
          .from('zapier_webhooks')
          .update({
            success_count: webhook.success_count + 1,
            last_triggered: new Date().toISOString(),
            last_error: null
          })
          .eq('id', webhookId)
        
        console.log(`Webhook delivered successfully: ${webhookId}`)
      } else {
        // Failed - update failure count and potentially retry
        await supabase
          .from('zapier_webhooks')
          .update({
            failure_count: webhook.failure_count + 1,
            last_error: `HTTP ${response.status}: ${response.statusText}`
          })
          .eq('id', webhookId)
        
        // Schedule retry if attempts remaining
        if (attemptCount < maxAttempts) {
          const delay = getRetryDelay(attemptCount)
          console.log(`Scheduling retry for webhook ${webhookId} in ${delay}ms`)
          
          setTimeout(() => {
            deliverWebhook(webhookId, payload, attemptCount + 1)
          }, delay)
        } else {
          console.log(`Max attempts reached for webhook ${webhookId}`)
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
          error_message: errorMessage
        })
        .eq('id', logEntry.id)
      
      // Update webhook failure count
      await supabase
        .from('zapier_webhooks')
        .update({
          failure_count: webhook.failure_count + 1,
          last_error: errorMessage
        })
        .eq('id', webhookId)
      
      // Schedule retry if attempts remaining
      if (attemptCount < maxAttempts) {
        const delay = getRetryDelay(attemptCount)
        console.log(`Scheduling retry for webhook ${webhookId} in ${delay}ms`)
        
        setTimeout(() => {
          deliverWebhook(webhookId, payload, attemptCount + 1)
        }, delay)
      }
    }
    
  } catch (error) {
    console.error('Webhook delivery system error:', error)
  }
}

// Process trigger event and deliver to all matching webhooks
async function processTriggerEvent(event: TriggerEvent): Promise<void> {
  try {
    console.log('Processing trigger event:', event.trigger_type, 'for user:', event.user_id)
    
    // Find all active webhooks matching this trigger type for the user
    const { data: webhooks, error: webhooksError } = await supabase
      .from('zapier_webhooks')
      .select('id, webhook_url, trigger_type')
      .eq('user_id', event.user_id)
      .eq('trigger_type', event.trigger_type)
      .eq('is_active', true)
    
    if (webhooksError) {
      console.error('Error fetching webhooks:', webhooksError)
      return
    }
    
    if (!webhooks || webhooks.length === 0) {
      console.log('No active webhooks found for trigger:', event.trigger_type)
      return
    }
    
    console.log(`Found ${webhooks.length} webhooks for trigger: ${event.trigger_type}`)
    
    // Prepare webhook payload
    const webhookPayload = {
      trigger_type: event.trigger_type,
      user_id: event.user_id,
      analysis_id: event.analysis_id,
      timestamp: new Date().toISOString(),
      data: event.data
    }
    
    // Deliver to all matching webhooks in parallel (background tasks)
    for (const webhook of webhooks) {
      EdgeRuntime.waitUntil(
        deliverWebhook(webhook.id, webhookPayload)
      )
    }
    
  } catch (error) {
    console.error('Process trigger event error:', error)
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  try {
    console.log('Zapier trigger request:', req.method)
    
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }
    
    // This endpoint is called internally, so we check for service role key
    const authHeader = req.headers.get('Authorization')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!authHeader?.startsWith('Bearer ') || authHeader.split(' ')[1] !== serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }
    
    const triggerEvent: TriggerEvent = await req.json()
    
    // Validate required fields
    if (!triggerEvent.trigger_type || !triggerEvent.user_id || !triggerEvent.data) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: trigger_type, user_id, data' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }
    
    // Process the trigger event asynchronously
    EdgeRuntime.waitUntil(
      processTriggerEvent(triggerEvent)
    )
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Trigger event queued for processing',
        trigger_type: triggerEvent.trigger_type
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
    
  } catch (error) {
    console.error('Zapier trigger function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})