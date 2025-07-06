
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import { TranscriptUpload } from '@/components/upload/TranscriptUpload'
import { UploadProgress } from '@/components/upload/UploadProgress'
import { HeatDealsSection } from '@/components/dashboard/HeatDealsSection'
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

        {/* Heat-Based Deal Sections - Enhanced with more real estate */}
        <div>
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-bold text-slate-900">Deal Intelligence Pipeline</h3>
            <p className="text-slate-600">Organized by opportunity heat level</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <HeatDealsSection 
              heatLevel="HIGH" 
              transcripts={transcripts} 
              isLoading={isLoading} 
            />
            <HeatDealsSection 
              heatLevel="MEDIUM" 
              transcripts={transcripts} 
              isLoading={isLoading} 
            />
            <HeatDealsSection 
              heatLevel="LOW" 
              transcripts={transcripts} 
              isLoading={isLoading} 
            />
          </div>
        </div>

        {/* Getting Started Guide - Only show if no transcripts */}
        {stats.totalTranscripts === 0 && !isLoading && (
          <div className="mt-12">
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
          </div>
        )}
      </main>
    </div>
  )
}
