
-- Corrected migration to fix heat_level calculation logic
-- This migration addresses the discrepancy between frontend heat calculation and stored heat_level values

-- Create improved function that exactly matches NewAnalysisView.tsx getDealHeat() logic
CREATE OR REPLACE FUNCTION calculate_heat_level_corrected(analysis_data jsonb)
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
    -- Extract pain level data (check both painSeverity and pain_level locations)
    pain_level := COALESCE(
        analysis_data->'call_summary'->'painSeverity'->>'level',
        analysis_data->'call_summary'->>'pain_level',
        analysis_data->>'pain_level',
        'low'
    );
    
    pain_indicators := COALESCE(
        analysis_data->'call_summary'->'painSeverity'->'indicators',
        analysis_data->'call_summary'->'pain_indicators',
        '[]'::jsonb
    );
    
    -- Extract urgency drivers with multiple fallback paths
    critical_factors := COALESCE(
        analysis_data->'call_summary'->'urgencyDrivers'->'criticalFactors',
        analysis_data->'call_summary'->'critical_factors',
        analysis_data->'urgency_drivers'->'critical_factors',
        '[]'::jsonb
    );
    
    business_factors := COALESCE(
        analysis_data->'call_summary'->'urgencyDrivers'->'businessFactors',
        analysis_data->'call_summary'->'business_factors',
        analysis_data->'urgency_drivers'->'business_factors',
        '[]'::jsonb
    );
    
    general_factors := COALESCE(
        analysis_data->'call_summary'->'urgencyDrivers'->'generalFactors',
        analysis_data->'call_summary'->'general_factors',
        analysis_data->'urgency_drivers'->'general_factors',
        '[]'::jsonb
    );
    
    -- Calculate urgency score (matches NewAnalysisView.tsx logic exactly)
    urgency_score := (jsonb_array_length(COALESCE(critical_factors, '[]'::jsonb)) * 3) + 
                     (jsonb_array_length(COALESCE(business_factors, '[]'::jsonb)) * 2) + 
                     (jsonb_array_length(COALESCE(general_factors, '[]'::jsonb)) * 1);
    
    -- Extract buying signals with fallback paths
    commitment_signals := COALESCE(
        analysis_data->'call_summary'->'buyingSignalsAnalysis'->'commitmentSignals',
        analysis_data->'call_summary'->'commitment_signals',
        analysis_data->'buying_signals'->'commitment_signals',
        '[]'::jsonb
    );
    
    engagement_signals := COALESCE(
        analysis_data->'call_summary'->'buyingSignalsAnalysis'->'engagementSignals',
        analysis_data->'call_summary'->'engagement_signals',
        analysis_data->'buying_signals'->'engagement_signals',
        '[]'::jsonb
    );
    
    -- Start with urgency score
    deal_score := urgency_score;
    
    -- Add buying signals scoring (exact match to frontend)
    deal_score := deal_score + (jsonb_array_length(COALESCE(commitment_signals, '[]'::jsonb)) * 2);
    deal_score := deal_score + (jsonb_array_length(COALESCE(engagement_signals, '[]'::jsonb)) * 1);
    
    -- Extract timeline analysis with fallbacks
    stated_timeline := COALESCE(
        analysis_data->'call_summary'->'timelineAnalysis'->>'statedTimeline',
        analysis_data->'call_summary'->>'stated_timeline',
        analysis_data->>'stated_timeline',
        ''
    );
    
    business_driver := COALESCE(
        analysis_data->'call_summary'->'timelineAnalysis'->>'businessDriver',
        analysis_data->'call_summary'->'urgencyDrivers'->>'primary',
        analysis_data->'call_summary'->>'business_driver',
        ''
    );
    
    -- Combine timeline text for analysis
    timeline_text := LOWER(stated_timeline || ' ' || business_driver);
    
    -- Timeline urgency scoring (exact match to frontend logic)
    IF timeline_text LIKE '%friday%' OR timeline_text LIKE '%this week%' OR 
       timeline_text LIKE '%immediate%' OR timeline_text LIKE '%asap%' THEN
        deal_score := deal_score + 3;
    END IF;
    
    IF timeline_text LIKE '%contract%' OR timeline_text LIKE '%execute%' OR 
       timeline_text LIKE '%sign%' OR timeline_text LIKE '%docs%' THEN
        deal_score := deal_score + 2;
    END IF;
    
    -- Extract resistance analysis with fallbacks
    resistance_level := COALESCE(
        analysis_data->'call_summary'->'resistanceAnalysis'->>'level',
        analysis_data->'call_summary'->>'resistance_level',
        analysis_data->>'resistance_level',
        'none'
    );
    
    resistance_signals := COALESCE(
        analysis_data->'call_summary'->'resistanceAnalysis'->'signals',
        analysis_data->'call_summary'->'resistance_signals',
        analysis_data->'resistance_signals',
        '[]'::jsonb
    );
    
    -- Calculate resistance penalty (exact match to frontend)
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
    
    -- CRITICAL FIX: Determine heat level using EXACT same logic as NewAnalysisView.tsx
    -- This is the key correction that was missing in the previous migration
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

-- Update ALL existing records with the corrected heat level calculation
UPDATE conversation_analysis 
SET heat_level = calculate_heat_level_corrected(
    COALESCE(call_summary, '{}'::jsonb)
)
WHERE heat_level IS NOT NULL;

-- Specific verification query for the "Samaria x Debra_transcript" record
-- This will help us confirm the fix worked
DO $$
DECLARE
    transcript_record RECORD;
    calculated_heat text;
    pain_data jsonb;
    business_data jsonb;
BEGIN
    -- Find the specific transcript
    SELECT t.title, ca.heat_level, ca.call_summary
    INTO transcript_record
    FROM transcripts t
    JOIN conversation_analysis ca ON t.id = ca.transcript_id
    WHERE t.title ILIKE '%Samaria%Debra%';
    
    IF FOUND THEN
        -- Calculate what the heat should be
        calculated_heat := calculate_heat_level_corrected(transcript_record.call_summary);
        
        -- Extract key data for verification
        pain_data := transcript_record.call_summary->'call_summary'->'painSeverity';
        business_data := transcript_record.call_summary->'call_summary'->'urgencyDrivers'->'businessFactors';
        
        RAISE NOTICE 'Transcript: %, Current Heat: %, Calculated Heat: %', 
            transcript_record.title, transcript_record.heat_level, calculated_heat;
        RAISE NOTICE 'Pain Level: %, Business Factors Count: %', 
            pain_data->>'level', jsonb_array_length(COALESCE(business_data, '[]'::jsonb));
    ELSE
        RAISE NOTICE 'Samaria x Debra transcript not found';
    END IF;
END $$;

-- Clean up the temporary function
DROP FUNCTION IF EXISTS calculate_heat_level_corrected(jsonb);

-- Final verification query to show heat level distribution
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

-- Show sample records that should now be MEDIUM heat
SELECT 
    t.title,
    ca.heat_level,
    ca.call_summary->'call_summary'->'painSeverity'->>'level' as pain_level,
    jsonb_array_length(COALESCE(ca.call_summary->'call_summary'->'urgencyDrivers'->'businessFactors', '[]'::jsonb)) as business_factors_count
FROM transcripts t
JOIN conversation_analysis ca ON t.id = ca.transcript_id
WHERE ca.heat_level = 'MEDIUM'
ORDER BY t.title
LIMIT 10;
