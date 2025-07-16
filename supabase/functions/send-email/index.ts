import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import React from 'npm:react@18.3.1';
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import { InviteEmail } from './_templates/invite-email.tsx';
import { RegistrationFailureEmail } from './_templates/registration-failure-email.tsx';
import { IntegrationConnectedEmail } from './_templates/integration-connected-email.tsx';
import { IntegrationFailedEmail } from './_templates/integration-failed-email.tsx';
import { IntegrationErrorEmail } from './_templates/integration-error-email.tsx';
import { IntegrationTipsEmail } from './_templates/integration-tips-email.tsx';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string | string[];
  subject?: string;
  template?: 'invite' | 'password-reset' | 'welcome' | 'custom' | 'registration-failure' | 'integration-connected' | 'integration-failed' | 'integration-error' | 'integration-tips';
  type?: 'invite' | 'password-reset' | 'welcome' | 'custom' | 'registration-failure' | 'integration-connected' | 'integration-failed' | 'integration-error' | 'integration-tips';
  data: Record<string, any>;
  from?: string;
}

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

const emailTemplates: Record<string, (data: Record<string, any>) => EmailTemplate> = {
  invite: (data) => ({
    subject: "You're invited to join Sales Whisperer",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb; text-align: center;">Welcome to Sales Whisperer</h1>
        <p>Hi there,</p>
        <p>You've been invited to join Sales Whisperer, the AI-powered sales coaching platform.</p>
        <p>Click the link below to create your account:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.inviteLink}" 
             style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Accept Invitation
          </a>
        </div>
        <p><strong>This invitation will expire on ${new Date(data.expiresAt).toLocaleDateString()}.</strong></p>
        <p>If you have any questions, please don't hesitate to reach out to our support team.</p>
        <p>Best regards,<br>The Sales Whisperer Team</p>
      </div>
    `,
    text: `
WELCOME TO SALES WHISPERER

Hi there,

You've been invited to join Sales Whisperer, the AI-powered sales coaching platform.

To create your account, please visit the following link:
${data.inviteLink}

This invitation will expire on ${new Date(data.expiresAt).toLocaleDateString()}.

If you have any questions, please don't hesitate to reach out to our support team.

Best regards,
The Sales Whisperer Team
    `.trim()
  }),

  'password-reset': (data) => ({
    subject: "Reset your Sales Whisperer password",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb; text-align: center;">Password Reset</h1>
        <p>Hi ${data.name || 'there'},</p>
        <p>We received a request to reset your password for your Sales Whisperer account.</p>
        <p>Click the link below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.resetLink}" 
             style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p><strong>This link will expire in ${data.expiresIn || '1 hour'}.</strong></p>
        <p>If you didn't request this password reset, please ignore this email.</p>
        <p>Best regards,<br>The Sales Whisperer Team</p>
      </div>
    `,
    text: `
PASSWORD RESET

Hi ${data.name || 'there'},

We received a request to reset your password for your Sales Whisperer account.

To reset your password, please visit the following link:
${data.resetLink}

This link will expire in ${data.expiresIn || '1 hour'}.

If you didn't request this password reset, please ignore this email.

Best regards,
The Sales Whisperer Team
    `.trim()
  }),

  welcome: (data) => ({
    subject: "Welcome to Sales Whisperer!",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb; text-align: center;">Welcome to Sales Whisperer!</h1>
        <p>Hi ${data.name || 'there'},</p>
        <p>Welcome to Sales Whisperer! We're excited to help you transform your sales conversations with AI-powered insights.</p>
        <h2>Getting Started</h2>
        <ol>
          <li><strong>Upload your first transcript</strong> - Start by uploading a sales call transcript</li>
          <li><strong>Get AI insights</strong> - Our AI will analyze your call using the Challenger Sales methodology</li>
          <li><strong>Improve your approach</strong> - Use the guidance to enhance your sales performance</li>
        </ol>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.dashboardLink || 'https://app.saleswhisperer.net/dashboard'}" 
             style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Go to Dashboard
          </a>
        </div>
        <p>If you have any questions or need help getting started, our support team is here to help.</p>
        <p>Best regards,<br>The Sales Whisperer Team</p>
      </div>
    `,
    text: `
WELCOME TO SALES WHISPERER!

Hi ${data.name || 'there'},

Welcome to Sales Whisperer! We're excited to help you transform your sales conversations with AI-powered insights.

GETTING STARTED:

1. Upload your first transcript - Start by uploading a sales call transcript
2. Get AI insights - Our AI will analyze your call using the Challenger Sales methodology  
3. Improve your approach - Use the guidance to enhance your sales performance

Visit your dashboard: ${data.dashboardLink || 'https://app.saleswhisperer.net/dashboard'}

If you have any questions or need help getting started, our support team is here to help.

Best regards,
The Sales Whisperer Team
    `.trim()
  }),

  custom: (data) => ({
    subject: data.subject || "Message from Sales Whisperer",
    html: data.html || data.message || "<p>Custom message content</p>",
    text: data.text || data.message || "Custom message content"
  })
};

const handler = async (req: Request): Promise<Response> => {
  console.log("Send email function called:", req.method);

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow POST requests
  if (req.method !== "POST") {
    console.error("Method not allowed:", req.method);
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  try {
    const { to, subject, template, type, data, from }: EmailRequest = await req.json();
    const emailType = type || template;
    console.log("Email request received:", { to, template, type, emailType, hasData: !!data });

    // Validate required fields
    if (!to || !emailType) {
      console.error("Missing required fields:", { to: !!to, emailType });
      return new Response(
        JSON.stringify({ error: "Missing required fields: to, type/template" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let emailContent: EmailTemplate;

    // Handle React Email templates
    if (emailType === 'invite') {
      const html = await renderAsync(
        React.createElement(InviteEmail, {
          email: data.email,
          inviteLink: data.inviteLink,
          expiresAt: data.expiresAt,
          invitedBy: data.invitedBy
        })
      );
      
      const text = `
WELCOME TO SALES WHISPERER

Hi there,

You've been invited to join Sales Whisperer, the AI-powered sales coaching platform.

To create your account, please visit the following link:
${data.inviteLink}

This invitation will expire on ${new Date(data.expiresAt).toLocaleDateString()}.

If you have any questions, please don't hesitate to reach out to our support team.

Best regards,
The Sales Whisperer Team
      `.trim();
      
      emailContent = {
        subject: "You're invited to join Sales Whisperer",
        html,
        text
      };
    } else if (emailType === 'registration-failure') {
      const html = await renderAsync(
        React.createElement(RegistrationFailureEmail, {
          failures: data.failures,
          totalCount: data.totalCount,
          timestamp: data.timestamp,
          adminDashboardUrl: data.adminDashboardUrl
        })
      );
      
      const text = `
SALES WHISPERER - REGISTRATION FAILURE ALERT

${data.totalCount} user registration failure(s) detected at ${data.timestamp}.

Recent failures:
${data.failures.map((f: any) => `- ${f.user_email}: ${f.error_message}`).join('\n')}

Please review these issues in the admin dashboard: ${data.adminDashboardUrl}

Sales Whisperer Admin System
      `.trim();
      
      emailContent = {
        subject: `FAILURE: User Registration Issues Detected - Sales Whisperer (${data.totalCount} affected)`,
        html,
        text
      };
    } else if (emailType === 'integration-connected') {
      const html = await renderAsync(
        React.createElement(IntegrationConnectedEmail, {
          integrationName: data.integrationName,
          integrationIcon: data.integrationIcon,
          userEmail: data.userEmail,
          features: data.features || [],
          dashboardUrl: data.dashboardUrl,
          connectedAt: data.connectedAt
        })
      );
      
      emailContent = {
        subject: `✅ ${data.integrationName} Integration Connected`,
        html,
        text: `✅ ${data.integrationName} Integration Connected\n\nYour ${data.integrationName} integration is now active and ready to use!\n\nConnected: ${new Date(data.connectedAt).toLocaleString()}\nAccount: ${data.userEmail}\n\nGo to your dashboard: ${data.dashboardUrl || 'https://app.saleswhisperer.net/dashboard'}\n\nSales Whisperer Team`
      };
    } else if (emailType === 'integration-failed') {
      const html = await renderAsync(
        React.createElement(IntegrationFailedEmail, {
          integrationName: data.integrationName,
          integrationIcon: data.integrationIcon,
          userEmail: data.userEmail,
          errorMessage: data.errorMessage,
          troubleshootingUrl: data.troubleshootingUrl,
          supportUrl: data.supportUrl,
          attemptedAt: data.attemptedAt
        })
      );
      
      emailContent = {
        subject: `❌ ${data.integrationName} Integration Failed`,
        html,
        text: `❌ ${data.integrationName} Integration Connection Failed\n\nAttempt Time: ${new Date(data.attemptedAt).toLocaleString()}\nAccount: ${data.userEmail}\nError: ${data.errorMessage}\n\nPlease check your account permissions and try again.\n\nTroubleshooting: ${data.troubleshootingUrl || 'https://saleswhisperer.net/help/integrations'}\n\nSales Whisperer Team`
      };
    } else if (emailType === 'integration-error') {
      const html = await renderAsync(
        React.createElement(IntegrationErrorEmail, {
          integrationName: data.integrationName,
          integrationIcon: data.integrationIcon,
          userEmail: data.userEmail,
          errorType: data.errorType,
          errorMessage: data.errorMessage,
          errorDetails: data.errorDetails,
          dashboardUrl: data.dashboardUrl,
          occurredAt: data.occurredAt
        })
      );
      
      emailContent = {
        subject: `⚠️ ${data.integrationName} Integration Error`,
        html,
        text: `⚠️ ${data.integrationName} Integration Error\n\nError Type: ${data.errorType}\nTime: ${new Date(data.occurredAt).toLocaleString()}\nAccount: ${data.userEmail}\nError: ${data.errorMessage}\n\nCheck your dashboard: ${data.dashboardUrl || 'https://app.saleswhisperer.net/dashboard'}\n\nSales Whisperer Team`
      };
    } else if (emailType === 'integration-tips') {
      const html = await renderAsync(
        React.createElement(IntegrationTipsEmail, {
          userEmail: data.userEmail,
          integrationName: data.integrationName,
          integrationIcon: data.integrationIcon,
          tips: data.tips || [],
          dashboardUrl: data.dashboardUrl,
          helpUrl: data.helpUrl
        })
      );
      
      emailContent = {
        subject: `💡 Tips to maximize your ${data.integrationName || 'integration'}`,
        html,
        text: `💡 Integration Pro Tips\n\nHi there!\n\nHere are some expert tips to help you maximize your ${data.integrationName || 'integration'} results:\n\n${data.tips?.map((tip: any, i: number) => `${i + 1}. ${tip.title}: ${tip.description}`).join('\n\n') || 'Check your dashboard for personalized tips.'}\n\nDashboard: ${data.dashboardUrl || 'https://app.saleswhisperer.net/dashboard'}\n\nSales Whisperer Team`
      };
    } else {
      // Use legacy templates for other types
      if (!emailTemplates[emailType]) {
        console.error("Invalid template:", emailType);
        return new Response(
          JSON.stringify({ 
            error: "Invalid template. Must be one of: invite, password-reset, welcome, custom, registration-failure, integration-connected, integration-failed, integration-error, integration-tips" 
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      emailContent = emailTemplates[emailType](data || {});
    }

    const emailSubject = subject || emailContent.subject;

    // Check if RESEND_API_KEY is available
    const apiKey = Deno.env.get("RESEND_API_KEY");
    console.log("RESEND_API_KEY available:", !!apiKey);
    console.log("RESEND_API_KEY first 10 chars:", apiKey ? apiKey.substring(0, 10) + "..." : "null");
    
    if (!apiKey) {
      throw new Error("RESEND_API_KEY environment variable is not set");
    }

    // Prepare email payload for Resend
    const emailPayload = {
      from: from || "Sales Whisperer <support@saleswhisperer.net>",
      to: Array.isArray(to) ? to : [to],
      subject: emailSubject,
      html: emailContent.html,
      text: emailContent.text,
    };

    console.log("Sending email with Resend:", { 
      to: Array.isArray(to) ? to.length + " recipients" : to,
      subject: emailSubject,
      template,
      fromAddress: emailPayload.from
    });

    console.log("Full Resend API request payload:", JSON.stringify(emailPayload, null, 2));

    // Initialize Resend client with validated API key
    const resend = new Resend(apiKey);
    console.log("Resend client initialized successfully");

    // Send email with Resend
    const emailResponse = await resend.emails.send(emailPayload);

    console.log("Raw Resend API response:", JSON.stringify(emailResponse, null, 2));
    console.log("Resend response status:", emailResponse ? "received" : "null");
    
    // Check if the response indicates success
    if (emailResponse.error) {
      console.error("Resend API returned error:", emailResponse.error);
      throw new Error(`Resend API error: ${JSON.stringify(emailResponse.error)}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailId: emailResponse.data?.id,
        message: "Email sent successfully" 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error: any) {
    console.error("Error in send-email function:", error);
    
    // Handle specific Resend API errors
    if (error.message?.includes("API key")) {
      return new Response(
        JSON.stringify({ error: "Email service configuration error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (error.message?.includes("domain")) {
      return new Response(
        JSON.stringify({ error: "Email domain not verified" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        error: "Failed to send email",
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);