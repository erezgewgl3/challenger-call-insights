import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  console.log('🔌 [ZAPIER-CONFIG] Request received:', req.method, req.url);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const endpoint = url.pathname.split('/').pop();

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    switch (endpoint) {
      case 'test-connection':
        return handleConnectionTest(req, supabase);
      case 'field-discovery':
        return handleFieldDiscovery(req, supabase);
      case 'webhook-test':
        return handleWebhookTest(req, supabase);
      case 'sample-data':
        return handleSampleData(req, supabase);
      case 'queue-status':
        return handleQueueStatus(req, supabase);
      default:
        return new Response(JSON.stringify({
          success: false,
          error: 'Unknown endpoint',
          available_endpoints: [
            'test-connection',
            'field-discovery', 
            'webhook-test',
            'sample-data',
            'queue-status'
          ]
        }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
  } catch (error) {
    console.error('🔌 [API ERROR]:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function handleConnectionTest(req: Request, supabase: any) {
  console.log('🔌 [TEST-CONNECTION] Testing API connection');
  
  try {
    // Test database connectivity
    const { data: healthCheck, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (error) {
      console.error('🔌 [CONNECTION-ERROR]:', error);
      return new Response(JSON.stringify({
        success: false,
        connection_status: 'failed',
        error: 'Database connection failed',
        details: error.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({
      success: true,
      connection_status: 'active',
      api_version: '2.0',
      endpoints_available: [
        'external-transcript-ingest',
        'get-transcript-queue', 
        'queue-assignment-actions',
        'zapier-data',
        'zapier-config',
        'trigger-crm-webhook'
      ],
      features: [
        'transcript_ingestion',
        'queue_management',
        'real_time_updates',
        'crm_integration',
        'webhook_delivery'
      ],
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('🔌 [CONNECTION-TEST-ERROR]:', error);
    return new Response(JSON.stringify({
      success: false,
      connection_status: 'failed',
      error: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function handleFieldDiscovery(req: Request, supabase: any) {
  const url = new URL(req.url);
  const format = url.searchParams.get('format') || 'zoho';
  
  console.log('🔌 [FIELD-DISCOVERY] Getting field mappings for:', format);
  
  const fields = getFieldMappings(format);
  
  return new Response(JSON.stringify({
    success: true,
    crm_format: format,
    available_fields: fields,
    field_count: fields.length,
    supported_formats: ['zoho', 'salesforce', 'hubspot', 'pipedrive'],
    last_updated: new Date().toISOString()
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

function getFieldMappings(format: string) {
  const baseFields = [
    {
      name: 'deal_heat',
      label: 'AI Deal Heat Level',
      type: 'string',
      description: 'AI-assessed deal temperature (Hot/Warm/Cold)',
      required: true,
      example: 'Hot',
      possible_values: ['Hot', 'Warm', 'Cold']
    },
    {
      name: 'momentum',
      label: 'Deal Momentum',
      type: 'string', 
      description: 'Direction and speed of deal progression',
      required: true,
      example: 'Strong Forward',
      possible_values: ['Strong Forward', 'Moderate', 'Stalled', 'Declining']
    },
    {
      name: 'challenger_score',
      label: 'Challenger Teaching Score',
      type: 'integer',
      description: 'How well the rep taught and challenged (1-5 scale)',
      required: true,
      example: 4,
      min: 1,
      max: 5
    },
    {
      name: 'competitive_position',
      label: 'Competitive Position',
      type: 'string',
      description: 'Analysis of competitive landscape position',
      required: false,
      example: 'Strong Position',
      possible_values: ['Strong Position', 'Competitive', 'Needs Assessment', 'Disadvantaged']
    },
    {
      name: 'win_strategy',
      label: 'AI Win Strategy',
      type: 'text',
      description: 'AI-recommended approach to win the deal',
      required: true,
      example: 'Focus on ROI and technical differentiation',
      max_length: 2000
    },
    {
      name: 'next_steps',
      label: 'Recommended Next Steps',
      type: 'array',
      description: 'AI-recommended follow-up actions with priorities and timelines',
      required: true,
      example: [
        {
          action: 'Send technical architecture document',
          due_date: '2025-08-15',
          priority: 'high',
          context: 'Prospect specifically requested detailed technical overview'
        }
      ]
    },
    {
      name: 'competitive_insights',
      label: 'Competitive Intelligence',
      type: 'object',
      description: 'Competitor mentions and positioning analysis',
      required: false,
      example: {
        competitors_mentioned: ['Salesforce', 'HubSpot'],
        competitive_position: 'strong',
        differentiators: ['ai_capabilities', 'ease_of_use']
      }
    },
    {
      name: 'key_takeaways',
      label: 'Key Conversation Insights',
      type: 'array',
      description: 'Most important insights from the conversation',
      required: true,
      example: [
        'Decision maker identified as CTO',
        'Budget approved for Q4 implementation',
        'Strong interest in AI capabilities'
      ]
    }
  ];

  // Add format-specific mappings
  switch (format) {
    case 'zoho':
      return [
        ...baseFields,
        {
          name: 'zoho_deal_updates',
          label: 'Zoho Deal Field Updates',
          type: 'object',
          description: 'Mapped field updates for Zoho CRM deals module',
          required: true,
          example: {
            cf_ai_heat_level: 'Hot',
            cf_deal_momentum: 'Strong Forward',
            cf_challenger_teaching: 4,
            cf_competitive_position: 'Strong Position',
            cf_ai_last_updated: '2025-09-21T10:30:00Z',
            Stage: 'Proposal/Price Quote'
          }
        },
        {
          name: 'zoho_tasks',
          label: 'Zoho Tasks to Create',
          type: 'array',
          description: 'Task records for Zoho CRM tasks module',
          required: false,
          example: [
            {
              Subject: 'Send technical architecture document',
              Due_Date: '2025-08-15',
              Priority: 'High',
              Description: 'AI-generated follow-up action',
              cf_ai_generated: true
            }
          ]
        },
        {
          name: 'zoho_notes',
          label: 'Zoho Notes to Add',
          type: 'array',
          description: 'Note records for Zoho CRM',
          required: false,
          example: [
            {
              Title: 'Sales Whisperer AI Analysis',
              Content: 'AI analysis results and recommendations...'
            }
          ]
        }
      ];

    case 'salesforce':
      return [
        ...baseFields,
        {
          name: 'salesforce_opportunity_updates',
          label: 'Salesforce Opportunity Updates',
          type: 'object',
          description: 'Mapped field updates for Salesforce Opportunity object',
          required: true,
          example: {
            Heat_Score__c: 'Hot',
            AI_Momentum__c: 'Strong Forward',
            Challenger_Teaching__c: 4,
            Competitive_Position__c: 'Strong Position',
            AI_Last_Updated__c: '2025-09-21T10:30:00Z',
            StageName: 'Proposal/Price Quote'
          }
        },
        {
          name: 'salesforce_tasks',
          label: 'Salesforce Tasks to Create',
          type: 'array',
          description: 'Task records for Salesforce',
          required: false,
          example: [
            {
              Subject: 'Send technical architecture document',
              ActivityDate: '2025-08-15',
              Priority: 'High',
              Description: 'AI-generated follow-up action'
            }
          ]
        }
      ];

    case 'hubspot':
      return [
        ...baseFields,
        {
          name: 'hubspot_deal_updates',
          label: 'HubSpot Deal Updates',
          type: 'object',
          description: 'Mapped field updates for HubSpot deals',
          required: true,
          example: {
            hs_deal_score: 85,
            deal_momentum: 'Strong Forward',
            challenger_teaching_score: 4,
            competitive_position: 'Strong Position',
            ai_last_updated: '2025-09-21T10:30:00Z',
            dealstage: 'proposal'
          }
        }
      ];

    case 'pipedrive':
      return [
        ...baseFields,
        {
          name: 'pipedrive_deal_updates',
          label: 'Pipedrive Deal Updates',
          type: 'object',
          description: 'Mapped field updates for Pipedrive deals',
          required: true,
          example: {
            'custom_field_heat_score': 'Hot',
            'custom_field_momentum': 'Strong Forward',
            'custom_field_challenger_score': 4,
            stage_id: 5,
            probability: 85
          }
        }
      ];

    default:
      return baseFields;
  }
}

async function handleWebhookTest(req: Request, supabase: any) {
  console.log('🔌 [WEBHOOK-TEST] Testing webhook delivery');
  
  const { webhook_url, test_data } = await req.json();
  
  if (!webhook_url) {
    return new Response(JSON.stringify({
      success: false,
      error: 'webhook_url required for testing'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Send test webhook
  try {
    const testPayload = test_data || {
      test: true,
      timestamp: new Date().toISOString(),
      event_type: 'test_webhook',
      sample_data: {
        transcript_id: 'test_transcript_123',
        zoho_deal_id: 'test_deal_456',
        analysis_complete: true,
        analysis_timestamp: new Date().toISOString(),
        deal_updates: {
          cf_ai_heat_level: 'Hot',
          cf_deal_momentum: 'Strong Forward',
          cf_challenger_teaching: 4,
          cf_competitive_position: 'Strong Position'
        },
        tasks_to_create: [
          {
            Subject: 'Follow up on technical requirements',
            Priority: 'High',
            Due_Date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          }
        ],
        notes_to_add: [
          {
            Title: 'Sales Whisperer Test Analysis',
            Content: 'This is a test webhook from Sales Whisperer AI analysis system.'
          }
        ]
      }
    };

    console.log('🔌 [WEBHOOK-TEST] Sending test payload to:', webhook_url);

    const response = await fetch(webhook_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Sales-Whisperer-Test/1.0',
        'X-Test-Webhook': 'true'
      },
      body: JSON.stringify(testPayload)
    });

    const responseText = await response.text();

    console.log('🔌 [WEBHOOK-TEST] Response:', response.status, responseText);

    return new Response(JSON.stringify({
      success: response.ok,
      webhook_url,
      response_status: response.status,
      response_headers: Object.fromEntries(response.headers.entries()),
      response_body: responseText,
      test_payload: testPayload,
      delivery_time_ms: Date.now() - new Date(testPayload.timestamp).getTime()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('🔌 [WEBHOOK-TEST-ERROR]:', error);
    return new Response(JSON.stringify({
      success: false,
      webhook_url,
      error: error instanceof Error ? error.message : String(error),
      error_type: error instanceof Error ? error.name : 'Unknown'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function handleSampleData(req: Request, supabase: any) {
  console.log('🔌 [SAMPLE-DATA] Providing sample data for Zapier configuration');
  
  // Return comprehensive sample data for Zapier configuration
  return new Response(JSON.stringify({
    success: true,
    sample_transcript_input: {
      transcript_text: `Sales Rep: Hi Jane, thanks for taking the time to meet with me today. I wanted to discuss how our AI platform could help streamline your data analysis processes.

Prospect: Absolutely, John. We've been looking for a solution that can handle our growing data volumes. Currently, we're processing about 10TB of data monthly, and it's becoming overwhelming for our team.

Sales Rep: That's exactly the kind of challenge our platform excels at. I'm curious - what's driving this growth in data volume?

Prospect: We've expanded into three new markets this quarter, and each market generates significant customer interaction data. Our current tools just can't keep up.

Sales Rep: I see. And what happens when your current tools can't keep up? What's the business impact?

Prospect: Good question. We're seeing delays in our customer insights, which directly impacts our ability to respond to market changes. Last month, we missed a critical trend that cost us about $200K in potential revenue.

Sales Rep: That's significant. If I could show you how our platform could prevent that kind of missed opportunity, would that be valuable?

Prospect: Definitely. What kind of timeline are we looking at for implementation?

Sales Rep: Typically, we can have you up and running within 30 days. Given your data volume, I'd recommend starting with our Enterprise package. Are you the decision maker for this type of investment?

Prospect: I am, and we have budget approved for Q4. What are we looking at cost-wise?

Sales Rep: For your scale, we're looking at $50K annually. Given that you mentioned missing $200K in revenue last month alone, the ROI should be quite clear.

Prospect: That makes sense. I'd like to see a technical demo and get our IT team involved. Can you set that up?

Sales Rep: Absolutely. I'll have our solutions engineer reach out this week to schedule a technical deep-dive. Is there anything specific you'd like them to focus on?

Prospect: Integration capabilities with our existing Salesforce and data warehouse setup.

Sales Rep: Perfect. They'll come prepared with specific integration scenarios. I'll follow up with next steps by tomorrow.`,
      zoho_deal_id: "4567890123456789012",
      assigned_user_email: "john.doe@company.com",
      meeting_metadata: {
        title: "Discovery Call with Acme Corp - AI Platform Discussion",
        participants: ["John Doe (Sales Rep)", "Jane Smith (VP of Analytics, Acme Corp)"],
        meeting_date: "2025-09-21T14:00:00Z",
        duration_minutes: 45,
        company_name: "Acme Corp",
        contact_name: "Jane Smith",
        contact_title: "VP of Analytics",
        deal_name: "Acme Corp - Enterprise AI Platform",
        deal_value: 50000
      },
      priority: "high",
      source: "zoho",
      callback_webhook: "https://your-zapier-webhook-url.com/webhook"
    },
    sample_analysis_output: {
      transcript_id: "01234567-89ab-cdef-0123-456789abcdef",
      zoho_deal_id: "4567890123456789012",
      analysis_complete: true,
      analysis_timestamp: "2025-09-21T14:45:00Z",
      deal_updates: {
        cf_ai_heat_level: "Hot",
        cf_deal_momentum: "Strong Forward",
        cf_challenger_teaching: 4,
        cf_competitive_position: "Strong Position",
        cf_ai_last_updated: "2025-09-21T14:45:00Z",
        cf_win_strategy: "Focus on ROI calculation and integration capabilities"
      },
      tasks_to_create: [
        {
          Subject: "Schedule technical demo with solutions engineer",
          Due_Date: "2025-09-24",
          Priority: "High",
          Description: "Set up technical deep-dive focusing on Salesforce and data warehouse integration",
          cf_ai_generated: true
        },
        {
          Subject: "Prepare integration scenarios presentation",
          Due_Date: "2025-09-26",
          Priority: "High", 
          Description: "Create specific examples of Salesforce and data warehouse integration",
          cf_ai_generated: true
        }
      ],
      notes_to_add: [
        {
          Title: "Sales Whisperer AI Analysis - 2025-09-21",
          Content: "Sales Whisperer AI Analysis Results:\n\nDeal Heat: Hot\nMomentum: Strong Forward\n\nChallenger Scores:\n- Teaching: 4 (Excellent questioning and insight sharing)\n- Tailoring: 4 (Well customized to prospect's specific challenges)\n- Taking Control: 4 (Guided conversation effectively)\n\nKey Insights:\n- Decision maker confirmed with budget authority\n- Clear business impact identified ($200K revenue miss)\n- Technical integration requirements specified\n- Implementation timeline aligned with Q4 budget\n\nRecommendation: Push - Strong buying signals present\n\nStrategy: Focus on technical differentiation and ROI calculation. Schedule technical demo immediately while momentum is strong."
        }
      ],
      original_analysis: {
        challenger_scores: {
          teaching: 4,
          tailoring: 4,
          control: 4
        },
        guidance: {
          recommendation: "Push",
          key_insights: [
            "Decision maker confirmed with budget authority",
            "Clear business impact quantified at $200K",
            "Technical requirements clearly defined",
            "Timeline aligns with available budget"
          ],
          message: "Strong buying signals present. Schedule technical demo immediately."
        },
        heat_level: "Hot",
        action_plan: {
          immediate_actions: [
            "Schedule technical demo with solutions engineer",
            "Prepare Salesforce and data warehouse integration scenarios"
          ]
        }
      }
    },
    webhook_payload_structure: {
      description: "Structure of webhook payload sent to your endpoint",
      example: {
        zoho_deal_id: "string - Zoho CRM Deal ID",
        transcript_id: "string - Sales Whisperer transcript UUID",
        analysis_complete: "boolean - Always true when webhook fires",
        analysis_timestamp: "string - ISO timestamp of analysis completion",
        deal_updates: "object - CRM field updates to apply",
        tasks_to_create: "array - Tasks to create in CRM",
        notes_to_add: "array - Notes to add to CRM record",
        original_analysis: "object - Complete analysis data for reference"
      }
    }
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function handleQueueStatus(req: Request, supabase: any) {
  console.log('🔌 [QUEUE-STATUS] Getting current queue statistics');
  
  try {
    // Get comprehensive queue statistics
    const { data: queueStats, error } = await supabase
      .from('transcripts')
      .select('processing_status, external_source, priority_level, created_at, assigned_user_id')
      .not('external_source', 'is', null);

    if (error) {
      console.error('🔌 [QUEUE-STATUS-ERROR]:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to fetch queue statistics',
        details: error.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const now = new Date();
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const stats = {
      total_external_transcripts: queueStats.length,
      status_breakdown: {
        pending: queueStats.filter((t: any) => t.processing_status === 'pending').length,
        processing: queueStats.filter((t: any) => t.processing_status === 'processing').length,
        completed: queueStats.filter((t: any) => t.processing_status === 'completed').length,
        failed: queueStats.filter((t: any) => t.processing_status === 'failed').length
      },
      source_breakdown: {
        zoho: queueStats.filter((t: any) => t.external_source === 'zoho').length,
        zapier: queueStats.filter((t: any) => t.external_source === 'zapier').length,
        api: queueStats.filter((t: any) => t.external_source === 'api').length,
        webhook: queueStats.filter((t: any) => t.external_source === 'webhook').length
      },
      priority_breakdown: {
        urgent: queueStats.filter((t: any) => t.priority_level === 'urgent').length,
        high: queueStats.filter((t: any) => t.priority_level === 'high').length,
        normal: queueStats.filter((t: any) => t.priority_level === 'normal').length,
        low: queueStats.filter((t: any) => t.priority_level === 'low').length
      },
      time_analysis: {
        processed_last_hour: queueStats.filter((t: any) => 
          new Date(t.created_at) > hourAgo && t.processing_status === 'completed'
        ).length,
        processed_last_24h: queueStats.filter((t: any) => 
          new Date(t.created_at) > dayAgo && t.processing_status === 'completed'
        ).length,
        average_queue_position: queueStats.filter((t: any) => t.processing_status === 'pending').length / 2
      },
      assignment_stats: {
        assigned: queueStats.filter((t: any) => t.assigned_user_id !== null).length,
        unassigned: queueStats.filter((t: any) => t.assigned_user_id === null).length
      }
    };

    return new Response(JSON.stringify({
      success: true,
      queue_statistics: stats,
      system_health: {
        status: stats.status_breakdown.failed < stats.total_external_transcripts * 0.1 ? 'healthy' : 'degraded',
        processing_rate: stats.time_analysis.processed_last_hour,
        error_rate: stats.total_external_transcripts > 0 ? 
          (stats.status_breakdown.failed / stats.total_external_transcripts * 100).toFixed(2) + '%' : '0%'
      },
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('🔌 [QUEUE-STATUS-ERROR]:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}