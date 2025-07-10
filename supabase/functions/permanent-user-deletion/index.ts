import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { userId, userIds } = await req.json()
    
    // Get current user and verify admin role
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: currentUser, error: currentUserError } = await supabaseClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (currentUserError || currentUser?.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Handle single user deletion
    if (userId) {
      await deleteSingleUser(supabaseClient, userId, user.id)
      return new Response(
        JSON.stringify({ success: true, deletedCount: 1 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Handle bulk user deletion
    if (userIds && Array.isArray(userIds)) {
      const deletedCount = await deleteBulkUsers(supabaseClient, userIds, user.id)
      return new Response(
        JSON.stringify({ success: true, deletedCount }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid request: userId or userIds required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Permanent deletion error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function deleteSingleUser(supabaseClient: any, userId: string, adminId: string) {
  console.log(`Starting permanent deletion for user: ${userId}`)
  
  try {
    // Log the deletion attempt
    await supabaseClient
      .from('gdpr_audit_log')
      .insert({
        event_type: 'permanent_deletion_started',
        user_id: userId,
        admin_id: adminId,
        details: { reason: 'Admin initiated permanent deletion' },
        legal_basis: 'GDPR Article 17 - Right to erasure'
      })

    // Simply delete the user - foreign key constraints will handle cascading
    const { error: userError } = await supabaseClient
      .from('users')
      .delete()
      .eq('id', userId)
    
    if (userError) {
      console.error('Error deleting user:', userError)
      throw new Error(`Failed to delete user: ${userError.message}`)
    }

    console.log(`Successfully deleted user: ${userId}`)

    // Log completion
    await supabaseClient
      .from('gdpr_audit_log')
      .insert({
        event_type: 'permanent_deletion_completed',
        user_id: userId,
        admin_id: adminId,
        details: { status: 'success' },
        legal_basis: 'GDPR Article 17 - Right to erasure'
      })

  } catch (error) {
    console.error(`Failed to permanently delete user ${userId}:`, error)
    
    // Log the failure
    await supabaseClient
      .from('gdpr_audit_log')
      .insert({
        event_type: 'permanent_deletion_failed',
        user_id: userId,
        admin_id: adminId,
        details: { error: error.message },
        legal_basis: 'GDPR Article 17 - Right to erasure'
      }).catch(logError => console.error('Failed to log deletion failure:', logError))
    
    throw error
  }
}

async function deleteBulkUsers(supabaseClient: any, userIds: string[], adminId: string): Promise<number> {
  console.log(`Starting bulk permanent deletion for ${userIds.length} users`)
  
  let deletedCount = 0
  
  for (const userId of userIds) {
    try {
      await deleteSingleUser(supabaseClient, userId, adminId)
      deletedCount++
    } catch (error) {
      console.error(`Failed to delete user ${userId}:`, error)
      
      // Log the failure
      await supabaseClient
        .from('gdpr_audit_log')
        .insert({
          event_type: 'permanent_deletion_failed',
          user_id: userId,
          admin_id: adminId,
          details: { error: error.message },
          legal_basis: 'GDPR Article 17 - Right to erasure'
        })
    }
  }

  console.log(`Completed bulk deletion: ${deletedCount}/${userIds.length} users deleted`)
  return deletedCount
}