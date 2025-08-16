// Zapier API Types
export interface ZapierApiKey {
  id: string
  user_id: string
  key_name: string
  api_key_hash: string
  scopes: string[]
  is_active: boolean
  expires_at: string
  last_used: string | null
  usage_count: number
  rate_limit_per_hour: number
  created_at: string
}

export interface ZapierWebhook {
  id: string
  user_id: string
  api_key_id: string
  trigger_type: string
  webhook_url: string
  secret_token: string | null
  is_active: boolean
  success_count: number
  failure_count: number
  last_triggered: string | null
  last_error: string | null
  created_at: string
}

export interface ZapierWebhookLog {
  id: string
  webhook_id: string
  trigger_data: any
  delivery_status: 'pending' | 'delivered' | 'failed'
  http_status_code: number | null
  response_body: string | null
  error_message: string | null
  attempt_count: number
  created_at: string
  delivered_at: string | null
}

export interface ZapierMatchReview {
  id: string
  user_id: string
  analysis_id: string
  participant_data: any
  suggested_matches: any[]
  status: 'pending' | 'confirmed' | 'rejected'
  confirmed_contact_id: string | null
  created_at: string
  reviewed_at: string | null
}

// Trigger Types
export type ZapierTriggerType = 
  | 'analysis_completed'
  | 'hot_deal_identified'
  | 'follow_up_required'
  | 'participant_matched'
  | 'deal_stage_changed'

// API Request/Response Types
export interface GenerateApiKeyRequest {
  key_name: string
  scopes?: string[]
}

export interface GenerateApiKeyResponse {
  success: boolean
  data?: {
    api_key: string
    key_id: string
    expires_at: string
  }
  error?: string
}

export interface ValidateApiKeyRequest {
  api_key: string
}

export interface ValidateApiKeyResponse {
  success: boolean
  data?: {
    valid: boolean
    user_id?: string
    scopes?: string[]
    rate_limit_remaining?: number
  }
  error?: string
}

export interface WebhookSubscriptionRequest {
  api_key_id: string
  trigger_type: ZapierTriggerType
  webhook_url: string
  secret_token?: string
}

export interface WebhookSubscriptionResponse {
  success: boolean
  data?: {
    webhook_id: string
    trigger_type: string
    webhook_url: string
    secret_token: string
    created_at: string
  }
  error?: string
}

export interface WebhookTestRequest {
  webhook_id: string
}

export interface WebhookTestResponse {
  success: boolean
  data?: {
    message: string
    webhook_id: string
  }
  error?: string
}

// CRM Integration Types
export type CRMType = 'salesforce' | 'hubspot' | 'pipedrive' | 'zoho' | 'generic'

export interface CRMContact {
  id?: string
  name: string
  email?: string
  company?: string
  role?: string
  phone?: string
  linkedin?: string
}

export interface CRMDeal {
  id?: string
  name: string
  stage: string
  amount?: number
  probability?: number
  close_date?: string
  contacts: CRMContact[]
  notes?: string
  next_action?: string
}

export interface DealIntelligence {
  heat_level: 'hot' | 'warm' | 'cold'
  deal_stage_recommendation: string
  priority_score: number
  next_action: string
  timeline: string
  confidence_level: number
}

export interface ParticipantData {
  internal_participants: Array<{
    name: string
    role?: string
    email?: string
  }>
  external_participants: Array<{
    name: string
    company?: string
    role?: string
    email?: string
    contact_match_status?: 'matched' | 'pending' | 'no_match'
    crm_contact_id?: string
    confidence_score?: number
  }>
}

export interface ConversationInsights {
  key_takeaways: string[]
  challenger_scores: {
    teaching: number
    tailoring: number
    control: number
  }
  next_steps: string[]
  follow_up_actions: Array<{
    action: string
    owner: string
    due_date?: string
    priority?: 'high' | 'medium' | 'low'
  }>
  sentiment_analysis?: {
    overall_sentiment: 'positive' | 'neutral' | 'negative'
    engagement_level: number
    objection_indicators: string[]
  }
}

export interface CRMSpecificData {
  salesforce?: {
    object_type: string
    stage: string
    record_type?: string
    owner_id?: string
  }
  hubspot?: {
    deal_stage: string
    pipeline?: string
    owner_id?: string
  }
  pipedrive?: {
    stage_id: number
    status: string
    owner_id?: number
  }
  zoho?: {
    stage: string
    owner?: string
    module?: string
  }
}

export interface CRMFormattedAnalysis {
  analysis_id: string
  deal_intelligence: DealIntelligence
  participant_data: ParticipantData
  conversation_insights: ConversationInsights
  crm_specific: CRMSpecificData
  metadata: {
    transcript_title?: string
    meeting_date?: string
    duration_minutes?: number
    analysis_timestamp: string
    version: string
  }
}

// Webhook Payload Types
export interface AnalysisCompletedPayload {
  trigger_type: 'analysis_completed'
  user_id: string
  analysis_id: string
  transcript_id: string
  timestamp: string
  data: CRMFormattedAnalysis
}

export interface HotDealIdentifiedPayload {
  trigger_type: 'hot_deal_identified'
  user_id: string
  analysis_id: string
  deal_intelligence: DealIntelligence
  timestamp: string
  data: {
    priority_score: number
    heat_level: 'hot'
    recommended_actions: string[]
    urgency_indicators: string[]
  }
}

export interface FollowUpRequiredPayload {
  trigger_type: 'follow_up_required'
  user_id: string
  analysis_id: string
  timestamp: string
  data: {
    follow_up_actions: Array<{
      action: string
      due_date: string
      priority: string
    }>
    suggested_timing: string
    template_suggestions: {
      email_subject: string
      email_body: string
    }
  }
}

export interface ParticipantMatchedPayload {
  trigger_type: 'participant_matched'
  user_id: string
  analysis_id: string
  timestamp: string
  data: {
    matched_participants: Array<{
      name: string
      crm_contact_id: string
      confidence_score: number
      match_source: string
    }>
    unmatched_participants: Array<{
      name: string
      suggested_actions: string[]
    }>
  }
}

export type ZapierWebhookPayload = 
  | AnalysisCompletedPayload
  | HotDealIdentifiedPayload
  | FollowUpRequiredPayload
  | ParticipantMatchedPayload

// Error Types
export interface ZapierError {
  code: string
  message: string
  details?: any
  timestamp: string
}

export interface ZapierApiError extends Error {
  code: number
  response?: any
}

// Configuration Types
export interface ZapierIntegrationConfig {
  api_keys: ZapierApiKey[]
  webhooks: ZapierWebhook[]
  default_crm_type: CRMType
  auto_match_contacts: boolean
  webhook_retry_attempts: number
  rate_limit_buffer: number
}

// Status Types
export interface ZapierHealthStatus {
  api_service: 'healthy' | 'degraded' | 'down'
  webhook_delivery: 'healthy' | 'degraded' | 'down'
  last_successful_request: string | null
  error_rate_24h: number
  avg_response_time_ms: number
}

export interface ZapierSetupStatus {
  step: 'api-key' | 'webhook' | 'testing' | 'complete'
  message: string
  is_complete: boolean
  next_steps?: string[]
}