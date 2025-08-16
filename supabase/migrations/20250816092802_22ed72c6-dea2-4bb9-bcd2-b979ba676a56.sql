-- Zapier Integration Database Schema
-- Following existing RLS patterns for user data isolation and admin access

-- API Key Management
CREATE TABLE public.zapier_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  api_key_hash VARCHAR(255) NOT NULL UNIQUE,
  key_name VARCHAR(100) NOT NULL,
  scopes TEXT[] DEFAULT ARRAY['read:analysis', 'webhook:subscribe'],
  is_active BOOLEAN DEFAULT true,
  last_used TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '90 days'),
  usage_count INTEGER DEFAULT 0,
  rate_limit_per_hour INTEGER DEFAULT 1000
);

-- Webhook Subscriptions
CREATE TABLE public.zapier_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  api_key_id UUID NOT NULL REFERENCES public.zapier_api_keys(id) ON DELETE CASCADE,
  trigger_type VARCHAR(50) NOT NULL,
  webhook_url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  secret_token VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_triggered TIMESTAMPTZ,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  last_error TEXT
);

-- Webhook Delivery Logs
CREATE TABLE public.zapier_webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES public.zapier_webhooks(id) ON DELETE CASCADE,
  trigger_data JSONB NOT NULL,
  delivery_status VARCHAR(20) DEFAULT 'pending',
  http_status_code INTEGER,
  response_body TEXT,
  error_message TEXT,
  attempt_count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ
);

-- Contact Match Reviews
CREATE TABLE public.zapier_match_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  analysis_id UUID NOT NULL REFERENCES public.conversation_analysis(id) ON DELETE CASCADE,
  participant_data JSONB NOT NULL,
  suggested_matches JSONB DEFAULT '[]',
  status VARCHAR(20) DEFAULT 'pending',
  confirmed_contact_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

-- CRM Integration Audit Trail
CREATE TABLE public.crm_integration_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  analysis_id UUID NOT NULL REFERENCES public.conversation_analysis(id) ON DELETE CASCADE,
  crm_type VARCHAR(50) NOT NULL,
  operation_type VARCHAR(50) NOT NULL,
  crm_record_id VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending',
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Enable Row Level Security on all new tables
ALTER TABLE public.zapier_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zapier_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zapier_webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zapier_match_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_integration_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for zapier_api_keys
CREATE POLICY "Users own their Zapier API keys" ON public.zapier_api_keys
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all Zapier API keys" ON public.zapier_api_keys
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for zapier_webhooks
CREATE POLICY "Users own their Zapier webhooks" ON public.zapier_webhooks
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all Zapier webhooks" ON public.zapier_webhooks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for zapier_webhook_logs
CREATE POLICY "Users see logs for their webhooks" ON public.zapier_webhook_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.zapier_webhooks zw
      WHERE zw.id = zapier_webhook_logs.webhook_id 
      AND zw.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all webhook logs" ON public.zapier_webhook_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for zapier_match_reviews
CREATE POLICY "Users own their match reviews" ON public.zapier_match_reviews
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all match reviews" ON public.zapier_match_reviews
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for crm_integration_logs
CREATE POLICY "Users see their own CRM integration logs" ON public.crm_integration_logs
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all CRM integration logs" ON public.crm_integration_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create indexes for performance
CREATE INDEX idx_zapier_api_keys_user_id ON public.zapier_api_keys(user_id);
CREATE INDEX idx_zapier_api_keys_hash ON public.zapier_api_keys(api_key_hash);
CREATE INDEX idx_zapier_webhooks_user_id ON public.zapier_webhooks(user_id);
CREATE INDEX idx_zapier_webhooks_api_key_id ON public.zapier_webhooks(api_key_id);
CREATE INDEX idx_zapier_webhook_logs_webhook_id ON public.zapier_webhook_logs(webhook_id);
CREATE INDEX idx_zapier_webhook_logs_created_at ON public.zapier_webhook_logs(created_at);
CREATE INDEX idx_zapier_match_reviews_user_id ON public.zapier_match_reviews(user_id);
CREATE INDEX idx_zapier_match_reviews_analysis_id ON public.zapier_match_reviews(analysis_id);
CREATE INDEX idx_crm_integration_logs_user_id ON public.crm_integration_logs(user_id);
CREATE INDEX idx_crm_integration_logs_analysis_id ON public.crm_integration_logs(analysis_id);