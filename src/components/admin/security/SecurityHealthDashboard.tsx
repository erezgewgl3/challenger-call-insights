import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  TrendingUp,
  TrendingDown,
  Activity
} from 'lucide-react';
import { useSecurityMetrics } from '@/hooks/useSecurityEvents';

export function SecurityHealthDashboard() {
  const { data: metrics, isLoading } = useSecurityMetrics();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Security Health Score</CardTitle>
          <CardDescription>Calculating overall security posture...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate security health score (0-100)
  const calculateHealthScore = () => {
    let score = 100;
    
    // Deduct points for security events
    if (metrics?.criticalEvents24h) {
      score -= metrics.criticalEvents24h * 15; // Critical events: -15 points each
    }
    if (metrics?.suspiciousActivity24h) {
      score -= metrics.suspiciousActivity24h * 10; // Suspicious: -10 points each
    }
    if (metrics?.failedLogins24h) {
      score -= Math.min(metrics.failedLogins24h * 2, 20); // Failed logins: -2 points each, max -20
    }
    if (metrics?.rateLimitViolations24h) {
      score -= Math.min(metrics.rateLimitViolations24h * 1, 10); // Rate limits: -1 point each, max -10
    }
    if (metrics?.fileUploadRejections24h) {
      score -= Math.min(metrics.fileUploadRejections24h * 1, 10); // File rejections: -1 point each, max -10
    }

    return Math.max(0, Math.min(100, score));
  };

  const healthScore = calculateHealthScore();

  const getHealthStatus = (score: number) => {
    if (score >= 90) return { 
      label: 'Excellent', 
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-950',
      icon: CheckCircle,
      description: 'Your system security is excellent with minimal threats detected.'
    };
    if (score >= 70) return { 
      label: 'Good', 
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-950',
      icon: Shield,
      description: 'System security is good, with some minor events requiring attention.'
    };
    if (score >= 50) return { 
      label: 'Fair', 
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-50 dark:bg-yellow-950',
      icon: AlertTriangle,
      description: 'Security requires attention. Review recent events and take corrective action.'
    };
    return { 
      label: 'Critical', 
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-950',
      icon: XCircle,
      description: 'Immediate action required! Multiple security threats detected.'
    };
  };

  const status = getHealthStatus(healthScore);
  const StatusIcon = status.icon;

  const securityChecks = [
    {
      name: 'Failed Login Protection',
      status: (metrics?.failedLogins24h || 0) < 5 ? 'pass' : 'warning',
      details: `${metrics?.failedLogins24h || 0} failed attempts in 24h`,
      threshold: '< 5 attempts',
    },
    {
      name: 'Rate Limiting',
      status: (metrics?.rateLimitViolations24h || 0) < 10 ? 'pass' : 'warning',
      details: `${metrics?.rateLimitViolations24h || 0} violations in 24h`,
      threshold: '< 10 violations',
    },
    {
      name: 'File Upload Security',
      status: (metrics?.fileUploadRejections24h || 0) < 5 ? 'pass' : 'warning',
      details: `${metrics?.fileUploadRejections24h || 0} malicious files blocked`,
      threshold: '< 5 rejections',
    },
    {
      name: 'Threat Detection',
      status: (metrics?.suspiciousActivity24h || 0) === 0 ? 'pass' : 'fail',
      details: `${metrics?.suspiciousActivity24h || 0} suspicious activities`,
      threshold: '0 threats',
    },
    {
      name: 'Critical Events',
      status: (metrics?.criticalEvents24h || 0) === 0 ? 'pass' : 'fail',
      details: `${metrics?.criticalEvents24h || 0} critical events`,
      threshold: '0 critical',
    },
  ];

  const passedChecks = securityChecks.filter(c => c.status === 'pass').length;
  const checksPassed = (passedChecks / securityChecks.length) * 100;

  return (
    <div className="space-y-6">
      {/* Overall Health Score */}
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Security Health Score</CardTitle>
              <CardDescription>Overall system security assessment</CardDescription>
            </div>
            <div className={`p-4 rounded-full ${status.bgColor}`}>
              <StatusIcon className={`h-8 w-8 ${status.color}`} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-5xl font-bold">{healthScore}</span>
                <span className="text-2xl text-muted-foreground">/100</span>
              </div>
              <Badge 
                variant={healthScore >= 70 ? 'default' : 'destructive'}
                className="text-sm"
              >
                {status.label}
              </Badge>
            </div>
            <div className="text-right space-y-2">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                {healthScore >= 90 ? (
                  <>
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span>Excellent</span>
                  </>
                ) : healthScore >= 70 ? (
                  <>
                    <Activity className="h-4 w-4 text-blue-600" />
                    <span>Stable</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-4 w-4 text-red-600" />
                    <span>Declining</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <Progress value={healthScore} className="h-3" />
          
          <p className="text-sm text-muted-foreground">{status.description}</p>
        </CardContent>
      </Card>

      {/* Security Checks */}
      <Card>
        <CardHeader>
          <CardTitle>Security Checks</CardTitle>
          <CardDescription>
            {passedChecks} of {securityChecks.length} checks passed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Progress value={checksPassed} className="h-2 mb-4" />
          
          {securityChecks.map((check, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 rounded-lg border hover:border-primary/50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                {check.status === 'pass' ? (
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                ) : check.status === 'warning' ? (
                  <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                )}
                <div>
                  <div className="font-medium text-sm">{check.name}</div>
                  <div className="text-xs text-muted-foreground">{check.details}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Threshold</div>
                <div className="text-sm font-medium">{check.threshold}</div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Recommendations */}
      {healthScore < 90 && (
        <Card className="border-yellow-200 dark:border-yellow-900 bg-yellow-50 dark:bg-yellow-950/20">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-yellow-900 dark:text-yellow-400">
              <AlertTriangle className="h-5 w-5" />
              <span>Security Recommendations</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-yellow-900 dark:text-yellow-400">
              {(metrics?.criticalEvents24h || 0) > 0 && (
                <li>• Investigate and address critical security events immediately</li>
              )}
              {(metrics?.suspiciousActivity24h || 0) > 0 && (
                <li>• Review suspicious activity patterns and implement additional monitoring</li>
              )}
              {(metrics?.failedLogins24h || 0) > 10 && (
                <li>• High number of failed logins detected - consider implementing CAPTCHA or account lockouts</li>
              )}
              {(metrics?.rateLimitViolations24h || 0) > 20 && (
                <li>• Frequent rate limit violations - review and adjust rate limiting thresholds</li>
              )}
              {(metrics?.fileUploadRejections24h || 0) > 10 && (
                <li>• Multiple malicious file upload attempts - enhance file validation and user education</li>
              )}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
