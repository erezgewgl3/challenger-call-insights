import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ExternalLink, Settings, Zap, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { useZapierIntegration } from "@/hooks/useZapier";
import { useZapierStatus } from "@/hooks/useZapierStatus";
import { IntegrationIcon } from "./IntegrationIcon";

interface ZapierIntegrationCardProps {
  onOpenManager?: () => void;
  className?: string;
}

export function ZapierIntegrationCard({
  onOpenManager,
  className
}: ZapierIntegrationCardProps) {
  const { isSetupComplete, setupStatus } = useZapierIntegration();
  const { getStatus } = useZapierStatus();
  
  const status = getStatus();
  const { successRate, activeWebhooks, activeApiKeys } = status;

  return (
    <Card className={`relative transition-all duration-200 hover:shadow-md ${className || ""}`}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Zap className="h-8 w-8 text-orange-500" />
              <div 
                className={`absolute -top-1 -right-1 h-3 w-3 rounded-full ${status.color}`}
                title={status.text}
              />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">
                Zapier Integration
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Automate workflows with 5,000+ apps
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge 
              variant={status.status === 'connected' ? "default" : "secondary"}
              className="capitalize"
            >
              {status.text}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* Setup Progress */}
          {!isSetupComplete && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Setup Progress</span>
                <span className="font-medium">
                  {setupStatus.step === 'api-key' ? '1/3' : 
                   setupStatus.step === 'webhook' ? '2/3' : '3/3'}
                </span>
              </div>
              <Progress 
                value={
                  setupStatus.step === 'api-key' ? 33 : 
                  setupStatus.step === 'webhook' ? 66 : 100
                } 
                className="h-2"
              />
              <p className="text-xs text-muted-foreground">{setupStatus.message}</p>
            </div>
          )}

          {/* Statistics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Success Rate</span>
              </div>
              <div className="text-2xl font-bold">{successRate}%</div>
              <p className="text-xs text-muted-foreground">Last 24 hours</p>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Active Hooks</span>
              </div>
              <div className="text-2xl font-bold">{activeWebhooks}</div>
              <p className="text-xs text-muted-foreground">{activeApiKeys} API keys</p>
            </div>
          </div>

          {/* Quick Setup Instructions */}
          {!isSetupComplete && (
            <div className="rounded-lg bg-muted/50 p-3 space-y-2">
              <h4 className="font-medium text-sm">Quick Setup:</h4>
              <ol className="text-xs text-muted-foreground space-y-1">
                <li className="flex items-center gap-2">
                  <div className={`h-1.5 w-1.5 rounded-full ${
                    activeApiKeys > 0 ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                  Generate an API key for authentication
                </li>
                <li className="flex items-center gap-2">
                  <div className={`h-1.5 w-1.5 rounded-full ${
                    activeWebhooks > 0 ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                  Create webhooks for your Zaps
                </li>
                <li className="flex items-center gap-2">
                <div className={`h-1.5 w-1.5 rounded-full ${
                    status.status === 'connected' ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                  Test the connection
                </li>
              </ol>
            </div>
          )}

          {/* Recent Issues */}
          {isSetupComplete && successRate < 90 && (
            <div className="rounded-lg bg-destructive/10 p-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <span className="text-sm font-medium text-destructive">
                  Delivery Issues Detected
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Some webhooks are experiencing failures. Check the monitor for details.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button 
              onClick={onOpenManager}
              className="flex-1"
              variant={isSetupComplete ? "outline" : "default"}
            >
              <Settings className="h-4 w-4 mr-2" />
              {isSetupComplete ? "Manage" : "Setup"}
            </Button>
            
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => window.open('https://zapier.com/apps/sales-whisperer', '_blank')}
              title="View on Zapier"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}