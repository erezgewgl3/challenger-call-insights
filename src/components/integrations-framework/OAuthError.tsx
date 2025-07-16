import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

interface OAuthErrorProps {
  error?: string;
  onRetry: () => void;
}

export function OAuthError({ error, onRetry }: OAuthErrorProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="p-8 text-center max-w-md mx-auto">
        <div className="space-y-6">
          <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Integration Failed
            </h2>
            <p className="text-muted-foreground">
              {error || "There was an error connecting your integration. Please try again."}
            </p>
          </div>

          <div className="space-y-3">
            <Button onClick={onRetry} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <p className="text-xs text-muted-foreground">
              If this problem persists, please contact support.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}