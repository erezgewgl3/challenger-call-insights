
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify the user session
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { promptId, testData } = await req.json();

    // Get the prompt - either specific ID or default prompt
    let prompt;
    if (promptId) {
      const { data, error: promptError } = await supabase
        .from('prompts')
        .select('*')
        .eq('id', promptId)
        .eq('is_active', true)
        .single();

      if (promptError || !data) {
        console.error('Prompt fetch error:', promptError);
        return new Response(JSON.stringify({ error: 'Prompt not found or not active' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      prompt = data;
    } else {
      // Get the default prompt
      const { data, error: defaultError } = await supabase
        .from('prompts')
        .select('*')
        .eq('is_default', true)
        .single();

      if (defaultError || !data) {
        console.error('Default prompt fetch error:', defaultError);
        return new Response(JSON.stringify({ error: 'No default prompt configured' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      prompt = data;
    }

    // Substitute variables in the prompt
    let processedPrompt = prompt.prompt_text;
    
    if (testData) {
      // Replace variables with test data
      processedPrompt = processedPrompt
        .replace(/\{\{conversation\}\}/g, testData.conversation || '[Sample conversation content]')
        .replace(/\{\{account_context\}\}/g, testData.account_context || '[Sample account context]')
        .replace(/\{\{user_context\}\}/g, testData.user_context || '[Sample user context]');
    }

    let aiResponse;
    const startTime = Date.now();

    // Determine which AI provider to use
    // For default prompts, use default_ai_provider, otherwise use ai_provider
    const aiProviderToUse = prompt.is_default ? (prompt.default_ai_provider || prompt.ai_provider) : prompt.ai_provider;

    if (aiProviderToUse === 'openai') {
      if (!openaiApiKey) {
        console.error('OpenAI API key not configured');
        return new Response(JSON.stringify({ error: 'OpenAI API key not configured' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('Making OpenAI API call with gpt-4.1-2025-04-14');
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4.1-2025-04-14',
          messages: [
            { role: 'user', content: processedPrompt }
          ],
          response_format: { type: "json_object" },
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('OpenAI API error:', error);
        return new Response(JSON.stringify({ error: 'ChatGPT API request failed', details: error }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const data = await response.json();
      aiResponse = data.choices[0].message.content;

    } else if (aiProviderToUse === 'claude') {
      if (!anthropicApiKey) {
        console.error('Anthropic API key not configured');
        return new Response(JSON.stringify({ error: 'Anthropic API key not configured' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('Making Claude API call with claude-3-5-sonnet-20241022');
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': anthropicApiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 2000,
          messages: [
            { role: 'user', content: processedPrompt }
          ],
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Claude API error:', error);
        return new Response(JSON.stringify({ error: 'Claude API request failed', details: error }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const data = await response.json();
      aiResponse = data.content[0].text;
    } else {
      return new Response(JSON.stringify({ error: 'Unsupported AI provider' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const processingTime = Date.now() - startTime;

    // Try to parse the AI response as JSON - return blank if it fails
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(aiResponse);
    } catch (parseError) {
      console.warn('AI response is not valid JSON, returning blank response:', aiResponse);
      parsedResponse = {};
    }

    return new Response(JSON.stringify({
      success: true,
      response: parsedResponse,
      processing_time_ms: processingTime,
      ai_provider: aiProviderToUse,
      prompt_version: prompt.version_number,
      is_default_prompt: prompt.is_default
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in execute-ai-prompt function:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
