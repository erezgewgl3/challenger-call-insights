
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Users, TrendingUp, Clock, Target } from 'lucide-react';

interface DateRange {
  from: Date;
  to: Date;
}

interface UserEngagementAnalyticsProps {
  dateRange: DateRange;
}

interface MetricCardProps {
  title: string;
  value: number;
  change: number;
  format: 'number' | 'percentage' | 'duration' | 'score';
  icon?: React.ComponentType<{ className?: string }>;
}

function MetricCard({ title, value, change, format, icon: Icon }: MetricCardProps) {
  const formatValue = (val: number, fmt: string) => {
    switch (fmt) {
      case 'percentage': return `${val}%`;
      case 'duration': return `${Math.floor(val / 60)}m ${val % 60}s`;
      case 'score': return `${val.toFixed(1)}/5`;
      default: return val.toLocaleString();
    }
  };

  const changeColor = change >= 0 ? 'text-green-600' : 'text-red-600';
  const changeIcon = change >= 0 ? '↗' : '↘';

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {Icon && <Icon className="h-4 w-4 text-gray-500" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatValue(value, format)}</div>
        <div className={`text-xs ${changeColor} flex items-center mt-1`}>
          <span className="mr-1">{changeIcon}</span>
          {Math.abs(change)}% from last period
        </div>
      </CardContent>
    </Card>
  );
}

const chartConfig = {
  dau: { label: "Daily Active", color: "#3b82f6" },
  wau: { label: "Weekly Active", color: "#10b981" },
  mau: { label: "Monthly Active", color: "#f59e0b" },
};

export function UserEngagementAnalytics({ dateRange }: UserEngagementAnalyticsProps) {
  // Mock data - replace with actual API calls
  const engagementMetrics = {
    dailyActiveUsers: 1247,
    dauChange: 12.5,
    retentionRate: 78.3,
    retentionChange: 5.2,
    avgSessionDuration: 1680, // seconds
    sessionChange: -3.1,
    engagementScore: 4.2,
    scoreChange: 8.7
  };

  const activityTrend = [
    { date: '2024-01-01', dau: 1100, wau: 4200, mau: 15300 },
    { date: '2024-01-02', dau: 1150, wau: 4350, mau: 15400 },
    { date: '2024-01-03', dau: 1200, wau: 4400, mau: 15500 },
    { date: '2024-01-04', dau: 1180, wau: 4380, mau: 15450 },
    { date: '2024-01-05', dau: 1220, wau: 4450, mau: 15600 },
    { date: '2024-01-06', dau: 1247, wau: 4500, mau: 15700 },
  ];

  const featureUsage = [
    { name: 'Transcript Upload', adoption: 89, users: 1112 },
    { name: 'AI Analysis', adoption: 76, users: 948 },
    { name: 'Email Follow-up', adoption: 65, users: 811 },
    { name: 'Account Management', adoption: 58, users: 723 },
    { name: 'Export Reports', adoption: 34, users: 424 },
  ];

  return (
    <div className="space-y-6">
      {/* Key Engagement Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          title="Daily Active Users"
          value={engagementMetrics.dailyActiveUsers}
          change={engagementMetrics.dauChange}
          format="number"
          icon={Users}
        />
        <MetricCard
          title="User Retention (30d)"
          value={engagementMetrics.retentionRate}
          change={engagementMetrics.retentionChange}
          format="percentage"
          icon={TrendingUp}
        />
        <MetricCard
          title="Avg Session Duration"
          value={engagementMetrics.avgSessionDuration}
          change={engagementMetrics.sessionChange}
          format="duration"
          icon={Clock}
        />
        <MetricCard
          title="Engagement Score"
          value={engagementMetrics.engagementScore}
          change={engagementMetrics.scoreChange}
          format="score"
          icon={Target}
        />
      </div>

      {/* Engagement Charts */}
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>User Activity Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig}>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={activityTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line 
                    type="monotone" 
                    dataKey="dau" 
                    stroke={chartConfig.dau.color}
                    strokeWidth={2}
                    name={chartConfig.dau.label}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="wau" 
                    stroke={chartConfig.wau.color}
                    strokeWidth={2}
                    name={chartConfig.wau.label}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="mau" 
                    stroke={chartConfig.mau.color}
                    strokeWidth={2}
                    name={chartConfig.mau.label}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Feature Adoption Rates</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ adoption: { label: "Adoption Rate", color: "#3b82f6" } }}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={featureUsage} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} />
                  <ChartTooltip 
                    content={<ChartTooltipContent />}
                    formatter={(value, name, props) => [
                      `${value}% (${props.payload.users} users)`,
                      'Adoption Rate'
                    ]}
                  />
                  <Bar dataKey="adoption" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Feature Usage Details */}
      <Card>
        <CardHeader>
          <CardTitle>Feature Usage Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {featureUsage.map((feature) => (
              <div key={feature.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium">{feature.name}</h4>
                  <p className="text-sm text-gray-600">{feature.users} users</p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${feature.adoption}%` }}
                    />
                  </div>
                  <Badge variant="outline">{feature.adoption}%</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
