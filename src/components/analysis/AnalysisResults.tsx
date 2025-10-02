
import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { TrendingUp, Target, MessageSquare, Mail, CheckCircle, ArrowRight, Lightbulb, Users, ExternalLink, Download, Send, ArrowLeft, Building2, User } from 'lucide-react'

interface ChallengerScores {
  teaching: number
  tailoring: number
  control: number
}

interface Guidance {
  recommendation: string
  message: string
  keyInsights: string[]
  nextSteps: string[]
}

interface EmailFollowUp {
  subject: string
  body: string
  timing: string
  channel: string
}

interface AnalysisResultsProps {
  challengerScores: ChallengerScores
  guidance: Guidance
  emailFollowUp: EmailFollowUp
  transcriptTitle: string
  transcriptData?: {
    id: string
    meeting_date: string
    zoho_deal_id?: string
    deal_context?: {
      company_name?: string
      contact_name?: string
      deal_name?: string
    }
    is_assigned?: boolean
  }
  onSendToCRM?: () => void
  onBackToQueue?: () => void
}

export function AnalysisResults({ 
  challengerScores, 
  guidance, 
  emailFollowUp, 
  transcriptTitle,
  transcriptData,
  onSendToCRM,
  onBackToQueue
}: AnalysisResultsProps) {
  const getImpactLevel = (score: number) => {
    if (score >= 4) return { level: 'Strong', color: 'bg-green-500', textColor: 'text-green-700' }
    if (score >= 3) return { level: 'Good', color: 'bg-blue-500', textColor: 'text-blue-700' }
    return { level: 'Growing', color: 'bg-purple-500', textColor: 'text-purple-700' }
  }

  const getRecommendationStyle = (recommendation: string) => {
    switch (recommendation.toLowerCase()) {
      case 'push':
        return { color: 'bg-green-100 text-green-800', icon: TrendingUp }
      case 'continue':
        return { color: 'bg-blue-100 text-blue-800', icon: Target }
      default:
        return { color: 'bg-purple-100 text-purple-800', icon: MessageSquare }
    }
  }

  const teachingImpact = getImpactLevel(challengerScores.teaching)
  const tailoringImpact = getImpactLevel(challengerScores.tailoring)
  const controlImpact = getImpactLevel(challengerScores.control)
  const recommendationStyle = getRecommendationStyle(guidance.recommendation)
  const RecommendationIcon = recommendationStyle.icon
  
  const zohoDealUrl = transcriptData?.zoho_deal_id 
    ? `https://crm.zoho.com/crm/ShowEntityInfo.do?id=${transcriptData.zoho_deal_id}&module=Potentials`
    : null

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header with CRM Context */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="text-3xl font-bold">{transcriptTitle}</CardTitle>
              <div className="flex items-center gap-2">
                {transcriptData && (
                  <Badge variant="outline">
                    {new Date(transcriptData.meeting_date).toLocaleDateString()}
                  </Badge>
                )}
                {transcriptData?.is_assigned && (
                  <Badge variant="default">Assigned Transcript</Badge>
                )}
                <Badge className={recommendationStyle.color} variant="secondary">
                  <RecommendationIcon className="w-4 h-4 mr-1" />
                  {guidance.recommendation} Forward
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onBackToQueue && (
                <Button variant="outline" onClick={onBackToQueue}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Queue
                </Button>
              )}
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>
        </CardHeader>

        {transcriptData?.deal_context && (
          <CardContent>
            <div className="space-y-3">
              {transcriptData.deal_context.deal_name && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Deal:</span>
                  <p className="text-sm font-semibold">{transcriptData.deal_context.deal_name}</p>
                </div>
              )}
              {transcriptData.deal_context.company_name && (
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{transcriptData.deal_context.company_name}</span>
                </div>
              )}
              {transcriptData.deal_context.contact_name && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{transcriptData.deal_context.contact_name}</span>
                </div>
              )}
              {transcriptData.zoho_deal_id && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`https://crm.zoho.com/crm/org20098764813/tab/Potentials/${transcriptData.zoho_deal_id}`, '_blank')}
                  className="w-full mt-2"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View in Zoho CRM
                </Button>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* CRM Integration Actions */}
      {transcriptData?.zoho_deal_id && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="font-medium">Ready for CRM Integration</h3>
                <p className="text-sm text-muted-foreground">
                  Send analysis results back to Zoho CRM to update the deal
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                {zohoDealUrl && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={zohoDealUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-1" />
                      View Deal
                    </a>
                  </Button>
                )}
                
                {onSendToCRM && (
                  <Button onClick={onSendToCRM} size="sm">
                    <Send className="h-4 w-4 mr-2" />
                    Send to Zoho CRM
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Impact Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="hover:shadow-lg transition-all duration-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-lg">
              <span className="flex items-center">
                <Lightbulb className="w-5 h-5 mr-2 text-yellow-600" />
                Teaching Impact
              </span>
              <Badge className={`${teachingImpact.color} text-white`} variant="secondary">
                {teachingImpact.level}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Progress value={challengerScores.teaching * 20} className="h-3" />
              <p className="text-sm text-slate-600">
                Your insights are {teachingImpact.level.toLowerCase()} at challenging assumptions and providing valuable perspectives.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-lg">
              <span className="flex items-center">
                <Users className="w-5 h-5 mr-2 text-blue-600" />
                Tailoring Impact
              </span>
              <Badge className={`${tailoringImpact.color} text-white`} variant="secondary">
                {tailoringImpact.level}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Progress value={challengerScores.tailoring * 20} className="h-3" />
              <p className="text-sm text-slate-600">
                Your message customization shows {tailoringImpact.level.toLowerCase()} connection to their specific needs.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-lg">
              <span className="flex items-center">
                <Target className="w-5 h-5 mr-2 text-green-600" />
                Control Impact
              </span>
              <Badge className={`${controlImpact.color} text-white`} variant="secondary">
                {controlImpact.level}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Progress value={challengerScores.control * 20} className="h-3" />
              <p className="text-sm text-slate-600">
                Your conversation leadership demonstrates {controlImpact.level.toLowerCase()} ability to guide outcomes.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Key Insights Section */}
      <Card className="hover:shadow-lg transition-all duration-200">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <CheckCircle className="w-6 h-6 mr-3 text-green-600" />
            What's Working Well
          </CardTitle>
          <CardDescription>
            Key moments where your approach created impact
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {guidance.keyInsights.map((insight, index) => (
              <div key={index} className="flex items-start space-x-3 p-4 bg-green-50 rounded-lg border-l-4 border-l-green-500">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-slate-900">{insight}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actionable Guidance */}
      <Card className="hover:shadow-lg transition-all duration-200">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <ArrowRight className="w-6 h-6 mr-3 text-blue-600" />
            Recommended Next Steps
          </CardTitle>
          <CardDescription>
            {guidance.message}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {guidance.nextSteps.map((step, index) => (
              <div key={index} className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-white">{index + 1}</span>
                </div>
                <p className="text-slate-900">{step}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Email Follow-up Template */}
      <Card className="hover:shadow-lg transition-all duration-200">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <Mail className="w-6 h-6 mr-3 text-purple-600" />
            Ready-to-Send Follow-up
          </CardTitle>
          <CardDescription>
            Personalized email template based on your conversation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Subject Line</label>
              <div className="p-3 bg-slate-50 rounded-lg border">
                <p className="text-slate-900">{emailFollowUp.subject}</p>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Message</label>
              <div className="p-4 bg-slate-50 rounded-lg border max-h-40 overflow-y-auto">
                <p className="text-slate-900 whitespace-pre-line">{emailFollowUp.body}</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-4">
              <div className="flex items-center space-x-4 text-sm text-slate-600">
                <span>📅 Send in {emailFollowUp.timing}</span>
                <span>📧 via {emailFollowUp.channel}</span>
              </div>
              <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                Copy Template
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
