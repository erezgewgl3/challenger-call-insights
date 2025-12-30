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

const generateAIServiceFailureHTML = (data: any) => `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="margin: 0; font-size: 24px;">🚨 AI Service Failure Alert</h1>
  </div>
  <div style="padding: 20px; background: #fef2f2; border: 1px solid #fecaca; border-top: none; border-radius: 0 0 8px 8px;">
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 8px 0; font-weight: bold; color: #991b1b;">Time:</td>
        <td style="padding: 8px 0;">${data.timestamp}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-weight: bold; color: #991b1b;">Environment:</td>
        <td style="padding: 8px 0;">${data.environment}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-weight: bold; color: #991b1b;">Transcript ID:</td>
        <td style="padding: 8px 0; font-family: monospace; font-size: 12px;">${data.transcriptId}</td>
      </tr>
    </table>
    
    <div style="background: white; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #dc2626;">
      <strong style="color: #991b1b;">Error Details:</strong>
      <p style="margin: 10px 0 0 0; font-family: monospace; font-size: 13px; color: #374151;">${data.errorDetails}</p>
    </div>
    
    <hr style="border: none; border-top: 1px solid #fecaca; margin: 20px 0;">
    
    <p style="margin: 0 0 10px 0; font-weight: bold; color: #991b1b;">Immediate Action Required:</p>
    <ul style="margin: 0; padding-left: 20px; color: #374151;">
      <li>Check OpenAI API status at <a href="https://status.openai.com" style="color: #dc2626;">status.openai.com</a></li>
      <li>Verify API keys are valid and have sufficient credits</li>
      <li>Check edge function logs in Supabase dashboard</li>
      <li>Consider if max_completion_tokens needs adjustment</li>
    </ul>
    
    <div style="margin-top: 20px; text-align: center;">
      <a href="https://saleswhisperer.net/admin" 
         style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
        View Admin Dashboard
      </a>
    </div>
  </div>
  <p style="color: #6b7280; font-size: 12px; text-align: center; margin-top: 20px;">
    This is an automated alert from Sales Whisperer. A user's transcript analysis failed.
  </p>
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
      case 'ai-service-failure':
        html = generateAIServiceFailureHTML(data);
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