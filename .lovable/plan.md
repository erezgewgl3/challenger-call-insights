
# Plan: Add Content Quality Validation with Retry or User Warning

## Problem Statement
The current JSON repair mechanism can successfully parse truncated AI responses, but delivers incomplete analyses to users without any warning. A user expecting comprehensive sales coaching could receive a half-finished analysis and not know it.

## Proposed Solution
Implement a **quality gate** after JSON parsing that:
1. Validates content completeness (not just key existence)
2. Automatically retries once if quality is below threshold
3. If retry also fails, marks the analysis as "partial" and notifies the user

---

## Technical Implementation

### Step 1: Add Content Quality Scoring Function
Create a function that scores the parsed analysis on completeness:

```typescript
interface QualityScore {
  score: number;        // 0-100
  missingFields: string[];
  truncatedFields: string[];
  isAcceptable: boolean; // score >= 70
}

function assessAnalysisQuality(parsed: ParsedAnalysis, transcriptLength: number): QualityScore {
  // Check required sections exist AND have meaningful content
  // - callSummary: minimum 50 characters
  // - challengerScores: all 3 scores present and 1-5
  // - actionPlan.actions: at least 1 action with content
  // - coachingInsights: has whatWorkedWell OR missedOpportunities
  // - recommendations: has nextBestActions array
}
```

### Step 2: Modify parseAIResponse to Return Repair Metadata
Track whether repair was needed:

```typescript
interface ParseResult {
  analysis: ParsedAnalysis;
  wasRepaired: boolean;
  originalLength: number;
  repairedLength: number;
}
```

### Step 3: Add Retry Logic in Main Handler
After parsing, if quality check fails AND repair was used:

```typescript
if (parseResult.wasRepaired && !qualityScore.isAcceptable) {
  console.log('⚠️ [QUALITY] Truncated response detected, attempting retry...');
  // Retry AI call once with slightly shorter context if needed
  aiResponse = await retryAICall(...);
  parseResult = parseAIResponse(aiResponse);
  qualityScore = assessAnalysisQuality(parseResult.analysis);
}
```

### Step 4: Store Quality Metadata in Database
Add to conversation_analysis insert:

```typescript
{
  ...analysisData,
  quality_score: qualityScore.score,
  was_repaired: parseResult.wasRepaired,
  missing_sections: qualityScore.missingFields
}
```

### Step 5: Surface Warnings to User
In the UI (NewAnalysisView), show a banner if quality_score < 70:

```tsx
{analysis.quality_score < 70 && (
  <Alert variant="warning">
    This analysis may be incomplete. You can retry for a more comprehensive result.
  </Alert>
)}
```

---

## Quality Scoring Criteria

| Section | Weight | Minimum Requirement |
|---------|--------|---------------------|
| callSummary | 20% | 100+ characters |
| challengerScores | 15% | All 3 scores present, 1-5 range |
| recommendations.nextBestActions | 20% | At least 2 items |
| actionPlan.actions | 20% | At least 1 action with email content |
| coachingInsights | 15% | Either array populated |
| dealAssessment | 10% | heat + heatRationale present |

**Acceptable threshold: 70/100**

---

## Files to Modify

1. **supabase/functions/analyze-transcript/index.ts**
   - Add `assessAnalysisQuality()` function
   - Modify `parseAIResponse()` to return repair metadata
   - Add retry logic after quality check
   - Include quality_score in database insert

2. **src/components/analysis/NewAnalysisView.tsx**
   - Add quality warning banner
   - Add "Retry Analysis" button for low-quality results

3. **Database migration** (if needed)
   - Add `quality_score` integer column to `conversation_analysis`
   - Add `was_repaired` boolean column

---

## Alternative: Fail-Fast Approach
If you prefer, we could instead **remove the JSON repair entirely** and always fail with a clear error when the AI returns malformed JSON. This forces a retry rather than potentially accepting garbage.

The trade-off:
- **Repair + Quality Check**: Better UX for minor issues, catches major problems
- **Fail-Fast**: Simpler, guarantees either full quality or error, but more retries needed

Which approach do you prefer?
