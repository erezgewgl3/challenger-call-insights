
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, TrendingUp, Clock, Target } from 'lucide-react'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import { TranscriptUpload } from '@/components/upload/TranscriptUpload'
import { UploadProgress } from '@/components/upload/UploadProgress'
import { RecentTranscripts } from '@/components/dashboard/RecentTranscripts'
import { AccountSelector } from '@/components/account/AccountSelector'
import { useTranscriptData } from '@/hooks/useTranscriptData'
import { useTranscriptUpload } from '@/hooks/useTranscriptUpload'
import { useEffect, useState } from 'react'
import { useAnalysisFlow } from '@/hooks/useAnalysisFlow'
import { FlowNavigation } from '@/components/flow/FlowNavigation'
import { CelebrationTransition } from '@/components/flow/CelebrationTransition'
import { AnalysisResultsView } from '@/components/analysis/AnalysisResultsView'

export default function WelcomeDashboard() {
  const { stats, isLoading } = useTranscriptData()
  const { uploadFiles, processFiles } = useTranscriptUpload()
  const [viewMode, setViewMode] = useState<'dashboard' | 'results'>('dashboard')
  const [currentAnalysisId, setCurrentAnalysisId] = useState<string | null>(null)
  
  console.log('🔍 Dashboard Render - View Mode:', viewMode, 'Analysis ID:', currentAnalysisId)
  
  const {
    currentView,
    transitionState,
    currentTranscriptId,
    analysisProgress,
    error,
    estimatedTime,
    uploadContext,
    startUpload,
    uploadComplete,
    uploadError,
    retryUpload,
    uploadAnother,
    viewResults,
    backToDashboard
  } = useAnalysisFlow()

  console.log('🔍 Analysis Flow State:', {
    currentView,
    currentTranscriptId,
    analysisProgress,
    transitionState
  })

  // Monitor upload files to trigger flow state changes
  useEffect(() => {
    console.log('🔍 Upload Files Effect - Files:', uploadFiles.length)
    
    const activeUploads = uploadFiles.filter(f => 
      f.status === 'uploading' || f.status === 'processing'
    )
    
    console.log('🔍 Active Uploads:', activeUploads.length)
    
    if (activeUploads.length > 0 && currentView === 'dashboard') {
      const latestUpload = activeUploads[activeUploads.length - 1]
      console.log('🔍 Starting upload flow for:', latestUpload.file.name)
      startUpload({
        fileName: latestUpload.file.name,
        fileSize: latestUpload.file.size,
        fileDuration: latestUpload.metadata?.durationMinutes
      })
    }

    // Check for completed uploads and trigger automatic results view
    const completedUploads = uploadFiles.filter(f => f.status === 'completed')
    console.log('🔍 Completed Uploads:', completedUploads.length)
    
    if (completedUploads.length > 0 && currentView === 'progress') {
      const latestUpload = completedUploads[completedUploads.length - 1]
      console.log('🔍 Latest completed upload:', latestUpload.transcriptId)
      
      if (latestUpload.transcriptId) {
        console.log('🔍 Triggering upload complete with transcript ID:', latestUpload.transcriptId)
        uploadComplete(latestUpload.transcriptId, latestUpload.metadata?.durationMinutes)
        
        // Automatically set to results view mode
        console.log('🔍 Setting view mode to results')
        setViewMode('results')
        setCurrentAnalysisId(latestUpload.transcriptId)
      }
    }

    // Check for errors
    const errorUploads = uploadFiles.filter(f => f.status === 'error')
    if (errorUploads.length > 0 && currentView !== 'dashboard') {
      const latestError = errorUploads[errorUploads.length - 1]
      console.log('🔍 Upload error:', latestError.error)
      uploadError(latestError.error || 'Upload failed')
    }
  }, [uploadFiles, currentView, startUpload, uploadComplete, uploadError])

  // Additional debugging for analysis flow changes
  useEffect(() => {
    console.log('🔍 Analysis Flow Change Effect:', {
      currentView,
      currentTranscriptId,
      analysisProgress
    })
    
    // Check if analysis is complete and we should show results
    if (currentView === 'progress' && analysisProgress === 100 && currentTranscriptId) {
      console.log('🔍 Analysis complete! Switching to results view')
      console.log('🔍 Setting viewMode to results and currentAnalysisId to:', currentTranscriptId)
      setViewMode('results')
      setCurrentAnalysisId(currentTranscriptId)
    }
  }, [currentView, currentTranscriptId, analysisProgress])

  // Handle back to dashboard navigation
  const handleBackToDashboard = () => {
    console.log('🔍 Handling back to dashboard')
    setViewMode('dashboard')
    setCurrentAnalysisId(null)
    backToDashboard()
  }

  // Handle upload another navigation
  const handleUploadAnother = () => {
    console.log('🔍 Handling upload another')
    setViewMode('dashboard')
    setCurrentAnalysisId(null)
    uploadAnother()
  }

  // Show results view when analysis is complete
  console.log('🔍 Should show results?', viewMode === 'results' && currentAnalysisId)
  if (viewMode === 'results' && currentAnalysisId) {
    console.log('🔍 Rendering AnalysisResultsView with transcript ID:', currentAnalysisId)
    return (
      <AnalysisResultsView 
        transcriptId={currentAnalysisId}
        onBackToDashboard={handleBackToDashboard}
        onUploadAnother={handleUploadAnother}
      />
    )
  }

  // Handle celebration transition
  if (transitionState === 'celebrating') {
    console.log('🔍 Rendering celebration transition')
    return <CelebrationTransition fileName={uploadContext.fileName} />
  }

  // Handle progress view
  if (currentView === 'progress') {
    console.log('🔍 Rendering progress view')
    return (
      <div className={`min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 transition-all duration-300 ${
        transitionState === 'transitioning' ? 'opacity-0' : 'opacity-100'
      }`}>
        <FlowNavigation
          currentView={currentView}
          onBackToDashboard={handleBackToDashboard}
          onUploadAnother={handleUploadAnother}
          showUploadAnother={false}
        />
        
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex justify-center">
            <UploadProgress
              uploadStatus="processing"
              analysisProgress={analysisProgress}
              error={error}
              estimatedTime={estimatedTime}
              onRetry={retryUpload}
              onUploadAnother={handleUploadAnother}
              fileName={uploadContext.fileName}
              fileSize={uploadContext.fileSize}
              fileDuration={uploadContext.fileDuration}
            />
          </div>
        </main>
      </div>
    )
  }

  // Main dashboard view
  console.log('🔍 Rendering main dashboard view')
  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 transition-all duration-300 ${
      transitionState === 'transitioning' ? 'opacity-0' : 'opacity-100'
    }`}>
      {/* Header */}
      <DashboardHeader
        title="Sales Whisperer"
        subtitle="AI-Powered Sales Coaching"
        iconColor="bg-blue-600"
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Welcome to Sales Whisperer</h2>
          <p className="text-lg text-slate-600">
            Transform your sales calls with AI-powered Challenger methodology coaching
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
            <TranscriptUpload />
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
                  Key coaching recommendations from your latest calls
                </CardDescription>
              </CardHeader>
              <CardContent>
                {stats.completedTranscripts === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-slate-500">Upload and analyze your first call to see insights here</p>
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
                      <p className="font-medium text-slate-900 mb-1">Keep Improving</p>
                      <p className="text-sm text-slate-600">
                        Regular analysis helps identify patterns and accelerate your sales performance.
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
              <CardTitle className="text-xl text-slate-900">Getting Started with Sales Whisperer</CardTitle>
              <CardDescription className="text-slate-600">
                Follow these steps to get the most out of your AI sales coaching platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-white">1</span>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">Upload Your First Call</h4>
                  <p className="text-slate-600 text-sm">
                    Upload a sales call transcript (text, Word, or VTT format) to get started with AI analysis.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-white">2</span>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">Review AI Coaching</h4>
                  <p className="text-slate-600 text-sm">
                    Get instant Challenger Sales methodology scores and personalized coaching recommendations.
                  </p>
                  </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-white">3</span>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">Track Your Progress</h4>
                  <p className="text-slate-600 text-sm">
                    Monitor your improvement over time and build stronger relationships with prospects.
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
