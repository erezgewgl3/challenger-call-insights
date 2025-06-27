
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Target, 
  TrendingUp, 
  BookOpen, 
  Users, 
  Shield,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  Download
} from "lucide-react";

const CallAnalysis = () => {
  // Mock analysis data
  const analysisData = {
    overallScore: 84,
    teaching: {
      score: 88,
      insights: [
        "Effectively identified customer's unknown problem with current workflow",
        "Provided industry benchmarks and statistics to support arguments",
        "Shared relevant case study from similar company"
      ],
      improvements: [
        "Could have introduced more provocative insights earlier in the conversation",
        "Missed opportunity to challenge assumption about budget constraints"
      ]
    },
    tailoring: {
      score: 79,
      insights: [
        "Adapted message well for technical vs business stakeholders",
        "Referenced customer's specific industry challenges",
        "Customized solution benefits to their use case"
      ],
      improvements: [
        "Could have better personalized the economic impact discussion",
        "Missed opportunity to address specific organizational pain points"
      ]
    },
    control: {
      score: 86,
      insights: [
        "Maintained conversation flow and guided toward next steps",
        "Successfully addressed objections with confidence",
        "Set clear expectations for follow-up activities"
      ],
      improvements: [
        "Could have been more assertive about timeline commitments",
        "Opportunity to push back more on unrealistic requirements"
      ]
    }
  };

  const keyMoments = [
    {
      timestamp: "05:32",
      type: "teaching",
      description: "Introduced industry insight about automation ROI",
      impact: "positive"
    },
    {
      timestamp: "12:18",
      type: "tailoring",
      description: "Customized demo for their specific workflow",
      impact: "positive"
    },
    {
      timestamp: "18:45",
      type: "control",
      description: "Successfully redirected pricing discussion",
      impact: "positive"
    },
    {
      timestamp: "23:12",
      type: "teaching",
      description: "Missed opportunity to challenge their timeline assumptions",
      impact: "improvement"
    }
  ];

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
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <BookOpen className="h-4 w-4 text-blue-600" />
              </div>
              <CardTitle className="text-lg">Teaching</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl font-bold">{analysisData.teaching.score}</span>
                  <Badge variant="default">Excellent</Badge>
                </div>
                <Progress value={analysisData.teaching.score} className="h-2" />
              </div>
              <p className="text-sm text-slate-600">
                Strong use of insights and industry knowledge to educate the prospect
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="h-4 w-4 text-green-600" />
              </div>
              <CardTitle className="text-lg">Tailoring</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl font-bold">{analysisData.tailoring.score}</span>
                  <Badge variant="secondary">Good</Badge>
                </div>
                <Progress value={analysisData.tailoring.score} className="h-2" />
              </div>
              <p className="text-sm text-slate-600">
                Good adaptation of message for different stakeholders and context
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Shield className="h-4 w-4 text-purple-600" />
              </div>
              <CardTitle className="text-lg">Control</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl font-bold">{analysisData.control.score}</span>
                  <Badge variant="default">Excellent</Badge>
                </div>
                <Progress value={analysisData.control.score} className="h-2" />
              </div>
              <p className="text-sm text-slate-600">
                Excellent control of conversation flow and objection handling
              </p>
            </div>
          </CardContent>
        </Card>
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

            <TabsContent value="teaching" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium flex items-center space-x-2 mb-3">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>What You Did Well</span>
                  </h4>
                  <ul className="space-y-2">
                    {analysisData.teaching.insights.map((insight, index) => (
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
                    {analysisData.teaching.improvements.map((improvement, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-amber-600 rounded-full mt-2 flex-shrink-0" />
                        <span className="text-sm text-slate-700">{improvement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="tailoring" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium flex items-center space-x-2 mb-3">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>What You Did Well</span>
                  </h4>
                  <ul className="space-y-2">
                    {analysisData.tailoring.insights.map((insight, index) => (
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
                    {analysisData.tailoring.improvements.map((improvement, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-amber-600 rounded-full mt-2 flex-shrink-0" />
                        <span className="text-sm text-slate-700">{improvement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="control" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium flex items-center space-x-2 mb-3">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>What You Did Well</span>
                  </h4>
                  <ul className="space-y-2">
                    {analysisData.control.insights.map((insight, index) => (
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
                    {analysisData.control.improvements.map((improvement, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-amber-600 rounded-full mt-2 flex-shrink-0" />
                        <span className="text-sm text-slate-700">{improvement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="moments" className="space-y-4">
              <div className="space-y-4">
                <h4 className="font-medium">Key Moments in the Conversation</h4>
                {keyMoments.map((moment, index) => (
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
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Action Items */}
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
