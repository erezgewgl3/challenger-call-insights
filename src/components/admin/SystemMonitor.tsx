
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { Activity, Zap, Database, Clock } from 'lucide-react'
import { useRealUsageData, useRealUsageSummary } from '@/hooks/useRealUsageData'

const chartConfig = {
  prompts: {
    label: 'Prompts Created',
    color: 'hsl(var(--chart-1))'
  },
  analyses: {
    label: 'AI Analyses',
    color: 'hsl(var(--chart-2))'  
  },
  users: {
    label: 'Active Users',
    color: 'hsl(var(--chart-3))'
  }
}

export function SystemMonitor() {
  const { data: usageData = [], isLoading: usageLoading } = useRealUsageData(7)
  const { data: usageSummary, isLoading: summaryLoading } = useRealUsageSummary()

  return (
    <div className="space-y-6">
      <Tabs defaultValue="usage" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="usage">Usage Analytics</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="realtime">Real-time</TabsTrigger>
        </TabsList>

        <TabsContent value="usage" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Prompts</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {summaryLoading ? (
                  <div className="animate-pulse">
                    <div className="h-8 bg-slate-200 rounded w-20 mb-2" />
                    <div className="h-3 bg-slate-200 rounded w-32" />
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold">{usageSummary?.totalPrompts || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      +{usageSummary?.promptGrowth || 0}% from last week
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">AI Analyses</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {summaryLoading ? (
                  <div className="animate-pulse">
                    <div className="h-8 bg-slate-200 rounded w-20 mb-2" />
                    <div className="h-3 bg-slate-200 rounded w-32" />
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold">{usageSummary?.totalAnalyses || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      +{usageSummary?.analysisGrowth || 0}% from last week
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {summaryLoading ? (
                  <div className="animate-pulse">
                    <div className="h-8 bg-slate-200 rounded w-20 mb-2" />
                    <div className="h-3 bg-slate-200 rounded w-32" />
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold">{usageSummary?.activeUsers || 0}</div>
                    <p className="text-xs text-muted-foreground">This week</p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Usage Trends</CardTitle>
              <CardDescription>Weekly activity overview</CardDescription>
            </CardHeader>
            <CardContent>
              {usageLoading ? (
                <div className="h-[300px] flex items-center justify-center">
                  <div className="animate-pulse text-slate-400">Loading usage data...</div>
                </div>
              ) : (
                <ChartContainer config={chartConfig} className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={usageData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line type="monotone" dataKey="prompts" stroke="var(--color-prompts)" strokeWidth={2} />
                      <Line type="monotone" dataKey="analyses" stroke="var(--color-analyses)" strokeWidth={2} />
                      <Line type="monotone" dataKey="users" stroke="var(--color-users)" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card className="p-6">
            <div className="text-center text-slate-500">
              <Clock className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <h3 className="text-lg font-semibold mb-2">Performance Metrics Coming Soon</h3>
              <p className="text-sm">
                Detailed performance metrics will be available in a future update.
              </p>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="realtime" className="space-y-4">
          <Card className="p-6">
            <div className="text-center text-slate-500">
              <Activity className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <h3 className="text-lg font-semibold mb-2">Real-time Monitoring Coming Soon</h3>
              <p className="text-sm">
                Live system monitoring will be available in a future update.
              </p>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
