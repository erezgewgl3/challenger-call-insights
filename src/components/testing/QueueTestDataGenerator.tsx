import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { TestTube, Plus, CheckCircle } from 'lucide-react';

export function QueueTestDataGenerator() {
  const [isCreating, setIsCreating] = useState(false);
  const [createdItems, setCreatedItems] = useState<string[]>([]);
  const { toast } = useToast();

  const testScenarios = [
    {
      title: 'High Priority Zoho Deal',
      priority: 'high',
      source: 'zoho',
      zoho_deal_id: 'deal_12345',
      deal_context: {
        company_name: 'Acme Corporation',
        contact_name: 'John Smith',
        deal_name: 'Enterprise Software License'
      },
      should_assign: true
    },
    {
      title: 'Urgent Zapier Integration',
      priority: 'urgent', 
      source: 'zapier',
      zoho_deal_id: 'deal_67890',
      deal_context: {
        company_name: 'TechStart Inc',
        contact_name: 'Sarah Johnson',
        deal_name: 'API Integration Package'
      },
      should_assign: false
    },
    {
      title: 'Normal Manual Upload',
      priority: 'normal',
      source: 'manual',
      should_assign: false
    }
  ];

  const createTestData = async () => {
    setIsCreating(true);
    const created = [];

    for (const scenario of testScenarios) {
      try {
        const payload = {
          transcript_text: `This is a test ${scenario.source} transcript for ${scenario.title}. Customer showed interest in our solution...`,
          assigned_user_email: scenario.should_assign ? 'erezgew@yahoo.com' : undefined,
          zoho_deal_id: scenario.zoho_deal_id,
          meeting_metadata: {
            title: scenario.title,
            ...scenario.deal_context
          },
          priority: scenario.priority,
          source: scenario.source
        };

        const { data, error } = await supabase.functions.invoke('external-transcript-ingest', {
          body: payload
        });

        if (error) throw error;

        if (data?.success) {
          created.push(scenario.title);
          toast({
            title: "Test Data Created",
            description: `${scenario.title} created successfully`,
          });
        }
      } catch (error) {
        console.error(`Error creating ${scenario.title}:`, error);
        toast({
          title: "Error",
          description: `Failed to create ${scenario.title}`,
          variant: "destructive",
        });
      }
    }

    setCreatedItems(created);
    setIsCreating(false);

    if (created.length > 0) {
      toast({
        title: "Test Data Complete", 
        description: `Created ${created.length} test transcripts for queue testing`,
      });
    }
  };

  return (
    <Card className="mb-6 border-dashed border-2 border-muted-foreground/25">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <TestTube className="h-4 w-4" />
          Queue Interface Test Data Generator
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            {testScenarios.map((scenario, index) => (
              <div key={index} className="p-3 bg-muted/30 rounded-lg">
                <div className="font-medium mb-1">{scenario.title}</div>
                <div className="flex gap-1 mb-2">
                  <Badge variant="outline" className="text-xs">
                    {scenario.priority}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {scenario.source}
                  </Badge>
                </div>
                <div className="text-muted-foreground">
                  {scenario.should_assign ? 'Will be assigned' : 'Owned transcript'}
                </div>
                {createdItems.includes(scenario.title) && (
                  <div className="flex items-center gap-1 text-green-600 mt-2">
                    <CheckCircle className="h-3 w-3" />
                    <span className="text-xs">Created</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          <Button 
            onClick={createTestData}
            disabled={isCreating || createdItems.length > 0}
            className="w-full"
            size="sm"
          >
            {isCreating ? (
              <>Creating Test Data...</>
            ) : createdItems.length > 0 ? (
              <>✓ Test Data Created</>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Generate Queue Test Data
              </>
            )}
          </Button>

          {createdItems.length > 0 && (
            <div className="text-xs text-center text-muted-foreground">
              Test data created! Open the queue interface to see results.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}