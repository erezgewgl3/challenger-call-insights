
import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Clock, Users, TrendingUp, ArrowRight, Upload } from 'lucide-react'
import { useTranscriptData } from '@/hooks/useTranscriptData'
import { useNavigate } from 'react-router-dom'

export function RecentTranscripts() {
  const { transcripts, isLoading } = useTranscriptData()
  const navigate = useNavigate()

  const handleViewTranscript = (transcriptId: string) => {
    navigate(`/analysis/${transcriptId}`)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'processing':
        return 'bg-yellow-100 text-yellow-800'
      case 'uploaded':
        return 'bg-blue-100 text-blue-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

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

  if (isLoading) {
    return (
      <Card className="shadow-md bg-white">
        <CardHeader>
          <CardTitle className="flex items-center space-x-3 text-xl text-slate-900">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <span>Recent Transcripts</span>
          </CardTitle>
          <CardDescription className="text-slate-600">Loading recent conversations...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 border rounded-lg animate-pulse">
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
    <Card className="shadow-md hover:shadow-lg transition-all duration-200 bg-white">
      <CardHeader>
        <CardTitle className="flex items-center space-x-3 text-xl text-slate-900">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Clock className="h-6 w-6 text-blue-600" />
          </div>
          <span>Recent Transcripts</span>
        </CardTitle>
        <CardDescription className="text-slate-600">
          Your latest conversation analyses and coaching insights
        </CardDescription>
      </CardHeader>
      <CardContent>
        {transcripts.length === 0 ? (
          <div className="text-center py-8 space-y-4">
            <div className="p-4 bg-slate-50 rounded-lg">
              <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
              <p className="text-slate-600 font-medium">No transcripts yet</p>
              <p className="text-sm text-slate-500">Upload your first sales call to get started</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {transcripts.map((transcript) => (
              <div
                key={transcript.id}
                className="p-4 border rounded-lg hover:bg-slate-50 transition-colors group cursor-pointer"
                onClick={() => handleViewTranscript(transcript.id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {transcript.title}
                    </h4>
                    <div className="flex items-center space-x-3 text-sm text-slate-500 mt-1">
                      <span className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        {transcript.participants.length} participants
                      </span>
                      <span className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {formatDuration(transcript.duration_minutes)}
                      </span>
                      {transcript.account_name && (
                        <span className="text-blue-600 font-medium">
                          {transcript.account_name}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(transcript.status)} variant="secondary">
                      {transcript.status}
                    </Badge>
                  </div>
                </div>

                {transcript.challenger_scores && transcript.status === 'completed' && (
                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="text-center">
                        <div className="font-semibold text-yellow-600">
                          {getScoreDisplay(transcript.challenger_scores.teaching)}
                        </div>
                        <div className="text-xs text-slate-500">Teaching</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-blue-600">
                          {getScoreDisplay(transcript.challenger_scores.tailoring)}
                        </div>
                        <div className="text-xs text-slate-500">Tailoring</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-green-600">
                          {getScoreDisplay(transcript.challenger_scores.control)}
                        </div>
                        <div className="text-xs text-slate-500">Control</div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleViewTranscript(transcript.id)
                      }}
                    >
                      View Details
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                )}

                {transcript.status === 'processing' && (
                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex items-center space-x-2 text-sm text-slate-600">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                      <span>AI analysis in progress...</span>
                    </div>
                  </div>
                )}

                {transcript.status === 'uploaded' && (
                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex items-center space-x-2 text-sm text-slate-600">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Queued for analysis</span>
                    </div>
                  </div>
                )}

                {transcript.status === 'error' && (
                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex items-center space-x-2 text-sm text-red-600">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span>Analysis failed - click to retry</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
