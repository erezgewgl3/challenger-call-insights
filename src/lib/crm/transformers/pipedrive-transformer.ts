import { 
  UniversalCRMTransformer, 
  type CRMAnalysisData, 
  type CRMDeal, 
  type CRMTask, 
  type CRMNote,
  type CRMFieldMapping,
  type ContactMatch
} from './universal-transformer';

// Pipedrive CRM specific field mapping
const PIPEDRIVE_FIELD_MAPPING: CRMFieldMapping = {
  deal_fields: {
    'title': 'name',
    'value': 'amount',
    'stage_id': 'stage',
    'expected_close_date': 'close_date',
    'notes': 'description',
    'person_id': 'contact_id',
    'org_id': 'account_id'
  },
  task_fields: {
    'subject': 'subject',
    'note': 'description', 
    'due_date': 'due_date',
    'type': 'priority',
    'done': 'status',
    'deal_id': 'related_to_id'
  },
  note_fields: {
    'content': 'content',
    'deal_id': 'related_to_id'
  },
  custom_fields: {}
};

export class PipedriveCRMTransformer extends UniversalCRMTransformer {
  constructor() {
    super('pipedrive', PIPEDRIVE_FIELD_MAPPING);
  }

  protected transformToDeal(analysisData: CRMAnalysisData, contactMatches: ContactMatch[]): CRMDeal {
    return {
      name: this.generateDealName(analysisData),
      amount: analysisData.guidance?.deal_size_estimate || 10000,
      stage: 'qualified',
      close_date: this.calculateCloseDate(analysisData),
      description: `AI-analyzed call from ${analysisData.call_date}`,
      custom_fields: {}
    };
  }

  protected transformToTasks(analysisData: CRMAnalysisData): CRMTask[] {
    return [{
      subject: 'Follow up on call',
      description: 'Follow up from AI analysis',
      due_date: this.calculateDueDate({ timeframe: '1 week' }),
      priority: 'Medium',
      status: 'Not Started',
      custom_fields: {}
    }];
  }

  protected transformToNotes(analysisData: CRMAnalysisData): CRMNote[] {
    return [{
      title: `AI Call Analysis - ${new Date(analysisData.call_date).toLocaleDateString()}`,
      content: `Call analyzed by Sales Whisperer AI`,
      custom_fields: {}
    }];
  }
}