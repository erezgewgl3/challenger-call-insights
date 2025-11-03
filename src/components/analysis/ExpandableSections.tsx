
import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { 
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Activity,
  Eye,
  CheckCircle,
  AlertTriangle,
  Shield,
  Target,
  ExternalLink,
  Thermometer,
  Users
} from 'lucide-react'

interface ExpandableSectionsProps {
  analysis: any // Keep same type for now
  dealHeat: any
  sectionsOpen: {
    insights: boolean
    competitive: boolean
  }
  toggleSection: (section: 'insights' | 'competitive') => void
  conversationIntel: any
  competitiveIntelligence?: any
}

export function ExpandableSections({ 
  analysis, 
  dealHeat, 
  sectionsOpen, 
  toggleSection, 
  conversationIntel,
  competitiveIntelligence
}: ExpandableSectionsProps) {
  const isHighPriorityDeal = dealHeat.level === 'HIGH'

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* 💡 Deal Acceleration Insights - High Priority Deals Auto-Open */}
      {analysis.key_takeaways && analysis.key_takeaways.length > 0 && (
        <Card className={`pdf-section-boundary border-l-4 border-l-yellow-400 bg-gradient-to-r from-yellow-50 to-orange-50 transition-all ${
          sectionsOpen.insights ? 'shadow-lg' : 'hover:shadow-md'
        }`}>
          <Collapsible open={sectionsOpen.insights} onOpenChange={() => toggleSection('insights')}>
            <CollapsibleTrigger asChild>
              <CardHeader className="pb-2 cursor-pointer hover:bg-yellow-100/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Lightbulb className="w-5 h-5 lg:w-6 lg:h-6 text-yellow-600" />
                    <div>
                      <CardTitle className="text-base lg:text-lg flex items-center gap-2">
                        Deal Acceleration Insights ({analysis.key_takeaways.length})
                        {isHighPriorityDeal && (
                          <Badge variant="secondary" className="bg-red-100 text-red-800 text-xs">
                            AUTO-OPEN
                          </Badge>
                        )}
                      </CardTitle>
                      <p className="text-sm text-yellow-700 font-normal">What they revealed about decision criteria and competitive positioning</p>
                    </div>
                  </div>
                  {sectionsOpen.insights ? 
                    <ChevronUp className="w-5 h-5 text-yellow-600" /> : 
                    <ChevronDown className="w-5 h-5 text-yellow-600" />
                  }
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                <div className="space-y-3">
                  {analysis.key_takeaways.map((takeaway, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 lg:p-4 bg-white rounded-lg border border-yellow-200">
                      <div className="w-6 h-6 bg-yellow-500 text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                        {index + 1}
                      </div>
                      <p className="text-gray-800 text-sm lg:text-base leading-relaxed">{takeaway}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}

      {/* 👁️ Competitive Positioning Arsenal - Progressive Disclosure */}
      <Card className={`pdf-section-boundary border-l-4 border-l-green-400 bg-gradient-to-r from-green-50 to-emerald-50 transition-all ${
        sectionsOpen.competitive ? 'shadow-lg' : 'hover:shadow-md'
      }`}>
        <Collapsible open={sectionsOpen.competitive} onOpenChange={() => toggleSection('competitive')}>
          <CollapsibleTrigger asChild>
            <CardHeader className="pb-2 cursor-pointer hover:bg-green-100/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Eye className="w-5 h-5 lg:w-6 lg:h-6 text-green-600" />
                  <div>
                    <CardTitle className="text-base lg:text-lg flex items-center gap-2">
                      Competitive Positioning Arsenal
                      <Badge variant="outline" className="text-xs border-green-300 text-green-700">
                        DETAILED
                      </Badge>
                    </CardTitle>
                    <p className="text-sm text-green-700 font-normal">What they revealed about evaluation process and decision criteria</p>
                  </div>
                </div>
                {sectionsOpen.competitive ? 
                  <ChevronUp className="w-5 h-5 text-green-600" /> : 
                  <ChevronDown className="w-5 h-5 text-green-600" />
                }
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4 lg:space-y-6">
              
              {/* 🎯 COMPETITIVE LANDSCAPE - Structured Intelligence */}
              {competitiveIntelligence && (competitiveIntelligence.vendorsKnown?.length > 0 || competitiveIntelligence.competitiveAdvantage) && (
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2 text-sm lg:text-base">
                    <Target className="w-4 h-4 lg:w-5 lg:h-5" />
                    Competitive Landscape
                    {competitiveIntelligence.evaluationStage && (
                      <Badge variant="outline" className="text-xs border-blue-300 text-blue-700 ml-2">
                        {competitiveIntelligence.evaluationStage.toUpperCase()}
                      </Badge>
                    )}
                  </h4>
                  
                  <div className="space-y-3">
                    {/* Known Competitors */}
                    {competitiveIntelligence.vendorsKnown?.length > 0 && (
                      <div className="bg-white rounded-lg p-3 border border-blue-100">
                        <p className="text-sm font-medium text-blue-900 mb-2 flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Known Competitors ({competitiveIntelligence.vendorsKnown.length})
                        </p>
                        <ul className="space-y-1 ml-6">
                          {competitiveIntelligence.vendorsKnown.map((vendor: string, idx: number) => (
                            <li key={idx} className="text-sm text-gray-700 list-disc">{vendor}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Decision Criteria */}
                    {competitiveIntelligence.decisionCriteria?.length > 0 && (
                      <div className="bg-white rounded-lg p-3 border border-blue-100">
                        <p className="text-sm font-medium text-blue-900 mb-2">
                          Decision Criteria:
                        </p>
                        <p className="text-sm text-gray-700">
                          {Array.isArray(competitiveIntelligence.decisionCriteria) 
                            ? competitiveIntelligence.decisionCriteria.join(', ')
                            : competitiveIntelligence.decisionCriteria}
                        </p>
                      </div>
                    )}
                    
                    {/* Our Competitive Advantage */}
                    {competitiveIntelligence.competitiveAdvantage && (
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 border border-green-200">
                        <p className="text-sm font-medium text-green-900 mb-2 flex items-center gap-2">
                          💪 Our Competitive Advantage
                        </p>
                        <p className="text-sm text-gray-800 leading-relaxed">
                          {competitiveIntelligence.competitiveAdvantage}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {conversationIntel.positive.length > 0 && (
                <div>
                  <h4 className="font-semibold text-green-700 mb-3 flex items-center gap-2 text-sm lg:text-base">
                    <Activity className="w-4 h-4 lg:w-5 lg:h-5" />
                    Buying Signals ({conversationIntel.positive.length})
                  </h4>
                  <div className="grid gap-2">
                    {conversationIntel.positive.map((signal: string, index: number) => (
                      <div key={index} className="flex items-center gap-3 p-2 lg:p-3 bg-white rounded-lg border border-green-200">
                        <CheckCircle className="w-4 h-4 lg:w-5 lg:h-5 text-green-500 flex-shrink-0" />
                        <span className="text-gray-800 text-sm lg:text-base">{signal}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {conversationIntel.pain.length > 0 && (
                <div>
                  <h4 className="font-semibold text-red-700 mb-3 flex items-center gap-2 text-sm lg:text-base">
                    <Thermometer className="w-4 h-4 lg:w-5 lg:h-5" />
                    Pain Indicators ({conversationIntel.pain.length})
                  </h4>
                  <div className="grid gap-2">
                    {conversationIntel.pain.map((pain: string, index: number) => (
                      <div key={index} className="flex items-center gap-3 p-2 lg:p-3 bg-red-50 rounded-lg border border-red-200">
                        <AlertTriangle className="w-4 h-4 lg:w-5 lg:h-5 text-red-500 flex-shrink-0" />
                        <span className="text-gray-800 text-sm lg:text-base">{pain}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {conversationIntel.concerns.length > 0 && (
                <div>
                  <h4 className="font-semibold text-orange-700 mb-3 flex items-center gap-2 text-sm lg:text-base">
                    <Shield className="w-4 h-4 lg:w-5 lg:h-5" />
                    Concerns to Address ({conversationIntel.concerns.length})
                  </h4>
                  <div className="grid gap-2">
                    {conversationIntel.concerns.map((concern: string, index: number) => (
                      <div key={index} className="flex items-center gap-3 p-2 lg:p-3 bg-orange-50 rounded-lg border border-orange-200">
                        <AlertTriangle className="w-4 h-4 lg:w-5 lg:h-5 text-orange-500 flex-shrink-0" />
                        <span className="text-gray-800 text-sm lg:text-base">{concern}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {conversationIntel.competitive.length > 0 && (
                <div>
                  <h4 className="font-semibold text-purple-700 mb-3 flex items-center gap-2 text-sm lg:text-base">
                    <Target className="w-4 h-4 lg:w-5 lg:h-5" />
                    Competitive Intelligence ({conversationIntel.competitive.length})
                  </h4>
                  <div className="grid gap-2">
                    {conversationIntel.competitive.map((comp: string, index: number) => (
                      <div key={index} className="flex items-center gap-3 p-2 lg:p-3 bg-purple-50 rounded-lg border border-purple-200">
                        <ExternalLink className="w-4 h-4 lg:w-5 lg:h-5 text-purple-500 flex-shrink-0" />
                        <span className="text-gray-800 text-sm lg:text-base">{comp}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {conversationIntel.positive.length === 0 && 
               conversationIntel.concerns.length === 0 && 
               conversationIntel.competitive.length === 0 && 
               conversationIntel.pain.length === 0 && (
                <div className="text-center py-6 lg:py-8">
                  <Eye className="w-10 h-10 lg:w-12 lg:h-12 text-gray-300 mx-auto mb-4" />
                  <h4 className="font-medium text-gray-600 mb-2 text-sm lg:text-base">Rich Intelligence Processing</h4>
                  <p className="text-gray-500 text-sm lg:text-base leading-relaxed max-w-md mx-auto">
                    Your conversation is being analyzed for deeper insights including buying signals, 
                    competitive intelligence, pain analysis, and stakeholder mapping.
                  </p>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </div>
  )
}
