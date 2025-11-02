import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema for Zoom webhook payloads
const ZoomWebhookPayloadSchema = z.object({
  event: z.string().max(100),
  payload: z.object({
    account_id: z.string().max(100),
    object: z.object({
      uuid: z.string().max(100),
      id: z.number(),
      host_id: z.string().max(100),
      topic: z.string().max(200),
      type: z.number(),
      start_time: z.string(),
      duration: z.number().min(0).max(10000),
      timezone: z.string().max(50),
      recording_files: z.array(z.object({
        id: z.string().max(100),
        meeting_id: z.string().max(100),
        recording_start: z.string(),
        recording_end: z.string(),
        file_type: z.string().max(50),
        file_extension: z.string().max(10),
        file_size: z.number(),
        play_url: z.string().max(500),
        download_url: z.string().max(500),
        status: z.string().max(50),
      })).optional(),
    }),
  }),
  event_ts: z.number(),
}).passthrough(); // Allow additional fields but validate required ones

interface ZoomWebhookPayload {
  event: string;
  payload: {
    account_id: string;
    object: {
      uuid: string;
      id: number;
      host_id: string;
      topic: string;
      type: number;
      start_time: string;
      duration: number;
      timezone: string;
      recording_files?: Array<{
        id: string;
        meeting_id: string;
        recording_start: string;
        recording_end: string;
        file_type: string;
        file_extension: string;
        file_size: number;
        play_url: string;
        download_url: string;
        status: string;
      }>;
    };
  };
  event_ts: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get webhook payload
    const rawBody = await req.text();
    let payload: ZoomWebhookPayload;
    
    try {
      const parsedPayload = JSON.parse(rawBody);
      payload = ZoomWebhookPayloadSchema.parse(parsedPayload);
      console.log('Received validated Zoom webhook:', payload.event);
    } catch (validationError) {
      console.error('[Zoom Webhook] Validation error:', validationError);
      return new Response(
        JSON.stringify({ error: 'Invalid webhook payload', error_code: 'ERR_WEBHOOK_001' }), 
        { status: 400, headers: corsHeaders }
      );
    }

    // Verify webhook signature
    const webhookSecret = Deno.env.get('ZOOM_WEBHOOK_SECRET');
    if (webhookSecret) {
      const signature = req.headers.get('x-zm-signature');
      if (!signature) {
        console.error('Missing webhook signature');
        return new Response('Unauthorized - Missing signature', { 
          status: 401, 
          headers: corsHeaders 
        });
      }
      
      // Dynamically import validation function
      const { validateWebhookSignature } = await import('../_shared/webhook-validation.ts');
      const isValid = await validateWebhookSignature(rawBody, signature, webhookSecret);
      
      if (!isValid) {
        console.error('Invalid webhook signature');
        return new Response('Unauthorized - Invalid signature', { 
          status: 401, 
          headers: corsHeaders 
        });
      }
      
      console.log('Webhook signature validated successfully');
    } else {
      console.warn('ZOOM_WEBHOOK_SECRET not configured - skipping signature validation');
    }

    // Find the Zoom connection for this account
    const { data: connections, error: connectionError } = await supabase
      .from('integration_connections')
      .select('*')
      .eq('integration_type', 'zoom')
      .eq('connection_status', 'active');

    if (connectionError) {
      console.error('[Zoom Webhook] Database error:', connectionError);
      return new Response(
        JSON.stringify({ error: 'Service unavailable', error_code: 'ERR_WEBHOOK_002' }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Find matching connection by account ID
    const connection = connections?.find(conn => {
      const credentials = conn.credentials as any;
      return credentials?.account_id === payload.payload.account_id;
    });

    if (!connection) {
      console.log('No active Zoom connection found for account:', payload.payload.account_id);
      return new Response('No active connection found', { 
        status: 200, 
        headers: corsHeaders 
      });
    }

    // Log the webhook event
    const { error: logError } = await supabase.rpc('integration_framework_log_webhook', {
      connection_id: connection.id,
      webhook_event: payload.event,
      payload: payload,
      headers: Object.fromEntries(req.headers.entries())
    });

    if (logError) {
      console.error('Error logging webhook:', logError);
    }

    // Process different webhook events
    switch (payload.event) {
      case 'recording.transcript_completed':
        await processTranscriptCompleted(supabase, connection, payload);
        break;
      case 'recording.completed':
        await processRecordingCompleted(supabase, connection, payload);
        break;
      case 'meeting.ended':
        await processMeetingEnded(supabase, connection, payload);
        break;
      default:
        console.log('Unhandled webhook event:', payload.event);
    }

    return new Response('OK', { 
      status: 200, 
      headers: corsHeaders 
    });

  } catch (error) {
    console.error('[Zoom Webhook] Processing error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process webhook', error_code: 'ERR_WEBHOOK_003' }), 
      { status: 500, headers: corsHeaders }
    );
  }
});

async function processTranscriptCompleted(
  supabase: any, 
  connection: any, 
  payload: ZoomWebhookPayload
) {
  console.log('Processing transcript completed for meeting:', payload.payload.object.uuid);
  
  try {
    // Find transcript file
    const transcriptFile = payload.payload.object.recording_files?.find(
      file => file.file_type === 'TRANSCRIPT'
    );

    if (!transcriptFile) {
      console.log('No transcript file found in recording');
      return;
    }

    // Check user settings to see if auto-processing is enabled
    const config = connection.configuration as any;
    if (!config?.auto_transcript_processing) {
      console.log('Auto-processing disabled for this connection');
      return;
    }

    // Check minimum duration
    const minDuration = config?.analysis_settings?.min_duration_minutes || 5;
    if (payload.payload.object.duration < minDuration) {
      console.log(`Meeting too short (${payload.payload.object.duration}min < ${minDuration}min)`);
      return;
    }

    // Download transcript content
    const transcriptContent = await downloadTranscript(transcriptFile.download_url, connection);
    
    if (!transcriptContent) {
      console.error('Failed to download transcript');
      return;
    }

    // Create transcript record
    const { data: transcript, error: transcriptError } = await supabase
      .from('transcripts')
      .insert({
        user_id: connection.user_id,
        title: payload.payload.object.topic,
        meeting_date: payload.payload.object.start_time,
        duration_minutes: payload.payload.object.duration,
        participants: JSON.stringify([]), // Zoom doesn't provide participant list in webhook
        raw_text: transcriptContent,
        status: 'uploaded'
      })
      .select()
      .single();

    if (transcriptError) {
      console.error('Error creating transcript:', transcriptError);
      return;
    }

    console.log('Created transcript record:', transcript.id);

    // Trigger AI analysis
    const { error: analysisError } = await supabase.functions.invoke('analyze-transcript', {
      body: {
        transcript_id: transcript.id,
        meeting_metadata: {
          zoom_meeting_id: payload.payload.object.uuid,
          host_id: payload.payload.object.host_id,
          integration: 'zoom'
        }
      }
    });

    if (analysisError) {
      console.error('Error triggering analysis:', analysisError);
    } else {
      console.log('Successfully triggered transcript analysis');
    }

  } catch (error) {
    console.error('Error in processTranscriptCompleted:', error);
  }
}

async function processRecordingCompleted(
  supabase: any, 
  connection: any, 
  payload: ZoomWebhookPayload
) {
  console.log('Processing recording completed for meeting:', payload.payload.object.uuid);
  
  // Update connection last sync time
  await supabase.rpc('integration_framework_update_connection', {
    connection_id: connection.id,
    updates: {
      last_sync_at: new Date().toISOString()
    }
  });
}

async function processMeetingEnded(
  supabase: any, 
  connection: any, 
  payload: ZoomWebhookPayload
) {
  console.log('Processing meeting ended for meeting:', payload.payload.object.uuid);
  
  // Check if user wants to be notified about meeting end
  const config = connection.configuration as any;
  if (config?.webhook_events?.meeting_ended) {
    // Send notification (implement notification logic here)
    console.log('Would send meeting ended notification');
  }
}

async function downloadTranscript(downloadUrl: string, connection: any): Promise<string | null> {
  try {
    const credentials = connection.credentials as any;
    const accessToken = credentials.access_token;

    const response = await fetch(downloadUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      console.error('Failed to download transcript:', response.status, response.statusText);
      return null;
    }

    const transcriptText = await response.text();
    return transcriptText;
  } catch (error) {
    console.error('Error downloading transcript:', error);
    return null;
  }
}