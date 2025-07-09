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

interface UserInfo {
  id: string;
  email: string;
  role: 'sales_user' | 'admin';
}

interface BulkUserDeletionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  users: UserInfo[];
}

export function BulkUserDeletionDialog({ isOpen, onClose, users }: BulkUserDeletionDialogProps) {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  
  const [reason, setReason] = useState('');
  const [immediateDelete, setImmediateDelete] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');

  // Filter out current user to prevent self-deletion
  const eligibleUsers = users.filter(user => user.id !== currentUser?.id);
  const isCurrentUserSelected = users.some(user => user.id === currentUser?.id);

  const deletionMutation = useMutation({
    mutationFn: async () => {
      const gracePeriodEnd = immediateDelete 
        ? null 
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      const scheduledFor = immediateDelete 
        ? new Date().toISOString()
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      // Create deletion requests for all eligible users
      const deletionRequests = eligibleUsers.map(user => ({
        user_id: user.id,
        requested_by: currentUser?.id,
        reason,
        scheduled_for: scheduledFor,
        grace_period_end: gracePeriodEnd,
        immediate_delete: immediateDelete,
        status: 'pending'
      }));

      const { data, error } = await supabase
        .from('deletion_requests')
        .insert(deletionRequests)
        .select();

      if (error) throw error;

      // Create audit log entries for all users
      const auditLogEntries = eligibleUsers.map(user => ({
        event_type: 'data_deletion',
        user_id: user.id,
        admin_id: currentUser?.id,
        details: {
          reason,
          immediate_delete: immediateDelete,
          grace_period_end: gracePeriodEnd,
          bulk_operation: true,
          total_users: eligibleUsers.length
        },
        legal_basis: 'Article 17 - Right to erasure',
        status: 'pending'
      }));

      await supabase
        .from('gdpr_audit_log')
        .insert(auditLogEntries);

      return data;
    },
    onSuccess: () => {
      const processedCount = eligibleUsers.length;
      const skippedCount = isCurrentUserSelected ? 1 : 0;
      
      let description = `Deletion requested for ${processedCount} user${processedCount === 1 ? '' : 's'}.`;
      
      if (skippedCount > 0) {
        description += ` Your own account was skipped to prevent self-deletion.`;
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
      toast({
        title: "Bulk Deletion Failed",
        description: "Failed to process bulk deletion request. Please try again.",
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

  const canProceed = reason.trim() && confirmationText === 'DELETE USERS' && eligibleUsers.length > 0;

  return (
    <AlertDialog open={isOpen} onOpenChange={handleClose}>
      <AlertDialogContent className="max-w-3xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-red-600 flex items-center gap-2">
            <Users className="h-5 w-5" />
            Bulk Delete User Accounts - {users.length} User{users.length === 1 ? '' : 's'}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p>This action will permanently delete all data for the selected users including:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>User profiles and authentication data</li>
                <li>All transcripts and uploaded content</li>
                <li>AI analysis results and coaching data</li>
                <li>Account information and deal tracking</li>
                <li>Activity logs and usage history</li>
              </ul>
              
              {!immediateDelete && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Standard deletion includes a 30-day grace period for recovery.
                    Data will be soft-deleted and can be restored during this period.
                  </AlertDescription>
                </Alert>
              )}
              
              {immediateDelete && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Immediate deletion bypasses the grace period. This action cannot be undone.
                  </AlertDescription>
                </Alert>
              )}

              {isCurrentUserSelected && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Your own account is in the selection and will be skipped to prevent self-deletion.
                    Only {eligibleUsers.length} user{eligibleUsers.length === 1 ? '' : 's'} will be processed.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium mb-2 block">Selected Users ({users.length})</Label>
            <div className="max-h-32 overflow-y-auto border rounded-lg p-3 space-y-2 bg-gray-50">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between">
                  <span className="text-sm">{user.email}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="text-xs">
                      {user.role === 'admin' ? 'Admin' : 'Sales User'}
                    </Badge>
                    {user.id === currentUser?.id && (
                      <Badge variant="destructive" className="text-xs">
                        Will be skipped
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <Label htmlFor="reason">Reason for Bulk Deletion *</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why these users' data is being deleted..."
              className="mt-1"
              required
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="immediate"
              checked={immediateDelete}
              onCheckedChange={handleImmediateDeleteChange}
            />
            <Label htmlFor="immediate" className="text-sm">
              Delete immediately (skip 30-day grace period)
            </Label>
          </div>
          
          <div>
            <Label htmlFor="confirmation">Confirmation *</Label>
            <Input
              id="confirmation"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder="Type DELETE USERS to confirm"
              className="mt-1"
            />
          </div>
        </div>
        
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => deletionMutation.mutate()}
            className="bg-red-600 hover:bg-red-700"
            disabled={!canProceed || deletionMutation.isPending}
          >
            {deletionMutation.isPending ? 'Processing...' : `Delete ${eligibleUsers.length} User${eligibleUsers.length === 1 ? '' : 's'}`}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}