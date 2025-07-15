import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ResetPasswordRequest {
  email: string;
  newPassword: string;
  token: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, newPassword, token }: ResetPasswordRequest = await req.json();
    
    console.log('Processing secure password reset request for:', email);

    // Input validation (guide rail)
    if (!email || !newPassword || !token) {
      console.error('Missing required fields');
      return new Response(
        JSON.stringify({ error: 'Email, new password, and token are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Password strength validation (guide rail)
    if (newPassword.length < 8) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 8 characters long' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create Supabase admin client
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

    // Get request metadata for security tracking (guide rail)
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    console.log('Validating reset token via database function');
    
    // Validate reset token using secure database function (guide rail)
    const { data: validationResult, error: validationError } = await supabaseAdmin.rpc(
      'validate_password_reset_token', 
      { 
        p_token: token, 
        p_email: email,
        p_ip_address: ipAddress,
        p_user_agent: userAgent
      }
    );

    if (validationError) {
      console.error('Token validation error:', validationError);
      return new Response(
        JSON.stringify({ error: 'Failed to validate reset token' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!validationResult || !validationResult.valid) {
      console.error('Invalid reset token:', validationResult?.error);
      return new Response(
        JSON.stringify({ error: validationResult?.error || 'Invalid or expired reset token' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Token validated successfully, proceeding with password update');

    // Get user by email with additional verification (guide rail)
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (userError) {
      console.error('Error fetching users:', userError);
      return new Response(
        JSON.stringify({ error: 'Failed to verify user' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const user = userData.users.find(u => u.email === email);
    if (!user) {
      console.error('User not found for email:', email);
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Double-check email matches validated token (guide rail)
    if (validationResult.email !== email) {
      console.error('Email mismatch in validation result');
      return new Response(
        JSON.stringify({ error: 'Invalid reset token for this email' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Updating password for user:', user.id);

    // Update user password with error handling (guide rail)
    const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (updateError) {
      console.error('Password update error:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update password' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Cleanup expired tokens for maintenance (guide rail)
    try {
      await supabaseAdmin.rpc('cleanup_expired_password_reset_tokens');
    } catch (cleanupError) {
      console.warn('Token cleanup failed (non-critical):', cleanupError);
    }

    console.log('Password updated successfully for user:', email);

    // Return success with proper structure (guide rail)
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Password updated successfully',
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error in reset-password function:', error);
    
    // Comprehensive error logging (guide rail)
    const errorDetails = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    };
    
    console.error('Full error details:', errorDetails);
    
    return new Response(
      JSON.stringify({ 
        error: 'An unexpected error occurred. Please try again.',
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