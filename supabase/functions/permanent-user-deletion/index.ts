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

  try {
    // Step 1: Get all transcripts for the user first
    const { data: transcripts, error: transcriptsError } = await supabaseClient
      .from('transcripts')
      .select('id')
      .eq('user_id', userId)

    if (transcriptsError) {
      console.error('Error fetching transcripts:', transcriptsError)
    }

    const transcriptIds = transcripts?.map(t => t.id) || []
    console.log(`Found ${transcriptIds.length} transcripts to delete`)

    // Step 2: Delete conversation analysis for each transcript
    if (transcriptIds.length > 0) {
      for (const transcriptId of transcriptIds) {
        const { error } = await supabaseClient
          .from('conversation_analysis')
          .delete()
          .eq('transcript_id', transcriptId)
        
        if (error && !error.message.includes('No rows found')) {
          console.error(`Error deleting conversation analysis for transcript ${transcriptId}:`, error)
        }
      }
      console.log('Deleted conversation analysis records')
    }

    // Step 3: Delete transcript progress for each transcript
    if (transcriptIds.length > 0) {
      for (const transcriptId of transcriptIds) {
        const { error } = await supabaseClient
          .from('transcript_progress')
          .delete()
          .eq('transcript_id', transcriptId)
        
        if (error && !error.message.includes('No rows found')) {
          console.error(`Error deleting transcript progress for transcript ${transcriptId}:`, error)
        }
      }
      console.log('Deleted transcript progress records')
    }

    // Step 4: Delete transcripts
    const { error: transcriptDeleteError } = await supabaseClient
      .from('transcripts')
      .delete()
      .eq('user_id', userId)
    
    if (transcriptDeleteError && !transcriptDeleteError.message.includes('No rows found')) {
      console.error('Error deleting transcripts:', transcriptDeleteError)
    } else {
      console.log('Deleted transcripts')
    }

    // Step 5: Delete accounts
    const { error: accountsError } = await supabaseClient
      .from('accounts')
      .delete()
      .eq('user_id', userId)
    
    if (accountsError && !accountsError.message.includes('No rows found')) {
      console.error('Error deleting accounts:', accountsError)
    } else {
      console.log('Deleted accounts')
    }

    // Step 6: Delete user-specific prompts
    const { error: promptsError } = await supabaseClient
      .from('prompts')
      .delete()
      .eq('user_id', userId)
    
    if (promptsError && !promptsError.message.includes('No rows found')) {
      console.error('Error deleting prompts:', promptsError)
    } else {
      console.log('Deleted prompts')
    }

    // Step 7: Delete user consent
    const { error: consentError } = await supabaseClient
      .from('user_consent')
      .delete()
      .eq('user_id', userId)
    
    if (consentError && !consentError.message.includes('No rows found')) {
      console.error('Error deleting user consent:', consentError)
    } else {
      console.log('Deleted user consent')
    }

    // Step 8: Delete data export requests
    const { error: exportError } = await supabaseClient
      .from('data_export_requests')
      .delete()
      .eq('user_id', userId)
    
    if (exportError && !exportError.message.includes('No rows found')) {
      console.error('Error deleting data export requests:', exportError)
    } else {
      console.log('Deleted data export requests')
    }

    // Step 9: Update deletion request to completed
    const { error: deletionRequestError } = await supabaseClient
      .from('deletion_requests')
      .update({ 
        status: 'completed', 
        completed_at: new Date().toISOString() 
      })
      .eq('user_id', userId)
    
    if (deletionRequestError && !deletionRequestError.message.includes('No rows found')) {
      console.error('Error updating deletion request:', deletionRequestError)
    } else {
      console.log('Updated deletion request to completed')
    }

    // Step 10: Finally delete the user
    const { error: userError } = await supabaseClient
      .from('users')
      .delete()
      .eq('id', userId)
    
    if (userError) {
      console.error('Error deleting user:', userError)
      throw userError
    } else {
      console.log('Deleted user')
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
      })
    
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