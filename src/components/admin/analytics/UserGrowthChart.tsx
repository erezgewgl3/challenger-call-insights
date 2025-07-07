
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

interface UserGrowthData {
  date: string;
  totalUsers: number;
  newUsers: number;
  activeUsers: number;
}

interface UserGrowthChartProps {
  data: UserGrowthData[];
}

const chartConfig = {
  totalUsers: {
    label: "Total Users",
    color: "#3b82f6",
  },
  newUsers: {
    label: "New Users",
    color: "#10b981",
  },
  activeUsers: {
    label: "Active Users",
    color: "#f59e0b",
  },
};

export function UserGrowthChart({ data }: UserGrowthChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>User Growth Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <ChartTooltip 
                content={<ChartTooltipContent />}
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <Line 
                type="monotone" 
                dataKey="totalUsers" 
                stroke={chartConfig.totalUsers.color}
                strokeWidth={2}
                dot={{ r: 4 }}
                name={chartConfig.totalUsers.label}
              />
              <Line 
                type="monotone" 
                dataKey="newUsers" 
                stroke={chartConfig.newUsers.color}
                strokeWidth={2}
                dot={{ r: 4 }}
                name={chartConfig.newUsers.label}
              />
              <Line 
                type="monotone" 
                dataKey="activeUsers" 
                stroke={chartConfig.activeUsers.color}
                strokeWidth={2}
                dot={{ r: 4 }}
                name={chartConfig.activeUsers.label}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
