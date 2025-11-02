import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

// Comprehensive validation schemas with security constraints
const MeetingMetadataSchema = z.object({
  title: z.string().max(200, 'Title exceeds 200 characters').trim(),
  participants: z.array(z.string().max(100)).max(50, 'Too many participants'),
  company_name: z.string().max(100, 'Company name exceeds 100 characters').trim().optional(),
  deal_stage: z.string().max(50).trim().optional(),
  notes: z.string().max(1000, 'Notes exceed 1000 characters').trim().optional(),
  tags: z.array(z.string().max(50)).max(20, 'Too many tags').optional(),
}).strict();

const ExternalTranscriptPayloadSchema = z.object({
  assigned_user_email: z.string().email().max(255),
  transcript_text: z.string().max(500000, 'Transcript exceeds 500KB').optional(),
  transcript_file_url: z.string().url().max(500).optional(),
  meeting_metadata: MeetingMetadataSchema,
  priority: z.enum(['low', 'medium', 'high']).optional(),
  source: z.string().max(50).trim(),
  source_metadata: z.record(z.unknown()).optional(),
}).strict().refine(
  (data) => data.transcript_text || data.transcript_file_url,
  { message: 'Either transcript_text or transcript_file_url must be provided' }
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Zod schemas for input validation
const MeetingMetadataSchema = z.object({
  title: z.string().max(500).optional(),
  meeting_host: z.string().max(200).optional(),
  participants: z.union([z.array(z.string().max(200)), z.string().max(1000)]).optional(),
  meeting_date: z.string().max(100).optional(),
  duration_minutes: z.number().int().min(0).max(600).optional(),
  company_name: z.string().max(500).optional(),
  contact_name: z.string().max(200).optional(),
  deal_name: z.string().max(500).optional(),
}).optional();

const ExternalTranscriptPayloadSchema = z.object({
  transcript_text: z.string().max(1_000_000).optional(),
  transcript_file_url: z.string().url().max(2000).optional(),
  transcript_filename: z.string().max(500).optional(),
  zoho_deal_id: z.string().max(100).optional(),
  zoho_meeting_id: z.string().max(100).optional(),
  assigned_user_email: z.string().email().max(255),
  meeting_metadata: MeetingMetadataSchema,
  priority: z.enum(['urgent', 'high', 'normal', 'low']).optional(),
  source: z.enum(['zapier', 'zoho', 'api', 'zoho_meeting']).optional(),
  callback_webhook: z.string().url().max(2000).optional(),
}).refine(
  (data) => data.transcript_text || data.transcript_file_url,
  { message: "Either transcript_text or transcript_file_url is required" }
);

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

function sanitizeTextField(text: string | undefined): string | undefined {
  if (!text) return text;
  return text
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .trim();
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

    // Parse and validate request body with Zod
    console.log('🔍 [DEBUG] Request method:', req.method);
    console.log('🔍 [DEBUG] Content-Type header:', req.headers.get('content-type'));
    console.log('🔍 [DEBUG] Authorization header present:', !!req.headers.get('authorization'));

    let payload: ExternalTranscriptPayload;
    try {
      const rawBody = await req.text();
      console.log('🔍 [DEBUG] Raw request body length:', rawBody.length);
      console.log('🔍 [DEBUG] Raw request body preview:', rawBody.substring(0, 500));
      
      const rawPayload = JSON.parse(rawBody);
      console.log('🔍 [DEBUG] JSON parsing successful');
      
      // Validate with Zod schema
      const validationResult = ExternalTranscriptPayloadSchema.safeParse(rawPayload);
      
      if (!validationResult.success) {
        console.error('❌ [VALIDATION] Schema validation failed:', validationResult.error);
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid payload structure',
          details: validationResult.error.errors.map(e => ({
            path: e.path.join('.'),
            message: e.message
          }))
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      payload = validationResult.data;
    } catch (parseError) {
      console.error('❌ [ERROR] JSON parsing failed:', parseError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid JSON in request body',
        details: parseError instanceof Error ? parseError.message : 'Unknown parsing error'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    console.log('🔗 [INGEST] Processing payload for user:', payload.assigned_user_email);

    console.log('🔍 [DEBUG] Payload structure:', {
      keys: Object.keys(payload),
      hasTranscriptText: 'transcript_text' in payload,
      hasTranscriptFileUrl: 'transcript_file_url' in payload,
      hasAssignedEmail: 'assigned_user_email' in payload
    });

    console.log('🔍 [DEBUG] transcript_text details:', {
      exists: !!payload.transcript_text,
      type: typeof payload.transcript_text,
      length: payload.transcript_text?.length || 0,
      isEmpty: payload.transcript_text?.trim().length === 0,
      preview: payload.transcript_text?.substring(0, 50) || 'N/A'
    });

    console.log('🔍 [DEBUG] transcript_file_url details:', {
      exists: !!payload.transcript_file_url,
      type: typeof payload.transcript_file_url,
      value: payload.transcript_file_url || 'N/A'
    });

    console.log('🔍 [DEBUG] assigned_user_email details:', {
      exists: !!payload.assigned_user_email,
      type: typeof payload.assigned_user_email,
      value: payload.assigned_user_email,
      isValid: isValidEmail(payload.assigned_user_email || '')
    });

    console.log('🔍 [DEBUG] Other fields:', {
      priority: payload.priority,
      source: payload.source,
      zoho_meeting_id: payload.zoho_meeting_id,
      meeting_metadata: payload.meeting_metadata ? Object.keys(payload.meeting_metadata) : null
    });

    // Validate required fields
    const validation = validatePayload(payload);
    if (!validation.isValid) {
      console.error('❌ [ERROR] Validation failed with errors:', validation.errors);
      console.error('❌ [ERROR] Failed payload analysis:', {
        receivedFields: Object.keys(payload),
        transcript_text: {
          provided: !!payload.transcript_text,
          type: typeof payload.transcript_text,
          length: payload.transcript_text?.length || 0,
          isEmpty: !payload.transcript_text || payload.transcript_text.trim().length === 0,
          preview: payload.transcript_text?.substring(0, 100) || 'N/A'
        },
        transcript_file_url: {
          provided: !!payload.transcript_file_url,
          value: payload.transcript_file_url || 'N/A'
        },
        assigned_user_email: {
          provided: !!payload.assigned_user_email,
          value: payload.assigned_user_email,
          type: typeof payload.assigned_user_email
        },
        priority: payload.priority,
        source: payload.source
      });
      
      return new Response(JSON.stringify({
        success: false,
        error: 'Validation failed',
        details: validation.errors,
        debugInfo: {
          receivedFields: Object.keys(payload),
          fieldTypes: {
            transcript_text: typeof payload.transcript_text,
            transcript_file_url: typeof payload.transcript_file_url,
            assigned_user_email: typeof payload.assigned_user_email,
            priority: typeof payload.priority,
            source: typeof payload.source
          },
          fieldPresence: {
            transcript_text: !!payload.transcript_text,
            transcript_file_url: !!payload.transcript_file_url,
            assigned_user_email: !!payload.assigned_user_email
          },
          contentPreviews: {
            transcript_text_length: payload.transcript_text?.length || 0,
            transcript_text_preview: payload.transcript_text?.substring(0, 50) || 'N/A',
            email_value: payload.assigned_user_email
          }
        }
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
        error_code: 'ERR_INGEST_002'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('🔗 [INGEST] Transcript created:', transcript.id);

    // For external integrations, we create owned transcripts, not assignments
    // Skip creating assignment records - the transcript is now owned by the user
    
    console.log('🔗 [SUCCESS] External transcript created as owned transcript');

    const response: ProcessingResponse = {
      success: true,
      transcript_id: transcript.id,
      // No assignment or queue position needed for owned transcripts
    };

    console.log('🔗 [SUCCESS] External transcript ingested successfully');
    
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('🔗 [FATAL] External transcript ingestion failed:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to process transcript request',
      error_code: 'ERR_INGEST_001'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function validatePayload(payload: ExternalTranscriptPayload): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  console.log('🔍 [VALIDATION] Starting field-by-field validation');

  // Check 1: Either transcript_text or transcript_file_url is required
  const hasTranscriptText = !!payload.transcript_text && payload.transcript_text.trim().length > 0;
  const hasTranscriptFileUrl = !!payload.transcript_file_url;
  
  console.log('🔍 [VALIDATION] Check 1 - Transcript content:', {
    hasTranscriptText,
    hasTranscriptFileUrl,
    transcript_text_length: payload.transcript_text?.length || 0,
    transcript_text_trimmed_length: payload.transcript_text?.trim().length || 0
  });
  
  if (!hasTranscriptText && !hasTranscriptFileUrl) {
    console.log('❌ [VALIDATION] FAILED: Missing both transcript_text and transcript_file_url');
    errors.push('Either transcript_text or transcript_file_url is required');
  } else {
    console.log('✅ [VALIDATION] PASSED: Transcript content check');
  }

  // Check 2: Email validation
  const emailExists = !!payload.assigned_user_email;
  const emailValid = emailExists && isValidEmail(payload.assigned_user_email);
  
  console.log('🔍 [VALIDATION] Check 2 - Email:', {
    emailExists,
    emailValid,
    emailValue: payload.assigned_user_email,
    emailType: typeof payload.assigned_user_email
  });
  
  if (!emailExists || !emailValid) {
    console.log('❌ [VALIDATION] FAILED: Invalid or missing email');
    errors.push('assigned_user_email is required and must be a valid email');
  } else {
    console.log('✅ [VALIDATION] PASSED: Email validation');
  }

  // Check 3: Priority validation (optional)
  if (payload.priority) {
    const validPriorities = ['urgent', 'high', 'normal', 'low'];
    const priorityValid = validPriorities.includes(payload.priority);
    
    console.log('🔍 [VALIDATION] Check 3 - Priority:', {
      providedValue: payload.priority,
      isValid: priorityValid,
      validOptions: validPriorities
    });
    
    if (!priorityValid) {
      console.log('❌ [VALIDATION] FAILED: Invalid priority value');
      errors.push('priority must be one of: urgent, high, normal, low');
    } else {
      console.log('✅ [VALIDATION] PASSED: Priority validation');
    }
  } else {
    console.log('🔍 [VALIDATION] Check 3 - Priority: Not provided (optional)');
  }

  // Check 4: Source validation (optional)
  if (payload.source) {
    const validSources = ['zapier', 'zoho', 'api', 'zoho_meeting'];
    const sourceValid = validSources.includes(payload.source);
    
    console.log('🔍 [VALIDATION] Check 4 - Source:', {
      providedValue: payload.source,
      isValid: sourceValid,
      validOptions: validSources
    });
    
    if (!sourceValid) {
      console.log('❌ [VALIDATION] FAILED: Invalid source value');
      errors.push('source must be one of: zapier, zoho, api, zoho_meeting');
    } else {
      console.log('✅ [VALIDATION] PASSED: Source validation');
    }
  } else {
    console.log('🔍 [VALIDATION] Check 4 - Source: Not provided (optional)');
  }

  // Check 5: Transcript length validation
  if (payload.transcript_text) {
    const textLength = payload.transcript_text.length;
    const maxLength = 500000;
    
    console.log('🔍 [VALIDATION] Check 5 - Transcript length:', {
      actualLength: textLength,
      maxLength: maxLength,
      withinLimit: textLength <= maxLength
    });
    
    if (textLength > maxLength) {
      console.log('❌ [VALIDATION] FAILED: Transcript exceeds maximum length');
      errors.push('transcript_text exceeds maximum length of 500,000 characters');
    } else {
      console.log('✅ [VALIDATION] PASSED: Transcript length validation');
    }
  }

  // Check 6: URL validation
  if (payload.transcript_file_url) {
    let urlValid = false;
    try {
      new URL(payload.transcript_file_url);
      urlValid = true;
      console.log('✅ [VALIDATION] PASSED: URL validation');
    } catch (urlError) {
      console.log('❌ [VALIDATION] FAILED: Invalid URL format');
      console.log('🔍 [VALIDATION] URL error:', urlError);
      errors.push('transcript_file_url must be a valid URL');
    }
    
    console.log('🔍 [VALIDATION] Check 6 - URL:', {
      providedValue: payload.transcript_file_url,
      isValid: urlValid
    });
  }

  const isValid = errors.length === 0;
  console.log('🔍 [VALIDATION] Final result:', {
    isValid,
    errorCount: errors.length,
    errors
  });

  return {
    isValid,
    errors
  };
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validateTranscriptUrl(url: string): void {
  try {
    const parsed = new URL(url);
    
    // Only HTTPS allowed (except localhost for development)
    if (parsed.protocol !== 'https:' && !parsed.hostname.includes('localhost')) {
      throw new Error('Only HTTPS URLs are allowed');
    }
    
    const hostname = parsed.hostname.toLowerCase();
    
    // Block private IP ranges and cloud metadata endpoints
    const privatePatterns = [
      /^127\./,                    // Loopback
      /^10\./,                     // Private Class A
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // Private Class B
      /^192\.168\./,               // Private Class C
      /^169\.254\./,               // Link-local
      /^::1$/,                     // IPv6 loopback
      /^fc00:/,                    // IPv6 unique local
      /^fe80:/,                    // IPv6 link-local
      /localhost/,                 // Localhost
      /\.local$/,                  // mDNS
    ];
    
    if (privatePatterns.some(pattern => pattern.test(hostname))) {
      throw new Error('Private IP addresses and internal domains are not allowed');
    }
    
    // Allowlist of trusted domains
    const allowedDomains = [
      'zoom.us',
      'zoho.com',
      'zohoapis.com',
      'googleapis.com',
      'microsoft.com',
      's3.amazonaws.com',
      'supabase.co',
    ];
    
    const isAllowed = allowedDomains.some(domain => 
      hostname === domain || hostname.endsWith('.' + domain)
    );
    
    if (!isAllowed) {
      throw new Error(`Domain ${hostname} is not in the allowlist of trusted domains`);
    }
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error('Invalid URL format');
    }
    throw error;
  }
}

async function downloadTranscriptFile(fileUrl: string): Promise<string> {
  // SSRF Protection: Validate URL before fetching
  validateTranscriptUrl(fileUrl);
  
  // Add timeout to prevent hanging requests
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
  
  try {
    const response = await fetch(fileUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'SalesWhisperer/1.0'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.status} ${response.statusText}`);
    }
    
    // Validate content type
    const contentType = response.headers.get('content-type') || '';
    const allowedTypes = ['text/plain', 'text/vtt', 'application/json'];
    
    if (!allowedTypes.some(type => contentType.includes(type))) {
      throw new Error(`Invalid content type: ${contentType}. Expected text/plain, text/vtt, or application/json`);
    }
    
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
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Download request timed out after 10 seconds');
    }
    throw error;
  }
}

/**
 * Calculate meeting duration from word count using standard speaking rate
 * @param wordCount - Number of words in transcript
 * @returns Estimated duration in minutes (rounded)
 */
function calculateDurationFromWordCount(wordCount: number): number {
  // Standard speaking rate: 140 words per minute (middle of 125-150 range)
  return Math.round(wordCount / 140);
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
    assigned_user_id: null, // External integrations create owned transcripts, not assignments
    title: metadata.title || `External Transcript - ${new Date().toISOString().split('T')[0]}`,
    participants: participants,
    meeting_date: metadata.meeting_date || new Date().toISOString(),
    duration_minutes: (() => {
      // Use provided duration first, otherwise calculate from word count
      if (metadata.duration_minutes) {
        return metadata.duration_minutes;
      }
      if (metadata.word_count) {
        const calculated = calculateDurationFromWordCount(metadata.word_count);
        console.log(`📊 [DURATION] Calculated ${calculated} minutes from ${metadata.word_count} words`);
        return calculated;
      }
      return null;
    })(),
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
      ingestion_timestamp: new Date().toISOString(),
      // Phase 1: Store callback_webhook and zoho_deal_id for easy access during analysis
      callback_webhook: payload.callback_webhook,
      zoho_deal_id: payload.zoho_deal_id || payload.zoho_meeting_id
    }
  };
}