
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { KeyMoment } from "@/services/mockAnalysisService";

interface KeyMomentsSectionProps {
  moments: KeyMoment[];
}

export function KeyMomentsSection({ moments }: KeyMomentsSectionProps) {
  return (
    <div className="space-y-4">
      <h4 className="font-medium">Key Moments in the Conversation</h4>
      {moments.map((moment, index) => (
        <div key={index} className="flex items-start space-x-4 p-4 border rounded-lg">
          <div className="w-12 h-8 bg-slate-100 rounded flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-mono">{moment.timestamp}</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <Badge variant="outline" className="capitalize">
                {moment.type}
              </Badge>
              {moment.impact === "positive" ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-amber-600" />
              )}
            </div>
            <p className="text-sm text-slate-700">{moment.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
