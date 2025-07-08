
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface TranscriptVolumeData {
  date: string;
  uploads: number;
  processed: number;
  errors: number;
}

interface TranscriptVolumeChartProps {
  data: TranscriptVolumeData[];
  isLoading?: boolean;
}

const chartConfig = {
  uploads: {
    label: "Uploads",
    color: "#3b82f6",
  },
  processed: {
    label: "Processed",
    color: "#10b981",
  },
  errors: {
    label: "Errors",
    color: "#ef4444",
  },
};

export function TranscriptVolumeChart({ data, isLoading = false }: TranscriptVolumeChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transcript Processing Volume</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <LoadingSpinner size="lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transcript Processing Volume</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
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
              <Bar 
                dataKey="uploads" 
                fill={chartConfig.uploads.color}
                name={chartConfig.uploads.label}
                radius={[2, 2, 0, 0]}
              />
              <Bar 
                dataKey="processed" 
                fill={chartConfig.processed.color}
                name={chartConfig.processed.label}
                radius={[2, 2, 0, 0]}
              />
              <Bar 
                dataKey="errors" 
                fill={chartConfig.errors.color}
                name={chartConfig.errors.label}
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
