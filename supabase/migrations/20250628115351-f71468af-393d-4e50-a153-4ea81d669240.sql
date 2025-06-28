
-- Fix the activate_single_prompt function to include proper WHERE clause
CREATE OR REPLACE FUNCTION public.activate_single_prompt(prompt_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Deactivate all prompts first (add WHERE clause for safety)
  UPDATE public.prompts SET is_active = false WHERE is_active = true;
  
  -- Activate the specified prompt
  UPDATE public.prompts 
  SET 
    is_active = true,
    activated_at = now()
  WHERE id = prompt_id_param;
END;
$$;
