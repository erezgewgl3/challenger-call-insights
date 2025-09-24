-- Create zapier_connection_verifications table for server-side status tracking
CREATE TABLE public.zapier_connection_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  verified_at timestamp with time zone NOT NULL DEFAULT now(),
  verification_method text NOT NULL CHECK (verification_method IN ('manual_test', 'background_check', 'webhook_activity', 'api_key_validation')),
  success boolean NOT NULL,
  error_details jsonb DEFAULT '{}',
  verification_data jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.zapier_connection_verifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "zapier_verifications_unified_access" ON public.zapier_connection_verifications
  FOR ALL USING (
    (auth.uid() = user_id) OR 
    (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
  );

-- Create indexes for performance
CREATE INDEX idx_zapier_verifications_user_verified ON public.zapier_connection_verifications(user_id, verified_at DESC);
CREATE INDEX idx_zapier_verifications_recent ON public.zapier_connection_verifications(verified_at DESC);