import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export function OAuthLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="p-8 text-center max-w-md mx-auto">
        <div className="space-y-4">
          <LoadingSpinner size="lg" />
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">
              Processing Integration
            </h2>
            <p className="text-muted-foreground">
              Please wait while we complete your integration setup...
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}