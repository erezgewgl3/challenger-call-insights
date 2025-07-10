import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function deleteUserCompletely(supabase: any, userId: string) {
  console.log(`Starting complete deletion for user: ${userId}`)
  
  // Delete related data in correct order (child tables first)
  const deletionSteps = [
    { table: 'conversation_analysis', condition: { transcript_id: userId }, via: 'transcripts' },
    { table: 'transcript_progress', condition: { transcript_id: userId }, via: 'transcripts' },
    { table: 'transcripts', condition: { user_id: userId } },
    { table: 'accounts', condition: { user_id: userId } },
    { table: 'user_consent', condition: { user_id: userId } },
    { table: 'data_export_requests', condition: { user_id: userId } },
    { table: 'deletion_requests', condition: { user_id: userId } },
    { table: 'gdpr_audit_log', condition: { user_id: userId } },
    { table: 'prompts', condition: { user_id: userId } },
    { table: 'invites', condition: { created_by: userId } },
    { table: 'users', condition: { id: userId } }
  ]

  const deletionLog = []

  for (const step of deletionSteps) {
    try {
      let query = supabase.from(step.table).delete()
      
      if (step.via === 'transcripts') {
        // For tables linked via transcripts, first get transcript IDs
        const { data: transcripts } = await supabase
          .from('transcripts')
          .select('id')
          .eq('user_id', userId)
        
        if (transcripts && transcripts.length > 0) {
          const transcriptIds = transcripts.map(t => t.id)
          query = query.in('transcript_id', transcriptIds)
        } else {
          continue // No transcripts, skip this step
        }
      } else {
        // Direct user relationship
        const [column, value] = Object.entries(step.condition)[0]
        query = query.eq(column, value)
      }

      const { data, error, count } = await query
      
      if (error) {
        console.error(`Error deleting from ${step.table}:`, error)
        deletionLog.push({ table: step.table, status: 'error', error: error.message })
      } else {
        const deletedCount = count || 0
        console.log(`Deleted ${deletedCount} records from ${step.table}`)
        deletionLog.push({ table: step.table, status: 'success', deletedCount })
      }
    } catch (err) {
      console.error(`Exception deleting from ${step.table}:`, err)
      deletionLog.push({ table: step.table, status: 'exception', error: err.message })
    }
  }

  return deletionLog
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Starting permanent deletion request')
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { userId, userIds } = await req.json()
    console.log('Received request:', { userId, userIds })

    if (userId) {
      // Delete single user with all related data
      const deletionLog = await deleteUserCompletely(supabase, userId)
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          deletedCount: 1, 
          deletionLog,
          message: 'User and all related data deleted successfully'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (userIds && Array.isArray(userIds)) {
      // Delete multiple users with all related data
      const allDeletionLogs = []
      
      for (const uid of userIds) {
        const deletionLog = await deleteUserCompletely(supabase, uid)
        allDeletionLogs.push({ userId: uid, deletionLog })
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          deletedCount: userIds.length, 
          deletionLogs: allDeletionLogs,
          message: 'All users and related data deleted successfully'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Missing userId or userIds' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})