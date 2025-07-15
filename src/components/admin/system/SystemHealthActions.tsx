import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Mail, RefreshCw, AlertTriangle, CheckCircle, TestTube } from 'lucide-react';
import { useFixOrphanedUsers, useSendTestAlert } from '@/hooks/useRegistrationFailures';
import { toast } from '@/hooks/use-toast';

export function SystemHealthActions() {
  const fixUsers = useFixOrphanedUsers();
  const sendTestAlert = useSendTestAlert();
  const [lastFixResult, setLastFixResult] = useState<any>(null);

  const handleFixUsers = async () => {
    try {
      const result = await fixUsers.mutateAsync();
      setLastFixResult(result);
      toast({
        title: "Success",
        description: `Fixed ${result.fixedCount || 0} orphaned users`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fix orphaned users",
        variant: "destructive",
      });
    }
  };

  const handleTestAlert = async () => {
    try {
      await sendTestAlert.mutateAsync();
      toast({
        title: "Test Alert Sent",
        description: "Check your email for the test registration failure alert",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send test alert",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <RefreshCw className="h-5 w-5 text-blue-600" />
          <span>System Health Actions</span>
        </CardTitle>
        <CardDescription>
          Tools to diagnose and resolve registration issues
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Fix Orphaned Users */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-slate-700 flex items-center space-x-2">
            <UserPlus className="h-4 w-4" />
            <span>User Account Repair</span>
          </h3>
          <p className="text-sm text-slate-600">
            Automatically fix users who exist in authentication but not in the users table.
          </p>
          <div className="flex items-center space-x-3">
            <Button
              onClick={handleFixUsers}
              disabled={fixUsers.isPending}
              className="flex items-center space-x-2"
            >
              {fixUsers.isPending ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              <span>Fix Orphaned Users</span>
            </Button>
            {lastFixResult && (
              <Badge variant="default" className="flex items-center space-x-1">
                <CheckCircle className="h-3 w-3" />
                <span>Fixed {lastFixResult.fixedCount || 0} users</span>
              </Badge>
            )}
          </div>
        </div>

        {/* Test Email Alerts */}
        <div className="space-y-3 pt-4 border-t">
          <h3 className="text-sm font-medium text-slate-700 flex items-center space-x-2">
            <Mail className="h-4 w-4" />
            <span>Email Alert Testing</span>
          </h3>
          <p className="text-sm text-slate-600">
            Send a test registration failure alert to verify email configuration.
          </p>
          <Button
            variant="outline"
            onClick={handleTestAlert}
            disabled={sendTestAlert.isPending}
            className="flex items-center space-x-2"
          >
            {sendTestAlert.isPending ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <TestTube className="h-4 w-4" />
            )}
            <span>Send Test Alert</span>
          </Button>
        </div>

        {/* System Status */}
        <div className="space-y-3 pt-4 border-t">
          <h3 className="text-sm font-medium text-slate-700 flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4" />
            <span>Alert Configuration</span>
          </h3>
          <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Alert Recipient:</strong> erezgew@yahoo.com
            </p>
            <p className="text-sm text-blue-800">
              <strong>Monitoring Frequency:</strong> Every 5 minutes
            </p>
            <p className="text-sm text-blue-800">
              <strong>Auto-Repair:</strong> Enabled (with success notifications)
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}