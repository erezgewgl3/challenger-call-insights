
import { CheckCircle2, Lightbulb } from "lucide-react";

interface AnalysisInsightsProps {
  insights: string[];
  improvements: string[];
}

export function AnalysisInsights({ insights, improvements }: AnalysisInsightsProps) {
  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-medium flex items-center space-x-2 mb-3">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <span>What You Did Well</span>
        </h4>
        <ul className="space-y-2">
          {insights.map((insight, index) => (
            <li key={index} className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0" />
              <span className="text-sm text-slate-700">{insight}</span>
            </li>
          ))}
        </ul>
      </div>
      
      <div>
        <h4 className="font-medium flex items-center space-x-2 mb-3">
          <Lightbulb className="h-4 w-4 text-amber-600" />
          <span>Opportunities for Improvement</span>
        </h4>
        <ul className="space-y-2">
          {improvements.map((improvement, index) => (
            <li key={index} className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-amber-600 rounded-full mt-2 flex-shrink-0" />
              <span className="text-sm text-slate-700">{improvement}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
