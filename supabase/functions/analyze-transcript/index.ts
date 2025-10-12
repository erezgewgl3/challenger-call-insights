import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// AI Model Configuration - Single source of truth for model versions
const AI_MODELS = {
  openai: 'gpt-4o-mini',
  claude: 'claude-3-5-sonnet-20241022'
} as const;

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

// Frontend-exact deal heat calculation logic (returns string only)
function calculateDealHeat(analysis: any): string {
  console.log('🔍 [HEAT] Input analysis structure:', JSON.stringify(analysis, null, 2));
  
  const painLevel = analysis.call_summary?.painSeverity?.level || 'low'
  const indicators = analysis.call_summary?.painSeverity?.indicators || []
  
  const criticalFactors = analysis.call_summary?.urgencyDrivers?.criticalFactors || []
  const businessFactors = analysis.call_summary?.urgencyDrivers?.businessFactors || []
  const generalFactors = analysis.call_summary?.urgencyDrivers?.generalFactors || []
  
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
  
  console.log('🔍 [HEAT] Calculation details:', {
    painLevel,
    criticalFactors: criticalFactors.length,
    businessFactors: businessFactors.length,
    commitmentSignals: commitmentSignals.length,
    urgencyScore,
    dealScore,
    resistancePenalty
  });
  
  if (
    painLevel === 'high' ||
    criticalFactors.length >= 1 ||
    dealScore >= 8 ||
    (commitmentSignals.length >= 2 && dealScore >= 6) ||
    (painLevel === 'medium' && commitmentSignals.length >= 2 && dealScore >= 5)
  ) {
    console.log('🔍 [HEAT] Result: HIGH');
    return 'HIGH'
  } else if (
    painLevel === 'medium' || 
    (businessFactors || []).length >= 1 ||
    dealScore >= 3
  ) {
    console.log('🔍 [HEAT] Result: MEDIUM');
    return 'MEDIUM'
  }
  
  console.log('🔍 [HEAT] Result: LOW');
  return 'LOW'
}

// Extract prospect company name and participants from AI analysis for better display
function extractMetadataFromAnalysis(parsed: ParsedAnalysis, sourceMetadata?: any, dealContext?: any) {
  let companyName: string | null = null;
  let participants: any[] | null = null;

  // Priority 1: Search in AI analysis overview/clientSituation for prospect company mentions
  const overview = parsed.callSummary?.overview || '';
  const clientSituation = parsed.callSummary?.clientSituation || '';
  
  // Look for prospect company mentions with context
  const companyPatterns = [
    // Match company names mentioned with context
    /(?:prospect|client|customer|company|organization)(?:'s|'s)?\s+(?:called|named)?\s*([A-Z][A-Za-z0-9\s&.,'-]{2,40}?)(?:\s+(?:is|has|was|are|were|will|would|could|should|wants|needs|requires|seeks|explores|evaluates|considers|mentioned|expressed|indicated)|[,.]|$)/i,
    // Match "at <Company>" patterns
    /\bat\s+([A-Z][A-Za-z0-9\s&.,'-]{2,40}?)(?:\s+(?:is|has|are|were|in|for|with|to)|[,.]|$)/,
    // Match company name at start of sentence
    /^([A-Z][A-Za-z0-9\s&.,'-]{2,40}?)\s+(?:is|has|was|are|were|will|would|could|needs|wants|requires|seeks)/
  ];
  
  for (const pattern of companyPatterns) {
    const match = overview.match(pattern) || clientSituation.match(pattern);
    if (match?.[1]) {
      const candidate = match[1].trim();
      // Filter out generic words and user's company (Actifile)
      if (candidate.length > 2 && 
          !candidate.toLowerCase().includes('actifile') &&
          !['The', 'This', 'That', 'Their', 'These', 'Those'].includes(candidate)) {
        companyName = candidate;
        break;
      }
    }
  }

  // Priority 2: Check deal_context from Zoho
  if (!companyName && dealContext) {
    companyName = dealContext.organization_name || 
                  dealContext.account_name || 
                  dealContext.company_name || null;
  }

  // Priority 3: Check source_metadata
  if (!companyName && sourceMetadata?.webhook_payload?.meeting_metadata) {
    const metadata = sourceMetadata.webhook_payload.meeting_metadata;
    companyName = metadata.organization_name || 
                  metadata.account_name || 
                  metadata.company_name || null;
  }

  // Priority 4: Check competitive intelligence for prospect company
  if (!companyName && parsed.callSummary?.competitiveIntelligence?.vendorsKnown) {
    const vendors = parsed.callSummary.competitiveIntelligence.vendorsKnown;
    if (Array.isArray(vendors) && vendors.length > 0) {
      // Find first non-Actifile vendor as potential prospect company
      const prospectVendor = vendors.find((v: string) => 
        !v.toLowerCase().includes('actifile')
      );
      if (prospectVendor) {
        companyName = prospectVendor;
      }
    }
  }

  // Extract structured participants from clientContacts (prospects only)
  if (parsed.participants?.clientContacts && Array.isArray(parsed.participants.clientContacts)) {
    participants = parsed.participants.clientContacts.map((c: any) => ({
      name: c.name,
      role: c.role || c.title
    }));
  }

  return { companyName, participants };
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

    // Critical: Validate transcript content before processing
    if (!transcriptText || transcriptText.trim().length === 0) {
      const errorMsg = 'Transcript content is empty or missing';
      console.error('🔍 [ERROR]', errorMsg);
      await updateTranscriptError(supabase, transcriptId, errorMsg);
      throw new Error(errorMsg);
    }

    // Detect HTML content (login pages, error pages)
    const htmlIndicators = [/<html[\s>]/i, /<head[\s>]/i, /<body[\s>]/i, /<DOCTYPE/i];
    const isHTML = htmlIndicators.some(indicator => indicator.test(transcriptText));
    
    if (isHTML) {
      const errorMsg = 'Invalid transcript: HTML content detected. This indicates the source system returned a login page or error page instead of transcript data. Please verify authentication credentials and re-upload.';
      console.error('🔍 [ERROR]', errorMsg);
      console.error('🔍 [ERROR] Content preview:', transcriptText.substring(0, 300));
      await updateTranscriptError(supabase, transcriptId, errorMsg);
      throw new Error(errorMsg);
    }

    // Check for minimum viable transcript content
    if (transcriptText.trim().length < 100) {
      const errorMsg = 'Transcript content too short for meaningful analysis (minimum 100 characters)';
      console.error('🔍 [ERROR]', errorMsg);
      await updateTranscriptError(supabase, transcriptId, errorMsg);
      throw new Error(errorMsg);
    }

    // Update transcript status to processing (triggers real-time update)
    console.log('🔍 [DB] Updating transcript status to processing');
    const { error: statusError } = await supabase
      .from('transcripts')
      .update({ 
        status: 'processing',
        processing_status: 'processing',
        processing_started_at: new Date().toISOString(),
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
    let usedProvider: 'openai' | 'claude' = 'openai';
    
    try {
      aiResponse = await callOpenAI(finalPrompt);
    } catch (openAIError) {
      console.error('🔍 [ERROR] OpenAI failed, trying Claude fallback:', openAIError);
      try {
        aiResponse = await callClaude(finalPrompt);
        usedProvider = 'claude';
      } catch (claudeError) {
        console.error('🔍 [ERROR] Both AI providers failed:', claudeError);
        const errorMessage = claudeError instanceof Error ? claudeError.message : 'Unknown error';
        await updateTranscriptError(supabase, transcriptId, `AI analysis failed: ${errorMessage}`);
        throw new Error(`AI analysis failed: ${errorMessage}`);
      }
    }
    
    console.log('🔍 [AI] AI response received, length:', aiResponse.length);

    // Parse AI response
    const parsedResult = parseAIResponse(aiResponse);
    console.log('🔍 [PARSE] AI response parsed successfully');

    // Calculate deal heat using frontend-exact logic with proper data structure
    console.log('🔍 [HEAT] Calculating deal heat with transformed data structure');
    
    // Transform parsedResult to match expected format (Option A)
    const transformedData = {
      call_summary: parsedResult.callSummary  // Convert camelCase to snake_case structure
    };
    
    console.log('🔍 [HEAT] Transformed data for heat calculation:', JSON.stringify(transformedData, null, 2));
    
    const heatLevel = calculateDealHeat(transformedData);
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
      await updateTranscriptError(supabase, transcriptId, `Analysis save failed: ${analysisError instanceof Error ? analysisError.message : 'Unknown error'}`);
      throw new Error(`Failed to save analysis: ${analysisError instanceof Error ? analysisError.message : 'Unknown error'}`);
    }

    console.log('🔍 [SUCCESS] Analysis saved with ID:', analysisData.id, 'Heat Level:', heatLevel);

    // Extract metadata for better display (non-blocking)
    try {
      // Fetch transcript for source_metadata and deal_context
      const { data: transcript } = await supabase
        .from('transcripts')
        .select('source_metadata, deal_context')
        .eq('id', transcriptId)
        .single();
      
      const extracted = extractMetadataFromAnalysis(
        parsedResult, 
        transcript?.source_metadata, 
        transcript?.deal_context
      );
      
      // Use AI to extract company name if regex didn't find it
      if (!extracted.companyName) {
        console.log('🔍 [AI-EXTRACT] No company found by regex, using AI extraction');
        
        // Build richer context for extraction including participants
        const extractionContext = [
          parsedResult.callSummary?.overview,
          parsedResult.callSummary?.clientSituation,
          parsedResult.participants ? 
            `Participants: ${JSON.stringify(parsedResult.participants)}` : null
        ].filter(Boolean).join('\n\n');
        
        const aiCompanyName = await extractCompanyNameWithAI(
          extractionContext,
          undefined,
          usedProvider,
          usedProvider === 'openai' ? AI_MODELS.openai : AI_MODELS.claude  // Pass exact model
        );
        if (aiCompanyName) {
          extracted.companyName = aiCompanyName;
          console.log('🔍 [AI-EXTRACT] AI found company:', aiCompanyName);
        }
      }
      
      if (extracted.companyName || extracted.participants) {
        await supabase
          .from('transcripts')
          .update({
            extracted_company_name: extracted.companyName,
            extracted_participants: extracted.participants
          })
          .eq('id', transcriptId);
        console.log('🔍 [METADATA] Extracted:', extracted);
      }
    } catch (metaError) {
      console.warn('⚠️ Metadata extraction failed (non-critical):', metaError);
    }

    // Trigger webhook delivery asynchronously (never blocks analysis pipeline)
    console.log('[WEBHOOK DEBUG] About to trigger analysis webhooks for user:', userId);
    
    // Prepare webhook payload
    const webhookPayload = {
      trigger: "analysis_complete",
      timestamp: new Date().toISOString(),
      analysis: {
        id: analysisData.id,
        transcript_id: transcriptId,
        heat_level: analysisData.heat_level?.toLowerCase() || 'low',
        momentum: analysisData.guidance?.momentum || 'steady',
        stage_recommendation: analysisData.guidance?.recommendation || 'continue',
        challenger_scores: analysisData.challenger_scores || { teaching: 0, tailoring: 0, control: 0 },
        next_steps: analysisData.guidance?.next_steps || [],
        call_summary: analysisData.call_summary || {},
        competitive_insights: analysisData.guidance?.competitive_insights || {}
      }
    };
    
    // Deliver webhooks asynchronously (non-blocking)
    deliverWebhooksDirectly(userId, analysisData.id, webhookPayload)
      .catch(error => {
        console.error('🔍 [WEBHOOK] Webhook delivery failed (non-blocking):', error);
      });

    // Update transcript status to completed (triggers real-time update)
    console.log('🔍 [DB] Updating transcript status to completed');
    const { error: completeError } = await supabase
      .from('transcripts')
      .update({ 
        status: 'completed',
        processing_status: 'completed',
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
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Direct webhook delivery function (eliminates need for separate zapier-trigger function)
async function deliverWebhooksDirectly(userId: string, analysisId: string, webhookPayload: any) {
  try {
    console.log('[WEBHOOK] Starting direct webhook delivery for analysis:', analysisId);
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // Fetch active webhooks for user
    const { data: webhooks, error: webhooksError } = await supabase
      .from('zapier_webhooks')
      .select('*')
      .eq('user_id', userId)
      .eq('trigger_type', 'analysis_completed')
      .eq('is_active', true);

    if (webhooksError) {
      console.error('[WEBHOOK] Error fetching webhooks:', webhooksError);
      return;
    }

    if (!webhooks || webhooks.length === 0) {
      console.log('[WEBHOOK] No active webhooks found for user:', userId);
      return;
    }

    console.log('[WEBHOOK] Found active webhooks:', webhooks.length);

    // Deliver to each webhook
    for (const webhook of webhooks) {
      const logId = crypto.randomUUID();
      
      try {
        // Log webhook attempt
        await supabase.from('zapier_webhook_logs').insert({
          id: logId,
          webhook_id: webhook.id,
          trigger_data: webhookPayload,
          delivery_status: 'pending'
        });

        console.log('[WEBHOOK] Delivering to URL:', webhook.webhook_url);

        // Make HTTP request to webhook URL
        const response = await fetch(webhook.webhook_url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Sales-Whisperer-Webhook/1.0'
          },
          body: JSON.stringify({
            trigger: 'analysis_complete',
            timestamp: new Date().toISOString(),
            analysis: webhookPayload
          })
        });

        // Update log with delivery result
        await supabase.from('zapier_webhook_logs').update({
          delivery_status: response.ok ? 'delivered' : 'failed',
          http_status_code: response.status,
          response_body: response.ok ? null : await response.text(),
          delivered_at: response.ok ? new Date().toISOString() : null
        }).eq('id', logId);

        // Update webhook success/failure counters
        if (response.ok) {
          await supabase.from('zapier_webhooks').update({
            success_count: webhook.success_count + 1,
            last_triggered: new Date().toISOString()
          }).eq('id', webhook.id);
          console.log('[WEBHOOK] Successfully delivered to:', webhook.webhook_url);
        } else {
          await supabase.from('zapier_webhooks').update({
            failure_count: webhook.failure_count + 1,
            last_error: `HTTP ${response.status}: ${response.statusText}`
          }).eq('id', webhook.id);
          console.error('[WEBHOOK] Failed to deliver to:', webhook.webhook_url, response.status);
        }

      } catch (error) {
        console.error('[WEBHOOK] Delivery error for:', webhook.webhook_url, error);
        
        // Log the error
        await supabase.from('zapier_webhook_logs').update({
          delivery_status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error'
        }).eq('id', logId);

        await supabase.from('zapier_webhooks').update({
          failure_count: webhook.failure_count + 1,
          last_error: error instanceof Error ? error.message : 'Unknown error'
        }).eq('id', webhook.id);
      }
    }
    
  } catch (error) {
    console.error('[WEBHOOK] Fatal error in webhook delivery:', error);
  }
}

// Helper function to update transcript with error status
async function updateTranscriptError(supabase: any, transcriptId: string, errorMessage: string) {
  await supabase
    .from('transcripts')
    .update({ 
      status: 'error',
      processing_status: 'failed',
      processing_error: errorMessage,
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
      model: AI_MODELS.openai,
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
      model: AI_MODELS.claude,
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

// Lightweight AI extraction for company name only
async function extractCompanyNameWithAI(
  overview?: string, 
  clientSituation?: string,
  provider: 'openai' | 'claude' = 'openai',
  modelOverride?: string  // Exact model to use (matches main analysis)
): Promise<string | null> {
  if (!overview && !clientSituation) {
    return null;
  }

  const contextText = [overview, clientSituation].filter(Boolean).join('\n\n');
  const extractionPrompt = `Extract the prospect/client company name from this sales conversation summary.

RULES:
- Return ONLY the company name (no extra words, no explanations)
- If multiple companies are mentioned, return the PROSPECT company (not the seller)
- Return "NULL" if no clear company name exists
- DO NOT return generic phrases like "The meeting", "The call", "The conversation", "The company", etc.
- DO NOT return job titles, person names, or department names

Text:
${contextText}

Prospect company name (one word or short phrase only):`;

  try {
    let response: string;
    
    if (provider === 'openai') {
      const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
      if (!openAIApiKey) {
        console.warn('🔍 [AI-EXTRACT] OpenAI key not found, skipping AI extraction');
        return null;
      }

      const apiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelOverride || AI_MODELS.openai,
          messages: [
            { role: 'user', content: extractionPrompt }
          ],
          temperature: 0,
          max_tokens: 50,
        }),
      });

      if (!apiResponse.ok) {
        console.warn('🔍 [AI-EXTRACT] OpenAI extraction failed:', apiResponse.status);
        return null;
      }

      const data = await apiResponse.json();
      response = data.choices[0].message.content.trim();
    } else {
      const claudeApiKey = Deno.env.get('ANTHROPIC_API_KEY');
      if (!claudeApiKey) {
        console.warn('🔍 [AI-EXTRACT] Claude key not found, skipping AI extraction');
        return null;
      }

      const apiResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${claudeApiKey}`,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: modelOverride || AI_MODELS.claude,
          max_tokens: 50,
          messages: [
            { role: 'user', content: extractionPrompt }
          ],
          temperature: 0,
        }),
      });

      if (!apiResponse.ok) {
        console.warn('🔍 [AI-EXTRACT] Claude extraction failed:', apiResponse.status);
        return null;
      }

      const data = await apiResponse.json();
      response = data.content[0].text.trim();
    }

    // Clean up response
    if (!response || response.toUpperCase() === 'NULL' || response.length < 2) {
      return null;
    }

    // Validation blocklist - Reject generic/invalid company names
    const invalidNames = [
      'the meeting', 'the call', 'the conversation', 'the company', 
      'the client', 'the prospect', 'meeting', 'call', 'conversation',
      'discussion', 'the discussion', 'session', 'the session',
      'sales call', 'discovery call', 'demo'
    ];

    if (invalidNames.includes(response.toLowerCase())) {
      console.log('🔍 [AI-EXTRACT] Rejected generic company name:', response);
      return null;
    }

    // Remove common prefixes and clean
    const cleaned = response
      .replace(/^(Company name:|The company is:|Answer:|Response:)/i, '')
      .replace(/['"]/g, '')
      .trim();

    return cleaned.length > 1 ? cleaned : null;
  } catch (error) {
    console.warn('🔍 [AI-EXTRACT] AI company extraction failed (non-critical):', error);
    return null;
  }
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
