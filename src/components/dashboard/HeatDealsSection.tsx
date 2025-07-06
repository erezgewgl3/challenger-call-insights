import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Clock, Users, ArrowRight, TrendingUp } from 'lucide-react'
import { useTranscriptData } from '@/hooks/useTranscriptData'
import { useNavigate } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'

interface TranscriptSummary {
  id: string
  title: string
  participants: string[]
  duration_minutes: number
  created_at: string
  status: 'uploaded' | 'processing' | 'completed' | 'error'
  account_name?: string
  challenger_scores?: {
    teaching: number
    tailoring: number
    control: number
  }
  conversation_analysis?: any[]
  analysis_created_at?: string
}

interface HeatDealsSectionProps {
  heatLevel: 'HIGH' | 'MEDIUM' | 'LOW'
  transcripts: TranscriptSummary[]
  isLoading: boolean
}

export function HeatDealsSection({ heatLevel, transcripts, isLoading }: HeatDealsSectionProps) {
  const navigate = useNavigate()

  const handleViewTranscript = (transcriptId: string) => {
    navigate(`/analysis/${transcriptId}`)
  }

  const getHeatLevel = (analysis: any) => {
    // FIXED: Use database heat_level column as primary source
    if (analysis?.heat_level) {
      return analysis.heat_level.toUpperCase()
    }
    
    // Only fallback if no heat_level in database (shouldn't happen after migration)
    return analysis?.recommendations?.heat_level || 
           analysis?.guidance?.heat_level || 
           analysis?.call_summary?.heat_level ||
           'LOW'
  }

  // Filter transcripts by heat level
  const filteredTranscripts = transcripts.filter(transcript => {
    if (transcript.status !== 'completed' || !transcript.conversation_analysis?.length) {
      return false
    }
    
    const transcriptHeat = getHeatLevel(transcript.conversation_analysis[0])
    return transcriptHeat === heatLevel
  }).slice(0, 4) // Max 4 per column

  const remainingCount = transcripts.filter(transcript => {
    if (transcript.status !== 'completed' || !transcript.conversation_analysis?.length) return false
    const transcriptHeat = getHeatLevel(transcript.conversation_analysis[0])
    return transcriptHeat === heatLevel
  }).length - 4

  const getThemeClasses = () => {
    switch (heatLevel) {
      case 'HIGH':
        return {
          border: 'border-l-red-500',
          bg: 'bg-red-50',
          icon: '🔥',
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          title: 'text-red-900'
        }
      case 'MEDIUM':
        return {
          border: 'border-l-orange-500',
          bg: 'bg-orange-50',
          icon: '🌡️',
          iconBg: 'bg-orange-100',
          iconColor: 'text-orange-600',
          title: 'text-orange-900'
        }
      case 'LOW':
        return {
          border: 'border-l-blue-500',
          bg: 'bg-blue-50',
          icon: '❄️',
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600',
          title: 'text-blue-900'
        }
    }
  }

  const theme = getThemeClasses()

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}h ${remainingMinutes}m`
  }

  const getScoreDisplay = (score: number | null | undefined) => {
    if (score === null || score === undefined) return 'N/A'
    return score.toFixed(1)
  }

  const formatAnalysisDate = (dateString: string | undefined) => {
    if (!dateString) return null
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch {
      return null
    }
  }

  if (isLoading) {
    return (
      <Card className={`${theme.border} border-l-4 hover:shadow-lg transition-all duration-200 bg-white`}>
        <CardHeader>
          <CardTitle className={`flex items-center space-x-3 text-lg ${theme.title}`}>
            <div className={`p-2 ${theme.iconBg} rounded-lg`}>
              <span className="text-lg">{theme.icon}</span>
            </div>
            <span>{heatLevel} HEAT DEALS</span>
          </CardTitle>
          <CardDescription className="text-slate-600">Loading...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-3 border rounded-lg animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`${theme.border} border-l-4 hover:shadow-lg transition-all duration-200 bg-white`}>
      <CardHeader className={theme.bg}>
        <CardTitle className={`flex items-center space-x-3 text-lg ${theme.title}`}>
          <div className={`p-2 ${theme.iconBg} rounded-lg`}>
            <span className="text-lg">{theme.icon}</span>
          </div>
          <span>{heatLevel} HEAT DEALS</span>
        </CardTitle>
        <CardDescription className="text-slate-600">
          {filteredTranscripts.length} active opportunities
        </CardDescription>
      </CardHeader>
      <CardContent>
        {filteredTranscripts.length === 0 ? (
          <div className="text-center py-6">
            <div className={`p-4 ${theme.bg} rounded-lg border border-gray-200`}>
              <p className="text-sm text-slate-600">No {heatLevel.toLowerCase()} heat deals yet</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTranscripts.map((transcript) => (
              <div
                key={transcript.id}
                className="p-3 border rounded-lg hover:bg-slate-50 transition-colors group cursor-pointer"
                onClick={() => handleViewTranscript(transcript.id)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors text-sm mb-1">
                      {transcript.title}
                    </h4>
                    <div className="flex items-center space-x-2 text-xs text-slate-500">
                      <span className="flex items-center">
                        <Users className="h-3 w-3 mr-1" />
                        {transcript.participants.length}
                      </span>
                      <span className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatDuration(transcript.duration_minutes)}
                      </span>
                      {transcript.analysis_created_at && (
                        <span className="flex items-center">
                          📅 Analyzed {formatAnalysisDate(transcript.analysis_created_at)}
                        </span>
                      )}
                    </div>
                    {transcript.account_name && (
                      <div className="mt-1">
                        <span className="text-xs text-blue-600 font-medium">
                          {transcript.account_name}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {transcript.challenger_scores && (
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center space-x-3 text-xs">
                      <div className="text-center">
                        <div className="font-medium text-yellow-600">
                          {getScoreDisplay(transcript.challenger_scores.teaching)}
                        </div>
                        <div className="text-xs text-slate-500">T</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-blue-600">
                          {getScoreDisplay(transcript.challenger_scores.tailoring)}
                        </div>
                        <div className="text-xs text-slate-500">T</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-green-600">
                          {getScoreDisplay(transcript.challenger_scores.control)}
                        </div>
                        <div className="text-xs text-slate-500">C</div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-6 px-2 text-xs"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleViewTranscript(transcript.id)
                      }}
                    >
                      View
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                )}
              </div>
            ))}

            {remainingCount > 0 && (
              <div className="pt-3 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`w-full text-xs ${theme.iconColor} hover:${theme.bg}`}
                >
                  View All ({remainingCount} more)
                  <TrendingUp className="h-3 w-3 ml-1" />
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
