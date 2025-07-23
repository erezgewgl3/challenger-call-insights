import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Video, FileText } from 'lucide-react';

interface SourceBadgeProps {
  source: 'manual' | 'zoom' | string;
  className?: string;
}

export const SourceBadge = ({ source, className = '' }: SourceBadgeProps) => {
  const sourceConfig = {
    manual: {
      label: 'Manual Upload',
      icon: FileText,
      variant: 'secondary' as const,
      className: 'bg-muted text-muted-foreground border-muted'
    },
    zoom: {
      label: 'Zoom Meeting',
      icon: Video,
      variant: 'default' as const,
      className: 'bg-primary/10 text-primary border-primary/20'
    }
  };

  const config = sourceConfig[source] || sourceConfig.manual;
  const Icon = config.icon;

  return (
    <Badge 
      variant={config.variant}
      className={`inline-flex items-center gap-1 text-xs font-medium ${config.className} ${className}`}
    >
      <Icon className="w-3 h-3" />
      {config.label}
    </Badge>
  );
};