import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, AlertCircle, XCircle, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface MatchConfidenceIndicatorProps {
  confidence: number;
  size?: 'sm' | 'md' | 'lg';
  showProgress?: boolean;
  showIcon?: boolean;
}

export const MatchConfidenceIndicator: React.FC<MatchConfidenceIndicatorProps> = ({
  confidence,
  size = 'md',
  showProgress = false,
  showIcon = true
}) => {
  const getConfidenceLevel = (confidence: number) => {
    if (confidence >= 85) return 'high';
    if (confidence >= 70) return 'medium';
    if (confidence >= 50) return 'low';
    return 'none';
  };

  const getConfidenceColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'none': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getConfidenceIcon = (level: string) => {
    const iconClasses = cn(
      "flex-shrink-0",
      size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'
    );

    switch (level) {
      case 'high': return <CheckCircle className={cn(iconClasses, "text-green-600")} />;
      case 'medium': return <AlertCircle className={cn(iconClasses, "text-yellow-600")} />;
      case 'low': return <XCircle className={cn(iconClasses, "text-orange-600")} />;
      case 'none': return <HelpCircle className={cn(iconClasses, "text-red-600")} />;
      default: return <HelpCircle className={cn(iconClasses, "text-gray-600")} />;
    }
  };

  const getConfidenceText = (level: string) => {
    switch (level) {
      case 'high': return 'High Confidence';
      case 'medium': return 'Medium Confidence';
      case 'low': return 'Low Confidence';
      case 'none': return 'No Match';
      default: return 'Unknown';
    }
  };

  const getProgressColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-orange-500';
      case 'none': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const level = getConfidenceLevel(confidence);
  const colorClasses = getConfidenceColor(level);
  const text = getConfidenceText(level);
  const icon = getConfidenceIcon(level);

  if (showProgress) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {showIcon && icon}
            <span className={cn(
              "font-medium",
              size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-lg' : 'text-base'
            )}>
              {text}
            </span>
          </div>
          <span className={cn(
            "font-semibold",
            size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-lg' : 'text-base'
          )}>
            {confidence}%
          </span>
        </div>
        <div className="relative">
          <Progress 
            value={confidence} 
            className={cn(
              "w-full",
              size === 'sm' ? 'h-1' : size === 'lg' ? 'h-3' : 'h-2'
            )}
          />
          <div 
            className={cn(
              "absolute top-0 left-0 h-full rounded-full transition-all",
              getProgressColor(level)
            )}
            style={{ width: `${confidence}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <Badge 
      variant="outline" 
      className={cn(
        colorClasses,
        "flex items-center gap-1.5 font-medium",
        size === 'sm' ? 'text-xs py-0.5 px-2' : 
        size === 'lg' ? 'text-base py-2 px-4' : 
        'text-sm py-1 px-3'
      )}
    >
      {showIcon && icon}
      <span>{confidence}%</span>
      <span className="hidden sm:inline">- {text}</span>
    </Badge>
  );
};