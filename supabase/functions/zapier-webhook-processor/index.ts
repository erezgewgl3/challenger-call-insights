import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';
import UnifiedTranscriptProcessor from '../_shared/transcript-processor.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ZapierWebhookPayload {
  transcript_text?: string;
  transcript_file_url?: string;
  transcript_filename?: string;
  assigned_user_email: string;
  meeting_metadata?: {
    title?: string;
    meeting_host?: string;
    participants?: string[] | string;
    meeting_date?: string;
    duration_minutes?: number;
    company_name?: string;
    contact_name?: string;
    deal_name?: string;
  };
  priority?: 'urgent' | 'high' | 'normal' | 'low';
  source?: 'zapier' | 'zoho' | 'api';
  callback_webhook?: string;
  zoho_deal_id?: string;
  zoho_meeting_id?: string;
}

serve(async (req) => {
  console.log('🔗 [ZAPIER] Webhook processor started');
  
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

    // Read body once (needed for both signature validation and processing)
    const rawBody = await req.text();
    
    // Verify webhook signature if secret is configured
    const webhookSecret = Deno.env.get('ZAPIER_WEBHOOK_SECRET');
    if (webhookSecret) {
      const signature = req.headers.get('x-zapier-signature');
      
      if (!signature) {
        console.error('Missing webhook signature');
        return new Response(JSON.stringify({
          success: false,
          error: 'Unauthorized - Missing signature'
        }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      // Dynamically import validation function
      const { validateWebhookSignature } = await import('../_shared/webhook-validation.ts');
      const isValid = await validateWebhookSignature(rawBody, signature, webhookSecret);
      
      if (!isValid) {
        console.error('Invalid webhook signature');
        return new Response(JSON.stringify({
          success: false,
          error: 'Unauthorized - Invalid signature'
        }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      console.log('Webhook signature validated successfully');
    } else {
      console.warn('ZAPIER_WEBHOOK_SECRET not configured - skipping signature validation');
    }

    const processor = new UnifiedTranscriptProcessor();
    const payload: ZapierWebhookPayload = JSON.parse(rawBody);
    
    console.log('🔗 [ZAPIER] Processing webhook for user:', payload.assigned_user_email);

    // Find Zapier connection for this user
    const { data: userData, error: userError } = await supabase
      .rpc('lookup_user_by_email', { email_address: payload.assigned_user_email });

    if (userError || !userData) {
      console.error('🔗 [ERROR] User lookup failed:', userError);
      return new Response(JSON.stringify({
        success: false,
        error: `User not found: ${payload.assigned_user_email}`
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Find the user's Zapier integration connection
    const { data: connections, error: connectionError } = await supabase
      .from('integration_connections')
      .select('*')
      .eq('user_id', userData)
      .eq('integration_type', 'zapier')
      .eq('connection_status', 'active')
      .limit(1);

    if (connectionError || !connections?.length) {
      console.error('🔗 [ERROR] No active Zapier connection found for user:', userData);
      return new Response(JSON.stringify({
        success: false,
        error: 'No active Zapier integration found for user'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const connection = connections[0];
    console.log('🔗 [ZAPIER] Using connection:', connection.id);

    // Log the webhook event
    const { error: logError } = await supabase.rpc('integration_framework_log_webhook', {
      connection_id: connection.id,
      webhook_event: 'transcript.submitted',
      payload: payload,
      headers: Object.fromEntries(req.headers.entries())
    });

    if (logError) {
      console.error('🔗 [WARNING] Webhook logging failed:', logError);
    }

    // Get transcript content
    let transcriptText = payload.transcript_text;
    if (payload.transcript_file_url && !transcriptText) {
      console.log('🔗 [ZAPIER] Downloading transcript from URL');
      transcriptText = await processor.downloadTranscript(payload.transcript_file_url);
      
      if (!transcriptText) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Failed to download transcript file'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Validate transcript content (critical security check)
    const validation = processor.validateTranscriptContent(transcriptText || '');
    if (!validation.valid) {
      console.error('🔗 [ERROR] Transcript validation failed:', validation.error);
      
      // Log the validation failure for debugging
      await supabase.rpc('integration_framework_log_webhook', {
        connection_id: connection.id,
        webhook_event: 'transcript.validation_failed',
        payload: {
          error: validation.error,
          content_preview: transcriptText?.substring(0, 500)
        },
        headers: Object.fromEntries(req.headers.entries())
      });
      
      return new Response(JSON.stringify({
        success: false,
        error: validation.error,
        hint: validation.error.includes('HTML') || validation.error.includes('login') 
          ? 'Authentication credentials may be expired or invalid. Please verify your integration settings.'
          : 'Please verify the transcript content format.'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Prepare transcript data for unified processing
    const metadata = payload.meeting_metadata || {};
    
    // Handle participants - normalize to array
    let participants: string[] = [];
    if (metadata.participants) {
      if (Array.isArray(metadata.participants)) {
        participants = metadata.participants;
      } else if (typeof metadata.participants === 'string') {
        participants = metadata.participants.split(',').map(p => p.trim());
      }
    }

    // If no participants provided, try to extract from transcript
    if (participants.length === 0) {
      participants = processor.extractParticipants(transcriptText!);
    }

    const transcriptData = {
      user_id: userData,
      title: metadata.title || `Zapier Transcript - ${new Date().toISOString().split('T')[0]}`,
      meeting_date: metadata.meeting_date || new Date().toISOString(),
      duration_minutes: metadata.duration_minutes,
      participants: participants,
      raw_text: transcriptText!,
      external_source: 'zapier',
      source_meeting_id: payload.zoho_meeting_id,
      deal_context: {
        company_name: metadata.company_name,
        contact_name: metadata.contact_name,
        deal_name: metadata.deal_name,
        meeting_host: metadata.meeting_host,
        zoho_deal_id: payload.zoho_deal_id
      },
      source_metadata: {
        external_source: 'zapier',
        webhook_payload: payload,
        ingestion_timestamp: new Date().toISOString()
      },
      assignment_metadata: {
        callback_webhook: payload.callback_webhook,
        transcript_filename: payload.transcript_filename,
        transcript_file_url: payload.transcript_file_url,
        priority: payload.priority || 'normal',
        auto_assigned: false // Zapier creates owned transcripts
      }
    };

    // Process transcript using unified processor
    const result = await processor.createTranscript(transcriptData);

    if (!result.success) {
      return new Response(JSON.stringify({
        success: false,
        error: result.error
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Update connection last sync time
    await supabase.rpc('integration_framework_update_connection', {
      connection_id: connection.id,
      updates: {
        last_sync_at: new Date().toISOString()
      }
    });

    console.log('🔗 [SUCCESS] Zapier webhook processed successfully');
    
    return new Response(JSON.stringify({
      success: true,
      transcript_id: result.transcript_id,
      analysis_triggered: result.analysis_triggered
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('🔗 [FATAL] Zapier webhook processing failed:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});