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

  try {
    // Get authenticated user from JWT (handled automatically by verify_jwt = true)
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Initialize Supabase client with service role for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const requestBody = await req.json();
    
    const { userId, userIds, adminId } = requestBody;
    
    // Handle single user deletion
    if (userId) {
      try {
        // Delete all related data first
        const { data: transcriptIds, error: transcriptError } = await supabase
          .from('transcripts')
          .select('id')
          .eq('user_id', userId);

        if (transcriptError) {
          console.error('Error fetching transcripts:', transcriptError);
          throw new Error(`Failed to fetch transcripts: ${transcriptError.message}`);
        }

        // Delete conversation analysis if transcripts exist
        if (transcriptIds && Array.isArray(transcriptIds) && transcriptIds.length > 0) {
          const ids = transcriptIds
            .map(t => t?.id)
            .filter(id => id != null && typeof id === 'string');
          
          if (ids.length > 0) {
            const { error: analysisError } = await supabase
              .from('conversation_analysis')
              .delete()
              .in('transcript_id', ids);
            
            if (analysisError) {
              console.error('Analysis deletion error:', analysisError);
            }
          }
        }

        // Delete transcript progress if transcripts exist
        if (transcriptIds && Array.isArray(transcriptIds) && transcriptIds.length > 0) {
          const ids = transcriptIds
            .map(t => t?.id)
            .filter(id => id != null && typeof id === 'string');
          
          if (ids.length > 0) {
            const { error: progressError } = await supabase
              .from('transcript_progress')
              .delete()
              .in('transcript_id', ids);
            
            if (progressError) {
              console.error('Progress deletion error:', progressError);
            }
          }
        }
      } catch (error) {
        console.error('Error in transcript cleanup:', error);
        throw error;
      }

      const { error: transcriptsError } = await supabase
        .from('transcripts')
        .delete()
        .eq('user_id', userId);
      
      if (transcriptsError) {
        console.error('Transcripts deletion error:', transcriptsError);
      }

      const { error: accountsError } = await supabase
        .from('accounts')
        .delete()
        .eq('user_id', userId);
      
      if (accountsError) {
        console.error('Accounts deletion error:', accountsError);
      }

      const { error: consentError } = await supabase
        .from('user_consent')
        .delete()
        .eq('user_id', userId);
      
      if (consentError) {
        console.error('Consent deletion error:', consentError);
      }

      const { error: gdprError } = await supabase
        .from('gdpr_audit_log')
        .delete()
        .or(`user_id.eq.${userId},admin_id.eq.${userId}`);
      
      if (gdprError) {
        console.error('GDPR audit log deletion error:', gdprError);
      }

      const { error: exportError } = await supabase
        .from('data_export_requests')
        .delete()
        .or(`user_id.eq.${userId},requested_by.eq.${userId}`);
      
      if (exportError) {
        console.error('Data export requests deletion error:', exportError);
      }

      const { error: deletionError } = await supabase
        .from('deletion_requests')
        .delete()
        .or(`user_id.eq.${userId},requested_by.eq.${userId}`);
      
      if (deletionError) {
        console.error('Deletion requests deletion error:', deletionError);
      }

      const { error: invitesError } = await supabase
        .from('invites')
        .delete()
        .eq('created_by', userId);
      
      if (invitesError) {
        console.error('Invites deletion error:', invitesError);
      }

      const { error: promptsError } = await supabase
        .from('prompts')
        .delete()
        .eq('created_by', userId);
      
      if (promptsError) {
        console.error('Prompts deletion error:', promptsError);
      }

      const { error: userError } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);
      
      if (userError) {
        console.error('User deletion error:', userError);
        throw userError;
      }
      
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
      try {
        for (const uid of userIds) {
          try {
            // Get transcript IDs for this user
            const { data: transcriptIds, error: transcriptError } = await supabase
              .from('transcripts')
              .select('id')
              .eq('user_id', uid);

            if (transcriptError) {
              console.error(`Error fetching transcripts for user ${uid}:`, transcriptError);
              throw new Error(`Failed to fetch transcripts for user ${uid}: ${transcriptError.message}`);
            }

            // Delete conversation analysis if transcripts exist
            if (transcriptIds && Array.isArray(transcriptIds) && transcriptIds.length > 0) {
              const ids = transcriptIds
                .map(t => t?.id)
                .filter(id => id != null && typeof id === 'string');
              
              if (ids.length > 0) {
                const { error: analysisError } = await supabase
                  .from('conversation_analysis')
                  .delete()
                  .in('transcript_id', ids);
                
                if (analysisError) {
                  console.error(`Analysis deletion error for user ${uid}:`, analysisError);
                }
              }
            }

            // Delete transcript progress if transcripts exist
            if (transcriptIds && Array.isArray(transcriptIds) && transcriptIds.length > 0) {
              const ids = transcriptIds
                .map(t => t?.id)
                .filter(id => id != null && typeof id === 'string');
              
              if (ids.length > 0) {
                const { error: progressError } = await supabase
                  .from('transcript_progress')
                  .delete()
                  .in('transcript_id', ids);
                
                if (progressError) {
                  console.error(`Progress deletion error for user ${uid}:`, progressError);
                }
              }
            }
            
            // Delete remaining user data
            await supabase.from('transcripts').delete().eq('user_id', uid);
            await supabase.from('accounts').delete().eq('user_id', uid);
            await supabase.from('user_consent').delete().eq('user_id', uid);
            await supabase.from('gdpr_audit_log').delete().or(`user_id.eq.${uid},admin_id.eq.${uid}`);
            await supabase.from('data_export_requests').delete().or(`user_id.eq.${uid},requested_by.eq.${uid}`);
            await supabase.from('deletion_requests').delete().or(`user_id.eq.${uid},requested_by.eq.${uid}`);
            await supabase.from('invites').delete().eq('created_by', uid);
            await supabase.from('prompts').delete().eq('created_by', uid);
            
          } catch (userError) {
            console.error(`Error processing user ${uid}:`, userError);
            throw new Error(`Failed to process user ${uid}: ${userError instanceof Error ? userError.message : 'Unknown error'}`);
          }
        }
      } catch (error) {
        console.error('Error in bulk user processing:', error);
        throw error;
      }
      
      const { error: bulkUserError } = await supabase
        .from('users')
        .delete()
        .in('id', userIds);
      
      if (bulkUserError) {
        console.error('Bulk user deletion error:', bulkUserError);
        throw bulkUserError;
      }
      
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
    console.error('Error in permanent-user-deletion:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});