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
  challengerScores: any;
  guidance: any;
  emailFollowUp: any;
  participants?: any;
  callSummary?: any;
  keyTakeaways?: any;
  recommendations?: any;
  reasoning?: any;
  actionPlan?: any;
}

// Shared deal heat calculation logic
function calculateDealHeat(analysis: any): string {
  const painLevel = analysis.call_summary?.painSeverity?.level || 'low'
  const indicators = analysis.call_summary?.painSeverity?.indicators || []
  
  const criticalFactors = analysis.call_summary?.urgencyDrivers?.criticalFactors || []
  const businessFactors = analysis.call_summary?.urgencyDrivers?.businessFactors || []
  const generalFactors = analysis_call_summary?.urgencyDrivers?.generalFactors || []
  
  const urgencyScore = (criticalFactors.length * 3) + 
                      (businessFactors.length * 2) + 
                      (generalFactors.length * 1)
  
  const buyingSignals = analysis.call_summary?.buyingSignalsAnalysis || {}
  const commitmentSignals = buyingSignals.commitmentSignals || []
  const engagementSignals = buyingSignals.engagementSignals || []
  
  const timelineAnalysis = analysis.call_summary?.timelineAnalysis || {}
  const statedTimeline = timelineAnalysis.statedTimeline || ''
  const businessDriver = timelineAnalysis.businessDriver || ''
  
  let dealScore = urgencyScore
  
  dealScore += commitmentSignals.length * 2
  dealScore += engagementSignals.length * 1
  
  const timelineText = (statedTimeline + ' ' + businessDriver).toLowerCase()
  if (timelineText.includes('friday') || timelineText.includes('this week') || 
      timelineText.includes('immediate') || timelineText.includes('asap')) {
    dealScore += 3
  }
  if (timelineText.includes('contract') || timelineText.includes('execute') || 
      timelineText.includes('sign') || timelineText.includes('docs')) {
    dealScore += 2
  }
  
  const resistanceData = analysis.call_summary?.resistanceAnalysis || {}
  const resistanceLevel = resistanceData.level || 'none'
  const resistanceSignals = resistanceData.signals || []
  
  let resistancePenalty = 0
  
  if (resistanceLevel === 'high') {
    resistancePenalty += 8
  } else if (resistanceLevel === 'medium') {
    resistancePenalty += 4
  }
  
  const allResistanceText = resistanceSignals.join(' ').toLowerCase()
  
  if (allResistanceText.includes('not actively looking') || 
      allResistanceText.includes('not looking for') ||
      allResistanceText.includes('no immediate need')) {
    resistancePenalty += 3
  }
  
  if (allResistanceText.includes('budget constraints') || 
      allResistanceText.includes('budget concerns') ||
      allResistanceText.includes('cost concerns')) {
    resistancePenalty += 2
  }
  
  if (allResistanceText.includes('satisfied with current') || 
      allResistanceText.includes('current solution works')) {
    resistancePenalty += 2
  }
  
  if (allResistanceText.includes('timing concerns') || 
      allResistanceText.includes('not the right time')) {
    resistancePenalty += 1
  }
  
  dealScore = Math.max(0, dealScore - resistancePenalty)
  
  if (
    painLevel === 'high' ||
    criticalFactors.length >= 1 ||
    dealScore >= 8 ||
    (commitmentSignals.length >= 2 && dealScore >= 6) ||
    (painLevel === 'medium' && commitmentSignals.length >= 2 && dealScore >= 5)
  ) {
    return 'HIGH'
  } else if (
    painLevel === 'medium' || 
    (businessFactors || []).length >= 1 ||
    dealScore >= 3
  ) {
    return 'MEDIUM'
  }
  
  return 'LOW'
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

    // Update transcript status to processing (triggers real-time update)
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
    }

    // Get active prompt directly from prompts table
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
      const errorMsg = 'No active prompt found. Please ensure an admin has activated a prompt.';
      console.error('🔍 [ERROR]', errorMsg);
      await updateTranscriptError(supabase, transcriptId, errorMsg);
      throw new Error(errorMsg);
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

    // Call AI (default to OpenAI with Claude fallback)
    console.log('🔍 [AI] Calling OpenAI (default provider)');
    let aiResponse: string;
    
    try {
      aiResponse = await callOpenAI(finalPrompt);
    } catch (openAIError) {
      console.error('🔍 [ERROR] OpenAI failed, trying Claude fallback:', openAIError);
      try {
        aiResponse = await callClaude(finalPrompt);
      } catch (claudeError) {
        console.error('🔍 [ERROR] Both AI providers failed:', claudeError);
        await updateTranscriptError(supabase, transcriptId, `AI analysis failed: ${claudeError.message}`);
        throw new Error(`AI analysis failed: ${claudeError.message}`);
      }
    }
    
    console.log('🔍 [AI] AI response received, length:', aiResponse.length);

    // Parse AI response
    const parsedResult = parseAIResponse(aiResponse);
    console.log('🔍 [PARSE] AI response parsed successfully');

    // Calculate deal heat using the same logic as frontend
    console.log('🔍 [HEAT] Calculating deal heat');
    const heatLevel = calculateDealHeat(parsedResult);
    console.log('🔍 [HEAT] Deal heat calculated:', heatLevel);

    // Save analysis results with heat level
    console.log('🔍 [DB] Saving analysis results to database');
    const analysisPayload = {
      transcript_id: transcriptId,
      challenger_scores: parsedResult.challengerScores,
      guidance: parsedResult.guidance,
      email_followup: parsedResult.emailFollowUp,
      participants: parsedResult.participants,
      call_summary: parsedResult.callSummary,
      key_takeaways: parsedResult.keyTakeaways,
      recommendations: parsedResult.recommendations,
      reasoning: parsedResult.reasoning,
      action_plan: parsedResult.actionPlan,
      heat_level: heatLevel
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

    console.log('🔍 [SUCCESS] Analysis saved with ID:', analysisData.id, 'Heat Level:', heatLevel);

    // Update transcript status to completed (triggers real-time update)
    console.log('🔍 [DB] Updating transcript status to completed');
    const { error: completeError } = await supabase
      .from('transcripts')
      .update({ 
        status: 'completed',
        error_message: null
      })
      .eq('id', transcriptId);

    if (completeError) {
      console.error('🔍 [ERROR] Failed to update transcript to completed:', completeError);
    }

    console.log('🔍 [COMPLETE] Analysis pipeline completed successfully');

    return new Response(JSON.stringify({
      success: true,
      analysisId: analysisData.id,
      transcriptId,
      strategy,
      aiProvider: 'openai',
      heatLevel,
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

async function callClaude(prompt: string): Promise<string> {
  const claudeApiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!claudeApiKey) {
    throw new Error('Claude API key not found');
  }

  console.log('🔍 [API] Starting Claude API call');
  
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${claudeApiKey}`,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      messages: [
        { 
          role: 'user', 
          content: `You are a sales intelligence AI that analyzes sales conversations and provides actionable insights in JSON format. Please analyze the following:\n\n${prompt}` 
        }
      ],
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('🔍 [ERROR] Claude API error:', response.status, errorText);
    throw new Error(`Claude API error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  console.log('🔍 [API] Claude response received successfully');
  
  return data.content[0].text;
}

function parseAIResponse(aiResponse: string): ParsedAnalysis {
  console.log('🔍 [PARSE] Starting AI response parsing');
  
  try {
    const parsed = JSON.parse(aiResponse);
    console.log('🔍 [PARSE] JSON parsed successfully, keys:', Object.keys(parsed));
    
    const result: ParsedAnalysis = {
      challengerScores: parsed.challengerScores || parsed.challenger_scores || null,
      guidance: parsed.guidance || null,
      emailFollowUp: parsed.emailFollowUp || parsed.email_followup || null,
      participants: parsed.participants || null,
      callSummary: parsed.callSummary || parsed.call_summary || null,
      keyTakeaways: parsed.keyTakeaways || parsed.key_takeaways || null,
      recommendations: parsed.recommendations || null,
      reasoning: parsed.reasoning || null,
      actionPlan: parsed.actionPlan || parsed.action_plan || null
    };
    
    console.log('🔍 [PARSE] Final parsed result stored directly from AI response');
    
    return result;
  } catch (error) {
    console.error('🔍 [ERROR] Failed to parse AI response:', error);
    console.error('🔍 [ERROR] Raw response:', aiResponse?.substring(0, 500));
    
    return {
      challengerScores: null,
      guidance: null,
      emailFollowUp: null,
      participants: null,
      callSummary: null,
      keyTakeaways: null,
      recommendations: null,
      reasoning: null,
      actionPlan: null
    };
  }
}
