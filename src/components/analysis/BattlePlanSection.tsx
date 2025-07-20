
import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { 
  Copy,
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  ExternalLink,
  Target,
  Zap,
  ArrowRight,
  Eye,
  Shield,
  Building2,
  Lightbulb
} from 'lucide-react'

interface BattlePlanSectionProps {
  analysis: any // Keep same type for now
  dealHeat: any
  copyToClipboard: (text: string, type: string) => Promise<void>
  copyFullEmail: (subject: string, body: string, attachments: string[]) => Promise<void>
  openInEmailClient: (subject: string, body: string) => void
}

export function BattlePlanSection({ 
  analysis, 
  dealHeat,
  copyToClipboard,
  copyFullEmail,
  openInEmailClient
}: BattlePlanSectionProps) {
  return (
    <div className="bg-white rounded-xl p-4 lg:p-6 border-l-4 border-red-500 shadow-lg mb-6 lg:mb-8">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 lg:gap-4">
          <div className={`p-2 lg:p-3 rounded-lg ${
            dealHeat.level === 'HIGH' ? 'bg-red-100' : 
            dealHeat.level === 'MEDIUM' ? 'bg-orange-100' : 'bg-blue-100'
          }`}>
            <Zap className={`h-5 w-5 lg:h-6 lg:w-6 ${
              dealHeat.level === 'HIGH' ? 'text-red-600' : 
              dealHeat.level === 'MEDIUM' ? 'text-orange-600' : 'text-blue-600'
            }`} />
          </div>
          <div>
            <h3 className="text-lg lg:text-xl font-bold text-gray-900">Your Battle Plan</h3>
            <p className={`text-sm ${
              dealHeat.level === 'HIGH' ? 'text-red-600' : 
              dealHeat.level === 'MEDIUM' ? 'text-orange-600' : 'text-blue-600'
            }`}>Strategic execution based on conversation intelligence</p>
          </div>
        </div>
        {dealHeat.level === 'HIGH' && (
          <Badge className="bg-red-100 text-red-800 px-3 py-1 text-sm font-medium animate-pulse">
            🔥 HIGH PRIORITY
          </Badge>
        )}
        {dealHeat.level === 'MEDIUM' && (
          <Badge className="bg-orange-100 text-orange-800 px-3 py-1 text-sm font-medium">
            🌡️ MEDIUM PRIORITY
          </Badge>
        )}
        {dealHeat.level === 'LOW' && (
          <Badge className="bg-blue-100 text-blue-800 px-3 py-1 text-sm font-medium">
            ❄️ LOW PRIORITY
          </Badge>
        )}
      </div>

      {/* 🎯 STRATEGIC INTELLIGENCE & APPROACH - OPTIMIZED VERSION */}
      <div className="bg-gradient-to-r from-indigo-50 via-blue-50 to-purple-50 rounded-xl p-4 lg:p-5 border border-indigo-200 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-6 h-6 lg:w-8 lg:h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
            <Target className="w-3 h-3 lg:w-4 lg:h-4 text-white" />
          </div>
          <h3 className="text-base lg:text-lg font-semibold text-indigo-900">Strategic Intelligence & Approach</h3>
          <Badge variant="outline" className="text-xs border-indigo-300 text-indigo-700">Strategic Context</Badge>
        </div>
        
        <div className="space-y-4">
          
          {/* Discovery Highlights - OPTIMIZED: Removed Key Players, Tighter Layout */}
          <div className="bg-white rounded-xl p-4 border border-indigo-100 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Eye className="w-4 h-4 text-indigo-600" />
              </div>
              <h4 className="font-bold text-indigo-900 text-base">What They Revealed</h4>
              <div className="h-px flex-1 bg-gradient-to-r from-indigo-200 to-transparent"></div>
            </div>
            
            {/* OPTIMIZED: 2x3 Grid Layout for Better Space Usage */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              
              {/* Critical Pain Points - Enhanced */}
              {analysis.call_summary?.painSeverity?.indicators && analysis.call_summary.painSeverity.indicators.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="font-bold text-red-800 text-sm uppercase tracking-wide">Critical Pain</span>
                  </div>
                  <div className="space-y-2">
                    {analysis.call_summary.painSeverity.indicators.slice(0, 2).map((pain: string, index: number) => (
                      <div key={index} className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-3 border border-red-100">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                          <p className="text-gray-800 text-sm leading-relaxed font-medium">{pain}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Decision Criteria - Enhanced */}
              {analysis.call_summary?.competitiveIntelligence?.decisionCriteria && analysis.call_summary.competitiveIntelligence.decisionCriteria.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="font-bold text-blue-800 text-sm uppercase tracking-wide">Decision Criteria</span>
                  </div>
                  <div className="space-y-2">
                    {analysis.call_summary.competitiveIntelligence.decisionCriteria.slice(0, 2).map((criteria: string, index: number) => (
                      <div key={index} className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-3 border border-blue-100">
                        <div className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                          <p className="text-gray-800 text-sm leading-relaxed font-medium">{criteria}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Timeline Pressure - Enhanced */}
              {analysis.call_summary?.timelineAnalysis?.statedTimeline && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span className="font-bold text-orange-800 text-sm uppercase tracking-wide">Timeline Driver</span>
                  </div>
                  <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-3 border border-orange-100">
                    <div className="flex items-start gap-2">
                      <Clock className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                      {analysis.call_summary.timelineAnalysis.statedTimeline.length > 80 ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <p className="text-gray-800 text-sm leading-relaxed font-medium cursor-help">
                              {analysis.call_summary.timelineAnalysis.statedTimeline.substring(0, 80) + '...'}
                            </p>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-md p-3">
                            <p className="text-sm leading-relaxed">
                              {analysis.call_summary.timelineAnalysis.statedTimeline}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <p className="text-gray-800 text-sm leading-relaxed font-medium">
                          {analysis.call_summary.timelineAnalysis.statedTimeline}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Buying Signals - Enhanced */}
              {analysis.call_summary?.buyingSignalsAnalysis?.commitmentSignals && analysis.call_summary.buyingSignalsAnalysis.commitmentSignals.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="font-bold text-green-800 text-sm uppercase tracking-wide">Strong Signals</span>
                  </div>
                  <div className="space-y-2">
                    {analysis.call_summary.buyingSignalsAnalysis.commitmentSignals.slice(0, 2).map((signal: string, index: number) => (
                      <div key={index} className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 border border-green-100">
                        <div className="flex items-start gap-2">
                          <TrendingUp className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                          <p className="text-gray-800 text-sm leading-relaxed font-medium">{signal}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Competitive Landscape - Enhanced */}
              {analysis.call_summary?.competitiveIntelligence?.vendorsKnown && analysis.call_summary.competitiveIntelligence.vendorsKnown.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="font-bold text-purple-800 text-sm uppercase tracking-wide">Competitive Landscape</span>
                  </div>
                  <div className="space-y-2">
                    {analysis.call_summary.competitiveIntelligence.vendorsKnown.slice(0, 2).map((vendor: string, index: number) => (
                      <div key={index} className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg p-3 border border-purple-100">
                        <div className="flex items-start gap-2">
                          <Building2 className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                          <p className="text-gray-800 text-sm leading-relaxed font-medium">{vendor}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Bottom accent line */}
            <div className="mt-4 h-px bg-gradient-to-r from-transparent via-indigo-200 to-transparent"></div>
          </div>

          {/* Strategic Assessment - OPTIMIZED: More Compact Layout */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2 text-sm lg:text-base">
              <Shield className="w-4 h-4" />
              Strategic Assessment
            </h4>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              {/* Primary Strategy Rationale */}
              {analysis.recommendations?.primaryStrategy && (
                <div className="bg-white rounded-lg p-3 border border-blue-100">
                  <span className="font-medium text-blue-700 text-sm">Recommended Approach:</span>
                  <p className="text-gray-700 text-sm mt-1 leading-relaxed">
                    {analysis.recommendations.primaryStrategy}
                  </p>
                </div>
              )}
              
              {/* Competitive Positioning Logic */}
              {analysis.recommendations?.competitiveStrategy && (
                <div className="bg-white rounded-lg p-3 border border-blue-100">
                  <span className="font-medium text-purple-700 text-sm">Competitive Edge:</span>
                  <p className="text-gray-700 text-sm mt-1 leading-relaxed">
                    {analysis.recommendations.competitiveStrategy}
                  </p>
                </div>
              )}
              
              {/* Stakeholder Navigation Strategy */}
              {analysis.recommendations?.stakeholderPlan && (
                <div className="bg-white rounded-lg p-3 border border-blue-100">
                  <span className="font-medium text-green-700 text-sm">Stakeholder Strategy:</span>
                  <p className="text-gray-700 text-sm mt-1 leading-relaxed">
                    {analysis.recommendations.stakeholderPlan}
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* 🎯 WHY THESE SPECIFIC ACTIONS - Standalone Bridge Section */}
      <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200 mt-6 mb-6">
        <h4 className="font-semibold text-emerald-800 mb-3 flex items-center gap-2 text-sm lg:text-base">
          <ArrowRight className="w-4 h-4" />
          Why These Specific Actions
        </h4>
        
        <div className="bg-white rounded-lg p-3 border border-emerald-100">
          <p className="text-gray-700 text-sm leading-relaxed">
            {analysis.reasoning?.whyTheseRecommendations || 
             `Based on the stakeholder dynamics and pain points revealed, these actions are designed to ${
               analysis.call_summary?.painSeverity?.level === 'high' ? 'address urgent business needs while' : 
               analysis.call_summary?.painSeverity?.level === 'medium' ? 'solve operational challenges while' : 'position for future value while'
             } positioning against competitive alternatives through ${
               analysis.call_summary?.competitiveIntelligence?.decisionCriteria?.length > 0 ? 'their stated decision criteria' : 'strategic differentiation'
             }.`
            }
          </p>
          
          {/* Key Strategic Signals - OPTIMIZED */}
          {analysis.reasoning?.clientSignalsObserved && analysis.reasoning.clientSignalsObserved.length > 0 && (
            <div className="mt-3 pt-3 border-t border-emerald-100">
              <span className="font-medium text-emerald-700 text-xs uppercase tracking-wider">Supporting Evidence:</span>
              <div className="mt-2 grid grid-cols-1 lg:grid-cols-2 gap-1">
                {analysis.reasoning.clientSignalsObserved.slice(0, 2).map((signal: string, index: number) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                    <span className="text-gray-600 text-xs italic">"{signal}"</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* EXECUTION TIMELINE FROM ACTION PLAN - PRESERVE EXACTLY */}
      {analysis.action_plan?.actions && analysis.action_plan.actions.length > 0 ? (
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-red-300 to-red-100"></div>
          
          <div className="space-y-6">
            {analysis.action_plan.actions.map((action: any, index: number) => {
              // Priority detection based on timeline text
              const getPriorityColor = (timeline: string) => {
                if (timeline.toLowerCase().includes('24 hours') || timeline.toLowerCase().includes('immediate')) return 'bg-red-500'
                if (timeline.toLowerCase().includes('this week') || timeline.toLowerCase().includes('3 days')) return 'bg-orange-500'
                return 'bg-blue-500'
              }
              
              const getPriorityBadge = (timeline: string) => {
                if (timeline.toLowerCase().includes('24 hours') || timeline.toLowerCase().includes('immediate')) return 'bg-red-100 text-red-800'
                if (timeline.toLowerCase().includes('this week') || timeline.toLowerCase().includes('3 days')) return 'bg-orange-100 text-orange-800'
                return 'bg-blue-100 text-blue-800'
              }

              const isUrgent = (dealHeat.level !== 'LOW') && (action.timeline.toLowerCase().includes('24 hours') || action.timeline.toLowerCase().includes('immediate'))

              return (
                <div key={index} className="relative">
                  {/* Timeline Node */}
                  <div className={`absolute left-6 w-4 h-4 rounded-full border-2 border-white ${getPriorityColor(action.timeline)} z-10`}>
                    <div className="absolute inset-1 bg-white rounded-full"></div>
                  </div>
                  
                  {/* Action Card */}
                  <div className="ml-16 bg-red-50 rounded-lg border border-red-200 shadow-sm">
                    {/* Action Header */}
                    <div className="p-4 border-b border-red-100">
                      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
                        <div className="flex items-start gap-3 lg:gap-4 flex-1">
                          <div className="p-2 rounded-lg bg-blue-100">
                            <Mail className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 text-base mb-1">{action.action}</h4>
                            <p className="text-sm text-gray-600 leading-relaxed">{action.objective}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge className={`${getPriorityBadge(action.timeline)} text-xs font-medium`}>
                            <Clock className="w-3 h-3 mr-1" />
                            {action.timeline}
                          </Badge>
                          {isUrgent && (
                            <Badge className="bg-red-100 text-red-800 text-xs animate-pulse">
                              URGENT
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Email Template Section - Conditional */}
                    {action.copyPasteContent && action.copyPasteContent.subject && action.copyPasteContent.body ? (
                      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="font-medium text-gray-800 text-sm flex items-center gap-2">
                            <Mail className="w-4 h-4 text-blue-600" />
                            Email Template Ready
                          </h5>
                          
                          {/* Main Action Buttons */}
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs border-blue-300 text-blue-700 hover:bg-blue-100"
                              onClick={() => copyFullEmail(action.copyPasteContent.subject, action.copyPasteContent.body, [])}
                            >
                              <Copy className="w-3 h-3 mr-1" />
                              Copy All
                            </Button>
                            <Button
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700 text-xs"
                              onClick={() => openInEmailClient(action.copyPasteContent.subject, action.copyPasteContent.body)}
                            >
                              <ExternalLink className="w-3 h-3 mr-1" />
                              Send Email
                            </Button>
                          </div>
                        </div>

                        {/* Subject Line */}
                        <div className="mb-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-blue-800 uppercase tracking-wider">Subject Line</span>
                          </div>
                          <div className="bg-white p-3 rounded border border-blue-200 text-sm font-mono">
                            {action.copyPasteContent.subject}
                          </div>
                        </div>

                        {/* Email Body */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-blue-800 uppercase tracking-wider">Email Content</span>
                          </div>
                          <div className="bg-white p-3 rounded border border-blue-200 text-sm font-mono whitespace-pre-wrap max-h-32 overflow-y-auto">
                            {action.copyPasteContent.body}
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Action Details Section for Non-Email Actions */
                      <div className="p-4 bg-gradient-to-r from-slate-50 to-gray-50">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="font-medium text-gray-800 text-sm flex items-center gap-2">
                            {action.method === 'phone' ? (
                              <Phone className="w-4 h-4 text-slate-600" />
                            ) : action.method === 'meeting' ? (
                              <Calendar className="w-4 h-4 text-slate-600" />
                            ) : (
                              <MessageSquare className="w-4 h-4 text-slate-600" />
                            )}
                            Action Required
                          </h5>
                          
                          <Badge variant="outline" className="text-xs border-slate-300 text-slate-700">
                            {action.method === 'phone' ? 'Phone Call' : 
                             action.method === 'meeting' ? 'Meeting' : 
                             action.method || 'Direct Action'}
                          </Badge>
                        </div>

                        {/* Enhanced Objective Display */}
                        <div className="bg-white rounded-lg p-4 border border-slate-200">
                          <div className="mb-2">
                            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Action Details</span>
                          </div>
                          <p className="text-gray-700 text-sm leading-relaxed font-medium">
                            {action.objective}
                          </p>
                          
                          {/* Priority Indicator */}
                          <div className="mt-3 pt-3 border-t border-slate-100">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                              <span className="text-xs text-slate-600">
                                {action.priority === 'high' ? 'High Priority Action' : 
                                 action.priority === 'medium' ? 'Standard Priority' : 
                                 'Follow-up Action'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Connection Arrow to Next Step */}
                  {index < analysis.action_plan.actions.length - 1 && (
                    <div className="absolute left-8 -bottom-3 transform -translate-x-1/2 z-20">
                      <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center border border-red-200">
                        <ArrowRight className="w-3 h-3 text-red-600" />
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        /* Fallback when no action plan exists */
        <div className="bg-red-50 rounded-lg p-4 lg:p-5 border border-red-200">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-red-100">
              <Target className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-gray-900 text-base lg:text-lg mb-2">Execute Strategic Follow-up</h4>
              <p className="text-gray-700 text-sm lg:text-base leading-relaxed mb-4">
                {analysis.recommendations?.primaryStrategy || 
                 "Contact key stakeholders to advance the opportunity based on conversation insights"}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Button className="bg-red-600 hover:bg-red-700 flex-1">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Action Plan
                </Button>
                <Button variant="outline" className="flex-1">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Follow-up
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
