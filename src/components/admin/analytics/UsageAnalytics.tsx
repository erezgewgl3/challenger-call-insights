
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, Users, FileText, TrendingUp, Clock, Target, Activity } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useUsageMetrics, useFeatureUsage } from '@/hooks/useUsageAnalytics';

const UsageAnalytics: React.FC = () => {
  const { data: metrics, isLoading: metricsLoading } = useUsageMetrics();
  const { data: featureUsage, isLoading: featureLoading } = useFeatureUsage();

  if (metricsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Usage Analytics</h2>
        <p className="text-muted-foreground">
          Platform usage patterns, feature adoption, and user engagement metrics
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.dailyActiveUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              {metrics?.weeklyGrowth ? `${metrics.weeklyGrowth > 0 ? '+' : ''}${metrics.weeklyGrowth}% from last week` : 'No change from last week'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transcripts This Month</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.transcriptsThisMonth || 0}</div>
            <p className="text-xs text-muted-foreground">
              Avg {metrics?.avgTranscriptsPerUser || 0} per user
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Session Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.avgSessionTime || '0m'}</div>
            <p className="text-xs text-muted-foreground">Estimated average</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Feature Adoption</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.featureAdoption || 0}%</div>
            <p className="text-xs text-muted-foreground">Overall adoption rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="engagement">User Engagement</TabsTrigger>
          <TabsTrigger value="features">Feature Usage</TabsTrigger>
          <TabsTrigger value="trends">Usage Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Platform Usage Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Daily Active Users</span>
                  <span className="font-semibold">{metrics?.dailyActiveUsers || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Transcripts This Month</span>
                  <span className="font-semibold">{metrics?.transcriptsThisMonth || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Feature Adoption Rate</span>
                  <span className="font-semibold">{metrics?.featureAdoption || 0}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Weekly Return Rate</span>
                  <span className="font-semibold">{metrics?.weeklyReturnRate || 0}%</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Key Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Users actively using transcripts</span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {metrics?.dailyActiveUsers || 0} users
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm">Average sessions per user</span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {metrics?.avgSessionsPerUser || 0}
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span className="text-sm">Monthly growth rate</span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {metrics?.weeklyGrowth || 0}%
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-sm">Monthly retention</span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {metrics?.monthlyRetention || 0}%
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="engagement">
          <Card>
            <CardHeader>
              <CardTitle>User Engagement Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">
                User engagement analytics including session duration, return rates, and feature interaction patterns.
              </p>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{metrics?.weeklyReturnRate || 0}%</p>
                  <p className="text-sm text-muted-foreground">Weekly Return Rate</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{metrics?.avgSessionsPerUser || 0}</p>
                  <p className="text-sm text-muted-foreground">Avg Sessions/User</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">{metrics?.featureDiscoveryRate || 0}%</p>
                  <p className="text-sm text-muted-foreground">Feature Discovery Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features">
          <Card>
            <CardHeader>
              <CardTitle>Feature Usage Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {featureLoading ? (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner size="lg" />
                </div>
              ) : (
                featureUsage?.map((feature) => (
                  <div key={feature.feature} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span>{feature.feature}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{width: `${Math.min(100, feature.usagePercentage)}%`}}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{feature.usagePercentage}%</span>
                    </div>
                  </div>
                )) || []
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Usage Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">
                Platform growth and usage patterns over time.
              </p>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Weekly Growth</h4>
                    <p className="text-3xl font-bold text-green-600">
                      {metrics?.weeklyGrowth ? `${metrics.weeklyGrowth > 0 ? '+' : ''}${metrics.weeklyGrowth}%` : '0%'}
                    </p>
                    <p className="text-sm text-muted-foreground">User activity increase</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Monthly Retention</h4>
                    <p className="text-3xl font-bold text-blue-600">{metrics?.monthlyRetention || 0}%</p>
                    <p className="text-sm text-muted-foreground">Users returning monthly</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Peak Usage Hours</h4>
                    <p className="text-3xl font-bold text-orange-600">{metrics?.peakUsageHours || 'N/A'}</p>
                    <p className="text-sm text-muted-foreground">Highest activity window</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Avg Transcripts/User</h4>
                    <p className="text-3xl font-bold text-purple-600">{metrics?.avgTranscriptsPerUser || 0}</p>
                    <p className="text-sm text-muted-foreground">Per month average</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UsageAnalytics;
