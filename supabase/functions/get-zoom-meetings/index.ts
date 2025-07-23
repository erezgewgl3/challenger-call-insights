import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ZoomMeeting {
  uuid: string;
  topic: string;
  start_time: string;
  duration: number;
  participants_count?: number;
}

interface ProcessedMeeting {
  id: string;
  title: string;
  date: string;
  duration: number;
  transcriptSize: string | null;
  attendees: number;
  hasTranscript: boolean;
  isNew?: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting get-zoom-meetings function');

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get user from JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      console.error('Invalid user token:', authError);
      throw new Error('Invalid user token');
    }

    console.log(`Fetching Zoom connection for user: ${user.id}`);

    // Get user's Zoom connection
    const { data: connection, error: connectionError } = await supabase
      .from('integration_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('integration_type', 'zoom')
      .eq('connection_status', 'active')
      .single();

    if (connectionError || !connection) {
      console.log('No active Zoom connection found for user');
      return new Response(JSON.stringify({ meetings: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Found Zoom connection, fetching access token');

    // Extract access token from credentials
    const credentials = connection.credentials as any;
    let accessToken = credentials?.access_token;

    if (!accessToken) {
      console.error('No access token found in connection');
      throw new Error('No access token available');
    }

    // Check if token needs refresh (if expires_at is available)
    if (credentials.expires_at) {
      const expiresAt = new Date(credentials.expires_at);
      const now = new Date();
      const bufferTime = 5 * 60 * 1000; // 5 minutes buffer

      if (expiresAt.getTime() - now.getTime() < bufferTime) {
        console.log('Token expires soon, attempting refresh');
        accessToken = await refreshZoomToken(connection, supabase);
      }
    }

    console.log('Fetching meetings from Zoom API');

    // Fetch meetings from Zoom API
    const meetingsResponse = await fetch(
      'https://api.zoom.us/v2/users/me/meetings?type=previous_meetings&page_size=30',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!meetingsResponse.ok) {
      const errorText = await meetingsResponse.text();
      console.error(`Zoom API error: ${meetingsResponse.status} - ${errorText}`);
      
      // If unauthorized, try to refresh token once
      if (meetingsResponse.status === 401 && credentials.refresh_token) {
        console.log('Token unauthorized, attempting refresh');
        try {
          accessToken = await refreshZoomToken(connection, supabase);
          
          // Retry the request with new token
          const retryResponse = await fetch(
            'https://api.zoom.us/v2/users/me/meetings?type=previous_meetings&page_size=30',
            {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              }
            }
          );

          if (!retryResponse.ok) {
            throw new Error(`Zoom API error after refresh: ${retryResponse.status}`);
          }

          const retryData = await retryResponse.json();
          return processZoomMeetings(retryData.meetings || [], user.id, supabase);
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          throw new Error('Authentication failed - please reconnect Zoom');
        }
      } else {
        throw new Error(`Zoom API error: ${meetingsResponse.status}`);
      }
    }

    const meetingsData = await meetingsResponse.json();
    console.log(`Found ${meetingsData.meetings?.length || 0} meetings`);

    return processZoomMeetings(meetingsData.meetings || [], user.id, supabase);

  } catch (error) {
    console.error('Error in get-zoom-meetings:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      meetings: []
    }), {
      status: error.message.includes('authentication') ? 401 : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function refreshZoomToken(connection: any, supabase: any): Promise<string> {
  const credentials = connection.credentials as any;
  
  if (!credentials.refresh_token) {
    throw new Error('No refresh token available');
  }

  console.log('Refreshing Zoom access token');

  const refreshResponse = await fetch('https://zoom.us/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${btoa(`${Deno.env.get('ZOOM_CLIENT_ID')}:${Deno.env.get('ZOOM_CLIENT_SECRET')}`)}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: credentials.refresh_token,
    }),
  });

  if (!refreshResponse.ok) {
    const errorText = await refreshResponse.text();
    console.error(`Token refresh failed: ${refreshResponse.status} - ${errorText}`);
    throw new Error('Failed to refresh access token');
  }

  const tokenData = await refreshResponse.json();

  // Update the connection with new tokens
  const updatedCredentials = {
    ...credentials,
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token || credentials.refresh_token,
    expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
  };

  await supabase
    .from('integration_connections')
    .update({ credentials: updatedCredentials })
    .eq('id', connection.id);

  console.log('Token refreshed successfully');
  return tokenData.access_token;
}

async function processZoomMeetings(meetings: ZoomMeeting[], userId: string, supabase: any): Promise<Response> {
  console.log(`Processing ${meetings.length} meetings for user ${userId}`);
  
  // Get already processed meetings from database
  const { data: processedMeetings } = await supabase
    .from('transcripts')
    .select('source_meeting_id, processing_status, title')
    .eq('user_id', userId)
    .eq('source', 'zoom')
    .not('source_meeting_id', 'is', null);

  console.log(`Found ${processedMeetings?.length || 0} already processed meetings`);

  const processedMeetingIds = new Set(
    processedMeetings?.map((t: any) => t.source_meeting_id) || []
  );

  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Filter out already processed meetings and add transcript availability check
  const availableMeetings: ProcessedMeeting[] = [];
  
  for (const meeting of meetings) {
    // Skip if already processed
    if (processedMeetingIds.has(meeting.uuid)) {
      console.log(`Skipping already processed meeting: ${meeting.topic}`);
      continue;
    }

    const meetingDate = new Date(meeting.start_time);
    const isNew = meetingDate > oneDayAgo;
    
    // For now, we'll assume meetings longer than 15 minutes might have transcripts
    // In a real implementation, you'd check the Zoom cloud recording API
    const hasTranscript = meeting.duration >= 15;
    
    if (hasTranscript) {
      availableMeetings.push({
        id: meeting.uuid,
        title: meeting.topic || 'Untitled Meeting',
        date: meeting.start_time,
        duration: meeting.duration,
        transcriptSize: estimateTranscriptSize(meeting.duration),
        attendees: meeting.participants_count || 0,
        hasTranscript,
        isNew
      });
    }
  }

  // Sort by date (newest first) and limit for dashboard display
  const sortedMeetings = availableMeetings
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  console.log(`Returning ${sortedMeetings.length} unprocessed meetings with transcripts`);

  return new Response(JSON.stringify({ 
    meetings: sortedMeetings,
    processedCount: processedMeetingIds.size,
    availableCount: sortedMeetings.length,
    totalMeetings: meetings.length
  }), {
    headers: { 
      ...corsHeaders, 
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=120' // Reduced cache time for better responsiveness
    }
  });
}

function estimateTranscriptSize(durationMinutes: number): string {
  // Rough estimate: ~150-200 words per minute, ~5-7 bytes per word
  const estimatedWords = durationMinutes * 175;
  const estimatedBytes = estimatedWords * 6;
  
  if (estimatedBytes < 1024) {
    return `${estimatedBytes} B`;
  } else if (estimatedBytes < 1024 * 1024) {
    return `~${Math.round(estimatedBytes / 1024)} KB`;
  } else {
    return `~${Math.round(estimatedBytes / (1024 * 1024) * 10) / 10} MB`;
  }
}

function isWithinLast24Hours(dateString: string): boolean {
  const meetingDate = new Date(dateString);
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return meetingDate > oneDayAgo;
}