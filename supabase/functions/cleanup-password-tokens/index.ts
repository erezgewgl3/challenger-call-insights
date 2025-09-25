import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting password reset token cleanup job');

    // Create Supabase admin client for cleanup operations (guide rail)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Call the cleanup function (guide rail maintenance)
    const { data: cleanupResult, error: cleanupError } = await supabaseAdmin.rpc(
      'cleanup_expired_password_reset_tokens'
    );

    if (cleanupError) {
      console.error('Token cleanup error:', cleanupError);
      return new Response(
        JSON.stringify({ 
          error: 'Token cleanup failed',
          details: cleanupError instanceof Error ? cleanupError.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get cleanup statistics (guide rail monitoring)
    const { data: stats, error: statsError } = await supabaseAdmin
      .from('password_reset_tokens')
      .select('*', { count: 'exact', head: true });

    const remainingTokens = stats || 0;

    console.log('Token cleanup completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Password reset token cleanup completed',
        remainingTokens,
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error in cleanup function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Cleanup operation failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);