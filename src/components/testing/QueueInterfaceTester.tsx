import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { QueueDrawer } from '@/components/transcript-queue/QueueDrawer';
import { QueueTestDataGenerator } from './QueueTestDataGenerator';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  ClipboardList, 
  Filter, 
  CheckSquare, 
  XSquare, 
  Settings, 
  Eye,
  BarChart3,
  Users,
  Clock
} from 'lucide-react';

export function QueueInterfaceTester() {
  const [showQueue, setShowQueue] = useState(false);
  const { user } = useAuth();

  // Get queue summary for testing
  const { data: queueSummary, refetch: refetchSummary } = useQuery({
    queryKey: ['queue-summary', user?.id],
    queryFn: async () => {
      const { data } = await supabase.functions.invoke('get-transcript-queue', {
        body: { filters: { assignment_type: 'all' } }
      });
      return data;
    },
    enabled: !!user?.id,
    refetchInterval: 5000, // Auto-refresh every 5 seconds
  });

  const testCases = [
    {
      category: "Basic UI",
      tests: [
        "✓ Queue drawer opens and closes properly",
        "✓ Tab navigation works (My Uploads ↔ Assigned to Me)",
        "✓ Badge counts display correctly",
        "✓ Responsive design on mobile/desktop"
      ]
    },
    {
      category: "Filtering",
      tests: [
        "✓ Priority filter (urgent, high, normal, low)",
        "✓ Source filter (manual, zoom, zapier, zoho)", 
        "✓ Status filter (pending, processing, completed)",
        "✓ Combined filters work together",
        "✓ Clear all filters functionality"
      ]
    },
    {
      category: "Assignment Actions",
      tests: [
        "✓ Individual Accept/Reject buttons",
        "✓ Bulk selection checkboxes",
        "✓ Bulk accept/reject operations",
        "✓ Confirmation dialogs",
        "✓ Error handling for failed actions"
      ]
    },
    {
      category: "External Context",
      tests: [
        "✓ Zoho deal context cards display",
        "✓ Company/contact information shows",
        "✓ External links work correctly",
        "✓ Graceful handling of missing data"
      ]
    },
    {
      category: "Real-time Updates",
      tests: [
        "✓ Assignment changes reflect immediately",
        "✓ Status updates appear live",
        "✓ Connection status indicators",
        "✓ Cross-tab synchronization"
      ]
    }
  ];

  const handleOpenQueue = () => {
    setShowQueue(true);
    refetchSummary(); // Refresh data when opening
  };

  return (
    <div className="space-y-6">
      {/* Test Data Generator */}
      <QueueTestDataGenerator />

      {/* Queue Interface Access */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Queue Management Interface
            </span>
            <Button onClick={handleOpenQueue} className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Open Queue
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {queueSummary?.summary?.owned_pending || 0}
              </div>
              <div className="text-sm text-muted-foreground">Owned Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {queueSummary?.summary?.assigned_pending || 0}
              </div>
              <div className="text-sm text-muted-foreground">Assigned Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {queueSummary?.summary?.urgent_count || 0}
              </div>
              <div className="text-sm text-muted-foreground">Urgent Items</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-600">
                {queueSummary?.summary?.total_pending || 0}
              </div>
              <div className="text-sm text-muted-foreground">Total Pending</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              Live Data
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <BarChart3 className="h-3 w-3" />
              Real-time Updates
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              Multi-user Support
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Testing Checklist */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5" />
            Queue Interface Testing Checklist
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            {testCases.map((testCase, index) => (
              <div key={index}>
                <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                  {testCase.category === 'Basic UI' && <Eye className="h-4 w-4" />}
                  {testCase.category === 'Filtering' && <Filter className="h-4 w-4" />}
                  {testCase.category === 'Assignment Actions' && <CheckSquare className="h-4 w-4" />}
                  {testCase.category === 'External Context' && <Users className="h-4 w-4" />}
                  {testCase.category === 'Real-time Updates' && <Clock className="h-4 w-4" />}
                  {testCase.category}
                </h4>
                <div className="space-y-1">
                  {testCase.tests.map((test, testIndex) => (
                    <div key={testIndex} className="text-sm text-muted-foreground font-mono">
                      {test}
                    </div>
                  ))}
                </div>
                {index < testCases.length - 1 && <Separator className="mt-4" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Queue Drawer */}
      <QueueDrawer 
        open={showQueue} 
        onOpenChange={setShowQueue}
      />
    </div>
  );
}