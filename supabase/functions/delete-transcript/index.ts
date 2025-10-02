import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Secure transcript deletion with cascading cleanup and audit logging
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get user from auth header and create a user-bound Supabase client
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'No authorization header' }),
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
      console.error('🔒 [DELETE] Authentication failed:', authError);
      return new Response(
        JSON.stringify({ success: false, error: 'Authentication failed' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { transcript_id } = await req.json();

    if (!transcript_id) {
      console.error('❌ [DELETE] Missing transcript_id');
      return new Response(
        JSON.stringify({ success: false, error: 'transcript_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🗑️  [DELETE] Starting deletion for transcript: ${transcript_id} by user: ${user.id}`);

    // Call the secure database function for cascading delete
    const { data: result, error: deleteError } = await supabaseClient.rpc(
      'delete_transcript_cascade',
      {
        p_transcript_id: transcript_id,
        p_user_id: user.id
      }
    );

    if (deleteError) {
      console.error('❌ [DELETE] Database function error:', deleteError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to delete transcript',
          details: deleteError.message 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check the result from the database function
    if (!result || !result.success) {
      console.error('❌ [DELETE] Deletion failed:', result?.error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: result?.error || 'Deletion failed' 
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ [DELETE] Successfully deleted transcript: ${transcript_id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: result.message,
        transcript_id: transcript_id
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ [DELETE] Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'An unexpected error occurred',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
