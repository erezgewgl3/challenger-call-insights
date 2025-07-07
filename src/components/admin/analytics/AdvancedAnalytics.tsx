
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Download, Calendar, BarChart3 } from 'lucide-react';
import { UserEngagementAnalytics } from './UserEngagementAnalytics';
import { SystemPerformanceAnalytics } from './SystemPerformanceAnalytics';
import { AIAnalyticsReports } from './AIAnalyticsReports';
import { BusinessIntelligenceReports } from './BusinessIntelligenceReports';
import { UsageTrendsAnalytics } from './UsageTrendsAnalytics';

interface DateRange {
  from: Date;
  to: Date;
}

export function AdvancedAnalytics() {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    to: new Date()
  });

  const [selectedMetrics] = useState([
    'user_engagement',
    'transcript_processing',
    'ai_performance'
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Advanced Analytics</h2>
          <p className="text-gray-600 mt-1">
            Comprehensive system insights and performance metrics
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Last 30 days
          </Button>
          <Button variant="outline" size="sm">
            <BarChart3 className="h-4 w-4 mr-2" />
            Metrics
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      <Tabs defaultValue="engagement" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="engagement">User Engagement</TabsTrigger>
          <TabsTrigger value="performance">System Performance</TabsTrigger>
          <TabsTrigger value="business">Business Intelligence</TabsTrigger>
          <TabsTrigger value="ai">AI Analytics</TabsTrigger>
          <TabsTrigger value="trends">Usage Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="engagement" className="space-y-6">
          <UserEngagementAnalytics dateRange={dateRange} />
        </TabsContent>
        
        <TabsContent value="performance" className="space-y-6">
          <SystemPerformanceAnalytics dateRange={dateRange} />
        </TabsContent>
        
        <TabsContent value="business" className="space-y-6">
          <BusinessIntelligenceReports dateRange={dateRange} />
        </TabsContent>
        
        <TabsContent value="ai" className="space-y-6">
          <AIAnalyticsReports dateRange={dateRange} />
        </TabsContent>
        
        <TabsContent value="trends" className="space-y-6">
          <UsageTrendsAnalytics dateRange={dateRange} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
