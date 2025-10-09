import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  AlertTriangle, 
  XCircle, 
  FileX,
  Activity
} from 'lucide-react';
import { useSecurityMetrics } from '@/hooks/useSecurityEvents';
import { Skeleton } from '@/components/ui/skeleton';

export function SecurityMetricsCards() {
  const { data: metrics, isLoading } = useSecurityMetrics();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Total Security Events',
      value: metrics?.totalEvents24h || 0,
      icon: Activity,
      description: 'Last 24 hours',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Failed Login Attempts',
      value: metrics?.failedLogins24h || 0,
      icon: XCircle,
      description: 'Authentication failures',
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-950',
      severity: metrics?.failedLogins24h > 10 ? 'warning' : 'normal',
    },
    {
      title: 'Rate Limit Violations',
      value: metrics?.rateLimitViolations24h || 0,
      icon: AlertTriangle,
      description: 'Blocked requests',
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-50 dark:bg-yellow-950',
    },
    {
      title: 'File Upload Rejections',
      value: metrics?.fileUploadRejections24h || 0,
      icon: FileX,
      description: 'Malicious files blocked',
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-950',
    },
    {
      title: 'Suspicious Activity',
      value: metrics?.suspiciousActivity24h || 0,
      icon: Shield,
      description: 'Potential threats detected',
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
      severity: metrics?.suspiciousActivity24h > 0 ? 'critical' : 'normal',
    },
    {
      title: 'Critical Events',
      value: metrics?.criticalEvents24h || 0,
      icon: AlertTriangle,
      description: 'Requires immediate attention',
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
      severity: metrics?.criticalEvents24h > 0 ? 'critical' : 'normal',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <Icon className={`h-5 w-5 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline space-x-2">
                <div className="text-3xl font-bold">
                  {card.value}
                </div>
                {card.severity === 'critical' && (
                  <Badge variant="destructive" className="text-xs">
                    Critical
                  </Badge>
                )}
                {card.severity === 'warning' && (
                  <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300">
                    Warning
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
