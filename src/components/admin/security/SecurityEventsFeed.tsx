import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle, Shield, FileX, XCircle, Clock } from 'lucide-react';
import { useSecurityEvents } from '@/hooks/useSecurityEvents';
import { formatDistanceToNow } from 'date-fns';

export function SecurityEventsFeed({ limit = 50 }: { limit?: number }) {
  const { data: events, isLoading } = useSecurityEvents(limit);

  const getEventIcon = (eventType: string) => {
    if (eventType.includes('login_failure')) return XCircle;
    if (eventType.includes('file_upload')) return FileX;
    if (eventType.includes('unauthorized')) return Shield;
    return AlertCircle;
  };

  const getEventSeverity = (eventType: string) => {
    if (eventType === 'suspicious_activity' || eventType === 'unauthorized_access_attempt') {
      return { variant: 'destructive' as const, label: 'Critical' };
    }
    if (eventType === 'login_failure' || eventType === 'rate_limit_exceeded') {
      return { variant: 'secondary' as const, label: 'Warning' };
    }
    return { variant: 'outline' as const, label: 'Info' };
  };

  const formatEventType = (type: string) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Security Events Feed</CardTitle>
          <CardDescription>Loading recent security events...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="h-5 w-5 text-primary" />
          <span>Security Events Feed</span>
        </CardTitle>
        <CardDescription>
          Real-time security events from the last 24 hours ({events?.length || 0} events)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-4">
            {events?.map((event) => {
              const Icon = getEventIcon(event.event_type);
              const severity = getEventSeverity(event.event_type);

              return (
                <div
                  key={event.id}
                  className="flex items-start space-x-3 p-4 rounded-lg border hover:border-primary/50 hover:bg-accent/50 transition-colors"
                >
                  <div className="p-2 bg-muted rounded-lg">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-semibold">
                        {formatEventType(event.event_type)}
                      </h4>
                      <Badge variant={severity.variant} className="text-xs">
                        {severity.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {event.details?.error_message || 
                       event.details?.message || 
                       'Security event detected'}
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>
                          {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                        </span>
                      </div>
                      {event.details?.ip_address && (
                        <span>IP: {event.details.ip_address}</span>
                      )}
                      {event.user_id && (
                        <span>User: {event.user_id.slice(0, 8)}...</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {(!events || events.length === 0) && (
              <div className="text-center py-12">
                <Shield className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-muted-foreground">No security events in the last 24 hours</p>
                <p className="text-sm text-muted-foreground/70 mt-1">Your system is secure</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
