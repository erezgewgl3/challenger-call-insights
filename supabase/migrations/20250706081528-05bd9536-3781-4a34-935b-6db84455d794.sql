
-- Updated migration to match exact heat calculation logic from NewAnalysisView.tsx
-- This replicates the getDealHeat() function logic precisely

-- Create function that matches the exact logic from NewAnalysisView.tsx
CREATE OR REPLACE FUNCTION calculate_heat_level_exact_match(analysis_data jsonb)
RETURNS text AS $$
DECLARE
    heat_level text := 'LOW'; -- Default
    deal_score integer := 0;
    resistance_penalty integer := 0;
    
    -- Pain level analysis
    pain_level text;
    pain_indicators jsonb;
    
    -- Urgency drivers
    critical_factors jsonb;
    business_factors jsonb;
    general_factors jsonb;
    urgency_score integer := 0;
    
    -- Buying signals
    commitment_signals jsonb;
    engagement_signals jsonb;
    
    -- Timeline analysis
    stated_timeline text;
    business_driver text;
    timeline_text text;
    
    -- Resistance analysis
    resistance_level text;
    resistance_signals jsonb;
    all_resistance_text text;
BEGIN
    -- Extract pain level data
    pain_level := COALESCE(
        analysis_data->'call_summary'->'painSeverity'->>'level',
        'low'
    );
    
    pain_indicators := COALESCE(
        analysis_data->'call_summary'->'painSeverity'->'indicators',
        '[]'::jsonb
    );
    
    -- Extract urgency drivers
    critical_factors := COALESCE(
        analysis_data->'call_summary'->'urgencyDrivers'->'criticalFactors',
        '[]'::jsonb
    );
    
    business_factors := COALESCE(
        analysis_data->'call_summary'->'urgencyDrivers'->'businessFactors',
        '[]'::jsonb
    );
    
    general_factors := COALESCE(
        analysis_data->'call_summary'->'urgencyDrivers'->'generalFactors',
        '[]'::jsonb
    );
    
    -- Calculate urgency score (matches NewAnalysisView.tsx logic)
    urgency_score := (jsonb_array_length(COALESCE(critical_factors, '[]'::jsonb)) * 3) + 
                     (jsonb_array_length(COALESCE(business_factors, '[]'::jsonb)) * 2) + 
                     (jsonb_array_length(COALESCE(general_factors, '[]'::jsonb)) * 1);
    
    -- Extract buying signals
    commitment_signals := COALESCE(
        analysis_data->'call_summary'->'buyingSignalsAnalysis'->'commitmentSignals',
        '[]'::jsonb
    );
    
    engagement_signals := COALESCE(
        analysis_data->'call_summary'->'buyingSignalsAnalysis'->'engagementSignals',
        '[]'::jsonb
    );
    
    -- Start with urgency score
    deal_score := urgency_score;
    
    -- Add buying signals scoring
    deal_score := deal_score + (jsonb_array_length(COALESCE(commitment_signals, '[]'::jsonb)) * 2);
    deal_score := deal_score + (jsonb_array_length(COALESCE(engagement_signals, '[]'::jsonb)) * 1);
    
    -- Extract timeline analysis
    stated_timeline := COALESCE(
        analysis_data->'call_summary'->'timelineAnalysis'->>'statedTimeline',
        ''
    );
    
    business_driver := COALESCE(
        analysis_data->'call_summary'->'timelineAnalysis'->>'businessDriver',
        analysis_data->'call_summary'->'urgencyDrivers'->>'primary',
        ''
    );
    
    -- Combine timeline text for analysis
    timeline_text := LOWER(stated_timeline || ' ' || business_driver);
    
    -- Timeline urgency scoring (matches exact logic from NewAnalysisView.tsx)
    IF timeline_text LIKE '%friday%' OR timeline_text LIKE '%this week%' OR 
       timeline_text LIKE '%immediate%' OR timeline_text LIKE '%asap%' THEN
        deal_score := deal_score + 3;
    END IF;
    
    IF timeline_text LIKE '%contract%' OR timeline_text LIKE '%execute%' OR 
       timeline_text LIKE '%sign%' OR timeline_text LIKE '%docs%' THEN
        deal_score := deal_score + 2;
    END IF;
    
    -- Extract resistance analysis
    resistance_level := COALESCE(
        analysis_data->'call_summary'->'resistanceAnalysis'->>'level',
        'none'
    );
    
    resistance_signals := COALESCE(
        analysis_data->'call_summary'->'resistanceAnalysis'->'signals',
        '[]'::jsonb
    );
    
    -- Calculate resistance penalty (matches exact logic)
    resistance_penalty := 0;
    
    IF resistance_level = 'high' THEN
        resistance_penalty := resistance_penalty + 8;
    ELSIF resistance_level = 'medium' THEN
        resistance_penalty := resistance_penalty + 4;
    END IF;
    
    -- Convert resistance signals to text for pattern matching
    SELECT string_agg(value::text, ' ') INTO all_resistance_text
    FROM jsonb_array_elements_text(COALESCE(resistance_signals, '[]'::jsonb));
    
    all_resistance_text := LOWER(COALESCE(all_resistance_text, ''));
    
    -- Apply specific resistance penalties (exact matches from NewAnalysisView.tsx)
    IF all_resistance_text LIKE '%not actively looking%' OR 
       all_resistance_text LIKE '%not looking for%' OR
       all_resistance_text LIKE '%no immediate need%' THEN
        resistance_penalty := resistance_penalty + 3;
    END IF;
    
    IF all_resistance_text LIKE '%budget constraints%' OR 
       all_resistance_text LIKE '%budget concerns%' OR
       all_resistance_text LIKE '%cost concerns%' THEN
        resistance_penalty := resistance_penalty + 2;
    END IF;
    
    IF all_resistance_text LIKE '%satisfied with current%' OR 
       all_resistance_text LIKE '%current solution works%' THEN
        resistance_penalty := resistance_penalty + 2;
    END IF;
    
    IF all_resistance_text LIKE '%timing concerns%' OR 
       all_resistance_text LIKE '%not the right time%' THEN
        resistance_penalty := resistance_penalty + 1;
    END IF;
    
    -- Apply resistance penalty
    deal_score := GREATEST(0, deal_score - resistance_penalty);
    
    -- Determine heat level using exact same logic as NewAnalysisView.tsx
    IF pain_level = 'high' OR
       jsonb_array_length(COALESCE(critical_factors, '[]'::jsonb)) >= 1 OR
       deal_score >= 8 OR
       (jsonb_array_length(COALESCE(commitment_signals, '[]'::jsonb)) >= 2 AND deal_score >= 6) OR
       (pain_level = 'medium' AND jsonb_array_length(COALESCE(commitment_signals, '[]'::jsonb)) >= 2 AND deal_score >= 5) THEN
        heat_level := 'HIGH';
    ELSIF pain_level = 'medium' OR 
          jsonb_array_length(COALESCE(business_factors, '[]'::jsonb)) >= 1 OR
          deal_score >= 3 THEN
        heat_level := 'MEDIUM';
    ELSE
        heat_level := 'LOW';
    END IF;
    
    RETURN heat_level;
END;
$$ LANGUAGE plpgsql;

-- Update existing records with NULL heat_level using the exact matching logic
UPDATE conversation_analysis 
SET heat_level = calculate_heat_level_exact_match(
    COALESCE(call_summary, '{}'::jsonb)
)
WHERE heat_level IS NULL;

-- Handle records that still don't have heat_level (due to insufficient data)
-- Apply conservative defaults based on available analysis data
UPDATE conversation_analysis 
SET heat_level = CASE
    -- If we have recommendations with positive indicators, set to MEDIUM
    WHEN recommendations->>'recommendation' IN ('Push', 'Accelerate', 'Close') THEN 'MEDIUM'
    -- If we have guidance suggesting action, set to MEDIUM  
    WHEN guidance->>'recommendation' IN ('Push', 'Follow up aggressively') THEN 'MEDIUM'
    -- If challenger scores are high (average >= 4), set to MEDIUM
    WHEN (
        COALESCE((challenger_scores->>'teaching')::numeric, 0) + 
        COALESCE((challenger_scores->>'tailoring')::numeric, 0) + 
        COALESCE((challenger_scores->>'control')::numeric, 0)
    ) / 3.0 >= 4.0 THEN 'MEDIUM'
    -- Default to LOW for insufficient data
    ELSE 'LOW'
END
WHERE heat_level IS NULL;

-- Clean up the function
DROP FUNCTION IF EXISTS calculate_heat_level_exact_match(jsonb);

-- Verification query to show results
SELECT 
    heat_level,
    COUNT(*) as record_count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1) as percentage
FROM conversation_analysis 
WHERE heat_level IS NOT NULL
GROUP BY heat_level
ORDER BY 
    CASE heat_level 
        WHEN 'HIGH' THEN 1 
        WHEN 'MEDIUM' THEN 2 
        WHEN 'LOW' THEN 3 
    END;

-- Show sample of populated records for verification
SELECT 
    id,
    heat_level,
    CASE 
        WHEN call_summary->>'painSeverity' IS NOT NULL THEN 'Has pain analysis'
        WHEN recommendations->>'recommendation' IS NOT NULL THEN 'Has recommendations'
        WHEN guidance->>'recommendation' IS NOT NULL THEN 'Has guidance'
        ELSE 'Fallback logic used'
    END as data_source
FROM conversation_analysis 
WHERE heat_level IS NOT NULL
LIMIT 10;
