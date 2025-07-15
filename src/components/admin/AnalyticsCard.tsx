
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface AnalyticsCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  isLoading?: boolean;
  trend?: 'up' | 'down' | 'neutral';
  status?: 'healthy' | 'warning' | 'error';
  secondaryMetrics?: Array<{
    label: string;
    value: string | number;
    icon?: React.ComponentType<{ className?: string }>;
    color?: string;
  }>;
}

export const AnalyticsCard: React.FC<AnalyticsCardProps> = ({
  title,
  value,
  description,
  icon: Icon,
  isLoading = false,
  trend,
  status,
  secondaryMetrics
}) => {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-blue-600';
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <LoadingSpinner size="sm" />
            <span className="text-sm text-muted-foreground">Loading...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="p-6 hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${getStatusColor()}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-muted-foreground">{description}</p>
          {trend && (
            <div className="flex items-center">
              {getTrendIcon()}
            </div>
          )}
        </div>
        
        {/* Secondary Metrics */}
        {secondaryMetrics && secondaryMetrics.length > 0 && (
          <div className="mt-4 space-y-2">
            {secondaryMetrics.map((metric, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  {metric.icon && <metric.icon className={`h-3 w-3 ${metric.color || 'text-muted-foreground'}`} />}
                  <span className="text-muted-foreground">{metric.label}</span>
                </div>
                <span className={`font-medium ${metric.color || 'text-foreground'}`}>
                  {typeof metric.value === 'number' ? metric.value.toLocaleString() : metric.value}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
