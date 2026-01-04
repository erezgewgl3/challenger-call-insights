import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// AI Model Configuration - must match analyze-transcript models
const AI_MODELS = {
  openai: 'gpt-5.2',
  claude: 'claude-sonnet-4-20250514'
} as const;

interface ProviderPingResult {
  ok: boolean;
  status?: number;
  error?: string;
  model: string;
  responseTime?: number;
}

interface DiagnosticsResult {
  claude: {
    hasKey: boolean;
    ping: ProviderPingResult | null;
  };
  openai: {
    hasKey: boolean;
    ping: ProviderPingResult | null;
  };
  timestamp: string;
}

async function pingClaude(): Promise<ProviderPingResult> {
  const claudeApiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!claudeApiKey) {
    return { ok: false, error: 'API key not configured', model: AI_MODELS.claude };
  }

  const startTime = Date.now();
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': claudeApiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: AI_MODELS.claude,
        max_tokens: 50,
        messages: [{ role: 'user', content: 'Say "OK" if you can read this.' }],
      }),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude ping failed:', response.status, errorText);
      return { 
        ok: false, 
        status: response.status, 
        error: `API error: ${response.status} - ${errorText.substring(0, 200)}`,
        model: AI_MODELS.claude,
        responseTime
      };
    }

    const data = await response.json();
    const content = data.content?.[0]?.text || '';
    
    return { 
      ok: true, 
      status: response.status,
      model: AI_MODELS.claude,
      responseTime
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    if (error.name === 'AbortError') {
      return { 
        ok: false, 
        error: 'Request timed out after 15 seconds',
        model: AI_MODELS.claude,
        responseTime
      };
    }
    
    return { 
      ok: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      model: AI_MODELS.claude,
      responseTime
    };
  }
}

async function pingOpenAI(): Promise<ProviderPingResult> {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIApiKey) {
    return { ok: false, error: 'API key not configured', model: AI_MODELS.openai };
  }

  const startTime = Date.now();
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: AI_MODELS.openai,
        messages: [{ role: 'user', content: 'Say "OK" if you can read this.' }],
        max_completion_tokens: 50,
      }),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI ping failed:', response.status, errorText);
      return { 
        ok: false, 
        status: response.status, 
        error: `API error: ${response.status} - ${errorText.substring(0, 200)}`,
        model: AI_MODELS.openai,
        responseTime
      };
    }

    const data = await response.json();
    
    return { 
      ok: true, 
      status: response.status,
      model: AI_MODELS.openai,
      responseTime
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    if (error.name === 'AbortError') {
      return { 
        ok: false, 
        error: 'Request timed out after 15 seconds',
        model: AI_MODELS.openai,
        responseTime
      };
    }
    
    return { 
      ok: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      model: AI_MODELS.openai,
      responseTime
    };
  }
}

serve(async (req) => {
  console.log('🔍 [AI-DIAGNOSTICS] Starting diagnostics check');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const hasClaudeKey = !!Deno.env.get('ANTHROPIC_API_KEY');
    const hasOpenAIKey = !!Deno.env.get('OPENAI_API_KEY');
    
    console.log('🔍 [AI-DIAGNOSTICS] Key status:', { hasClaudeKey, hasOpenAIKey });

    // Run pings in parallel
    const [claudePing, openaiPing] = await Promise.all([
      hasClaudeKey ? pingClaude() : Promise.resolve(null),
      hasOpenAIKey ? pingOpenAI() : Promise.resolve(null),
    ]);

    const result: DiagnosticsResult = {
      claude: {
        hasKey: hasClaudeKey,
        ping: claudePing,
      },
      openai: {
        hasKey: hasOpenAIKey,
        ping: openaiPing,
      },
      timestamp: new Date().toISOString(),
    };

    console.log('🔍 [AI-DIAGNOSTICS] Results:', JSON.stringify(result, null, 2));

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('🔍 [AI-DIAGNOSTICS] Error:', error);
    
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
