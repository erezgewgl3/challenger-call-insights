
-- GDPR compliance tables
CREATE TABLE public.gdpr_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL CHECK (event_type IN ('data_export', 'data_deletion', 'consent_updated', 'retention_action')),
  user_id uuid REFERENCES public.users(id),
  admin_id uuid REFERENCES public.users(id),
  timestamp timestamptz DEFAULT now(),
  details jsonb DEFAULT '{}',
  legal_basis text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.data_export_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id),
  requested_by uuid REFERENCES public.users(id),
  format text NOT NULL CHECK (format IN ('json', 'csv', 'xml')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  download_url text,
  expires_at timestamptz,
  options jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

CREATE TABLE public.deletion_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id),
  requested_by uuid REFERENCES public.users(id),
  reason text NOT NULL,
  scheduled_for timestamptz NOT NULL,
  grace_period_end timestamptz,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'failed')),
  recovery_token text UNIQUE,
  immediate_delete boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

CREATE TABLE public.user_consent (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) UNIQUE,
  consent_date timestamptz DEFAULT now(),
  consent_version text DEFAULT '1.0',
  granular_consents jsonb DEFAULT '{
    "transcriptProcessing": true,
    "dataAnalytics": true,
    "emailCommunications": false,
    "marketingCommunications": false,
    "thirdPartySharing": false
  }',
  legal_basis text DEFAULT 'Article 6(1)(b) - Contract performance',
  withdrawal_date timestamptz,
  renewal_required boolean DEFAULT false,
  last_updated timestamptz DEFAULT now()
);

-- Add RLS policies for GDPR tables
ALTER TABLE public.gdpr_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_export_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deletion_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_consent ENABLE ROW LEVEL SECURITY;

-- Admin-only access to GDPR audit log
CREATE POLICY "Admins can access GDPR audit log" ON public.gdpr_audit_log
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admin access to export requests
CREATE POLICY "Admins can manage export requests" ON public.data_export_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admin access to deletion requests
CREATE POLICY "Admins can manage deletion requests" ON public.deletion_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Users can view their own consent, admins can view all
CREATE POLICY "Users can view own consent" ON public.user_consent
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all consent" ON public.user_consent
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Indexes for performance
CREATE INDEX idx_gdpr_audit_log_user_id ON public.gdpr_audit_log(user_id);
CREATE INDEX idx_gdpr_audit_log_timestamp ON public.gdpr_audit_log(timestamp DESC);
CREATE INDEX idx_data_export_requests_user_id ON public.data_export_requests(user_id);
CREATE INDEX idx_deletion_requests_user_id ON public.deletion_requests(user_id);
CREATE INDEX idx_deletion_requests_status ON public.deletion_requests(status);
