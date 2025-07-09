import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { AlertTriangle, Info, Users } from 'lucide-react';

interface UserWithCounts {
  id: string;
  email: string;
  role: 'sales_user' | 'admin';
  status?: 'active' | 'pending_deletion' | 'deleted';
  created_at: string;
  last_login?: string;
  transcript_count: number;
  account_count: number;
}

interface BulkUserDeletionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  users: UserWithCounts[];
}

export function BulkUserDeletionDialog({ isOpen, onClose, users }: BulkUserDeletionDialogProps) {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  
  const [reason, setReason] = useState('');
  const [immediateDelete, setImmediateDelete] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');

  // Filter out current user and users already pending deletion to prevent issues
  const eligibleUsers = users.filter(user => 
    user.id !== currentUser?.id && 
    user.status !== 'pending_deletion' && 
    user.status !== 'deleted'
  );
  const isCurrentUserSelected = users.some(user => user.id === currentUser?.id);
  const hasPendingDeletionUsers = users.some(user => user.status === 'pending_deletion');

  const deletionMutation = useMutation({
    mutationFn: async () => {
      if (!eligibleUsers.length) {
        throw new Error('No eligible users selected for deletion');
      }

      console.log('Starting bulk deletion for users:', eligibleUsers.map(u => ({ id: u.id, email: u.email })));

      // Verify current user authentication
      if (!currentUser?.id) {
        throw new Error('Authentication required for bulk deletion');
      }

      console.log('Current admin user:', currentUser.id);

      const gracePeriodEnd = immediateDelete 
        ? null 
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      const scheduledFor = immediateDelete 
        ? new Date().toISOString()
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      // Create deletion requests for all eligible users
      const deletionRequests = eligibleUsers.map(user => ({
        user_id: user.id,
        requested_by: currentUser.id,
        reason,
        scheduled_for: scheduledFor,
        grace_period_end: gracePeriodEnd,
        immediate_delete: immediateDelete,
        status: 'pending'
      }));

      console.log('Deletion requests to insert:', deletionRequests.length);

      const { data: deletionData, error: deletionError } = await supabase
        .from('deletion_requests')
        .insert(deletionRequests)
        .select();

      if (deletionError) {
        console.error('Deletion request error:', deletionError);
        throw new Error(`Failed to create deletion requests: ${deletionError.message}`);
      }

      console.log('Deletion requests created:', deletionData?.length || 0);

      // Create audit log entries for all users
      const auditLogEntries = eligibleUsers.map(user => ({
        event_type: 'bulk_deletion_requested',
        user_id: user.id,
        admin_id: currentUser.id,
        details: {
          reason,
          immediate_delete: immediateDelete,
          grace_period_end: gracePeriodEnd,
          bulk_operation: true,
          total_users: eligibleUsers.length,
          user_email: user.email
        },
        legal_basis: 'Article 17 - Right to erasure',
        status: 'completed'
      }));

      const { data: auditData, error: auditError } = await supabase
        .from('gdpr_audit_log')
        .insert(auditLogEntries)
        .select();

      if (auditError) {
        console.error('Audit log error:', auditError);
        throw new Error(`Failed to create audit log entries: ${auditError.message}`);
      }

      console.log('Audit entries created:', auditData?.length || 0);

      // Mark users as pending deletion
      const { data: statusData, error: statusError } = await supabase
        .from('users')
        .update({ status: 'pending_deletion' })
        .in('id', eligibleUsers.map(user => user.id))
        .select();

      if (statusError) {
        console.error('Status update error:', statusError);
        throw new Error(`Failed to update user status: ${statusError.message}`);
      }

      console.log('User statuses updated:', statusData?.length || 0);

      return { processedCount: eligibleUsers.length };
    },
    onSuccess: () => {
      const processedCount = eligibleUsers.length;
      const skippedCount = isCurrentUserSelected ? 1 : 0;
      const pendingCount = hasPendingDeletionUsers ? users.filter(u => u.status === 'pending_deletion').length : 0;
      
      let description = `Deletion requested for ${processedCount} user${processedCount === 1 ? '' : 's'}.`;
      
      if (skippedCount > 0) {
        description += ` Your own account was skipped to prevent self-deletion.`;
      }
      
      if (pendingCount > 0) {
        description += ` ${pendingCount} user${pendingCount === 1 ? '' : 's'} already pending deletion ${pendingCount === 1 ? 'was' : 'were'} skipped.`;
      }
      
      if (!immediateDelete) {
        description += ` All deletions include a 30-day grace period.`;
      }

      toast({
        title: "Bulk Deletion Requested",
        description,
      });
      
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['gdpr'] });
      onClose();
      resetForm();
    },
    onError: (error) => {
      console.error('Bulk deletion error:', error);
      toast({
        title: "Bulk Deletion Failed",
        description: error.message || "Failed to process bulk deletion request. Please try again.",
        variant: "destructive",
      });
    }
  });

  const resetForm = () => {
    setReason('');
    setImmediateDelete(false);
    setConfirmationText('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleImmediateDeleteChange = (checked: boolean | 'indeterminate') => {
    setImmediateDelete(checked === true);
  };

  const canProceed = reason.trim() && 
                    confirmationText.trim().toUpperCase() === 'DELETE USERS' && 
                    eligibleUsers.length > 0;

  return (
    <AlertDialog open={isOpen} onOpenChange={handleClose}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Bulk User Deletion Request
          </AlertDialogTitle>
          <AlertDialogDescription>
            This action will request deletion for {users.length} selected user{users.length === 1 ? '' : 's'}.
            {eligibleUsers.length !== users.length && (
              <span className="block mt-2 text-amber-600">
                Note: {users.length - eligibleUsers.length} user{users.length - eligibleUsers.length === 1 ? '' : 's'} will be skipped 
                (your own account{hasPendingDeletionUsers ? ' and users already pending deletion' : ''}).
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-6">
          {eligibleUsers.length === 0 ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No eligible users selected for deletion. You cannot delete your own account or users already pending deletion.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {/* Selected Users Preview */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Users to be processed ({eligibleUsers.length})
                </Label>
                <div className="max-h-32 overflow-y-auto border rounded-md p-2 bg-gray-50">
                  {eligibleUsers.map(user => (
                    <div key={user.id} className="flex items-center justify-between py-1">
                      <span className="text-sm">{user.email}</span>
                      <Badge variant="outline">{user.role}</Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Deletion Reason */}
              <div className="space-y-2">
                <Label htmlFor="reason">Reason for Deletion *</Label>
                <Textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Provide a detailed reason for this bulk deletion request..."
                  className="min-h-20"
                />
              </div>

              {/* Immediate Delete Option */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="immediate-delete"
                  checked={immediateDelete}
                  onCheckedChange={handleImmediateDeleteChange}
                />
                <Label htmlFor="immediate-delete" className="text-sm">
                  Immediate deletion (skip 30-day grace period)
                </Label>
              </div>

              {/* Grace Period Alert */}
              {!immediateDelete && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Users will be marked for deletion with a 30-day grace period. During this time, 
                    the deletion can be cancelled and user data will remain accessible.
                  </AlertDescription>
                </Alert>
              )}

              {/* Immediate Deletion Warning */}
              {immediateDelete && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Warning:</strong> Immediate deletion will permanently remove all user data 
                    without any recovery period. This action cannot be undone.
                  </AlertDescription>
                </Alert>
              )}

              {/* Confirmation Text */}
              <div className="space-y-2">
                <Label htmlFor="confirmation">
                  Type "DELETE USERS" to confirm *
                </Label>
                <Input
                  id="confirmation"
                  value={confirmationText}
                  onChange={(e) => setConfirmationText(e.target.value)}
                  placeholder="DELETE USERS"
                  className="font-mono"
                />
              </div>
            </>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => deletionMutation.mutate()}
            disabled={!canProceed || deletionMutation.isPending}
            className="bg-red-600 hover:bg-red-700"
          >
            {deletionMutation.isPending ? 'Processing...' : `Delete ${eligibleUsers.length} Users`}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}