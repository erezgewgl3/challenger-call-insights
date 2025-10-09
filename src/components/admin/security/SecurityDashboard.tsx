import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Info, Shield, Activity } from 'lucide-react';
import { SecurityMetricsCards } from './SecurityMetricsCards';
import { SecurityEventsFeed } from './SecurityEventsFeed';
import { SecurityHealthDashboard } from './SecurityHealthDashboard';
import { useRealtimeSecurityEvents } from '@/hooks/useRealtimeSecurityEvents';

export function SecurityDashboard() {
  // Enable real-time security event monitoring
  useRealtimeSecurityEvents({ showToasts: true });

  return (
    <div className="space-y-6">
      {/* Critical Alert Banner */}
      <Alert variant="destructive" className="border-2">
        <AlertTriangle className="h-5 w-5" />
        <AlertTitle className="text-lg font-semibold">Security Monitoring Active</AlertTitle>
        <AlertDescription>
          All security events are being monitored in real-time. Critical events trigger immediate email alerts to admins.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <Activity className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="health" className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span>Security Health</span>
          </TabsTrigger>
          <TabsTrigger value="events" className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4" />
            <span>Event Feed</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Security Metrics */}
          <SecurityMetricsCards />

          {/* Information Card */}
          <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/20">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-blue-900 dark:text-blue-400">
                <Info className="h-5 w-5" />
                <span>Security Monitoring System</span>
              </CardTitle>
              <CardDescription className="text-blue-800 dark:text-blue-400">
                Understanding the security dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-blue-900 dark:text-blue-400 space-y-2">
              <p>• <strong>Real-time Monitoring:</strong> All security events are tracked and displayed instantly with live updates</p>
              <p>• <strong>Automated Alerts:</strong> High and critical severity events trigger immediate email notifications to all admins</p>
              <p>• <strong>Event Types:</strong> Failed logins, rate limit violations, file upload rejections, and suspicious activity</p>
              <p>• <strong>IP Tracking:</strong> All security events include IP address for anomaly detection</p>
              <p>• <strong>Automated Response:</strong> Rate limiting and account lockouts are applied automatically</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health" className="mt-6">
          <SecurityHealthDashboard />
        </TabsContent>

        <TabsContent value="events" className="mt-6">
          <SecurityEventsFeed limit={100} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
