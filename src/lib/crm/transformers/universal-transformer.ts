import type { ContactMatch } from "@/lib/matching/contact-matcher";

// Re-export ContactMatch for use in specific transformers
export type { ContactMatch };

// Base interfaces for CRM transformation
export interface CRMAnalysisData {
  id: string;
  transcript_id: string;
  call_date: string;
  duration_minutes: number;
  participants: any[];
  challenger_scores: {
    teaching: number;
    tailoring: number;
    control: number;
  };
  guidance: {
    heat_level?: string;
    momentum?: string;
    stage_recommendation?: string;
    next_steps?: any[];
    call_summary?: string;
    competitive_insights?: any;
    deal_size_estimate?: number;
  };
  call_summary?: any;
  account?: {
    id: string;
    name: string;
    deal_stage?: string;
  };
}

export interface CRMDeal {
  name: string;
  amount?: number;
  stage: string;
  close_date?: string;
  description?: string;
  contact_id?: string;
  account_id?: string;
  custom_fields: Record<string, any>;
}

export interface CRMTask {
  subject: string;
  description?: string;
  due_date?: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Not Started' | 'In Progress' | 'Completed';
  related_to_id?: string;
  related_to_type?: 'Deal' | 'Contact' | 'Account';
  custom_fields: Record<string, any>;
}

export interface CRMNote {
  title: string;
  content: string;
  related_to_id?: string;
  related_to_type?: 'Deal' | 'Contact' | 'Account';
  created_date?: string;
  custom_fields: Record<string, any>;
}

export interface CRMTransformationResult {
  deal: CRMDeal;
  tasks: CRMTask[];
  notes: CRMNote[];
  contact_linking: {
    confidence: number;
    contact_id?: string;
    requires_review: boolean;
    reasoning: string;
  };
  metadata: {
    analysis_id: string;
    transcript_id: string;
    transformation_timestamp: string;
    crm_type: string;
  };
}

export interface CRMFieldMapping {
  deal_fields: Record<string, string>;
  task_fields: Record<string, string>;
  note_fields: Record<string, string>;
  custom_fields: Record<string, string>;
}

// Confidence thresholds for contact linking
export const LINKING_CONFIDENCE = {
  HIGH: 85,
  MEDIUM: 70,
  LOW: 50
} as const;

// Base universal transformer class
export abstract class UniversalCRMTransformer {
  protected crmType: string;
  protected fieldMapping: CRMFieldMapping;

  constructor(crmType: string, fieldMapping: CRMFieldMapping) {
    this.crmType = crmType;
    this.fieldMapping = fieldMapping;
  }

  // Main transformation method
  async transform(
    analysisData: CRMAnalysisData,
    contactMatches: ContactMatch[] = []
  ): Promise<CRMTransformationResult> {
    const deal = this.transformToDeal(analysisData, contactMatches);
    const tasks = this.transformToTasks(analysisData);
    const notes = this.transformToNotes(analysisData);
    const contactLinking = this.determineContactLinking(contactMatches);

    return {
      deal,
      tasks,
      notes,
      contact_linking: contactLinking,
      metadata: {
        analysis_id: analysisData.id,
        transcript_id: analysisData.transcript_id,
        transformation_timestamp: new Date().toISOString(),
        crm_type: this.crmType
      }
    };
  }

  // Abstract methods to be implemented by specific CRM transformers
  protected abstract transformToDeal(analysisData: CRMAnalysisData, contactMatches: ContactMatch[]): CRMDeal;
  protected abstract transformToTasks(analysisData: CRMAnalysisData): CRMTask[];
  protected abstract transformToNotes(analysisData: CRMAnalysisData): CRMNote[];

  // Common utility methods
  protected determineContactLinking(contactMatches: ContactMatch[]) {
    if (!contactMatches || contactMatches.length === 0) {
      return {
        confidence: 0,
        requires_review: true,
        reasoning: "No contact matches found"
      };
    }

    const bestMatch = contactMatches[0];

    if (bestMatch.confidence >= LINKING_CONFIDENCE.HIGH) {
      return {
        confidence: bestMatch.confidence,
        contact_id: bestMatch.contact_id,
        requires_review: false,
        reasoning: `High confidence match: ${bestMatch.reasoning}`
      };
    } else if (bestMatch.confidence >= LINKING_CONFIDENCE.MEDIUM) {
      return {
        confidence: bestMatch.confidence,
        contact_id: bestMatch.contact_id,
        requires_review: true,
        reasoning: `Medium confidence match requires review: ${bestMatch.reasoning}`
      };
    } else {
      return {
        confidence: bestMatch.confidence,
        requires_review: true,
        reasoning: `Low confidence match: ${bestMatch.reasoning}`
      };
    }
  }

  protected generateDealName(analysisData: CRMAnalysisData): string {
    const company = analysisData.account?.name || 'Unknown Company';
    const callType = this.inferCallType(analysisData);
    return `${company} - ${callType} Call`;
  }

  protected inferCallType(analysisData: CRMAnalysisData): string {
    const guidance = analysisData.guidance;
    const stage = guidance?.stage_recommendation?.toLowerCase() || '';
    const heatLevel = guidance?.heat_level?.toLowerCase() || '';

    if (stage.includes('discovery') || heatLevel === 'cold') {
      return 'Discovery';
    } else if (stage.includes('demo') || stage.includes('presentation')) {
      return 'Demo';
    } else if (stage.includes('proposal') || stage.includes('quote')) {
      return 'Proposal';
    } else if (stage.includes('negotiation') || heatLevel === 'hot') {
      return 'Negotiation';
    } else if (stage.includes('close') || stage.includes('decision')) {
      return 'Closing';
    } else {
      return 'Follow-up';
    }
  }

  protected calculateCloseDate(analysisData: CRMAnalysisData): string {
    const momentum = analysisData.guidance?.momentum?.toLowerCase() || '';
    const heatLevel = analysisData.guidance?.heat_level?.toLowerCase() || '';
    
    let daysToAdd = 30; // Default 30 days

    if (heatLevel === 'hot' || momentum === 'accelerating') {
      daysToAdd = 14;
    } else if (heatLevel === 'warm' || momentum === 'steady') {
      daysToAdd = 21;
    } else if (heatLevel === 'cold' || momentum === 'stalled') {
      daysToAdd = 45;
    }

    const closeDate = new Date();
    closeDate.setDate(closeDate.getDate() + daysToAdd);
    return closeDate.toISOString().split('T')[0];
  }

  protected mapPriority(nextStep: any): 'Low' | 'Medium' | 'High' {
    const priority = nextStep.priority?.toLowerCase() || '';
    const urgency = nextStep.urgency?.toLowerCase() || '';
    
    if (priority.includes('high') || urgency.includes('urgent') || urgency.includes('asap')) {
      return 'High';
    } else if (priority.includes('medium') || urgency.includes('soon')) {
      return 'Medium';
    } else {
      return 'Low';
    }
  }

  protected calculateDueDate(nextStep: any): string {
    const timeframe = nextStep.timeframe || nextStep.timeline || '1 week';
    const dueDate = new Date();

    if (timeframe.includes('today') || timeframe.includes('asap')) {
      // Due today
    } else if (timeframe.includes('tomorrow')) {
      dueDate.setDate(dueDate.getDate() + 1);
    } else if (timeframe.includes('week')) {
      const weeks = parseInt(timeframe.match(/\d+/)?.[0] || '1');
      dueDate.setDate(dueDate.getDate() + (weeks * 7));
    } else if (timeframe.includes('day')) {
      const days = parseInt(timeframe.match(/\d+/)?.[0] || '1');
      dueDate.setDate(dueDate.getDate() + days);
    } else if (timeframe.includes('month')) {
      const months = parseInt(timeframe.match(/\d+/)?.[0] || '1');
      dueDate.setMonth(dueDate.getMonth() + months);
    } else {
      // Default to 1 week
      dueDate.setDate(dueDate.getDate() + 7);
    }

    return dueDate.toISOString().split('T')[0];
  }

  protected formatChallengerScores(scores: any): string {
    if (!scores) return 'N/A';
    
    return `Teaching: ${scores.teaching || 0}/5, Tailoring: ${scores.tailoring || 0}/5, Control: ${scores.control || 0}/5`;
  }

  protected extractKeyInsights(analysisData: CRMAnalysisData): string[] {
    const insights: string[] = [];
    
    if (analysisData.guidance?.competitive_insights) {
      const competitive = analysisData.guidance.competitive_insights;
      if (typeof competitive === 'string') {
        insights.push(competitive);
      } else if (Array.isArray(competitive)) {
        insights.push(...competitive);
      }
    }

    if (analysisData.call_summary?.key_points) {
      const keyPoints = analysisData.call_summary.key_points;
      if (Array.isArray(keyPoints)) {
        insights.push(...keyPoints);
      }
    }

    return insights;
  }

  // Get CRM type
  getCRMType(): string {
    return this.crmType;
  }

  // Get field mapping
  getFieldMapping(): CRMFieldMapping {
    return this.fieldMapping;
  }
}