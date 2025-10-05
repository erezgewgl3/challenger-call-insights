import React from "react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertCircle, CheckCircle, Clock, XCircle, Shield } from "lucide-react";
import { IntegrationConnection } from "@/lib/integrations/types";

interface IntegrationStatusProps {
  connection: IntegrationConnection;
  showLabel?: boolean;
  className?: string;
}

export function IntegrationStatus({ 
  connection, 
  showLabel = true, 
  className 
}: IntegrationStatusProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return {
          variant: 'default' as const,
          icon: CheckCircle,
          label: 'Active',
          color: 'text-green-600',
          description: 'Connection is active and working properly'
        };
      case 'inactive':
        return {
          variant: 'secondary' as const,
          icon: Clock,
          label: 'Inactive',
          color: 'text-yellow-600',
          description: 'Connection is inactive but can be reactivated'
        };
      case 'error':
        return {
          variant: 'destructive' as const,
          icon: XCircle,
          label: 'Error',
          color: 'text-red-600',
          description: connection.lastError || 'Connection has encountered an error'
        };
      case 'pending':
        return {
          variant: 'outline' as const,
          icon: AlertCircle,
          label: 'Pending',
          color: 'text-blue-600',
          description: 'Connection is being established'
        };
      default:
        return {
          variant: 'outline' as const,
          icon: AlertCircle,
          label: 'Unknown',
          color: 'text-gray-600',
          description: 'Unknown connection status'
        };
    }
  };

  const statusConfig = getStatusConfig(connection.connectionStatus);
  const StatusIcon = statusConfig.icon;

  const statusBadge = (
    <Badge 
      variant={statusConfig.variant} 
      className={`flex items-center gap-1 ${className || ""}`}
    >
      <StatusIcon className={`h-3 w-3 ${statusConfig.color}`} />
      {showLabel && <span>{statusConfig.label}</span>}
    </Badge>
  );

  const isVaultSecured = !!connection.vaultSecretId;

  return (
    <div className="flex items-center gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          {statusBadge}
        </TooltipTrigger>
        <TooltipContent>
          <div className="max-w-xs">
            <p className="font-medium">{statusConfig.label} Connection</p>
            <p className="text-sm text-muted-foreground mt-1">
              {statusConfig.description}
            </p>
            {connection.lastSyncAt && (
              <p className="text-xs text-muted-foreground mt-2">
                Last sync: {new Date(connection.lastSyncAt).toLocaleString()}
              </p>
            )}
            {connection.errorCount > 0 && (
              <p className="text-xs text-destructive mt-1">
                {connection.errorCount} error(s) recorded
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
      
      {isVaultSecured && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="flex items-center gap-1">
              <Shield className="h-3 w-3 text-green-600" />
              {showLabel && <span className="text-xs">Secured</span>}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-sm">
              Credentials are encrypted and stored securely in Supabase Vault
            </p>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}