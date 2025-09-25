import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AssignmentAction {
  action: 'accept' | 'reject' | 'bulk_accept' | 'bulk_reject';
  transcript_id?: string;
  transcript_ids?: string[];
  reason?: string;
}

serve(async (req) => {
  console.log('📋 [ASSIGNMENT] Assignment action request started');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({
      success: false,
      error: 'Method not allowed. Use POST.'
    }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user from auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing authorization header'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid authorization'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const actionData: AssignmentAction = await req.json();
    console.log('📋 [ASSIGNMENT] Processing action:', actionData.action);

    let result;

    if (actionData.action.startsWith('bulk_')) {
      // Handle bulk operations
      if (!actionData.transcript_ids || actionData.transcript_ids.length === 0) {
        return new Response(JSON.stringify({
          success: false,
          error: 'transcript_ids required for bulk operations'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      result = await processBulkAction(
        supabase,
        user.id,
        actionData.action,
        actionData.transcript_ids,
        actionData.reason
      );
    } else {
      // Handle single operations
      if (!actionData.transcript_id) {
        return new Response(JSON.stringify({
          success: false,
          error: 'transcript_id required for single operations'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      result = await processSingleAction(
        supabase,
        user.id,
        actionData.action,
        actionData.transcript_id,
        actionData.reason
      );
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('📋 [FATAL] Assignment action failed:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function processSingleAction(
  supabase: any,
  userId: string,
  action: string,
  transcriptId: string,
  reason?: string
) {
  try {
    const newStatus = action.includes('accept') ? 'accepted' : 'rejected';
    const timestamp = new Date().toISOString();

    // Update assignment status
    const { error: assignmentError } = await supabase
      .from('queue_assignments')
      .update({
        status: newStatus,
        [newStatus === 'accepted' ? 'accepted_at' : 'rejected_at']: timestamp,
        notes: reason || null
      })
      .eq('transcript_id', transcriptId)
      .eq('assigned_to', userId);

    if (assignmentError) {
      return { success: false, error: assignmentError.message };
    }

    // If rejected, unassign the transcript
    if (newStatus === 'rejected') {
      await supabase
        .from('transcripts')
        .update({ assigned_user_id: null })
        .eq('id', transcriptId);
    }

    console.log(`📋 [ASSIGNMENT] ${newStatus} transcript ${transcriptId} for user ${userId}`);

    return { success: true, status: newStatus };

  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

async function processBulkAction(
  supabase: any,
  userId: string,
  action: string,
  transcriptIds: string[],
  reason?: string
) {
  try {
    const newStatus = action.includes('accept') ? 'accepted' : 'rejected';
    const timestamp = new Date().toISOString();
    
    const results = [];

    for (const transcriptId of transcriptIds) {
      const result = await processSingleAction(supabase, userId, action.replace('bulk_', ''), transcriptId, reason);
      results.push({
        transcript_id: transcriptId,
        ...result
      });
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    console.log(`📋 [BULK] Processed ${results.length} assignments: ${successCount} success, ${failureCount} failed`);

    return {
      success: failureCount === 0,
      bulk_results: results,
      summary: {
        total: results.length,
        successful: successCount,
        failed: failureCount
      }
    };

  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}