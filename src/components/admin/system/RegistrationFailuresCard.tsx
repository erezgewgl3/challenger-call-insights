import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Clock, Mail } from 'lucide-react';
import { useRegistrationFailuresStats } from '@/hooks/useRegistrationFailures';

export function RegistrationFailuresCard() {
  const { data: stats, isLoading } = useRegistrationFailuresStats();

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gray-300 rounded"></div>
            <div className="w-32 h-5 bg-gray-300 rounded"></div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="w-full h-4 bg-gray-300 rounded"></div>
            <div className="w-3/4 h-4 bg-gray-300 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasUnresolved = (stats?.unresolved || 0) > 0;
  const statusColor = hasUnresolved ? 'text-red-600' : 'text-green-600';
  const StatusIcon = hasUnresolved ? AlertTriangle : CheckCircle;

  return (
    <Card className={`hover:shadow-lg transition-all duration-200 ${hasUnresolved ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-lg">
          <StatusIcon className={`h-5 w-5 ${statusColor}`} />
          <span className="text-slate-900">Registration Health</span>
        </CardTitle>
        <CardDescription className="text-slate-600">
          User registration monitoring and failure tracking
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-white rounded-lg border">
            <div className="text-2xl font-bold text-slate-900">{stats?.total || 0}</div>
            <div className="text-xs text-slate-600 font-medium">Total Failures</div>
          </div>
          <div className="text-center p-3 bg-white rounded-lg border">
            <div className={`text-2xl font-bold ${hasUnresolved ? 'text-red-600' : 'text-green-600'}`}>
              {stats?.unresolved || 0}
            </div>
            <div className="text-xs text-slate-600 font-medium">Unresolved</div>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-slate-600">Resolved: {stats?.resolved || 0}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Mail className="h-4 w-4 text-blue-500" />
            <span className="text-slate-600">Alerts: {stats?.alertsSent || 0}</span>
          </div>
        </div>

        <div className="pt-2">
          <Badge variant={hasUnresolved ? "destructive" : "default"} className="w-full justify-center">
            {hasUnresolved ? "Attention Required" : "All Clear"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}