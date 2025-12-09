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
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { inviteId } = await req.json();

    if (!inviteId) {
      throw new Error('inviteId is required');
    }

    console.log(`Revoking invite: ${inviteId}`);

    // 1. Get the invite to find the email
    const { data: invite, error: inviteError } = await supabase
      .from('invites')
      .select('email, token')
      .eq('id', inviteId)
      .single();

    if (inviteError) {
      console.error('Error fetching invite:', inviteError);
      throw new Error(`Invite not found: ${inviteError.message}`);
    }

    console.log(`Found invite for email: ${invite.email}`);

    let orphanedUserDeleted = false;
    let deletedUserId: string | null = null;

    // 2. Check if there's an auth user with this email
    const { data: authData, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error listing auth users:', listError);
    } else if (authData?.users) {
      const authUser = authData.users.find(
        (u) => u.email?.toLowerCase() === invite.email.toLowerCase()
      );

      if (authUser) {
        console.log(`Found auth user with id: ${authUser.id}`);

        // 3. Check if this user exists in public.users (i.e., is orphaned)
        const { data: publicUser, error: publicUserError } = await supabase
          .from('users')
          .select('id')
          .eq('id', authUser.id)
          .single();

        if (publicUserError && publicUserError.code === 'PGRST116') {
          // User does NOT exist in public.users - this is an orphaned auth user
          console.log(`User ${authUser.id} is orphaned (exists in auth.users but not public.users)`);

          // Delete the orphaned auth user
          const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(authUser.id);

          if (deleteAuthError) {
            console.error('Error deleting orphaned auth user:', deleteAuthError);
          } else {
            console.log(`Successfully deleted orphaned auth user: ${authUser.id}`);
            orphanedUserDeleted = true;
            deletedUserId = authUser.id;
          }
        } else if (publicUser) {
          console.log(`User ${authUser.id} exists in public.users - not orphaned, skipping auth deletion`);
        }
      } else {
        console.log(`No auth user found with email: ${invite.email}`);
      }
    }

    // 4. Delete the invite
    const { error: deleteInviteError } = await supabase
      .from('invites')
      .delete()
      .eq('id', inviteId);

    if (deleteInviteError) {
      console.error('Error deleting invite:', deleteInviteError);
      throw new Error(`Failed to delete invite: ${deleteInviteError.message}`);
    }

    console.log(`Successfully deleted invite: ${inviteId}`);

    // 5. Log the action for audit purposes
    await supabase.from('gdpr_audit_log').insert({
      event_type: 'invite_revoked',
      details: {
        invite_id: inviteId,
        email: invite.email,
        orphaned_user_deleted: orphanedUserDeleted,
        deleted_user_id: deletedUserId,
        timestamp: new Date().toISOString(),
      },
      status: 'completed',
      legal_basis: 'Administrative action',
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: orphanedUserDeleted
          ? 'Invite revoked and orphaned user account cleaned up'
          : 'Invite revoked successfully',
        orphanedUserDeleted,
        deletedUserId,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in revoke-invite-with-cleanup:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
