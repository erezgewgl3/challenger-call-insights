import React, { useState } from 'react';
import { ZapierIntegrationCard } from './ZapierIntegrationCard';
import { ZapierManagementPanel } from './ZapierManagementPanel';

export function ZapierIntegrationManager() {
  const [isManagementOpen, setIsManagementOpen] = useState(false);

  return (
    <>
      <ZapierIntegrationCard 
        onOpenManager={() => setIsManagementOpen(true)}
      />
      <ZapierManagementPanel
        isOpen={isManagementOpen}
        onClose={() => setIsManagementOpen(false)}
      />
    </>
  );
}