import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Copy,
  Mail,
  Phone,
  Calendar,
  Clock,
  CheckCircle,
  ArrowRight,
  Zap,
  ExternalLink
} from 'lucide-react'
import { toast } from 'sonner'

// Sample action plan data - replace with actual analysis.action_plan.actions
const sampleActions = [
  {
    action: "Send final contract documents for review",
    objective: "To expedite the signing process and address any last-minute questions",
    timeline: "Within 24 hours",
    priority: "high",
    method: "email",
    copyPasteContent: {
      subject: "Final Contract Documents for Review",
      body: `Hi Laura,

Attached are the final contract documents for your review. Please let me know if you have any questions or if there are any additional details needed before we proceed.

Looking forward to your feedback.`
    }
  },
  {
    action: "Schedule follow-up call with legal and procurement teams",
    objective: "To ensure all concerns are addressed and facilitate a smooth signing process",
    timeline: "This week",
    priority: "medium",
    method: "phone",
    copyPasteContent: {
      subject: "Contract Review Call - Legal & Procurement Teams",
      body: `Hi Laura,

I'd like to schedule a brief call with your legal and procurement teams to address any final questions about the contract terms and ensure we're aligned on all details.

Are you available for a 30-minute call this week? I'm flexible with timing.

Best regards`
    }
  },
  {
    action: "Send competitive differentiation summary",
    objective: "Address competitor comparison based on their evaluation criteria",
    timeline: "Within 3 days",
    priority: "medium",
    method: "email",
    copyPasteContent: {
      subject: "Why Enterprise Solutions Chose Us Over Competitors",
      body: `Hi Laura,

Based on our conversation about evaluating alternatives, I thought you'd find it helpful to see how other enterprise clients approached this decision.

Here's a summary of key differentiators that led to their choice:
• Advanced security features with SOC 2 compliance
• Seamless integration with existing enterprise systems  
• Dedicated customer success manager

Would you like to speak with one of our enterprise references?`
    }
  }
]

interface TimelinePlaybookProps {
  actions?: typeof sampleActions
}

export function TimelinePlaybook({ actions = sampleActions }: TimelinePlaybookProps) {
  
  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`${type} copied to clipboard!`)
    } catch (error) {
      toast.error('Failed to copy to clipboard')
    }
  }

  const copyFullEmail = async (subject: string, body: string) => {
    const fullEmail = `Subject: ${subject}\n\n${body}`
    await copyToClipboard(fullEmail, 'Complete email')
  }

  const openInEmailClient = (subject: string, body: string) => {
    const encodedSubject = encodeURIComponent(subject)
    const encodedBody = encodeURIComponent(body)
    const mailtoUrl = `mailto:?subject=${encodedSubject}&body=${encodedBody}`
    window.open(mailtoUrl, '_blank')
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500'
      case 'medium': return 'bg-orange-500'
      case 'low': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-orange-100 text-orange-800'
      case 'low': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'email': return <Mail className="w-4 h-4" />
      case 'phone': return <Phone className="w-4 h-4" />
      case 'meeting': return <Calendar className="w-4 h-4" />
      default: return <Mail className="w-4 h-4" />
    }
  }

  return (
    <Card className="border-l-4 border-l-purple-400 bg-gradient-to-r from-purple-50 to-indigo-50 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Zap className="w-6 h-6 text-purple-600" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                Ready-to-Execute Playbook
                <Badge variant="secondary" className="bg-purple-100 text-purple-800 text-xs">
                  PRIORITY
                </Badge>
              </CardTitle>
              <p className="text-sm text-purple-700 font-normal">Email templates and scripts ready to use immediately</p>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-300 to-purple-100"></div>
          
          <div className="space-y-6">
            {actions.map((action, index) => (
              <div key={index} className="relative">
                {/* Timeline Node */}
                <div className={`absolute left-6 w-4 h-4 rounded-full border-2 border-white ${getPriorityColor(action.priority)} z-10`}>
                  <div className="absolute inset-1 bg-white rounded-full"></div>
                </div>
                
                {/* Action Card */}
                <div className="ml-16 bg-white rounded-lg border border-purple-200 shadow-sm">
                  {/* Action Header */}
                  <div className="p-4 border-b border-purple-100">
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`p-2 rounded-lg ${action.method === 'email' ? 'bg-blue-100' : 'bg-green-100'}`}>
                          {getMethodIcon(action.method)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 text-base mb-1">{action.action}</h4>
                          <p className="text-sm text-gray-600 leading-relaxed">{action.objective}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge className={`${getPriorityBadge(action.priority)} text-xs font-medium`}>
                          <Clock className="w-3 h-3 mr-1" />
                          {action.timeline}
                        </Badge>
                        {action.priority === 'high' && (
                          <Badge className="bg-red-100 text-red-800 text-xs animate-pulse">
                            URGENT
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Email Template Section - Only for email actions */}
                  {action.method === 'email' && action.copyPasteContent && (
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-medium text-gray-800 text-sm flex items-center gap-2">
                          <Mail className="w-4 h-4 text-blue-600" />
                          Email Template Ready
                        </h5>
                        
                        {/* Master Action Buttons */}
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs border-blue-300 text-blue-700 hover:bg-blue-100"
                            onClick={() => copyFullEmail(action.copyPasteContent.subject, action.copyPasteContent.body)}
                          >
                            <Copy className="w-3 h-3 mr-1" />
                            Copy All
                          </Button>
                          <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-xs"
                            onClick={() => openInEmailClient(action.copyPasteContent.subject, action.copyPasteContent.body)}
                          >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            Send Email
                          </Button>
                        </div>
                      </div>

                      {/* Subject Line */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-blue-800 uppercase tracking-wider">Subject Line</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs text-blue-600 hover:bg-blue-100"
                            onClick={() => copyToClipboard(action.copyPasteContent.subject, 'Subject line')}
                          >
                            <Copy className="w-3 h-3 mr-1" />
                            Copy
                          </Button>
                        </div>
                        <div className="bg-white p-3 rounded border border-blue-200 text-sm font-mono">
                          {action.copyPasteContent.subject}
                        </div>
                      </div>

                      {/* Email Body */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-blue-800 uppercase tracking-wider">Email Content</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs text-blue-600 hover:bg-blue-100"
                            onClick={() => copyToClipboard(action.copyPasteContent.body, 'Email content')}
                          >
                            <Copy className="w-3 h-3 mr-1" />
                            Copy
                          </Button>
                        </div>
                        <div className="bg-white p-3 rounded border border-blue-200 text-sm font-mono whitespace-pre-wrap max-h-32 overflow-y-auto">
                          {action.copyPasteContent.body}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Non-email Actions */}
                  {action.method !== 'email' && (
                    <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium text-green-800">Action Required</span>
                        </div>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-xs"
                        >
                          <Calendar className="w-3 h-3 mr-1" />
                          Schedule Call
                        </Button>
                      </div>
                      
                      {action.copyPasteContent && (
                        <div className="mt-3 p-3 bg-white rounded border border-green-200">
                          <p className="text-sm text-gray-700 italic">
                            "This call will focus on addressing final contract terms and ensuring smooth implementation."
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Connection Arrow to Next Step */}
                {index < actions.length - 1 && (
                  <div className="absolute left-8 -bottom-3 transform -translate-x-1/2 z-20">
                    <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center border border-purple-200">
                      <ArrowRight className="w-3 h-3 text-purple-600" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Timeline Completion */}
          <div className="relative mt-6">
            <div className="absolute left-6 w-4 h-4 rounded-full bg-green-500 border-2 border-white z-10">
              <CheckCircle className="w-3 h-3 text-white absolute inset-0.5" />
            </div>
            <div className="ml-16">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <div>
                    <h5 className="font-semibold text-green-800 text-sm">Deal Progression Complete</h5>
                    <p className="text-xs text-green-700">All priority actions executed. Monitor for responses and be ready for next steps.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}