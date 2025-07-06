
interface ChallengerScores {
  teaching?: number;
  tailoring?: number;
  control?: number;
}

interface Guidance {
  recommendation?: string;
  message?: string;
  keyInsights?: string[];
}

interface EmailFollowUp {
  timing?: string;
  urgency?: string;
}

interface ConversationAnalysis {
  challenger_scores?: ChallengerScores;
  guidance?: Guidance;
  email_followup?: EmailFollowUp;
  call_summary?: any;
  key_takeaways?: string[];
  recommendations?: any;
  reasoning?: any;
}

export function calculateDealHeat(analysis: ConversationAnalysis): 'HIGH' | 'MEDIUM' | 'LOW' {
  if (!analysis) return 'LOW';

  let heatScore = 0;
  
  // Analyze Challenger Sales scores (30% weight)
  const scores = analysis.challenger_scores;
  if (scores) {
    const avgScore = ((scores.teaching || 0) + (scores.tailoring || 0) + (scores.control || 0)) / 3;
    if (avgScore >= 4) heatScore += 30;
    else if (avgScore >= 3) heatScore += 20;
    else if (avgScore >= 2) heatScore += 10;
  }

  // Analyze guidance recommendation (25% weight)
  const guidance = analysis.guidance;
  if (guidance?.recommendation) {
    const rec = guidance.recommendation.toLowerCase();
    if (rec.includes('push') || rec.includes('advance') || rec.includes('close')) {
      heatScore += 25;
    } else if (rec.includes('continue') || rec.includes('follow')) {
      heatScore += 15;
    } else if (rec.includes('nurture') || rec.includes('build')) {
      heatScore += 10;
    }
  }

  // Analyze urgency signals in email follow-up (20% weight)
  const followUp = analysis.email_followup;
  if (followUp?.timing) {
    const timing = followUp.timing.toLowerCase();
    if (timing.includes('24 hour') || timing.includes('immediately') || timing.includes('urgent')) {
      heatScore += 20;
    } else if (timing.includes('48 hour') || timing.includes('this week')) {
      heatScore += 15;
    } else if (timing.includes('next week') || timing.includes('follow up')) {
      heatScore += 10;
    }
  }

  // Analyze key insights for buying signals (25% weight)
  const insights = guidance?.keyInsights || analysis.key_takeaways || [];
  const insightText = Array.isArray(insights) ? insights.join(' ').toLowerCase() : '';
  
  let buyingSignals = 0;
  
  // Budget signals
  if (insightText.includes('budget') || insightText.includes('approved') || insightText.includes('funding')) {
    buyingSignals += 8;
  }
  
  // Decision maker signals
  if (insightText.includes('decision maker') || insightText.includes('authority') || insightText.includes('ceo') || insightText.includes('manager')) {
    buyingSignals += 7;
  }
  
  // Timeline pressure signals
  if (insightText.includes('deadline') || insightText.includes('quarter') || insightText.includes('asap') || insightText.includes('soon')) {
    buyingSignals += 6;
  }
  
  // Pain point signals
  if (insightText.includes('pain') || insightText.includes('problem') || insightText.includes('challenge') || insightText.includes('struggle')) {
    buyingSignals += 4;
  }

  heatScore += Math.min(buyingSignals, 25); // Cap at 25 points

  // Determine heat level based on total score
  if (heatScore >= 70) return 'HIGH';
  if (heatScore >= 40) return 'MEDIUM';
  return 'LOW';
}
