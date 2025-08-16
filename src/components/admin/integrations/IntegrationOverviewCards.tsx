import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Activity, 
  Zap, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  Users
} from "lucide-react";

interface IntegrationMetrics {
  totalActiveIntegrations: number;
  webhookSuccessRate24h: number;
  totalApiCalls24h: number;
  errorRate24h: number;
  queueDepth: number;
  averageResponseTime: number;
  activeUsers: number;
  totalUsers: number;
}

interface IntegrationOverviewCardsProps {
  metrics: IntegrationMetrics;
}

export function IntegrationOverviewCards({ metrics }: IntegrationOverviewCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Integrations</CardTitle>
          <Zap className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.totalActiveIntegrations}</div>
          <p className="text-xs text-muted-foreground">
            Across {metrics.totalUsers} users
          </p>
          <div className="mt-2">
            <Progress 
              value={(metrics.activeUsers / metrics.totalUsers) * 100} 
              className="h-2"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Webhook Success Rate</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {metrics.webhookSuccessRate24h.toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground">
            Last 24 hours
          </p>
          <div className="mt-2">
            <Progress 
              value={metrics.webhookSuccessRate24h} 
              className="h-2"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">API Calls</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.totalApiCalls24h.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            Last 24 hours
          </p>
          <div className="flex items-center gap-1 mt-2">
            <TrendingUp className="h-3 w-3 text-green-500" />
            <span className="text-xs text-green-500">+12.5%</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
          <AlertTriangle className={`h-4 w-4 ${
            metrics.errorRate24h > 5 ? 'text-red-500' : 
            metrics.errorRate24h > 2 ? 'text-yellow-500' : 'text-green-500'
          }`} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {metrics.errorRate24h.toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground">
            Last 24 hours
          </p>
          <div className="mt-2">
            <Progress 
              value={metrics.errorRate24h > 10 ? 100 : (metrics.errorRate24h / 10) * 100} 
              className="h-2"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}