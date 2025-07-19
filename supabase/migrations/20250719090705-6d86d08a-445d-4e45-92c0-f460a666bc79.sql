-- FINAL SECURITY FIX - Complete Database Function Protection
-- Fix the remaining 2 functions that still need SET search_path = '' protection

-- Fix get_active_prompt function (parameterless version)
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
SET search_path = ''
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

-- Fix update_prompts_updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_prompts_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;