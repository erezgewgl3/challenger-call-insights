import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2'
import { corsHeaders } from '../_shared/cors.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

interface ApiKeyData {
  user_id: string
  key_name: string
  scopes?: string[]
}

interface ValidationResult {
  valid: boolean
  user_id?: string
  api_key_id?: string
  rate_limit_exceeded?: boolean
  expires_at?: string
}

// Generate secure 64-character API key
function generateSecureKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = 'sw_' // Sales Whisperer prefix
  
  for (let i = 0; i < 60; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  
  return result
}

// Hash API key using SHA-256
async function hashApiKey(apiKey: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(apiKey)
  
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// Generate new API key
async function generateApiKey(userData: ApiKeyData): Promise<Response> {
  try {
    console.log('Generating API key for user:', userData.user_id)
    
    // Validate user exists and is authenticated
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('id', userData.user_id)
      .single()
    
    if (userError || !user) {
      console.error('User validation error:', userError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized - invalid user' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }
    
    // Generate secure API key
    const apiKey = generateSecureKey()
    const apiKeyHash = await hashApiKey(apiKey)
    
    // Set default scopes
    const scopes = userData.scopes || ['read:analysis', 'webhook:subscribe']
    
    // Store API key in database
    const { data: keyRecord, error: insertError } = await supabase
      .from('zapier_api_keys')
      .insert({
        user_id: userData.user_id,
        api_key_hash: apiKeyHash,
        key_name: userData.key_name,
        scopes: scopes,
        is_active: true,
        expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days
        rate_limit_per_hour: 1000
      })
      .select()
      .single()
    
    if (insertError) {
      console.error('Database insert error:', insertError)
      return new Response(
        JSON.stringify({ error: 'Failed to create API key' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }
    
    console.log('API key generated successfully:', keyRecord.id)
    
    return new Response(
      JSON.stringify({
        success: true,
        api_key: apiKey, // Only returned once during creation
        key_id: keyRecord.id,
        key_name: keyRecord.key_name,
        scopes: keyRecord.scopes,
        expires_at: keyRecord.expires_at,
        rate_limit_per_hour: keyRecord.rate_limit_per_hour
      }),
      { 
        status: 201, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
    
  } catch (error) {
    console.error('Generate API key error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}

// Validate API key and check rate limits
async function validateApiKey(apiKey: string): Promise<ValidationResult> {
  try {
    if (!apiKey || !apiKey.startsWith('sw_')) {
      return { valid: false }
    }
    
    const apiKeyHash = await hashApiKey(apiKey)
    
    // Get API key record
    const { data: keyRecord, error: keyError } = await supabase
      .from('zapier_api_keys')
      .select('*')
      .eq('api_key_hash', apiKeyHash)
      .eq('is_active', true)
      .single()
    
    if (keyError || !keyRecord) {
      console.log('API key not found or inactive')
      return { valid: false }
    }
    
    // Check expiration
    if (new Date(keyRecord.expires_at) < new Date()) {
      console.log('API key expired')
      return { valid: false }
    }
    
    // Check rate limiting (last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    
    const { count: recentUsage, error: countError } = await supabase
      .from('zapier_webhook_logs')
      .select('*', { count: 'exact', head: true })
      .eq('webhook_id', keyRecord.id)
      .gte('created_at', oneHourAgo)
    
    if (countError) {
      console.error('Rate limit check error:', countError)
      return { valid: false }
    }
    
    if ((recentUsage || 0) >= keyRecord.rate_limit_per_hour) {
      console.log('Rate limit exceeded for API key:', keyRecord.id)
      return { 
        valid: false, 
        rate_limit_exceeded: true 
      }
    }
    
    // Update usage count and last used
    await supabase
      .from('zapier_api_keys')
      .update({
        usage_count: keyRecord.usage_count + 1,
        last_used: new Date().toISOString()
      })
      .eq('id', keyRecord.id)
    
    return {
      valid: true,
      user_id: keyRecord.user_id,
      api_key_id: keyRecord.id,
      expires_at: keyRecord.expires_at
    }
    
  } catch (error) {
    console.error('Validate API key error:', error)
    return { valid: false }
  }
}

// Revoke API key
async function revokeApiKey(apiKey: string, userId: string): Promise<Response> {
  try {
    console.log('Revoking API key for user:', userId)
    
    const apiKeyHash = await hashApiKey(apiKey)
    
    // Update API key to inactive
    const { data: updatedKey, error: updateError } = await supabase
      .from('zapier_api_keys')
      .update({ is_active: false })
      .eq('api_key_hash', apiKeyHash)
      .eq('user_id', userId)
      .select()
      .single()
    
    if (updateError || !updatedKey) {
      console.error('Revoke error:', updateError)
      return new Response(
        JSON.stringify({ error: 'API key not found or already revoked' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }
    
    // Also deactivate any webhooks using this API key
    await supabase
      .from('zapier_webhooks')
      .update({ is_active: false })
      .eq('api_key_id', updatedKey.id)
    
    console.log('API key revoked successfully:', updatedKey.id)
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'API key revoked successfully',
        revoked_at: new Date().toISOString()
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
    
  } catch (error) {
    console.error('Revoke API key error:', error)
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
    const path = url.pathname.split('/').pop()
    
    console.log('Zapier auth request:', req.method, path)
    
    // Extract and validate authorization header
    const authHeader = req.headers.get('Authorization')
    let currentUserId: string | null = null
    
    // For generate endpoint, we need JWT auth
    if (path === 'generate') {
      if (!authHeader?.startsWith('Bearer ')) {
        return new Response(
          JSON.stringify({ error: 'Missing or invalid authorization header' }),
          { 
            status: 401, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }
      
      // Verify JWT token to get user ID
      const token = authHeader.split(' ')[1]
      const { data: { user }, error: authError } = await supabase.auth.getUser(token)
      
      if (authError || !user) {
        return new Response(
          JSON.stringify({ error: 'Invalid authentication token' }),
          { 
            status: 401, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }
      
      currentUserId = user.id
    }
    
    switch (path) {
      case 'generate':
        if (req.method !== 'POST') {
          return new Response(
            JSON.stringify({ error: 'Method not allowed' }),
            { 
              status: 405, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }
        
        const generateBody = await req.json()
        if (!generateBody.key_name) {
          return new Response(
            JSON.stringify({ error: 'key_name is required' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }
        
        return await generateApiKey({
          user_id: currentUserId!,
          key_name: generateBody.key_name,
          scopes: generateBody.scopes
        })
      
      case 'validate':
        if (req.method !== 'POST') {
          return new Response(
            JSON.stringify({ error: 'Method not allowed' }),
            { 
              status: 405, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }
        
        const validateBody = await req.json()
        if (!validateBody.api_key) {
          return new Response(
            JSON.stringify({ error: 'api_key is required' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }
        
        const validation = await validateApiKey(validateBody.api_key)
        
        if (!validation.valid) {
          const status = validation.rate_limit_exceeded ? 429 : 401
          const message = validation.rate_limit_exceeded 
            ? 'Rate limit exceeded' 
            : 'Invalid or expired API key'
          
          return new Response(
            JSON.stringify({ error: message, valid: false }),
            { 
              status, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }
        
        return new Response(
          JSON.stringify({
            valid: true,
            user_id: validation.user_id,
            api_key_id: validation.api_key_id,
            expires_at: validation.expires_at
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      
      case 'revoke':
        if (req.method !== 'DELETE') {
          return new Response(
            JSON.stringify({ error: 'Method not allowed' }),
            { 
              status: 405, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }
        
        // For revoke, we accept either JWT auth or API key auth
        let revokeUserId: string
        const revokeBody = await req.json()
        
        if (authHeader?.startsWith('Bearer ')) {
          const token = authHeader.split(' ')[1]
          const { data: { user }, error: authError } = await supabase.auth.getUser(token)
          
          if (authError || !user) {
            return new Response(
              JSON.stringify({ error: 'Invalid authentication' }),
              { 
                status: 401, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
              }
            )
          }
          
          revokeUserId = user.id
        } else {
          return new Response(
            JSON.stringify({ error: 'Authorization required' }),
            { 
              status: 401, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }
        
        if (!revokeBody.api_key) {
          return new Response(
            JSON.stringify({ error: 'api_key is required' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }
        
        return await revokeApiKey(revokeBody.api_key, revokeUserId)
      
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
    console.error('Zapier auth function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})