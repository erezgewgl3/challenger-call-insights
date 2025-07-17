import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { IntegrationConfig, IntegrationConnection } from '@/lib/integrations/types';
import { IntegrationStatus } from '../../integrations-framework/IntegrationStatus';
import { IntegrationActions } from '../../integrations-framework/IntegrationActions';
import { IntegrationIcon } from '../../integrations-framework/IntegrationIcon';
import { Video, Calendar, Mic, FileText } from 'lucide-react';

interface ZoomIntegrationCardProps {
  integration: IntegrationConfig;
  connection?: IntegrationConnection;
  onConnect?: (integrationId: string) => void;
  onDisconnect?: (connectionId: string) => void;
  onConfigure?: (connectionId: string) => void;
  className?: string;
}

export const ZoomIntegrationCard: React.FC<ZoomIntegrationCardProps> = ({
  integration,
  connection,
  onConnect,
  onDisconnect,
  onConfigure,
  className
}) => {
  const zoomFeatures = [
    { icon: FileText, text: 'Automatic transcript processing' },
    { icon: Calendar, text: 'Meeting analysis & insights' },
    { icon: Mic, text: 'Cloud recording integration' },
    { icon: Video, text: 'Real-time meeting data' }
  ];

  return (
    <Card className={`relative transition-all duration-200 hover:shadow-md border-blue-200 ${className || ""}`}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <IntegrationIcon 
              integration={integration}
              className="h-8 w-8"
            />
            <div>
              <CardTitle className="text-lg font-semibold text-blue-600">
                {integration.name}
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                {integration.description}
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant="secondary" className="capitalize bg-blue-100 text-blue-700">
              Video Conferencing
            </Badge>
            {connection && (
              <IntegrationStatus connection={connection} />
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* Zoom-specific features */}
          <div className="space-y-2">
            {zoomFeatures.map((feature, index) => (
              <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                <feature.icon className="h-4 w-4 text-blue-500" />
                <span>{feature.text}</span>
              </div>
            ))}
          </div>

          {/* Capabilities */}
          <div className="flex flex-wrap gap-1">
            {integration.capabilities.map((capability, index) => (
              <Badge 
                key={index} 
                variant="outline" 
                className="text-xs border-blue-200 text-blue-600"
              >
                {capability.name}
              </Badge>
            ))}
          </div>
          
          {/* Connection Details */}
          {connection && (
            <div className="text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>Connection:</span>
                <span className="font-medium">{connection.connectionName}</span>
              </div>
              {connection.lastSyncAt && (
                <div className="flex justify-between">
                  <span>Last Sync:</span>
                  <span>{new Date(connection.lastSyncAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          )}
          
          {/* Actions */}
          <IntegrationActions
            integration={integration}
            connection={connection}
            onConnect={onConnect}
            onDisconnect={onDisconnect}
            onConfigure={onConfigure}
          />
        </div>
      </CardContent>
    </Card>
  );
};