
import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowRight, 
  Calendar, 
  Phone, 
  Mail, 
  MessageSquare, 
  Copy, 
  CheckCircle,
  Target,
  Lightbulb,
  Users
} from 'lucide-react'
import { toast } from 'sonner'

interface ActionItem {
  id: string
  title: string
  description: string
  timing: string
  priority: 'high' | 'medium' | 'low'
  category: 'immediate' | 'short_term' | 'long_term'
}

interface FollowUpTemplate {
  id: string
  channel: 'email' | 'phone' | 'linkedin'
  subject?: string
  content: string
  timing: string
  context: string
}

interface ActionableGuidanceProps {
  nextSteps: string[]
  emailFollowUp: {
    subject: string
    body: string
    timing: string
    channel: string
  }
  challengerScores: {
    teaching: number
    tailoring: number
    control: number
  }
}

export function ActionableGuidance({ 
  nextSteps, 
  emailFollowUp, 
  challengerScores 
}: ActionableGuidanceProps) {
  const [copiedItem, setCopiedItem] = useState<string | null>(null)

  // Generate actionable items based on scores and next steps
  const generateActionItems = (): ActionItem[] => {
    const items: ActionItem[] = []
    
    // Add next steps as immediate actions
    nextSteps.forEach((step, index) => {
      items.push({
        id: `step-${index}`,
        title: step,
        description: 'Based on your conversation analysis',
        timing: index === 0 ? 'Next 24 hours' : index === 1 ? 'This week' : 'Next 2 weeks',
        priority: index === 0 ? 'high' : 'medium',
        category: index === 0 ? 'immediate' : 'short_term'
      })
    })

    // Add score-based recommendations
    if (challengerScores.teaching < 4) {
      items.push({
        id: 'teaching-improve',
        title: 'Prepare 2-3 industry insights for next conversation',
        description: 'Research recent trends or data points relevant to their business',
        timing: 'Before next call',
        priority: 'medium',
        category: 'short_term'
      })
    }

    if (challengerScores.tailoring < 4) {
      items.push({
        id: 'tailoring-improve',
        title: 'Research customer-specific challenges and competitors',
        description: 'Gather information about their industry position and unique challenges',
        timing: 'This week',
        priority: 'medium',
        category: 'short_term'
      })
    }

    if (challengerScores.control < 4) {
      items.push({
        id: 'control-improve',
        title: 'Practice conversation flow and objection handling',
        description: 'Prepare responses to common objections and practice guiding conversations',
        timing: 'Ongoing development',
        priority: 'low',
        category: 'long_term'
      })
    }

    return items
  }

  const generateFollowUpTemplates = (): FollowUpTemplate[] => {
    return [
      {
        id: 'email-primary',
        channel: 'email',
        subject: emailFollowUp.subject,
        content: emailFollowUp.body,
        timing: emailFollowUp.timing,
        context: 'Primary follow-up based on your conversation'
      },
      {
        id: 'phone-followup',
        channel: 'phone',
        content: `Hi [Name], I wanted to follow up on our conversation about [key topic discussed]. I've been thinking about [specific insight or challenge mentioned], and I have a few additional thoughts that might be valuable for your situation. Would you have 15 minutes this week to discuss?`,
        timing: '3-5 days',
        context: 'For more personal touch or complex topics'
      },
      {
        id: 'linkedin-connection',
        channel: 'linkedin',
        content: `Hi [Name], thank you for the engaging conversation about [topic]. I found your perspective on [specific point] particularly insightful. I'd love to stay connected and continue our discussion about how [your solution] could support your goals.`,
        timing: '24-48 hours',
        context: 'For building professional relationship'
      }
    ]
  }

  const actionItems = generateActionItems()
  const followUpTemplates = generateFollowUpTemplates()

  const copyToClipboard = async (text: string, itemId: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedItem(itemId)
      toast.success('Copied to clipboard!')
      setTimeout(() => setCopiedItem(null), 2000)
    } catch (error) {
      toast.error('Failed to copy to clipboard')
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'immediate': return Target
      case 'short_term': return Calendar
      case 'long_term': return Lightbulb
      default: return ArrowRight
    }
  }

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email': return Mail
      case 'phone': return Phone
      case 'linkedin': return Users
      default: return MessageSquare
    }
  }

  return (
    <div className="space-y-6">
      <Card className="hover:shadow-lg transition-all duration-200">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <Target className="w-6 h-6 mr-3 text-blue-600" />
            Your Action Plan
          </CardTitle>
          <CardDescription>
            Prioritized next steps to maximize your conversation impact
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="immediate" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="immediate">Immediate (24h)</TabsTrigger>
              <TabsTrigger value="short_term">This Week</TabsTrigger>
              <TabsTrigger value="long_term">Long Term</TabsTrigger>
            </TabsList>
            
            <TabsContent value="immediate" className="space-y-4">
              {actionItems.filter(item => item.category === 'immediate').map((item) => {
                const IconComponent = getCategoryIcon(item.category)
                return (
                  <div key={item.id} className="flex items-start space-x-3 p-4 bg-red-50 rounded-lg border-l-4 border-l-red-500">
                    <IconComponent className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-slate-900">{item.title}</h4>
                        <Badge className={getPriorityColor(item.priority)} variant="secondary">
                          {item.priority.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-slate-600 text-sm mb-2">{item.description}</p>
                      <p className="text-xs text-slate-500">⏰ {item.timing}</p>
                    </div>
                  </div>
                )
              })}
            </TabsContent>
            
            <TabsContent value="short_term" className="space-y-4">
              {actionItems.filter(item => item.category === 'short_term').map((item) => {
                const IconComponent = getCategoryIcon(item.category)
                return (
                  <div key={item.id} className="flex items-start space-x-3 p-4 bg-yellow-50 rounded-lg border-l-4 border-l-yellow-500">
                    <IconComponent className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-slate-900">{item.title}</h4>
                        <Badge className={getPriorityColor(item.priority)} variant="secondary">
                          {item.priority.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-slate-600 text-sm mb-2">{item.description}</p>
                      <p className="text-xs text-slate-500">⏰ {item.timing}</p>
                    </div>
                  </div>
                )
              })}
            </TabsContent>
            
            <TabsContent value="long_term" className="space-y-4">
              {actionItems.filter(item => item.category === 'long_term').map((item) => {
                const IconComponent = getCategoryIcon(item.category)
                return (
                  <div key={item.id} className="flex items-start space-x-3 p-4 bg-purple-50 rounded-lg border-l-4 border-l-purple-500">
                    <IconComponent className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-slate-900">{item.title}</h4>
                        <Badge className={getPriorityColor(item.priority)} variant="secondary">
                          {item.priority.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-slate-600 text-sm mb-2">{item.description}</p>
                      <p className="text-xs text-slate-500">⏰ {item.timing}</p>
                    </div>
                  </div>
                )
              })}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Follow-up Templates */}
      <Card className="hover:shadow-lg transition-all duration-200">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <MessageSquare className="w-6 h-6 mr-3 text-green-600" />
            Follow-up Templates
          </CardTitle>
          <CardDescription>
            Ready-to-use templates for different communication channels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {followUpTemplates.map((template) => {
              const IconComponent = getChannelIcon(template.channel)
              return (
                <Card key={template.id} className="border-l-4 border-l-green-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between text-lg">
                      <span className="flex items-center">
                        <IconComponent className="w-5 h-5 mr-2" />
                        {template.channel.charAt(0).toUpperCase() + template.channel.slice(1)} Follow-up
                      </span>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">Send in {template.timing}</Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(
                            template.subject ? `Subject: ${template.subject}\n\n${template.content}` : template.content,
                            template.id
                          )}
                        >
                          {copiedItem === template.id ? 
                            <CheckCircle className="w-4 h-4 text-green-600" /> : 
                            <Copy className="w-4 h-4" />
                          }
                        </Button>
                      </div>
                    </CardTitle>
                    <CardDescription>{template.context}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {template.subject && (
                      <div className="mb-3">
                        <label className="text-sm font-medium text-slate-700">Subject:</label>
                        <p className="text-slate-900 bg-slate-50 p-2 rounded mt-1">{template.subject}</p>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium text-slate-700">Message:</label>
                      <p className="text-slate-900 bg-slate-50 p-3 rounded mt-1 whitespace-pre-line">
                        {template.content}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
