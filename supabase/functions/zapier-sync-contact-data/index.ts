import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { BidirectionalSyncManager } from '../_shared/bidirectional-sync.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { 
      user_id,
      contact_data,
      crm_contact_id,
      crm_system,
      matching_confidence,
      suggested_matches,
      force_update = false
    } = await req.json();

    console.log('Sync Contact Data request:', { user_id, crm_contact_id, crm_system });

    if (!user_id || !contact_data || !crm_contact_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: user_id, contact_data, crm_contact_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', user_id)
      .single();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid user ID' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize sync manager
    const syncManager = new BidirectionalSyncManager(user_id);

    // Create sync operation for contact data sync
    const syncOperation = await syncManager.createSyncOperation({
      sync_type: 'crm_to_sw',
      operation_type: 'contact_sync',
      source_system: crm_system || 'unknown_crm',
      source_record_id: crm_contact_id,
      target_system: 'sales_whisperer',
      sync_data: {
        contact_data,
        matching_confidence: matching_confidence || 0,
        suggested_matches: suggested_matches || [],
        sync_type: 'contact_refresh',
        last_synced: new Date().toISOString()
      }
    });

    // Perform contact matching analysis
    const matchingResults = await this.analyzeContactMatches(
      contact_data,
      suggested_matches || [],
      matching_confidence || 0
    );

    // Check if matching confidence is too low and create match review
    if (matchingResults.confidence < 0.7 && !force_update) {
      const { data: matchReview, error: reviewError } = await supabase
        .from('zapier_match_reviews')
        .insert({
          user_id,
          participant_data: contact_data,
          suggested_matches: matchingResults.matches,
          status: 'pending'
        })
        .select()
        .single();

      if (reviewError) {
        console.error('Failed to create match review:', reviewError);
      }

      // Check for failed matches trigger
      const { data: triggers, error: triggersError } = await supabase
        .from('advanced_webhook_triggers')
        .select('*')
        .eq('user_id', user_id)
        .eq('trigger_type', 'failed_matches')
        .eq('is_active', true);

      if (!triggersError && triggers) {
        for (const trigger of triggers) {
          const condition = trigger.trigger_condition as any;
          
          if (this.evaluateFailedMatchTrigger(condition, matchingResults)) {
            console.log(`Triggering failed match webhook: ${trigger.webhook_url}`);
            
            // Update trigger timestamp
            await supabase
              .from('advanced_webhook_triggers')
              .update({
                last_triggered: new Date().toISOString(),
                trigger_count: trigger.trigger_count + 1
              })
              .eq('id', trigger.id);
          }
        }
      }

      return new Response(
        JSON.stringify({
          success: false,
          requires_review: true,
          match_review_id: matchReview?.id,
          matching_confidence: matchingResults.confidence,
          suggested_matches: matchingResults.matches,
          message: 'Contact matching confidence too low - manual review required'
        }),
        { status: 202, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Execute the sync operation
    await syncManager.executeSyncOperation(syncOperation.id);

    // Update any existing transcripts with improved contact matching
    await this.updateTranscriptParticipants(
      supabase,
      user_id,
      contact_data,
      matchingResults.bestMatch
    );

    return new Response(
      JSON.stringify({
        success: true,
        sync_operation_id: syncOperation.id,
        matching_confidence: matchingResults.confidence,
        best_match: matchingResults.bestMatch,
        updated_transcripts: matchingResults.updatedTranscripts || 0,
        message: 'Contact data synced successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in sync-contact-data:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  // Helper function to analyze contact matches
  async function analyzeContactMatches(
    contactData: any,
    suggestedMatches: any[],
    initialConfidence: number
  ) {
    const matches = suggestedMatches.map(match => ({
      ...match,
      confidence: this.calculateMatchConfidence(contactData, match)
    }));

    const bestMatch = matches.reduce((best, current) => 
      current.confidence > (best?.confidence || 0) ? current : best
    , null);

    return {
      confidence: bestMatch?.confidence || initialConfidence,
      matches: matches.sort((a, b) => b.confidence - a.confidence),
      bestMatch
    };
  }

  // Helper function to calculate match confidence
  function calculateMatchConfidence(contactData: any, matchCandidate: any): number {
    let confidence = 0;
    let factors = 0;

    // Email match (highest weight)
    if (contactData.email && matchCandidate.email) {
      confidence += contactData.email.toLowerCase() === matchCandidate.email.toLowerCase() ? 0.4 : 0;
      factors++;
    }

    // Name match
    if (contactData.name && matchCandidate.name) {
      const nameSimilarity = this.calculateStringSimilarity(
        contactData.name.toLowerCase(),
        matchCandidate.name.toLowerCase()
      );
      confidence += nameSimilarity * 0.3;
      factors++;
    }

    // Phone match
    if (contactData.phone && matchCandidate.phone) {
      const phoneClean1 = contactData.phone.replace(/\D/g, '');
      const phoneClean2 = matchCandidate.phone.replace(/\D/g, '');
      confidence += phoneClean1 === phoneClean2 ? 0.2 : 0;
      factors++;
    }

    // Company match
    if (contactData.company && matchCandidate.company) {
      const companySimilarity = this.calculateStringSimilarity(
        contactData.company.toLowerCase(),
        matchCandidate.company.toLowerCase()
      );
      confidence += companySimilarity * 0.1;
      factors++;
    }

    return factors > 0 ? confidence : 0;
  }

  // Helper function to calculate string similarity
  function calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  // Helper function to calculate Levenshtein distance
  function levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  // Helper function to evaluate failed match trigger conditions
  function evaluateFailedMatchTrigger(condition: any, matchingResults: any): boolean {
    const confidence = matchingResults.confidence;
    const threshold = condition.confidence_threshold || 0.7;
    
    // Trigger if confidence is below threshold
    if (confidence >= threshold) return false;

    // Check if this is a recurring issue
    if (condition.require_multiple_failures) {
      // This would require tracking failure history
      return confidence < (threshold * 0.5); // Significantly low confidence
    }

    return true;
  }

  // Helper function to update transcript participants with better matching
  async function updateTranscriptParticipants(
    supabase: any,
    userId: string,
    contactData: any,
    bestMatch: any
  ) {
    if (!bestMatch || !contactData.email) return 0;

    // Find transcripts with participants matching the email
    const { data: transcripts, error } = await supabase
      .from('transcripts')
      .select('id, participants')
      .eq('user_id', userId)
      .contains('participants', [{ email: contactData.email }]);

    if (error || !transcripts) return 0;

    let updatedCount = 0;
    
    for (const transcript of transcripts) {
      const participants = transcript.participants as any[];
      let updated = false;

      const updatedParticipants = participants.map(p => {
        if (p.email === contactData.email) {
          updated = true;
          return {
            ...p,
            ...contactData,
            crm_contact_id: bestMatch.id,
            last_synced: new Date().toISOString()
          };
        }
        return p;
      });

      if (updated) {
        await supabase
          .from('transcripts')
          .update({ participants: updatedParticipants })
          .eq('id', transcript.id);
        updatedCount++;
      }
    }

    return updatedCount;
  }
});