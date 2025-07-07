
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

interface AnalysisPerformanceData {
  timestamp: string;
  avgTime: number;
  p95Time: number;
  successRate: number;
}

interface AnalysisPerformanceChartProps {
  data: AnalysisPerformanceData[];
}

const chartConfig = {
  avgTime: {
    label: "Average Time",
    color: "#3b82f6",
  },
  p95Time: {
    label: "95th Percentile",
    color: "#ef4444",
  },
  successRate: {
    label: "Success Rate",
    color: "#10b981",
  },
};

export function AnalysisPerformanceChart({ data }: AnalysisPerformanceChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Analysis Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data}>
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
                dataKey="p95Time" 
                stackId="1" 
                stroke={chartConfig.p95Time.color}
                fill={chartConfig.p95Time.color}
                fillOpacity={0.3}
                name={chartConfig.p95Time.label}
              />
              <Area 
                type="monotone" 
                dataKey="avgTime" 
                stackId="1" 
                stroke={chartConfig.avgTime.color}
                fill={chartConfig.avgTime.color}
                fillOpacity={0.6}
                name={chartConfig.avgTime.label}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
