import React from 'react';
import { IntegrationCard } from './IntegrationCard';
import { IntegrationConfig, IntegrationConnection } from '@/lib/integrations/types';

interface IntegrationListProps {
  integrations: IntegrationConfig[];
  connections: IntegrationConnection[];
  onConnect?: (integrationId: string) => void;
  onDisconnect?: (connectionId: string) => void;
  onConfigure?: (connectionId: string) => void;
  onSync?: (connectionId: string) => void;
  onPause?: (connectionId: string) => void;
  onResume?: (connectionId: string) => void;
  className?: string;
}

export const IntegrationList: React.FC<IntegrationListProps> = ({
  integrations,
  connections,
  onConnect,
  onDisconnect,
  onConfigure,
  onSync,
  onPause,
  onResume,
  className = ""
}) => {
  // Find connection for each integration
  const getConnectionForIntegration = (integrationId: string) => {
    return connections.find(conn => conn.integrationId === integrationId);
  };

  // Group integrations by category
  const groupedIntegrations = integrations.reduce((groups, integration) => {
    // Map category to display name
    const categoryDisplayMap: Record<string, string> = {
      'crm': 'CRM',
      'email': 'Email',
      'calendar': 'Calendar',
      'storage': 'Storage',
      'communication': 'Communication',
      'analytics': 'Analytics',
      'other': 'Other'
    };
    
    const displayCategory = categoryDisplayMap[integration.category] || 'Other';
    if (!groups[displayCategory]) {
      groups[displayCategory] = [];
    }
    groups[displayCategory].push(integration);
    return groups;
  }, {} as Record<string, IntegrationConfig[]>);

  const categoryOrder = ['CRM', 'Communication', 'Email', 'Calendar', 'Analytics', 'Storage', 'Other'];

  return (
    <div className={`space-y-6 ${className}`}>
      {categoryOrder.map(category => {
        const categoryIntegrations = groupedIntegrations[category];
        if (!categoryIntegrations || categoryIntegrations.length === 0) return null;

        return (
          <div key={category} className="space-y-4">
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-semibold text-foreground">{category}</h3>
              <span className="text-sm text-muted-foreground">
                ({categoryIntegrations.length} integration{categoryIntegrations.length !== 1 ? 's' : ''})
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryIntegrations.map(integration => (
                <IntegrationCard
                  key={integration.id}
                  integration={integration}
                  connection={getConnectionForIntegration(integration.id)}
                  onConnect={onConnect}
                  onDisconnect={onDisconnect}
                  onConfigure={onConfigure}
                />
              ))}
            </div>
          </div>
        );
      })}

      {Object.keys(groupedIntegrations).length === 0 && (
        <div className="text-center py-12">
          <div className="text-muted-foreground">
            <p className="text-lg font-medium">No integrations available</p>
            <p className="text-sm">Check back later for new integration options.</p>
          </div>
        </div>
      )}
    </div>
  );
};