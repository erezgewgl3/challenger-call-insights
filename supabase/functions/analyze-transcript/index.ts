
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

interface AnalysisRequest {
  transcriptId: string;
  userId: string;
  transcriptText: string;
  durationMinutes: number;
  accountId?: string;
}

interface ChallengerScores {
  teaching: number;
  tailoring: number;
  control: number;
}

interface AnalysisResult {
  challengerScores: ChallengerScores;
  guidance: {
    recommendation: string;
    message: string;
    keyInsights: string[];
    nextSteps: string[];
  };
  emailFollowUp: {
    subject: string;
    body: string;
    timing: string;
    channel: string;
  };
}

type AnalysisStrategy = 'single_pass' | 'smart_chunking' | 'hierarchical';

class HybridAnalysisEngine {
  private supabase;
  
  constructor() {
    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
  }

  selectStrategy(durationMinutes: number): AnalysisStrategy {
    if (durationMinutes <= 30) return 'single_pass';
    if (durationMinutes <= 90) return 'smart_chunking';
    return 'hierarchical';
  }

  async getActivePrompt() {
    const { data: activePrompt, error } = await this.supabase
      .rpc('get_active_prompt');

    if (error) {
      console.error('Failed to get active prompt:', error);
      throw new Error('No active prompt configured');
    }

    if (!activePrompt || activePrompt.length === 0) {
      throw new Error('No active prompt found');
    }

    return activePrompt[0];
  }

  async getAccountContext(accountId?: string): Promise<string> {
    if (!accountId) return '';

    try {
      const { data: account, error } = await this.supabase
        .from('accounts')
        .select('name, deal_stage, notes')
        .eq('id', accountId)
        .single();

      if (error || !account) return '';

      return `Account: ${account.name}\nDeal Stage: ${account.deal_stage || 'Unknown'}\nNotes: ${account.notes || 'None'}`;
    } catch (error) {
      console.warn('Failed to get account context:', error);
      return '';
    }
  }

  buildPrompt(transcriptText: string, accountContext: string, promptTemplate: string): string {
    return promptTemplate
      .replace(/\{\{conversation\}\}/g, transcriptText)
      .replace(/\{\{account_context\}\}/g, accountContext)
      .replace(/\{\{user_context\}\}/g, ''); // User context not implemented yet
  }

  async callOpenAI(prompt: string): Promise<AnalysisResult> {
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are a sales coaching AI that analyzes conversations using the Challenger Sales methodology. Always respond with valid JSON containing challengerScores (teaching, tailoring, control as integers 1-5), guidance (recommendation, message, keyInsights array, nextSteps array), and emailFollowUp (subject, body, timing, channel).' 
          },
          { role: 'user', content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        timeout: 60000
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    return this.parseAndValidateResponse(content);
  }

  async callClaude(prompt: string): Promise<AnalysisResult> {
    if (!anthropicApiKey) {
      throw new Error('Anthropic API key not configured');
    }

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
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Claude API error: ${errorText}`);
    }

    const data = await response.json();
    const content = data.content[0].text;
    
    return this.parseAndValidateResponse(content);
  }

  parseAndValidateResponse(content: string): AnalysisResult {
    // Multi-layer JSON parsing with fallbacks
    let parsed;
    
    try {
      parsed = JSON.parse(content);
    } catch (error) {
      // Try to extract JSON from text
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch (innerError) {
          throw new Error('Failed to parse AI response as JSON');
        }
      } else {
        throw new Error('No valid JSON found in AI response');
      }
    }

    // Validate and fill in missing fields with defaults
    const result: AnalysisResult = {
      challengerScores: {
        teaching: this.validateScore(parsed.challengerScores?.teaching) || 3,
        tailoring: this.validateScore(parsed.challengerScores?.tailoring) || 3,
        control: this.validateScore(parsed.challengerScores?.control) || 3,
      },
      guidance: {
        recommendation: parsed.guidance?.recommendation || 'Continue',
        message: parsed.guidance?.message || 'Analysis completed successfully',
        keyInsights: Array.isArray(parsed.guidance?.keyInsights) ? parsed.guidance.keyInsights : ['Call analyzed'],
        nextSteps: Array.isArray(parsed.guidance?.nextSteps) ? parsed.guidance.nextSteps : ['Follow up as planned'],
      },
      emailFollowUp: {
        subject: parsed.emailFollowUp?.subject || 'Following up on our conversation',
        body: parsed.emailFollowUp?.body || 'Thank you for taking the time to speak with me today.',
        timing: parsed.emailFollowUp?.timing || '24 hours',
        channel: parsed.emailFollowUp?.channel || 'Email',
      }
    };

    return result;
  }

  validateScore(score: any): number | null {
    const num = parseInt(score);
    if (isNaN(num) || num < 1 || num > 5) return null;
    return num;
  }

  async singlePassAnalysis(transcriptText: string, accountContext: string, promptTemplate: string): Promise<AnalysisResult> {
    const prompt = this.buildPrompt(transcriptText, accountContext, promptTemplate);
    
    try {
      return await this.callOpenAI(prompt);
    } catch (error) {
      console.warn('OpenAI failed, trying Claude:', error);
      return await this.callClaude(prompt);
    }
  }

  async smartChunkingAnalysis(transcriptText: string, accountContext: string, promptTemplate: string): Promise<AnalysisResult> {
    const chunks = this.intelligentChunk(transcriptText, 3);
    const analyses: AnalysisResult[] = [];

    for (const chunk of chunks) {
      try {
        const chunkPrompt = this.buildPrompt(chunk, accountContext, promptTemplate);
        const analysis = await this.callOpenAI(chunkPrompt);
        analyses.push(analysis);
      } catch (error) {
        console.warn('Chunk analysis failed, trying Claude:', error);
        const chunkPrompt = this.buildPrompt(chunk, accountContext, promptTemplate);
        const analysis = await this.callClaude(chunkPrompt);
        analyses.push(analysis);
      }
    }

    return this.mergeAnalyses(analyses);
  }

  async hierarchicalAnalysis(transcriptText: string, accountContext: string, promptTemplate: string): Promise<AnalysisResult> {
    const chunks = this.intelligentChunk(transcriptText, 6);
    const chunkAnalyses: AnalysisResult[] = [];

    // Analyze chunks
    for (const chunk of chunks) {
      try {
        const chunkPrompt = this.buildPrompt(chunk, accountContext, promptTemplate);
        const analysis = await this.callOpenAI(chunkPrompt);
        chunkAnalyses.push(analysis);
      } catch (error) {
        console.warn('Hierarchical chunk failed, trying Claude:', error);
        const chunkPrompt = this.buildPrompt(chunk, accountContext, promptTemplate);
        const analysis = await this.callClaude(chunkPrompt);
        chunkAnalyses.push(analysis);
      }
    }

    // Merge intermediate results
    const intermediateResult = this.mergeAnalyses(chunkAnalyses);
    
    // Final synthesis
    const synthesisPrompt = this.buildSynthesisPrompt(intermediateResult, accountContext);
    
    try {
      return await this.callOpenAI(synthesisPrompt);
    } catch (error) {
      console.warn('Final synthesis failed, trying Claude:', error);
      return await this.callClaude(synthesisPrompt);
    }
  }

  intelligentChunk(text: string, numChunks: number): string[] {
    // Split by sentences and paragraphs for natural boundaries
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const chunkSize = Math.ceil(sentences.length / numChunks);
    const chunks: string[] = [];

    for (let i = 0; i < sentences.length; i += chunkSize) {
      const chunk = sentences.slice(i, i + chunkSize).join('. ').trim();
      if (chunk) {
        chunks.push(chunk + '.');
      }
    }

    return chunks.length > 0 ? chunks : [text];
  }

  mergeAnalyses(analyses: AnalysisResult[]): AnalysisResult {
    if (analyses.length === 0) {
      throw new Error('No analyses to merge');
    }

    if (analyses.length === 1) {
      return analyses[0];
    }

    // Average scores
    const avgScores = {
      teaching: Math.round(analyses.reduce((sum, a) => sum + a.challengerScores.teaching, 0) / analyses.length),
      tailoring: Math.round(analyses.reduce((sum, a) => sum + a.challengerScores.tailoring, 0) / analyses.length),
      control: Math.round(analyses.reduce((sum, a) => sum + a.challengerScores.control, 0) / analyses.length),
    };

    // Merge insights and next steps
    const allInsights = analyses.flatMap(a => a.guidance.keyInsights);
    const allNextSteps = analyses.flatMap(a => a.guidance.nextSteps);
    
    // Remove duplicates and take top items
    const uniqueInsights = [...new Set(allInsights)].slice(0, 5);
    const uniqueNextSteps = [...new Set(allNextSteps)].slice(0, 3);

    // Use guidance from highest scoring analysis
    const bestAnalysis = analyses.reduce((best, current) => {
      const bestTotal = best.challengerScores.teaching + best.challengerScores.tailoring + best.challengerScores.control;
      const currentTotal = current.challengerScores.teaching + current.challengerScores.tailoring + current.challengerScores.control;
      return currentTotal > bestTotal ? current : best;
    });

    return {
      challengerScores: avgScores,
      guidance: {
        recommendation: bestAnalysis.guidance.recommendation,
        message: bestAnalysis.guidance.message,
        keyInsights: uniqueInsights,
        nextSteps: uniqueNextSteps,
      },
      emailFollowUp: bestAnalysis.emailFollowUp
    };
  }

  buildSynthesisPrompt(intermediateResult: AnalysisResult, accountContext: string): string {
    return `Based on the following intermediate analysis of a sales conversation, provide a final comprehensive assessment:

INTERMEDIATE ANALYSIS:
Challenger Scores: Teaching ${intermediateResult.challengerScores.teaching}/5, Tailoring ${intermediateResult.challengerScores.tailoring}/5, Control ${intermediateResult.challengerScores.control}/5
Key Insights: ${intermediateResult.guidance.keyInsights.join(', ')}
Recommendation: ${intermediateResult.guidance.recommendation}

ACCOUNT CONTEXT:
${accountContext}

Provide a refined final analysis in JSON format with challengerScores, guidance, and emailFollowUp sections.`;
  }

  async storeResults(transcriptId: string, result: AnalysisResult, strategy: AnalysisStrategy, processingTime: number): Promise<void> {
    const { error } = await this.supabase
      .from('conversation_analysis')
      .insert({
        transcript_id: transcriptId,
        challenger_scores: result.challengerScores,
        guidance: result.guidance,
        email_followup: result.emailFollowUp,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Failed to store analysis results:', error);
      throw new Error('Failed to store analysis results');
    }

    // Update transcript status
    await this.supabase
      .from('transcripts')
      .update({ 
        status: 'completed',
        processed_at: new Date().toISOString()
      })
      .eq('id', transcriptId);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const request: AnalysisRequest = await req.json();
    console.log('Analysis request:', { 
      transcriptId: request.transcriptId, 
      duration: request.durationMinutes,
      textLength: request.transcriptText?.length 
    });

    const engine = new HybridAnalysisEngine();
    const strategy = engine.selectStrategy(request.durationMinutes);
    const startTime = Date.now();

    console.log(`Using ${strategy} strategy for ${request.durationMinutes} minute transcript`);

    // Get active prompt and account context
    const activePrompt = await engine.getActivePrompt();
    const accountContext = await engine.getAccountContext(request.accountId);

    let result: AnalysisResult;

    switch (strategy) {
      case 'single_pass':
        result = await engine.singlePassAnalysis(request.transcriptText, accountContext, activePrompt.prompt_text);
        break;
      case 'smart_chunking':
        result = await engine.smartChunkingAnalysis(request.transcriptText, accountContext, activePrompt.prompt_text);
        break;
      case 'hierarchical':
        result = await engine.hierarchicalAnalysis(request.transcriptText, accountContext, activePrompt.prompt_text);
        break;
      default:
        throw new Error(`Unknown strategy: ${strategy}`);
    }

    const processingTime = Date.now() - startTime;
    console.log(`Analysis completed in ${processingTime}ms using ${strategy} strategy`);

    // Store results with RLS
    await engine.storeResults(request.transcriptId, result, strategy, processingTime);

    return new Response(JSON.stringify({
      success: true,
      strategy: strategy,
      processing_time_ms: processingTime,
      result: result
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-transcript function:', error);
    
    // Update transcript status to error if transcriptId is available
    try {
      const request = await req.clone().json();
      if (request.transcriptId) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        await supabase
          .from('transcripts')
          .update({ 
            status: 'error',
            error_message: error.message 
          })
          .eq('id', request.transcriptId);
      }
    } catch (updateError) {
      console.error('Failed to update transcript status:', updateError);
    }

    return new Response(JSON.stringify({ 
      error: 'Analysis failed',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
