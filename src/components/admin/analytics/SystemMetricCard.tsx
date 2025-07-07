
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LucideIcon } from 'lucide-react';

interface SystemMetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'neutral' | 'stable';
  icon: LucideIcon;
  uptime?: number;
}

export function SystemMetricCard({ 
  title, 
  value, 
  change, 
  trend = 'neutral', 
  icon: Icon, 
  uptime 
}: SystemMetricCardProps) {
  const getTrendColor = () => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      case 'stable': return 'text-blue-600';
      default: return 'text-slate-600';
    }
  };

  const getTrendBackground = () => {
    switch (trend) {
      case 'up': return 'bg-green-50 border-green-200';
      case 'down': return 'bg-red-50 border-red-200';
      case 'stable': return 'bg-blue-50 border-blue-200';
      default: return 'bg-slate-50 border-slate-200';
    }
  };

  return (
    <Card className={`${getTrendBackground()} hover:shadow-md transition-shadow`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-700">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${getTrendColor()}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-slate-900">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        <div className="flex items-center justify-between mt-1">
          {change !== undefined && (
            <div className={`text-xs ${getTrendColor()}`}>
              {change > 0 ? '+' : ''}{change}%
            </div>
          )}
          {uptime !== undefined && (
            <Badge variant="outline" className="text-xs">
              {uptime}% uptime
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
