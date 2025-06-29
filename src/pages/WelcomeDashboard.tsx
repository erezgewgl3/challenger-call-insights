
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, TrendingUp, Clock, Target } from 'lucide-react'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import { TranscriptUpload } from '@/components/upload/TranscriptUpload'
import { UploadProgress } from '@/components/upload/UploadProgress'
import { RecentTranscripts } from '@/components/dashboard/RecentTranscripts'
import { AccountSelector } from '@/components/account/AccountSelector'
import { useTranscriptData } from '@/hooks/useTranscriptData'
import { SalesIntelligenceView } from '@/components/analysis/SalesIntelligenceView'
import { useState } from 'react'

console.log('🔍 WelcomeDashboard.tsx file loaded')

export default function WelcomeDashboard() {
  console.log('🔍 WelcomeDashboard MOUNTED')
  console.log('🔍 Current route:', window.location.pathname)
  
  const { stats, isLoading } = useTranscriptData()
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
        subtitle="AI-Powered Sales Intelligence"
        iconColor="bg-blue-600"
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Welcome to Sales Whisperer</h2>
          <p className="text-lg text-slate-600">
            Transform your sales calls into actionable intelligence that wins deals
          </p>
        </div>

        {/* Performance Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-all duration-200 bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">Calls Analyzed</CardTitle>
              <BarChart3 className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {isLoading ? '-' : stats.totalTranscripts}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {stats.completedTranscripts} completed
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-all duration-200 bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">Avg Teaching Score</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {isLoading ? '-' : stats.averageTeachingScore > 0 ? stats.averageTeachingScore.toFixed(1) : 'N/A'}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {stats.averageTeachingScore >= 4 ? 'Excellent performance' : 
                 stats.averageTeachingScore >= 3 ? 'Good performance' : 
                 stats.averageTeachingScore > 0 ? 'Growing skills' : 'Start analyzing calls'}
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-all duration-200 bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">Avg Call Duration</CardTitle>
              <Clock className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {isLoading ? '-' : stats.averageCallDuration > 0 ? `${stats.averageCallDuration}m` : 'N/A'}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {stats.averageCallDuration >= 45 ? 'Great depth' : 
                 stats.averageCallDuration >= 30 ? 'Good length' : 
                 stats.averageCallDuration > 0 ? 'Consider longer calls' : 'Upload calls to track'}
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500 hover:shadow-lg transition-all duration-200 bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">Active Accounts</CardTitle>
              <Target className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {isLoading ? '-' : stats.activeDeals}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {stats.activeDeals > 0 ? 'Pipeline engaged' : 'Start tracking accounts'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Upload Section */}
          <div className="space-y-6">
            <TranscriptUpload onAnalysisComplete={handleAnalysisComplete} />
            <AccountSelector />
          </div>

          {/* Recent Activity */}
          <div className="space-y-6">
            <RecentTranscripts />
            
            <Card className="shadow-md hover:shadow-lg transition-all duration-200 bg-white">
              <CardHeader>
                <CardTitle className="flex items-center space-x-3 text-xl text-slate-900">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-indigo-600" />
                  </div>
                  <span>Recent Insights</span>
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Key intelligence from your latest analyzed conversations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {stats.completedTranscripts === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-slate-500">Upload and analyze your first call to see intelligence here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="border-l-4 border-l-blue-500 pl-4">
                      <p className="font-medium text-slate-900 mb-1">
                        {stats.averageTeachingScore >= 4 ? 'Strong Teaching Momentum' : 'Building Teaching Skills'}
                      </p>
                      <p className="text-sm text-slate-600">
                        {stats.averageTeachingScore >= 4 
                          ? 'Your insights are creating strong impact. Keep challenging assumptions!'
                          : 'Focus on sharing more industry insights and challenging customer thinking.'
                        }
                      </p>
                    </div>
                    <div className="border-l-4 border-l-green-500 pl-4">
                      <p className="font-medium text-slate-900 mb-1">Sales Intelligence Ready</p>
                      <p className="text-sm text-slate-600">
                        Each analyzed call provides actionable intelligence to help you win more deals.
                      </p>
                    </div>
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
              <CardTitle className="text-xl text-slate-900">Getting Started with Sales Intelligence</CardTitle>
              <CardDescription className="text-slate-600">
                Follow these steps to transform your sales conversations into winning intelligence
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-white">1</span>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">Upload Your Sales Call</h4>
                  <p className="text-slate-600 text-sm">
                    Upload a sales conversation transcript to get AI-powered intelligence analysis.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-white">2</span>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">Get Sales Intelligence</h4>
                  <p className="text-slate-600 text-sm">
                    Receive detailed client insights, buying signals, and actionable recommendations.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-white">3</span>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">Execute & Win Deals</h4>
                  <p className="text-slate-600 text-sm">
                    Use copy-paste ready follow-ups and strategic recommendations to advance your deals.
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
