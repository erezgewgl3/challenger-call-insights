import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string | string[];
  subject?: string;
  template: 'invite' | 'password-reset' | 'welcome' | 'custom';
  data: Record<string, any>;
  from?: string;
}

interface EmailTemplate {
  subject: string;
  html: string;
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
    `
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
    `
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
          <a href="${data.dashboardLink || '#'}" 
             style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Go to Dashboard
          </a>
        </div>
        <p>If you have any questions or need help getting started, our support team is here to help.</p>
        <p>Best regards,<br>The Sales Whisperer Team</p>
      </div>
    `
  }),

  custom: (data) => ({
    subject: data.subject || "Message from Sales Whisperer",
    html: data.html || data.message || "<p>Custom message content</p>"
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
    const { to, subject, template, data, from }: EmailRequest = await req.json();
    console.log("Email request received:", { to, template, hasData: !!data });

    // Validate required fields
    if (!to || !template) {
      console.error("Missing required fields:", { to: !!to, template });
      return new Response(
        JSON.stringify({ error: "Missing required fields: to, template" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate template
    if (!emailTemplates[template]) {
      console.error("Invalid template:", template);
      return new Response(
        JSON.stringify({ 
          error: "Invalid template. Must be one of: invite, password-reset, welcome, custom" 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Generate email content from template
    const emailContent = emailTemplates[template](data || {});
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
      from: from || "Sales Whisperer <noreply@send.saleswhisperer.net>",
      to: Array.isArray(to) ? to : [to],
      subject: emailSubject,
      html: emailContent.html,
    };

    console.log("Sending email with Resend:", { 
      to: Array.isArray(to) ? to.length + " recipients" : to,
      subject: emailSubject,
      template,
      fromAddress: emailPayload.from
    });

    console.log("Full Resend API request payload:", JSON.stringify(emailPayload, null, 2));

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