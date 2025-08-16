import { 
  UniversalCRMTransformer, 
  type CRMAnalysisData, 
  type CRMDeal, 
  type CRMTask, 
  type CRMNote,
  type CRMFieldMapping,
  type ContactMatch
} from './universal-transformer';

// Salesforce CRM specific field mapping
const SALESFORCE_FIELD_MAPPING: CRMFieldMapping = {
  deal_fields: {
    'Name': 'name',
    'Amount': 'amount',
    'StageName': 'stage',
    'CloseDate': 'close_date',
    'Description': 'description',
    'ContactId': 'contact_id',
    'AccountId': 'account_id'
  },
  task_fields: {
    'Subject': 'subject',
    'Description': 'description',
    'ActivityDate': 'due_date',
    'Priority': 'priority',
    'Status': 'status',
    'WhatId': 'related_to_id'
  },
  note_fields: {
    'Title': 'title',
    'Body': 'content',
    'ParentId': 'related_to_id'
  },
  custom_fields: {
    'AI_Heat_Level__c': 'AI_Heat_Level',
    'Deal_Momentum__c': 'Deal_Momentum',
    'Challenger_Teaching_Score__c': 'Challenger_Teaching_Score',
    'Challenger_Tailoring_Score__c': 'Challenger_Tailoring_Score',
    'Challenger_Control_Score__c': 'Challenger_Control_Score',
    'Call_Duration_Minutes__c': 'Call_Duration_Minutes',
    'Sales_Whisperer_Transcript_ID__c': 'Sales_Whisperer_Transcript_ID',
    'Sales_Whisperer_Analysis_ID__c': 'Sales_Whisperer_Analysis_ID',
    'AI_Analysis_Confidence__c': 'AI_Analysis_Confidence',
    'Competitive_Threats__c': 'Competitive_Threats',
    'Decision_Makers_Identified__c': 'Decision_Makers_Identified'
  }
};

// Salesforce stage mapping
const SALESFORCE_STAGE_MAPPING: Record<string, string> = {
  'discovery': 'Prospecting',
  'demo': 'Value Proposition',
  'proposal': 'Proposal/Price Quote',
  'negotiation': 'Negotiation/Review',
  'closing': 'Closed Won',
  'follow-up': 'Qualification',
  'continue': 'Needs Analysis',
  'push': 'Proposal/Price Quote',
  'accelerate': 'Negotiation/Review'
};

export class SalesforceCRMTransformer extends UniversalCRMTransformer {
  constructor() {
    super('salesforce', SALESFORCE_FIELD_MAPPING);
  }

  protected transformToDeal(analysisData: CRMAnalysisData, contactMatches: ContactMatch[]): CRMDeal {
    const guidance = analysisData.guidance || {};
    const challengerScores = analysisData.challenger_scores || { teaching: 0, tailoring: 0, control: 0 };

    // Map stage recommendation to Salesforce stages
    const stageRecommendation = guidance.stage_recommendation?.toLowerCase() || 'continue';
    const salesforceStage = SALESFORCE_STAGE_MAPPING[stageRecommendation] || 'Prospecting';

    const deal: CRMDeal = {
      name: this.generateDealName(analysisData),
      amount: guidance.deal_size_estimate || this.estimateDealSize(analysisData),
      stage: salesforceStage,
      close_date: this.calculateCloseDate(analysisData),
      description: this.generateDealDescription(analysisData),
      custom_fields: {
        // AI-specific fields (Salesforce custom fields use __c suffix)
        'AI_Heat_Level__c': this.mapHeatLevel(guidance.heat_level),
        'Deal_Momentum__c': this.mapMomentum(guidance.momentum),
        'Challenger_Teaching_Score__c': challengerScores.teaching,
        'Challenger_Tailoring_Score__c': challengerScores.tailoring,
        'Challenger_Control_Score__c': challengerScores.control,
        
        // Call metadata
        'Call_Duration_Minutes__c': analysisData.duration_minutes,
        'Sales_Whisperer_Transcript_ID__c': analysisData.transcript_id,
        'Sales_Whisperer_Analysis_ID__c': analysisData.id,
        'AI_Analysis_Confidence__c': this.calculateOverallConfidence(challengerScores),
        
        // Business intelligence
        'Competitive_Threats__c': this.extractCompetitiveThreats(analysisData).join('; '),
        'Decision_Makers_Identified__c': this.extractDecisionMakers(analysisData).join('; ')
      }
    };

    // Add contact linking if high confidence match
    const contactLinking = this.determineContactLinking(contactMatches);
    if (!contactLinking.requires_review && contactLinking.contact_id) {
      deal.contact_id = contactLinking.contact_id;
    }

    return deal;
  }

  protected transformToTasks(analysisData: CRMAnalysisData): CRMTask[] {
    const nextSteps = analysisData.guidance?.next_steps || [];
    const tasks: CRMTask[] = [];

    for (const step of nextSteps) {
      if (typeof step === 'string') {
        tasks.push({
          subject: step,
          description: `Follow-up action from call analysis`,
          due_date: this.calculateDueDate({ timeframe: '1 week' }),
          priority: 'Medium',
          status: 'Not Started',
          related_to_type: 'Deal',
          custom_fields: {
            'Source__c': 'Sales Whisperer AI',
            'Analysis_ID__c': analysisData.id
          }
        });
      } else if (typeof step === 'object' && step !== null) {
        tasks.push({
          subject: step.action || step.task || step.description || 'Follow-up required',
          description: step.details || step.notes || `Action item from ${analysisData.call_date} call`,
          due_date: this.calculateDueDate(step),
          priority: this.mapSalesforcePriority(step),
          status: 'Not Started',
          related_to_type: 'Deal',
          custom_fields: {
            'Source__c': 'Sales Whisperer AI',
            'Analysis_ID__c': analysisData.id,
            'Step_Type__c': step.type || 'follow_up',
            'Urgency_Level__c': step.urgency || 'normal'
          }
        });
      }
    }

    // Add mandatory follow-up task if no next steps provided
    if (tasks.length === 0) {
      tasks.push({
        subject: 'Follow up on call discussion',
        description: `Follow up on conversation from ${new Date(analysisData.call_date).toLocaleDateString()}`,
        due_date: this.calculateDueDate({ timeframe: '3 days' }),
        priority: 'Medium',
        status: 'Not Started',
        related_to_type: 'Deal',
        custom_fields: {
          'Source__c': 'Sales Whisperer AI (Auto-generated)',
          'Analysis_ID__c': analysisData.id
        }
      });
    }

    return tasks;
  }

  protected transformToNotes(analysisData: CRMAnalysisData): CRMNote[] {
    const notes: CRMNote[] = [];
    const callDate = new Date(analysisData.call_date).toLocaleDateString();

    // Main call summary note
    const summaryContent = this.generateCallSummaryContent(analysisData);
    notes.push({
      title: `AI Call Analysis - ${callDate}`,
      content: summaryContent,
      related_to_type: 'Deal',
      created_date: new Date().toISOString(),
      custom_fields: {
        'Note_Type__c': 'AI_Analysis',
        'Analysis_ID__c': analysisData.id,
        'Confidence_Score__c': this.calculateOverallConfidence(analysisData.challenger_scores)
      }
    });

    // Competitive insights note (if available)
    const competitiveInsights = this.extractCompetitiveThreats(analysisData);
    if (competitiveInsights && competitiveInsights.length > 0) {
      notes.push({
        title: `Competitive Intelligence - ${callDate}`,
        content: `Competitive threats identified:\n${competitiveInsights.join('\n')}`,
        related_to_type: 'Deal',
        created_date: new Date().toISOString(),
        custom_fields: {
          'Note_Type__c': 'Competitive_Intelligence',
          'Analysis_ID__c': analysisData.id
        }
      });
    }

    return notes;
  }

  // Salesforce-specific helper methods
  private mapHeatLevel(heatLevel?: string): string {
    const level = heatLevel?.toLowerCase() || 'medium';
    const mapping: Record<string, string> = {
      'hot': 'Hot',
      'warm': 'Warm', 
      'cold': 'Cold',
      'high': 'Hot',
      'medium': 'Warm',
      'low': 'Cold'
    };
    return mapping[level] || 'Warm';
  }

  private mapMomentum(momentum?: string): string {
    const mom = momentum?.toLowerCase() || 'steady';
    const mapping: Record<string, string> = {
      'accelerating': 'Accelerating',
      'steady': 'Steady',
      'stalled': 'Stalled',
      'declining': 'Declining'
    };
    return mapping[mom] || 'Steady';
  }

  private mapSalesforcePriority(nextStep: any): 'High' | 'Medium' | 'Low' {
    const priority = nextStep.priority?.toLowerCase() || '';
    const urgency = nextStep.urgency?.toLowerCase() || '';
    
    if (priority.includes('high') || urgency.includes('urgent') || urgency.includes('asap')) {
      return 'High';
    } else if (priority.includes('low') || urgency.includes('later')) {
      return 'Low';
    } else {
      return 'Medium';
    }
  }

  private estimateDealSize(analysisData: CRMAnalysisData): number {
    // Simple heuristic based on call duration and heat level
    const baseDealSize = 15000; // $15K base for Salesforce (typically larger deals)
    const duration = analysisData.duration_minutes || 30;
    const heatLevel = analysisData.guidance?.heat_level?.toLowerCase() || 'medium';

    let multiplier = 1;
    if (heatLevel === 'hot') multiplier = 2.5;
    else if (heatLevel === 'cold') multiplier = 0.6;

    // Longer calls might indicate larger deals
    const durationMultiplier = Math.min(duration / 60, 2.5); // Max 2.5x for 60+ min calls

    return Math.round(baseDealSize * multiplier * durationMultiplier);
  }

  private generateDealDescription(analysisData: CRMAnalysisData): string {
    const guidance = analysisData.guidance || {};
    const parts = [
      `AI-analyzed sales call from ${new Date(analysisData.call_date).toLocaleDateString()}`,
      `Duration: ${analysisData.duration_minutes} minutes`,
      `Heat Level: ${this.mapHeatLevel(guidance.heat_level)}`,
      `Momentum: ${this.mapMomentum(guidance.momentum)}`
    ];

    if (guidance.call_summary && typeof guidance.call_summary === 'string') {
      parts.push(`Summary: ${guidance.call_summary}`);
    }

    return parts.join('\n');
  }

  private calculateOverallConfidence(challengerScores: any): number {
    if (!challengerScores) return 50;
    
    const teaching = challengerScores.teaching || 0;
    const tailoring = challengerScores.tailoring || 0;
    const control = challengerScores.control || 0;
    
    // Convert 1-5 scale to percentage
    const avgScore = (teaching + tailoring + control) / 3;
    return Math.round((avgScore / 5) * 100);
  }

  private extractCompetitiveThreats(analysisData: CRMAnalysisData): string[] {
    const threats: string[] = [];
    
    if (analysisData.guidance?.competitive_insights) {
      const insights = analysisData.guidance.competitive_insights;
      if (typeof insights === 'string') {
        threats.push(insights);
      } else if (Array.isArray(insights)) {
        threats.push(...insights);
      } else if (typeof insights === 'object') {
        Object.values(insights).forEach(insight => {
          if (typeof insight === 'string') threats.push(insight);
        });
      }
    }

    return threats;
  }

  private extractDecisionMakers(analysisData: CRMAnalysisData): string[] {
    const decisionMakers: string[] = [];
    
    // Extract from participants who seem to be decision makers
    if (analysisData.participants && Array.isArray(analysisData.participants)) {
      analysisData.participants.forEach(participant => {
        if (typeof participant === 'string') {
          // Look for titles that indicate decision-making authority
          if (participant.toLowerCase().match(/(ceo|cto|president|director|vp|head|manager|owner)/)) {
            decisionMakers.push(participant);
          }
        } else if (typeof participant === 'object' && participant !== null) {
          const name = participant.name || participant.participant;
          const title = participant.title || participant.role;
          if (title && title.toLowerCase().match(/(ceo|cto|president|director|vp|head|manager|owner)/)) {
            decisionMakers.push(`${name} (${title})`);
          }
        }
      });
    }

    return decisionMakers;
  }

  private generateCallSummaryContent(analysisData: CRMAnalysisData): string {
    const sections = [];
    const guidance = analysisData.guidance || {};
    const challengerScores = analysisData.challenger_scores || { teaching: 0, tailoring: 0, control: 0 };

    // Call overview
    sections.push(`CALL OVERVIEW`);
    sections.push(`Date: ${new Date(analysisData.call_date).toLocaleDateString()}`);
    sections.push(`Duration: ${analysisData.duration_minutes} minutes`);
    sections.push(`Participants: ${analysisData.participants?.length || 0}`);
    sections.push('');

    // AI Analysis scores
    sections.push(`CHALLENGER SALES ANALYSIS`);
    sections.push(`Teaching: ${challengerScores.teaching}/5`);
    sections.push(`Tailoring: ${challengerScores.tailoring}/5`);
    sections.push(`Control: ${challengerScores.control}/5`);
    sections.push(`Overall Confidence: ${this.calculateOverallConfidence(challengerScores)}%`);
    sections.push('');

    // Deal intelligence
    sections.push(`DEAL INTELLIGENCE`);
    sections.push(`Heat Level: ${this.mapHeatLevel(guidance.heat_level)}`);
    sections.push(`Momentum: ${this.mapMomentum(guidance.momentum)}`);
    sections.push(`Stage Recommendation: ${guidance.stage_recommendation || 'Continue'}`);
    sections.push('');

    // Next steps
    if (guidance.next_steps && Array.isArray(guidance.next_steps) && guidance.next_steps.length > 0) {
      sections.push(`NEXT STEPS`);
      guidance.next_steps.forEach((step, index) => {
        if (typeof step === 'string') {
          sections.push(`${index + 1}. ${step}`);
        } else if (typeof step === 'object' && step !== null) {
          sections.push(`${index + 1}. ${step.action || step.task || step.description}`);
        }
      });
      sections.push('');
    }

    // Key insights
    const insights = this.extractKeyInsights(analysisData);
    if (insights.length > 0) {
      sections.push(`KEY INSIGHTS`);
      insights.forEach((insight, index) => {
        sections.push(`• ${insight}`);
      });
      sections.push('');
    }

    sections.push(`Generated by Sales Whisperer AI on ${new Date().toLocaleDateString()}`);

    return sections.join('\n');
  }
}