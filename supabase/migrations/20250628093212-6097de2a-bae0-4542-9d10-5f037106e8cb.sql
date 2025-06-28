
-- Simple approach: just add the missing column without modifying constraints
ALTER TABLE public.prompts 
ADD COLUMN IF NOT EXISTS default_ai_provider text;
