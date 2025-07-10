import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { AlertTriangle, Trash2, Users } from 'lucide-react';

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

interface BulkPermanentDeletionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  users: UserWithCounts[];
}

export function BulkPermanentDeletionDialog({ 
  isOpen, 
  onClose, 
  onSuccess, 
  users 
}: BulkPermanentDeletionDialogProps) {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  
  const [confirmationText, setConfirmationText] = useState('');

  const isValidConfirmation = confirmationText === 'PERMANENTLY DELETE';
  const hasCurrentUser = users.some(user => user.id === currentUser?.id);

  const bulkPermanentDeletionMutation = useMutation({
    mutationFn: async () => {
      // Filter out current user from deletion
      const userIds = users
        .filter(user => user.id !== currentUser?.id)
        .map(user => user.id);

      if (userIds.length === 0) {
        throw new Error('No valid users to delete');
      }

      const { data, error } = await supabase.functions.invoke('permanent-user-deletion', {
        body: { 
          userIds,
          adminId: currentUser?.id
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      const deletedCount = data?.deletedCount || users.length;
      toast({
        title: "Users Permanently Deleted",
        description: `${deletedCount} user(s) and all associated data have been permanently deleted.`,
      });
      handleClose();
      onSuccess();
    },
    onError: (error) => {
      console.error('Bulk permanent deletion error:', error);
      toast({
        title: "Deletion Failed",
        description: "Failed to permanently delete users. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleClose = () => {
    setConfirmationText('');
    onClose();
  };

  const handleBulkPermanentDelete = () => {
    if (!isValidConfirmation) return;
    bulkPermanentDeletionMutation.mutate();
  };

  const eligibleUsers = users.filter(user => user.id !== currentUser?.id);
  const totalDataCount = users.reduce((sum, user) => sum + user.transcript_count + user.account_count, 0);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="h-5 w-5" />
            Permanently Delete {users.length} User{users.length === 1 ? '' : 's'}
          </DialogTitle>
          <DialogDescription>
            This action will permanently delete the selected users and all their associated data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="space-y-2">
              <div className="font-semibold">This action cannot be undone!</div>
              <div>
                You are about to permanently delete <strong>{eligibleUsers.length} user(s)</strong> and approximately <strong>{totalDataCount} data records</strong>.
              </div>
            </AlertDescription>
          </Alert>

          {hasCurrentUser && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Your own admin account has been excluded from deletion and will not be affected.
              </AlertDescription>
            </Alert>
          )}

          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-sm font-medium mb-2">
              <Users className="h-4 w-4" />
              Users to be deleted:
            </div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {eligibleUsers.map((user) => (
                <div key={user.id} className="text-sm flex justify-between items-center">
                  <span>{user.email}</span>
                  <span className="text-muted-foreground">
                    {user.transcript_count + user.account_count} records
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmation">
              Type <strong>PERMANENTLY DELETE</strong> to confirm
            </Label>
            <Input
              id="confirmation"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder="PERMANENTLY DELETE"
              disabled={bulkPermanentDeletionMutation.isPending}
            />
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={handleClose}
            disabled={bulkPermanentDeletionMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleBulkPermanentDelete}
            disabled={!isValidConfirmation || eligibleUsers.length === 0 || bulkPermanentDeletionMutation.isPending}
            className="bg-red-600 hover:bg-red-700"
          >
            {bulkPermanentDeletionMutation.isPending ? (
              <>Deleting {eligibleUsers.length} users...</>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Permanently Delete {eligibleUsers.length} Users
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}