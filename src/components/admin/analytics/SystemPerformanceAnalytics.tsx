
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Activity, Database, Zap, MemoryStick, Cpu, HardDrive } from 'lucide-react';

interface DateRange {
  from: Date;
  to: Date;
}

interface SystemPerformanceAnalyticsProps {
  dateRange: DateRange;
}

interface StatusCardProps {
  title: string;
  status: 'healthy' | 'warning' | 'error' | 'normal' | 'operational';
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
}

function StatusCard({ title, status, value, icon: Icon }: StatusCardProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'healthy':
      case 'operational':
      case 'normal':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getStatusDot = () => {
    switch (status) {
      case 'healthy':
      case 'operational':
      case 'normal':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Card className={getStatusColor()}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="flex items-center space-x-2">
          {Icon && <Icon className="h-4 w-4" />}
          <div className={`w-2 h-2 rounded-full ${getStatusDot()}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-lg font-semibold">{value}</div>
        <Badge variant="outline" className="mt-1 text-xs">
          {status}
        </Badge>
      </CardContent>
    </Card>
  );
}

const responseTimeConfig = {
  p50: { label: "50th Percentile", color: "#3b82f6" },
  p95: { label: "95th Percentile", color: "#ef4444" },
};

const errorRateConfig = {
  errorRate: { label: "Error Rate", color: "#ef4444" },
  threshold: { label: "Alert Threshold", color: "#f59e0b" },
};

export function SystemPerformanceAnalytics({ dateRange }: SystemPerformanceAnalyticsProps) {
  // Mock real-time metrics
  const realTimeMetrics = {
    apiHealth: 'healthy' as const,
    avgResponseTime: 127,
    dbHealth: 'healthy' as const,
    dbConnections: 45,
    aiHealth: 'healthy' as const,
    aiQueueSize: 3,
    memoryStatus: 'normal' as const,
    memoryUsage: 68,
    cpuStatus: 'normal' as const,
    cpuUsage: 34,
    uptime: 99.97
  };

  // Mock performance trend data
  const responseTimeTrend = [
    { timestamp: '2024-01-01T00:00:00Z', p50: 120, p95: 280 },
    { timestamp: '2024-01-01T01:00:00Z', p50: 115, p95: 270 },
    { timestamp: '2024-01-01T02:00:00Z', p50: 130, p95: 290 },
    { timestamp: '2024-01-01T03:00:00Z', p50: 125, p95: 285 },
    { timestamp: '2024-01-01T04:00:00Z', p50: 118, p95: 275 },
    { timestamp: '2024-01-01T05:00:00Z', p50: 127, p95: 282 },
  ];

  const errorTrend = [
    { timestamp: '2024-01-01T00:00:00Z', errorRate: 0.5, threshold: 2.0 },
    { timestamp: '2024-01-01T01:00:00Z', errorRate: 0.3, threshold: 2.0 },
    { timestamp: '2024-01-01T02:00:00Z', errorRate: 0.8, threshold: 2.0 },
    { timestamp: '2024-01-01T03:00:00Z', errorRate: 0.2, threshold: 2.0 },
    { timestamp: '2024-01-01T04:00:00Z', errorRate: 0.6, threshold: 2.0 },
    { timestamp: '2024-01-01T05:00:00Z', errorRate: 0.4, threshold: 2.0 },
  ];

  return (
    <div className="space-y-6">
      {/* Real-time Status Cards */}
      <div className="grid grid-cols-6 gap-4">
        <StatusCard
          title="API Health"
          status={realTimeMetrics.apiHealth}
          value={`${realTimeMetrics.avgResponseTime}ms`}
          icon={Activity}
        />
        <StatusCard
          title="Database"
          status={realTimeMetrics.dbHealth}
          value={`${realTimeMetrics.dbConnections} connections`}
          icon={Database}
        />
        <StatusCard
          title="AI Processing"
          status={realTimeMetrics.aiHealth}
          value={`${realTimeMetrics.aiQueueSize} queued`}
          icon={Zap}
        />
        <StatusCard
          title="Memory Usage"
          status={realTimeMetrics.memoryStatus}
          value={`${realTimeMetrics.memoryUsage}%`}
          icon={MemoryStick}
        />
        <StatusCard
          title="CPU Usage"
          status={realTimeMetrics.cpuStatus}
          value={`${realTimeMetrics.cpuUsage}%`}
          icon={Cpu}
        />
        <StatusCard
          title="Uptime"
          status="operational"
          value={`${realTimeMetrics.uptime}%`}
          icon={HardDrive}
        />
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>API Response Times</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={responseTimeConfig}>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={responseTimeTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="timestamp" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <ChartTooltip 
                    content={<ChartTooltipContent />}
                    labelFormatter={(value) => new Date(value).toLocaleString()}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="p95" 
                    stackId="1" 
                    stroke={responseTimeConfig.p95.color}
                    fill={responseTimeConfig.p95.color}
                    fillOpacity={0.3}
                    name={responseTimeConfig.p95.label}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="p50" 
                    stackId="1" 
                    stroke={responseTimeConfig.p50.color}
                    fill={responseTimeConfig.p50.color}
                    fillOpacity={0.6}
                    name={responseTimeConfig.p50.label}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Error Rate Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={errorRateConfig}>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={errorTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="timestamp" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <ChartTooltip 
                    content={<ChartTooltipContent />}
                    labelFormatter={(value) => new Date(value).toLocaleString()}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="errorRate" 
                    stroke={errorRateConfig.errorRate.color}
                    strokeWidth={2}
                    name={errorRateConfig.errorRate.label}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="threshold" 
                    stroke={errorRateConfig.threshold.color}
                    strokeDasharray="5 5"
                    strokeWidth={2}
                    name={errorRateConfig.threshold.label}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* System Performance Details */}
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>API Endpoint Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="text-sm font-medium">/api/transcript/upload</span>
                <Badge variant="outline">145ms avg</Badge>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="text-sm font-medium">/api/transcript/analyze</span>
                <Badge variant="outline">2.3s avg</Badge>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="text-sm font-medium">/api/auth/login</span>
                <Badge variant="outline">89ms avg</Badge>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="text-sm font-medium">/api/admin/users</span>
                <Badge variant="outline">156ms avg</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent System Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start space-x-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2" />
                <div>
                  <p className="text-sm font-medium">High API Response Time</p>
                  <p className="text-xs text-gray-600">2 minutes ago</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-2 bg-green-50 border border-green-200 rounded">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2" />
                <div>
                  <p className="text-sm font-medium">System Health Check Passed</p>
                  <p className="text-xs text-gray-600">15 minutes ago</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-2 bg-blue-50 border border-blue-200 rounded">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                <div>
                  <p className="text-sm font-medium">Database Maintenance Complete</p>
                  <p className="text-xs text-gray-600">1 hour ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
