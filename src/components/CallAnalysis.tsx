
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BookOpen, 
  Users, 
  Shield,
  Download
} from "lucide-react";
import { mockAnalysisService } from "@/services/mockAnalysisService";
import { MethodologyScoreCard } from "@/components/analysis/MethodologyScoreCard";
import { AnalysisInsights } from "@/components/analysis/AnalysisInsights";
import { KeyMomentsSection } from "@/components/analysis/KeyMomentsSection";
import { ActionItemsSection } from "@/components/analysis/ActionItemsSection";

const CallAnalysis = () => {
  const analysisData = mockAnalysisService.getAnalysisData();
  const keyMoments = mockAnalysisService.getKeyMoments();

  return (
    <div className="space-y-6">
      {/* Overall Score Card */}
      <Card className="border-l-4 border-l-blue-600">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Overall Challenger Score</CardTitle>
              <CardDescription>Analysis for Acme Corp - John Smith call on Jan 15, 2024</CardDescription>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-blue-600">{analysisData.overallScore}</div>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Strong Performance
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Methodology Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MethodologyScoreCard
          title="Teaching"
          score={analysisData.teaching.score}
          description="Strong use of insights and industry knowledge to educate the prospect"
          icon={BookOpen}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-100"
        />
        <MethodologyScoreCard
          title="Tailoring"
          score={analysisData.tailoring.score}
          description="Good adaptation of message for different stakeholders and context"
          icon={Users}
          iconColor="text-green-600"
          iconBgColor="bg-green-100"
        />
        <MethodologyScoreCard
          title="Control"
          score={analysisData.control.score}
          description="Excellent control of conversation flow and objection handling"
          icon={Shield}
          iconColor="text-purple-600"
          iconBgColor="bg-purple-100"
        />
      </div>

      {/* Detailed Analysis Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Analysis & Coaching</CardTitle>
          <CardDescription>In-depth breakdown with actionable insights</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="teaching" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="teaching">Teaching</TabsTrigger>
              <TabsTrigger value="tailoring">Tailoring</TabsTrigger>
              <TabsTrigger value="control">Control</TabsTrigger>
              <TabsTrigger value="moments">Key Moments</TabsTrigger>
            </TabsList>

            <TabsContent value="teaching">
              <AnalysisInsights 
                insights={analysisData.teaching.insights}
                improvements={analysisData.teaching.improvements}
              />
            </TabsContent>

            <TabsContent value="tailoring">
              <AnalysisInsights 
                insights={analysisData.tailoring.insights}
                improvements={analysisData.tailoring.improvements}
              />
            </TabsContent>

            <TabsContent value="control">
              <AnalysisInsights 
                insights={analysisData.control.insights}
                improvements={analysisData.control.improvements}
              />
            </TabsContent>

            <TabsContent value="moments">
              <KeyMomentsSection moments={keyMoments} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Action Items */}
      <ActionItemsSection />

      {/* Export Options */}
      <div className="flex justify-end space-x-4">
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
        <Button>
          Save Analysis
        </Button>
      </div>
    </div>
  );
};

export default CallAnalysis;
