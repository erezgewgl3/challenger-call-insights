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
  teaching: number | null
  tailoring: number | null
  control: number | null
}

interface Guidance {
  recommendation: string | null
  message: string | null
  keyInsights: string[]
  nextSteps: string[]
}

interface EmailFollowUp {
  subject: string | null
  body: string | null
  timing: string | null
  channel: string | null
}

interface AnalysisResult {
  challengerScores: ChallengerScores;
  guidance: Guidance;
  emailFollowUp: EmailFollowUp;
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
        temperature: 0.3
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
    console.log('🔍 Raw AI response content:', content);
    
    let parsed;
    
    try {
      parsed = JSON.parse(content);
      console.log('✅ Successfully parsed AI response as JSON:', parsed);
    } catch (error) {
      console.error('❌ Failed to parse AI response as JSON:', error);
      // Try to extract JSON from text
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
          console.log('✅ Successfully extracted and parsed JSON from text:', parsed);
        } catch (innerError) {
          console.error('❌ Failed to parse extracted JSON:', innerError);
          throw new Error('Failed to parse AI response as JSON');
        }
      } else {
        throw new Error('No valid JSON found in AI response');
      }
    }

    // NEW PARSING LOGIC - Extract from the actual AI response structure
    let teachingScore: number | null = null;
    let tailoringScore: number | null = null;
    let controlScore: number | null = null;
    
    // Try multiple paths to find challenger scores
    if (parsed.challengerScores) {
      teachingScore = this.validateScore(parsed.challengerScores.teaching);
      tailoringScore = this.validateScore(parsed.challengerScores.tailoring);
      controlScore = this.validateScore(parsed.challengerScores.control);
    } else if (parsed.challengerAnalysis) {
      // Extract from the detailed structure we see in logs
      teachingScore = this.extractScoreFromAnalysis(parsed.challengerAnalysis.teaching);
      tailoringScore = this.extractScoreFromAnalysis(parsed.challengerAnalysis.tailoring);
      controlScore = this.extractScoreFromAnalysis(parsed.challengerAnalysis.control);
    }

    console.log('🔍 Extracted challenger scores:', {
      teaching: teachingScore,
      tailoring: tailoringScore,
      control: controlScore
    });

    // Extract guidance - try multiple paths
    let recommendation: string | null = null;
    let message: string | null = null;
    let keyInsights: string[] = [];
    let nextSteps: string[] = [];

    if (parsed.guidance) {
      // Direct guidance structure
      recommendation = parsed.guidance.recommendation || null;
      message = parsed.guidance.message || null;
      keyInsights = Array.isArray(parsed.guidance.keyInsights) ? parsed.guidance.keyInsights : [];
      nextSteps = Array.isArray(parsed.guidance.nextSteps) ? parsed.guidance.nextSteps : [];
    } else {
      // Extract from detailed structure
      if (parsed.nextSteps?.recommendation) {
        recommendation = parsed.nextSteps.recommendation;
      }
      if (parsed.conversationSummary?.overview) {
        message = parsed.conversationSummary.overview;
      }
      if (parsed.coachingInsights?.keyWins) {
        keyInsights = Array.isArray(parsed.coachingInsights.keyWins) ? parsed.coachingInsights.keyWins : [];
      }
      if (parsed.strategicRecommendations?.immediateActions) {
        nextSteps = Array.isArray(parsed.strategicRecommendations.immediateActions) ? parsed.strategicRecommendations.immediateActions : [];
      }
    }

    console.log('🔍 Extracted guidance:', {
      recommendation,
      message,
      keyInsights,
      nextSteps
    });

    // Extract email follow-up
    let subject: string | null = null;
    let body: string | null = null;
    let timing: string | null = null;
    let channel: string | null = null;

    if (parsed.emailFollowUp) {
      subject = parsed.emailFollowUp.subject || null;
      body = parsed.emailFollowUp.body || null;
      timing = parsed.emailFollowUp.timing || null;
      channel = parsed.emailFollowUp.channel || null;
    } else if (parsed.followUpCommunication) {
      subject = parsed.followUpCommunication.subject || null;
      body = parsed.followUpCommunication.keyMessages?.join('\n\n') || null;
      timing = parsed.followUpCommunication.timeline || null;
      channel = parsed.nextSteps?.channel || 'Email';
    }

    console.log('🔍 Extracted email follow-up:', {
      subject,
      body,
      timing,
      channel
    });

    const result: AnalysisResult = {
      challengerScores: {
        teaching: teachingScore,
        tailoring: tailoringScore,
        control: controlScore,
      },
      guidance: {
        recommendation,
        message,
        keyInsights,
        nextSteps,
      },
      emailFollowUp: {
        subject,
        body,
        timing,
        channel,
      }
    };

    console.log('🔍 Final parsed result:', result);
    return result;
  }

  validateScore(score: any): number | null {
    const num = parseInt(score);
    if (isNaN(num) || num < 1 || num > 5) {
      console.log('🔍 Invalid score detected:', score, '-> returning null');
      return null;
    }
    console.log('🔍 Valid score:', score, '-> returning', num);
    return num;
  }

  extractScoreFromAnalysis(analysisSection: any): number | null {
    // Try to extract numeric score from analysis text or infer from content
    if (!analysisSection) return null;
    
    // Look for strengths/opportunities ratio to infer score
    const strengthsCount = analysisSection.strengths?.length || 0;
    const opportunitiesCount = analysisSection.opportunities?.length || 0;
    
    if (strengthsCount > opportunitiesCount) {
      return strengthsCount >= 2 ? 4 : 3; // Good performance
    } else if (strengthsCount === opportunitiesCount) {
      return 3; // Balanced
    } else {
      return 2; // Needs improvement
    }
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

    // Average scores - only include valid (non-null) scores
    const validTeachingScores = analyses.map(a => a.challengerScores.teaching).filter(s => s !== null) as number[];
    const validTailoringScores = analyses.map(a => a.challengerScores.tailoring).filter(s => s !== null) as number[];
    const validControlScores = analyses.map(a => a.challengerScores.control).filter(s => s !== null) as number[];

    const avgScores = {
      teaching: validTeachingScores.length > 0 ? Math.round(validTeachingScores.reduce((sum, s) => sum + s, 0) / validTeachingScores.length) : null,
      tailoring: validTailoringScores.length > 0 ? Math.round(validTailoringScores.reduce((sum, s) => sum + s, 0) / validTailoringScores.length) : null,
      control: validControlScores.length > 0 ? Math.round(validControlScores.reduce((sum, s) => sum + s, 0) / validControlScores.length) : null,
    };

    // Merge insights and next steps
    const allInsights = analyses.flatMap(a => a.guidance.keyInsights);
    const allNextSteps = analyses.flatMap(a => a.guidance.nextSteps);
    
    // Remove duplicates and take top items
    const uniqueInsights = [...new Set(allInsights)].slice(0, 5);
    const uniqueNextSteps = [...new Set(allNextSteps)].slice(0, 3);

    // Use guidance from first analysis with valid data
    const bestAnalysis = analyses.find(a => a.guidance.recommendation && a.guidance.message) || analyses[0];

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
    console.log('🔍 Storing analysis results:', result);
    
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

    // IMPORTANT: Update transcript status to "completed"
    const { error: updateError } = await this.supabase
      .from('transcripts')
      .update({ 
        status: 'completed',
        processed_at: new Date().toISOString()
      })
      .eq('id', transcriptId);

    if (updateError) {
      console.error('Failed to update transcript status:', updateError);
      // Don't throw here - analysis is stored, just status update failed
    }
      
    console.log('✅ Successfully stored analysis results and updated status for transcript:', transcriptId);
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

    // Store results with improved error handling
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
