import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.2";
import React from 'npm:react@18.3.1';
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import { Resend } from 'npm:resend@4.0.0';
import { InviteEmail } from './_templates/invite-email.tsx';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

// Simple HTML email templates for other types
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
        // Render React Email template
        html = await renderAsync(
          React.createElement(InviteEmail, {
            email: data.email || to,
            inviteLink: data.inviteLink,
            expiresAt: data.expiresAt,
            invitedBy: data.invitedBy
          })
        );
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

    // Send via Resend SDK
    const { error: resendError } = await resend.emails.send({
      from: 'Sales Whisperer <noreply@saleswhisperer.net>',
      to: [to],
      subject: subject || 'You\'re invited to Sales Whisperer',
      html
    });

    if (resendError) {
      console.error('Resend error:', resendError);
      throw resendError;
    }

    console.log('Email sent successfully to:', to);

    return new Response(JSON.stringify({ success: true }), {
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