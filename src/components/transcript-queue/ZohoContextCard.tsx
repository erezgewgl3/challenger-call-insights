import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, User, ExternalLink } from 'lucide-react';

interface ZohoContextCardProps {
  dealContext: {
    company_name?: string;
    contact_name?: string;
    deal_name?: string;
  };
  zohoDealId?: string | null;
  compact?: boolean;
}

export function ZohoContextCard({ dealContext, zohoDealId, compact = false }: ZohoContextCardProps) {
  const zohoDealUrl = zohoDealId 
    ? `https://crm.zoho.com/crm/ShowEntityInfo.do?id=${zohoDealId}&module=Potentials`
    : null;

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {dealContext.company_name && (
          <div className="flex items-center gap-1">
            <Building2 className="h-3 w-3" />
            {dealContext.company_name}
          </div>
        )}
        {dealContext.contact_name && (
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            {dealContext.contact_name}
          </div>
        )}
        {zohoDealUrl && (
          <Button variant="ghost" size="sm" asChild className="h-6 px-2">
            <a href={zohoDealUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3 w-3" />
            </a>
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card className="bg-muted/50 border-dashed">
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">Zoho CRM</Badge>
              {dealContext.deal_name && (
                <span className="font-medium text-sm">{dealContext.deal_name}</span>
              )}
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {dealContext.company_name && (
                <div className="flex items-center gap-1">
                  <Building2 className="h-4 w-4" />
                  {dealContext.company_name}
                </div>
              )}
              {dealContext.contact_name && (
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {dealContext.contact_name}
                </div>
              )}
            </div>
          </div>

          {zohoDealUrl && (
            <Button variant="outline" size="sm" asChild>
              <a href={zohoDealUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-1" />
                View Deal
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}