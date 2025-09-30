import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get user from auth header and create a user-bound Supabase client
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const accessToken = authHeader.replace('Bearer ', '');

    // Impersonate the user by forwarding the Authorization header so RLS sees auth.uid()
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: `Bearer ${accessToken}` } },
        auth: { persistSession: false },
      }
    );

    // Validate token and fetch user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authorization' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { transcript_id } = await req.json();

    if (!transcript_id) {
      return new Response(
        JSON.stringify({ error: 'transcript_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the transcript belongs to the user OR is assigned to the user
    const { data: transcript, error: fetchError } = await supabaseClient
      .from('transcripts')
      .select('id, user_id, assigned_user_id, title, raw_text, duration_minutes')
      .eq('id', transcript_id)
      .or(`user_id.eq.${user.id},assigned_user_id.eq.${user.id}`)
      .maybeSingle();

    if (fetchError) {
      console.error('Transcript fetch error:', fetchError);
      return new Response(
        JSON.stringify({ 
          error: 'Database error fetching transcript',
          details: fetchError.message 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!transcript) {
      console.error('Transcript not found:', transcript_id, 'for user:', user.id);
      return new Response(
        JSON.stringify({ 
          error: 'Transcript not found or access denied',
          transcript_id,
          user_id: user.id
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update transcript status to processing
    const { error: updateError } = await supabaseClient
      .from('transcripts')
      .update({ 
        processing_status: 'processing',
        processing_started_at: new Date().toISOString(),
        processing_error: null
      })
      .eq('id', transcript_id);

    if (updateError) {
      console.error('Failed to update transcript status:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update transcript status' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call the analyze-transcript function
    console.log('Starting analysis for transcript:', transcript_id);
    try {
      const { error: analysisError } = await supabaseClient.functions.invoke('analyze-transcript', {
        body: {
          transcriptId: transcript_id,
          userId: user.id,
          transcriptText: transcript.raw_text || '',
          durationMinutes: transcript.duration_minutes || 0
        }
      });

      if (analysisError) {
        console.error('Analysis failed:', analysisError);
        
        // Update transcript status to failed
        await supabaseClient
          .from('transcripts')
          .update({ 
            processing_status: 'failed',
            processing_error: analysisError.message || 'Analysis failed'
          })
          .eq('id', transcript_id);

        return new Response(
          JSON.stringify({ error: 'Analysis failed', details: analysisError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Analysis started successfully',
          transcript_id 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (analysisError) {
      console.error('Analysis invocation failed:', analysisError);
      
      // Update transcript status to failed
      await supabaseClient
        .from('transcripts')
        .update({ 
          processing_status: 'failed',
          processing_error: 'Failed to start analysis'
        })
        .eq('id', transcript_id);

      return new Response(
        JSON.stringify({ error: 'Failed to start analysis' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error in manual-process-transcript:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});