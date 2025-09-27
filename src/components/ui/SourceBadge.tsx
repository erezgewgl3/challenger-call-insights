import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Video, FileText, Zap, Building2, Webhook } from 'lucide-react';

interface SourceBadgeProps {
  source: 'manual' | 'zoom' | 'zapier' | 'zoho' | string;
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
      className: 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800'
    },
    zapier: {
      label: 'Zapier Integration',
      icon: Zap,
      variant: 'default' as const,
      className: 'bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-950 dark:text-orange-400 dark:border-orange-800'
    },
    zoho: {
      label: 'Zoho CRM',
      icon: Building2,
      variant: 'default' as const,
      className: 'bg-green-50 text-green-600 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800'
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