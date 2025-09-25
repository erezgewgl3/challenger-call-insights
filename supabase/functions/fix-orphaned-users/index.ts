import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.2";

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
    console.log('Fix orphaned users function called');

    // Create Supabase client with service role key for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Call the database function to fix orphaned users
    const { data: fixedUsers, error: fixError } = await supabase
      .rpc('fix_orphaned_auth_users');

    if (fixError) {
      console.error('Error fixing orphaned users:', fixError);
      throw fixError;
    }

    const fixedCount = fixedUsers?.length || 0;
    console.log(`Successfully fixed ${fixedCount} orphaned users`);

    // If users were fixed, mark related registration failures as resolved
    if (fixedCount > 0) {
      const fixedEmails = fixedUsers.map((user: any) => user.fixed_email);
      
      const { error: updateError } = await supabase
        .from('registration_failures')
        .update({
          resolved: true,
          resolved_at: new Date().toISOString(),
          resolution_method: 'Automatic - Orphaned user repair'
        })
        .in('user_email', fixedEmails)
        .eq('resolved', false);

      if (updateError) {
        console.error('Error updating registration failures:', updateError);
        // Don't throw here, as the main operation succeeded
      }

      // Send success notification email if users were fixed
      try {
        await supabase.functions.invoke('send-email', {
          body: {
            to: 'erezgew@yahoo.com',
            subject: 'SUCCESS: Orphaned Users Auto-Repaired',
            template: 'registration-success',
            data: {
              fixedCount,
              fixedUsers: fixedUsers.map((user: any) => ({
                email: user.fixed_email,
                id: user.fixed_user_id
              })),
              timestamp: new Date().toISOString()
            }
          }
        });
        console.log('Success notification email sent');
      } catch (emailError) {
        console.error('Failed to send success notification:', emailError);
        // Don't throw, as main operation succeeded
      }
    }

    const response = {
      success: true,
      fixedCount,
      fixedUsers: fixedUsers || [],
      message: fixedCount > 0 
        ? `Successfully fixed ${fixedCount} orphaned users` 
        : 'No orphaned users found'
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders 
      },
    });

  } catch (error) {
    console.error('Error in fix-orphaned-users function:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      fixedCount: 0
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders 
      },
    });
  }
});