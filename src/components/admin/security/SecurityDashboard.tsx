import { SecurityMetricsCards } from './SecurityMetricsCards';
import { SecurityEventsFeed } from './SecurityEventsFeed';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, AlertTriangle, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function SecurityDashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center space-x-2">
            <Shield className="h-7 w-7 text-primary" />
            <span>Security Monitoring</span>
          </h2>
          <p className="text-muted-foreground mt-1">
            Real-time security event monitoring and threat detection
          </p>
        </div>
      </div>

      {/* Alert Banner for Critical Events */}
      <Alert variant="destructive" className="bg-destructive/10">
        <AlertTriangle className="h-5 w-5" />
        <AlertTitle>Security Notice</AlertTitle>
        <AlertDescription>
          This dashboard displays security-related events from the last 24 hours.
          Critical events require immediate investigation.
        </AlertDescription>
      </Alert>

      {/* Security Metrics Cards */}
      <SecurityMetricsCards />

      {/* Security Events Feed */}
      <SecurityEventsFeed limit={100} />

      {/* Info Card */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Info className="h-5 w-5" />
            <span>About Security Monitoring</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <ul className="space-y-2">
            <li>• Events are refreshed automatically every 10 seconds</li>
            <li>• All security events are logged for audit compliance</li>
            <li>• Critical events trigger automatic alerts (coming soon)</li>
            <li>• Data is retained for 7 years per GDPR guidelines</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
