import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle, User, Mail } from 'lucide-react';

interface ExistingUserData {
  type: 'user' | 'invite';
  email: string;
  userStatus?: string;
  inviteStatus?: string;
}

interface ExistingUserWarningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingData: ExistingUserData | null;
  onContinue: () => void;
}

export function ExistingUserWarningDialog({
  open,
  onOpenChange,
  existingData,
  onContinue
}: ExistingUserWarningDialogProps) {
  if (!existingData) return null;

  const isActiveUser = existingData.type === 'user';
  const isPendingInvite = existingData.type === 'invite';

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            {isActiveUser ? 'Active User Detected' : 'Pending Invitation Found'}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              {isActiveUser ? (
                <User className="h-5 w-5 text-orange-600 mt-0.5" />
              ) : (
                <Mail className="h-5 w-5 text-orange-600 mt-0.5" />
              )}
              <div>
                <p className="font-medium text-orange-800">
                  {isActiveUser 
                    ? `An active user already exists with email: ${existingData.email}`
                    : `A pending invitation already exists for: ${existingData.email}`
                  }
                </p>
                <p className="text-sm text-orange-700 mt-1">
                  {isActiveUser 
                    ? 'Creating a new invite will generate a token for this existing user. Their account status will remain active.'
                    : 'Creating a new invite will replace the existing pending invitation with a new token.'
                  }
                </p>
              </div>
            </div>
            
            <p className="text-sm text-gray-600">
              Do you want to continue and {isActiveUser ? 'create a new invite token' : 'replace the existing invitation'}?
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onContinue}
            className="bg-orange-600 hover:bg-orange-700"
          >
            Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}