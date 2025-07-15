
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Users, MessageSquare, Settings, Activity, BarChart3, TrendingUp, Shield } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { SystemMonitor } from '@/components/admin/SystemMonitor'
import { SystemMetricCard } from '@/components/admin/analytics/SystemMetricCard'
import { UserGrowthChart } from '@/components/admin/analytics/UserGrowthChart'
import { TranscriptVolumeChart } from '@/components/admin/analytics/TranscriptVolumeChart'
import { AnalysisPerformanceChart } from '@/components/admin/analytics/AnalysisPerformanceChart'
import { RecentActivityFeed } from '@/components/admin/analytics/RecentActivityFeed'
import { AnalyticsCard } from '@/components/admin/AnalyticsCard'
import { RegistrationFailuresCard } from '@/components/admin/system/RegistrationFailuresCard'
import { RegistrationFailuresTable } from '@/components/admin/system/RegistrationFailuresTable'
import { SystemHealthActions } from '@/components/admin/system/SystemHealthActions'
import { useSystemMetrics } from '@/hooks/useSystemMetrics'
import { useUserGrowthData, useTranscriptVolumeData, useAnalysisPerformanceData } from '@/hooks/useChartData'

export default function AdminDashboard() {
  const { data: systemMetrics, isLoading } = useSystemMetrics();
  const { data: userGrowthData, isLoading: userGrowthLoading } = useUserGrowthData(6);
  const { data: transcriptVolumeData, isLoading: transcriptVolumeLoading } = useTranscriptVolumeData(6);
  const { data: analysisPerformanceData, isLoading: analysisPerformanceLoading } = useAnalysisPerformanceData(24);

  return (
    <AdminLayout>
      <div className="p-8 bg-gradient-to-br from-slate-50 to-gray-100 min-h-full">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Admin Dashboard</h2>
          <p className="text-lg text-slate-600">
            Real-time system overview and performance metrics
          </p>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span>Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="system-health" className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>System Health</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            {/* Real-time Analytics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
              <AnalyticsCard
                title="Total Users"
                value={systemMetrics?.totalUsers || 0}
                description={`${systemMetrics?.newUsersThisWeek || 0} new this week`}
                icon={Users}
                isLoading={isLoading}
                trend={systemMetrics?.userGrowthTrend}
              />
              
              <AnalyticsCard
                title="Active Prompts"
                value={systemMetrics?.activePrompts || 0}
                description="System prompts active"
                icon={MessageSquare}
                isLoading={isLoading}
              />
              
              <AnalyticsCard
                title="Analyses Today"
                value={systemMetrics?.analysesToday || 0}
                description={`${systemMetrics?.analysesThisMonth || 0} this month`}
                icon={Activity}
                isLoading={isLoading}
                trend={systemMetrics?.analysesTrend}
              />
              
              <AnalyticsCard
                title="System Health"
                value="Operational"
                description={`${systemMetrics?.uptime || 99.9}% uptime`}
                icon={Settings}
                isLoading={isLoading}
                status={systemMetrics?.systemStatus || 'healthy'}
              />

            </div>

            {/* Interactive Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <UserGrowthChart 
                data={userGrowthData || []} 
                isLoading={userGrowthLoading}
              />
              <TranscriptVolumeChart 
                data={transcriptVolumeData || []} 
                isLoading={transcriptVolumeLoading}
              />
              <AnalysisPerformanceChart 
                data={analysisPerformanceData || []} 
                isLoading={analysisPerformanceLoading}
              />
              
              {/* Management Cards */}
              <Card className="hover:shadow-xl transition-all duration-300 border-0 shadow-md bg-white">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-3 text-xl text-slate-900">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <MessageSquare className="h-6 w-6 text-indigo-600" />
                    </div>
                    <span>AI Prompt Management</span>
                  </CardTitle>
                  <CardDescription className="text-slate-600 text-base">
                    Manage and version control AI coaching prompts for different analysis types
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-slate-600 mb-6 leading-relaxed">Create, edit, and version AI prompts with full audit trails.</p>
                  <div className="space-y-2 mb-6">
                    <div className="flex items-center text-sm text-slate-600">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></div>
                      <span>Create custom prompts for different sales scenarios</span>
                    </div>
                    <div className="flex items-center text-sm text-slate-600">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></div>
                      <span>Version control and rollback capabilities</span>
                    </div>
                    <div className="flex items-center text-sm text-slate-600">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></div>
                      <span>Variable insertion for dynamic content</span>
                    </div>
                  </div>
                  <Link to="/admin/prompts">
                    <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-md transition-all duration-200 hover:shadow-lg">
                      Manage Prompts
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity Feed */}
            <RecentActivityFeed limit={10} />

            {/* System Status */}
            <Card className="shadow-md hover:shadow-lg transition-all duration-200 bg-white mt-6">
              <CardHeader>
                <CardTitle className="text-xl text-slate-900">System Status</CardTitle>
                <CardDescription className="text-slate-600">
                  Current system information and health indicators
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100">
                    <div className="text-3xl font-bold text-green-600 mb-2">✓</div>
                    <p className="text-sm font-semibold text-green-800 mb-1">Database</p>
                    <p className="text-xs text-green-600">Connected</p>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100">
                    <div className="text-3xl font-bold text-green-600 mb-2">✓</div>
                    <p className="text-sm font-semibold text-green-800 mb-1">Authentication</p>
                    <p className="text-xs text-green-600">Active</p>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100">
                    <div className="text-3xl font-bold text-green-600 mb-2">✓</div>
                    <p className="text-sm font-semibold text-green-800 mb-1">Prompt System</p>
                    <p className="text-xs text-green-600">Active</p>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl border border-indigo-100">
                    <div className="text-3xl font-bold text-indigo-600 mb-2">i</div>
                    <p className="text-sm font-semibold text-indigo-800 mb-1">AI Services</p>
                    <p className="text-xs text-indigo-600">Ready for setup</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <Card className="shadow-md hover:shadow-lg transition-all duration-200 bg-white">
              <CardHeader>
                <CardTitle className="text-xl text-slate-900">System Analytics & Monitoring</CardTitle>
                <CardDescription className="text-slate-600">
                  Comprehensive insights into system usage, performance, and real-time metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SystemMonitor />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system-health">
            <div className="space-y-6">
              {/* System Health Overview */}
              <Card className="shadow-md hover:shadow-lg transition-all duration-200 bg-white">
                <CardHeader>
                  <CardTitle className="text-xl text-slate-900 flex items-center space-x-2">
                    <Shield className="h-5 w-5 text-blue-600" />
                    <span>System Health & Monitoring</span>
                  </CardTitle>
                  <CardDescription className="text-slate-600">
                    Monitor and manage system health, registration issues, and automated repairs
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                      <RegistrationFailuresTable />
                    </div>
                    <div>
                      <SystemHealthActions />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  )
}
