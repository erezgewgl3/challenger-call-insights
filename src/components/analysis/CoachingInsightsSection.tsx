import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { capitalizeSentences } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Lightbulb, CheckCircle, Target, ChevronDown, ChevronUp } from 'lucide-react'

interface CoachingInsightsSectionProps {
  coachingInsights: {
    whatWorkedWell: string[]
    missedOpportunities: string[] | string
    focusArea: string
  }
  dealHeat: {
    level: 'HIGH' | 'MEDIUM' | 'LOW'
  }
  isOpen: boolean
  onToggle: () => void
}

export function CoachingInsightsSection({
  coachingInsights,
  dealHeat,
  isOpen,
  onToggle
}: CoachingInsightsSectionProps) {
  const { whatWorkedWell, missedOpportunities, focusArea } = coachingInsights

  return (
    <Card className="border-l-4 border-l-blue-400 bg-gradient-to-r from-blue-50 to-indigo-50 transition-all hover:shadow-md">
      <Collapsible open={isOpen} onOpenChange={onToggle}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-blue-100/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Lightbulb className="w-5 h-5 lg:w-6 lg:h-6 text-blue-600" />
                <div>
                  <CardTitle className="text-base lg:text-lg flex items-center gap-2">
                    🎓 Coaching Insights & Development
                    {dealHeat.level === 'HIGH' && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                        AUTO-OPEN
                      </Badge>
                    )}
                  </CardTitle>
                  <p className="text-sm text-blue-700 font-normal mt-1">
                    Personalized feedback to elevate your sales performance
                  </p>
                </div>
              </div>
              {isOpen ? (
                <ChevronUp className="w-5 h-5 text-blue-600" />
              ) : (
                <ChevronDown className="w-5 h-5 text-blue-600" />
              )}
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-4 lg:space-y-6">
            {/* What You Did Well Section */}
            {whatWorkedWell && whatWorkedWell.length > 0 && (
              <div>
                <h4 className="font-semibold text-green-700 mb-3 flex items-center gap-2 text-sm lg:text-base">
                  <CheckCircle className="w-4 h-4 lg:w-5 lg:h-5" />
                  ✅ What You Did Well ({whatWorkedWell.length})
                </h4>
                <div className="grid gap-2">
                  {whatWorkedWell.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-2 lg:p-3 bg-white rounded-lg border border-green-200"
                    >
                      <CheckCircle className="w-4 h-4 lg:w-5 lg:h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-800 text-sm lg:text-base">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Opportunities for Improvement Section */}
            <div>
              <h4 className="font-semibold text-amber-700 mb-3 flex items-center gap-2 text-sm lg:text-base">
                <Lightbulb className="w-4 h-4 lg:w-5 lg:h-5" />
                💡 Opportunities for Improvement
              </h4>
              {Array.isArray(missedOpportunities) ? (
                <div className="grid gap-2">
                  {missedOpportunities.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-2 lg:p-3 bg-amber-50 rounded-lg border border-amber-200"
                    >
                      <Lightbulb className="w-4 h-4 lg:w-5 lg:h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-800 text-sm lg:text-base">{item}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-2 lg:p-3 bg-white rounded-lg border border-amber-200">
                  <span className="text-gray-800 text-sm lg:text-base">
                    {missedOpportunities || 'No critical missed opportunities identified'}
                  </span>
                </div>
              )}
            </div>

            {/* Focus Area Section - Highlighted */}
            <div className="bg-white rounded-lg p-4 border border-blue-300 shadow-sm">
              <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2 text-sm lg:text-base">
                <Target className="w-4 h-4 lg:w-5 lg:h-5 text-blue-600" />
                🎯 Focus Area for Next Call
              </h4>
              <p className="text-gray-800 text-sm lg:text-base leading-relaxed">
                {capitalizeSentences(focusArea || 'Continue building on current strengths')}
              </p>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
