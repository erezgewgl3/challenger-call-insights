-- Create bidirectional sync tracking and conflict resolution tables

-- Sync operations tracking
CREATE TABLE public.sync_operations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sync_type text NOT NULL, -- 'crm_to_sw', 'sw_to_crm', 'bidirectional'
  operation_type text NOT NULL, -- 'deal_update', 'contact_sync', 'task_completion', etc.
  source_system text NOT NULL, -- 'zapier', 'hubspot', 'salesforce', etc.
  source_record_id text,
  target_system text NOT NULL,
  target_record_id text,
  operation_status text NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'conflict'
  sync_data jsonb NOT NULL DEFAULT '{}',
  conflict_data jsonb,
  resolution_strategy text, -- 'timestamp', 'user_preference', 'manual'
  resolved_by uuid REFERENCES users(id),
  resolved_at timestamptz,
  error_message text,
  retry_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Sync conflicts tracking
CREATE TABLE public.sync_conflicts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_operation_id uuid NOT NULL REFERENCES sync_operations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  conflict_type text NOT NULL, -- 'data_mismatch', 'timestamp_conflict', 'schema_change'
  local_data jsonb NOT NULL,
  remote_data jsonb NOT NULL,
  field_conflicts jsonb NOT NULL, -- specific fields in conflict
  resolution_status text NOT NULL DEFAULT 'pending', -- 'pending', 'resolved', 'ignored'
  resolution_data jsonb,
  resolved_by uuid REFERENCES users(id),
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- User sync preferences
CREATE TABLE public.user_sync_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  crm_type text NOT NULL,
  sync_direction text NOT NULL DEFAULT 'bidirectional', -- 'to_crm', 'from_crm', 'bidirectional'
  auto_resolve_conflicts boolean DEFAULT false,
  preferred_resolution_strategy text DEFAULT 'timestamp', -- 'timestamp', 'crm_priority', 'sw_priority'
  sync_frequency_minutes integer DEFAULT 15,
  enabled boolean DEFAULT true,
  sync_settings jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, crm_type)
);

-- Sync audit trail
CREATE TABLE public.sync_audit_trail (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sync_operation_id uuid REFERENCES sync_operations(id) ON DELETE CASCADE,
  action_type text NOT NULL, -- 'sync_started', 'conflict_detected', 'conflict_resolved', 'sync_completed'
  entity_type text NOT NULL, -- 'deal', 'contact', 'task', 'analysis'
  entity_id text,
  before_data jsonb,
  after_data jsonb,
  metadata jsonb DEFAULT '{}',
  performed_by uuid REFERENCES users(id),
  performed_at timestamptz DEFAULT now()
);

-- Advanced webhook triggers tracking
CREATE TABLE public.advanced_webhook_triggers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trigger_type text NOT NULL, -- 'heat_level_change', 'failed_matches', 'priority_actions', 'competitive_intel'
  trigger_condition jsonb NOT NULL,
  webhook_url text NOT NULL,
  is_active boolean DEFAULT true,
  last_triggered timestamptz,
  trigger_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Deal heat tracking for trigger detection
CREATE TABLE public.deal_heat_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id uuid REFERENCES accounts(id) ON DELETE CASCADE,
  analysis_id uuid REFERENCES conversation_analysis(id) ON DELETE CASCADE,
  previous_heat_level text,
  current_heat_level text NOT NULL,
  heat_score_change numeric,
  change_reason text,
  triggered_webhooks text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.sync_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_conflicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sync_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_audit_trail ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advanced_webhook_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_heat_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sync_operations
CREATE POLICY "Users own their sync operations" ON public.sync_operations
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins see all sync operations" ON public.sync_operations
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- RLS Policies for sync_conflicts  
CREATE POLICY "Users own their sync conflicts" ON public.sync_conflicts
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins see all sync conflicts" ON public.sync_conflicts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- RLS Policies for user_sync_preferences
CREATE POLICY "Users own their sync preferences" ON public.user_sync_preferences
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins see all sync preferences" ON public.user_sync_preferences
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- RLS Policies for sync_audit_trail
CREATE POLICY "Users see their sync audit trail" ON public.sync_audit_trail
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins see all sync audit trail" ON public.sync_audit_trail
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- RLS Policies for advanced_webhook_triggers
CREATE POLICY "Users own their webhook triggers" ON public.advanced_webhook_triggers
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins see all webhook triggers" ON public.advanced_webhook_triggers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- RLS Policies for deal_heat_history
CREATE POLICY "Users see their deal heat history" ON public.deal_heat_history
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins see all deal heat history" ON public.deal_heat_history
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Indexes for performance
CREATE INDEX idx_sync_operations_user_status ON public.sync_operations(user_id, operation_status);
CREATE INDEX idx_sync_operations_source_target ON public.sync_operations(source_system, target_system);
CREATE INDEX idx_sync_conflicts_user_status ON public.sync_conflicts(user_id, resolution_status);
CREATE INDEX idx_sync_audit_trail_user_entity ON public.sync_audit_trail(user_id, entity_type, entity_id);
CREATE INDEX idx_webhook_triggers_user_active ON public.advanced_webhook_triggers(user_id, is_active);
CREATE INDEX idx_deal_heat_history_account ON public.deal_heat_history(account_id, created_at DESC);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_sync_preferences_updated_at
  BEFORE UPDATE ON public.user_sync_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_advanced_webhook_triggers_updated_at
  BEFORE UPDATE ON public.advanced_webhook_triggers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();