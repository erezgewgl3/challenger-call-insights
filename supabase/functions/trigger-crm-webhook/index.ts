import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';
import { corsHeaders } from '../_shared/cors.ts';

// Trigger this function when analysis completes
serve(async (req) => {
  console.log('🔗 [CRM-TRIGGER] Processing analysis completion webhook trigger');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { transcript_id } = await req.json();

    if (!transcript_id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing transcript_id parameter'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('🔗 [CRM-TRIGGER] Processing transcript:', transcript_id);

    // Get transcript with analysis results
    const { data: transcript, error } = await supabase
      .from('transcripts')
      .select(`
        id,
        title,
        zoho_deal_id,
        assignment_metadata,
        deal_context,
        processing_status,
        conversation_analysis (
          id,
          challenger_scores,
          guidance,
          email_followup,
          heat_level,
          action_plan,
          key_takeaways
        )
      `)
      .eq('id', transcript_id)
      .single();

    if (error || !transcript) {
      console.error('🔗 [ERROR] Transcript not found:', error);
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Transcript not found' 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Only trigger webhook for external transcripts with CRM deal ID
    if (!transcript.zoho_deal_id) {
      console.log('🔗 [SKIP] No Zoho deal ID - webhook not triggered');
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No Zoho deal ID - webhook not triggered' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if analysis is complete
    if (transcript.processing_status !== 'completed' || !transcript.conversation_analysis) {
      console.log('🔗 [SKIP] Analysis not completed yet');
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Analysis not completed yet - webhook will trigger later' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const callbackWebhook = transcript.assignment_metadata?.callback_webhook;
    if (!callbackWebhook) {
      console.log('🔗 [SKIP] No callback webhook configured');
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No callback webhook configured' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Prepare analysis results for webhook delivery
    const analysisResults = {
      id: transcript.conversation_analysis.id,
      challenger_scores: transcript.conversation_analysis.challenger_scores,
      guidance: transcript.conversation_analysis.guidance,
      email_followup: transcript.conversation_analysis.email_followup,
      heat_level: transcript.conversation_analysis.heat_level,
      action_plan: transcript.conversation_analysis.action_plan,
      key_takeaways: transcript.conversation_analysis.key_takeaways
    };

    console.log('🔗 [CRM-TRIGGER] Triggering bidirectional webhook delivery');

    // Trigger bidirectional webhook via zapier-data function
    const webhookResponse = await supabase.functions.invoke('zapier-data', {
      body: {
        transcript_id: transcript.id,
        zoho_deal_id: transcript.zoho_deal_id,
        analysis_results: analysisResults,
        deal_context: transcript.deal_context,
        callback_webhook: callbackWebhook,
        crm_format: transcript.assignment_metadata?.crm_format || 'zoho'
      }
    });

    if (webhookResponse.error) {
      console.error('🔗 [ERROR] Webhook delivery failed:', webhookResponse.error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Webhook delivery failed',
        details: webhookResponse.error
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('🔗 [SUCCESS] CRM webhook triggered successfully');

    return new Response(JSON.stringify({
      success: true,
      message: 'CRM webhook triggered successfully',
      transcript_id: transcript.id,
      zoho_deal_id: transcript.zoho_deal_id,
      webhook_delivery: webhookResponse.data
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('🔗 [FATAL] CRM webhook trigger failed:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});