
import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ArrowLeft, ChevronDown, Target, Eye, Lightbulb, Zap, Users } from 'lucide-react'

interface TranscriptData {
  id: string
  title: string
  participants: string[]
  duration_minutes: number
  meeting_date: string
  account_id?: string
  raw_text?: string
}

interface AnalysisData {
  id: string
  key_takeaways?: string[]
  call_summary?: any
  recommendations?: any
  action_plan?: any
  participants?: any[]
}

export default function NewAnalysisView() {
  const { transcriptId } = useParams<{ transcriptId: string }>()
  const navigate = useNavigate()
  const [transcript, setTranscript] = useState<TranscriptData | null>(null)
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!transcriptId) return

    const fetchData = async () => {
      try {
        setIsLoading(true)
        
        // Fetch transcript details
        const { data: transcriptData, error: transcriptError } = await supabase
          .from('transcripts')
          .select('*')
          .eq('id', transcriptId)
          .single()

        if (transcriptError) throw transcriptError
        
        setTranscript({
          id: transcriptData.id,
          title: transcriptData.title,
          participants: Array.isArray(transcriptData.participants) ? transcriptData.participants as string[] : [],
          duration_minutes: transcriptData.duration_minutes || 0,
          meeting_date: transcriptData.meeting_date,
          account_id: transcriptData.account_id,
          raw_text: transcriptData.raw_text
        })

        // Fetch analysis data
        const { data: analysisData, error: analysisError } = await supabase
          .from('conversation_analysis')
          .select('*')
          .eq('transcript_id', transcriptId)
          .single()

        if (analysisError) throw analysisError
        
        setAnalysis(analysisData as any)

      } catch (err) {
        console.error('Failed to fetch data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load analysis')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [transcriptId])

  // Helper functions from previous stages
  const getDealHeat = () => {
    if (!analysis?.call_summary?.dealHeat) {
      return { level: 'MEDIUM', score: 50, factors: [] }
    }
    return analysis.call_summary.dealHeat
  }

  const getBuyingSignals = () => {
    if (!analysis?.call_summary?.buyingSignals) {
      return { strength: ['Moderate'], signals: [] }
    }
    return analysis.call_summary.buyingSignals
  }

  const getDealAssessment = () => {
    const dealHeat = getDealHeat()
    const buyingSignals = getBuyingSignals()
    const resistanceData = analysis?.call_summary?.resistanceAnalysis || {}
    const resistanceLevel = resistanceData.level || 'none'
    
    let probability = 'medium'
    let assessment = 'Qualified Opportunity'
    let strategy = 'Continue building value and addressing concerns'
    let urgency = 'Standard timeline'
    let bgColor = 'bg-yellow-50'
    let textColor = 'text-yellow-800'
    let borderColor = 'border-yellow-200'
    
    if (dealHeat.level === 'HIGH' && buyingSignals.strength.includes('Strong') && resistanceLevel !== 'high') {
      probability = 'high'
      assessment = 'High-Probability Deal'
      strategy = 'Accelerate to close - strike while conditions are optimal'
      urgency = 'Move quickly'
      bgColor = 'bg-green-50'
      textColor = 'text-green-800'
      borderColor = 'border-green-200'
    } else if (dealHeat.level === 'LOW' || resistanceLevel === 'high') {
      probability = 'low'
      assessment = 'Early Stage Opportunity'
      strategy = 'Focus on relationship building and value demonstration'
      urgency = 'Long-term nurture'
      bgColor = 'bg-blue-50'
      textColor = 'text-blue-800'
      borderColor = 'border-blue-200'
    }
    
    return {
      probability,
      assessment,
      strategy,
      urgency,
      bgColor,
      textColor,
      borderColor
    }
  }

  // Stage 4: Visual Priority Functions
  const getSectionPriority = () => {
    const dealHeat = getDealHeat()
    const buyingSignals = getBuyingSignals()
    
    // Extract resistance data for priority assessment
    const resistanceData = analysis?.call_summary?.resistanceAnalysis || {}
    const resistanceLevel = resistanceData.level || 'none'
    
    // Determine overall deal probability for priority guidance
    let dealProbability = 'medium'
    if (dealHeat.level === 'HIGH' && buyingSignals.strength.includes('Strong') && resistanceLevel !== 'high') {
      dealProbability = 'high'
    } else if (dealHeat.level === 'LOW' || resistanceLevel === 'high') {
      dealProbability = 'low'
    }
    
    // Define section priorities based on deal assessment
    const sectionConfig = {
      insights: {
        priority: dealProbability === 'high' ? 1 : dealProbability === 'medium' ? 1 : 2,
        defaultOpen: dealProbability !== 'low',
        importance: dealProbability === 'high' ? 'critical' : 'standard',
        badge: dealProbability === 'high' ? 'KEY INSIGHTS' : null
      },
      battleplan: {
        priority: dealProbability === 'high' ? 2 : dealProbability === 'medium' ? 2 : 4,
        defaultOpen: dealProbability === 'high',
        importance: dealProbability === 'high' ? 'critical' : dealProbability === 'medium' ? 'important' : 'standard',
        badge: dealProbability === 'high' ? 'EXECUTE NOW' : dealProbability === 'medium' ? 'QUALIFY FIRST' : null
      },
      competitive: {
        priority: 3,
        defaultOpen: dealProbability === 'high',
        importance: 'standard',
        badge: null
      },
      templates: {
        priority: dealProbability === 'high' ? 4 : 5,
        defaultOpen: false, // Templates already prominent above
        importance: 'standard',
        badge: 'REFERENCE'
      }
    }
    
    return {
      dealProbability,
      sectionConfig
    }
  }

  const getSectionStyling = (sectionId: string) => {
    const { sectionConfig } = getSectionPriority()
    const config = sectionConfig[sectionId as keyof typeof sectionConfig]
    
    if (!config) return {}
    
    const styleMap = {
      critical: {
        containerClass: 'shadow-lg ring-2 ring-red-200 bg-gradient-to-r from-red-50 to-pink-50',
        headerClass: 'bg-red-100/70',
        badgeClass: 'bg-red-500 text-white',
        iconColor: 'text-red-600',
        borderClass: 'border-l-4 border-l-red-500'
      },
      important: {
        containerClass: 'shadow-md ring-1 ring-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50',
        headerClass: 'bg-yellow-100/50',
        badgeClass: 'bg-yellow-500 text-white',
        iconColor: 'text-yellow-600',
        borderClass: 'border-l-4 border-l-yellow-400'
      },
      standard: {
        containerClass: 'shadow-sm hover:shadow-md transition-all',
        headerClass: 'hover:bg-gray-50',
        badgeClass: 'bg-gray-500 text-white',
        iconColor: 'text-gray-600',
        borderClass: 'border-l-4 border-l-gray-300'
      }
    }
    
    return {
      ...styleMap[config.importance as keyof typeof styleMap],
      defaultOpen: config.defaultOpen,
      badge: config.badge,
      priority: config.priority
    }
  }

  const getConversationIntelligence = () => {
    const callSummary = analysis?.call_summary || {}
    
    return {
      positive: callSummary.positiveSignals || [],
      concerns: callSummary.concerns || [],
      competitive: callSummary.competitiveIntel || [],
      pain: callSummary.painPoints || []
    }
  }

  const hasStakeholderData = () => {
    const participants = analysis?.participants || []
    const hasAnyStakeholders = participants.length > 0
    
    return {
      hasAnyStakeholders,
      participants: participants.map((p: any) => ({
        name: p.name || 'Unknown',
        role: p.role || 'Participant',
        influence: p.influence || 'Unknown',
        stance: p.stance || 'Neutral'
      }))
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <LoadingSpinner />
          <p className="text-slate-600">Loading sales intelligence...</p>
        </div>
      </div>
    )
  }

  if (error || !transcript || !analysis) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Intelligence Not Available</CardTitle>
            <CardDescription>
              The sales intelligence could not be loaded.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/dashboard')} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Navigation */}
        <Button 
          variant="ghost" 
          onClick={() => navigate('/dashboard')}
          className="mb-6 text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        {/* STAGE 1: HERO SECTION */}
        <div className="text-center mb-8">
          <div className="space-y-2 mb-6">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Sales Intelligence Report
            </h1>
            <h2 className="text-2xl font-semibold text-slate-800">{transcript.title}</h2>
            <p className="text-slate-600">
              {transcript.participants.join(', ')} • {transcript.duration_minutes} min • {new Date(transcript.meeting_date).toLocaleDateString()}
            </p>
          </div>

          {/* Deal Assessment Banner */}
          {(() => {
            const assessment = getDealAssessment()
            return (
              <div className={`${assessment.bgColor} border ${assessment.borderColor} rounded-xl p-6 max-w-4xl mx-auto mb-8`}>
                <div className="text-center space-y-3">
                  <div className="flex items-center justify-center gap-2">
                    <Target className="w-6 h-6 text-gray-800" />
                    <h3 className="text-xl font-bold text-gray-800">{assessment.assessment}</h3>
                  </div>
                  <p className="text-lg text-gray-700 font-medium">{assessment.strategy}</p>
                  <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
                    <span>Priority: {assessment.urgency}</span>
                    <span>•</span>
                    <span>Assessment: {assessment.probability.charAt(0).toUpperCase() + assessment.probability.slice(1)} probability</span>
                  </div>
                </div>
              </div>
            )
          })()}
        </div>

        {/* STAGE 2: READY-TO-USE TEMPLATES SECTION */}
        {analysis.action_plan?.actions && analysis.action_plan.actions.length > 0 && (
          <div className="mb-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Ready-to-Execute Templates</h2>
              <p className="text-slate-600">Copy, customize, and send immediately</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {analysis.action_plan.actions.slice(0, 4).map((action: any, index: number) => (
                <Card key={index} className="bg-white shadow-lg hover:shadow-xl transition-all border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg text-blue-900">{action.title || `Action ${index + 1}`}</CardTitle>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        {action.type || 'Email'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {action.subject && (
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">Subject Line:</h4>
                        <div className="bg-gray-50 p-3 rounded-lg border">
                          <p className="text-sm">{action.subject}</p>
                        </div>
                      </div>
                    )}
                    {action.content && (
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">Message:</h4>
                        <div className="bg-gray-50 p-3 rounded-lg border max-h-32 overflow-y-auto">
                          <p className="text-sm whitespace-pre-wrap">{action.content}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs text-gray-500">
                        {action.timing || 'Send immediately'}
                      </span>
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                        Copy Template
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* STAGE 3: STAKEHOLDER MATRIX */}
        {(() => {
          const stakeholderData = hasStakeholderData()
          if (!stakeholderData.hasAnyStakeholders) return null

          return (
            <div className="mb-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Stakeholder Power Map</h2>
                <p className="text-slate-600">Who influences the decision and how to engage them</p>
              </div>

              <Card className="bg-white shadow-lg">
                <CardContent className="p-6">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {stakeholderData.participants.map((participant, index) => (
                      <div key={index} className="p-4 bg-gray-50 rounded-lg border">
                        <div className="space-y-2">
                          <h4 className="font-semibold text-gray-900">{participant.name}</h4>
                          <p className="text-sm text-gray-600">{participant.role}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-500">Influence:</span>
                            <Badge variant="outline" className="text-xs">
                              {participant.influence}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-500">Stance:</span>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${
                                participant.stance === 'Supporter' ? 'bg-green-50 text-green-700' :
                                participant.stance === 'Neutral' ? 'bg-yellow-50 text-yellow-700' :
                                'bg-red-50 text-red-700'
                              }`}
                            >
                              {participant.stance}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )
        })()}

        {/* STAGE 4: PRIORITY GUIDANCE BANNER */}
        {(() => {
          const { dealProbability } = getSectionPriority()
          
          const guidanceConfig = {
            high: {
              icon: '🎯',
              title: 'High-Priority Analysis',
              message: 'Focus on execution planning and competitive positioning',
              bgColor: 'bg-green-50',
              borderColor: 'border-green-200',
              textColor: 'text-green-700'
            },
            medium: {
              icon: '⚡',
              title: 'Qualification-Focused Review',
              message: 'Prioritize insights and strategic planning sections',
              bgColor: 'bg-yellow-50',
              borderColor: 'border-yellow-200', 
              textColor: 'text-yellow-700'
            },
            low: {
              icon: '📋',
              title: 'Intelligence Gathering Mode',
              message: 'Review insights for future opportunity development',
              bgColor: 'bg-blue-50',
              borderColor: 'border-blue-200',
              textColor: 'text-blue-700'
            }
          }
          
          const config = guidanceConfig[dealProbability as keyof typeof guidanceConfig]
          
          return (
            <div className={`${config.bgColor} border ${config.borderColor} rounded-lg p-4 mb-6`}>
              <div className="flex items-center gap-3">
                <span className="text-xl">{config.icon}</span>
                <div>
                  <h4 className={`font-semibold ${config.textColor}`}>{config.title}</h4>
                  <p className={`text-sm ${config.textColor}`}>{config.message}</p>
                </div>
              </div>
            </div>
          )
        })()}

        {/* ENHANCED EXPANDABLE SECTIONS WITH VISUAL PRIORITY */}
        <div className="space-y-4">
          
          {/* Deal Acceleration Insights - Enhanced with priority styling */}
          {analysis.key_takeaways && analysis.key_takeaways.length > 0 && (
            <Card className={`${getSectionStyling('insights').containerClass} ${getSectionStyling('insights').borderClass} transition-all`}>
              <Collapsible defaultOpen={getSectionStyling('insights').defaultOpen}>
                <CollapsibleTrigger asChild>
                  <CardHeader className={`pb-2 cursor-pointer ${getSectionStyling('insights').headerClass} transition-colors rounded-t-lg`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Lightbulb className={`w-6 h-6 ${getSectionStyling('insights').iconColor}`} />
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            Deal Acceleration Insights ({analysis.key_takeaways.length})
                            {getSectionStyling('insights').badge && (
                              <Badge className={`text-xs ${getSectionStyling('insights').badgeClass}`}>
                                {getSectionStyling('insights').badge}
                              </Badge>
                            )}
                          </CardTitle>
                          <p className="text-sm text-yellow-700 font-normal">What they revealed about decision criteria and competitive positioning</p>
                        </div>
                      </div>
                      <ChevronDown className={`w-5 h-5 ${getSectionStyling('insights').iconColor}`} />
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent>
                    <div className="space-y-3">
                      {analysis.key_takeaways.map((takeaway, index) => (
                        <div key={index} className="flex items-start gap-3 p-4 bg-white rounded-lg border border-yellow-200">
                          <div className="w-6 h-6 bg-yellow-500 text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                            {index + 1}
                          </div>
                          <p className="text-gray-800 leading-relaxed">{takeaway}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          )}

          {/* Complete Battle Plan - Enhanced with priority styling */}
          {analysis.recommendations && (
            <Card className={`${getSectionStyling('battleplan').containerClass} ${getSectionStyling('battleplan').borderClass} transition-all`}>
              <Collapsible defaultOpen={getSectionStyling('battleplan').defaultOpen}>
                <CollapsibleTrigger asChild>
                  <CardHeader className={`pb-2 cursor-pointer ${getSectionStyling('battleplan').headerClass} transition-colors rounded-t-lg`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Target className={`w-6 h-6 ${getSectionStyling('battleplan').iconColor}`} />
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            Complete Battle Plan
                            {getSectionStyling('battleplan').badge && (
                              <Badge className={`text-xs ${getSectionStyling('battleplan').badgeClass}`}>
                                {getSectionStyling('battleplan').badge}
                              </Badge>
                            )}
                          </CardTitle>
                          <p className="text-sm text-blue-700 font-normal">How to position against competitors based on their specific needs</p>
                        </div>
                      </div>
                      <ChevronDown className={`w-5 h-5 ${getSectionStyling('battleplan').iconColor}`} />
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-6">
                    {analysis.recommendations.primaryStrategy && (
                      <div className="p-4 bg-white rounded-lg border border-blue-200">
                        <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                          <Target className="w-4 h-4" />
                          Primary Strategy
                        </h4>
                        <p className="text-gray-800 leading-relaxed">{analysis.recommendations.primaryStrategy}</p>
                      </div>
                    )}
                    {analysis.recommendations.competitiveStrategy && (
                      <div className="p-4 bg-white rounded-lg border border-blue-200">
                        <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                          <Eye className="w-4 h-4" />
                          Competitive Positioning
                        </h4>
                        <p className="text-gray-800 leading-relaxed">{analysis.recommendations.competitiveStrategy}</p>
                      </div>
                    )}
                    {analysis.recommendations.stakeholderPlan && (
                      <div className="p-4 bg-white rounded-lg border border-blue-200">
                        <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Stakeholder Plan
                        </h4>
                        <p className="text-gray-800 leading-relaxed">{analysis.recommendations.stakeholderPlan}</p>
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          )}

          {/* Competitive Positioning Arsenal - Enhanced with priority styling */}
          <Card className={`${getSectionStyling('competitive').containerClass} ${getSectionStyling('competitive').borderClass} transition-all`}>
            <Collapsible defaultOpen={getSectionStyling('competitive').defaultOpen}>
              <CollapsibleTrigger asChild>
                <CardHeader className={`pb-2 cursor-pointer ${getSectionStyling('competitive').headerClass} transition-colors rounded-t-lg`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Eye className={`w-6 h-6 ${getSectionStyling('competitive').iconColor}`} />
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          Competitive Positioning Arsenal
                          {getSectionStyling('competitive').badge && (
                            <Badge className={`text-xs ${getSectionStyling('competitive').badgeClass}`}>
                              {getSectionStyling('competitive').badge}
                            </Badge>
                          )}
                        </CardTitle>
                        <p className="text-sm text-green-700 font-normal">What they revealed about evaluation process and decision criteria</p>
                      </div>
                    </div>
                    <ChevronDown className={`w-5 h-5 ${getSectionStyling('competitive').iconColor}`} />
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-6">
                  {(() => {
                    const intel = getConversationIntelligence()
                    return (
                      <>
                        {intel.positive.length > 0 && (
                          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                            <h4 className="font-semibold text-green-900 mb-3">🎯 Positive Signals</h4>
                            <ul className="space-y-2">
                              {intel.positive.map((signal, index) => (
                                <li key={index} className="text-green-800 text-sm flex items-start gap-2">
                                  <span className="text-green-600 mt-1">•</span>
                                  {signal}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {intel.concerns.length > 0 && (
                          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                            <h4 className="font-semibold text-yellow-900 mb-3">⚠️ Concerns to Address</h4>
                            <ul className="space-y-2">
                              {intel.concerns.map((concern, index) => (
                                <li key={index} className="text-yellow-800 text-sm flex items-start gap-2">
                                  <span className="text-yellow-600 mt-1">•</span>
                                  {concern}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {intel.competitive.length > 0 && (
                          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <h4 className="font-semibold text-blue-900 mb-3">🛡️ Competitive Intelligence</h4>
                            <ul className="space-y-2">
                              {intel.competitive.map((item, index) => (
                                <li key={index} className="text-blue-800 text-sm flex items-start gap-2">
                                  <span className="text-blue-600 mt-1">•</span>
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {intel.pain.length > 0 && (
                          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                            <h4 className="font-semibold text-red-900 mb-3">💥 Pain Points</h4>
                            <ul className="space-y-2">
                              {intel.pain.map((pain, index) => (
                                <li key={index} className="text-red-800 text-sm flex items-start gap-2">
                                  <span className="text-red-600 mt-1">•</span>
                                  {pain}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </>
                    )
                  })()}
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>

          {/* Ready-to-Execute Playbook (detailed version) - Enhanced with priority styling */}
          {analysis.action_plan?.actions && analysis.action_plan.actions.length > 0 && (
            <Card className={`${getSectionStyling('templates').containerClass} ${getSectionStyling('templates').borderClass} transition-all`}>
              <Collapsible defaultOpen={getSectionStyling('templates').defaultOpen}>
                <CollapsibleTrigger asChild>
                  <CardHeader className={`pb-2 cursor-pointer ${getSectionStyling('templates').headerClass} transition-colors rounded-t-lg`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Zap className={`w-6 h-6 ${getSectionStyling('templates').iconColor}`} />
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            Detailed Execution Context
                            {getSectionStyling('templates').badge && (
                              <Badge className={`text-xs ${getSectionStyling('templates').badgeClass}`}>
                                {getSectionStyling('templates').badge}
                              </Badge>
                            )}
                          </CardTitle>
                          <p className="text-sm text-purple-700 font-normal">Additional context and supporting materials for template execution</p>
                        </div>
                      </div>
                      <ChevronDown className={`w-5 h-5 ${getSectionStyling('templates').iconColor}`} />
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent>
                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200 mb-4">
                      <p className="text-purple-700 text-sm">
                        ℹ️ Ready-to-use templates are displayed above for immediate access. 
                        This section provides additional context, timing considerations, and supporting materials.
                      </p>
                    </div>
                    <div className="space-y-4">
                      {analysis.action_plan.actions.map((action: any, index: number) => (
                        <div key={index} className="p-4 bg-white rounded-lg border border-purple-200">
                          <h4 className="font-semibold text-purple-900 mb-2">{action.title || `Action ${index + 1}`}</h4>
                          {action.context && (
                            <p className="text-sm text-gray-700 mb-2">{action.context}</p>
                          )}
                          {action.timing && (
                            <div className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded">
                              Timing: {action.timing}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          )}
        </div>

        {/* Deal Assessment Context */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full text-sm text-slate-600">
            <Target className="w-4 h-4" />
            Analysis optimized for {getDealAssessment().assessment.toLowerCase()} strategy
          </div>
        </div>
      </div>
    </div>
  )
}
