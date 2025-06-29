
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalysisRequest {
  transcriptId: string;
  userId: string;
  transcriptText: string;
  durationMinutes: number;
  accountId?: string;
}

interface ParsedAnalysis {
  challengerScores: {
    teaching: number | null;
    tailoring: number | null;
    control: number | null;
  };
  guidance: {
    recommendation: string | null;
    message: string | null;
    keyInsights: string[];
    nextSteps: string[];
  };
  emailFollowUp: {
    subject: string | null;
    body: string | null;
    timing: string | null;
    channel: string | null;
  };
  // New fields for Sales Intelligence
  participants?: any;
  callSummary?: any;
  keyTakeaways?: string[];
  recommendations?: any;
  reasoning?: any;
  actionPlan?: any;
}

serve(async (req) => {
  console.log('🔍 [INIT] Analyze transcript function started');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { transcriptId, userId, transcriptText, durationMinutes, accountId }: AnalysisRequest = await req.json();
    
    console.log('🔍 [REQUEST] Analysis request received:', { 
      transcriptId, 
      userId, 
      textLength: transcriptText?.length, 
      durationMinutes 
    });

    // Update transcript status to processing
    console.log('🔍 [DB] Updating transcript status to processing');
    const { error: statusError } = await supabase
      .from('transcripts')
      .update({ 
        status: 'processing',
        processed_at: new Date().toISOString()
      })
      .eq('id', transcriptId);

    if (statusError) {
      console.error('🔍 [ERROR] Failed to update transcript status:', statusError);
      // Don't throw here, continue with analysis
    }

    // Get active prompt
    console.log('🔍 [PROMPT] Fetching active prompt');
    const { data: promptData, error: promptError } = await supabase
      .rpc('get_active_prompt');

    if (promptError) {
      console.error('🔍 [ERROR] Failed to fetch active prompt:', promptError);
      await updateTranscriptError(supabase, transcriptId, 'Failed to fetch active prompt');
      throw new Error('Failed to fetch active prompt');
    }

    const activePrompt = promptData?.[0];
    if (!activePrompt) {
      await updateTranscriptError(supabase, transcriptId, 'No active prompt found');
      throw new Error('No active prompt found');
    }

    console.log('🔍 [PROMPT] Active prompt found:', activePrompt.prompt_name);

    // Determine processing strategy
    const strategy = durationMinutes <= 30 ? 'single_pass' : 
                    durationMinutes <= 90 ? 'smart_chunking' : 'hierarchical';
    
    console.log('🔍 [STRATEGY] Selected strategy:', strategy, 'for duration:', durationMinutes);

    // Build prompt
    const finalPrompt = activePrompt.prompt_text
      .replace('{{conversation}}', transcriptText)
      .replace('{{account_context}}', '')
      .replace('{{user_context}}', '');

    console.log('🔍 [PROMPT] Prompt built, length:', finalPrompt.length);

    // Call OpenAI
    const openAIResponse = await callOpenAI(finalPrompt);
    console.log('🔍 [AI] OpenAI response received, length:', openAIResponse.length);

    // Parse AI response
    const parsedResult = parseAIResponse(openAIResponse);
    console.log('🔍 [PARSE] AI response parsed successfully');

    // Save analysis results with proper error handling
    console.log('🔍 [DB] Saving analysis results to database');
    const analysisPayload = {
      transcript_id: transcriptId,
      challenger_scores: parsedResult.challengerScores,
      guidance: parsedResult.guidance,
      email_followup: parsedResult.emailFollowUp,
      participants: parsedResult.participants || null,
      call_summary: parsedResult.callSummary || null,
      key_takeaways: parsedResult.keyTakeaways || [],
      recommendations: parsedResult.recommendations || null,
      reasoning: parsedResult.reasoning || null,
      action_plan: parsedResult.actionPlan || null
    };

    const { data: analysisData, error: analysisError } = await supabase
      .from('conversation_analysis')
      .insert(analysisPayload)
      .select()
      .single();

    if (analysisError) {
      console.error('🔍 [ERROR] Failed to save analysis results:', analysisError);
      await updateTranscriptError(supabase, transcriptId, `Analysis save failed: ${analysisError.message}`);
      throw new Error(`Failed to save analysis: ${analysisError.message}`);
    }

    console.log('🔍 [SUCCESS] Analysis saved with ID:', analysisData.id);

    // Update transcript status to completed
    console.log('🔍 [DB] Updating transcript status to completed');
    const { error: completeError } = await supabase
      .from('transcripts')
      .update({ 
        status: 'completed',
        error_message: null // Clear any previous error
      })
      .eq('id', transcriptId);

    if (completeError) {
      console.error('🔍 [ERROR] Failed to update transcript to completed:', completeError);
      // Don't throw, analysis is saved successfully
    }

    console.log('🔍 [COMPLETE] Analysis pipeline completed successfully');

    return new Response(JSON.stringify({
      success: true,
      analysisId: analysisData.id,
      transcriptId,
      strategy,
      message: 'Analysis completed successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('🔍 [FATAL] Analysis pipeline failed:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Helper function to update transcript with error status
async function updateTranscriptError(supabase: any, transcriptId: string, errorMessage: string) {
  await supabase
    .from('transcripts')
    .update({ 
      status: 'error',
      error_message: errorMessage,
      processed_at: new Date().toISOString()
    })
    .eq('id', transcriptId);
}

async function callOpenAI(prompt: string): Promise<string> {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIApiKey) {
    throw new Error('OpenAI API key not found');
  }

  console.log('🔍 [API] Starting OpenAI API call');
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { 
          role: 'system', 
          content: 'You are a sales intelligence AI that analyzes sales conversations and provides actionable insights in JSON format.' 
        },
        { role: 'user', content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('🔍 [ERROR] OpenAI API error:', response.status, errorText);
    throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  console.log('🔍 [API] OpenAI response received successfully');
  
  return data.choices[0].message.content;
}

function parseAIResponse(aiResponse: string): ParsedAnalysis {
  console.log('🔍 [PARSE] Starting AI response parsing');
  
  try {
    const parsed = JSON.parse(aiResponse);
    console.log('🔍 [PARSE] JSON parsed successfully, keys:', Object.keys(parsed));
    
    // Extract data using multiple possible paths
    const result: ParsedAnalysis = {
      challengerScores: extractChallengerScores(parsed),
      guidance: extractGuidance(parsed),
      emailFollowUp: extractEmailFollowUp(parsed),
      // New fields for Sales Intelligence
      participants: parsed.participants || null,
      callSummary: parsed.callSummary || null,
      keyTakeaways: parsed.keyTakeaways || [],
      recommendations: parsed.recommendations || null,
      reasoning: parsed.reasoning || null,
      actionPlan: parsed.actionPlan || null
    };
    
    console.log('🔍 [PARSE] Final parsed result:', {
      hasChallengerScores: !!result.challengerScores,
      hasGuidance: !!result.guidance,
      hasEmailFollowUp: !!result.emailFollowUp,
      hasParticipants: !!result.participants,
      hasCallSummary: !!result.callSummary,
      keyTakeawaysCount: result.keyTakeaways?.length || 0,
      hasRecommendations: !!result.recommendations,
      hasReasoning: !!result.reasoning,
      hasActionPlan: !!result.actionPlan
    });
    
    return result;
  } catch (error) {
    console.error('🔍 [ERROR] Failed to parse AI response:', error);
    console.error('🔍 [ERROR] Raw response:', aiResponse?.substring(0, 500));
    
    // Return empty structure on parse failure
    return {
      challengerScores: { teaching: null, tailoring: null, control: null },
      guidance: { recommendation: null, message: null, keyInsights: [], nextSteps: [] },
      emailFollowUp: { subject: null, body: null, timing: null, channel: null },
      participants: null,
      callSummary: null,
      keyTakeaways: [],
      recommendations: null,
      reasoning: null,
      actionPlan: null
    };
  }
}

function extractChallengerScores(data: any) {
  const scores = data.challengerScores || data.challenger_scores || {};
  return {
    teaching: scores.teaching || null,
    tailoring: scores.tailoring || null,
    control: scores.control || null
  };
}

function extractGuidance(data: any) {
  const guidance = data.guidance || {};
  return {
    recommendation: guidance.recommendation || null,
    message: guidance.message || null,
    keyInsights: guidance.keyInsights || guidance.key_insights || [],
    nextSteps: guidance.nextSteps || guidance.next_steps || []
  };
}

function extractEmailFollowUp(data: any) {
  const email = data.emailFollowUp || data.email_followup || {};
  return {
    subject: email.subject || null,
    body: email.body || null,
    timing: email.timing || null,
    channel: email.channel || null
  };
}
