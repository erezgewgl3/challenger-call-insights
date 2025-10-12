
// Shared deal heat calculation logic for both frontend and backend
export interface DealHeatResult {
  level: 'HIGH' | 'MEDIUM' | 'LOW'
  emoji: string
  description: string
  evidence: string[]
  businessImpact: string
  bgColor: string
  color: string
}

export function calculateDealHeat(analysis: any): DealHeatResult {
  const painLevel = analysis.call_summary?.painSeverity?.level || 'low'
  const indicators = analysis.call_summary?.painSeverity?.indicators || []
  const businessImpact = analysis.call_summary?.painSeverity?.businessImpact || ''
  
  const criticalFactors = analysis.call_summary?.urgencyDrivers?.criticalFactors || []
  const businessFactors = analysis.call_summary?.urgencyDrivers?.businessFactors || []
  const generalFactors = analysis.call_summary?.urgencyDrivers?.generalFactors || []
  
  const urgencyScore = (criticalFactors.length * 3) + 
                      (businessFactors.length * 2) + 
                      (generalFactors.length * 1)
  
  const buyingSignals = analysis.call_summary?.buyingSignalsAnalysis || {}
  const commitmentSignals = buyingSignals.commitmentSignals || []
  const engagementSignals = buyingSignals.engagementSignals || []
  
  const timelineAnalysis = analysis.call_summary?.timelineAnalysis || {}
  const statedTimeline = timelineAnalysis.statedTimeline || ''
  const businessDriver = timelineAnalysis.businessDriver || ''
  
  let dealScore = urgencyScore
  
  dealScore += commitmentSignals.length * 2
  dealScore += engagementSignals.length * 1
  
  const timelineText = (statedTimeline + ' ' + businessDriver).toLowerCase()
  if (timelineText.includes('friday') || timelineText.includes('this week') || 
      timelineText.includes('immediate') || timelineText.includes('asap')) {
    dealScore += 3
  }
  if (timelineText.includes('contract') || timelineText.includes('execute') || 
      timelineText.includes('sign') || timelineText.includes('docs')) {
    dealScore += 2
  }
  
  const resistanceData = analysis.call_summary?.resistanceAnalysis || {}
  const resistanceLevel = resistanceData.level || 'none'
  const resistanceSignals = resistanceData.signals || []
  
  let resistancePenalty = 0
  
  if (resistanceLevel === 'high') {
    resistancePenalty += 8
  } else if (resistanceLevel === 'medium') {
    resistancePenalty += 4
  }
  
  const allResistanceText = resistanceSignals.join(' ').toLowerCase()
  
  if (allResistanceText.includes('not actively looking') || 
      allResistanceText.includes('not looking for') ||
      allResistanceText.includes('no immediate need')) {
    resistancePenalty += 3
  }
  
  if (allResistanceText.includes('budget constraints') || 
      allResistanceText.includes('budget concerns') ||
      allResistanceText.includes('cost concerns')) {
    resistancePenalty += 2
  }
  
  if (allResistanceText.includes('satisfied with current') || 
      allResistanceText.includes('current solution works')) {
    resistancePenalty += 2
  }
  
  if (allResistanceText.includes('timing concerns') || 
      allResistanceText.includes('not the right time')) {
    resistancePenalty += 1
  }
  
  dealScore = Math.max(0, dealScore - resistancePenalty)
  
  let heatLevel: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW'
  let emoji = '❄️'
  let description = 'Long-term opportunity'
  
  if (
    (painLevel === 'high' && dealScore >= 1) ||
    criticalFactors.length >= 1 ||
    dealScore >= 8 ||
    (commitmentSignals.length >= 2 && dealScore >= 6) ||
    (painLevel === 'medium' && commitmentSignals.length >= 2 && dealScore >= 5)
  ) {
    heatLevel = 'HIGH'
    emoji = '🔥'
    description = 'Immediate attention needed'
  } else if (
    // MEDIUM heat requires meaningful buying intent, not just pain
    (painLevel === 'medium' && dealScore >= 2) ||  // Medium pain + some positive signals
    (businessFactors.length >= 1 && dealScore >= 1) ||  // Business urgency + at least 1 signal
    dealScore >= 4                                  // Strong buying signals independently
  ) {
    heatLevel = 'MEDIUM'
    emoji = '🌡️'
    description = 'Active opportunity'
  }
  
  return {
    level: heatLevel,
    emoji,
    description,
    evidence: indicators.slice(0, 2),
    businessImpact,
    bgColor: heatLevel === 'HIGH' ? 'bg-red-500' : heatLevel === 'MEDIUM' ? 'bg-orange-500' : 'bg-blue-500',
    color: heatLevel === 'HIGH' ? 'text-red-300' : heatLevel === 'MEDIUM' ? 'text-orange-300' : 'text-blue-300'
  }
}
