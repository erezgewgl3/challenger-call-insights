import React from 'react';
import { UnifiedQueueDrawer } from './UnifiedQueueDrawer';

interface QueueDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user_id: string;
}

export function QueueDrawer({ isOpen, onClose, user_id }: QueueDrawerProps) {
  // Use the new unified queue drawer
  return (
    <UnifiedQueueDrawer 
      isOpen={isOpen}
      onClose={onClose}
      user_id={user_id}
    />
  );
}
