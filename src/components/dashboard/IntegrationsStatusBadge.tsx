import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { CheckCircle, AlertTriangle, Settings, XCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useZoomConnection } from '@/hooks/useZoomConnection';
import { useZapierStatus } from '@/hooks/useZapierStatus';

interface IntegrationInfo {
  name: string;
  connected: boolean;
  loading: boolean;
  error?: string;
}

export const IntegrationsStatusBadge: React.FC = () => {
  const navigate = useNavigate();
  const { isConnected: zoomConnected, isLoading: zoomLoading, error: zoomError } = useZoomConnection();
  const { status: zapierStatus, isLoading: zapierLoading } = useZapierStatus();

  const handleClick = () => {
    navigate('/integrations');
  };

  // Build integration info array
  const integrations: IntegrationInfo[] = [
    {
      name: 'Zoom',
      connected: zoomConnected,
      loading: zoomLoading,
      error: zoomError?.message
    },
    {
      name: 'Zapier',
      connected: zapierStatus.status === 'connected',
      loading: zapierLoading,
      error: zapierStatus.status === 'error' ? 'Connection error' : undefined
    }
  ];

  const connectedCount = integrations.filter(i => i.connected).length;
  const totalCount = integrations.length;
  const hasErrors = integrations.some(i => i.error);
  const isLoading = integrations.some(i => i.loading);
  const hasAnyConnection = connectedCount > 0;

  const getBadgeConfig = () => {
    if (isLoading) {
      return {
        variant: 'outline' as const,
        className: 'cursor-pointer hover:bg-muted/50 transition-colors border-amber-200 text-amber-700 bg-amber-50',
        icon: Loader2,
        iconClassName: 'h-3 w-3 mr-1.5 animate-spin',
        text: 'Checking...',
        description: 'Checking integration status...'
      };
    }

    // Issue State: One or more integrations have problems
    if (hasErrors || (hasAnyConnection && connectedCount < totalCount)) {
      return {
        variant: 'destructive' as const,
        className: 'cursor-pointer hover:bg-destructive/90 transition-colors',
        icon: XCircle,
        iconClassName: 'h-3 w-3 mr-1.5',
        text: 'Integration Issues',
        description: hasErrors 
          ? 'Some integrations have connection errors. Click to resolve.'
          : `${connectedCount} of ${totalCount} integrations connected. Click to complete setup.`
      };
    }

    // Green State: All defined integrations working
    if (connectedCount === totalCount && totalCount > 0) {
      return {
        variant: 'default' as const,
        className: 'cursor-pointer hover:bg-primary/90 transition-colors bg-green-600 text-white border-green-600',
        icon: CheckCircle,
        iconClassName: 'h-3 w-3 mr-1.5',
        text: 'Integrations',
        description: `All ${totalCount} integrations are connected and working properly.`
      };
    }

    // Neutral State: No integrations defined or connected
    return {
      variant: 'outline' as const,
      className: 'cursor-pointer hover:bg-muted/50 transition-colors border-muted text-muted-foreground bg-muted/20',
      icon: Settings,
      iconClassName: 'h-3 w-3 mr-1.5',
      text: 'Integrations',
      description: 'Connect your integrations to enhance your workflow.'
    };
  };

  const config = getBadgeConfig();
  const Icon = config.icon;

  const badge = (
    <Badge
      variant={config.variant}
      className={`${config.className} min-w-fit px-3 py-1`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <Icon className={config.iconClassName} />
      <span className="text-xs font-medium whitespace-nowrap">{config.text}</span>
    </Badge>
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {badge}
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-xs">
        <div className="space-y-2">
          <p className="font-medium">{config.description}</p>
          <div className="space-y-1">
            {integrations.map((integration) => (
              <div key={integration.name} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{integration.name}:</span>
                <span className={`font-medium ${
                  integration.error 
                    ? 'text-destructive' 
                    : integration.connected 
                    ? 'text-green-600' 
                    : 'text-muted-foreground'
                }`}>
                  {integration.loading 
                    ? 'Checking...' 
                    : integration.error 
                    ? 'Error' 
                    : integration.connected 
                    ? 'Connected' 
                    : 'Not Connected'
                  }
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground pt-1 border-t">
            Click to manage integrations
          </p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
};