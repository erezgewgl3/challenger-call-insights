import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExternalTranscriptPayload {
  transcript_text?: string;
  transcript_file_url?: string;
  transcript_filename?: string;
  zoho_deal_id?: string;
  zoho_meeting_id?: string;
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
  source?: 'zapier' | 'zoho' | 'api' | 'zoho_meeting';
  callback_webhook?: string;
}

interface ProcessingResponse {
  success: boolean;
  transcript_id?: string;
  assignment_id?: string;
  queue_position?: number;
  error?: string;
  warning?: string;
}

serve(async (req) => {
  console.log('🔗 [INGEST] External transcript ingestion request started');
  
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

    // Parse and validate request body
    const payload: ExternalTranscriptPayload = await req.json();
    
    console.log('🔗 [INGEST] Processing payload for user:', payload.assigned_user_email);

    // Validate required fields
    const validation = validatePayload(payload);
    if (!validation.isValid) {
      console.error('🔗 [ERROR] Validation failed:', validation.errors);
      return new Response(JSON.stringify({
        success: false,
        error: 'Validation failed',
        details: validation.errors
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Download transcript content if file URL provided
    let transcriptText = payload.transcript_text;
    if (payload.transcript_file_url && !transcriptText) {
      try {
        console.log('🔗 [INGEST] Downloading transcript from URL:', payload.transcript_file_url);
        transcriptText = await downloadTranscriptFile(payload.transcript_file_url);
        console.log('🔗 [INGEST] Downloaded transcript, length:', transcriptText.length);
      } catch (error) {
        console.error('🔗 [ERROR] File download failed:', error);
        return new Response(JSON.stringify({
          success: false,
          error: 'Failed to download transcript file',
          details: error instanceof Error ? error.message : 'Unknown error'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Validate transcript content is available
    if (!transcriptText || transcriptText.trim().length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Transcript content is required and cannot be empty'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    const { data: userData, error: userError } = await supabase
      .rpc('lookup_user_by_email', { email_address: payload.assigned_user_email });

    if (userError || !userData) {
      console.error('🔗 [ERROR] User lookup failed:', userError);
      return new Response(JSON.stringify({
        success: false,
        error: `User not found: ${payload.assigned_user_email}`,
        suggestion: 'Please ensure the user has a Sales Whisperer account'
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('🔗 [INGEST] User found:', userData);

    // Get or create account for the user
    let accountId: string | null = null;
    
    if (payload.meeting_metadata?.company_name) {
      // Try to find existing account or create new one
      const { data: existingAccount, error: accountLookupError } = await supabase
        .from('accounts')
        .select('id')
        .eq('user_id', userData)
        .eq('name', payload.meeting_metadata.company_name)
        .single();

      if (existingAccount) {
        accountId = existingAccount.id;
        console.log('🔗 [INGEST] Using existing account:', accountId);
      } else {
        // Create new account
        const { data: newAccount, error: accountCreateError } = await supabase
          .from('accounts')
          .insert({
            user_id: userData,
            name: payload.meeting_metadata.company_name,
            deal_stage: 'discovery',
            notes: `Auto-created from ${payload.source || 'external'} integration`
          })
          .select('id')
          .single();

        if (newAccount) {
          accountId = newAccount.id;
          console.log('🔗 [INGEST] Created new account:', accountId);
        } else {
          console.error('🔗 [WARNING] Account creation failed:', accountCreateError);
        }
      }
    }

    // Prepare transcript data
    const transcriptData = prepareTranscriptData(payload, userData, accountId, transcriptText);
    
    console.log('🔗 [INGEST] Creating transcript with data:', {
      zoho_deal_id: transcriptData.zoho_deal_id,
      external_source: transcriptData.external_source,
      assigned_user_id: transcriptData.assigned_user_id
    });

    // Create transcript record
    const { data: transcript, error: transcriptError } = await supabase
      .from('transcripts')
      .insert(transcriptData)
      .select()
      .single();

    if (transcriptError) {
      console.error('🔗 [ERROR] Transcript creation failed:', transcriptError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to create transcript',
        details: transcriptError.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('🔗 [INGEST] Transcript created:', transcript.id);

    // Create assignment record
    const { data: assignment, error: assignmentError } = await supabase
      .from('queue_assignments')
      .insert({
        transcript_id: transcript.id,
        assigned_to: userData,
        assigned_by: null, // System assignment
        status: 'pending',
        notes: `Auto-assigned from ${payload.source || 'external'} integration`
      })
      .select()
      .single();

    if (assignmentError) {
      console.error('🔗 [ERROR] Assignment creation failed:', assignmentError);
      // Don't fail the whole request for assignment errors
    }

    // Get queue position
    const { data: queueData, error: queueError } = await supabase
      .from('external_transcript_queue')
      .select('queue_position')
      .eq('transcript_id', transcript.id)
      .single();

    const response: ProcessingResponse = {
      success: true,
      transcript_id: transcript.id,
      assignment_id: assignment?.id,
      queue_position: queueData?.queue_position || null,
      warning: assignmentError ? 'Assignment record creation failed' : undefined
    };

    console.log('🔗 [SUCCESS] External transcript ingested successfully');
    
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('🔗 [FATAL] External transcript ingestion failed:', error);
    
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

function validatePayload(payload: ExternalTranscriptPayload): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Either transcript_text or transcript_file_url is required
  if (!payload.transcript_text && !payload.transcript_file_url) {
    errors.push('Either transcript_text or transcript_file_url is required');
  }

  if (!payload.assigned_user_email || !isValidEmail(payload.assigned_user_email)) {
    errors.push('assigned_user_email is required and must be a valid email');
  }

  // Optional field validation
  if (payload.priority && !['urgent', 'high', 'normal', 'low'].includes(payload.priority)) {
    errors.push('priority must be one of: urgent, high, normal, low');
  }

  if (payload.source && !['zapier', 'zoho', 'api', 'zoho_meeting'].includes(payload.source)) {
    errors.push('source must be one of: zapier, zoho, api, zoho_meeting');
  }

  // Transcript length validation
  if (payload.transcript_text && payload.transcript_text.length > 500000) {
    errors.push('transcript_text exceeds maximum length of 500,000 characters');
  }

  // URL validation
  if (payload.transcript_file_url) {
    try {
      new URL(payload.transcript_file_url);
    } catch {
      errors.push('transcript_file_url must be a valid URL');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

async function downloadTranscriptFile(fileUrl: string): Promise<string> {
  const response = await fetch(fileUrl);
  
  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.status} ${response.statusText}`);
  }
  
  const contentType = response.headers.get('content-type') || '';
  const text = await response.text();
  
  // Handle JSON responses that might contain transcript data
  if (contentType.includes('application/json')) {
    try {
      const jsonData = JSON.parse(text);
      // Try to extract transcript from common JSON structures
      if (jsonData.transcript) return jsonData.transcript;
      if (jsonData.text) return jsonData.text;
      if (jsonData.content) return jsonData.content;
      // If it's a direct string, return as-is
      if (typeof jsonData === 'string') return jsonData;
      // Otherwise return the JSON as formatted text
      return JSON.stringify(jsonData, null, 2);
    } catch {
      // If JSON parsing fails, return raw text
      return text;
    }
  }
  
  return text;
}

function prepareTranscriptData(
  payload: ExternalTranscriptPayload,
  userId: string,
  accountId: string | null,
  transcriptText: string
): any {
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
  
  // Normalize source value
  const normalizedSource = payload.source === 'zoho_meeting' ? 'zoho' : (payload.source || 'zapier');
  
  return {
    user_id: userId,
    account_id: accountId,
    assigned_user_id: userId,
    title: metadata.title || `External Transcript - ${new Date().toISOString().split('T')[0]}`,
    participants: participants,
    meeting_date: metadata.meeting_date || new Date().toISOString(),
    duration_minutes: metadata.duration_minutes || null,
    raw_text: transcriptText,
    processing_status: 'pending',
    external_source: normalizedSource,
    priority_level: payload.priority || 'normal',
    zoho_deal_id: payload.zoho_deal_id || payload.zoho_meeting_id || null,
    source_meeting_id: payload.zoho_meeting_id || null,
    assignment_metadata: {
      callback_webhook: payload.callback_webhook,
      company_name: metadata.company_name,
      contact_name: metadata.contact_name,
      deal_name: metadata.deal_name,
      meeting_host: metadata.meeting_host,
      transcript_filename: payload.transcript_filename,
      transcript_file_url: payload.transcript_file_url,
      source_timestamp: new Date().toISOString(),
      auto_assigned: true
    },
    deal_context: {
      company_name: metadata.company_name,
      contact_name: metadata.contact_name,
      deal_name: metadata.deal_name,
      meeting_host: metadata.meeting_host,
      zoho_deal_id: payload.zoho_deal_id || payload.zoho_meeting_id
    },
    source_metadata: {
      external_source: normalizedSource,
      webhook_payload: payload,
      ingestion_timestamp: new Date().toISOString()
    }
  };
}