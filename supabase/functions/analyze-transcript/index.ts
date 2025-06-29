
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

// === GRANULAR LOGGING START ===
const ENABLE_GRANULAR_LOGGING = true;

const debugLog = (category: string, message: string, data?: any) => {
  if (ENABLE_GRANULAR_LOGGING) {
    const timestamp = new Date().toISOString();
    if (data) {
      console.log(`🔍 [${category}] ${timestamp} - ${message}:`, data);
    } else {
      console.log(`🔍 [${category}] ${timestamp} - ${message}`);
    }
  }
};

const performanceLog = (operation: string, startTime: number) => {
  const duration = Date.now() - startTime;
  debugLog('PERF', `${operation} completed in ${duration}ms`);
  return duration;
};
// === GRANULAR LOGGING END ===

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
    // === GRANULAR LOGGING START ===
    debugLog('ENGINE', 'HybridAnalysisEngine initialized');
    // === GRANULAR LOGGING END ===
  }

  selectStrategy(durationMinutes: number): AnalysisStrategy {
    // === GRANULAR LOGGING START ===
    const startTime = Date.now();
    debugLog('STRATEGY', `Selecting strategy for ${durationMinutes} minute transcript`);
    // === GRANULAR LOGGING END ===
    
    let strategy: AnalysisStrategy;
    if (durationMinutes <= 30) {
      strategy = 'single_pass';
    } else if (durationMinutes <= 90) {
      strategy = 'smart_chunking';
    } else {
      strategy = 'hierarchical';
    }
    
    // === GRANULAR LOGGING START ===
    debugLog('STRATEGY', `Selected strategy: ${strategy} (based on ${durationMinutes} minutes)`, {
      thresholds: { single_pass: '≤30min', smart_chunking: '30-90min', hierarchical: '>90min' }
    });
    performanceLog('Strategy Selection', startTime);
    // === GRANULAR LOGGING END ===
    
    return strategy;
  }

  async getActivePrompt() {
    // === GRANULAR LOGGING START ===
    const startTime = Date.now();
    debugLog('DB', 'Fetching active prompt from database');
    // === GRANULAR LOGGING END ===
    
    const { data: activePrompt, error } = await this.supabase
      .rpc('get_active_prompt');

    // === GRANULAR LOGGING START ===
    const fetchDuration = performanceLog('Active Prompt Fetch', startTime);
    // === GRANULAR LOGGING END ===

    if (error) {
      // === GRANULAR LOGGING START ===
      debugLog('DB_ERROR', 'Failed to get active prompt', { error, duration: fetchDuration });
      // === GRANULAR LOGGING END ===
      console.error('Failed to get active prompt:', error);
      throw new Error('No active prompt configured');
    }

    if (!activePrompt || activePrompt.length === 0) {
      // === GRANULAR LOGGING START ===
      debugLog('DB_ERROR', 'No active prompt found in database', { duration: fetchDuration });
      // === GRANULAR LOGGING END ===
      throw new Error('No active prompt found');
    }

    // === GRANULAR LOGGING START ===
    debugLog('DB', 'Active prompt retrieved successfully', { 
      promptId: activePrompt[0]?.id, 
      promptLength: activePrompt[0]?.prompt_text?.length,
      duration: fetchDuration 
    });
    // === GRANULAR LOGGING END ===

    return activePrompt[0];
  }

  async getAccountContext(accountId?: string): Promise<string> {
    if (!accountId) {
      // === GRANULAR LOGGING START ===
      debugLog('CONTEXT', 'No account ID provided, skipping account context');
      // === GRANULAR LOGGING END ===
      return '';
    }

    // === GRANULAR LOGGING START ===
    const startTime = Date.now();
    debugLog('CONTEXT', `Fetching account context for ID: ${accountId}`);
    // === GRANULAR LOGGING END ===

    try {
      const { data: account, error } = await this.supabase
        .from('accounts')
        .select('name, deal_stage, notes')
        .eq('id', accountId)
        .single();

      // === GRANULAR LOGGING START ===
      const fetchDuration = performanceLog('Account Context Fetch', startTime);
      // === GRANULAR LOGGING END ===

      if (error || !account) {
        // === GRANULAR LOGGING START ===
        debugLog('CONTEXT_ERROR', 'Failed to fetch account context', { 
          accountId, 
          error: error?.message, 
          duration: fetchDuration 
        });
        // === GRANULAR LOGGING END ===
        return '';
      }

      const context = `Account: ${account.name}\nDeal Stage: ${account.deal_stage || 'Unknown'}\nNotes: ${account.notes || 'None'}`;
      
      // === GRANULAR LOGGING START ===
      debugLog('CONTEXT', 'Account context retrieved successfully', { 
        accountId, 
        accountName: account.name,
        contextLength: context.length,
        duration: fetchDuration 
      });
      // === GRANULAR LOGGING END ===

      return context;
    } catch (error) {
      // === GRANULAR LOGGING START ===
      debugLog('CONTEXT_ERROR', 'Exception while fetching account context', { 
        accountId, 
        error: error.message 
      });
      // === GRANULAR LOGGING END ===
      console.warn('Failed to get account context:', error);
      return '';
    }
  }

  buildPrompt(transcriptText: string, accountContext: string, promptTemplate: string): string {
    // === GRANULAR LOGGING START ===
    const startTime = Date.now();
    debugLog('PROMPT', 'Building prompt from template', {
      transcriptLength: transcriptText.length,
      accountContextLength: accountContext.length,
      templateLength: promptTemplate.length
    });
    // === GRANULAR LOGGING END ===

    const prompt = promptTemplate
      .replace(/\{\{conversation\}\}/g, transcriptText)
      .replace(/\{\{account_context\}\}/g, accountContext)
      .replace(/\{\{user_context\}\}/g, ''); // User context not implemented yet

    // === GRANULAR LOGGING START ===
    debugLog('PROMPT', 'Prompt built successfully', {
      finalPromptLength: prompt.length,
      replacements: {
        conversation: transcriptText.length,
        accountContext: accountContext.length,
        userContext: 0
      }
    });
    performanceLog('Prompt Building', startTime);
    // === GRANULAR LOGGING END ===

    return prompt;
  }

  async callOpenAI(prompt: string): Promise<AnalysisResult> {
    if (!openaiApiKey) {
      // === GRANULAR LOGGING START ===
      debugLog('API_ERROR', 'OpenAI API key not configured');
      // === GRANULAR LOGGING END ===
      throw new Error('OpenAI API key not configured');
    }

    // === GRANULAR LOGGING START ===
    const startTime = Date.now();
    debugLog('API', 'Starting OpenAI API call', {
      model: 'gpt-4o-mini',
      promptLength: prompt.length,
      estimatedTokens: Math.ceil(prompt.length / 4)
    });
    // === GRANULAR LOGGING END ===

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

    // === GRANULAR LOGGING START ===
    const apiDuration = performanceLog('OpenAI API Call', startTime);
    debugLog('API', 'OpenAI API response received', {
      status: response.status,
      statusText: response.statusText,
      duration: apiDuration
    });
    // === GRANULAR LOGGING END ===

    if (!response.ok) {
      const errorText = await response.text();
      // === GRANULAR LOGGING START ===
      debugLog('API_ERROR', 'OpenAI API error response', {
        status: response.status,
        statusText: response.statusText,
        errorText: errorText.substring(0, 500),
        duration: apiDuration
      });
      // === GRANULAR LOGGING END ===
      throw new Error(`OpenAI API error: ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // === GRANULAR LOGGING START ===
    debugLog('API', 'OpenAI response parsed successfully', {
      contentLength: content.length,
      totalTokens: data.usage?.total_tokens || 'unknown',
      promptTokens: data.usage?.prompt_tokens || 'unknown',
      completionTokens: data.usage?.completion_tokens || 'unknown'
    });
    // === GRANULAR LOGGING END ===
    
    return this.parseAndValidateResponse(content);
  }

  async callClaude(prompt: string): Promise<AnalysisResult> {
    if (!anthropicApiKey) {
      // === GRANULAR LOGGING START ===
      debugLog('API_ERROR', 'Anthropic API key not configured');
      // === GRANULAR LOGGING END ===
      throw new Error('Anthropic API key not configured');
    }

    // === GRANULAR LOGGING START ===
    const startTime = Date.now();
    debugLog('API', 'Starting Claude API call (fallback)', {
      model: 'claude-3-5-sonnet-20241022',
      promptLength: prompt.length,
      maxTokens: 2000
    });
    // === GRANULAR LOGGING END ===

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

    // === GRANULAR LOGGING START ===
    const apiDuration = performanceLog('Claude API Call', startTime);
    debugLog('API', 'Claude API response received', {
      status: response.status,
      statusText: response.statusText,
      duration: apiDuration
    });
    // === GRANULAR LOGGING END ===

    if (!response.ok) {
      const errorText = await response.text();
      // === GRANULAR LOGGING START ===
      debugLog('API_ERROR', 'Claude API error response', {
        status: response.status,
        statusText: response.statusText,
        errorText: errorText.substring(0, 500),
        duration: apiDuration
      });
      // === GRANULAR LOGGING END ===
      throw new Error(`Claude API error: ${errorText}`);
    }

    const data = await response.json();
    const content = data.content[0].text;
    
    // === GRANULAR LOGGING START ===
    debugLog('API', 'Claude response parsed successfully', {
      contentLength: content.length,
      inputTokens: data.usage?.input_tokens || 'unknown',
      outputTokens: data.usage?.output_tokens || 'unknown'
    });
    // === GRANULAR LOGGING END ===
    
    return this.parseAndValidateResponse(content);
  }

  parseAndValidateResponse(content: string): AnalysisResult {
    // === GRANULAR LOGGING START ===
    const startTime = Date.now();
    debugLog('PARSE', 'Starting response parsing', { contentLength: content.length });
    console.log('🔍 Raw AI response content:', content);
    // === GRANULAR LOGGING END ===
    
    let parsed;
    
    try {
      parsed = JSON.parse(content);
      // === GRANULAR LOGGING START ===
      debugLog('PARSE', 'Successfully parsed AI response as JSON', { 
        topLevelKeys: Object.keys(parsed),
        duration: Date.now() - startTime 
      });
      console.log('✅ Successfully parsed AI response as JSON:', parsed);
      // === GRANULAR LOGGING END ===
    } catch (error) {
      // === GRANULAR LOGGING START ===
      debugLog('PARSE_ERROR', 'Failed to parse AI response as JSON', { 
        error: error.message,
        contentPreview: content.substring(0, 200) 
      });
      // === GRANULAR LOGGING END ===
      console.error('❌ Failed to parse AI response as JSON:', error);
      // Try to extract JSON from text
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
          // === GRANULAR LOGGING START ===
          debugLog('PARSE', 'Successfully extracted and parsed JSON from text', { 
            extractedLength: jsonMatch[0].length,
            topLevelKeys: Object.keys(parsed) 
          });
          // === GRANULAR LOGGING END ===
          console.log('✅ Successfully extracted and parsed JSON from text:', parsed);
        } catch (innerError) {
          // === GRANULAR LOGGING START ===
          debugLog('PARSE_ERROR', 'Failed to parse extracted JSON', { 
            error: innerError.message,
            extractedContent: jsonMatch[0].substring(0, 200) 
          });
          // === GRANULAR LOGGING END ===
          console.error('❌ Failed to parse extracted JSON:', innerError);
          throw new Error('Failed to parse AI response as JSON');
        }
      } else {
        // === GRANULAR LOGGING START ===
        debugLog('PARSE_ERROR', 'No valid JSON found in AI response');
        // === GRANULAR LOGGING END ===
        throw new Error('No valid JSON found in AI response');
      }
    }

    // === GRANULAR LOGGING START ===
    const extractionStartTime = Date.now();
    debugLog('EXTRACT', 'Starting data extraction from parsed response', { 
      availableKeys: Object.keys(parsed) 
    });
    // === GRANULAR LOGGING END ===

    // NEW PARSING LOGIC - Extract from the actual AI response structure
    let teachingScore: number | null = null;
    let tailoringScore: number | null = null;
    let controlScore: number | null = null;
    
    // Try multiple paths to find challenger scores
    if (parsed.challengerScores) {
      // === GRANULAR LOGGING START ===
      debugLog('EXTRACT', 'Found challengerScores in direct path', parsed.challengerScores);
      // === GRANULAR LOGGING END ===
      teachingScore = this.validateScore(parsed.challengerScores.teaching);
      tailoringScore = this.validateScore(parsed.challengerScores.tailoring);
      controlScore = this.validateScore(parsed.challengerScores.control);
    } else if (parsed.challengerAnalysis) {
      // === GRANULAR LOGGING START ===
      debugLog('EXTRACT', 'Found challengerAnalysis, extracting scores', { 
        analysisKeys: Object.keys(parsed.challengerAnalysis) 
      });
      // === GRANULAR LOGGING END ===
      // Extract from the detailed structure we see in logs
      teachingScore = this.extractScoreFromAnalysis(parsed.challengerAnalysis.teaching);
      tailoringScore = this.extractScoreFromAnalysis(parsed.challengerAnalysis.tailoring);
      controlScore = this.extractScoreFromAnalysis(parsed.challengerAnalysis.control);
    }

    // === GRANULAR LOGGING START ===
    debugLog('EXTRACT', 'Extracted challenger scores', {
      teaching: teachingScore,
      tailoring: tailoringScore,
      control: controlScore
    });
    console.log('🔍 Extracted challenger scores:', {
      teaching: teachingScore,
      tailoring: tailoringScore,
      control: controlScore
    });
    // === GRANULAR LOGGING END ===

    // Extract guidance - try multiple paths
    let recommendation: string | null = null;
    let message: string | null = null;
    let keyInsights: string[] = [];
    let nextSteps: string[] = [];

    if (parsed.guidance) {
      // === GRANULAR LOGGING START ===
      debugLog('EXTRACT', 'Found guidance in direct path', { 
        guidanceKeys: Object.keys(parsed.guidance) 
      });
      // === GRANULAR LOGGING END ===
      // Direct guidance structure
      recommendation = parsed.guidance.recommendation || null;
      message = parsed.guidance.message || null;
      keyInsights = Array.isArray(parsed.guidance.keyInsights) ? parsed.guidance.keyInsights : [];
      nextSteps = Array.isArray(parsed.guidance.nextSteps) ? parsed.guidance.nextSteps : [];
    } else {
      // === GRANULAR LOGGING START ===
      debugLog('EXTRACT', 'Extracting guidance from detailed structure', { 
        availablePaths: {
          nextSteps: !!parsed.nextSteps,
          conversationSummary: !!parsed.conversationSummary,
          coachingInsights: !!parsed.coachingInsights,
          strategicRecommendations: !!parsed.strategicRecommendations
        }
      });
      // === GRANULAR LOGGING END ===
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

    // === GRANULAR LOGGING START ===
    debugLog('EXTRACT', 'Extracted guidance', {
      recommendation,
      message: message?.substring(0, 100) + '...',
      keyInsightsCount: keyInsights.length,
      nextStepsCount: nextSteps.length
    });
    console.log('🔍 Extracted guidance:', {
      recommendation,
      message,
      keyInsights,
      nextSteps
    });
    // === GRANULAR LOGGING END ===

    // Extract email follow-up
    let subject: string | null = null;
    let body: string | null = null;
    let timing: string | null = null;
    let channel: string | null = null;

    if (parsed.emailFollowUp) {
      // === GRANULAR LOGGING START ===
      debugLog('EXTRACT', 'Found emailFollowUp in direct path', { 
        emailKeys: Object.keys(parsed.emailFollowUp) 
      });
      // === GRANULAR LOGGING END ===
      subject = parsed.emailFollowUp.subject || null;
      body = parsed.emailFollowUp.body || null;
      timing = parsed.emailFollowUp.timing || null;
      channel = parsed.emailFollowUp.channel || null;
    } else if (parsed.followUpCommunication) {
      // === GRANULAR LOGGING START ===
      debugLog('EXTRACT', 'Found followUpCommunication, extracting email data', { 
        commKeys: Object.keys(parsed.followUpCommunication) 
      });
      // === GRANULAR LOGGING END ===
      subject = parsed.followUpCommunication.subject || null;
      body = parsed.followUpCommunication.keyMessages?.join('\n\n') || null;
      timing = parsed.followUpCommunication.timeline || null;
      channel = parsed.nextSteps?.channel || 'Email';
    }

    // === GRANULAR LOGGING START ===
    debugLog('EXTRACT', 'Extracted email follow-up', {
      subject,
      body: body?.substring(0, 100) + '...',
      timing,
      channel
    });
    console.log('🔍 Extracted email follow-up:', {
      subject,
      body,
      timing,
      channel
    });
    // === GRANULAR LOGGING END ===

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

    // === GRANULAR LOGGING START ===
    const totalParsingDuration = performanceLog('Complete Response Parsing', startTime);
    const extractionDuration = performanceLog('Data Extraction', extractionStartTime);
    debugLog('PARSE', 'Final parsed result', { 
      result,
      totalParsingDuration,
      extractionDuration 
    });
    console.log('🔍 Final parsed result:', result);
    // === GRANULAR LOGGING END ===
    
    return result;
  }

  validateScore(score: any): number | null {
    const num = parseInt(score);
    if (isNaN(num) || num < 1 || num > 5) {
      // === GRANULAR LOGGING START ===
      debugLog('VALIDATE', 'Invalid score detected', { originalScore: score, result: null });
      // === GRANULAR LOGGING END ===
      console.log('🔍 Invalid score detected:', score, '-> returning null');
      return null;
    }
    // === GRANULAR LOGGING START ===
    debugLog('VALIDATE', 'Valid score', { originalScore: score, result: num });
    // === GRANULAR LOGGING END ===
    console.log('🔍 Valid score:', score, '-> returning', num);
    return num;
  }

  extractScoreFromAnalysis(analysisSection: any): number | null {
    // === GRANULAR LOGGING START ===
    debugLog('EXTRACT_SCORE', 'Extracting score from analysis section', { 
      hasAnalysis: !!analysisSection,
      sectionKeys: analysisSection ? Object.keys(analysisSection) : []
    });
    // === GRANULAR LOGGING END ===
    
    // Try to extract numeric score from analysis text or infer from content
    if (!analysisSection) return null;
    
    // Look for strengths/opportunities ratio to infer score
    const strengthsCount = analysisSection.strengths?.length || 0;
    const opportunitiesCount = analysisSection.opportunities?.length || 0;
    
    let inferredScore;
    if (strengthsCount > opportunitiesCount) {
      inferredScore = strengthsCount >= 2 ? 4 : 3; // Good performance
    } else if (strengthsCount === opportunitiesCount) {
      inferredScore = 3; // Balanced
    } else {
      inferredScore = 2; // Needs improvement
    }

    // === GRANULAR LOGGING START ===
    debugLog('EXTRACT_SCORE', 'Inferred score from analysis', {
      strengthsCount,
      opportunitiesCount,
      inferredScore
    });
    // === GRANULAR LOGGING END ===

    return inferredScore;
  }

  async singlePassAnalysis(transcriptText: string, accountContext: string, promptTemplate: string): Promise<AnalysisResult> {
    // === GRANULAR LOGGING START ===
    const startTime = Date.now();
    debugLog('SINGLE_PASS', 'Starting single-pass analysis', {
      transcriptLength: transcriptText.length,
      accountContextLength: accountContext.length
    });
    // === GRANULAR LOGGING END ===

    const prompt = this.buildPrompt(transcriptText, accountContext, promptTemplate);
    
    try {
      const result = await this.callOpenAI(prompt);
      // === GRANULAR LOGGING START ===
      performanceLog('Single-Pass Analysis (OpenAI)', startTime);
      debugLog('SINGLE_PASS', 'Single-pass analysis completed successfully with OpenAI');
      // === GRANULAR LOGGING END ===
      return result;
    } catch (error) {
      // === GRANULAR LOGGING START ===
      debugLog('SINGLE_PASS', 'OpenAI failed, trying Claude', { error: error.message });
      // === GRANULAR LOGGING END ===
      console.warn('OpenAI failed, trying Claude:', error);
      const result = await this.callClaude(prompt);
      // === GRANULAR LOGGING START ===
      performanceLog('Single-Pass Analysis (Claude fallback)', startTime);
      debugLog('SINGLE_PASS', 'Single-pass analysis completed successfully with Claude fallback');
      // === GRANULAR LOGGING END ===
      return result;
    }
  }

  async smartChunkingAnalysis(transcriptText: string, accountContext: string, promptTemplate: string): Promise<AnalysisResult> {
    // === GRANULAR LOGGING START ===
    const startTime = Date.now();
    debugLog('SMART_CHUNK', 'Starting smart chunking analysis', {
      transcriptLength: transcriptText.length,
      accountContextLength: accountContext.length
    });
    // === GRANULAR LOGGING END ===

    const chunks = this.intelligentChunk(transcriptText, 3);
    const analyses: AnalysisResult[] = [];

    // === GRANULAR LOGGING START ===
    debugLog('SMART_CHUNK', 'Created chunks for analysis', {
      chunkCount: chunks.length,
      chunkSizes: chunks.map(chunk => chunk.length)
    });
    // === GRANULAR LOGGING END ===

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      // === GRANULAR LOGGING START ===
      const chunkStartTime = Date.now();
      debugLog('SMART_CHUNK', `Processing chunk ${i + 1}/${chunks.length}`, {
        chunkIndex: i,
        chunkLength: chunk.length
      });
      // === GRANULAR LOGGING END ===

      try {
        const chunkPrompt = this.buildPrompt(chunk, accountContext, promptTemplate);
        const analysis = await this.callOpenAI(chunkPrompt);
        analyses.push(analysis);
        
        // === GRANULAR LOGGING START ===
        performanceLog(`Chunk ${i + 1} Analysis (OpenAI)`, chunkStartTime);
        debugLog('SMART_CHUNK', `Chunk ${i + 1} completed successfully with OpenAI`);
        // === GRANULAR LOGGING END ===
      } catch (error) {
        // === GRANULAR LOGGING START ===
        debugLog('SMART_CHUNK', `Chunk ${i + 1} failed with OpenAI, trying Claude`, { 
          error: error.message 
        });
        // === GRANULAR LOGGING END ===
        console.warn('Chunk analysis failed, trying Claude:', error);
        const chunkPrompt = this.buildPrompt(chunk, accountContext, promptTemplate);
        const analysis = await this.callClaude(chunkPrompt);
        analyses.push(analysis);
        
        // === GRANULAR LOGGING START ===
        performanceLog(`Chunk ${i + 1} Analysis (Claude fallback)`, chunkStartTime);
        debugLog('SMART_CHUNK', `Chunk ${i + 1} completed successfully with Claude fallback`);
        // === GRANULAR LOGGING END ===
      }
    }

    // === GRANULAR LOGGING START ===
    const mergeStartTime = Date.now();
    debugLog('SMART_CHUNK', 'Starting merge of chunk analyses', {
      analysisCount: analyses.length
    });
    // === GRANULAR LOGGING END ===

    const result = this.mergeAnalyses(analyses);
    
    // === GRANULAR LOGGING START ===
    performanceLog('Smart Chunking Analysis (complete)', startTime);
    performanceLog('Analysis Merge', mergeStartTime);
    debugLog('SMART_CHUNK', 'Smart chunking analysis completed successfully');
    // === GRANULAR LOGGING END ===

    return result;
  }

  async hierarchicalAnalysis(transcriptText: string, accountContext: string, promptTemplate: string): Promise<AnalysisResult> {
    // === GRANULAR LOGGING START ===
    const startTime = Date.now();
    debugLog('HIERARCHICAL', 'Starting hierarchical analysis', {
      transcriptLength: transcriptText.length,
      accountContextLength: accountContext.length
    });
    // === GRANULAR LOGGING END ===

    const chunks = this.intelligentChunk(transcriptText, 6);
    const chunkAnalyses: AnalysisResult[] = [];

    // === GRANULAR LOGGING START ===
    debugLog('HIERARCHICAL', 'Created chunks for hierarchical analysis', {
      chunkCount: chunks.length,
      chunkSizes: chunks.map(chunk => chunk.length),
      averageChunkSize: chunks.reduce((sum, chunk) => sum + chunk.length, 0) / chunks.length
    });
    // === GRANULAR LOGGING END ===

    // Analyze chunks
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      // === GRANULAR LOGGING START ===
      const chunkStartTime = Date.now();
      debugLog('HIERARCHICAL', `Processing chunk ${i + 1}/${chunks.length}`, {
        chunkIndex: i,
        chunkLength: chunk.length
      });
      // === GRANULAR LOGGING END ===

      try {
        const chunkPrompt = this.buildPrompt(chunk, accountContext, promptTemplate);
        const analysis = await this.callOpenAI(chunkPrompt);
        chunkAnalyses.push(analysis);
        
        // === GRANULAR LOGGING START ===
        performanceLog(`Hierarchical Chunk ${i + 1} Analysis (OpenAI)`, chunkStartTime);
        debugLog('HIERARCHICAL', `Chunk ${i + 1} completed successfully with OpenAI`);
        // === GRANULAR LOGGING END ===
      } catch (error) {
        // === GRANULAR LOGGING START ===
        debugLog('HIERARCHICAL', `Chunk ${i + 1} failed with OpenAI, trying Claude`, { 
          error: error.message 
        });
        // === GRANULAR LOGGING END ===
        console.warn('Hierarchical chunk failed, trying Claude:', error);
        const chunkPrompt = this.buildPrompt(chunk, accountContext, promptTemplate);
        const analysis = await this.callClaude(chunkPrompt);
        chunkAnalyses.push(analysis);
        
        // === GRANULAR LOGGING START ===
        performanceLog(`Hierarchical Chunk ${i + 1} Analysis (Claude fallback)`, chunkStartTime);
        debugLog('HIERARCHICAL', `Chunk ${i + 1} completed successfully with Claude fallback`);
        // === GRANULAR LOGGING END ===
      }
    }

    // === GRANULAR LOGGING START ===
    const mergeStartTime = Date.now();
    debugLog('HIERARCHICAL', 'Starting merge of chunk analyses', {
      analysisCount: chunkAnalyses.length
    });
    // === GRANULAR LOGGING END ===

    // Merge intermediate results
    const intermediateResult = this.mergeAnalyses(chunkAnalyses);
    
    // === GRANULAR LOGGING START ===
    const mergeDuration = performanceLog('Chunk Analysis Merge', mergeStartTime);
    const synthesisStartTime = Date.now();
    debugLog('HIERARCHICAL', 'Starting final synthesis', {
      intermediateResult: {
        hasRecommendation: !!intermediateResult.guidance.recommendation,
        insightCount: intermediateResult.guidance.keyInsights.length,
        nextStepsCount: intermediateResult.guidance.nextSteps.length
      }
    });
    // === GRANULAR LOGGING END ===
    
    // Final synthesis
    const synthesisPrompt = this.buildSynthesisPrompt(intermediateResult, accountContext);
    
    try {
      const result = await this.callOpenAI(synthesisPrompt);
      // === GRANULAR LOGGING START ===
      performanceLog('Final Synthesis (OpenAI)', synthesisStartTime);
      performanceLog('Hierarchical Analysis (complete)', startTime);
      debugLog('HIERARCHICAL', 'Hierarchical analysis completed successfully with OpenAI synthesis');
      // === GRANULAR LOGGING END ===
      return result;
    } catch (error) {
      // === GRANULAR LOGGING START ===
      debugLog('HIERARCHICAL', 'Final synthesis failed with OpenAI, trying Claude', { 
        error: error.message 
      });
      // === GRANULAR LOGGING END ===
      console.warn('Final synthesis failed, trying Claude:', error);
      const result = await this.callClaude(synthesisPrompt);
      // === GRANULAR LOGGING START ===
      performanceLog('Final Synthesis (Claude fallback)', synthesisStartTime);
      performanceLog('Hierarchical Analysis (complete)', startTime);
      debugLog('HIERARCHICAL', 'Hierarchical analysis completed successfully with Claude synthesis');
      // === GRANULAR LOGGING END ===
      return result;
    }
  }

  intelligentChunk(text: string, numChunks: number): string[] {
    // === GRANULAR LOGGING START ===
    const startTime = Date.now();
    debugLog('CHUNK', 'Starting intelligent chunking', {
      textLength: text.length,
      requestedChunks: numChunks
    });
    // === GRANULAR LOGGING END ===

    // Split by sentences and paragraphs for natural boundaries
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const chunkSize = Math.ceil(sentences.length / numChunks);
    const chunks: string[] = [];

    // === GRANULAR LOGGING START ===
    debugLog('CHUNK', 'Sentence analysis', {
      totalSentences: sentences.length,
      calculatedChunkSize: chunkSize,
      averageSentenceLength: sentences.reduce((sum, s) => sum + s.length, 0) / sentences.length
    });
    // === GRANULAR LOGGING END ===

    for (let i = 0; i < sentences.length; i += chunkSize) {
      const chunk = sentences.slice(i, i + chunkSize).join('. ').trim();
      if (chunk) {
        chunks.push(chunk + '.');
      }
    }

    const result = chunks.length > 0 ? chunks : [text];
    
    // === GRANULAR LOGGING START ===
    performanceLog('Intelligent Chunking', startTime);
    debugLog('CHUNK', 'Chunking completed', {
      actualChunks: result.length,
      chunkSizes: result.map(chunk => chunk.length),
      totalCharsPreserved: result.reduce((sum, chunk) => sum + chunk.length, 0),
      originalLength: text.length
    });
    // === GRANULAR LOGGING END ===

    return result;
  }

  mergeAnalyses(analyses: AnalysisResult[]): AnalysisResult {
    // === GRANULAR LOGGING START ===
    const startTime = Date.now();
    debugLog('MERGE', 'Starting analysis merge', {
      analysisCount: analyses.length
    });
    // === GRANULAR LOGGING END ===

    if (analyses.length === 0) {
      // === GRANULAR LOGGING START ===
      debugLog('MERGE_ERROR', 'No analyses to merge');
      // === GRANULAR LOGGING END ===
      throw new Error('No analyses to merge');
    }

    if (analyses.length === 1) {
      // === GRANULAR LOGGING START ===
      debugLog('MERGE', 'Single analysis, returning as-is');
      // === GRANULAR LOGGING END ===
      return analyses[0];
    }

    // === GRANULAR LOGGING START ===
    debugLog('MERGE', 'Analyzing scores for averaging', {
      analyses: analyses.map((a, i) => ({
        index: i,
        teaching: a.challengerScores.teaching,
        tailoring: a.challengerScores.tailoring,
        control: a.challengerScores.control
      }))
    });
    // === GRANULAR LOGGING END ===

    // Average scores - only include valid (non-null) scores
    const validTeachingScores = analyses.map(a => a.challengerScores.teaching).filter(s => s !== null) as number[];
    const validTailoringScores = analyses.map(a => a.challengerScores.tailoring).filter(s => s !== null) as number[];
    const validControlScores = analyses.map(a => a.challengerScores.control).filter(s => s !== null) as number[];

    const avgScores = {
      teaching: validTeachingScores.length > 0 ? Math.round(validTeachingScores.reduce((sum, s) => sum + s, 0) / validTeachingScores.length) : null,
      tailoring: validTailoringScores.length > 0 ? Math.round(validTailoringScores.reduce((sum, s) => sum + s, 0) / validTailoringScores.length) : null,
      control: validControlScores.length > 0 ? Math.round(validControlScores.reduce((sum, s) => sum + s, 0) / validControlScores.length) : null,
    };

    // === GRANULAR LOGGING START ===
    debugLog('MERGE', 'Calculated average scores', {
      avgScores,
      validCounts: {
        teaching: validTeachingScores.length,
        tailoring: validTailoringScores.length,
        control: validControlScores.length
      }
    });
    // === GRANULAR LOGGING END ===

    // Merge insights and next steps
    const allInsights = analyses.flatMap(a => a.guidance.keyInsights);
    const allNextSteps = analyses.flatMap(a => a.guidance.nextSteps);
    
    // Remove duplicates and take top items
    const uniqueInsights = [...new Set(allInsights)].slice(0, 5);
    const uniqueNextSteps = [...new Set(allNextSteps)].slice(0, 3);

    // === GRANULAR LOGGING START ===
    debugLog('MERGE', 'Processed insights and next steps', {
      totalInsights: allInsights.length,
      uniqueInsights: uniqueInsights.length,
      totalNextSteps: allNextSteps.length,
      uniqueNextSteps: uniqueNextSteps.length
    });
    // === GRANULAR LOGGING END ===

    // Use guidance from first analysis with valid data
    const bestAnalysis = analyses.find(a => a.guidance.recommendation && a.guidance.message) || analyses[0];
    
    // === GRANULAR LOGGING START ===
    debugLog('MERGE', 'Selected best analysis for guidance', {
      selectedIndex: analyses.indexOf(bestAnalysis),
      hasRecommendation: !!bestAnalysis.guidance.recommendation,
      hasMessage: !!bestAnalysis.guidance.message
    });
    // === GRANULAR LOGGING END ===

    const result = {
      challengerScores: avgScores,
      guidance: {
        recommendation: bestAnalysis.guidance.recommendation,
        message: bestAnalysis.guidance.message,
        keyInsights: uniqueInsights,
        nextSteps: uniqueNextSteps,
      },
      emailFollowUp: bestAnalysis.emailFollowUp
    };

    // === GRANULAR LOGGING START ===
    performanceLog('Analysis Merge', startTime);
    debugLog('MERGE', 'Merge completed successfully', { result });
    // === GRANULAR LOGGING END ===

    return result;
  }

  buildSynthesisPrompt(intermediateResult: AnalysisResult, accountContext: string): string {
    // === GRANULAR LOGGING START ===
    const startTime = Date.now();
    debugLog('SYNTHESIS', 'Building synthesis prompt', {
      hasIntermediate: !!intermediateResult,
      accountContextLength: accountContext.length,
      intermediateScores: intermediateResult.challengerScores,
      insightCount: intermediateResult.guidance.keyInsights.length
    });
    // === GRANULAR LOGGING END ===

    const prompt = `Based on the following intermediate analysis of a sales conversation, provide a final comprehensive assessment:

INTERMEDIATE ANALYSIS:
Challenger Scores: Teaching ${intermediateResult.challengerScores.teaching}/5, Tailoring ${intermediateResult.challengerScores.tailoring}/5, Control ${intermediateResult.challengerScores.control}/5
Key Insights: ${intermediateResult.guidance.keyInsights.join(', ')}
Recommendation: ${intermediateResult.guidance.recommendation}

ACCOUNT CONTEXT:
${accountContext}

Provide a refined final analysis in JSON format with challengerScores, guidance, and emailFollowUp sections.`;

    // === GRANULAR LOGGING START ===
    performanceLog('Synthesis Prompt Building', startTime);
    debugLog('SYNTHESIS', 'Synthesis prompt built', { promptLength: prompt.length });
    // === GRANULAR LOGGING END ===

    return prompt;
  }

  async storeResults(transcriptId: string, result: AnalysisResult, strategy: AnalysisStrategy, processingTime: number): Promise<void> {
    // === GRANULAR LOGGING START ===
    const startTime = Date.now();
    debugLog('STORE', 'Starting to store analysis results', {
      transcriptId,
      strategy,
      processingTime,
      result
    });
    console.log('🔍 Storing analysis results:', result);
    // === GRANULAR LOGGING END ===
    
    const { error } = await this.supabase
      .from('conversation_analysis')
      .insert({
        transcript_id: transcriptId,
        challenger_scores: result.challengerScores,
        guidance: result.guidance,
        email_followup: result.emailFollowUp,
        created_at: new Date().toISOString()
      });

    // === GRANULAR LOGGING START ===
    const insertDuration = Date.now() - startTime;
    // === GRANULAR LOGGING END ===

    if (error) {
      // === GRANULAR LOGGING START ===
      debugLog('STORE_ERROR', 'Failed to store analysis results', { 
        error, 
        transcriptId, 
        duration: insertDuration 
      });
      // === GRANULAR LOGGING END ===
      console.error('Failed to store analysis results:', error);
      throw new Error('Failed to store analysis results');
    }

    // === GRANULAR LOGGING START ===
    debugLog('STORE', 'Analysis results stored successfully', { 
      transcriptId, 
      duration: insertDuration 
    });
    // === GRANULAR LOGGING END ===

    // IMPORTANT: Update transcript status to "completed"
    // === GRANULAR LOGGING START ===
    const statusUpdateStartTime = Date.now();
    debugLog('STORE', 'Updating transcript status to completed', { transcriptId });
    // === GRANULAR LOGGING END ===

    const { error: updateError } = await this.supabase
      .from('transcripts')
      .update({ 
        status: 'completed',
        processed_at: new Date().toISOString()
      })
      .eq('id', transcriptId);

    // === GRANULAR LOGGING START ===
    const statusUpdateDuration = performanceLog('Transcript Status Update', statusUpdateStartTime);
    // === GRANULAR LOGGING END ===

    if (updateError) {
      // === GRANULAR LOGGING START ===
      debugLog('STORE_ERROR', 'Failed to update transcript status', { 
        updateError, 
        transcriptId, 
        duration: statusUpdateDuration 
      });
      // === GRANULAR LOGGING END ===
      console.error('Failed to update transcript status:', updateError);
      // Don't throw here - analysis is stored, just status update failed
    } else {
      // === GRANULAR LOGGING START ===
      debugLog('STORE', 'Transcript status updated successfully', { 
        transcriptId, 
        duration: statusUpdateDuration 
      });
      // === GRANULAR LOGGING END ===
    }
      
    // === GRANULAR LOGGING START ===
    performanceLog('Complete Storage Operation', startTime);
    debugLog('STORE', 'Storage operation completed', { transcriptId });
    // === GRANULAR LOGGING END ===
    console.log('✅ Successfully stored analysis results and updated status for transcript:', transcriptId);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // === GRANULAR LOGGING START ===
  const requestStartTime = Date.now();
  debugLog('REQUEST', 'New analysis request received', { 
    method: req.method,
    url: req.url 
  });
  // === GRANULAR LOGGING END ===

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      // === GRANULAR LOGGING START ===
      debugLog('AUTH_ERROR', 'Missing authorization header');
      // === GRANULAR LOGGING END ===
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // === GRANULAR LOGGING START ===
    const authStartTime = Date.now();
    debugLog('AUTH', 'Validating user authentication');
    // === GRANULAR LOGGING END ===

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    // === GRANULAR LOGGING START ===
    const authDuration = performanceLog('User Authentication', authStartTime);
    // === GRANULAR LOGGING END ===

    if (authError || !user) {
      // === GRANULAR LOGGING START ===
      debugLog('AUTH_ERROR', 'User authentication failed', { 
        authError: authError?.message, 
        duration: authDuration 
      });
      // === GRANULAR LOGGING END ===
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // === GRANULAR LOGGING START ===
    debugLog('AUTH', 'User authenticated successfully', { 
      userId: user.id, 
      duration: authDuration 
    });
    // === GRANULAR LOGGING END ===

    const request: AnalysisRequest = await req.json();
    
    // === GRANULAR LOGGING START ===
    debugLog('REQUEST', 'Analysis request parsed', { 
      transcriptId: request.transcriptId, 
      duration: request.durationMinutes,
      textLength: request.transcriptText?.length,
      hasAccountId: !!request.accountId
    });
    // === GRANULAR LOGGING END ===
    console.log('Analysis request:', { 
      transcriptId: request.transcriptId, 
      duration: request.durationMinutes,
      textLength: request.transcriptText?.length 
    });

    const engine = new HybridAnalysisEngine();
    const strategy = engine.selectStrategy(request.durationMinutes);
    const startTime = Date.now();

    // === GRANULAR LOGGING START ===
    debugLog('STRATEGY', 'Analysis strategy selected', { 
      strategy, 
      duration: request.durationMinutes,
      transcriptLength: request.transcriptText?.length 
    });
    // === GRANULAR LOGGING END ===
    console.log(`Using ${strategy} strategy for ${request.durationMinutes} minute transcript`);

    // Get active prompt and account context
    // === GRANULAR LOGGING START ===
    const setupStartTime = Date.now();
    debugLog('SETUP', 'Starting setup phase (prompt + account context)');
    // === GRANULAR LOGGING END ===

    const activePrompt = await engine.getActivePrompt();
    const accountContext = await engine.getAccountContext(request.accountId);

    // === GRANULAR LOGGING START ===
    performanceLog('Setup Phase', setupStartTime);
    debugLog('SETUP', 'Setup phase completed', {
      promptId: activePrompt.id,
      promptLength: activePrompt.prompt_text?.length,
      accountContextLength: accountContext.length
    });
    // === GRANULAR LOGGING END ===

    let result: AnalysisResult;

    // === GRANULAR LOGGING START ===
    const analysisStartTime = Date.now();
    debugLog('ANALYSIS', `Starting ${strategy} analysis`, {
      strategy,
      transcriptLength: request.transcriptText?.length,
      estimatedComplexity: request.durationMinutes > 90 ? 'high' : request.durationMinutes > 30 ? 'medium' : 'low'
    });
    // === GRANULAR LOGGING END ===

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
        // === GRANULAR LOGGING START ===
        debugLog('STRATEGY_ERROR', 'Unknown strategy selected', { strategy });
        // === GRANULAR LOGGING END ===
        throw new Error(`Unknown strategy: ${strategy}`);
    }

    const processingTime = Date.now() - startTime;
    
    // === GRANULAR LOGGING START ===
    const analysisDuration = performanceLog(`${strategy} Analysis`, analysisStartTime);
    debugLog('ANALYSIS', 'Analysis phase completed', {
      strategy,
      processingTime,
      analysisDuration,
      hasResult: !!result,
      resultQuality: {
        hasScores: !!(result.challengerScores.teaching || result.challengerScores.tailoring || result.challengerScores.control),
        hasGuidance: !!result.guidance.recommendation,
        hasEmail: !!result.emailFollowUp.subject
      }
    });
    // === GRANULAR LOGGING END ===
    console.log(`Analysis completed in ${processingTime}ms using ${strategy} strategy`);

    // Store results with improved error handling
    // === GRANULAR LOGGING START ===
    debugLog('FINAL', 'Starting result storage', { transcriptId: request.transcriptId });
    // === GRANULAR LOGGING END ===

    await engine.storeResults(request.transcriptId, result, strategy, processingTime);

    // === GRANULAR LOGGING START ===
    const totalDuration = performanceLog('Complete Request Processing', requestStartTime);
    debugLog('FINAL', 'Request completed successfully', {
      transcriptId: request.transcriptId,
      strategy,
      totalDuration,
      processingTime,
      breakdown: {
        setupTime: setupStartTime ? Date.now() - setupStartTime : 0,
        analysisTime: analysisDuration,
        storageTime: totalDuration - processingTime
      }
    });
    // === GRANULAR LOGGING END ===

    return new Response(JSON.stringify({
      success: true,
      strategy: strategy,
      processing_time_ms: processingTime,
      result: result
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    // === GRANULAR LOGGING START ===
    const totalDuration = Date.now() - requestStartTime;
    debugLog('ERROR', 'Request failed with error', {
      error: error.message,
      stack: error.stack?.substring(0, 500),
      totalDuration
    });
    // === GRANULAR LOGGING END ===
    console.error('Error in analyze-transcript function:', error);
    
    // Update transcript status to error if transcriptId is available
    try {
      const request = await req.clone().json();
      if (request.transcriptId) {
        // === GRANULAR LOGGING START ===
        debugLog('ERROR_RECOVERY', 'Updating transcript status to error', { 
          transcriptId: request.transcriptId 
        });
        // === GRANULAR LOGGING END ===
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        await supabase
          .from('transcripts')
          .update({ 
            status: 'error',
            error_message: error.message 
          })
          .eq('id', request.transcriptId);
        
        // === GRANULAR LOGGING START ===
        debugLog('ERROR_RECOVERY', 'Transcript status updated to error', { 
          transcriptId: request.transcriptId 
        });
        // === GRANULAR LOGGING END ===
      }
    } catch (updateError) {
      // === GRANULAR LOGGING START ===
      debugLog('ERROR_RECOVERY', 'Failed to update transcript status', { 
        updateError: updateError.message 
      });
      // === GRANULAR LOGGING END ===
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
