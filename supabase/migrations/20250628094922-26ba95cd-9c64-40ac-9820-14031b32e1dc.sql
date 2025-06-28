
-- Step 1: Create system_settings table for global configuration
CREATE TABLE public.system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text NOT NULL UNIQUE,
  setting_value text, -- Allow NULL initially
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Add RLS for system settings (admin only)
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can manage system settings" ON public.system_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Step 2: Insert default system settings
INSERT INTO public.system_settings (setting_key, setting_value) VALUES
  ('default_ai_provider', 'openai');

-- Insert default_prompt_id with actual value if default exists, otherwise 'none'
INSERT INTO public.system_settings (setting_key, setting_value) 
SELECT 
  'default_prompt_id', 
  COALESCE(
    (SELECT id::text FROM public.prompts WHERE is_default = true LIMIT 1),
    'none'
  );

-- Step 3: Clean up prompts table - remove AI provider columns
ALTER TABLE public.prompts 
  DROP COLUMN IF EXISTS ai_provider,
  DROP COLUMN IF EXISTS default_ai_provider;

-- Step 4: Simplify prompts - keep only one global default
-- First, ensure only one default exists
UPDATE public.prompts 
SET is_default = false 
WHERE id NOT IN (
  SELECT id FROM public.prompts 
  WHERE is_default = true 
  LIMIT 1
);

-- Step 5: Add constraint to ensure only one default prompt
CREATE UNIQUE INDEX unique_single_default_prompt 
  ON public.prompts(is_default) 
  WHERE is_default = true;

-- Step 6: Make setting_value NOT NULL after we've populated it
ALTER TABLE public.system_settings 
ALTER COLUMN setting_value SET NOT NULL;
