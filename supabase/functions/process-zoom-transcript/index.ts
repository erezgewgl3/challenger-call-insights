import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting process-zoom-transcript function');

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get user from JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      console.error('Invalid user token:', authError);
      throw new Error('Invalid user token');
    }

    // Get request body
    const { meetingId, meetingTitle, meetingDate, meetingDuration, attendeeCount } = await req.json();
    console.log(`Processing meeting: ${meetingId} for user: ${user.id}`);

    if (!meetingId) {
      throw new Error('Meeting ID is required');
    }

    // Check if meeting already processed
    const { data: existingTranscript } = await supabase
      .from('transcripts')
      .select('id, processing_status')
      .eq('user_id', user.id)
      .eq('source_meeting_id', meetingId)
      .maybeSingle();

    if (existingTranscript) {
      console.log(`Meeting ${meetingId} already processed`);
      return new Response(JSON.stringify({
        error: 'Meeting already processed',
        transcriptId: existingTranscript.id,
        status: existingTranscript.processing_status
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get user's Zoom connection
    const { data: connection, error: connectionError } = await supabase
      .from('integration_connections')
      .select('credentials')
      .eq('user_id', user.id)
      .eq('integration_type', 'zoom')
      .eq('connection_status', 'active')
      .maybeSingle();

    if (connectionError || !connection) {
      console.error('Zoom connection not found:', connectionError);
      throw new Error('Zoom connection not found or inactive');
    }

    // Extract credentials
    const credentials = connection.credentials as any;
    if (!credentials?.access_token) {
      throw new Error('No Zoom access token available');
    }

    // Ensure valid token
    const accessToken = await ensureValidToken(credentials, user.id, supabase);

    // Download transcript from Zoom
    console.log(`Downloading transcript for meeting: ${meetingId}`);
    const transcriptContent = await downloadZoomTranscript(meetingId, accessToken);

    if (!transcriptContent) {
      throw new Error('Failed to download transcript from Zoom');
    }

    console.log(`Transcript downloaded, content length: ${transcriptContent.length}`);

    // Extract basic metadata from transcript text
    const extractedMetadata = extractTranscriptMetadata(transcriptContent, meetingTitle || 'Zoom Meeting');
    
    // Create transcript record
    const { data: transcript, error: transcriptError } = await supabase
      .from('transcripts')
      .insert({
        user_id: user.id,
        title: extractedMetadata.title,
        participants: extractedMetadata.participants,
        duration_minutes: meetingDuration || extractedMetadata.estimatedDuration,
        meeting_date: meetingDate || new Date().toISOString(),
        raw_text: transcriptContent,
        source: 'zoom',
        source_meeting_id: meetingId,
        source_metadata: {
          meetingTopic: meetingTitle,
          startTime: meetingDate,
          duration: meetingDuration,
          attendees: attendeeCount,
          downloadedAt: new Date().toISOString()
        },
        status: 'uploaded',
        processing_status: 'pending'
      })
      .select()
      .single();

    if (transcriptError) {
      console.error('Failed to create transcript record:', transcriptError);
      throw new Error(`Failed to create transcript record: ${transcriptError.message}`);
    }

    console.log(`Transcript record created: ${transcript.id}`);

    // Trigger existing analysis pipeline
    try {
      const { error: analysisError } = await supabase.functions.invoke('analyze-transcript', {
        body: { transcript_id: transcript.id }
      });

      if (analysisError) {
        console.error('Analysis trigger failed:', analysisError);
        // Don't fail the whole request - transcript is created, analysis can be retried
      } else {
        console.log('Analysis pipeline triggered successfully');
      }
    } catch (analysisInvokeError) {
      console.error('Failed to invoke analysis function:', analysisInvokeError);
      // Continue - the transcript is created and can be analyzed later
    }

    return new Response(JSON.stringify({
      success: true,
      transcriptId: transcript.id,
      meetingId: meetingId,
      status: 'processing',
      message: 'Transcript downloaded and analysis started'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error processing Zoom transcript:', error);
    return new Response(JSON.stringify({
      error: error.message,
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Helper function to download transcript from Zoom
async function downloadZoomTranscript(meetingId: string, accessToken: string): Promise<string | null> {
  try {
    console.log(`Getting recording info for meeting: ${meetingId}`);
    
    // Get recording information
    const recordingResponse = await fetch(
      `https://api.zoom.us/v2/meetings/${meetingId}/recordings`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!recordingResponse.ok) {
      const errorText = await recordingResponse.text();
      console.error(`Failed to get recording info: ${recordingResponse.status} - ${errorText}`);
      throw new Error(`Failed to get recording info: ${recordingResponse.status}`);
    }

    const recordingData = await recordingResponse.json();
    console.log(`Found ${recordingData.recording_files?.length || 0} recording files`);

    // Find transcript file
    const transcriptFile = recordingData.recording_files?.find((file: any) => 
      file.file_type === 'TRANSCRIPT' && file.status === 'completed'
    );

    if (!transcriptFile || !transcriptFile.download_url) {
      console.error('No transcript file found or download URL missing');
      throw new Error('No transcript file found or download URL missing');
    }

    console.log(`Downloading transcript from: ${transcriptFile.download_url}`);

    // Download transcript content
    const transcriptResponse = await fetch(transcriptFile.download_url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!transcriptResponse.ok) {
      console.error(`Failed to download transcript: ${transcriptResponse.status}`);
      throw new Error(`Failed to download transcript: ${transcriptResponse.status}`);
    }

    // Parse transcript content
    const transcriptText = await transcriptResponse.text();
    console.log(`Downloaded transcript, raw length: ${transcriptText.length}`);
    
    // Convert VTT to plain text if needed
    const plainText = parseTranscriptContent(transcriptText);
    console.log(`Parsed transcript, plain text length: ${plainText.length}`);
    
    return plainText;

  } catch (error) {
    console.error('Error downloading Zoom transcript:', error);
    return null;
  }
}

// Helper function to parse various transcript formats
function parseTranscriptContent(content: string): string {
  // Check if this is VTT format
  if (content.includes('WEBVTT') || content.includes('-->')) {
    return parseVTTTranscript(content);
  }
  
  // Check if this is SRT format
  if (content.match(/^\d+\s*$/m) && content.includes('-->')) {
    return parseSRTTranscript(content);
  }
  
  // Assume it's already plain text
  return content.trim();
}

// Helper function to parse VTT transcript to plain text
function parseVTTTranscript(vttContent: string): string {
  const lines = vttContent.split('\n');
  const textLines: string[] = [];
  
  let isTextLine = false;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip VTT headers
    if (trimmed === 'WEBVTT' || trimmed === '' || trimmed.startsWith('NOTE') || trimmed.startsWith('Kind:') || trimmed.startsWith('Language:')) {
      continue;
    }
    
    // Skip timestamp lines
    if (trimmed.includes('-->')) {
      isTextLine = true; // Next non-empty line should be text
      continue;
    }
    
    // Skip cue numbers
    if (trimmed.match(/^\d+$/)) {
      continue;
    }
    
    // This should be actual transcript text
    if (isTextLine && trimmed) {
      // Remove WebVTT formatting tags
      const cleanText = trimmed
        .replace(/<[^>]*>/g, '') // Remove HTML-like tags
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>');
        
      if (cleanText) {
        textLines.push(cleanText);
      }
      isTextLine = false;
    }
  }
  
  return textLines.join('\n').trim();
}

// Helper function to parse SRT transcript to plain text
function parseSRTTranscript(srtContent: string): string {
  const blocks = srtContent.split(/\n\s*\n/);
  const textLines: string[] = [];
  
  for (const block of blocks) {
    const lines = block.trim().split('\n');
    if (lines.length >= 3) {
      // Skip sequence number and timestamp, take the text
      for (let i = 2; i < lines.length; i++) {
        const cleanText = lines[i]
          .replace(/<[^>]*>/g, '') // Remove HTML-like tags
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>');
        
        if (cleanText.trim()) {
          textLines.push(cleanText.trim());
        }
      }
    }
  }
  
  return textLines.join('\n').trim();
}

// Helper function to extract metadata from transcript
function extractTranscriptMetadata(content: string, title: string) {
  const words = content.split(/\s+/).length;
  const estimatedDuration = Math.round(words / 150); // ~150 words per minute
  
  // Simple participant extraction - look for names followed by colons
  const participantPattern = /^([A-Z][a-z]+ [A-Z][a-z]+):/gm;
  const participantMatches = content.match(participantPattern);
  const participants = participantMatches 
    ? [...new Set(participantMatches.map(match => match.replace(':', '')))]
    : [];
  
  return {
    title,
    participants,
    estimatedDuration: Math.max(1, estimatedDuration)
  };
}

// Helper function to ensure valid access token
async function ensureValidToken(credentials: any, userId: string, supabase: any): Promise<string> {
  // Check if token is expired
  if (credentials.expires_at) {
    const now = new Date();
    const expiresAt = new Date(credentials.expires_at);
    const bufferTime = 5 * 60 * 1000; // 5 minutes buffer
    
    if (expiresAt.getTime() - now.getTime() > bufferTime) {
      return credentials.access_token;
    }
  } else {
    // No expiry info, assume token is still valid
    return credentials.access_token;
  }
  
  // Token expired or close to expiry, refresh it
  console.log('Refreshing Zoom access token');
  
  const refreshResponse = await fetch('https://zoom.us/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${btoa(`${Deno.env.get('ZOOM_CLIENT_ID')}:${Deno.env.get('ZOOM_CLIENT_SECRET')}`)}`
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: credentials.refresh_token
    })
  });
  
  if (!refreshResponse.ok) {
    const errorText = await refreshResponse.text();
    console.error(`Token refresh failed: ${refreshResponse.status} - ${errorText}`);
    throw new Error('Failed to refresh Zoom token');
  }
  
  const tokenData = await refreshResponse.json();
  
  // Update connection with new tokens
  const updatedCredentials = {
    ...credentials,
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token || credentials.refresh_token,
    expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
  };
  
  await supabase
    .from('integration_connections')
    .update({ 
      credentials: updatedCredentials,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)
    .eq('integration_type', 'zoom');
  
  console.log('Token refreshed successfully');
  return tokenData.access_token;
}