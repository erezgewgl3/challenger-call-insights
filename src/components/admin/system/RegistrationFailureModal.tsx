import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, Clock, Mail, User, Calendar, FileText } from 'lucide-react';
import { useRegistrationFailures, useMarkFailureResolved } from '@/hooks/useRegistrationFailures';
import { toast } from '@/hooks/use-toast';

interface RegistrationFailureModalProps {
  failureId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function RegistrationFailureModal({ failureId, isOpen, onClose }: RegistrationFailureModalProps) {
  const { data: failures } = useRegistrationFailures();
  const markResolved = useMarkFailureResolved();

  const failure = failures?.find(f => f.id === failureId);

  const handleMarkResolved = async (method: string) => {
    if (!failure) return;
    
    try {
      await markResolved.mutateAsync({ id: failure.id, method });
      toast({
        title: "Success",
        description: "Failure marked as resolved",
      });
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark as resolved",
        variant: "destructive",
      });
    }
  };

  if (!failure) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <span>Registration Failure Details</span>
          </DialogTitle>
          <DialogDescription>
            Detailed information about the registration failure
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Badge */}
          <div className="flex justify-between items-center">
            <Badge variant={failure.resolved ? "default" : "destructive"} className="text-sm">
              {failure.resolved ? "Resolved" : "Unresolved"}
            </Badge>
            {failure.alert_sent && (
              <Badge variant="secondary" className="flex items-center space-x-1">
                <Mail className="h-3 w-3" />
                <span>Alert Sent</span>
              </Badge>
            )}
          </div>

          {/* User Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm font-medium text-slate-700">
                <User className="h-4 w-4" />
                <span>User Information</span>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm"><strong>Email:</strong> {failure.user_email}</p>
                <p className="text-sm"><strong>User ID:</strong> {failure.user_id}</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm font-medium text-slate-700">
                <Calendar className="h-4 w-4" />
                <span>Timeline</span>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg space-y-1">
                <p className="text-sm">
                  <strong>Failed:</strong> {new Date(failure.attempted_at).toLocaleString()}
                </p>
                {failure.alert_sent_at && (
                  <p className="text-sm">
                    <strong>Alert Sent:</strong> {new Date(failure.alert_sent_at).toLocaleString()}
                  </p>
                )}
                {failure.resolved_at && (
                  <p className="text-sm">
                    <strong>Resolved:</strong> {new Date(failure.resolved_at).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Error Details */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm font-medium text-slate-700">
              <FileText className="h-4 w-4" />
              <span>Error Details</span>
            </div>
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
              <pre className="text-sm text-red-800 whitespace-pre-wrap font-mono">
                {failure.error_message}
              </pre>
            </div>
          </div>

          {/* Resolution Information */}
          {failure.resolved && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm font-medium text-slate-700">
                <CheckCircle className="h-4 w-4" />
                <span>Resolution</span>
              </div>
              <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>Method:</strong> {failure.resolution_method || 'Unknown'}
                </p>
                <p className="text-sm text-green-800">
                  <strong>Resolved At:</strong> {failure.resolved_at ? new Date(failure.resolved_at).toLocaleString() : 'N/A'}
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          {!failure.resolved && (
            <div className="flex space-x-3 pt-4 border-t">
              <Button
                onClick={() => handleMarkResolved('Manual Resolution')}
                disabled={markResolved.isPending}
                className="flex items-center space-x-2"
              >
                <CheckCircle className="h-4 w-4" />
                <span>Mark as Resolved</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => handleMarkResolved('Investigated - No Action Needed')}
                disabled={markResolved.isPending}
              >
                No Action Needed
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}