
-- Remove parent-child relationship and add new fields for flat versioning
ALTER TABLE public.prompts DROP COLUMN IF EXISTS parent_prompt_id;

-- Add new fields for better prompt management
ALTER TABLE public.prompts ADD COLUMN IF NOT EXISTS prompt_name TEXT;
ALTER TABLE public.prompts ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.users(id);

-- Update existing prompts to have a simple prompt name
UPDATE public.prompts 
SET prompt_name = CASE 
  WHEN is_default = true THEN 'Default System Prompt'
  ELSE 'Custom Prompt'
END
WHERE prompt_name IS NULL;

-- Create a sequence for global version numbering
CREATE SEQUENCE IF NOT EXISTS prompt_version_seq START 1;

-- Update existing prompts to have sequential version numbers
WITH numbered_prompts AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as new_version
  FROM public.prompts
)
UPDATE public.prompts 
SET version_number = numbered_prompts.new_version
FROM numbered_prompts 
WHERE public.prompts.id = numbered_prompts.id;

-- Set the sequence to continue from the highest existing version
SELECT setval('prompt_version_seq', COALESCE((SELECT MAX(version_number) FROM public.prompts), 0));

-- Update the default value for version_number to use the sequence
ALTER TABLE public.prompts ALTER COLUMN version_number SET DEFAULT nextval('prompt_version_seq');

-- Drop the old activate function and create a simpler one
DROP FUNCTION IF EXISTS public.activate_single_prompt(uuid);

-- Create simplified activation function
CREATE OR REPLACE FUNCTION public.activate_single_prompt(prompt_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Deactivate all prompts first
  UPDATE public.prompts SET is_active = false WHERE is_active = true;
  
  -- Activate the specified prompt
  UPDATE public.prompts 
  SET 
    is_active = true,
    activated_at = now()
  WHERE id = prompt_id_param;
END;
$$;

-- Drop the old get_active_prompt function and create a simpler one
DROP FUNCTION IF EXISTS public.get_active_prompt();

-- Create simplified get active prompt function
CREATE OR REPLACE FUNCTION public.get_active_prompt()
RETURNS TABLE(
  id uuid,
  version_number integer,
  user_id uuid,
  prompt_text text,
  prompt_name text,
  is_default boolean,
  is_active boolean,
  change_description text,
  activated_at timestamp with time zone,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  created_by uuid
)
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT 
    p.id,
    p.version_number,
    p.user_id,
    p.prompt_text,
    p.prompt_name,
    p.is_default,
    p.is_active,
    p.change_description,
    p.activated_at,
    p.created_at,
    p.updated_at,
    p.created_by
  FROM public.prompts p
  WHERE p.is_active = true
  LIMIT 1;
$$;
