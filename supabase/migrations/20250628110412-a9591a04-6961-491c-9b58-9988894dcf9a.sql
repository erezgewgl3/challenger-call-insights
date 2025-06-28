
-- Step 1: Ensure only one prompt is active system-wide
-- First, let's see current active prompts and fix the data
UPDATE public.prompts 
SET is_active = false 
WHERE id NOT IN (
  SELECT id FROM public.prompts 
  WHERE is_active = true 
  ORDER BY updated_at DESC 
  LIMIT 1
);

-- Step 2: Add constraint to ensure only one active prompt system-wide
CREATE UNIQUE INDEX unique_single_active_prompt 
  ON public.prompts(is_active) 
  WHERE is_active = true;

-- Step 3: Create function to get the single active prompt
CREATE OR REPLACE FUNCTION public.get_active_prompt()
RETURNS TABLE (
  id uuid,
  parent_prompt_id uuid,
  version_number integer,
  user_id uuid,
  prompt_text text,
  is_default boolean,
  is_active boolean,
  change_description text,
  activated_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
) 
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    p.id,
    p.parent_prompt_id,
    p.version_number,
    p.user_id,
    p.prompt_text,
    p.is_default,
    p.is_active,
    p.change_description,
    p.activated_at,
    p.created_at,
    p.updated_at
  FROM public.prompts p
  WHERE p.is_active = true
  LIMIT 1;
$$;

-- Step 4: Create function to activate a prompt (ensuring only one is active)
CREATE OR REPLACE FUNCTION public.activate_single_prompt(prompt_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Deactivate all prompts first
  UPDATE public.prompts SET is_active = false;
  
  -- Activate the specified prompt
  UPDATE public.prompts 
  SET 
    is_active = true,
    activated_at = now()
  WHERE id = prompt_id_param;
END;
$$;
