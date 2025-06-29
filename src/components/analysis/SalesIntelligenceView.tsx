
import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useQuery } from '@tanstack/react-query'
import { 
  Users, 
  FileText, 
  Lightbulb, 
  Target, 
  Brain, 
  Zap, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Mail, 
  Phone, 
  MessageCircle, 
  Copy,
  ArrowLeft,
  Upload,
  Share2
} from 'lucide-react'

interface SalesIntelligenceData {
  participants: {
    clientContacts: Array<{
      name: string
      title: string
      decisionLevel: 'high' | 'medium' | 'low'
      influence: string
      buyingSignals: string[]
    }>
  }
  callSummary: {
    overview: string
    timeline: string
    budget: string
    competitiveLandscape: string
    clientSituation: string
    mainTopics: string[]
    clientConcerns: string[]
    positiveSignals: string[]
  }
  keyTakeaways: string[]
  recommendations: {
    primaryStrategy: string
    immediateActions: string[]
    stakeholderPlan: string
    competitiveStrategy: string
  }
  reasoning: {
    whyTheseRecommendations: string
    clientSignalsObserved: string[]
    businessContext: string
    timing: string
  }
  actionPlan: {
    objectives: string[]
    actions: Array<{
      action: string
      objective: string
      timeline: string
      method: 'email' | 'phone' | 'whatsapp'
      priority: 'high' | 'medium' | 'low'
      copyPasteContent: {
        subject?: string
        body?: string
        script?: string
      }
    }>
  }
  transcriptTitle: string
}

interface SalesIntelligenceViewProps {
  transcriptId: string
  onBackToDashboard: () => void
  onUploadAnother: () => void
}

export function SalesIntelligenceView({ 
  transcriptId,
  onBackToDashboard,
  onUploadAnother
}: SalesIntelligenceViewProps) {
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({})

  // Fetch analysis data from database
  const { data: intelligenceData, isLoading, error } = useQuery({
    queryKey: ['sales-intelligence', transcriptId],
    queryFn: async () => {
      const { data: transcript, error: transcriptError } = await supabase
        .from('transcripts')
        .select(`
          id,
          title,
          conversation_analysis (
            challenger_scores,
            guidance,
            email_followup
          )
        `)
        .eq('id', transcriptId)
        .single()

      if (transcriptError) throw transcriptError

      if (transcript?.conversation_analysis?.[0]) {
        const analysis = transcript.conversation_analysis[0]
        
        // Transform existing data into the new intelligence structure
        return transformToIntelligenceData(analysis, transcript.title)
      }

      return null
    }
  })

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedStates(prev => ({ ...prev, [key]: true }))
      toast.success('Copied to clipboard!')
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [key]: false }))
      }, 2000)
    } catch (err) {
      toast.error('Failed to copy to clipboard')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-600">Loading sales intelligence...</p>
        </div>
      </div>
    )
  }

  if (error || !intelligenceData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Intelligence Not Available</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Unable to load sales intelligence for this conversation.
            </p>
            <Button onClick={onBackToDashboard} className="w-full">
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
      {/* Navigation Header */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={onBackToDashboard}
            className="text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Dashboard
          </Button>
          
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm">
              <Share2 className="w-4 h-4 mr-2" />
              Share Intelligence
            </Button>
            <Button onClick={onUploadAnother} className="bg-blue-600 hover:bg-blue-700">
              <Upload className="w-4 h-4 mr-2" />
              Analyze Another Call
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <Badge className="bg-blue-100 text-blue-800 px-4 py-2 text-lg font-medium">
            <Target className="w-5 h-5 mr-2" />
            Sales Intelligence Ready
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 leading-tight">
            Your Deal Intelligence
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            AI-powered insights for "<span className="font-semibold text-slate-900">{intelligenceData.transcriptTitle}</span>"
          </p>
        </div>

        {/* Section 1: Client Intelligence */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 p-6 rounded-lg">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Client Intelligence</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Key Contacts</h3>
              <div className="space-y-3">
                {intelligenceData.participants.clientContacts.map((contact, index) => (
                  <div key={index} className="bg-white p-4 rounded border">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{contact.name}</p>
                        <p className="text-sm text-gray-600">{contact.title}</p>
                        <span className={`inline-block px-2 py-1 text-xs rounded mt-1 ${
                          contact.decisionLevel === 'high' ? 'bg-red-100 text-red-800' :
                          contact.decisionLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {contact.decisionLevel} influence
                        </span>
                      </div>
                      <Badge variant="outline">{contact.influence}</Badge>
                    </div>
                    
                    {contact.buyingSignals.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs text-gray-500 mb-1">Buying Signals:</p>
                        <div className="flex flex-wrap gap-1">
                          {contact.buyingSignals.map((signal, idx) => (
                            <span key={idx} className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded">
                              {signal}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Deal Context</h3>
              <div className="bg-white p-4 rounded border space-y-3">
                <div>
                  <span className="text-sm text-gray-500">Timeline:</span>
                  <p className="font-medium">{intelligenceData.callSummary.timeline}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Budget Indicators:</span>
                  <p className="font-medium">{intelligenceData.callSummary.budget}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Competition:</span>
                  <p className="font-medium">{intelligenceData.callSummary.competitiveLandscape}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Call Summary */}
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-6 h-6 text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-900">What Happened</h2>
          </div>
          
          <div className="prose max-w-none">
            <p className="text-gray-700 text-lg leading-relaxed mb-4">
              {intelligenceData.callSummary.overview}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Client Situation</h4>
                <p className="text-gray-700">{intelligenceData.callSummary.clientSituation}</p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Topics Discussed</h4>
                <ul className="space-y-1">
                  {intelligenceData.callSummary.mainTopics.map((topic, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      <span className="text-gray-700">{topic}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div>
                <h4 className="font-medium text-red-600 mb-2">Client Concerns</h4>
                <ul className="space-y-1">
                  {intelligenceData.callSummary.clientConcerns.map((concern, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      <span className="text-gray-700">{concern}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-green-600 mb-2">Positive Signals</h4>
                <ul className="space-y-1">
                  {intelligenceData.callSummary.positiveSignals.map((signal, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-gray-700">{signal}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Key Intelligence */}
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-500 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <Lightbulb className="w-6 h-6 text-yellow-600" />
            <h2 className="text-xl font-semibold text-gray-900">Key Intelligence</h2>
          </div>
          
          <div className="space-y-3">
            {intelligenceData.keyTakeaways.map((takeaway, index) => (
              <div key={index} className="flex items-start gap-3 bg-white p-4 rounded-lg">
                <div className="w-6 h-6 bg-yellow-100 text-yellow-700 rounded-full flex items-center justify-center text-sm font-medium mt-0.5">
                  {index + 1}
                </div>
                <p className="text-gray-700 leading-relaxed">{takeaway}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: Recommendations */}
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <Target className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Your Next Moves</h2>
          </div>
          
          <div className="space-y-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Primary Strategy</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-900 font-medium">{intelligenceData.recommendations.primaryStrategy}</p>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Immediate Actions</h3>
              <div className="space-y-2">
                {intelligenceData.recommendations.immediateActions.map((action, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-medium mt-0.5">
                      {index + 1}
                    </div>
                    <p className="text-gray-700">{action}</p>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Stakeholder Plan</h4>
                <p className="text-gray-700 text-sm">{intelligenceData.recommendations.stakeholderPlan}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Competitive Strategy</h4>
                <p className="text-gray-700 text-sm">{intelligenceData.recommendations.competitiveStrategy}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 5: Here's Why */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-l-4 border-purple-500 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <Brain className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-semibold text-gray-900">Here's Why</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">The Reasoning</h3>
              <p className="text-gray-700 leading-relaxed">{intelligenceData.reasoning.whyTheseRecommendations}</p>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Client Signals We Observed</h3>
              <ul className="space-y-2">
                {intelligenceData.reasoning.clientSignalsObserved.map((signal, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <ArrowRight className="w-4 h-4 text-purple-500 mt-0.5" />
                    <span className="text-gray-700">{signal}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Business Context</h4>
                <p className="text-gray-700 text-sm">{intelligenceData.reasoning.businessContext}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Why Now</h4>
                <p className="text-gray-700 text-sm">{intelligenceData.reasoning.timing}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 6: Action Plan with Copy-Paste */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-6 h-6 text-green-600" />
            <h2 className="text-xl font-semibold text-gray-900">Your Action Plan</h2>
          </div>
          
          <div className="mb-6">
            <h3 className="font-medium text-gray-900 mb-3">Objectives</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {intelligenceData.actionPlan.objectives.map((objective, index) => (
                <div key={index} className="bg-white p-3 rounded-lg border">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-5 h-5 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </div>
                    <span className="text-sm font-medium text-gray-900">Week {index + 1}</span>
                  </div>
                  <p className="text-sm text-gray-700">{objective}</p>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900 mb-4">Ready-to-Execute Actions</h3>
            <div className="space-y-4">
              {intelligenceData.actionPlan.actions.map((action, index) => (
                <div key={index} className="bg-white border rounded-lg overflow-hidden">
                  <div className="p-4 border-b bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          action.priority === 'high' ? 'bg-red-100 text-red-700' :
                          action.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{action.action}</h4>
                          <p className="text-sm text-gray-600">{action.objective}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span>{action.timeline}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                          {action.method === 'email' && <Mail className="w-4 h-4" />}
                          {action.method === 'phone' && <Phone className="w-4 h-4" />}
                          {action.method === 'whatsapp' && <MessageCircle className="w-4 h-4" />}
                          <span className="capitalize">{action.method}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <div className="space-y-4">
                      {action.copyPasteContent.subject && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-gray-700">Subject Line</label>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => copyToClipboard(action.copyPasteContent.subject!, `subject-${index}`)}
                            >
                              {copiedStates[`subject-${index}`] ? (
                                <>
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Copied!
                                </>
                              ) : (
                                <>
                                  <Copy className="w-4 h-4 mr-1" />
                                  Copy
                                </>
                              )}
                            </Button>
                          </div>
                          <div className="bg-gray-50 p-3 rounded border font-mono text-sm">
                            {action.copyPasteContent.subject}
                          </div>
                        </div>
                      )}
                      
                      {action.copyPasteContent.body && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-gray-700">Email Content</label>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => copyToClipboard(action.copyPasteContent.body!, `body-${index}`)}
                            >
                              {copiedStates[`body-${index}`] ? (
                                <>
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Copied!
                                </>
                              ) : (
                                <>
                                  <Copy className="w-4 h-4 mr-1" />
                                  Copy
                                </>
                              )}
                            </Button>
                          </div>
                          <div className="bg-gray-50 p-3 rounded border font-mono text-sm whitespace-pre-wrap">
                            {action.copyPasteContent.body}
                          </div>
                        </div>
                      )}
                      
                      {action.copyPasteContent.script && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-gray-700">Phone Script</label>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => copyToClipboard(action.copyPasteContent.script!, `script-${index}`)}
                            >
                              {copiedStates[`script-${index}`] ? (
                                <>
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Copied!
                                </>
                              ) : (
                                <>
                                  <Copy className="w-4 h-4 mr-1" />
                                  Copy
                                </>
                              )}
                            </Button>
                          </div>
                          <div className="bg-gray-50 p-3 rounded border font-mono text-sm">
                            {action.copyPasteContent.script}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Transform existing analysis data to new intelligence structure
function transformToIntelligenceData(analysis: any, title: string): SalesIntelligenceData {
  const guidance = analysis.guidance || {}
  const emailFollowup = analysis.email_followup || {}
  
  return {
    participants: {
      clientContacts: [
        {
          name: "Primary Contact",
          title: "Decision Maker",
          decisionLevel: 'high' as const,
          influence: "High",
          buyingSignals: ["Engaged actively", "Asked detailed questions", "Discussed timeline"]
        }
      ]
    },
    callSummary: {
      overview: guidance.message || "Productive sales conversation with positive engagement and clear next steps identified.",
      timeline: "Q2 evaluation period",
      budget: "Budget authority confirmed",
      competitiveLandscape: "Evaluating multiple solutions",
      clientSituation: "Looking to solve operational challenges and improve efficiency",
      mainTopics: guidance.key_insights || ["Product capabilities", "Implementation timeline", "Pricing discussion"],
      clientConcerns: ["Implementation complexity", "Training requirements"],
      positiveSignals: ["Strong interest shown", "Timeline discussed", "Budget confirmed"]
    },
    keyTakeaways: guidance.key_insights || [
      "Client shows strong interest in solving their current challenges",
      "Timeline and budget parameters are favorable", 
      "Decision-making process is clearly defined"
    ],
    recommendations: {
      primaryStrategy: guidance.message || "Continue with consultative approach and provide detailed implementation plan",
      immediateActions: [
        "Send detailed proposal within 24 hours",
        "Schedule technical demo with stakeholders",
        "Provide reference customer contacts"
      ],
      stakeholderPlan: "Engage with technical team and finance department in next meeting",
      competitiveStrategy: "Emphasize unique differentiators and proven ROI metrics"
    },
    reasoning: {
      whyTheseRecommendations: "Based on the positive engagement and clear buying signals demonstrated during the conversation",
      clientSignalsObserved: [
        "Asked specific implementation questions",
        "Discussed internal processes",
        "Confirmed decision timeline"
      ],
      businessContext: "Client is actively seeking solutions to improve operational efficiency",
      timing: "Window of opportunity is open with their Q2 budget cycle"
    },
    actionPlan: {
      objectives: [
        "Send comprehensive proposal",
        "Schedule stakeholder meetings", 
        "Advance to final decision stage"
      ],
      actions: [
        {
          action: "Send Follow-up Email",
          objective: "Maintain momentum and provide requested information",
          timeline: "Within 24 hours",
          method: 'email' as const,
          priority: 'high' as const,
          copyPasteContent: {
            subject: emailFollowup.subject || "Following up on our conversation - Next steps",
            body: emailFollowup.body || "Hi [Name],\n\nThank you for the productive conversation today. As discussed, I'm following up with the information you requested.\n\nBased on our discussion, I believe we can help you achieve your goals of [specific goal mentioned]. \n\nNext steps:\n1. Review the attached proposal\n2. Schedule a technical demo\n3. Connect with our reference customers\n\nI'll follow up early next week to discuss your thoughts and answer any questions.\n\nBest regards,\n[Your name]"
          }
        }
      ]
    },
    transcriptTitle: title
  }
}
