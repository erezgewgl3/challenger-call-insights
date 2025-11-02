import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Lightbulb, AlertTriangle, TrendingUp, Users, MessageSquare } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface RichOpportunityCardProps {
  opportunity: {
    "THE MOMENT": string
    "SURFACE vs UNDERLYING"?: {
      Surface: string
      Underlying: string
    }
    "WHY THIS MATTERS"?: {
      "Deal impact"?: string
      "Time impact"?: string
      "Relationship impact"?: string
    }
    EVIDENCE?: string[]
    "WHAT TOP 0.01% REPS DO"?: {
      [key: string]: string
    }
    [key: string]: any
  }
  index: number
}

export function RichOpportunityCard({ opportunity, index }: RichOpportunityCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Extract the verbatim quote (dynamic key)
  const verbatimEntry = Object.entries(opportunity).find(
    ([key]) => key.includes('said VERBATIM')
  )
  const verbatimQuote = verbatimEntry ? verbatimEntry[0].match(/'([^']+)'/)?.[1] : null
  const whatHappened = verbatimEntry?.[1]

  const topRepSteps = opportunity["WHAT TOP 0.01% REPS DO"]
  const sortedSteps = topRepSteps 
    ? Object.entries(topRepSteps)
        .filter(([key]) => key.match(/^\d+\./))
        .sort((a, b) => {
          const numA = parseInt(a[0].match(/^\d+/)?.[0] || '0')
          const numB = parseInt(b[0].match(/^\d+/)?.[0] || '0')
          return numA - numB
        })
    : []

  return (
    <Card className="pdf-keep-together border-l-4 border-l-amber-500 bg-gradient-to-r from-amber-50 to-orange-50">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <div className="p-4 cursor-pointer hover:bg-amber-100/30 transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1">
                <Lightbulb className="w-5 h-5 text-amber-600 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h5 className="font-semibold text-gray-900 mb-1">
                    Opportunity #{index + 1}: {opportunity["THE MOMENT"]}
                  </h5>
                  {verbatimQuote && (
                    <div className="mt-2 p-2 bg-white/60 border border-amber-200 rounded italic text-sm text-gray-700">
                      💬 "{verbatimQuote}"
                    </div>
                  )}
                </div>
              </div>
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-amber-600 flex-shrink-0" />
              ) : (
                <ChevronDown className="w-5 h-5 text-amber-600 flex-shrink-0" />
              )}
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-4">
            {/* Surface vs Underlying */}
            {opportunity["SURFACE vs UNDERLYING"] && (
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                    Surface Level
                  </Badge>
                  <p className="text-sm text-gray-700 flex-1">
                    {opportunity["SURFACE vs UNDERLYING"].Surface}
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
                    Real Issue
                  </Badge>
                  <p className="text-sm text-gray-900 flex-1 font-medium">
                    {opportunity["SURFACE vs UNDERLYING"].Underlying}
                  </p>
                </div>
              </div>
            )}

            {/* Why This Matters */}
            {opportunity["WHY THIS MATTERS"] && (
              <div className="bg-white p-3 rounded-lg border border-amber-200 space-y-2">
                <h6 className="font-semibold text-amber-900 text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Why This Matters
                </h6>
                {opportunity["WHY THIS MATTERS"]["Deal impact"] && (
                  <div className="text-sm">
                    <span className="font-medium text-gray-700">💰 Deal Impact:</span>
                    <span className="text-gray-600 ml-2">{opportunity["WHY THIS MATTERS"]["Deal impact"]}</span>
                  </div>
                )}
                {opportunity["WHY THIS MATTERS"]["Time impact"] && (
                  <div className="text-sm">
                    <span className="font-medium text-gray-700">⏱️ Time Impact:</span>
                    <span className="text-gray-600 ml-2">{opportunity["WHY THIS MATTERS"]["Time impact"]}</span>
                  </div>
                )}
                {opportunity["WHY THIS MATTERS"]["Relationship impact"] && (
                  <div className="text-sm">
                    <span className="font-medium text-gray-700">🤝 Relationship Impact:</span>
                    <span className="text-gray-600 ml-2">{opportunity["WHY THIS MATTERS"]["Relationship impact"]}</span>
                  </div>
                )}
              </div>
            )}

            {/* Evidence */}
            {opportunity.EVIDENCE && opportunity.EVIDENCE.length > 0 && (
              <div className="space-y-2">
                <h6 className="font-semibold text-gray-700 text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  🔍 Evidence
                </h6>
                <ul className="space-y-1">
                  {opportunity.EVIDENCE.map((evidence, idx) => (
                    <li key={idx} className="text-xs text-gray-600 pl-4 relative before:content-['▸'] before:absolute before:left-0 before:text-amber-500">
                      {evidence}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* What Top 0.01% Reps Do */}
            {sortedSteps.length > 0 && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border-2 border-green-300">
                <h6 className="font-bold text-green-900 text-sm flex items-center gap-2 mb-3">
                  <Users className="w-5 h-5" />
                  🏆 What Top 0.01% Reps Do
                </h6>
                <div className="space-y-3">
                  {sortedSteps.map(([stepKey, stepValue]) => {
                    const stepTitle = stepKey.replace(/^\d+\.\s*/, '')
                    return (
                      <div key={stepKey} className="bg-white p-3 rounded border border-green-200">
                        <div className="font-semibold text-green-900 text-sm mb-1">
                          {stepKey.match(/^\d+/)?.[0]}. {stepTitle}
                        </div>
                        <div className="text-sm text-gray-700 italic pl-3 border-l-2 border-green-300">
                          {stepValue}
                        </div>
                      </div>
                    )
                  })}
                  {topRepSteps?.["Expected response"] && (
                    <div className="bg-blue-50 p-3 rounded border border-blue-200">
                      <div className="font-semibold text-blue-900 text-sm mb-1">
                        💬 Expected Response
                      </div>
                      <div className="text-sm text-gray-700 italic">
                        {topRepSteps["Expected response"]}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* What Actually Happened */}
            {whatHappened && (
              <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                <h6 className="font-semibold text-red-900 text-sm flex items-center gap-2 mb-2">
                  <MessageSquare className="w-4 h-4" />
                  ❌ What Actually Happened
                </h6>
                <p className="text-sm text-gray-700">{whatHappened}</p>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
