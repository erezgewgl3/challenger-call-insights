import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RegistrationFailure {
  id: string;
  user_id: string;
  user_email: string;
  error_message: string;
  attempted_at: string;
  alert_sent: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting registration failure monitoring...');

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Query for unalerted registration failures
    const { data: failures, error: failuresError } = await supabase
      .from('registration_failures')
      .select('*')
      .eq('alert_sent', false)
      .order('attempted_at', { ascending: false });

    if (failuresError) {
      console.error('Error fetching registration failures:', failuresError);
      throw failuresError;
    }

    console.log(`Found ${failures?.length || 0} unalerted registration failures`);

    if (!failures || failures.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No registration failures to alert on' 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Group failures by time window to avoid spam
    const recentFailures = failures.filter(failure => {
      const failureTime = new Date(failure.attempted_at);
      const now = new Date();
      const timeDiff = now.getTime() - failureTime.getTime();
      return timeDiff <= 30 * 60 * 1000; // Last 30 minutes
    });

    if (recentFailures.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No recent registration failures to alert on' 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Send email alert
    const emailData = {
      to: 'erezgew@yahoo.com',
      subject: `FAILURE: User Registration Issues Detected - Sales Whisperer (${recentFailures.length} affected)`,
      type: 'registration-failure',
      data: {
        failures: recentFailures,
        totalCount: recentFailures.length,
        timestamp: new Date().toISOString(),
        adminDashboardUrl: 'https://app.saleswhisperer.net/admin/user-management'
      }
    };

    console.log('Sending email alert for registration failures...');

    // Call send-email function
    const { data: emailResponse, error: emailError } = await supabase.functions.invoke('send-email', {
      body: emailData
    });

    if (emailError) {
      console.error('Error sending email alert:', emailError);
      throw emailError;
    }

    console.log('Email alert sent successfully:', emailResponse);

    // Mark failures as alerted
    const failureIds = recentFailures.map(f => f.id);
    const { error: updateError } = await supabase
      .from('registration_failures')
      .update({ 
        alert_sent: true, 
        alert_sent_at: new Date().toISOString() 
      })
      .in('id', failureIds);

    if (updateError) {
      console.error('Error updating alert status:', updateError);
      throw updateError;
    }

    console.log(`Successfully marked ${failureIds.length} failures as alerted`);

    return new Response(JSON.stringify({ 
      success: true,
      message: `Alert sent for ${recentFailures.length} registration failures`,
      alertedFailures: failureIds.length
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in monitor-registration-failures function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);