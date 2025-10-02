import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const authHeader = req.headers.get('Authorization')!;

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Authentication failed:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { transcriptId, shouldArchive } = await req.json();

    if (!transcriptId) {
      return new Response(
        JSON.stringify({ error: 'transcriptId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`${shouldArchive ? 'Archiving' : 'Unarchiving'} transcript ${transcriptId} for user ${user.id}`);

    // Check ownership
    const { data: transcript, error: fetchError } = await supabase
      .from('transcripts')
      .select('user_id, assigned_user_id')
      .eq('id', transcriptId)
      .single();

    if (fetchError || !transcript) {
      console.error('Transcript not found:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Transcript not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user owns or is assigned to the transcript
    if (transcript.user_id !== user.id && transcript.assigned_user_id !== user.id) {
      console.error('User does not have permission to archive this transcript');
      return new Response(
        JSON.stringify({ error: 'Access denied' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update archive status
    const { error: updateError } = await supabase
      .from('transcripts')
      .update({
        is_archived: shouldArchive,
        archived_at: shouldArchive ? new Date().toISOString() : null,
        archived_by: shouldArchive ? user.id : null,
      })
      .eq('id', transcriptId);

    if (updateError) {
      console.error('Failed to update transcript:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update transcript' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Successfully ${shouldArchive ? 'archived' : 'unarchived'} transcript ${transcriptId}`);

    return new Response(
      JSON.stringify({ success: true, archived: shouldArchive }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in archive-transcript function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
