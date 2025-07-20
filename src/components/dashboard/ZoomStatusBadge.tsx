
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Video, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useZoomConnection } from '@/hooks/useZoomConnection';

export const ZoomStatusBadge: React.FC = () => {
  const navigate = useNavigate();
  const { isConnected, isLoading, error } = useZoomConnection();

  // Hide badge on error to prevent breaking existing layout
  if (error) {
    return null;
  }

  const handleClick = () => {
    navigate('/integrations');
  };

  const getBadgeProps = () => {
    if (isLoading) {
      return {
        variant: 'outline' as const,
        className: 'cursor-pointer hover:bg-muted/50 transition-colors border-amber-200 text-amber-700 bg-amber-50',
        children: (
          <>
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            <span className="text-xs">Checking...</span>
          </>
        )
      };
    }

    if (isConnected) {
      return {
        variant: 'default' as const,
        className: 'cursor-pointer hover:bg-green-600 transition-colors bg-green-500 text-white border-green-500',
        children: (
          <>
            <Video className="h-3 w-3 mr-1" />
            <span className="text-xs">Connected</span>
          </>
        )
      };
    }

    return {
      variant: 'outline' as const,
      className: 'cursor-pointer hover:bg-muted transition-colors text-muted-foreground bg-gray-50',
      children: (
        <>
          <Video className="h-3 w-3 mr-1" />
          <span className="text-xs">ZOOM Not Connected</span>
        </>
      )
    };
  };

  const badgeProps = getBadgeProps();

  return (
    <Badge
      {...badgeProps}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      aria-label={`Zoom integration ${isConnected ? 'connected' : 'not connected'}. Click to configure.`}
      style={{ maxWidth: '100px' }}
    />
  );
};
