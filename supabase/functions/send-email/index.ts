import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple HTML email templates
const generateInviteEmailHTML = (data: any) => `
<!DOCTYPE html>
<html>
<head><title>You're Invited to Sales Whisperer</title></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h1>Welcome to Sales Whisperer!</h1>
  <p>You've been invited by ${data.invitedBy} to join Sales Whisperer.</p>
  <p><a href="${data.inviteLink}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Accept Invitation</a></p>
  <p>This invitation expires on ${new Date(data.expiresAt).toLocaleDateString()}.</p>
</body>
</html>`;

const generateRegistrationFailureHTML = (data: any) => `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif;">
  <h1>Registration Failures Detected</h1>
  <p>${data.totalCount} users experienced registration issues.</p>
  <p><a href="${data.adminDashboardUrl}">View Admin Dashboard</a></p>
</body>
</html>`;

const generateIntegrationEmailHTML = (type: string, data: any) => `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif;">
  <h1>Integration ${type}</h1>
  <p>Your ${data.integration_type} integration status has been updated.</p>
</body>
</html>`;

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, type: emailType, data } = await req.json();

    console.log(`Sending ${emailType} email to ${to}`);

    let html = '';
    
    // Generate HTML based on email type
    switch (emailType) {
      case 'invite':
        html = generateInviteEmailHTML(data);
        break;
      case 'registration-failure':
        html = generateRegistrationFailureHTML(data);
        break;
      case 'integration-connected':
      case 'integration-failed':
      case 'integration-error':
      case 'integration-tips':
        html = generateIntegrationEmailHTML(emailType, data);
        break;
      default:
        html = '<p>Email content</p>';
    }

    // Send via Resend API
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Sales Whisperer <noreply@saleswhisperer.net>',
        to: [to],
        subject,
        html
      })
    });

    const result = await resendResponse.json();
    console.log('Email sent successfully:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error sending email:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};

serve(handler);