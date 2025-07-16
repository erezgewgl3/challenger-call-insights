import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

interface OAuthSuccessProps {
  integrationName?: string;
  connectionName?: string;
  onContinue: () => void;
}

export function OAuthSuccess({ integrationName, connectionName, onContinue }: OAuthSuccessProps) {
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onContinue();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onContinue]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="p-8 text-center max-w-md mx-auto">
        <div className="space-y-6">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-primary" />
          </div>
          
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Integration Successful!
            </h2>
            <p className="text-muted-foreground">
              {integrationName || "Your integration"} has been connected successfully.
              {connectionName && (
                <span className="block mt-1 font-medium">
                  Connection: {connectionName}
                </span>
              )}
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Redirecting to admin dashboard in {countdown} seconds...
            </p>
            <Button onClick={onContinue} className="w-full">
              Continue to Dashboard
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}