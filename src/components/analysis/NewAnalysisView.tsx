import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { 
  TrendingUp, 
  Target, 
  MessageSquare, 
  Mail, 
  CheckCircle, 
  ArrowRight, 
  Lightbulb, 
  Users,
  Copy,
  Share2,
  Upload,
  ArrowLeft,
  Star,
  Zap,
  Eye,
  ChevronDown,
  Phone,
  Calendar,
  User,
  Building,
  Clock,
  AlertCircle,
  ThumbsUp,
  Shield,
  Flame,
  DollarSign,
  Briefcase,
  Globe,
  Award,
  TrendingDown,
  Activity,
  FileText,
  Heart,
  Bot
} from 'lucide-react'
import { toast } from 'sonner'

interface NewAnalysisViewProps {
  transcriptId: string
  onBackToDashboard: () => void
  onUploadAnother: () => void
}

interface Analysis {
  key_takeaways: string[]
  recommendations: Record<string, string[] | string>
  action_plan?: {
    actions: {
      action: string
      priority: string
      timeline: string
      reasoning?: string
    }[]
  }
}

interface DealAssessment {
  probability: 'very-low' | 'low' | 'medium' | 'high'
  assessment: string
}

interface StakeholderData {
  hasAnyStakeholders: boolean
}

export function NewAnalysisView({ transcriptId, onBackToDashboard, onUploadAnother }: NewAnalysisViewProps) {
  // Placeholder state and data fetching logic
  // In real implementation, these would come from hooks or props
  const [analysis, setAnalysis] = React.useState<Analysis>({
    key_takeaways: [],
    recommendations: {},
    action_plan: { actions: [] }
  })
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<Error | null>(null)

  // Dummy implementations of helper functions
  const getDealAssessment = (): DealAssessment => {
    // Example static return; replace with real logic
    return { probability: 'medium', assessment: 'Medium Probability' }
  }

  const hasStakeholderData = (): StakeholderData => {
    // Example static return; replace with real logic
    return { hasAnyStakeholders: true }
  }

  const getConversationIntelligence = () => {
    // Example static return; replace with real logic
    return {
      positive: ['Positive indicator 1', 'Positive indicator 2'],
      concerns: ['Concern 1'],
      competitive: ['Competitive intel 1'],
      pain: ['Pain point 1']
    }
  }

  // NEW: Section Priority and Relevance Logic
  const getSectionDisplayPriority = () => {
    const assessment = getDealAssessment()
    const hasStakeholders = hasStakeholderData().hasAnyStakeholders
    
    // Define sections with priority and relevance logic
    const sections = [
      {
        id: 'insights',
        component: 'Deal Acceleration Insights',
        priority: 1,
        showFor: ['high', 'medium', 'low'],
        hasData: () => analysis.key_takeaways && analysis.key_takeaways.length > 0,
        reason: 'Always valuable for understanding client mindset'
      },
      {
        id: 'battleplan', 
        component: 'Complete Battle Plan',
        priority: 2,
        showFor: ['high', 'medium'],
        hasData: () => analysis.recommendations && Object.keys(analysis.recommendations).length > 0,
        reason: 'Strategic planning for viable opportunities'
      },
      {
        id: 'competitive',
        component: 'Competitive Positioning Arsenal', 
        priority: 3,
        showFor: ['high', 'medium', 'low'],
        hasData: () => {
          const intel = getConversationIntelligence()
          return intel.positive.length > 0 || intel.concerns.length > 0 || 
                 intel.competitive.length > 0 || intel.pain.length > 0
        },
        reason: 'Intelligence gathering valuable for all deals'
      },
      {
        id: 'templates',
        component: 'Ready-to-Execute Playbook',
        priority: 4, 
        showFor: ['high', 'medium'],
        hasData: () => analysis.action_plan?.actions && analysis.action_plan.actions.length > 0,
        reason: 'Detailed execution plans for active opportunities'
      }
    ]
    
    // Filter sections based on deal assessment and data availability
    return sections.filter(section => {
      const hasRelevantData = section.hasData()
      const isRelevantForDeal = section.showFor.includes(assessment.probability)
      
      // Special logic for very-low probability deals
      if (assessment.probability === 'very-low') {
        return section.id === 'insights' && hasRelevantData
      }
      
      return hasRelevantData && isRelevantForDeal
    })
  }

  // NEW: Smart Section Summary for Hidden Content
  const getHiddenSectionsContext = () => {
    const assessment = getDealAssessment()
    const visibleSections = getSectionDisplayPriority()
    const totalPossibleSections = 4
    
    if (visibleSections.length === totalPossibleSections) {
      return null // Nothing hidden
    }
    
    const hiddenCount = totalPossibleSections - visibleSections.length
    
    let contextMessage = ''
    if (assessment.probability === 'very-low') {
      contextMessage = `Focusing on key insights only. Additional strategic analysis available when deal conditions improve.`
    } else if (assessment.probability === 'low') {
      contextMessage = `Showing analysis relevant for nurture strategy. Full competitive and execution planning available for active opportunities.`
    } else {
      contextMessage = `Showing ${visibleSections.length} relevant analysis sections. Additional context available as needed.`
    }
    
    return {
      hiddenCount,
      contextMessage,
      assessment: assessment.probability
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-600">Loading analysis...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-slate-600">Failed to load analysis results</p>
          <button onClick={onBackToDashboard} className="btn btn-primary">Return to Dashboard</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      {/* Navigation Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <button 
            onClick={onBackToDashboard}
            className="text-slate-600 hover:text-slate-900 flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Dashboard
          </button>
          
          <div className="flex items-center space-x-3">
            <button className="btn btn-outline btn-sm flex items-center">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </button>
            <button onClick={onUploadAnother} className="btn btn-primary flex items-center">
              <Upload className="w-4 h-4 mr-2" />
              Analyze Another Call
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-6">
          <div className="space-y-4">
            <Badge className="bg-green-100 text-green-800 px-4 py-2 text-lg font-medium inline-flex items-center justify-center">
              <Star className="w-5 h-5 mr-2" />
              Analysis Complete
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 leading-tight">
              Your Conversation Insights
            </h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Analysis complete for your conversation
            </p>
          </div>
        </div>

        {/* ENHANCED PROGRESSIVE DISCLOSURE SECTIONS */}
        <div className="space-y-4">
          
          {/* Context Banner for Hidden Sections */}
          {(() => {
            const hiddenContext = getHiddenSectionsContext()
            if (!hiddenContext) return null
            
            return (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-3">
                  <Eye className="w-5 h-5 text-slate-500" />
                  <div>
                    <h4 className="font-medium text-slate-700">Focused Analysis View</h4>
                    <p className="text-sm text-slate-600">{hiddenContext.contextMessage}</p>
                  </div>
                </div>
              </div>
            )
          })()}

          {/* Dynamic Section Rendering */}
          {getSectionDisplayPriority().map((sectionConfig) => {
            
            // Deal Acceleration Insights
            if (sectionConfig.id === 'insights' && analysis.key_takeaways && analysis.key_takeaways.length > 0) {
              return (
                <Card key={sectionConfig.id} className="border-l-4 border-l-yellow-400 bg-gradient-to-r from-yellow-50 to-orange-50 hover:shadow-lg transition-all">
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <CardHeader className="pb-2 cursor-pointer hover:bg-yellow-100/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Lightbulb className="w-6 h-6 text-yellow-600" />
                            <div>
                              <CardTitle className="text-lg">Deal Acceleration Insights ({analysis.key_takeaways.length})</CardTitle>
                              <p className="text-sm text-yellow-700 font-normal">What they revealed about decision criteria and competitive positioning</p>
                            </div>
                          </div>
                          <ChevronDown className="w-5 h-5 text-yellow-600" />
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent>
                        <div className="space-y-4">
                          {analysis.key_takeaways.map((takeaway, index) => (
                            <div key={index} className="bg-white p-4 rounded-lg border shadow-sm">
                              <div className="flex items-start gap-3">
                                <div className="p-2 bg-yellow-100 rounded-full flex-shrink-0">
                                  <Lightbulb className="w-4 h-4 text-yellow-600" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-gray-900 leading-relaxed">{takeaway}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              )
            }
            
            // Complete Battle Plan
            if (sectionConfig.id === 'battleplan' && analysis.recommendations) {
              return (
                <Card key={sectionConfig.id} className="border-l-4 border-l-blue-400 bg-gradient-to-r from-blue-50 to-indigo-50 hover:shadow-lg transition-all">
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <CardHeader className="pb-2 cursor-pointer hover:bg-blue-100/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Target className="w-6 h-6 text-blue-600" />
                            <div>
                              <CardTitle className="text-lg">Complete Battle Plan</CardTitle>
                              <p className="text-sm text-blue-700 font-normal">How to position against competitors based on their specific needs</p>
                            </div>
                          </div>
                          <ChevronDown className="w-5 h-5 text-blue-600" />
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent>
                        <div className="grid gap-6">
                          {Object.entries(analysis.recommendations).map(([category, items]) => (
                            <div key={category} className="bg-white p-6 rounded-lg border">
                              <h4 className="text-lg font-semibold text-blue-900 mb-4 capitalize flex items-center gap-2">
                                <Target className="w-5 h-5" />
                                {category.replace('_', ' ')} Strategy
                              </h4>
                              <div className="space-y-3">
                                {Array.isArray(items) ? items.map((item, index) => (
                                  <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                                    <ArrowRight className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                    <span className="text-gray-900">{item}</span>
                                  </div>
                                )) : (
                                  <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                                    <ArrowRight className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                    <span className="text-gray-900">{items}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              )
            }
            
            // Competitive Positioning Arsenal  
            if (sectionConfig.id === 'competitive') {
              const intel = getConversationIntelligence()
              return (
                <Card key={sectionConfig.id} className="border-l-4 border-l-green-400 bg-gradient-to-r from-green-50 to-emerald-50 hover:shadow-lg transition-all">
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <CardHeader className="pb-2 cursor-pointer hover:bg-green-100/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Eye className="w-6 h-6 text-green-600" />
                            <div>
                              <CardTitle className="text-lg">Competitive Positioning Arsenal</CardTitle>
                              <p className="text-sm text-green-700 font-normal">What they revealed about evaluation process and decision criteria</p>
                            </div>
                          </div>
                          <ChevronDown className="w-5 h-5 text-green-600" />
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent>
                        <div className="grid gap-6">
                          {intel.positive.length > 0 && (
                            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                              <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                                <ThumbsUp className="w-5 h-5" />
                                Positive Indicators ({intel.positive.length})
                              </h4>
                              <div className="space-y-2">
                                {intel.positive.map((item, index) => (
                                  <div key={index} className="text-green-800 text-sm flex items-start gap-2">
                                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    {item}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {intel.concerns.length > 0 && (
                            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                              <h4 className="font-semibold text-orange-900 mb-3 flex items-center gap-2">
                                <AlertCircle className="w-5 h-5" />
                                Areas of Concern ({intel.concerns.length})
                              </h4>
                              <div className="space-y-2">
                                {intel.concerns.map((item, index) => (
                                  <div key={index} className="text-orange-800 text-sm flex items-start gap-2">
                                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    {item}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {intel.competitive.length > 0 && (
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                              <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                                <Shield className="w-5 h-5" />
                                Competitive Intelligence ({intel.competitive.length})
                              </h4>
                              <div className="space-y-2">
                                {intel.competitive.map((item, index) => (
                                  <div key={index} className="text-blue-800 text-sm flex items-start gap-2">
                                    <Eye className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    {item}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {intel.pain.length > 0 && (
                            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                              <h4 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                                <Flame className="w-5 h-5" />
                                Pain Points & Urgency ({intel.pain.length})
                              </h4>
                              <div className="space-y-2">
                                {intel.pain.map((item, index) => (
                                  <div key={index} className="text-red-800 text-sm flex items-start gap-2">
                                    <Flame className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    {item}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              )
            }
            
            // Ready-to-Execute Playbook (detailed version)
            if (sectionConfig.id === 'templates' && analysis.action_plan?.actions && analysis.action_plan.actions.length > 0) {
              return (
                <Card key={sectionConfig.id} className="border-l-4 border-l-purple-400 bg-gradient-to-r from-purple-50 to-indigo-50 hover:shadow-lg transition-all">
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <CardHeader className="pb-2 cursor-pointer hover:bg-purple-100/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Zap className="w-6 h-6 text-purple-600" />
                            <div>
                              <CardTitle className="text-lg">Detailed Execution Context</CardTitle>
                              <p className="text-sm text-purple-700 font-normal">Additional context and supporting materials for template execution</p>
                            </div>
                          </div>
                          <ChevronDown className="w-5 h-5 text-purple-600" />
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
                          {analysis.action_plan.actions.map((action, index) => (
                            <div key={index} className="bg-white p-4 rounded-lg border">
                              <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                                  <span className="text-sm font-bold text-purple-600">{index + 1}</span>
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-medium text-gray-900 mb-2">{action.action}</h4>
                                  <div className="space-y-2 text-sm text-gray-600">
                                    <div className="flex items-center gap-2">
                                      <Clock className="w-4 h-4" />
                                      <span>Priority: {action.priority}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Target className="w-4 h-4" />
                                      <span>Timeline: {action.timeline}</span>
                                    </div>
                                    {action.reasoning && (
                                      <div className="mt-2 p-2 bg-purple-50 rounded text-purple-700">
                                        <strong>Context:</strong> {action.reasoning}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              )
            }
            
            return null
          })}
        </div>

        {/* Deal Assessment Context Footer */}
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
