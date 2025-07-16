import React from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { MoreHorizontal, Plug, Settings, Trash2, RefreshCw, Play, Pause } from "lucide-react";
import { IntegrationConfig, IntegrationConnection } from "@/lib/integrations/types";

interface IntegrationActionsProps {
  integration: IntegrationConfig;
  connection?: IntegrationConnection;
  onConnect?: (integrationId: string) => void;
  onDisconnect?: (connectionId: string) => void;
  onConfigure?: (connectionId: string) => void;
  onSync?: (connectionId: string) => void;
  onPause?: (connectionId: string) => void;
  onResume?: (connectionId: string) => void;
  className?: string;
}

export function IntegrationActions({
  integration,
  connection,
  onConnect,
  onDisconnect,
  onConfigure,
  onSync,
  onPause,
  onResume,
  className
}: IntegrationActionsProps) {
  const handleConnect = () => {
    onConnect?.(integration.id);
  };

  const handleDisconnect = () => {
    if (connection) {
      onDisconnect?.(connection.id);
    }
  };

  const handleConfigure = () => {
    if (connection) {
      onConfigure?.(connection.id);
    }
  };

  const handleSync = () => {
    if (connection) {
      onSync?.(connection.id);
    }
  };

  const handlePause = () => {
    if (connection) {
      onPause?.(connection.id);
    }
  };

  const handleResume = () => {
    if (connection) {
      onResume?.(connection.id);
    }
  };

  // If no connection exists, show connect button
  if (!connection) {
    return (
      <div className={`flex justify-end ${className || ""}`}>
        <Button 
          onClick={handleConnect}
          disabled={!integration.isActive || integration.isDeprecated}
          size="sm"
          className="flex items-center gap-2"
        >
          <Plug className="h-4 w-4" />
          Connect
        </Button>
      </div>
    );
  }

  // If connection exists, show dropdown with actions
  return (
    <div className={`flex justify-end ${className || ""}`}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {onConfigure && (
            <DropdownMenuItem onClick={handleConfigure} className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configure
            </DropdownMenuItem>
          )}
          
          {onSync && connection.connectionStatus === 'active' && (
            <DropdownMenuItem onClick={handleSync} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Sync Now
            </DropdownMenuItem>
          )}
          
          {onPause && connection.connectionStatus === 'active' && (
            <DropdownMenuItem onClick={handlePause} className="flex items-center gap-2">
              <Pause className="h-4 w-4" />
              Pause
            </DropdownMenuItem>
          )}
          
          {onResume && connection.connectionStatus === 'inactive' && (
            <DropdownMenuItem onClick={handleResume} className="flex items-center gap-2">
              <Play className="h-4 w-4" />
              Resume
            </DropdownMenuItem>
          )}
          
          {(onConfigure || onSync || onPause || onResume) && (
            <DropdownMenuSeparator />
          )}
          
          {onDisconnect && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem 
                  onSelect={(e) => e.preventDefault()}
                  className="flex items-center gap-2 text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  Disconnect
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Disconnect Integration</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to disconnect "{connection.connectionName}"? 
                    This will stop all data synchronization and remove the connection.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDisconnect}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Disconnect
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}