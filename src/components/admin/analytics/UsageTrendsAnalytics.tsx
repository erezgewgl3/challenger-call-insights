
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface DateRange {
  from: Date;
  to: Date;
}

interface UsageTrendsAnalyticsProps {
  dateRange: DateRange;
}

const usageTrendConfig = {
  uploads: { label: "Uploads", color: "#3b82f6" },
  analyses: { label: "Analyses", color: "#10b981" },
  exports: { label: "Exports", color: "#f59e0b" },
};

const deviceTypeColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export function UsageTrendsAnalytics({ dateRange }: UsageTrendsAnalyticsProps) {
  // Mock usage trend data
  const usageTrends = [
    { date: '2024-01-01', uploads: 245, analyses: 198, exports: 67 },
    { date: '2024-01-02', uploads: 289, analyses: 234, exports: 89 },
    { date: '2024-01-03', uploads: 234, analyses: 187, exports: 56 },
    { date: '2024-01-04', uploads: 312, analyses: 267, exports: 78 },
    { date: '2024-01-05', uploads: 278, analyses: 223, exports: 92 },
    { date: '2024-01-06', uploads: 345, analyses: 289, exports: 105 },
  ];

  const hourlyUsage = [
    { hour: '00:00', usage: 12 },
    { hour: '03:00', usage: 8 },
    { hour: '06:00', usage: 23 },
    { hour: '09:00', usage: 156 },
    { hour: '12:00', usage: 89 },
    { hour: '15:00', usage: 134 },
    { hour: '18:00', usage: 67 },
    { hour: '21:00', usage: 34 },
  ];

  const deviceTypes = [
    { name: 'Desktop', value: 68, users: 847 },
    { name: 'Mobile', value: 23, users: 287 },
    { name: 'Tablet', value: 9, users: 112 },
  ];

  const featurePopularity = [
    { feature: 'Transcript Upload', usage: 95, trend: 'up' },
    { feature: 'AI Analysis', usage: 87, trend: 'up' },
    { feature: 'Email Follow-up', usage: 72, trend: 'stable' },
    { feature: 'Account Management', usage: 64, trend: 'up' },
    { feature: 'PDF Export', usage: 45, trend: 'down' },
    { feature: 'Team Collaboration', usage: 28, trend: 'up' },
  ];

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return '↗️';
      case 'down': return '↘️';
      default: return '→';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Usage Overview Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8,947</div>
            <div className="text-xs text-green-600 flex items-center mt-1">
              ↗ +12.3% from last week
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Peak Hour</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">9-11 AM</div>
            <div className="text-xs text-gray-600 mt-1">
              156 avg actions/hour
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Most Used Feature</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">Transcript Upload</div>
            <div className="text-xs text-gray-600 mt-1">
              95% adoption rate
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Primary Device</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">Desktop</div>
            <div className="text-xs text-gray-600 mt-1">
              68% of all sessions
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usage Trends Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Usage Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={usageTrendConfig}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={usageTrends}>
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
                  dataKey="uploads" 
                  stroke={usageTrendConfig.uploads.color}
                  strokeWidth={2}
                  name={usageTrendConfig.uploads.label}
                />
                <Line 
                  type="monotone" 
                  dataKey="analyses" 
                  stroke={usageTrendConfig.analyses.color}
                  strokeWidth={2}
                  name={usageTrendConfig.analyses.label}
                />
                <Line 
                  type="monotone" 
                  dataKey="exports" 
                  stroke={usageTrendConfig.exports.color}
                  strokeWidth={2}
                  name={usageTrendConfig.exports.label}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Hourly Usage Pattern and Device Types */}
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Hourly Usage Pattern</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ usage: { label: "Usage", color: "#3b82f6" } }}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={hourlyUsage}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar 
                    dataKey="usage" 
                    fill="#3b82f6"
                    radius={[2, 2, 0, 0]}
                    name="Actions"
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Device Usage Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={deviceTypes}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {deviceTypes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={deviceTypeColors[index % deviceTypeColors.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-2 border rounded shadow">
                            <p className="font-medium">{data.name}</p>
                            <p className="text-sm">{data.value}% ({data.users} users)</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-4">
              {deviceTypes.map((device, index) => (
                <div key={device.name} className="text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: deviceTypeColors[index] }}
                    />
                    <span className="text-sm font-medium">{device.name}</span>
                  </div>
                  <div className="text-xs text-gray-600">{device.value}%</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feature Popularity */}
      <Card>
        <CardHeader>
          <CardTitle>Feature Popularity & Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {featurePopularity.map((feature) => (
              <div key={feature.feature} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div>
                    <h4 className="font-medium">{feature.feature}</h4>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">{feature.usage}% adoption</span>
                      <span className={`text-sm ${getTrendColor(feature.trend)}`}>
                        {getTrendIcon(feature.trend)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${feature.usage}%` }}
                    />
                  </div>
                  <Badge 
                    variant="outline" 
                    className={
                      feature.trend === 'up' ? 'border-green-200 text-green-600' :
                      feature.trend === 'down' ? 'border-red-200 text-red-600' :
                      'border-gray-200 text-gray-600'
                    }
                  >
                    {feature.trend}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
