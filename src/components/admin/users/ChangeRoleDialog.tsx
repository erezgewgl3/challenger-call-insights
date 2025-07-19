
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
import { RoleBadge } from './RoleBadge';
import { AlertTriangle } from 'lucide-react';

interface ChangeRoleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  userEmail: string;
  currentRole: 'admin' | 'sales_user';
  newRole: 'admin' | 'sales_user';
  isLoading?: boolean;
}

export function ChangeRoleDialog({
  isOpen,
  onClose,
  onConfirm,
  userEmail,
  currentRole,
  newRole,
  isLoading = false
}: ChangeRoleDialogProps) {
  const isDemotion = currentRole === 'admin' && newRole === 'sales_user';

  // Enhanced security context for role changes
  const handleSecureRoleChange = () => {
    // This will trigger the parent component's onConfirm which should use
    // the new secure database functions for validation and execution
    onConfirm();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {isDemotion && <AlertTriangle className="w-5 h-5 text-amber-500" />}
            Change User Role
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <div>
              You are about to change the role for <strong>{userEmail}</strong>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <RoleBadge role={currentRole} />
              <span className="text-gray-400">→</span>
              <RoleBadge role={newRole} />
            </div>

            {isDemotion && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-800">
                  <strong>Warning:</strong> Removing admin privileges will restrict this user's access to admin features including user management, prompt configuration, and system analytics.
                </div>
              </div>
            )}

            {newRole === 'admin' && (
              <div className="text-sm text-blue-700 bg-blue-50 p-3 rounded-lg">
                This user will gain access to all admin features including user management, prompt configuration, and system analytics.
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleSecureRoleChange}
            disabled={isLoading}
            className={isDemotion ? 'bg-amber-600 hover:bg-amber-700' : ''}
          >
            {isLoading ? 'Updating...' : 'Change Role'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
