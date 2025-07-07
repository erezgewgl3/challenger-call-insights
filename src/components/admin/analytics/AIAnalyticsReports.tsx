
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Brain, CheckCircle, Clock, DollarSign } from 'lucide-react';

interface DateRange {
  from: Date;
  to: Date;
}

interface AIAnalyticsReportsProps {
  dateRange: DateRange;
}

interface MetricCardProps {
  title: string;
  value: number;
  change: number;
  format: 'number' | 'percentage' | 'duration' | 'currency';
  icon?: React.ComponentType<{ className?: string }>;
}

function MetricCard({ title, value, change, format, icon: Icon }: MetricCardProps) {
  const formatValue = (val: number, fmt: string) => {
    switch (fmt) {
      case 'percentage': return `${val}%`;
      case 'duration': return `${val}s`;
      case 'currency': return `$${val.toFixed(2)}`;
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

const dailyVolumeConfig = {
  openai: { label: "OpenAI", color: "#3b82f6" },
  claude: { label: "Claude", color: "#10b981" },
};

const qualityScoreConfig = {
  teaching: { label: "Teaching", color: "#3b82f6" },
  tailoring: { label: "Tailoring", color: "#10b981" },
  control: { label: "Control", color: "#f59e0b" },
};

export function AIAnalyticsReports({ dateRange }: AIAnalyticsReportsProps) {
  // Mock AI metrics data
  const aiMetrics = {
    totalAnalyses: 3847,
    analysesChange: 15.3,
    successRate: 96.8,
    successChange: 2.1,
    avgProcessingTime: 23.5,
    timeChange: -8.2,
    providerStats: {
      openai: {
        successRate: 97.2,
        avgTime: 22.1,
        costPerAnalysis: 0.045
      },
      claude: {
        successRate: 96.4,
        avgTime: 25.8,
        costPerAnalysis: 0.038
      }
    }
  };

  const costAnalysis = {
    totalCost: 173.25,
    costChange: 12.7
  };

  const dailyVolume = [
    { date: '2024-01-01', openai: 145, claude: 128 },
    { date: '2024-01-02', openai: 167, claude: 142 },
    { date: '2024-01-03', openai: 189, claude: 156 },
    { date: '2024-01-04', openai: 178, claude: 161 },
    { date: '2024-01-05', openai: 195, claude: 173 },
    { date: '2024-01-06', openai: 203, claude: 185 },
  ];

  const scoreTrends = [
    { date: '2024-01-01', teaching: 3.8, tailoring: 3.6, control: 4.1 },
    { date: '2024-01-02', teaching: 3.9, tailoring: 3.7, control: 4.0 },
    { date: '2024-01-03', teaching: 4.0, tailoring: 3.8, control: 4.2 },
    { date: '2024-01-04', teaching: 3.9, tailoring: 3.9, control: 4.1 },
    { date: '2024-01-05', teaching: 4.1, tailoring: 4.0, control: 4.3 },
    { date: '2024-01-06', teaching: 4.0, tailoring: 3.9, control: 4.2 },
  ];

  return (
    <div className="space-y-6">
      {/* AI Performance Overview */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          title="Total Analyses"
          value={aiMetrics.totalAnalyses}
          change={aiMetrics.analysesChange}
          format="number"
          icon={Brain}
        />
        <MetricCard
          title="Success Rate"
          value={aiMetrics.successRate}
          change={aiMetrics.successChange}
          format="percentage"
          icon={CheckCircle}
        />
        <MetricCard
          title="Avg Processing Time"
          value={aiMetrics.avgProcessingTime}
          change={aiMetrics.timeChange}
          format="duration"
          icon={Clock}
        />
        <MetricCard
          title="Monthly AI Cost"
          value={costAnalysis.totalCost}
          change={costAnalysis.costChange}
          format="currency"
          icon={DollarSign}
        />
      </div>

      {/* AI Provider Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>AI Provider Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-2" />
                OpenAI GPT-4
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Success Rate</span>
                  <Badge variant="outline">{aiMetrics.providerStats.openai.successRate}%</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Avg Response Time</span>
                  <Badge variant="outline">{aiMetrics.providerStats.openai.avgTime}s</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Cost per Analysis</span>
                  <Badge variant="outline">${aiMetrics.providerStats.openai.costPerAnalysis}</Badge>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="font-medium flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2" />
                Anthropic Claude
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Success Rate</span>
                  <Badge variant="outline">{aiMetrics.providerStats.claude.successRate}%</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Avg Response Time</span>
                  <Badge variant="outline">{aiMetrics.providerStats.claude.avgTime}s</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Cost per Analysis</span>
                  <Badge variant="outline">${aiMetrics.providerStats.claude.costPerAnalysis}</Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Processing Volume and Quality Charts */}
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Daily Processing Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={dailyVolumeConfig}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dailyVolume}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar 
                    dataKey="openai" 
                    fill={dailyVolumeConfig.openai.color}
                    name={dailyVolumeConfig.openai.label}
                    radius={[2, 2, 0, 0]}
                  />
                  <Bar 
                    dataKey="claude" 
                    fill={dailyVolumeConfig.claude.color}
                    name={dailyVolumeConfig.claude.label}
                    radius={[2, 2, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quality Score Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={qualityScoreConfig}>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={scoreTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <YAxis domain={[0, 5]} tick={{ fontSize: 12 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line 
                    type="monotone" 
                    dataKey="teaching" 
                    stroke={qualityScoreConfig.teaching.color}
                    strokeWidth={2}
                    name={qualityScoreConfig.teaching.label}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="tailoring" 
                    stroke={qualityScoreConfig.tailoring.color}
                    strokeWidth={2}
                    name={qualityScoreConfig.tailoring.label}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="control" 
                    stroke={qualityScoreConfig.control.color}
                    strokeWidth={2}
                    name={qualityScoreConfig.control.label}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Cost Analysis Section */}
      <Card>
        <CardHeader>
          <CardTitle>AI Cost Analysis & Budget Tracking</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">$173.25</div>
              <div className="text-sm text-gray-600">Monthly Spend</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">$0.041</div>
              <div className="text-sm text-gray-600">Avg Cost/Analysis</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">58%</div>
              <div className="text-sm text-gray-600">Budget Utilized</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
