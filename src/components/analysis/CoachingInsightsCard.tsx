import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { capitalizeSentences } from '@/lib/utils'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Button } from '@/components/ui/button'
import { CheckCircle, Lightbulb, Target, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import { RichOpportunityCard } from './RichOpportunityCard'

interface CoachingInsightsProps {
  coachingInsights: {
    whatWorkedWell: string[]
    missedOpportunities: string[] | string | Array<{
      "THE MOMENT": string
      [key: string]: any
    }>
    focusArea: string
  }
  dealHeat?: {
    level: 'HIGH' | 'MEDIUM' | 'LOW'
  }
}

export function CoachingInsightsCard({ coachingInsights, dealHeat }: CoachingInsightsProps) {
  // Auto-expand for HIGH heat deals, collapsed for others
  const [isOpen, setIsOpen] = useState(dealHeat?.level === 'HIGH')

  if (!coachingInsights) {
    return (
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-900">
            <Lightbulb className="w-5 h-5" />
            Coaching Insights
          </CardTitle>
          <CardDescription className="text-orange-700">
            ⚠️ Coaching insights not available for this analysis
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const { whatWorkedWell, missedOpportunities, focusArea } = coachingInsights

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardHeader>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full flex items-center justify-between p-0 h-auto hover:bg-transparent">
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <Lightbulb className="w-5 h-5 text-blue-600" />
                🎓 Coaching Insights
              </CardTitle>
              {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </Button>
          </CollapsibleTrigger>
          <CardDescription className="text-blue-700">
            Personalized feedback to elevate your sales game
          </CardDescription>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="space-y-6">
            {/* What You Did Well */}
            {whatWorkedWell && whatWorkedWell.length > 0 && (
              <div>
                <h4 className="font-semibold text-green-900 flex items-center gap-2 mb-3">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  ✅ What You Did Well
                </h4>
                <ul className="space-y-2">
                  {whatWorkedWell.map((item, idx) => (
                    <li key={idx} className="text-sm text-slate-700 pl-6 relative before:content-['•'] before:absolute before:left-2 before:text-green-600">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Opportunities for Improvement */}
            <div>
              <h4 className="font-semibold text-amber-900 flex items-center gap-2 mb-3">
                <Lightbulb className="w-4 h-4 text-amber-600" />
                💡 Opportunities for Improvement
              </h4>
              
              {/* Check if it's the new rich object format */}
              {Array.isArray(missedOpportunities) && 
               missedOpportunities.length > 0 && 
               typeof missedOpportunities[0] === 'object' && 
               missedOpportunities[0] !== null &&
               'THE MOMENT' in missedOpportunities[0] ? (
                // Rich format - use new component
                <div className="space-y-3">
                  {missedOpportunities.map((opportunity, index) => (
                    <RichOpportunityCard 
                      key={index} 
                      opportunity={opportunity as any} 
                      index={index} 
                    />
                  ))}
                </div>
              ) : Array.isArray(missedOpportunities) ? (
                // Legacy string array format
                <ul className="space-y-2">
                  {missedOpportunities.map((item, idx) => (
                    <li key={idx} className="text-sm text-slate-700 pl-6 relative before:content-['•'] before:absolute before:left-2 before:text-amber-600">
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                // Legacy single string format
                <p className="text-sm text-slate-700 pl-2">
                  {missedOpportunities || 'No critical missed opportunities identified'}
                </p>
              )}
            </div>

            {/* Focus Area */}
            <div className="bg-white/50 rounded-lg p-4 border border-blue-200">
              <h4 className="font-semibold text-blue-900 flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-blue-600" />
                🎯 Focus Area for Next Call
              </h4>
              <p className="text-sm text-slate-700 leading-relaxed">
                {capitalizeSentences(focusArea || 'Continue building on current strengths')}
              </p>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}
