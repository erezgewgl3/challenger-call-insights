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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    );

    // Get user from auth header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

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

    // Verify the transcript belongs to the user
    const { data: transcript, error: fetchError } = await supabaseClient
      .from('transcripts')
      .select('id, user_id, title, raw_text, duration_minutes')
      .eq('id', transcript_id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !transcript) {
      return new Response(
        JSON.stringify({ error: 'Transcript not found or access denied' }),
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
    try {
      const { error: analysisError } = await supabaseClient.functions.invoke('analyze-transcript', {
        body: {
          transcriptId: transcript_id,
          userId: user.id,
          textLength: transcript.raw_text?.length || 0,
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