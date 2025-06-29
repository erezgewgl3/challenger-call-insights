
import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { TrendingUp, Target, MessageSquare, Mail, CheckCircle, ArrowRight, Lightbulb, Users } from 'lucide-react'

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
}

export function AnalysisResults({ 
  challengerScores, 
  guidance, 
  emailFollowUp, 
  transcriptTitle 
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

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Section */}
      <div className="text-center space-y-2 mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Conversation Flow Insights</h1>
        <p className="text-lg text-slate-600">Analysis complete for "{transcriptTitle}"</p>
        <Badge className={recommendationStyle.color} variant="secondary">
          <RecommendationIcon className="w-4 h-4 mr-1" />
          {guidance.recommendation} Forward
        </Badge>
      </div>

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
