
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, TrendingUp, Clock, Target } from 'lucide-react'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import { TranscriptUpload } from '@/components/upload/TranscriptUpload'
import { UploadProgress } from '@/components/upload/UploadProgress'
import { RecentTranscripts } from '@/components/dashboard/RecentTranscripts'
import { useTranscriptData } from '@/hooks/useTranscriptData'
import { SalesIntelligenceView } from '@/components/analysis/SalesIntelligenceView'
import { useState } from 'react'

console.log('🔍 WelcomeDashboard.tsx file loaded')

export default function WelcomeDashboard() {
  console.log('🔍 WelcomeDashboard MOUNTED')
  console.log('🔍 Current route:', window.location.pathname)
  
  const { stats, transcripts, isLoading } = useTranscriptData()
  const [currentView, setCurrentView] = useState<'dashboard' | 'intelligence'>('dashboard')
  const [currentTranscriptId, setCurrentTranscriptId] = useState<string | null>(null)

  console.log('🔍 Component states:', { currentView, currentTranscriptId })

  // Analyze transcript data for deal intelligence insights
  const analyzeDealIntelligence = () => {
    const completedTranscripts = transcripts.filter(t => t.status === 'completed' && t.conversation_analysis?.length > 0)
    
    if (completedTranscripts.length === 0) return []

    const insights = []
    
    // Count HIGH heat deals
    const highHeatDeals = completedTranscripts.filter(t => {
      const analysis = t.conversation_analysis?.[0]
      const heatLevel = analysis?.recommendations?.heat_level || 
                       analysis?.guidance?.heat_level || 
                       analysis?.call_summary?.heat_level ||
                       analysis?.dealHeat
      return heatLevel?.toUpperCase() === 'HIGH'
    }).length

    if (highHeatDeals > 0) {
      insights.push({
        icon: '🔥',
        text: `${highHeatDeals} conversation${highHeatDeals > 1 ? 's show' : ' shows'} strong buying signals`,
        type: 'high-heat'
      })
    }

    // Analyze for budget mentions
    const budgetMentions = completedTranscripts.filter(t => {
      const analysis = t.conversation_analysis?.[0]
      const hasbudget = analysis?.key_takeaways?.some((takeaway: any) => 
        typeof takeaway === 'string' && takeaway.toLowerCase().includes('budget')
      ) || analysis?.call_summary?.budget_discussion ||
         analysis?.recommendations?.budget_qualified
      return hasbudget
    }).length

    if (budgetMentions > 0) {
      insights.push({
        icon: '💰',
        text: `${budgetMentions} prospect${budgetMentions > 1 ? 's discussed' : ' discussed'} specific budget ranges`,
        type: 'budget'
      })
    }

    // Analyze for timeline urgency
    const timelineUrgency = completedTranscripts.filter(t => {
      const analysis = t.conversation_analysis?.[0]
      const hasUrgency = analysis?.key_takeaways?.some((takeaway: any) => 
        typeof takeaway === 'string' && (
          takeaway.toLowerCase().includes('urgent') ||
          takeaway.toLowerCase().includes('deadline') ||
          takeaway.toLowerCase().includes('timeline') ||
          takeaway.toLowerCase().includes('asap')
        )
      ) || analysis?.recommendations?.urgency_indicators ||
         analysis?.call_summary?.timeline_pressure
      return hasUrgency
    }).length

    if (timelineUrgency > 0) {
      insights.push({
        icon: '⏰',
        text: `${timelineUrgency} deal${timelineUrgency > 1 ? 's have' : ' has'} mentioned deadlines or urgency`,
        type: 'timeline'
      })
    }

    // Analyze for competitive situations
    const competitiveSituations = completedTranscripts.filter(t => {
      const analysis = t.conversation_analysis?.[0]
      const hasCompetition = analysis?.key_takeaways?.some((takeaway: any) => 
        typeof takeaway === 'string' && (
          takeaway.toLowerCase().includes('competitor') ||
          takeaway.toLowerCase().includes('alternative') ||
          takeaway.toLowerCase().includes('evaluation') ||
          takeaway.toLowerCase().includes('compare')
        )
      ) || analysis?.recommendations?.competitive_intel ||
         analysis?.call_summary?.competitive_landscape
      return hasCompetition
    }).length

    if (competitiveSituations > 0) {
      insights.push({
        icon: '⚔️',
        text: `${competitiveSituations} call${competitiveSituations > 1 ? 's revealed' : ' revealed'} competitive evaluations`,
        type: 'competitive'
      })
    }

    // Return max 3 most relevant insights
    return insights.slice(0, 3)
  }

  const dealIntelligenceInsights = analyzeDealIntelligence()

  // Handle analysis completion from TranscriptUpload
  const handleAnalysisComplete = (transcriptId: string) => {
    console.log('🔍 DASHBOARD RECEIVED COMPLETION:', transcriptId)
    setCurrentTranscriptId(transcriptId)
    setCurrentView('intelligence')
  }

  // Handle navigation back to dashboard
  const handleBackToDashboard = () => {
    console.log('🔍 Returning to dashboard')
    setCurrentView('dashboard')
    setCurrentTranscriptId(null)
  }

  // Handle upload another
  const handleUploadAnother = () => {
    console.log('🔍 Starting new upload')
    setCurrentView('dashboard')
    setCurrentTranscriptId(null)
  }

  // Show sales intelligence view
  if (currentView === 'intelligence' && currentTranscriptId) {
    console.log('🔍 Rendering sales intelligence view for transcript:', currentTranscriptId)
    return (
      <SalesIntelligenceView 
        transcriptId={currentTranscriptId}
        onBackToDashboard={handleBackToDashboard}
        onUploadAnother={handleUploadAnother}
      />
    )
  }

  // Main dashboard view
  console.log('🔍 Rendering main dashboard view')
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      {/* Header */}
      <DashboardHeader
        title="Sales Whisperer"
        subtitle="Get instant deal intelligence from every sales conversation"
        iconColor="bg-blue-600"
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Welcome Section with stronger CTA */}
        <div className="mb-8 text-center">
          <h2 className="text-4xl font-bold text-slate-900 mb-3">Turn Every Sales Conversation Into Deal Intelligence</h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Upload your call transcript and instantly unlock buying signals, stakeholder insights, and strategic next steps to accelerate your opportunities
          </p>
        </div>

        {/* Performance Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-all duration-200 bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">Conversations Analyzed</CardTitle>
              <BarChart3 className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {isLoading ? '-' : stats.totalTranscripts}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {stats.completedTranscripts} with intelligence extracted
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-all duration-200 bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">Avg Conversation Length</CardTitle>
              <Clock className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {isLoading ? '-' : stats.averageCallDuration > 0 ? `${stats.averageCallDuration}m` : 'N/A'}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {stats.averageCallDuration >= 45 ? 'Rich intelligence depth' : 
                 stats.averageCallDuration >= 30 ? 'Good intelligence quality' : 
                 stats.averageCallDuration > 0 ? 'Consider longer discovery' : 'Upload conversations to track'}
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500 hover:shadow-lg transition-all duration-200 bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">Active Opportunities</CardTitle>
              <Target className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {isLoading ? '-' : stats.activeDeals}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {stats.activeDeals > 0 ? 'Pipeline intelligence active' : 'Start tracking opportunities'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Upload Section - Now the Hero */}
        <div className="mb-12">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 shadow-xl">
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold text-white mb-3">Extract Intelligence From Your Latest Sales Conversation</h3>
              <p className="text-xl text-blue-100 max-w-2xl mx-auto">
                Get instant deal intelligence, buying signals, and actionable insights to accelerate your opportunities
              </p>
            </div>
            
            {/* Upload Card with enhanced styling */}
            <div className="bg-white rounded-xl shadow-2xl">
              <TranscriptUpload onAnalysisComplete={handleAnalysisComplete} />
            </div>
          </div>
        </div>

        {/* Secondary Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Recent Activity */}
          <div className="space-y-6">
            <RecentTranscripts />
          </div>

          {/* Deal Intelligence Panel */}
          <div className="space-y-6">
            <Card className="shadow-md hover:shadow-lg transition-all duration-200 bg-white">
              <CardHeader>
                <CardTitle className="flex items-center space-x-3 text-xl text-slate-900">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-indigo-600" />
                  </div>
                  <span>Deal Intelligence</span>
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Insights extracted from your analyzed conversations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {dealIntelligenceInsights.length === 0 ? (
                  <div className="text-center py-6">
                    <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                      <p className="font-medium text-slate-900 mb-2">Ready to unlock deal intelligence?</p>
                      <p className="text-sm text-slate-600">Upload your first conversation transcript above to see personalized insights here</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {dealIntelligenceInsights.map((insight, index) => (
                      <div key={index} className="border-l-4 border-l-blue-500 pl-4">
                        <p className="font-medium text-slate-900 mb-1 flex items-center space-x-2">
                          <span className="text-lg">{insight.icon}</span>
                          <span>{insight.text}</span>
                        </p>
                        <p className="text-sm text-slate-600">
                          {insight.type === 'high-heat' && 'Strong buying signals detected - prioritize these opportunities'}
                          {insight.type === 'budget' && 'Budget conversations indicate serious evaluation - prepare pricing discussions'}
                          {insight.type === 'timeline' && 'Time-sensitive opportunities - accelerate your sales process'}
                          {insight.type === 'competitive' && 'Competitive situations identified - strengthen your differentiation'}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Getting Started Guide - Only show if no transcripts */}
        {stats.totalTranscripts === 0 && !isLoading && (
          <Card className="shadow-md bg-white">
            <CardHeader>
              <CardTitle className="text-xl text-slate-900">Transform Sales Conversations Into Deal Intelligence</CardTitle>
              <CardDescription className="text-slate-600">
                Follow these steps to unlock buying signals and accelerate your deals
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-white">1</span>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">Upload Your Sales Conversation</h4>
                  <p className="text-slate-600 text-sm">
                    Upload any sales call transcript to get AI-powered deal intelligence analysis.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-white">2</span>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">Discover Hidden Buying Signals</h4>
                  <p className="text-slate-600 text-sm">
                    Uncover stakeholder insights, urgency indicators, and competitive intelligence.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-white">3</span>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">Accelerate Deal Progression</h4>
                  <p className="text-slate-600 text-sm">
                    Execute strategic follow-ups and next steps designed to advance your opportunities.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
