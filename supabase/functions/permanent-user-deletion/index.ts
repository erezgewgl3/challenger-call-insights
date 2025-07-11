import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('🗑️ Permanent user deletion function called');

  try {
    // Get authenticated user from JWT (handled automatically by verify_jwt = true)
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Initialize Supabase client with service role for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    console.log('🔧 Environment check:', { 
      hasUrl: !!supabaseUrl, 
      hasKey: !!supabaseKey 
    });

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const requestBody = await req.json();
    console.log('📝 Request body:', requestBody);
    
    const { userId, userIds, adminId } = requestBody;
    
    // Handle single user deletion
    if (userId) {
      console.log(`🗑️ Deleting single user: ${userId}`);
      
      // Delete all related data first
      console.log('🗑️ Getting transcript IDs...');
      const { data: transcriptIds } = await supabase
        .from('transcripts')
        .select('id')
        .eq('user_id', userId);

      // Delete conversation analysis if transcripts exist
      if (transcriptIds && transcriptIds.length > 0) {
        console.log('🗑️ Deleting conversation analysis...');
        const ids = transcriptIds.map(t => t.id);
        const { error: analysisError } = await supabase
          .from('conversation_analysis')
          .delete()
          .in('transcript_id', ids);
        
        if (analysisError) {
          console.error('❌ Analysis deletion error:', analysisError);
        } else {
          console.log('✅ Analysis deleted');
        }
      } else {
        console.log('ℹ️ No transcripts found, skipping analysis deletion');
      }

      // Delete transcript progress if transcripts exist
      if (transcriptIds && transcriptIds.length > 0) {
        console.log('🗑️ Deleting transcript progress...');
        const ids = transcriptIds.map(t => t.id);
        const { error: progressError } = await supabase
          .from('transcript_progress')
          .delete()
          .in('transcript_id', ids);
        
        if (progressError) {
          console.error('❌ Progress deletion error:', progressError);
        } else {
          console.log('✅ Progress deleted');
        }
      }

      console.log('🗑️ Deleting transcripts...');
      const { error: transcriptsError } = await supabase
        .from('transcripts')
        .delete()
        .eq('user_id', userId);
      
      if (transcriptsError) {
        console.error('❌ Transcripts deletion error:', transcriptsError);
      } else {
        console.log('✅ Transcripts deleted');
      }

      console.log('🗑️ Deleting accounts...');
      const { error: accountsError } = await supabase
        .from('accounts')
        .delete()
        .eq('user_id', userId);
      
      if (accountsError) {
        console.error('❌ Accounts deletion error:', accountsError);
      } else {
        console.log('✅ Accounts deleted');
      }

      console.log('🗑️ Deleting user consent...');
      const { error: consentError } = await supabase
        .from('user_consent')
        .delete()
        .eq('user_id', userId);
      
      if (consentError) {
        console.error('❌ Consent deletion error:', consentError);
      } else {
        console.log('✅ Consent deleted');
      }

      console.log('🗑️ Deleting user record...');
      const { error: userError } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);
      
      if (userError) {
        console.error('❌ User deletion error:', userError);
        throw userError;
      }
      
      console.log('✅ User deleted successfully');
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          deletedCount: 1,
          message: 'User and all associated data deleted successfully'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle bulk user deletion
    if (userIds && Array.isArray(userIds)) {
      console.log(`🗑️ Deleting ${userIds.length} users`);
      
      for (const uid of userIds) {
        console.log(`🗑️ Processing user: ${uid}`);
        
        // Get transcript IDs for this user
        const { data: transcriptIds } = await supabase
          .from('transcripts')
          .select('id')
          .eq('user_id', uid);

        // Delete conversation analysis if transcripts exist
        if (transcriptIds && transcriptIds.length > 0) {
          const ids = transcriptIds.map(t => t.id);
          await supabase
            .from('conversation_analysis')
            .delete()
            .in('transcript_id', ids);
        }

        // Delete transcript progress if transcripts exist
        if (transcriptIds && transcriptIds.length > 0) {
          const ids = transcriptIds.map(t => t.id);
          await supabase
            .from('transcript_progress')
            .delete()
            .in('transcript_id', ids);
        }
        
        await supabase.from('transcripts').delete().eq('user_id', uid);
        await supabase.from('accounts').delete().eq('user_id', uid);
        await supabase.from('user_consent').delete().eq('user_id', uid);
      }
      
      const { error: bulkUserError } = await supabase
        .from('users')
        .delete()
        .in('id', userIds);
      
      if (bulkUserError) {
        console.error('❌ Bulk user deletion error:', bulkUserError);
        throw bulkUserError;
      }
      
      console.log('✅ Users deleted successfully');
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          deletedCount: userIds.length,
          message: 'Users and all associated data deleted successfully'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Either userId or userIds must be provided');

  } catch (error) {
    console.error('❌ Error in permanent-user-deletion:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});