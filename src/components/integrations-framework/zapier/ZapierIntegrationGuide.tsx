import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, BookOpen, Zap, ArrowRight, Copy, CheckCircle, Users, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const zapExamples = [
  {
    title: 'Salesforce Deal Updates',
    description: 'Automatically update deal stages and add notes in Salesforce when analysis is complete',
    steps: [
      'Connect Sales Whisperer trigger: "Analysis Completed"',
      'Add Salesforce action: "Update Record"',
      'Map deal heat level to opportunity stage',
      'Add analysis summary to opportunity notes'
    ],
    benefits: ['Real-time CRM updates', 'Consistent data entry', 'Improved deal tracking'],
    zapierUrl: 'https://zapier.com/apps/salesforce/integrations/sales-whisperer'
  },
  {
    title: 'Slack Hot Deal Alerts', 
    description: 'Send instant Slack notifications when high-priority deals are identified',
    steps: [
      'Connect Sales Whisperer trigger: "Hot Deal Identified"',
      'Add Slack action: "Send Channel Message"',
      'Format message with deal details',
      'Tag relevant team members'
    ],
    benefits: ['Instant team alerts', 'Never miss hot prospects', 'Improved response time'],
    zapierUrl: 'https://zapier.com/apps/slack/integrations/sales-whisperer'
  },
  {
    title: 'HubSpot Contact Matching',
    description: 'Automatically match call participants to HubSpot contacts and update records',
    steps: [
      'Connect Sales Whisperer trigger: "Participant Matched"',
      'Add HubSpot action: "Update Contact"',
      'Map participant data to contact fields',
      'Log interaction and meeting notes'
    ],
    benefits: ['Automatic contact updates', 'Complete interaction history', 'Better data accuracy'],
    zapierUrl: 'https://zapier.com/apps/hubspot/integrations/sales-whisperer'
  }
];

const quickStart = [
  {
    step: 1,
    title: 'Generate API Key',
    description: 'Create an API key in the API Keys tab with appropriate permissions',
    icon: <Copy className="h-5 w-5" />
  },
  {
    step: 2, 
    title: 'Create Webhook',
    description: 'Set up a webhook URL from Zapier and subscribe to events',
    icon: <Zap className="h-5 w-5" />
  },
  {
    step: 3,
    title: 'Build Your Zap',
    description: 'Use the webhook as a trigger in Zapier and connect to your favorite apps',
    icon: <ArrowRight className="h-5 w-5" />
  },
  {
    step: 4,
    title: 'Test & Deploy',
    description: 'Test your integration and enable the Zap to start automating',
    icon: <CheckCircle className="h-5 w-5" />
  }
];

export function ZapierIntegrationGuide() {
  const { toast } = useToast();

  const copyCode = (code: string, label: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: 'Copied',
      description: `${label} copied to clipboard`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Quick Start Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Quick Start Guide
          </CardTitle>
          <CardDescription>
            Get up and running with Zapier in 4 simple steps
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {quickStart.map((item, index) => (
              <div key={index} className="flex gap-4 p-4 border rounded-lg">
                <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  {item.icon}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Step {item.step}</Badge>
                    <h4 className="font-medium">{item.title}</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <Zap className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">New to Zapier?</h4>
                <p className="text-sm text-blue-800 mb-2">
                  Zapier connects Sales Whisperer to 5,000+ apps without coding. 
                  Create automated workflows (called "Zaps") that trigger actions in other apps.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('https://zapier.com/learn', '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Learn Zapier Basics
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Popular Zap Examples */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Popular Automation Examples
          </CardTitle>
          <CardDescription>
            Ready-to-use Zap templates for common sales workflows
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {zapExamples.map((example, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <h4 className="font-medium text-lg">{example.title}</h4>
                    <p className="text-muted-foreground">{example.description}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(example.zapierUrl, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Use Template
                  </Button>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h5 className="font-medium text-sm">Setup Steps:</h5>
                    <ul className="space-y-1">
                      {example.steps.map((step, stepIndex) => (
                        <li key={stepIndex} className="text-sm text-muted-foreground flex items-start gap-2">
                          <Badge variant="outline" className="text-xs">{stepIndex + 1}</Badge>
                          {step}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <h5 className="font-medium text-sm">Benefits:</h5>
                    <ul className="space-y-1">
                      {example.benefits.map((benefit, benefitIndex) => (
                        <li key={benefitIndex} className="text-sm text-muted-foreground flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* API Documentation */}
      <Card>
        <CardHeader>
          <CardTitle>API Reference</CardTitle>
          <CardDescription>
            Technical details for developers building custom integrations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <h4 className="font-medium mb-2">Authentication</h4>
              <div className="bg-muted p-3 rounded-lg font-mono text-sm">
                <div className="flex items-center justify-between">
                  <span>Authorization: Bearer YOUR_API_KEY</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyCode('Authorization: Bearer YOUR_API_KEY', 'Authorization header')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Base URL</h4>
              <div className="bg-muted p-3 rounded-lg font-mono text-sm">
                <div className="flex items-center justify-between">
                  <span>https://jtunkyfoadoowpymibjr.supabase.co/functions/v1/</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyCode('https://jtunkyfoadoowpymibjr.supabase.co/functions/v1/', 'Base URL')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Available Events</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <code className="text-sm">analysis_completed</code>
                  <Badge variant="outline">Most Popular</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <code className="text-sm">hot_deal_identified</code>
                  <Badge variant="outline">High Impact</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <code className="text-sm">follow_up_required</code>
                  <Badge variant="outline">Action Needed</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <code className="text-sm">participant_matched</code>
                  <Badge variant="outline">CRM Sync</Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => window.open('https://docs.zapier.com/partner-api', '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Full API Docs
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open('https://zapier.com/apps/sales-whisperer', '_blank')}
            >
              <Users className="h-4 w-4 mr-2" />
              Community Examples
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}