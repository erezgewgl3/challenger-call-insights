
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Target } from "lucide-react";

export function ActionItemsSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Target className="h-5 w-5" />
          <span>Recommended Actions</span>
        </CardTitle>
        <CardDescription>Focus areas for your next sales conversation</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Strengthen Teaching</h4>
            <p className="text-sm text-blue-700">
              Prepare 2-3 provocative insights specific to their industry before your next call
            </p>
          </div>
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-medium text-green-900 mb-2">Enhance Tailoring</h4>
            <p className="text-sm text-green-700">
              Research their recent company initiatives to better personalize your economic impact discussion
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
