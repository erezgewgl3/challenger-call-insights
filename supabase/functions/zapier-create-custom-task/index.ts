import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
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
      task_title,
      task_description,
      task_priority = 'medium',
      due_date,
      crm_trigger_event,
      account_id,
      analysis_id,
      assignee,
      task_type = 'follow_up',
      context_data
    } = await req.json();

    console.log('Create Custom Task request:', { user_id, task_title, task_type });

    if (!user_id || !task_title) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: user_id, task_title' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, role, email')
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

    // Generate task ID and prepare task data
    const taskId = crypto.randomUUID();
    const taskData = {
      id: taskId,
      title: task_title,
      description: task_description,
      priority: task_priority,
      type: task_type,
      status: 'pending',
      due_date: due_date ? new Date(due_date).toISOString() : null,
      created_from: 'zapier_webhook',
      assignee: assignee || user.email,
      context_data: context_data || {},
      crm_trigger_event,
      created_at: new Date().toISOString()
    };

    // Create sync operation for task creation
    const syncOperation = await syncManager.createSyncOperation({
      sync_type: 'crm_to_sw',
      operation_type: 'task_creation',
      source_system: crm_trigger_event?.source || 'zapier',
      source_record_id: crm_trigger_event?.record_id,
      target_system: 'sales_whisperer',
      target_record_id: taskId,
      sync_data: {
        task_data: taskData,
        account_id,
        analysis_id,
        created_by: 'zapier_automation'
      }
    });

    // Execute the sync operation
    await syncManager.executeSyncOperation(syncOperation.id);

    // If task is related to an account, update account with task reference
    if (account_id) {
      const { data: account, error: accountError } = await supabase
        .from('accounts')
        .select('notes')
        .eq('id', account_id)
        .eq('user_id', user_id)
        .single();

      if (!accountError && account) {
        const timestamp = new Date().toLocaleString();
        const taskNote = `\n[${timestamp}] Task Created: ${task_title} (Priority: ${task_priority})`;
        
        await supabase
          .from('accounts')
          .update({
            notes: (account.notes || '') + taskNote
          })
          .eq('id', account_id)
          .eq('user_id', user_id);
      }
    }

    // If task is related to an analysis, update analysis recommendations
    if (analysis_id) {
      const { data: analysis, error: analysisError } = await supabase
        .from('conversation_analysis')
        .select('action_plan')
        .eq('id', analysis_id)
        .single();

      if (!analysisError && analysis) {
        const currentActionPlan = analysis.action_plan || {};
        const updatedActionPlan = {
          ...currentActionPlan,
          generated_tasks: [
            ...(currentActionPlan.generated_tasks || []),
            {
              id: taskId,
              title: task_title,
              priority: task_priority,
              created_at: new Date().toISOString(),
              source: 'zapier_automation'
            }
          ]
        };

        await supabase
          .from('conversation_analysis')
          .update({ action_plan: updatedActionPlan })
          .eq('id', analysis_id);
      }
    }

    // Check for priority action triggers if this is a high-priority task
    if (task_priority === 'high' || task_priority === 'urgent') {
      const { data: triggers, error: triggersError } = await supabase
        .from('advanced_webhook_triggers')
        .select('*')
        .eq('user_id', user_id)
        .eq('trigger_type', 'priority_actions')
        .eq('is_active', true);

      if (!triggersError && triggers) {
        for (const trigger of triggers) {
          const condition = trigger.trigger_condition as any;
          
          if (this.evaluateTaskPriorityTrigger(condition, taskData)) {
            console.log(`Triggering priority task webhook: ${trigger.webhook_url}`);
            
            try {
              // Trigger the webhook
              await fetch(trigger.webhook_url, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  event: 'high_priority_task_created',
                  task: taskData,
                  user_id,
                  account_id,
                  analysis_id,
                  timestamp: new Date().toISOString()
                })
              });

              // Update trigger timestamp
              await supabase
                .from('advanced_webhook_triggers')
                .update({
                  last_triggered: new Date().toISOString(),
                  trigger_count: trigger.trigger_count + 1
                })
                .eq('id', trigger.id);
            } catch (webhookError) {
              console.error('Failed to trigger webhook:', webhookError);
            }
          }
        }
      }
    }

    // Generate suggested follow-up actions based on task type
    const followUpSuggestions = this.generateFollowUpSuggestions(
      task_type,
      taskData,
      context_data
    );

    return new Response(
      JSON.stringify({
        success: true,
        task_id: taskId,
        sync_operation_id: syncOperation.id,
        task_data: taskData,
        follow_up_suggestions: followUpSuggestions,
        message: 'Custom task created successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in create-custom-task:', error);
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

  // Helper function to evaluate task priority trigger conditions
  function evaluateTaskPriorityTrigger(condition: any, taskData: any): boolean {
    const priorityLevels = ['low', 'medium', 'high', 'urgent'];
    const taskPriority = taskData.priority;
    const requiredPriority = condition.min_priority || 'high';
    
    const taskIndex = priorityLevels.indexOf(taskPriority);
    const requiredIndex = priorityLevels.indexOf(requiredPriority);
    
    if (taskIndex < requiredIndex) return false;

    // Check task type if specified
    if (condition.task_types && condition.task_types.length > 0) {
      return condition.task_types.includes(taskData.type);
    }

    return true;
  }

  // Helper function to generate follow-up suggestions
  function generateFollowUpSuggestions(
    taskType: string,
    taskData: any,
    contextData: any
  ) {
    const suggestions = [];

    switch (taskType) {
      case 'follow_up':
        suggestions.push({
          action: 'schedule_call',
          description: 'Schedule a follow-up call to discuss progress',
          priority: 'medium',
          estimated_duration: '30 minutes'
        });
        break;

      case 'demo':
        suggestions.push({
          action: 'prepare_demo',
          description: 'Prepare customized demo based on prospect needs',
          priority: 'high',
          estimated_duration: '2 hours'
        });
        suggestions.push({
          action: 'send_calendar_invite',
          description: 'Send calendar invite with demo agenda',
          priority: 'medium',
          estimated_duration: '15 minutes'
        });
        break;

      case 'proposal':
        suggestions.push({
          action: 'gather_requirements',
          description: 'Collect detailed requirements for proposal',
          priority: 'high',
          estimated_duration: '1 hour'
        });
        suggestions.push({
          action: 'create_proposal',
          description: 'Draft customized proposal document',
          priority: 'high',
          estimated_duration: '3 hours'
        });
        break;

      case 'research':
        suggestions.push({
          action: 'competitive_analysis',
          description: 'Research competitor solutions and positioning',
          priority: 'medium',
          estimated_duration: '1 hour'
        });
        break;

      default:
        suggestions.push({
          action: 'plan_next_steps',
          description: 'Define clear next steps and timeline',
          priority: 'medium',
          estimated_duration: '30 minutes'
        });
    }

    // Add context-specific suggestions
    if (contextData?.deal_stage === 'negotiation') {
      suggestions.push({
        action: 'review_contract',
        description: 'Review contract terms and prepare for negotiation',
        priority: 'high',
        estimated_duration: '2 hours'
      });
    }

    if (contextData?.competitor_mentioned) {
      suggestions.push({
        action: 'competitive_positioning',
        description: 'Prepare competitive positioning materials',
        priority: 'high',
        estimated_duration: '1 hour'
      });
    }

    return suggestions;
  }
});