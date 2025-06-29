
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, TrendingUp, Clock, Target } from 'lucide-react'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import { TranscriptUpload } from '@/components/upload/TranscriptUpload'
import { UploadProgress } from '@/components/upload/UploadProgress'
import { RecentTranscripts } from '@/components/dashboard/RecentTranscripts'
import { AccountSelector } from '@/components/account/AccountSelector'
import { useTranscriptData } from '@/hooks/useTranscriptData'
import { useTranscriptUpload } from '@/hooks/useTranscriptUpload'
import { useAnalysisStatus } from '@/hooks/useAnalysisStatus'
import { AnalysisResultsView } from '@/components/analysis/AnalysisResultsView'
import { useEffect, useState } from 'react'

console.log('🔍 WelcomeDashboard.tsx file loaded')

export default function WelcomeDashboard() {
  console.log('🔍 WelcomeDashboard component rendering')
  
  const { stats, isLoading } = useTranscriptData()
  const { uploadFiles } = useTranscriptUpload()
  const [currentView, setCurrentView] = useState<'dashboard' | 'progress' | 'results'>('dashboard')
  const [currentTranscriptId, setCurrentTranscriptId] = useState<string | null>(null)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  
  // Use analysis status hook to track completion
  const { status: analysisStatus } = useAnalysisStatus(currentTranscriptId || undefined)

  console.log('🔍 Dashboard State:', {
    currentView,
    currentTranscriptId,
    analysisProgress,
    uploadFilesCount: uploadFiles.length,
    analysisStatus: analysisStatus?.status
  })

  // Handle upload state changes
  useEffect(() => {
    console.log('🔍 Upload files effect triggered - Files:', uploadFiles.length)
    
    // Find active uploads (uploading or processing)
    const activeUploads = uploadFiles.filter(f => 
      f.status === 'uploading' || f.status === 'processing'
    )
    
    // Find completed uploads
    const completedUploads = uploadFiles.filter(f => f.status === 'completed')
    
    console.log('🔍 Active uploads:', activeUploads.length)
    console.log('🔍 Completed uploads:', completedUploads.length)

    // Handle new uploads starting
    if (activeUploads.length > 0 && currentView === 'dashboard') {
      const latestUpload = activeUploads[activeUploads.length - 1]
      console.log('🔍 File upload started:', latestUpload.file.name)
      
      setCurrentView('progress')
      setAnalysisProgress(latestUpload.progress || 0)
      
      // If we have a transcript ID from the upload, capture it
      if (latestUpload.transcriptId) {
        console.log('🔍 Capturing transcript ID from upload:', latestUpload.transcriptId)
        setCurrentTranscriptId(latestUpload.transcriptId)
      }
    }

    // Handle upload progress updates
    if (activeUploads.length > 0) {
      const latestUpload = activeUploads[activeUploads.length - 1]
      setAnalysisProgress(latestUpload.progress || 0)
      
      // Capture transcript ID when it becomes available
      if (latestUpload.transcriptId && !currentTranscriptId) {
        console.log('🔍 Transcript ID now available:', latestUpload.transcriptId)
        setCurrentTranscriptId(latestUpload.transcriptId)
      }
    }

    // Handle completed uploads
    if (completedUploads.length > 0 && currentView !== 'results') {
      const latestCompleted = completedUploads[completedUploads.length - 1]
      console.log('🔍 Upload completed for:', latestCompleted.file.name)
      
      if (latestCompleted.transcriptId) {
        console.log('🔍 Transcript ID from completed upload:', latestCompleted.transcriptId)
        setCurrentTranscriptId(latestCompleted.transcriptId)
        setAnalysisProgress(100)
        
        // Brief delay then switch to results
        setTimeout(() => {
          console.log('🔍 Switching to results view for transcript:', latestCompleted.transcriptId)
          setCurrentView('results')
        }, 1500)
      }
    }
  }, [uploadFiles, currentView, currentTranscriptId])

  // Handle analysis status changes
  useEffect(() => {
    console.log('🔍 Analysis status effect:', analysisStatus)
    
    if (analysisStatus && currentTranscriptId) {
      console.log('🔍 Analysis status for transcript:', currentTranscriptId, 'Status:', analysisStatus.status)
      
      if (analysisStatus.status === 'completed' && currentView !== 'results') {
        console.log('🔍 Analysis completed! Switching to results view')
        setCurrentView('results')
        setAnalysisProgress(100)
      } else if (analysisStatus.status === 'processing') {
        console.log('🔍 Analysis in progress, updating progress')
        setAnalysisProgress(analysisStatus.progress || 50)
      }
    }
  }, [analysisStatus, currentTranscriptId, currentView])

  // Handle navigation back to dashboard
  const handleBackToDashboard = () => {
    console.log('🔍 Returning to dashboard')
    setCurrentView('dashboard')
    setCurrentTranscriptId(null)
    setAnalysisProgress(0)
  }

  // Handle upload another
  const handleUploadAnother = () => {
    console.log('🔍 Starting new upload')
    setCurrentView('dashboard')
    setCurrentTranscriptId(null)
    setAnalysisProgress(0)
  }

  // Show results view
  if (currentView === 'results' && currentTranscriptId) {
    console.log('🔍 Rendering results view for transcript:', currentTranscriptId)
    return (
      <AnalysisResultsView 
        transcriptId={currentTranscriptId}
        onBackToDashboard={handleBackToDashboard}
        onUploadAnother={handleUploadAnother}
      />
    )
  }

  // Show progress view
  if (currentView === 'progress') {
    console.log('🔍 Rendering progress view with progress:', analysisProgress)
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex justify-center">
            <UploadProgress
              uploadStatus="processing"
              analysisProgress={analysisProgress}
              error={null}
              estimatedTime="Processing..."
              onRetry={() => {}}
              onUploadAnother={handleUploadAnother}
              fileName={uploadFiles.find(f => f.transcriptId === currentTranscriptId)?.file.name}
              fileSize={uploadFiles.find(f => f.transcriptId === currentTranscriptId)?.file.size}
              fileDuration={uploadFiles.find(f => f.transcriptId === currentTranscriptId)?.metadata?.durationMinutes}
            />
          </div>
        </main>
      </div>
    )
  }

  // Main dashboard view
  console.log('🔍 Rendering main dashboard view')
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
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
