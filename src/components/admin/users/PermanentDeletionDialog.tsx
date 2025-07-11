import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
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
import { AlertTriangle, Trash2 } from 'lucide-react';

interface PermanentDeletionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    email: string;
  };
}

export function PermanentDeletionDialog({ isOpen, onClose, user }: PermanentDeletionDialogProps) {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  
  const [confirmationText, setConfirmationText] = useState('');

  const isValidConfirmation = confirmationText === 'PERMANENTLY DELETE';
  const isSelfDeletion = currentUser?.id === user.id;

  const permanentDeletionMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('permanent-user-deletion', {
        body: { 
          userId: user.id,
          adminId: currentUser?.id
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast({
        title: "User Permanently Deleted",
        description: `${user.email} and all associated data have been permanently deleted.`,
      });
      handleClose();
    },
    onError: (error) => {
      console.error('Permanent deletion error:', error);
      toast({
        title: "Deletion Failed",
        description: "Failed to permanently delete user. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleClose = () => {
    setConfirmationText('');
    onClose();
  };

  const handlePermanentDelete = () => {
    if (!isValidConfirmation || isSelfDeletion) return;
    permanentDeletionMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="h-5 w-5" />
            Permanently Delete User
          </DialogTitle>
          <DialogDescription>
            This action will permanently delete <strong>{user.email}</strong> and all associated data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="space-y-2">
              <div className="font-semibold">This action cannot be undone!</div>
              <div>The following data will be permanently deleted:</div>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>User account and profile</li>
                <li>All transcripts and analyses</li>
                <li>All accounts and associated data</li>
                <li>All custom prompts</li>
                <li>All audit logs and export requests</li>
                <li>All consent and deletion records</li>
              </ul>
            </AlertDescription>
          </Alert>

          {isSelfDeletion && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You cannot permanently delete your own admin account.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="confirmation">
              Type <strong>PERMANENTLY DELETE</strong> to confirm
            </Label>
            <Input
              id="confirmation"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder="PERMANENTLY DELETE"
              disabled={isSelfDeletion || permanentDeletionMutation.isPending}
            />
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={handleClose}
            disabled={permanentDeletionMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handlePermanentDelete}
            disabled={!isValidConfirmation || isSelfDeletion || permanentDeletionMutation.isPending}
            className="bg-red-600 hover:bg-red-700"
          >
            {permanentDeletionMutation.isPending ? (
              <>Deleting...</>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Permanently Delete
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}