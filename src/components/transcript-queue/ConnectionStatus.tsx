import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

interface ConnectionStatusProps {
  status: 'connecting' | 'connected' | 'disconnected';
  onRefresh?: () => void;
}

export function ConnectionStatus({ status, onRefresh }: ConnectionStatusProps) {
  const statusConfig = {
    connected: {
      icon: <Wifi className="h-3 w-3" />,
      label: 'Live',
      variant: 'default' as const,
      color: 'text-green-600'
    },
    connecting: {
      icon: <RefreshCw className="h-3 w-3 animate-spin" />,
      label: 'Connecting',
      variant: 'secondary' as const,
      color: 'text-yellow-600'
    },
    disconnected: {
      icon: <WifiOff className="h-3 w-3" />,
      label: 'Offline',
      variant: 'destructive' as const,
      color: 'text-red-600'
    }
  };

  const config = statusConfig[status];

  return (
    <div className="flex items-center gap-2">
      <Badge variant={config.variant} className="flex items-center gap-1">
        {config.icon}
        {config.label}
      </Badge>
      
      {status === 'disconnected' && onRefresh && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          className="h-6 px-2"
        >
          <RefreshCw className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}