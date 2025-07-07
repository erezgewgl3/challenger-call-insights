
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
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { AlertTriangle, Info } from 'lucide-react';

interface UserDeletionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    email: string;
  };
}

export function UserDeletionDialog({ isOpen, onClose, user }: UserDeletionDialogProps) {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  
  const [reason, setReason] = useState('');
  const [immediateDelete, setImmediateDelete] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');

  const deletionMutation = useMutation({
    mutationFn: async () => {
      const gracePeriodEnd = immediateDelete 
        ? null 
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('deletion_requests')
        .insert({
          user_id: user.id,
          requested_by: currentUser?.id,
          reason,
          scheduled_for: immediateDelete 
            ? new Date().toISOString()
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          grace_period_end: gracePeriodEnd,
          immediate_delete: immediateDelete,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      // Create audit log entry
      await supabase
        .from('gdpr_audit_log')
        .insert({
          event_type: 'data_deletion',
          user_id: user.id,
          admin_id: currentUser?.id,
          details: {
            reason,
            immediate_delete: immediateDelete,
            grace_period_end: gracePeriodEnd
          },
          legal_basis: 'Article 17 - Right to erasure',
          status: 'pending'
        });

      return data;
    },
    onSuccess: () => {
      toast({
        title: "Deletion Requested",
        description: immediateDelete 
          ? "User data deletion has been initiated immediately." 
          : "User deletion has been scheduled with a 30-day grace period.",
      });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['gdpr'] });
      onClose();
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Deletion Failed",
        description: "Failed to process deletion request. Please try again.",
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
    // Handle the checkbox state properly
    setImmediateDelete(checked === true);
  };

  const canProceed = reason.trim() && confirmationText === 'DELETE';

  return (
    <AlertDialog open={isOpen} onOpenChange={handleClose}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-red-600">
            Delete User Account - {user.email}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p>This action will permanently delete all user data including:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>User profile and authentication data</li>
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
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="reason">Reason for Deletion *</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why this user's data is being deleted..."
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
              placeholder="Type DELETE to confirm"
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
            {deletionMutation.isPending ? 'Processing...' : 'Delete User Data'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
