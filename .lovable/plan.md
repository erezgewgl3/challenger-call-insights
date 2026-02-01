
# Plan: Add Content Quality Validation with Retry or User Warning

## Status: ✅ COMPLETED

## Implementation Summary

### Database Changes
- Added `quality_score` (integer), `was_repaired` (boolean), and `missing_sections` (text[]) columns to `conversation_analysis` table
- Created index for monitoring low-quality analyses

### Edge Function Changes (analyze-transcript)
1. **Added `assessAnalysisQuality()` function** - Scores parsed analysis on completeness:
   - callSummary.overview: 20% (min 100 chars)
   - challengerScores: 15% (all 3 scores 1-5)
   - recommendations.nextBestActions: 20% (min 2 items)
   - actionPlan.actions: 20% (min 1 with email)
   - coachingInsights: 15% (either array populated)
   - dealAssessment: 10% (heat + rationale)

2. **Modified `parseAIResponse()`** - Returns ParseResult with repair metadata:
   - `analysis`: The parsed analysis
   - `wasRepaired`: Whether JSON repair was needed
   - `originalLength` / `repairedLength`: For tracking

3. **Added retry logic** - After parsing, if repair was needed AND quality < 70:
   - Automatically retries AI call once
   - Uses better result if retry improves quality

4. **Quality metadata stored** in database insert:
   - `quality_score`: 0-100 score
   - `was_repaired`: boolean flag
   - `missing_sections`: array of incomplete fields

### UI Changes
1. **Created `AnalysisQualityWarning` component** - Shows warning banner when:
   - Quality score < 70, OR
   - Was repaired with missing sections
   - Includes "Retry for Better Results" button
   - Expandable details showing missing sections

2. **Updated `NewAnalysisView`** - Added quality warning after hero section

3. **Updated `SalesIntelligenceView`** - Passes quality metadata to NewAnalysisView

---

## Files Modified
- `supabase/functions/analyze-transcript/index.ts` - Quality scoring + retry logic
- `src/components/analysis/AnalysisQualityWarning.tsx` - New component
- `src/components/analysis/NewAnalysisView.tsx` - Shows quality warning
- `src/components/analysis/SalesIntelligenceView.tsx` - Passes quality metadata

