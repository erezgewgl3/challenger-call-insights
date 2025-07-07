
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, AlertTriangle, CheckCircle, Headphones } from 'lucide-react';

interface DateRange {
  from: Date;
  to: Date;
}

interface BusinessIntelligenceReportsProps {
  dateRange: DateRange;
}

interface MetricCardProps {
  title: string;
  value: number;
  format: 'percentage' | 'currency' | 'number';
  trend: 'up' | 'down';
  icon?: React.ComponentType<{ className?: string }>;
}

function MetricCard({ title, value, format, trend, icon: Icon }: MetricCardProps) {
  const formatValue = (val: number, fmt: string) => {
    switch (fmt) {
      case 'percentage': return `${val}%`;
      case 'currency': return `$${val.toLocaleString()}`;
      default: return val.toLocaleString();
    }
  };

  const trendColor = trend === 'up' ? 'text-green-600' : 'text-red-600';
  const trendIcon = trend === 'up' ? '↗' : '↘';
  const bgColor = trend === 'up' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200';

  return (
    <Card className={bgColor}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {Icon && <Icon className="h-4 w-4 text-gray-500" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatValue(value, format)}</div>
        <div className={`text-xs ${trendColor} flex items-center mt-1`}>
          <span className="mr-1">{trendIcon}</span>
          Trending {trend}
        </div>
      </CardContent>
    </Card>
  );
}

const growthProjectionConfig = {
  revenue: { label: "Revenue", color: "#3b82f6" },
  users: { label: "Active Users", color: "#10b981" },
  projection: { label: "Projected Growth", color: "#f59e0b" },
};

export function BusinessIntelligenceReports({ dateRange }: BusinessIntelligenceReportsProps) {
  // Mock business metrics
  const businessMetrics = {
    adoptionRate: 87.3,
    lifetimeValue: 2450,
    churnRate: 3.2,
    featureUtilization: 72.8,
    supportTicketRate: 12
  };

  // Mock revenue projections
  const revenueProjections = [
    { month: 'Jan', revenue: 45000, users: 1200, projection: 1250 },
    { month: 'Feb', revenue: 52000, users: 1350, projection: 1400 },
    { month: 'Mar', revenue: 48000, users: 1280, projection: 1450 },
    { month: 'Apr', revenue: 58000, users: 1420, projection: 1500 },
    { month: 'May', revenue: 61000, users: 1480, projection: 1550 },
    { month: 'Jun', revenue: 67000, users: 1620, projection: 1600 },
  ];

  // Mock customer health data
  const customerHealthScores = [
    { segment: 'Enterprise', score: 92, accounts: 45, risk: 'low' },
    { segment: 'Mid-Market', score: 87, accounts: 128, risk: 'low' },
    { segment: 'Small Business', score: 74, accounts: 267, risk: 'medium' },
    { segment: 'Startup', score: 68, accounts: 156, risk: 'medium' },
  ];

  const getHealthColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'high': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Business KPIs */}
      <div className="grid grid-cols-5 gap-4">
        <MetricCard
          title="Platform Adoption"
          value={businessMetrics.adoptionRate}
          format="percentage"
          trend="up"
          icon={TrendingUp}
        />
        <MetricCard
          title="User Lifetime Value"
          value={businessMetrics.lifetimeValue}
          format="currency"
          trend="up"
          icon={Users}
        />
        <MetricCard
          title="Churn Rate"
          value={businessMetrics.churnRate}
          format="percentage"
          trend="down"
          icon={AlertTriangle}
        />
        <MetricCard
          title="Feature Utilization"
          value={businessMetrics.featureUtilization}
          format="percentage"
          trend="up"
          icon={CheckCircle}
        />
        <MetricCard
          title="Support Ticket Rate"
          value={businessMetrics.supportTicketRate}
          format="number"
          trend="down"
          icon={Headphones}
        />
      </div>

      {/* Revenue and Growth Projections */}
      <Card>
        <CardHeader>
          <CardTitle>Growth Projections & Revenue Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={growthProjectionConfig}>
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={revenueProjections}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar 
                  yAxisId="left" 
                  dataKey="revenue" 
                  fill={growthProjectionConfig.revenue.color}
                  name={growthProjectionConfig.revenue.label}
                  radius={[2, 2, 0, 0]}
                />
                <Line 
                  yAxisId="right" 
                  type="monotone" 
                  dataKey="users" 
                  stroke={growthProjectionConfig.users.color}
                  strokeWidth={2}
                  name={growthProjectionConfig.users.label}
                />
                <Line 
                  yAxisId="right" 
                  type="monotone" 
                  dataKey="projection" 
                  stroke={growthProjectionConfig.projection.color}
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  name={growthProjectionConfig.projection.label}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Customer Health Score Dashboard */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Health Score by Segment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {customerHealthScores.map((segment) => (
              <div key={segment.segment} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div>
                    <h4 className="font-medium">{segment.segment}</h4>
                    <p className="text-sm text-gray-600">{segment.accounts} accounts</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-lg font-semibold">{segment.score}/100</div>
                    <Badge className={getHealthColor(segment.risk)}>
                      {segment.risk} risk
                    </Badge>
                  </div>
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${segment.score}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Usage Pattern Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Pattern Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">68%</div>
              <div className="text-sm text-gray-600">Peak Usage (9-11 AM)</div>
              <Badge variant="outline" className="mt-2">Optimal</Badge>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">4.2x</div>
              <div className="text-sm text-gray-600">Weekly Usage Growth</div>
              <Badge variant="outline" className="mt-2">Strong</Badge>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">89%</div>
              <div className="text-sm text-gray-600">Feature Discovery Rate</div>
              <Badge variant="outline" className="mt-2">Excellent</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
