
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { Activity, Zap, Database, Clock } from 'lucide-react'
import { useState, useEffect } from 'react'

// Mock data for analytics - in real implementation, this would come from API
const usageData = [
  { date: '2025-06-21', prompts: 12, analyses: 45, users: 8 },
  { date: '2025-06-22', prompts: 15, analyses: 52, users: 12 },
  { date: '2025-06-23', prompts: 18, analyses: 38, users: 10 },
  { date: '2025-06-24', prompts: 22, analyses: 61, users: 15 },
  { date: '2025-06-25', prompts: 19, analyses: 47, users: 11 },
  { date: '2025-06-26', prompts: 25, analyses: 73, users: 18 },
  { date: '2025-06-27', prompts: 28, analyses: 89, users: 22 }
]

const performanceData = [
  { metric: 'API Response Time', value: '245ms', status: 'good' },
  { metric: 'AI Processing Time', value: '1.2s', status: 'good' },
  { metric: 'Database Query Time', value: '85ms', status: 'excellent' },
  { metric: 'Error Rate', value: '0.02%', status: 'excellent' }
]

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
  const [realTimeStats, setRealTimeStats] = useState({
    activeUsers: 12,
    runningAnalyses: 3,
    queuedJobs: 0,
    systemLoad: 67
  })

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      setRealTimeStats(prev => ({
        activeUsers: prev.activeUsers + Math.floor(Math.random() * 3) - 1,
        runningAnalyses: Math.max(0, prev.runningAnalyses + Math.floor(Math.random() * 3) - 1),
        queuedJobs: Math.max(0, prev.queuedJobs + Math.floor(Math.random() * 2) - 1),
        systemLoad: Math.min(100, Math.max(0, prev.systemLoad + Math.floor(Math.random() * 10) - 5))
      }))
    }, 5000)

    return () => clearInterval(interval)
  }, [])

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
                <div className="text-2xl font-bold">147</div>
                <p className="text-xs text-muted-foreground">+12% from last week</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">AI Analyses</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2,891</div>
                <p className="text-xs text-muted-foreground">+18% from last week</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">64</div>
                <p className="text-xs text-muted-foreground">+5% from last week</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Usage Trends</CardTitle>
              <CardDescription>Weekly activity overview</CardDescription>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {performanceData.map((item) => (
              <Card key={`perf-${item.metric}`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{item.metric}</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{item.value}</div>
                  <Badge variant={item.status === 'excellent' ? 'default' : 'secondary'} className="mt-2">
                    {item.status === 'excellent' ? 'Excellent' : 'Good'}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="realtime" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{realTimeStats.activeUsers}</div>
                <p className="text-xs text-muted-foreground">Currently online</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Running Analyses</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{realTimeStats.runningAnalyses}</div>
                <p className="text-xs text-muted-foreground">Processing now</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Queued Jobs</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{realTimeStats.queuedJobs}</div>
                <p className="text-xs text-muted-foreground">Waiting to process</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Load</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{realTimeStats.systemLoad}%</div>
                <p className="text-xs text-muted-foreground">Current utilization</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
