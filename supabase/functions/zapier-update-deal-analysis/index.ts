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
      analysis_id,
      crm_data,
      deal_stage,
      account_id,
      source_system = 'zapier'
    } = await req.json();

    console.log('Update Deal Analysis request:', { user_id, analysis_id, source_system });

    if (!user_id || !analysis_id || !crm_data) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: user_id, analysis_id, crm_data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate user exists and has access
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

    // Validate analysis exists and belongs to user
    const { data: analysis, error: analysisError } = await supabase
      .from('conversation_analysis')
      .select('id, transcript_id, recommendations, heat_level')
      .eq('id', analysis_id)
      .single();

    if (analysisError || !analysis) {
      return new Response(
        JSON.stringify({ error: 'Analysis not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user owns the transcript/analysis
    const { data: transcript, error: transcriptError } = await supabase
      .from('transcripts')
      .select('user_id')
      .eq('id', analysis.transcript_id)
      .single();

    if (transcriptError || transcript.user_id !== user_id) {
      return new Response(
        JSON.stringify({ error: 'Access denied' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize sync manager
    const syncManager = new BidirectionalSyncManager(user_id);

    // Create sync operation for deal analysis update
    const syncOperation = await syncManager.createSyncOperation({
      sync_type: 'crm_to_sw',
      operation_type: 'analysis_update',
      source_system,
      source_record_id: crm_data.deal_id || account_id,
      target_system: 'sales_whisperer',
      target_record_id: analysis_id,
      sync_data: {
        crm_data,
        deal_stage,
        updated_by: 'zapier_webhook',
        timestamp: new Date().toISOString()
      }
    });

    // Get current analysis data for conflict detection
    const currentData = {
      recommendations: analysis.recommendations || {},
      heat_level: analysis.heat_level,
      updated_at: new Date().toISOString()
    };

    const incomingData = {
      recommendations: {
        ...analysis.recommendations,
        crm_context: crm_data,
        deal_stage_context: deal_stage
      },
      heat_level: crm_data.priority_level || analysis.heat_level,
      updated_at: crm_data.last_modified || new Date().toISOString()
    };

    // Check for conflicts
    const conflict = await syncManager.detectConflicts(
      syncOperation.id,
      currentData,
      incomingData
    );

    if (conflict) {
      console.log('Conflict detected:', conflict.id);
      
      // Try to auto-resolve based on user preferences
      const preferences = await syncManager.getSyncPreferences(source_system);
      
      if (preferences?.auto_resolve_conflicts) {
        const resolvedConflict = await syncManager.resolveConflict(
          conflict.id,
          preferences.preferred_resolution_strategy
        );
        
        console.log('Auto-resolved conflict:', resolvedConflict.id);
      } else {
        // Return conflict for manual resolution
        return new Response(
          JSON.stringify({
            success: false,
            conflict_detected: true,
            conflict_id: conflict.id,
            message: 'Conflict detected - manual resolution required',
            conflict_details: conflict.field_conflicts
          }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Execute the sync operation
    await syncManager.executeSyncOperation(syncOperation.id);

    // Update deal heat history if heat level changed
    if (crm_data.priority_level && crm_data.priority_level !== analysis.heat_level) {
      await supabase
        .from('deal_heat_history')
        .insert({
          user_id,
          account_id: account_id || null,
          analysis_id,
          previous_heat_level: analysis.heat_level,
          current_heat_level: crm_data.priority_level,
          heat_score_change: crm_data.heat_score_change || 0,
          change_reason: `CRM update from ${source_system}`,
          triggered_webhooks: []
        });

      // Check for heat level change triggers
      const { data: triggers, error: triggersError } = await supabase
        .from('advanced_webhook_triggers')
        .select('*')
        .eq('user_id', user_id)
        .eq('trigger_type', 'heat_level_change')
        .eq('is_active', true);

      if (!triggersError && triggers) {
        for (const trigger of triggers) {
          // Check if trigger condition is met
          const condition = trigger.trigger_condition as any;
          const shouldTrigger = this.evaluateHeatLevelTrigger(
            condition,
            analysis.heat_level,
            crm_data.priority_level
          );

          if (shouldTrigger) {
            // Trigger the webhook (implement webhook triggering logic)
            console.log(`Triggering webhook: ${trigger.webhook_url}`);
            
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

    return new Response(
      JSON.stringify({
        success: true,
        sync_operation_id: syncOperation.id,
        updated_analysis_id: analysis_id,
        message: 'Deal analysis updated successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in update-deal-analysis:', error);
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

  // Helper function to evaluate heat level trigger conditions
  function evaluateHeatLevelTrigger(
    condition: any,
    previousLevel: string,
    currentLevel: string
  ): boolean {
    const heatLevels = ['cold', 'warm', 'hot', 'burning'];
    const prevIndex = heatLevels.indexOf(previousLevel);
    const currIndex = heatLevels.indexOf(currentLevel);

    switch (condition.type) {
      case 'increase':
        return currIndex > prevIndex && (currIndex - prevIndex) >= (condition.threshold || 1);
      case 'decrease':
        return currIndex < prevIndex && (prevIndex - currIndex) >= (condition.threshold || 1);
      case 'significant_change':
        return Math.abs(currIndex - prevIndex) >= (condition.threshold || 2);
      default:
        return false;
    }
  }
});