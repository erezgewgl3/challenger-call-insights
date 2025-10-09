import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SecurityAlertPayload {
  eventType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: Record<string, any>;
  timestamp: string;
  userId?: string;
  ipAddress?: string;
}

const generateAlertEmailHTML = (alert: SecurityAlertPayload) => `
<!DOCTYPE html>
<html>
<head>
  <title>Security Alert - Sales Whisperer</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
    .alert-box { 
      border-left: 4px solid ${alert.severity === 'critical' ? '#dc2626' : alert.severity === 'high' ? '#ea580c' : '#f59e0b'};
      background: ${alert.severity === 'critical' ? '#fef2f2' : alert.severity === 'high' ? '#fff7ed' : '#fffbeb'};
      padding: 15px; 
      margin: 20px 0;
      border-radius: 4px;
    }
    .severity-badge {
      display: inline-block;
      padding: 4px 12px;
      background: ${alert.severity === 'critical' ? '#dc2626' : alert.severity === 'high' ? '#ea580c' : '#f59e0b'};
      color: white;
      border-radius: 4px;
      font-size: 12px;
      font-weight: bold;
      text-transform: uppercase;
      margin-bottom: 10px;
    }
    .detail-row { margin: 8px 0; padding: 8px; background: white; border-radius: 4px; }
    .detail-label { font-weight: bold; color: #475569; }
    .detail-value { color: #0f172a; margin-left: 8px; }
    .action-button {
      display: inline-block;
      background: #2563eb;
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 4px;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <h1>🚨 Security Alert</h1>
  
  <div class="alert-box">
    <div class="severity-badge">${alert.severity} Severity</div>
    <h2 style="margin: 10px 0;">${formatEventType(alert.eventType)}</h2>
    <p style="color: #64748b; margin: 5px 0;">Detected at ${new Date(alert.timestamp).toLocaleString()}</p>
  </div>

  <div style="background: #f8fafc; padding: 15px; border-radius: 4px; margin: 20px 0;">
    <h3 style="margin-top: 0;">Event Details</h3>
    ${Object.entries(alert.details).map(([key, value]) => `
      <div class="detail-row">
        <span class="detail-label">${formatLabel(key)}:</span>
        <span class="detail-value">${value}</span>
      </div>
    `).join('')}
    ${alert.ipAddress ? `
      <div class="detail-row">
        <span class="detail-label">IP Address:</span>
        <span class="detail-value">${alert.ipAddress}</span>
      </div>
    ` : ''}
    ${alert.userId ? `
      <div class="detail-row">
        <span class="detail-label">User ID:</span>
        <span class="detail-value">${alert.userId}</span>
      </div>
    ` : ''}
  </div>

  <a href="https://jtunkyfoadoowpymibjr.supabase.co/project/jtunkyfoadoowpymibjr" class="action-button">
    View Security Dashboard
  </a>

  <p style="color: #64748b; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
    This is an automated security alert from Sales Whisperer. If you believe this is a false positive, 
    please review your security settings.
  </p>
</body>
</html>`;

function formatEventType(type: string): string {
  return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

function formatLabel(key: string): string {
  return key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

async function getAdminEmails(supabaseClient: any): Promise<string[]> {
  const { data: admins, error } = await supabaseClient
    .from('users')
    .select('email')
    .eq('role', 'admin');
  
  if (error) {
    console.error('Error fetching admin emails:', error);
    return [];
  }
  
  return admins?.map((admin: any) => admin.email) || [];
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const payload: SecurityAlertPayload = await req.json();
    
    console.log('Processing security alert:', payload.eventType, 'severity:', payload.severity);

    // Only send emails for high and critical severity events
    if (payload.severity !== 'high' && payload.severity !== 'critical') {
      console.log('Skipping email for non-critical event');
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Event logged but not critical enough for email alert' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get admin emails
    const adminEmails = await getAdminEmails(supabase);
    
    if (adminEmails.length === 0) {
      console.warn('No admin emails found');
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'No admin emails configured' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const html = generateAlertEmailHTML(payload);

    // Send via Resend API
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Security Alerts <security@saleswhisperer.net>',
        to: adminEmails,
        subject: `🚨 ${payload.severity.toUpperCase()} Security Alert: ${formatEventType(payload.eventType)}`,
        html
      })
    });

    const result = await resendResponse.json();
    
    if (!resendResponse.ok) {
      console.error('Resend API error:', result);
      throw new Error(`Failed to send email: ${result.message || 'Unknown error'}`);
    }

    console.log('Security alert email sent successfully:', result);

    return new Response(JSON.stringify({ 
      success: true, 
      emailsSent: adminEmails.length,
      result 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error sending security alert:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};

serve(handler);
