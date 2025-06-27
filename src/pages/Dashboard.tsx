
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Upload, 
  Brain, 
  BarChart3, 
  Users, 
  TrendingUp,
  FileText,
  Calendar,
  Target,
  Award,
  ChevronRight
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import UploadTranscript from "@/components/UploadTranscript";
import CallAnalysis from "@/components/CallAnalysis";

const Dashboard = () => {
  const [selectedTab, setSelectedTab] = useState("overview");

  // Mock data for demonstration
  const recentCalls = [
    {
      id: 1,
      prospect: "Acme Corp",
      contact: "John Smith",
      date: "2024-01-15",
      duration: "45 min",
      challengerScore: 85,
      teaching: 88,
      tailoring: 82,
      control: 85,
      status: "Won"
    },
    {
      id: 2,
      prospect: "TechStart Inc",
      contact: "Sarah Johnson",
      date: "2024-01-14",
      duration: "32 min",
      challengerScore: 72,
      teaching: 75,
      tailoring: 68,
      control: 73,
      status: "In Progress"
    },
    {
      id: 3,
      prospect: "Global Solutions",
      contact: "Mike Chen",
      date: "2024-01-12",
      duration: "28 min",
      challengerScore: 91,
      teaching: 93,
      tailoring: 89,
      control: 92,
      status: "Won"
    }
  ];

  const stats = {
    totalCalls: 47,
    avgChallengerScore: 78,
    winRate: 64,
    improvement: 12
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Sales Dashboard</h1>
            <p className="text-slate-600">Track your performance and improve your Challenger sales approach</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Calls Analyzed</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalCalls}</div>
                <p className="text-xs text-muted-foreground">
                  +12% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Challenger Score</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.avgChallengerScore}</div>
                <p className="text-xs text-muted-foreground">
                  +{stats.improvement}% improvement
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.winRate}%</div>
                <p className="text-xs text-muted-foreground">
                  +8% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Month</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">15</div>
                <p className="text-xs text-muted-foreground">
                  Calls analyzed
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="upload">Upload Call</TabsTrigger>
              <TabsTrigger value="analysis">Analysis</TabsTrigger>
              <TabsTrigger value="prospects">Prospects</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Challenger Methodology Overview */}
              <Card>
                <CardHeader>
                  <CardTitle>Challenger Methodology Performance</CardTitle>
                  <CardDescription>Your average scores across the three pillars</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Teaching</span>
                        <span className="text-sm text-muted-foreground">82/100</span>
                      </div>
                      <Progress value={82} className="h-2 bg-blue-100">
                        <div className="h-full bg-blue-600 rounded-full" style={{ width: '82%' }} />
                      </Progress>
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Tailoring</span>
                        <span className="text-sm text-muted-foreground">76/100</span>
                      </div>
                      <Progress value={76} className="h-2 bg-green-100">
                        <div className="h-full bg-green-600 rounded-full" style={{ width: '76%' }} />
                      </Progress>
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Control</span>
                        <span className="text-sm text-muted-foreground">79/100</span>
                      </div>
                      <Progress value={79} className="h-2 bg-purple-100">
                        <div className="h-full bg-purple-600 rounded-full" style={{ width: '79%' }} />
                      </Progress>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Calls */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Call Analysis</CardTitle>
                  <CardDescription>Your latest analyzed sales conversations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentCalls.map((call) => (
                      <div key={call.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Users className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-medium">{call.prospect}</h4>
                            <p className="text-sm text-slate-600">{call.contact} • {call.date}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <div className="font-medium">Score: {call.challengerScore}</div>
                            <div className="text-sm text-slate-600">{call.duration}</div>
                          </div>
                          <Badge variant={call.status === "Won" ? "default" : "secondary"}>
                            {call.status}
                          </Badge>
                          <ChevronRight className="h-4 w-4 text-slate-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="upload">
              <UploadTranscript />
            </TabsContent>

            <TabsContent value="analysis">
              <CallAnalysis />
            </TabsContent>

            <TabsContent value="prospects" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Prospect Management</CardTitle>
                  <CardDescription>Track your prospects and conversation history</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Users className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">Prospect Management</h3>
                    <p className="text-slate-600 mb-6">Organize and track all your sales prospects in one place</p>
                    <Button>Add New Prospect</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
