import type { CRMFormattedAnalysis } from '@/services/zapierService'

export type CRMType = 'salesforce' | 'hubspot' | 'pipedrive' | 'zoho' | 'generic'

export interface CRMFieldMapping {
  deal_name: string
  deal_stage: string
  deal_amount?: string
  contact_name: string
  contact_email?: string
  contact_company?: string
  next_action: string
  follow_up_date: string
  notes: string
  priority: string
}

export interface CRMSpecificFormat {
  salesforce: {
    SObject: string
    fields: Record<string, any>
    relationships?: Record<string, any>
  }
  hubspot: {
    objectType: string
    properties: Record<string, any>
    associations?: Array<{
      to: { id: string }
      types: Array<{ associationCategory: string; associationTypeId: number }>
    }>
  }
  pipedrive: {
    endpoint: string
    data: Record<string, any>
  }
  zoho: {
    module: string
    data: Record<string, any>
  }
  generic: {
    object_type: string
    fields: Record<string, any>
  }
}

export const crmFormatter = {
  /**
   * Format analysis data for specific CRM systems
   */
  formatForCRM(analysis: CRMFormattedAnalysis, crmType: CRMType): CRMSpecificFormat[typeof crmType] {
    const primaryContact = analysis.participant_data.external_participants[0]
    const dealName = `${primaryContact?.company || 'Unknown Company'} - Sales Opportunity`
    
    switch (crmType) {
      case 'salesforce':
        return this.formatForSalesforce(analysis, dealName, primaryContact)
      
      case 'hubspot':
        return this.formatForHubSpot(analysis, dealName, primaryContact)
      
      case 'pipedrive':
        return this.formatForPipedrive(analysis, dealName, primaryContact)
      
      case 'zoho':
        return this.formatForZoho(analysis, dealName, primaryContact)
      
      default:
        return this.formatGeneric(analysis, dealName, primaryContact)
    }
  },

  formatForSalesforce(analysis: CRMFormattedAnalysis, dealName: string, primaryContact: any): CRMSpecificFormat['salesforce'] {
    const heatToStage = {
      'hot': 'Proposal/Price Quote',
      'warm': 'Needs Analysis',
      'cold': 'Prospecting'
    }

    return {
      SObject: 'Opportunity',
      fields: {
        Name: dealName,
        StageName: heatToStage[analysis.deal_intelligence.heat_level],
        Probability: analysis.deal_intelligence.priority_score,
        Description: this.formatInsightsAsNotes(analysis),
        NextStep: analysis.deal_intelligence.next_action,
        LeadSource: 'Sales Whisperer Analysis',
        Type: 'New Customer',
        // Custom fields for Sales Whisperer data
        SW_Analysis_ID__c: analysis.analysis_id,
        SW_Heat_Level__c: analysis.deal_intelligence.heat_level,
        SW_Teaching_Score__c: analysis.conversation_insights.challenger_scores.teaching,
        SW_Tailoring_Score__c: analysis.conversation_insights.challenger_scores.tailoring,
        SW_Control_Score__c: analysis.conversation_insights.challenger_scores.control,
        SW_Priority_Score__c: analysis.deal_intelligence.priority_score
      },
      relationships: {
        Account: {
          Name: primaryContact?.company || 'Unknown Company'
        },
        Contact: primaryContact ? {
          FirstName: primaryContact.name?.split(' ')[0] || '',
          LastName: primaryContact.name?.split(' ').slice(1).join(' ') || primaryContact.name || 'Unknown',
          Email: primaryContact.email,
          Title: primaryContact.role
        } : undefined
      }
    }
  },

  formatForHubSpot(analysis: CRMFormattedAnalysis, dealName: string, primaryContact: any): CRMSpecificFormat['hubspot'] {
    const heatToStage = {
      'hot': 'closedwon',
      'warm': 'presentationscheduled',
      'cold': 'appointmentscheduled'
    }

    return {
      objectType: 'deals',
      properties: {
        dealname: dealName,
        dealstage: heatToStage[analysis.deal_intelligence.heat_level],
        amount: '0', // Would need to be populated from other sources
        dealtype: 'newbusiness',
        pipeline: 'default',
        hubspot_owner_id: '', // Would need to be mapped to HubSpot user
        notes_last_contacted: this.formatInsightsAsNotes(analysis),
        notes_next_activity_date: this.calculateFollowUpDate(analysis.deal_intelligence.timeline),
        // Custom properties for Sales Whisperer
        sw_analysis_id: analysis.analysis_id,
        sw_heat_level: analysis.deal_intelligence.heat_level,
        sw_teaching_score: analysis.conversation_insights.challenger_scores.teaching.toString(),
        sw_tailoring_score: analysis.conversation_insights.challenger_scores.tailoring.toString(),
        sw_control_score: analysis.conversation_insights.challenger_scores.control.toString(),
        sw_priority_score: analysis.deal_intelligence.priority_score.toString()
      },
      associations: primaryContact ? [{
        to: { id: 'CONTACT_ID_PLACEHOLDER' },
        types: [{
          associationCategory: 'HUBSPOT_DEFINED',
          associationTypeId: 3 // Deal to Contact association
        }]
      }] : undefined
    }
  },

  formatForPipedrive(analysis: CRMFormattedAnalysis, dealName: string, primaryContact: any): CRMSpecificFormat['pipedrive'] {
    const heatToStageId = {
      'hot': 3, // Proposal Made
      'warm': 2, // Contact Made
      'cold': 1  // Qualified
    }

    return {
      endpoint: 'deals',
      data: {
        title: dealName,
        stage_id: heatToStageId[analysis.deal_intelligence.heat_level],
        status: 'open',
        probability: analysis.deal_intelligence.priority_score,
        expected_close_date: this.calculateFollowUpDate(analysis.deal_intelligence.timeline),
        // Custom fields (would need to be created in Pipedrive first)
        'sw_analysis_id': analysis.analysis_id,
        'sw_heat_level': analysis.deal_intelligence.heat_level,
        'sw_teaching_score': analysis.conversation_insights.challenger_scores.teaching,
        'sw_tailoring_score': analysis.conversation_insights.challenger_scores.tailoring,
        'sw_control_score': analysis.conversation_insights.challenger_scores.control,
        // Notes
        notes: [this.formatInsightsAsNotes(analysis)],
        // Activities
        activities: analysis.conversation_insights.follow_up_actions.map(action => ({
          subject: action.action,
          type: 'call',
          due_date: action.due_date || this.calculateFollowUpDate(analysis.deal_intelligence.timeline)
        }))
      }
    }
  },

  formatForZoho(analysis: CRMFormattedAnalysis, dealName: string, primaryContact: any): CRMSpecificFormat['zoho'] {
    const heatToStage = {
      'hot': 'Closed Won',
      'warm': 'Proposal/Price Quote',
      'cold': 'Qualification'
    }

    return {
      module: 'Deals',
      data: {
        Deal_Name: dealName,
        Stage: heatToStage[analysis.deal_intelligence.heat_level],
        Probability: analysis.deal_intelligence.priority_score,
        Type: 'New Business',
        Lead_Source: 'Sales Whisperer',
        Description: this.formatInsightsAsNotes(analysis),
        Next_Step: analysis.deal_intelligence.next_action,
        Closing_Date: this.calculateFollowUpDate(analysis.deal_intelligence.timeline),
        // Custom fields
        SW_Analysis_ID: analysis.analysis_id,
        SW_Heat_Level: analysis.deal_intelligence.heat_level,
        SW_Teaching_Score: analysis.conversation_insights.challenger_scores.teaching,
        SW_Tailoring_Score: analysis.conversation_insights.challenger_scores.tailoring,
        SW_Control_Score: analysis.conversation_insights.challenger_scores.control,
        SW_Priority_Score: analysis.deal_intelligence.priority_score
      }
    }
  },

  formatGeneric(analysis: CRMFormattedAnalysis, dealName: string, primaryContact: any): CRMSpecificFormat['generic'] {
    return {
      object_type: 'opportunity',
      fields: {
        name: dealName,
        stage: analysis.deal_intelligence.deal_stage_recommendation,
        heat_level: analysis.deal_intelligence.heat_level,
        priority_score: analysis.deal_intelligence.priority_score,
        next_action: analysis.deal_intelligence.next_action,
        timeline: analysis.deal_intelligence.timeline,
        contact_name: primaryContact?.name,
        contact_email: primaryContact?.email,
        contact_company: primaryContact?.company,
        contact_role: primaryContact?.role,
        key_takeaways: analysis.conversation_insights.key_takeaways,
        challenger_scores: analysis.conversation_insights.challenger_scores,
        next_steps: analysis.conversation_insights.next_steps,
        follow_up_actions: analysis.conversation_insights.follow_up_actions,
        analysis_id: analysis.analysis_id,
        created_at: new Date().toISOString()
      }
    }
  },

  /**
   * Helper methods
   */
  formatInsightsAsNotes(analysis: CRMFormattedAnalysis): string {
    const notes = [
      `Sales Whisperer Analysis - ${new Date().toLocaleDateString()}`,
      '',
      `Heat Level: ${analysis.deal_intelligence.heat_level.toUpperCase()}`,
      `Priority Score: ${analysis.deal_intelligence.priority_score}/100`,
      `Recommendation: ${analysis.deal_intelligence.deal_stage_recommendation}`,
      '',
      'Key Takeaways:',
      ...analysis.conversation_insights.key_takeaways.map(takeaway => `• ${takeaway}`),
      '',
      'Challenger Sales Scores:',
      `• Teaching: ${analysis.conversation_insights.challenger_scores.teaching}/5`,
      `• Tailoring: ${analysis.conversation_insights.challenger_scores.tailoring}/5`,
      `• Control: ${analysis.conversation_insights.challenger_scores.control}/5`,
      '',
      'Next Steps:',
      ...analysis.conversation_insights.next_steps.map(step => `• ${step}`),
      '',
      'Follow-up Actions:',
      ...analysis.conversation_insights.follow_up_actions.map(action => 
        `• ${action.action} (Owner: ${action.owner}${action.due_date ? `, Due: ${action.due_date}` : ''})`
      )
    ]

    return notes.join('\n')
  },

  calculateFollowUpDate(timeline: string): string {
    const now = new Date()
    const timelineHours = this.parseTimelineToHours(timeline)
    const followUpDate = new Date(now.getTime() + timelineHours * 60 * 60 * 1000)
    return followUpDate.toISOString().split('T')[0] // Return YYYY-MM-DD format
  },

  parseTimelineToHours(timeline: string): number {
    const lowerTimeline = timeline.toLowerCase()
    
    if (lowerTimeline.includes('hour')) {
      const hours = parseInt(lowerTimeline.match(/\d+/)?.[0] || '24', 10)
      return hours
    } else if (lowerTimeline.includes('day')) {
      const days = parseInt(lowerTimeline.match(/\d+/)?.[0] || '1', 10)
      return days * 24
    } else if (lowerTimeline.includes('week')) {
      const weeks = parseInt(lowerTimeline.match(/\d+/)?.[0] || '1', 10)
      return weeks * 7 * 24
    }
    
    // Default to 48 hours
    return 48
  },

  /**
   * Get field mappings for different CRM systems
   */
  getFieldMappings(crmType: CRMType): Record<string, string> {
    const mappings = {
      salesforce: {
        deal_name: 'Name',
        deal_stage: 'StageName',
        deal_amount: 'Amount',
        contact_name: 'Contact.Name',
        contact_email: 'Contact.Email',
        next_action: 'NextStep',
        notes: 'Description',
        priority: 'Probability'
      },
      hubspot: {
        deal_name: 'dealname',
        deal_stage: 'dealstage',
        deal_amount: 'amount',
        contact_name: 'firstname,lastname',
        contact_email: 'email',
        next_action: 'notes_next_activity_date',
        notes: 'notes_last_contacted',
        priority: 'hs_priority'
      },
      pipedrive: {
        deal_name: 'title',
        deal_stage: 'stage_id',
        deal_amount: 'value',
        contact_name: 'person_id.name',
        contact_email: 'person_id.email',
        next_action: 'next_activity_subject',
        notes: 'notes',
        priority: 'probability'
      },
      zoho: {
        deal_name: 'Deal_Name',
        deal_stage: 'Stage',
        deal_amount: 'Amount',
        contact_name: 'Contact_Name.name',
        contact_email: 'Contact_Name.email',
        next_action: 'Next_Step',
        notes: 'Description',
        priority: 'Probability'
      },
      generic: {
        deal_name: 'name',
        deal_stage: 'stage',
        deal_amount: 'amount',
        contact_name: 'contact_name',
        contact_email: 'contact_email',
        next_action: 'next_action',
        notes: 'notes',
        priority: 'priority'
      }
    }

    return mappings[crmType] || mappings.generic
  }
}