
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, TrendingUp, Clock, Target } from 'lucide-react'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import { TranscriptUpload } from '@/components/upload/TranscriptUpload'
import { RecentTranscripts } from '@/components/dashboard/RecentTranscripts'
import { AccountSelector } from '@/components/account/AccountSelector'

export default function WelcomeDashboard() {
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
              <div className="text-2xl font-bold text-slate-900">12</div>
              <p className="text-xs text-slate-500 mt-1">+3 this week</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-all duration-200 bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">Avg Teaching Score</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">4.2</div>
              <p className="text-xs text-slate-500 mt-1">+0.3 from last month</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-all duration-200 bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">Avg Call Duration</CardTitle>
              <Clock className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">42m</div>
              <p className="text-xs text-slate-500 mt-1">Optimal range</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500 hover:shadow-lg transition-all duration-200 bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">Active Deals</CardTitle>
              <Target className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">8</div>
              <p className="text-xs text-slate-500 mt-1">3 in negotiation</p>
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
            
            {/* Quick Insights Card */}
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
                <div className="space-y-4">
                  <div className="border-l-4 border-l-blue-500 pl-4">
                    <p className="font-medium text-slate-900 mb-1">Strong Teaching Momentum</p>
                    <p className="text-sm text-slate-600">
                      Your last 3 calls showed excellent insight sharing. Keep challenging assumptions!
                    </p>
                  </div>
                  <div className="border-l-4 border-l-yellow-500 pl-4">
                    <p className="font-medium text-slate-900 mb-1">Improve Tailoring</p>
                    <p className="text-sm text-slate-600">
                      Consider using more customer-specific examples in your next discovery calls.
                    </p>
                  </div>
                  <div className="border-l-4 border-l-green-500 pl-4">
                    <p className="font-medium text-slate-900 mb-1">Great Control</p>
                    <p className="text-sm text-slate-600">
                      You're effectively managing conversation flow and setting clear next steps.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Getting Started Guide - Only show if no transcripts */}
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
      </main>
    </div>
  )
}
