import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  PieChart, 
  BarChart3, 
  TrendingUp,
  Users,
  Zap,
  Activity
} from "lucide-react";

interface IntegrationAnalytics {
  popularIntegrations: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
  adoptionRate: number;
  monthlyGrowth: number;
  usageTrends: Array<{
    date: string;
    apiCalls: number;
    webhooks: number;
    activeUsers: number;
  }>;
}

interface IntegrationAnalyticsChartsProps {
  analytics: IntegrationAnalytics;
}

export function IntegrationAnalyticsCharts({ analytics }: IntegrationAnalyticsChartsProps) {
  const getIntegrationIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'zapier': return '⚡';
      case 'salesforce': return '☁️';
      case 'hubspot': return '🧡';
      case 'pipedrive': return '📊';
      case 'zoho': return '🔷';
      default: return '🔗';
    }
  };

  const getGrowthTrend = (current: number, previous: number) => {
    const change = ((current - previous) / previous) * 100;
    return {
      percentage: Math.abs(change),
      isPositive: change > 0,
      icon: change > 0 ? TrendingUp : TrendingUp // Keep same icon for consistency
    };
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Popular Integrations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Integration Distribution
          </CardTitle>
          <CardDescription>Most used integration types by customer count</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.popularIntegrations.slice(0, 6).map((integration, index) => (
              <div key={integration.type} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{getIntegrationIcon(integration.type)}</span>
                    <div>
                      <span className="font-medium capitalize">{integration.type}</span>
                      <div className="text-xs text-muted-foreground">
                        {integration.count} connections
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline">
                    {integration.percentage.toFixed(1)}%
                  </Badge>
                </div>
                <Progress 
                  value={integration.percentage} 
                  className="h-2"
                />
              </div>
            ))}
            
            {analytics.popularIntegrations.length > 6 && (
              <div className="text-sm text-muted-foreground text-center pt-2">
                +{analytics.popularIntegrations.length - 6} more integration types
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Growth and Usage Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Growth & Usage Metrics
          </CardTitle>
          <CardDescription>Adoption trends and user engagement</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Key Growth Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold text-green-600">{analytics.adoptionRate}%</div>
              <div className="text-sm text-muted-foreground">User Adoption</div>
              <div className="flex items-center justify-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span className="text-xs text-green-500">+2.3%</span>
              </div>
            </div>
            
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold text-blue-600">+{analytics.monthlyGrowth}%</div>
              <div className="text-sm text-muted-foreground">Monthly Growth</div>
              <div className="flex items-center justify-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span className="text-xs text-green-500">Trending up</span>
              </div>
            </div>
          </div>

          {/* Usage Trends */}
          <div>
            <h4 className="font-medium mb-3">7-Day Usage Trend</h4>
            <div className="space-y-2">
              {analytics.usageTrends.slice(-7).map((trend, index, array) => {
                const previous = array[index - 1];
                const apiChange = previous ? getGrowthTrend(trend.apiCalls, previous.apiCalls) : null;
                
                return (
                  <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                    <div className="text-sm font-medium">{trend.date}</div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{trend.apiCalls.toLocaleString()}</span>
                          {apiChange && (
                            <div className={`flex items-center gap-1 ${
                              apiChange.isPositive ? 'text-green-500' : 'text-red-500'
                            }`}>
                              <apiChange.icon className="h-3 w-3" />
                              <span className="text-xs">{apiChange.percentage.toFixed(0)}%</span>
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">API calls</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm">{trend.activeUsers}</div>
                        <div className="text-xs text-muted-foreground">active users</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Integration Health Summary */}
          <div>
            <h4 className="font-medium mb-3">Integration Health Summary</h4>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-lg bg-green-50 dark:bg-green-950">
                <div className="text-green-600 font-bold">85%</div>
                <div className="text-xs text-muted-foreground">Healthy</div>
              </div>
              <div className="p-2 rounded-lg bg-yellow-50 dark:bg-yellow-950">
                <div className="text-yellow-600 font-bold">12%</div>
                <div className="text-xs text-muted-foreground">Warning</div>
              </div>
              <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950">
                <div className="text-red-600 font-bold">3%</div>
                <div className="text-xs text-muted-foreground">Critical</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}