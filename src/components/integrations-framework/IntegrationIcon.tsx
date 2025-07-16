import React from "react";
import { 
  Database, 
  Mail, 
  Calendar, 
  FolderOpen, 
  MessageSquare, 
  BarChart3,
  Settings,
  Github,
  CreditCard,
  Users,
  FileText,
  Cloud,
  Webhook,
  Zap,
  Activity
} from "lucide-react";
import { IntegrationConfig } from "@/lib/integrations/types";

interface IntegrationIconProps {
  integration: IntegrationConfig;
  className?: string;
  fallbackClassName?: string;
}

export function IntegrationIcon({ 
  integration, 
  className = "h-6 w-6",
  fallbackClassName = "text-muted-foreground"
}: IntegrationIconProps) {
  // Category-based icon mapping
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'crm':
        return Users;
      case 'email':
        return Mail;
      case 'calendar':
        return Calendar;
      case 'storage':
        return FolderOpen;
      case 'communication':
        return MessageSquare;
      case 'analytics':
        return BarChart3;
      default:
        return Settings;
    }
  };

  // Integration-specific icon mapping based on name/id
  const getIntegrationIcon = (integration: IntegrationConfig) => {
    const name = integration.name.toLowerCase();
    const id = integration.id.toLowerCase();
    
    // Common integrations
    if (name.includes('github') || id.includes('github')) {
      return Github;
    }
    if (name.includes('stripe') || id.includes('stripe')) {
      return CreditCard;
    }
    if (name.includes('slack') || id.includes('slack')) {
      return MessageSquare;
    }
    if (name.includes('salesforce') || id.includes('salesforce')) {
      return Users;
    }
    if (name.includes('hubspot') || id.includes('hubspot')) {
      return Users;
    }
    if (name.includes('mailchimp') || id.includes('mailchimp')) {
      return Mail;
    }
    if (name.includes('google') || id.includes('google')) {
      return Cloud;
    }
    if (name.includes('microsoft') || id.includes('microsoft')) {
      return Cloud;
    }
    if (name.includes('zoom') || id.includes('zoom')) {
      return MessageSquare;
    }
    if (name.includes('webhook') || id.includes('webhook')) {
      return Webhook;
    }
    if (name.includes('zapier') || id.includes('zapier')) {
      return Zap;
    }
    if (name.includes('analytics') || id.includes('analytics')) {
      return BarChart3;
    }
    if (name.includes('database') || id.includes('database')) {
      return Database;
    }
    if (name.includes('file') || id.includes('file')) {
      return FileText;
    }
    if (name.includes('monitor') || id.includes('monitor')) {
      return Activity;
    }
    
    // Fall back to category icon
    return getCategoryIcon(integration.category);
  };

  // Custom icon URL support
  if (integration.iconUrl) {
    return (
      <img 
        src={integration.iconUrl} 
        alt={`${integration.name} icon`}
        className={`${className} object-contain`}
        onError={(e) => {
          // Fallback to category icon on image load error
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          target.nextElementSibling?.classList.remove('hidden');
        }}
      />
    );
  }

  // Use icon component
  const IconComponent = getIntegrationIcon(integration);
  
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <IconComponent 
        className={`${className} ${
          integration.isActive && !integration.isDeprecated 
            ? 'text-primary' 
            : fallbackClassName
        }`}
      />
    </div>
  );
}