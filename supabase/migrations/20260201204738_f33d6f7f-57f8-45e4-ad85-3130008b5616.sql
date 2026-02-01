-- Add quality tracking columns to conversation_analysis table
ALTER TABLE public.conversation_analysis 
ADD COLUMN IF NOT EXISTS quality_score integer DEFAULT NULL,
ADD COLUMN IF NOT EXISTS was_repaired boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS missing_sections text[] DEFAULT NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.conversation_analysis.quality_score IS 'Quality score 0-100 based on content completeness validation';
COMMENT ON COLUMN public.conversation_analysis.was_repaired IS 'Whether JSON repair was needed to parse the AI response';
COMMENT ON COLUMN public.conversation_analysis.missing_sections IS 'List of sections that failed quality validation';

-- Create index for monitoring low-quality analyses
CREATE INDEX IF NOT EXISTS idx_conversation_analysis_quality_score 
ON public.conversation_analysis(quality_score) 
WHERE quality_score IS NOT NULL AND quality_score < 70;