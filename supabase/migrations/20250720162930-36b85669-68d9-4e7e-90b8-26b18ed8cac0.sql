
-- Create system_integration_configs table for admin-managed, system-wide integration settings
CREATE TABLE public.system_integration_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_type text NOT NULL,
  config_key text NOT NULL,
  config_value jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_encrypted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES public.users(id),
  updated_by uuid REFERENCES public.users(id),
  
  -- Ensure unique combination of integration_type and config_key
  UNIQUE (integration_type, config_key)
);

-- Enable RLS on the new table
ALTER TABLE public.system_integration_configs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: All authenticated users can read system integration configs
CREATE POLICY "All authenticated users can read system integration configs"
  ON public.system_integration_configs
  FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policy: Only admins can insert/update/delete system integration configs
CREATE POLICY "Only admins can manage system integration configs"
  ON public.system_integration_configs
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_system_integration_configs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_system_integration_configs_updated_at
  BEFORE UPDATE ON public.system_integration_configs
  FOR EACH ROW EXECUTE FUNCTION update_system_integration_configs_updated_at();

-- Migrate existing system configs from integration_configs to system_integration_configs
INSERT INTO public.system_integration_configs (
  integration_type,
  config_key,
  config_value,
  is_encrypted,
  created_by,
  created_at
)
SELECT 
  integration_type,
  config_key,
  config_value,
  is_encrypted,
  user_id,
  created_at
FROM public.integration_configs
WHERE config_key = 'system_config'
ON CONFLICT (integration_type, config_key) DO NOTHING;

-- Clean up the migrated system configs from the old table
DELETE FROM public.integration_configs 
WHERE config_key = 'system_config';
