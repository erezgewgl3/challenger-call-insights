
import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Users } from 'lucide-react'

interface StakeholderNavigationProps {
  analysis: any // Keep same type for now
}

export function StakeholderNavigation({ analysis }: StakeholderNavigationProps) {
  return (
    <>
      {/* 🎯 ENHANCED STAKEHOLDER NAVIGATION - Better Mobile Layout - Only show if data exists */}
      {(() => {
        // Check if any stakeholder data exists
        const economicBuyers = analysis.participants?.clientContacts?.filter((contact: any) => 
          contact.challengerRole === 'Economic Buyer' || contact.decisionLevel === 'high'
        ) || []
        
        const keyInfluencers = analysis.participants?.clientContacts?.filter((contact: any) => 
          contact.challengerRole === 'Influencer' || contact.decisionLevel === 'medium'
        ) || []
        
        const hasNavigationStrategy = analysis.recommendations?.stakeholderPlan
        
        const hasAnyStakeholderData = economicBuyers.length > 0 || keyInfluencers.length > 0 || hasNavigationStrategy
        
        if (!hasAnyStakeholderData) return null
        
        return (
          <div className="bg-white rounded-xl p-4 lg:p-6 shadow-sm border border-gray-200 mb-6 lg:mb-8">
            <div className="flex flex-wrap items-center gap-3 mb-4 lg:mb-6">
              <Users className="h-5 w-5 lg:h-6 lg:w-6 text-blue-600" />
              <h3 className="text-base lg:text-lg font-semibold">Stakeholder Navigation Map</h3>
              <Badge variant="outline" className="text-xs">Strategic Intelligence</Badge>
            </div>

            {(() => {
              const cards = []
              
              // Add Economic Buyers card if data exists
              if (economicBuyers.length > 0) {
                cards.push(
                  <div key="economic" className="bg-red-50 rounded-lg p-4 border border-red-200">
                    <h4 className="font-semibold text-red-800 mb-3 flex items-center gap-2 text-sm lg:text-base">
                      🏛️ Economic Buyers
                    </h4>
                    <div className="space-y-3">
                      {economicBuyers.map((contact: any, index: number) => (
                        <div key={index}>
                          <p className="font-medium text-sm lg:text-base">{contact.name} ({contact.title})</p>
                          <p className="text-xs lg:text-sm text-gray-600 leading-relaxed">
                            {contact.decisionEvidence?.[0] || contact.roleEvidence?.[0] || "Key decision authority"}
                          </p>
                          <Badge variant="outline" className="text-xs mt-1">Primary Contact</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              }
              
              // Add Key Influencers card if data exists
              if (keyInfluencers.length > 0) {
                cards.push(
                  <div key="influencers" className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                    <h4 className="font-semibold text-yellow-800 mb-3 flex items-center gap-2 text-sm lg:text-base">
                      📊 Key Influencers
                    </h4>
                    <div className="space-y-3">
                      {keyInfluencers.map((contact: any, index: number) => (
                        <div key={index}>
                          <p className="font-medium text-sm lg:text-base">{contact.name} ({contact.title})</p>
                          <p className="text-xs lg:text-sm text-gray-600 leading-relaxed">
                            {contact.roleEvidence?.[0] || "Influences decision process"}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              }
              
              // Add Navigation Strategy card if data exists
              if (hasNavigationStrategy) {
                cards.push(
                  <div key="strategy" className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2 text-sm lg:text-base">
                      🎯 Navigation Strategy
                    </h4>
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-blue-800 leading-relaxed">
                        {analysis.recommendations.stakeholderPlan}
                      </p>
                      <ul className="text-sm space-y-2">
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></div>
                          <span>Lead with economic buyers</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full flex-shrink-0"></div>
                          <span>Coordinate with influencers</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                          <span>Validate with end users</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                )
              }
              
              // Determine grid classes based on number of cards
              const gridClasses = cards.length === 1 ? "grid grid-cols-1 gap-4 lg:gap-6" :
                                 cards.length === 2 ? "grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6" :
                                 "grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6"
              
              return (
                <div className={gridClasses}>
                  {cards}
                </div>
              )
            })()}
          </div>
        )
      })()}
    </>
  )
}
