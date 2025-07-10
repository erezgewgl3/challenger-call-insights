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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { userId, userIds, adminId } = await req.json()
    
    // Validate admin permission
    const { data: adminUser, error: adminError } = await supabaseClient
      .from('users')
      .select('role')
      .eq('id', adminId)
      .single()

    if (adminError || adminUser?.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Handle single user deletion
    if (userId) {
      await deleteSingleUser(supabaseClient, userId, adminId)
      return new Response(
        JSON.stringify({ success: true, deletedCount: 1 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Handle bulk user deletion
    if (userIds && Array.isArray(userIds)) {
      const deletedCount = await deleteBulkUsers(supabaseClient, userIds, adminId)
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
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function deleteSingleUser(supabaseClient: any, userId: string, adminId: string) {
  console.log(`Starting permanent deletion for user: ${userId}`)
  
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

  // Delete in proper order to handle foreign key constraints
  const deletionSteps = [
    // 1. Delete conversation analysis (references transcripts)
    { table: 'conversation_analysis', condition: 'transcript_id IN (SELECT id FROM transcripts WHERE user_id = $1)' },
    
    // 2. Delete transcript progress (references transcripts)
    { table: 'transcript_progress', condition: 'transcript_id IN (SELECT id FROM transcripts WHERE user_id = $1)' },
    
    // 3. Delete transcripts
    { table: 'transcripts', condition: 'user_id = $1' },
    
    // 4. Delete accounts
    { table: 'accounts', condition: 'user_id = $1' },
    
    // 5. Delete user-specific prompts
    { table: 'prompts', condition: 'user_id = $1' },
    
    // 6. Delete user consent
    { table: 'user_consent', condition: 'user_id = $1' },
    
    // 7. Delete data export requests
    { table: 'data_export_requests', condition: 'user_id = $1' },
    
    // 8. Update deletion request to completed
    { table: 'deletion_requests', condition: 'user_id = $1', action: 'update' },
    
    // 9. Finally delete the user
    { table: 'users', condition: 'id = $1' }
  ]

  for (const step of deletionSteps) {
    try {
      if (step.action === 'update') {
        const { error } = await supabaseClient
          .from(step.table)
          .update({ 
            status: 'completed', 
            completed_at: new Date().toISOString() 
          })
          .eq('user_id', userId)
        
        if (error) {
          console.error(`Error updating ${step.table}:`, error)
        } else {
          console.log(`Updated ${step.table} for user ${userId}`)
        }
      } else {
        const { error } = await supabaseClient
          .from(step.table)
          .delete()
          .eq(step.table === 'users' ? 'id' : 'user_id', userId)
        
        if (error && !error.message.includes('No rows found')) {
          console.error(`Error deleting from ${step.table}:`, error)
        } else {
          console.log(`Deleted from ${step.table} for user ${userId}`)
        }
      }
    } catch (error) {
      console.error(`Failed to process ${step.table}:`, error)
    }
  }

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

  console.log(`Completed permanent deletion for user: ${userId}`)
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