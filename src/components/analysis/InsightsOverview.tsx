
import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, Award, Clock, Users } from 'lucide-react'

interface InsightsOverviewProps {
  challengerScores: {
    teaching: number
    tailoring: number
    control: number
  }
  transcriptData?: {
    duration: number
    participantCount: number
    wordCount?: number
  }
  historicalData?: {
    teaching: number[]
    tailoring: number[]
    control: number[]
  }
}

export function InsightsOverview({ 
  challengerScores, 
  transcriptData,
  historicalData 
}: InsightsOverviewProps) {
  const chartData = [
    {
      dimension: 'Teaching',
      impact: challengerScores.teaching,
      description: 'Insight sharing & challenging assumptions'
    },
    {
      dimension: 'Tailoring',
      impact: challengerScores.tailoring,
      description: 'Message customization & relevance'
    },
    {
      dimension: 'Control',
      impact: challengerScores.control,
      description: 'Conversation leadership & guidance'
    }
  ]

  const pieData = [
    { name: 'Strong Areas', value: chartData.filter(d => d.impact >= 4).length, color: '#22c55e' },
    { name: 'Good Areas', value: chartData.filter(d => d.impact === 3).length, color: '#3b82f6' },
    { name: 'Growth Areas', value: chartData.filter(d => d.impact < 3).length, color: '#a855f7' }
  ]

  const overallScore = (challengerScores.teaching + challengerScores.tailoring + challengerScores.control) / 3
  const getOverallRating = (score: number) => {
    if (score >= 4) return { level: 'Excellent', color: 'text-green-600', bg: 'bg-green-100' }
    if (score >= 3.5) return { level: 'Strong', color: 'text-green-600', bg: 'bg-green-100' }
    if (score >= 3) return { level: 'Good', color: 'text-blue-600', bg: 'bg-blue-100' }
    return { level: 'Developing', color: 'text-purple-600', bg: 'bg-purple-100' }
  }

  const rating = getOverallRating(overallScore)

  return (
    <div className="space-y-6">
      {/* Overall Performance Summary */}
      <Card className="hover:shadow-lg transition-all duration-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Award className="w-6 h-6 mr-3 text-yellow-600" />
              Performance Snapshot
            </span>
            <Badge className={`${rating.bg} ${rating.color}`} variant="secondary">
              {rating.level} Impact
            </Badge>
          </CardTitle>
          <CardDescription>
            Your conversation demonstrates {rating.level.toLowerCase()} application of Challenger methodology
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {transcriptData && (
              <>
                <div className="text-center">
                  <Clock className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-slate-900">{transcriptData.duration}m</div>
                  <p className="text-sm text-slate-600">Call Duration</p>
                </div>
                <div className="text-center">
                  <Users className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-slate-900">{transcriptData.participantCount}</div>
                  <p className="text-sm text-slate-600">Participants</p>
                </div>
              </>
            )}
            <div className="text-center">
              <TrendingUp className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-slate-900">{overallScore.toFixed(1)}</div>
              <p className="text-sm text-slate-600">Overall Impact</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Impact Dimensions Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="hover:shadow-lg transition-all duration-200">
          <CardHeader>
            <CardTitle>Impact by Dimension</CardTitle>
            <CardDescription>
              Your performance across key Challenger methodology areas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <XAxis 
                    dataKey="dimension" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis domain={[0, 5]} tick={{ fontSize: 12 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar 
                    dataKey="impact" 
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200">
          <CardHeader>
            <CardTitle>Strength Distribution</CardTitle>
            <CardDescription>
              Overview of your current skill development
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Dimension Details */}
      <div className="grid gap-4">
        {chartData.map((item, index) => {
          const impactLevel = item.impact >= 4 ? 'Strong' : item.impact >= 3 ? 'Good' : 'Growing'
          const colorClass = item.impact >= 4 ? 'border-green-200 bg-green-50' : 
                           item.impact >= 3 ? 'border-blue-200 bg-blue-50' : 'border-purple-200 bg-purple-50'
          
          return (
            <Card key={index} className={`hover:shadow-lg transition-all duration-200 ${colorClass}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900 mb-1">{item.dimension} Impact</h4>
                    <p className="text-sm text-slate-600">{item.description}</p>
                  </div>
                  <div className="text-center ml-4">
                    <div className="text-2xl font-bold text-slate-900">{impactLevel}</div>
                    <div className="text-xs text-slate-500">Level</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
