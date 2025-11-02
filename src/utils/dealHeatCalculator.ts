
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
    resistancePenalty += 8  // Increased from 5 - economic buyer skepticism is deal-critical
    
    // Extra penalty if economic buyer or influential stakeholder
    const isInfluential = allResistanceText.includes('i have to ask') || 
                         allResistanceText.includes('honestly') ||
                         allResistanceText.includes('to be frank')
    if (isInfluential) {
      resistancePenalty += 3  // Increased from 2
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
  
  // Floor rule: Medium pain + business drivers deserve MEDIUM minimum
  // BUT only if there's actual buying intent (commitment or exploratory signals)
  if (painLevel === 'medium' && businessFactors.length >= 2) {
    // Only boost if there's buying intent
    if (dealScore < 2 && (trueCommitmentCount > 0 || exploratoryCount > 2)) {
      console.log('🔍 [HEAT] FLOOR RULE: Medium pain + 2+ business factors + buying intent → MEDIUM minimum (dealScore boosted from', dealScore, 'to 2)')
      dealScore = 2  // Boost to MEDIUM threshold
    }
  }
  
  // Floor rule: High pain + business drivers also deserve MEDIUM minimum
  if (painLevel === 'high' && businessFactors.length >= 2) {
    if (dealScore < 2 && (trueCommitmentCount > 0 || exploratoryCount > 2)) {
      console.log('🔍 [HEAT] FLOOR RULE: High pain + 2+ business factors + buying intent → MEDIUM minimum (dealScore boosted from', dealScore, 'to 2)')
      dealScore = 2 // Ensures MEDIUM minimum even with high resistance
    }
  }
  
  // Step 1: Determine PRELIMINARY heat level
  let preliminaryHeat: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW'
  let emoji = '❄️'
  let description = 'Long-term opportunity'
  
  if (
    (painLevel === 'high' && trueCommitmentCount >= 1 && dealScore >= 4) ||  // NEW: Requires commitment + higher score
    criticalFactors.length >= 1 ||
    dealScore >= 8 ||
    (trueCommitmentCount >= 2 && dealScore >= 6) ||
    (painLevel === 'medium' && trueCommitmentCount >= 2 && dealScore >= 5)
  ) {
    preliminaryHeat = 'HIGH'
    emoji = '🔥'
    description = 'Immediate attention needed'
  } else if (
    (painLevel === 'medium' && dealScore >= 2) ||
    (painLevel === 'high' && (dealScore >= 2 || businessFactors.length >= 2)) ||  // NEW: Alternative threshold
    (businessFactors.length >= 1 && dealScore >= 1) ||
    dealScore >= 4
  ) {
    preliminaryHeat = 'MEDIUM'
    emoji = '🌡️'
    description = 'Active opportunity'
  }
  
  // Step 2: Apply downgrade rules BEFORE finalizing
  let heatLevel = preliminaryHeat
  
  if (preliminaryHeat === 'HIGH') {
    // Rule 1: Need skepticism + Budget shock
    if (hasNeedSkepticism && hasBudgetShock) {
      console.log('🔽 [DOWNGRADE] Need skepticism + budget shock → MEDIUM')
      heatLevel = 'MEDIUM'
      emoji = '🌡️'
      description = 'Active opportunity with concerns'
    }
    // Rule 2: No true commitment + high resistance
    else if (trueCommitmentCount === 0 && resistanceLevel === 'high') {
      console.log('🔽 [DOWNGRADE] No commitment + high resistance → MEDIUM')
      heatLevel = 'MEDIUM'
      emoji = '🌡️'
      description = 'Active opportunity'
    }
    // Rule 3: Exploratory stage only
    else if (trueCommitmentCount === 0 && exploratoryCount > 0 && commitmentSignals.length === exploratoryCount) {
      console.log('🔽 [DOWNGRADE] Exploratory stage only → MEDIUM')
      heatLevel = 'MEDIUM'
      emoji = '🌡️'
      description = 'Active opportunity (early stage)'
    }
    // Rule 4: Pain level high but low buying intent
    else if (painLevel === 'high' && dealScore <= 2) {
      console.log('🔽 [DOWNGRADE] High pain but low buying intent → MEDIUM')
      heatLevel = 'MEDIUM'
      emoji = '🌡️'
      description = 'Pain without urgency'
    }
    // Rule 5: Budget shock with no commitment
    else if (hasBudgetShock && trueCommitmentCount === 0) {
      console.log('🔽 [DOWNGRADE] Budget shock with no commitment signals → MEDIUM')
      heatLevel = 'MEDIUM'
      emoji = '🌡️'
      description = 'Active opportunity (financial concerns)'
    }
    // Rule 6: Economic buyer resistance (NEW)
    else if (resistanceLevel === 'high' && trueCommitmentCount === 0 && 
             (hasBudgetShock || hasNeedSkepticism)) {
      console.log('🔽 [DOWNGRADE] Economic buyer resistance without commitment → MEDIUM')
      heatLevel = 'MEDIUM'
      emoji = '🌡️'
      description = 'Economic buyer concerns present'
    }
  }
  
  console.log('🔍 [HEAT] Final heat level:', heatLevel)
  
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
