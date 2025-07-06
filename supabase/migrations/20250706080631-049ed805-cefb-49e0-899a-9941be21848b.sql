
-- Add heat_level column to conversation_analysis table as nullable field
ALTER TABLE conversation_analysis 
ADD COLUMN IF NOT EXISTS heat_level text;

-- Add a comment to document the field
COMMENT ON COLUMN conversation_analysis.heat_level IS 'Deal heat level: HIGH, MEDIUM, or LOW - calculated from analysis data';
