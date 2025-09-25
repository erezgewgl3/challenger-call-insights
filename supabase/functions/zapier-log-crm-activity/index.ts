import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';
import { BidirectionalSyncManager } from '../_shared/bidirectional-sync.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { 
      user_id,
      activity_type,
      activity_data,
      crm_record_id,
      crm_system,
      account_id,
      completed_at,
      task_details
    } = await req.json();

    console.log('Log CRM Activity request:', { user_id, activity_type, crm_system });

    if (!user_id || !activity_type || !activity_data) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: user_id, activity_type, activity_data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', user_id)
      .single();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid user ID' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize sync manager
    const syncManager = new BidirectionalSyncManager(user_id);

    // Create sync operation for CRM activity logging
    const syncOperation = await syncManager.createSyncOperation({
      sync_type: 'crm_to_sw',
      operation_type: 'task_completion',
      source_system: crm_system || 'unknown_crm',
      source_record_id: crm_record_id,
      target_system: 'sales_whisperer',
      target_record_id: account_id,
      sync_data: {
        activity_type,
        activity_data,
        task_details,
        completed_at: completed_at || new Date().toISOString(),
        logged_by: 'zapier_webhook'
      }
    });

    // Execute the sync operation
    await syncManager.executeSyncOperation(syncOperation.id);

    // Log the CRM activity in our integration logs
    const { data: activityLog, error: logError } = await supabase
      .from('crm_integration_logs')
      .insert({
        user_id,
        analysis_id: null, // May not be related to a specific analysis
        crm_type: crm_system || 'unknown',
        operation_type: 'activity_logged',
        crm_record_id,
        status: 'completed'
      })
      .select()
      .single();

    if (logError) {
      console.error('Failed to create activity log:', logError);
    }

    // Check for priority action triggers if this is a high-priority task
    if (activity_data.priority === 'high' || task_details?.priority === 'urgent') {
      const { data: triggers, error: triggersError } = await supabase
        .from('advanced_webhook_triggers')
        .select('*')
        .eq('user_id', user_id)
        .eq('trigger_type', 'priority_actions')
        .eq('is_active', true);

      if (!triggersError && triggers) {
        for (const trigger of triggers) {
          const condition = trigger.trigger_condition as any;
          
          if (this.evaluatePriorityActionTrigger(condition, activity_data, task_details)) {
            console.log(`Triggering priority action webhook: ${trigger.webhook_url}`);
            
            // Update trigger timestamp
            await supabase
              .from('advanced_webhook_triggers')
              .update({
                last_triggered: new Date().toISOString(),
                trigger_count: trigger.trigger_count + 1
              })
              .eq('id', trigger.id);
          }
        }
      }
    }

    // If activity is related to an account, update account notes
    if (account_id && activity_data.description) {
      const { data: account, error: accountError } = await supabase
        .from('accounts')
        .select('notes')
        .eq('id', account_id)
        .eq('user_id', user_id)
        .single();

      if (!accountError && account) {
        const timestamp = new Date().toLocaleString();
        const activityNote = `\n[${timestamp}] CRM Activity (${activity_type}): ${activity_data.description}`;
        
        await supabase
          .from('accounts')
          .update({
            notes: (account.notes || '') + activityNote
          })
          .eq('id', account_id)
          .eq('user_id', user_id);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        sync_operation_id: syncOperation.id,
        activity_log_id: activityLog?.id,
        message: 'CRM activity logged successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in log-crm-activity:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  // Helper function to evaluate priority action trigger conditions
  function evaluatePriorityActionTrigger(
    condition: any,
    activityData: any,
    taskDetails: any
  ): boolean {
    // Check if activity meets priority threshold
    const priorityLevels = ['low', 'medium', 'high', 'urgent'];
    const activityPriority = activityData.priority || taskDetails?.priority || 'medium';
    const requiredPriority = condition.min_priority || 'high';
    
    const activityIndex = priorityLevels.indexOf(activityPriority);
    const requiredIndex = priorityLevels.indexOf(requiredPriority);
    
    if (activityIndex < requiredIndex) return false;

    // Check activity type if specified
    if (condition.activity_types && condition.activity_types.length > 0) {
      return condition.activity_types.includes(activityData.type || activityData.activity_type);
    }

    return true;
  }
});