
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
  
  // FIX 1: Distinguish true commitment from exploratory signals
  const trueCommitmentSignals = commitmentSignals.filter((signal: string) => {
    const lower = signal.toLowerCase()
    return (
      lower.includes('budget approved') ||
      lower.includes('let\'s get the contract') ||
      lower.includes('when can we start') ||
      lower.includes('can we sign') ||
      lower.includes('need this in front of') ||
      lower.includes('ready to move forward') ||
      lower.includes('schedule implementation') ||
      lower.includes('get the paperwork')
    )
  })

  const exploratorySignals = commitmentSignals.filter((signal: string) => {
    const lower = signal.toLowerCase()
    return (
      lower.includes('how long') ||
      lower.includes('what if') ||
      lower.includes('can you send') ||
      lower.includes('proposal') ||
      lower.includes('what about') ||
      lower.includes('give us some examples')
    )
  })

  const trueCommitmentCount = trueCommitmentSignals.length
  const exploratoryCount = exploratorySignals.length
  
  const timelineAnalysis = analysis.call_summary?.timelineAnalysis || {}
  const statedTimeline = timelineAnalysis.statedTimeline || ''
  const businessDriver = timelineAnalysis.businessDriver || ''
  
  let dealScore = urgencyScore
  
  // Updated scoring: true commitment worth more, exploratory less
  dealScore += trueCommitmentCount * 3
  dealScore += exploratoryCount * 1
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
  
  // FIX 3: Increase need skepticism penalty from 2 to 5
  const hasNeedSkepticism = allResistanceText.includes('managed fine') ||
                           allResistanceText.includes('doing okay without') ||
                           allResistanceText.includes('gotten along without') ||
                           allResistanceText.includes('satisfied with current') ||
                           allResistanceText.includes('current solution works') ||
                           allResistanceText.includes('never had an issue')

  if (hasNeedSkepticism) {
    resistancePenalty += 5
    
    // Extra penalty if influential stakeholder
    const isInfluential = allResistanceText.includes('i have to ask') || 
                         allResistanceText.includes('honestly') ||
                         allResistanceText.includes('to be frank')
    if (isInfluential) {
      resistancePenalty += 2
    }
  }
  
  if (allResistanceText.includes('timing concerns') || 
      allResistanceText.includes('not the right time')) {
    resistancePenalty += 1
  }
  
  // FIX 2: Add budget shock detection
  const hasBudgetShock = allResistanceText.includes('double') ||
                        allResistanceText.includes('triple') ||
                        allResistanceText.includes('doubling') ||
                        allResistanceText.includes('tribling') ||
                        allResistanceText.includes('2x') ||
                        allResistanceText.includes('3x') ||
                        allResistanceText.includes('substantially more') ||
                        allResistanceText.includes('much higher than') ||
                        allResistanceText.includes('more than expected') ||
                        allResistanceText.includes('over budget')

  if (hasBudgetShock) {
    resistancePenalty += 3
  }
  
  dealScore = Math.max(0, dealScore - resistancePenalty)
  
  let heatLevel: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW'
  let emoji = '❄️'
  let description = 'Long-term opportunity'
  
  if (
    (painLevel === 'high' && dealScore >= 1) ||
    criticalFactors.length >= 1 ||
    dealScore >= 8 ||
    (trueCommitmentCount >= 2 && dealScore >= 6) ||
    (painLevel === 'medium' && trueCommitmentCount >= 2 && dealScore >= 5)
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
  
  // FIX 4: Add forced downgrade rules
  if (heatLevel === 'HIGH') {
    // Rule 1: Need skepticism + Budget shock = MEDIUM maximum
    if (hasNeedSkepticism && hasBudgetShock) {
      console.log('🔍 [HEAT] DOWNGRADE: Need skepticism + budget shock → MEDIUM')
      heatLevel = 'MEDIUM'
      emoji = '🌡️'
      description = 'Active opportunity with concerns'
    }
    
    // Rule 2: No true commitment + high resistance = MEDIUM maximum
    else if (trueCommitmentCount === 0 && resistanceLevel === 'high') {
      console.log('🔍 [HEAT] DOWNGRADE: No commitment + high resistance → MEDIUM')
      heatLevel = 'MEDIUM'
      emoji = '🌡️'
      description = 'Active opportunity'
    }
    
    // Rule 3: Exploratory stage only = MEDIUM maximum
    else if (trueCommitmentCount === 0 && exploratoryCount > 0 && commitmentSignals.length === exploratoryCount) {
      console.log('🔍 [HEAT] DOWNGRADE: Exploratory stage only → MEDIUM')
      heatLevel = 'MEDIUM'
      emoji = '🌡️'
      description = 'Active opportunity (early stage)'
    }
    
    // Rule 4: Pain level high but dealScore near zero or negative
    else if (painLevel === 'high' && dealScore <= 2) {
      console.log('🔍 [HEAT] DOWNGRADE: High pain but low buying intent → MEDIUM')
      heatLevel = 'MEDIUM'
      emoji = '🌡️'
      description = 'Pain without urgency'
    }
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
