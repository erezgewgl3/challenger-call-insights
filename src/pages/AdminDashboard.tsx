import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Users, MessageSquare, Settings, Activity, BarChart3, TrendingUp } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { SystemMonitor } from '@/components/admin/SystemMonitor'
import { SystemMetricCard } from '@/components/admin/analytics/SystemMetricCard'
import { UserGrowthChart } from '@/components/admin/analytics/UserGrowthChart'
import { TranscriptVolumeChart } from '@/components/admin/analytics/TranscriptVolumeChart'
import { AnalysisPerformanceChart } from '@/components/admin/analytics/AnalysisPerformanceChart'
import { RecentActivityFeed } from '@/components/admin/analytics/RecentActivityFeed'

export default function AdminDashboard() {
  // Mock data for real-time metrics - replace with actual API calls
  const systemMetrics = {
    totalUsers: 1247,
    userGrowth: 12.5,
    activePrompts: 2,
    promptChanges: 0,
    analysesToday: 89,
    analysisGrowth: 15.3
  };

  const performanceData = {
    uptime: 99.97
  };

  // Mock chart data
  const userGrowthData = [
    { date: '2024-01-01', totalUsers: 1100, newUsers: 45, activeUsers: 890 },
    { date: '2024-01-02', totalUsers: 1145, newUsers: 52, activeUsers: 920 },
    { date: '2024-01-03', totalUsers: 1197, newUsers: 48, activeUsers: 945 },
    { date: '2024-01-04', totalUsers: 1245, newUsers: 38, activeUsers: 967 },
    { date: '2024-01-05', totalUsers: 1283, newUsers: 42, activeUsers: 985 },
    { date: '2024-01-06', totalUsers: 1325, newUsers: 55, activeUsers: 1012 },
  ];

  const transcriptVolumeData = [
    { date: '2024-01-01', uploads: 145, processed: 142, errors: 3 },
    { date: '2024-01-02', uploads: 189, processed: 185, errors: 4 },
    { date: '2024-01-03', uploads: 156, processed: 153, errors: 3 },
    { date: '2024-01-04', uploads: 203, processed: 199, errors: 4 },
    { date: '2024-01-05', uploads: 178, processed: 175, errors: 3 },
    { date: '2024-01-06', uploads: 221, processed: 218, errors: 3 },
  ];

  const analysisPerformanceData = [
    { timestamp: '2024-01-01T00:00:00Z', avgTime: 22.5, p95Time: 45.2, successRate: 96.8 },
    { timestamp: '2024-01-01T04:00:00Z', avgTime: 21.8, p95Time: 42.1, successRate: 97.2 },
    { timestamp: '2024-01-01T08:00:00Z', avgTime: 24.3, p95Time: 48.7, successRate: 96.5 },
    { timestamp: '2024-01-01T12:00:00Z', avgTime: 23.1, p95Time: 46.8, successRate: 97.0 },
    { timestamp: '2024-01-01T16:00:00Z', avgTime: 22.9, p95Time: 44.5, successRate: 96.9 },
    { timestamp: '2024-01-01T20:00:00Z', avgTime: 21.5, p95Time: 41.8, successRate: 97.3 },
  ];

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
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span>Analytics</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <SystemMetricCard
                title="Total Users"
                value={systemMetrics.totalUsers}
                change={systemMetrics.userGrowth}
                trend="up"
                icon={Users}
              />
              <SystemMetricCard
                title="Active Prompts"
                value={systemMetrics.activePrompts}
                change={systemMetrics.promptChanges}
                trend="neutral"
                icon={MessageSquare}
              />
              <SystemMetricCard
                title="Analyses Today"
                value={systemMetrics.analysesToday}
                change={systemMetrics.analysisGrowth}
                trend="up"
                icon={Activity}
              />
              <SystemMetricCard
                title="System Health"
                value="Operational"
                uptime={performanceData.uptime}
                trend="stable"
                icon={Settings}
              />
            </div>

            {/* Interactive Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <UserGrowthChart data={userGrowthData} />
              <TranscriptVolumeChart data={transcriptVolumeData} />
              <AnalysisPerformanceChart data={analysisPerformanceData} />
              
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
        </Tabs>
      </div>
    </AdminLayout>
  )
}
