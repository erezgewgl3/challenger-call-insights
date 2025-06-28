
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { LucideIcon } from "lucide-react";

interface MethodologyScoreCardProps {
  title: string;
  score: number;
  description: string;
  icon: LucideIcon;
  iconColor: string;
  iconBgColor: string;
}

export function MethodologyScoreCard({
  title,
  score,
  description,
  icon: Icon,
  iconColor,
  iconBgColor
}: MethodologyScoreCardProps) {
  const getScoreBadge = (score: number) => {
    if (score >= 85) return { variant: "default" as const, text: "Excellent" };
    if (score >= 70) return { variant: "secondary" as const, text: "Good" };
    return { variant: "outline" as const, text: "Needs Work" };
  };

  const badge = getScoreBadge(score);

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center space-x-2">
          <div className={`w-8 h-8 ${iconBgColor} rounded-lg flex items-center justify-center`}>
            <Icon className={`h-4 w-4 ${iconColor}`} />
          </div>
          <CardTitle className="text-lg">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl font-bold">{score}</span>
              <Badge variant={badge.variant}>{badge.text}</Badge>
            </div>
            <Progress value={score} className="h-2" />
          </div>
          <p className="text-sm text-slate-600">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}
