import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IntegrationConfig, IntegrationConnection } from "@/lib/integrations/types";
import { IntegrationStatus } from "./IntegrationStatus";
import { IntegrationActions } from "./IntegrationActions";
import { IntegrationIcon } from "./IntegrationIcon";

interface IntegrationCardProps {
  integration: IntegrationConfig;
  connection?: IntegrationConnection;
  onConnect?: (integrationId: string) => void;
  onDisconnect?: (connectionId: string) => void;
  onConfigure?: (connectionId: string) => void;
  className?: string;
}

export function IntegrationCard({
  integration,
  connection,
  onConnect,
  onDisconnect,
  onConfigure,
  className
}: IntegrationCardProps) {
  return (
    <Card className={`relative transition-all duration-200 hover:shadow-md ${className || ""}`}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <IntegrationIcon 
              integration={integration}
              className="h-8 w-8"
            />
            <div>
              <CardTitle className="text-lg font-semibold">
                {integration.name}
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                {integration.description}
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge 
              variant={integration.category === 'crm' ? 'default' : 'secondary'}
              className="capitalize"
            >
              {integration.category}
            </Badge>
            {connection && (
              <IntegrationStatus connection={connection} />
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* Capabilities */}
          <div className="flex flex-wrap gap-1">
            {integration.capabilities.map((capability, index) => (
              <Badge 
                key={index} 
                variant="outline" 
                className="text-xs"
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
}