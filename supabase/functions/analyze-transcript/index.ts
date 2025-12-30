import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// AI Model Configuration - Single source of truth for model versions
const AI_MODELS = {
  openai: 'gpt-4-turbo',
  claude: 'claude-sonnet-4-5'
} as const;

// Helper to read admin-configured AI provider from database
async function getDefaultAiProvider(supabase: any): Promise<'openai' | 'claude'> {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('setting_value')
      .eq('setting_key', 'default_ai_provider')
      .maybeSingle();
    
    if (error || !data) {
      console.log('🔍 [CONFIG] No AI provider setting found, defaulting to openai');
      return 'openai';
    }
    
    const provider = data.setting_value as 'openai' | 'claude';
    console.log('🔍 [CONFIG] Using AI provider from admin settings:', provider);
    return provider;
  } catch (err) {
    console.error('🔍 [CONFIG] Error reading AI provider setting:', err);
    return 'openai';
  }
}

// ============ EMAIL TONE ENHANCEMENT FUNCTION ============
async function rewriteEmailsForNaturalTone(
  emails: Array<{ subject: string; body: string }>,
  provider: 'openai' | 'claude' = 'openai'
): Promise<Array<{ subject: string; body: string }>> {
  console.log('📧 [EMAIL-REWRITE] Processing', emails.length, 'emails using', provider.toUpperCase());
  
  const REWRITE_PROMPT = `You are rewriting sales follow-up emails to sound natural and human, not corporate or AI-generated.

CRITICAL: These emails MUST pass the "would a human write this?" test.

=== FORBIDDEN AI PHRASES (NEVER USE) ===
- "I hope this email finds you well" / "I hope you're doing well"
- "I wanted to reach out" / "I wanted to follow up"
- "Just checking in" / "Just touching base" / "Circling back"
- "This is crucial" / "This is essential" / "This is critical"
- "Your concern is valid" / "This is absolutely right"
- "Unexpected budget variances" / "Complicate approvals"
- "Aligning our teams effectively" / "Documenting our approach"
- "Looking forward to your thoughts" / "I appreciate your time"
- Starting with "Hi [Name]," or "Dear [Name],"

=== REQUIRED NATURAL PATTERNS (ALWAYS USE) ===
- Start: "[Name] -" then jump straight to the point
- Use contractions: don't, can't, won't, I'll, you're, that's
- Use fragments: "Quick thing." "So here's what matters."
- Drop formality: "makes sense" not "is valid"
- Be direct: "You said" not "You expressed the view that"
- Real talk: "Last thing you need" not "This could complicate"

=== TONE RULES ===
1. **Confident, not deferential:** "Here's how we handle this" NOT "I believe we may be able to"
2. **Direct, not wordy:** 10 words > 20 words saying the same thing
3. **Conversational, not corporate:** "So" and "Quick thing" are good sentence starters
4. **Active voice only:** "I'm sending" NOT "This will be sent"
5. **Fragments are OK:** "Bottom line?" "Three things:" "Quick answer:"
6. **Drop unnecessary words:** Remove "really," "very," "quite," "somewhat"

=== STRUCTURE ===
[Name] - [Direct statement - no politeness]

You said VERBATIM: "[exact quote]"

[Why this matters - 1 sentence, conversational]

[Solution - bullet format, their specific data]
• [Item 1 with THEIR numbers]
• [Item 2 with THEIR situation]  
• [Item 3 - concrete deliverable]

[Concrete next step with specific ask]

[Rep name]

NO CLOSING PLEASANTRIES. Just stop after the ask.

=== EXAMPLES OF GOOD VS BAD ===

❌ BAD (Current AI tone):
"Your concern about budget predictability is valid. This is crucial as you approach a significant financial commitment."

✅ GOOD (Natural human tone):
"Your budget concern makes total sense. You're committing $1.5M - last thing you need is surprise overages."

---

❌ BAD:
"I wanted to follow up on our discussion regarding the technical architecture deep dive."

✅ GOOD:
"Quick thing on the tech deep dive we discussed."

---

❌ BAD:
"This session is essential for documenting our integration approach and aligning our teams effectively."

✅ GOOD:
"We need 30 minutes to map out the integration. Your team needs to see how this plugs into your stack."

---

❌ BAD:
"I hope this email finds you well. I wanted to reach out to share..."

✅ GOOD:
"[Name] - Here's what you asked for."

=== FORMAT ENFORCEMENT ===
1. Subject line: Keep as-is (already good format)
2. Opening: "[Name] -" then direct statement (NO greetings)
3. VERBATIM quote: Required, but tighten the introduction
4. Body: Max 3 paragraphs, each 1-3 sentences
5. Bullets: Use when listing items, keep short
6. Close: Just ask + name (no "Best," "Sincerely," etc.)

=== TRANSFORMATION CHECKLIST ===
For each email, verify:
✅ Removed ALL forbidden phrases?
✅ Used contractions where natural?
✅ Dropped unnecessary politeness?
✅ Made it conversational (would you text this)?
✅ Removed corporate buzzwords?
✅ Cut word count by 20-30%?
✅ Would a human write this exact email?

If answer to last question is NO, rewrite again more aggressively.

EMAILS TO REWRITE:
${JSON.stringify(emails, null, 2)}

Return ONLY a JSON array in this format:
[
  {
    "subject": "original subject unchanged",
    "body": "rewritten body - natural, direct, human"
  }
]

CRITICAL: Return ONLY valid JSON. No markdown, no code blocks.`;

  try {
    let rewrittenText: string;

    if (provider === 'openai') {
      // Use OpenAI (respects admin choice)
      const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
      if (!openAIApiKey) {
        console.warn('📧 [EMAIL-REWRITE] OpenAI key not found, returning original emails');
        return emails;
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: AI_MODELS.openai,
          messages: [{ role: 'user', content: REWRITE_PROMPT }],
          max_completion_tokens: 4096
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('📧 [EMAIL-REWRITE] OpenAI API error:', response.status, errorText);
        return emails;
      }

      const data = await response.json();
      rewrittenText = data.choices[0].message.content.trim();

    } else {
      // Use Claude (respects admin choice)
      const claudeApiKey = Deno.env.get('ANTHROPIC_API_KEY');
      if (!claudeApiKey) {
        console.warn('📧 [EMAIL-REWRITE] Claude key not found, returning original emails');
        return emails;
      }

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${claudeApiKey}`,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: AI_MODELS.claude,
          max_tokens: 2000,
          messages: [{ role: 'user', content: REWRITE_PROMPT }],
          temperature: 0.7,
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('📧 [EMAIL-REWRITE] Claude API error:', response.status, errorText);
        return emails;
      }

      const data = await response.json();
      rewrittenText = data.content[0].text.trim();
    }
    
    // Strip markdown code blocks if present
    const cleanedText = rewrittenText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    
    const rewrittenEmails = JSON.parse(cleanedText);
    
    console.log('📧 [EMAIL-REWRITE] Successfully rewrote', rewrittenEmails.length, 'emails using', provider.toUpperCase());
    return rewrittenEmails;
    
  } catch (error) {
    console.error('📧 [EMAIL-REWRITE] Rewriting failed:', error);
    return emails;
  }
}
// ============ END EMAIL TONE ENHANCEMENT FUNCTION ============

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
  coachingInsights?: any;
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
  
  // NEW: Distinguish true commitment from exploration
  const trueCommitmentSignals = commitmentSignals.filter((signal: string) => {
    const lower = signal.toLowerCase()
    return (
      lower.includes('budget approved') ||
      lower.includes('budget allocated') ||
      lower.includes('let\'s get the contract') ||
      lower.includes('send the contract') ||
      lower.includes('send over the contract') ||
      lower.includes('when can we start') ||
      lower.includes('can we sign') ||
      lower.includes('need this in front of') ||
      lower.includes('ready to move forward') ||
      lower.includes('ready to proceed') ||
      lower.includes('ready to sign') ||
      lower.includes('schedule implementation') ||
      lower.includes('get the paperwork') ||
      lower.includes('execute') ||
      lower.includes('proceed with a contract') ||
      (lower.includes('proceed with') && lower.includes('contract'))
    )
  })

  const exploratorySignals = commitmentSignals.filter((signal: string) => {
    const lower = signal.toLowerCase()
    return (
      lower.includes('how long') ||
      lower.includes('what if') ||
      lower.includes('can you send') ||
      lower.includes('proposal') ||
      lower.includes('what about') ||
      lower.includes('give us some examples')
    )
  })

  const trueCommitmentCount = trueCommitmentSignals.length
  const exploratoryCount = exploratorySignals.length
  
  const timelineAnalysis = analysis.call_summary?.timelineAnalysis || {}
  const statedTimeline = timelineAnalysis.statedTimeline || ''
  const businessDriver = timelineAnalysis.businessDriver || ''
  
  let dealScore = urgencyScore
  
  // NEW: Different scoring for true commitment vs exploratory
  dealScore += trueCommitmentCount * 3  // True commitment worth more
  dealScore += exploratoryCount * 1      // Exploratory questions worth less
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
  
  // NEW: Detect budget shock
  const hasBudgetShock = allResistanceText.includes('double') ||
                         allResistanceText.includes('triple') ||
                         allResistanceText.includes('doubling') ||
                         allResistanceText.includes('tripling') ||
                         allResistanceText.includes('2x') ||
                         allResistanceText.includes('3x') ||
                         allResistanceText.includes('substantially more') ||
                         allResistanceText.includes('much higher than') ||
                         allResistanceText.includes('more than expected') ||
                         allResistanceText.includes('over budget')

  if (hasBudgetShock) {
    resistancePenalty += 3
    console.log('💰 [HEAT] Budget shock detected: +3 penalty')
  }
  
  // NEW: Increased need skepticism penalty
  const hasNeedSkepticism = allResistanceText.includes('managed fine') ||
                            allResistanceText.includes('doing okay without') ||
                            allResistanceText.includes('gotten along without') ||
                            allResistanceText.includes('satisfied with current') ||
                            allResistanceText.includes('current solution works') ||
                            allResistanceText.includes('never had an issue')

  if (hasNeedSkepticism) {
    resistancePenalty += 8  // Increased from 5 - economic buyer skepticism is deal-critical
    console.log('⚠️ [HEAT] Need skepticism detected: +8 penalty')
    
    // Extra penalty if economic buyer or influential stakeholder
    const isInfluential = allResistanceText.includes('i have to ask') || 
                          allResistanceText.includes('honestly') ||
                          allResistanceText.includes('to be frank')
    if (isInfluential) {
      resistancePenalty += 3  // Increased from 2
      console.log('⚠️ [HEAT] Need skepticism from influential stakeholder: +3 additional')
    }
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
    trueCommitmentCount,
    exploratoryCount,
    urgencyScore,
    dealScore,
    resistancePenalty,
    hasBudgetShock,
    hasNeedSkepticism
  });
  
  // Floor rule: Medium pain + business drivers deserve MEDIUM minimum
  // BUT only if there's actual buying intent (commitment or exploratory signals)
  if (painLevel === 'medium' && businessFactors.length >= 2) {
    // Only boost if there's buying intent
    if (dealScore < 2 && (trueCommitmentCount > 0 || exploratoryCount > 2)) {
      console.log('🔍 [HEAT] FLOOR RULE: Medium pain + 2+ business factors + buying intent → MEDIUM minimum (dealScore boosted from', dealScore, 'to 2)')
      dealScore = 2  // Boost to MEDIUM threshold
    }
  }
  
  // Floor rule: High pain + business drivers also deserve MEDIUM minimum
  if (painLevel === 'high' && businessFactors.length >= 2) {
    if (dealScore < 2 && (trueCommitmentCount > 0 || exploratoryCount > 2)) {
      console.log('🔍 [HEAT] FLOOR RULE: High pain + 2+ business factors + buying intent → MEDIUM minimum')
      dealScore = 2
    }
  }
  
  // Step 1: Determine PRELIMINARY heat level
  let preliminaryHeat: string
  
  if (
    (painLevel === 'high' && trueCommitmentCount >= 1 && dealScore >= 4) ||  // NEW: Requires commitment + higher score
    (criticalFactors.length >= 1 && trueCommitmentCount >= 1) ||  // Critical factors alone don't guarantee HIGH - need economic buyer commitment
    (dealScore >= 10 && trueCommitmentCount >= 1) ||  // Deal score path now requires commitment and higher threshold
    (trueCommitmentCount >= 2 && dealScore >= 6) ||
    (painLevel === 'medium' && trueCommitmentCount >= 2 && dealScore >= 5)
  ) {
    preliminaryHeat = 'HIGH'
  } else if (
    (painLevel === 'medium' && dealScore >= 2) ||
    (painLevel === 'high' && (dealScore >= 2 || businessFactors.length >= 2)) ||  // NEW: Alternative threshold
    (businessFactors.length >= 1 && dealScore >= 1) ||
    dealScore >= 4
  ) {
    preliminaryHeat = 'MEDIUM'
  } else {
    preliminaryHeat = 'LOW'
  }
  
  // Step 2: Apply downgrade rules BEFORE finalizing
  let heatLevel = preliminaryHeat
  
  if (preliminaryHeat === 'HIGH') {
    // Rule 1: Need skepticism + Budget shock
    if (hasNeedSkepticism && hasBudgetShock) {
      console.log('🔽 [DOWNGRADE] Need skepticism + budget shock → MEDIUM')
      heatLevel = 'MEDIUM'
    }
    // Rule 2: No true commitment + high resistance
    else if (trueCommitmentCount === 0 && resistanceLevel === 'high') {
      console.log('🔽 [DOWNGRADE] No commitment + high resistance → MEDIUM')
      heatLevel = 'MEDIUM'
    }
    // Rule 3: Exploratory stage only
    else if (trueCommitmentCount === 0 && exploratoryCount > 0 && commitmentSignals.length === exploratoryCount) {
      console.log('🔽 [DOWNGRADE] Exploratory stage only → MEDIUM')
      heatLevel = 'MEDIUM'
    }
    // Rule 4: Pain level high but low buying intent
    else if (painLevel === 'high' && dealScore <= 2) {
      console.log('🔽 [DOWNGRADE] High pain but low buying intent → MEDIUM')
      heatLevel = 'MEDIUM'
    }
    // Rule 5: Budget shock with no commitment
    else if (hasBudgetShock && trueCommitmentCount === 0) {
      console.log('🔽 [DOWNGRADE] Budget shock with no commitment signals → MEDIUM')
      heatLevel = 'MEDIUM'
    }
    // Rule 6: Economic buyer resistance (NEW)
    else if (resistanceLevel === 'high' && trueCommitmentCount === 0 && 
             (hasBudgetShock || hasNeedSkepticism)) {
      console.log('🔽 [DOWNGRADE] Economic buyer resistance without commitment → MEDIUM')
      heatLevel = 'MEDIUM'
    }
  }
  
  console.log('🔍 [HEAT] Final heat level:', heatLevel)
  return heatLevel
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

    // Call AI using admin-configured provider
    const defaultProvider = await getDefaultAiProvider(supabase);
    console.log('🔍 [AI] Using provider from admin settings:', defaultProvider, `(${AI_MODELS[defaultProvider]})`);
    
    let aiResponse: string;
    let usedProvider: 'openai' | 'claude' = defaultProvider;
    
    try {
      if (defaultProvider === 'claude') {
        aiResponse = await callClaude(finalPrompt);
      } else {
        aiResponse = await callOpenAI(finalPrompt);
      }
    } catch (aiError) {
      console.error(`🔍 [ERROR] ${defaultProvider} failed:`, aiError);
      
      // Send admin alert for provider failure
      await sendAIServiceFailureEmail(
        supabase, 
        transcriptId, 
        `${defaultProvider.toUpperCase()} (${AI_MODELS[defaultProvider]}) failed: ${aiError instanceof Error ? aiError.message : 'Unknown error'}`
      );
      
      // Set user-friendly error message
      const userErrorMessage = 'Our AI analysis service is temporarily unavailable. Your transcript has been saved and we will notify you when the service is restored. Please try again in a few minutes.';
      await updateTranscriptError(supabase, transcriptId, userErrorMessage);
      throw new Error(userErrorMessage);
    }
    
    console.log('🔍 [AI] AI response received, length:', aiResponse.length);

    // CRITICAL: Validate AI response is not empty
    if (!aiResponse || aiResponse.trim().length === 0) {
      const errorDetails = `Empty response from ${usedProvider.toUpperCase()} (${AI_MODELS[usedProvider]})`;
      console.error('🔍 [CRITICAL] Empty AI response detected');
      
      // Send admin notification email
      await sendAIServiceFailureEmail(supabase, transcriptId, errorDetails);
      
      const userErrorMessage = 'Our AI analysis service returned an incomplete response. Your transcript has been saved. Please try again in a few minutes.';
      await updateTranscriptError(supabase, transcriptId, userErrorMessage);
      throw new Error(userErrorMessage);
    }

    // Parse AI response with validation
    let parsedResult: ParsedAnalysis;
    try {
      parsedResult = parseAIResponse(aiResponse);
      console.log('🔍 [PARSE] AI response parsed successfully');
    } catch (parseError) {
      console.error('🔍 [CRITICAL] Failed to parse AI response:', parseError);
      
      // Send admin notification for parse failure
      await sendAIServiceFailureEmail(
        supabase, 
        transcriptId, 
        `Parse failure from ${usedProvider.toUpperCase()}: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}`
      );
      
      const userErrorMessage = 'Our AI analysis service returned an invalid response. Your transcript has been saved. Please try again in a few minutes.';
      await updateTranscriptError(supabase, transcriptId, userErrorMessage);
      throw new Error(userErrorMessage);
    }

    // ============ EMAIL TONE ENHANCEMENT (TWO-STEP ARCHITECTURE) ============
    // Uses SAME AI provider as main analysis (respects admin choice)
    if (parsedResult.actionPlan?.actions?.length > 0) {
      console.log('📧 [EMAIL] Starting email tone enhancement with provider:', usedProvider);
      
      try {
        const emailsToRewrite = parsedResult.actionPlan.actions
          .filter((action: any) => action.copyPasteContent?.body)
          .map((action: any) => ({
            subject: action.copyPasteContent.subject,
            body: action.copyPasteContent.body
          }));
        
        if (emailsToRewrite.length > 0) {
          console.log('📧 [EMAIL] Found', emailsToRewrite.length, 'emails to enhance');
          
          // Pass usedProvider to ensure same AI service as main analysis
          const rewrittenEmails = await rewriteEmailsForNaturalTone(emailsToRewrite, usedProvider);
          
          let emailIndex = 0;
          parsedResult.actionPlan.actions.forEach((action: any) => {
            if (action.copyPasteContent?.body) {
              action.copyPasteContent.body = rewrittenEmails[emailIndex].body;
              emailIndex++;
            }
          });
          
          console.log('📧 [EMAIL] Email tone enhancement complete using', usedProvider.toUpperCase());
        } else {
          console.log('📧 [EMAIL] No emails found in action plan');
        }
      } catch (emailError) {
        console.error('📧 [EMAIL] Email enhancement failed (non-critical):', emailError);
      }
    }
    // ============ END EMAIL TONE ENHANCEMENT ============

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
      heat_level: heatLevel,
      coaching_insights: parsedResult.coachingInsights
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

    // Phase 2: Deliver to Zoho callback webhook if present (non-blocking)
    deliverToZohoCallback(transcriptId, analysisData, parsedResult)
      .catch(error => {
        console.error('🔍 [ZOHO-WEBHOOK] Zoho callback delivery failed (non-blocking):', error);
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

// Phase 3: Build comprehensive Zoho-formatted webhook payload
async function buildZohoWebhookPayload(
  transcriptData: any,
  analysisData: any,
  parsedResult: ParsedAnalysis
): Promise<any> {
  const callSummary = parsedResult.callSummary || {};
  const heatLevel = analysisData.heat_level || 'LOW';
  const challengerScores = parsedResult.challengerScores || {};
  const guidance = parsedResult.guidance || {};
  const actionPlan = parsedResult.actionPlan || {};
  const participants = parsedResult.participants || {};

  // Map heat level to Zoho deal stage
  const stageMapping: Record<string, string> = {
    'HIGH': 'Proposal Made',
    'MEDIUM': 'Needs Analysis',
    'LOW': 'Qualification'
  };

  // Calculate estimated deal size based on heat and engagement
  const estimateDealSize = (): number | null => {
    if (heatLevel === 'HIGH' && (challengerScores.teaching >= 4 || challengerScores.control >= 4)) {
      return 50000;
    }
    if (heatLevel === 'MEDIUM') {
      return 25000;
    }
    return null;
  };

  // Extract competitive threats
  const competitiveThreats = callSummary.competitiveIntelligence?.vendorsKnown || [];

  // Extract decision makers from participants
  const decisionMakers = participants.clientContacts?.filter((c: any) => 
    c.role?.toLowerCase().includes('ceo') || 
    c.role?.toLowerCase().includes('cto') ||
    c.role?.toLowerCase().includes('director') ||
    c.role?.toLowerCase().includes('vp')
  ).map((c: any) => c.name) || [];

  // Build tasks from action plan
  const tasks = (actionPlan.nextSteps || []).slice(0, 3).map((step: any, index: number) => {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (index === 0 ? 2 : index === 1 ? 7 : 14));
    
    return {
      Subject: step.action || step.title || `Follow-up action ${index + 1}`,
      Description: step.rationale || step.description || step.details || '',
      Due_Date: dueDate.toISOString().split('T')[0],
      Priority: step.priority || (index === 0 ? 'High' : 'Normal'),
      Status: 'Not Started'
    };
  });

  // Build notes
  const callSummaryNote = {
    Note_Title: `AI Call Analysis - ${new Date(transcriptData.meeting_date).toLocaleDateString()}`,
    Note_Content: `
**Call Overview**
${callSummary.overview || 'No overview available'}

**Client Situation**
${callSummary.clientSituation || 'No client situation details'}

**Pain Severity**
Level: ${callSummary.painSeverity?.level?.toUpperCase() || 'UNKNOWN'}
${callSummary.painSeverity?.indicators?.map((i: string) => `- ${i}`).join('\n') || ''}

**Key Takeaways**
${(parsedResult.keyTakeaways || []).map((t: any, i: number) => 
  `${i + 1}. ${typeof t === 'string' ? t : t.takeaway || t.insight || ''}`
).join('\n')}

**AI Recommendation**
${guidance.recommendation || 'Continue engagement'}
${guidance.next_steps?.map((s: string) => `- ${s}`).join('\n') || ''}
    `.trim()
  };

  const competitiveNote = competitiveThreats.length > 0 ? {
    Note_Title: 'Competitive Intelligence',
    Note_Content: `
**Competitors Mentioned**
${competitiveThreats.map((v: string) => `- ${v}`).join('\n')}

**Evaluation Stage**
${callSummary.competitiveIntelligence?.evaluationStage || 'Unknown'}

**Decision Criteria**
${(callSummary.competitiveIntelligence?.decisionCriteria || []).map((c: string) => `- ${c}`).join('\n')}

**Our Competitive Advantage**
${callSummary.competitiveIntelligence?.competitiveAdvantage || 'Not identified'}
    `.trim()
  } : null;

  const notes = [callSummaryNote, competitiveNote].filter(Boolean);

  // Main Zoho payload structure
  return {
    analysis_id: analysisData.id,
    transcript_id: transcriptData.id,
    timestamp: new Date().toISOString(),
    zoho_deal_id: transcriptData.zoho_deal_id,
    
    // Deal Updates (what Zoho should update in the deal record)
    deal_updates: {
      Stage: stageMapping[heatLevel],
      Amount: estimateDealSize(),
      Closing_Date: guidance.timeline || null,
      Description: callSummary.overview || null,
      // Custom fields for AI insights
      cf_ai_heat_level: heatLevel,
      cf_deal_momentum: guidance.momentum || 'steady',
      cf_challenger_teaching: null,
      cf_challenger_tailoring: null,
      cf_challenger_control: null,
      cf_pain_level: callSummary.painSeverity?.level || 'low',
      cf_urgency_level: callSummary.urgencyDrivers?.primary ? 'high' : 'medium',
      cf_buying_signals_quality: callSummary.buyingSignalsAnalysis?.overallQuality || 'weak',
      cf_competitive_threats: competitiveThreats.join(', '),
      cf_decision_makers: decisionMakers.join(', '),
      cf_call_duration: transcriptData.duration_minutes,
      cf_last_analysis_date: new Date().toISOString().split('T')[0]
    },
    
    // Tasks to create in Zoho
    tasks_to_create: tasks,
    
    // Notes to add in Zoho
    notes_to_add: notes,
    
    // Participant/Contact matching (for future CRM sync)
    participant_matches: (participants.clientContacts || []).map((contact: any) => ({
      name: contact.name,
      role: contact.role || contact.title,
      company: transcriptData.extracted_company_name || transcriptData.deal_context?.company_name,
      match_status: 'pending_review'
    })),
    
    // Raw analysis data (optional - for Zoho to decide what to use)
    raw_analysis: {
      heat_level: heatLevel,
      challenger_scores: challengerScores,
      call_summary: callSummary,
      key_takeaways: parsedResult.keyTakeaways,
      recommendations: parsedResult.recommendations,
      guidance: guidance,
      action_plan: actionPlan,
      participants: participants
    }
  };
}

// Phase 2: Deliver analysis to Zoho callback webhook
async function deliverToZohoCallback(
  transcriptId: string,
  analysisData: any,
  parsedResult: ParsedAnalysis
) {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch transcript to get callback_webhook and zoho_deal_id
    const { data: transcript, error: transcriptError } = await supabase
      .from('transcripts')
      .select('*, source_metadata, deal_context')
      .eq('id', transcriptId)
      .single();

    if (transcriptError || !transcript) {
      console.log('[ZOHO-WEBHOOK] No transcript found for callback delivery');
      return;
    }

    // Extract callback webhook from source_metadata
    const callbackWebhook = transcript.source_metadata?.callback_webhook;
    const zohoDealId = transcript.source_metadata?.zoho_deal_id || transcript.zoho_deal_id;

    if (!callbackWebhook) {
      console.log('[ZOHO-WEBHOOK] No callback_webhook configured for this transcript');
      return;
    }

    if (!zohoDealId) {
      console.log('[ZOHO-WEBHOOK] No zoho_deal_id found, skipping callback delivery');
      return;
    }

    console.log('[ZOHO-WEBHOOK] Building Zoho payload for callback:', callbackWebhook);

    // Build comprehensive Zoho-formatted payload
    const zohoPayload = await buildZohoWebhookPayload(transcript, analysisData, parsedResult);

    console.log('[ZOHO-WEBHOOK] Delivering to Zoho callback URL:', callbackWebhook);

    // Deliver to Zoho callback
    const response = await fetch(callbackWebhook, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'SalesWhisperer-ZohoCallback/1.0',
        'X-SalesWhisperer-Event': 'analysis_complete',
        'X-Zoho-Deal-ID': zohoDealId
      },
      body: JSON.stringify(zohoPayload)
    });

    // Log delivery result
    await supabase.from('webhook_delivery_log').insert({
      transcript_id: transcriptId,
      webhook_url: callbackWebhook,
      payload_size: JSON.stringify(zohoPayload).length,
      success: response.ok,
      response_status: response.status,
      error_message: response.ok ? null : await response.text(),
      delivered_at: new Date().toISOString()
    });

    if (response.ok) {
      console.log('[ZOHO-WEBHOOK] Successfully delivered to Zoho:', response.status);
    } else {
      console.error('[ZOHO-WEBHOOK] Failed to deliver to Zoho:', response.status, await response.text());
    }

  } catch (error) {
    console.error('[ZOHO-WEBHOOK] Fatal error in Zoho callback delivery:', error);
    throw error;
  }
}

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
  console.error('🔍 [ERROR] Updating transcript with error:', errorMessage);
  await supabase
    .from('transcripts')
    .update({ 
      status: 'error',
      processing_status: 'error',
      processing_error: errorMessage,
      error_message: errorMessage,
      processed_at: new Date().toISOString()
    })
    .eq('id', transcriptId);
}

// Send admin notification email for AI service failures
async function sendAIServiceFailureEmail(
  supabase: any, 
  transcriptId: string, 
  errorDetails: string
) {
  try {
    const adminEmail = 'ericg@gl3group.com';
    
    console.log('🔍 [ALERT] Sending AI failure notification to:', adminEmail);
    
    const { error } = await supabase.functions.invoke('send-email', {
      body: {
        to: adminEmail,
        subject: '🚨 Sales Whisperer AI Service Failure Alert',
        type: 'ai-service-failure',
        data: {
          transcriptId,
          errorDetails,
          timestamp: new Date().toISOString(),
          environment: Deno.env.get('SUPABASE_URL')?.includes('localhost') ? 'development' : 'production'
        }
      }
    });
    
    if (error) {
      console.error('🔍 [ALERT] Failed to send admin notification:', error);
    } else {
      console.log('🔍 [ALERT] Admin notification email sent successfully');
    }
  } catch (emailError) {
    console.error('🔍 [ALERT] Exception sending admin notification:', emailError);
    // Don't throw - this is a secondary concern
  }
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
      max_completion_tokens: 16384,
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
      'x-api-key': claudeApiKey,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: AI_MODELS.claude,
      max_tokens: 16384,
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
          max_completion_tokens: 50,
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
  
  // Validate response is not empty or too short
  if (!aiResponse || aiResponse.trim().length < 100) {
    throw new Error(`AI response too short or empty (length: ${aiResponse?.length || 0})`);
  }
  
  let parsed;
  try {
    parsed = JSON.parse(aiResponse);
  } catch (jsonError) {
    console.error('🔍 [ERROR] JSON parse failed:', jsonError);
    console.error('🔍 [ERROR] Raw response preview:', aiResponse?.substring(0, 500));
    throw new Error(`Failed to parse AI response as JSON: ${jsonError instanceof Error ? jsonError.message : 'Invalid JSON'}`);
  }
  
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
    actionPlan: parsed.actionPlan || parsed.action_plan || null,
    coachingInsights: parsed.coachingInsights || parsed.coaching_insights || null
  };
  
  // CRITICAL: Validate we got meaningful data
  if (!result.callSummary && !result.challengerScores && !result.guidance) {
    throw new Error('AI response parsed but contained no meaningful analysis data');
  }
  
  console.log('🔍 [PARSE] Final parsed result stored directly from AI response');
  
  return result;
}
