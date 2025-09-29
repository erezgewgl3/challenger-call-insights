// Shared transcript processing logic for all integrations
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

export interface TranscriptCreationData {
  user_id: string;
  title: string;
  meeting_date: string;
  duration_minutes?: number;
  participants: string[];
  raw_text: string;
  external_source: string;
  account_id?: string;
  source_meeting_id?: string;
  deal_context?: Record<string, any>;
  source_metadata?: Record<string, any>;
  assignment_metadata?: Record<string, any>;
}

export interface ProcessingResult {
  success: boolean;
  transcript_id?: string;
  error?: string;
  analysis_triggered?: boolean;
}

export class UnifiedTranscriptProcessor {
  private supabase: any;

  constructor() {
    this.supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
  }

  /**
   * Create transcript with unified ownership model
   * All transcripts are owned by user_id, no self-assignment
   */
  async createTranscript(data: TranscriptCreationData): Promise<ProcessingResult> {
    try {
      console.log(`📄 [PROCESSOR] Creating transcript for user: ${data.user_id}, source: ${data.external_source}`);

      // Validate required fields
      if (!data.user_id || !data.title || !data.raw_text) {
        return {
          success: false,
          error: 'Missing required fields: user_id, title, or raw_text'
        };
      }

      // Find or create account if company name provided
      let accountId = data.account_id;
      if (!accountId && data.deal_context?.company_name) {
        accountId = await this.findOrCreateAccount(
          data.user_id, 
          data.deal_context.company_name
        );
      }

      // Create transcript with unified ownership model
      const transcriptData = {
        user_id: data.user_id,
        account_id: accountId,
        assigned_user_id: null, // No self-assignment in unified model
        title: data.title,
        participants: data.participants,
        meeting_date: data.meeting_date,
        duration_minutes: data.duration_minutes,
        raw_text: data.raw_text,
        processing_status: 'pending',
        external_source: data.external_source,
        priority_level: 'normal',
        source_meeting_id: data.source_meeting_id,
        deal_context: data.deal_context || {},
        source_metadata: data.source_metadata || {},
        assignment_metadata: data.assignment_metadata || {}
      };

      const { data: transcript, error: transcriptError } = await this.supabase
        .from('transcripts')
        .insert(transcriptData)
        .select()
        .single();

      if (transcriptError) {
        console.error('📄 [ERROR] Transcript creation failed:', transcriptError);
        return {
          success: false,
          error: `Failed to create transcript: ${transcriptError.message}`
        };
      }

      console.log(`📄 [SUCCESS] Created transcript: ${transcript.id}`);

      // Trigger AI analysis if auto-analysis is enabled
      const analysisTriggered = await this.triggerAnalysis(transcript.id, data.external_source);

      return {
        success: true,
        transcript_id: transcript.id,
        analysis_triggered: analysisTriggered
      };

    } catch (error) {
      console.error('📄 [FATAL] Transcript processing failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Extract participants from transcript content
   */
  extractParticipants(transcriptText: string): string[] {
    const participants: Set<string> = new Set();
    
    // Common patterns for participant detection
    const patterns = [
      /^([A-Za-z\s]+?):/gm,  // "Name:" at start of line
      /Speaker\s+(\d+)/gi,   // "Speaker 1", "Speaker 2"
      /\[([A-Za-z\s]+?)\]/gm, // "[Name]"
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(transcriptText)) !== null) {
        const name = match[1].trim();
        if (name && name.length > 0 && name.length < 50) {
          participants.add(name);
        }
      }
    });

    return Array.from(participants).slice(0, 10); // Limit to 10 participants
  }

  /**
   * Find or create account for company
   */
  private async findOrCreateAccount(userId: string, companyName: string): Promise<string | null> {
    try {
      // Try to find existing account
      const { data: existingAccount, error: lookupError } = await this.supabase
        .from('accounts')
        .select('id')
        .eq('user_id', userId)
        .eq('name', companyName)
        .single();

      if (existingAccount) {
        console.log(`🏢 [ACCOUNT] Using existing account: ${existingAccount.id}`);
        return existingAccount.id;
      }

      // Create new account
      const { data: newAccount, error: createError } = await this.supabase
        .from('accounts')
        .insert({
          user_id: userId,
          name: companyName,
          deal_stage: 'discovery',
          notes: 'Auto-created from integration'
        })
        .select('id')
        .single();

      if (newAccount) {
        console.log(`🏢 [ACCOUNT] Created new account: ${newAccount.id}`);
        return newAccount.id;
      } else {
        console.error('🏢 [ERROR] Account creation failed:', createError);
        return null;
      }
    } catch (error) {
      console.error('🏢 [ERROR] Account processing failed:', error);
      return null;
    }
  }

  /**
   * Trigger AI analysis for transcript
   */
  private async triggerAnalysis(transcriptId: string, source: string): Promise<boolean> {
    try {
      console.log(`🤖 [ANALYSIS] Triggering analysis for transcript: ${transcriptId}`);

      const { error: analysisError } = await this.supabase.functions.invoke('analyze-transcript', {
        body: {
          transcript_id: transcriptId,
          meeting_metadata: {
            integration: source,
            auto_triggered: true,
            triggered_at: new Date().toISOString()
          }
        }
      });

      if (analysisError) {
        console.error('🤖 [ERROR] Analysis trigger failed:', analysisError);
        return false;
      }

      console.log('🤖 [SUCCESS] Analysis triggered successfully');
      return true;
    } catch (error) {
      console.error('🤖 [ERROR] Analysis trigger error:', error);
      return false;
    }
  }

  /**
   * Download transcript from URL with authentication
   */
  async downloadTranscript(url: string, authHeaders?: Record<string, string>): Promise<string | null> {
    try {
      console.log(`📥 [DOWNLOAD] Fetching transcript from: ${url.substring(0, 50)}...`);

      const headers: Record<string, string> = {
        'User-Agent': 'Sales-Whisperer/1.0'
      };

      if (authHeaders) {
        Object.assign(headers, authHeaders);
      }

      const response = await fetch(url, { headers });

      if (!response.ok) {
        console.error(`📥 [ERROR] Download failed: ${response.status} ${response.statusText}`);
        return null;
      }

      const contentType = response.headers.get('content-type') || '';
      const content = await response.text();

      // Handle different content types
      if (contentType.includes('application/json')) {
        try {
          const jsonData = JSON.parse(content);
          // Extract transcript from common JSON structures
          return jsonData.transcript || jsonData.text || jsonData.content || JSON.stringify(jsonData, null, 2);
        } catch {
          return content;
        }
      }

      console.log(`📥 [SUCCESS] Downloaded transcript, length: ${content.length}`);
      return content;
    } catch (error) {
      console.error('📥 [ERROR] Download error:', error);
      return null;
    }
  }

  /**
   * Validate transcript content
   */
  validateTranscriptContent(content: string): { valid: boolean; error?: string } {
    if (!content || content.trim().length === 0) {
      return { valid: false, error: 'Transcript content is empty' };
    }

    if (content.length > 500000) {
      return { valid: false, error: 'Transcript content exceeds 500KB limit' };
    }

    // Check for minimum content
    if (content.trim().length < 50) {
      return { valid: false, error: 'Transcript content too short (minimum 50 characters)' };
    }

    return { valid: true };
  }
}

export default UnifiedTranscriptProcessor;