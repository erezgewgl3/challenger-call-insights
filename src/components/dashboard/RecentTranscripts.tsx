
import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, Clock, Users, MoreHorizontal, Eye, TrendingUp } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useTranscriptData } from '@/hooks/useTranscriptData'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

export function RecentTranscripts() {
  const { transcripts, isLoading } = useTranscriptData()

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>
      case 'processing':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 animate-pulse">Processing</Badge>
      case 'error':
        return <Badge variant="destructive">Error</Badge>
      default:
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Uploaded</Badge>
    }
  }

  const handleViewAnalysis = (transcriptId: string) => {
    window.location.href = `/analysis/${transcriptId}`
  }

  if (isLoading) {
    return (
      <Card className="shadow-md hover:shadow-lg transition-all duration-200 bg-white">
        <CardHeader>
          <CardTitle className="flex items-center space-x-3 text-xl text-slate-900">
            <div className="p-2 bg-green-100 rounded-lg">
              <FileText className="h-6 w-6 text-green-600" />
            </div>
            <span>Recent Transcripts</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <LoadingSpinner />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-md hover:shadow-lg transition-all duration-200 bg-white">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center space-x-3 text-xl text-slate-900">
            <div className="p-2 bg-green-100 rounded-lg">
              <FileText className="h-6 w-6 text-green-600" />
            </div>
            <span>Recent Transcripts</span>
          </CardTitle>
          <CardDescription className="text-slate-600">
            Your latest sales call analyses and coaching insights
          </CardDescription>
        </div>
        <Button variant="outline" size="sm">
          View All
        </Button>
      </CardHeader>
      <CardContent>
        {transcripts.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">No transcripts yet</p>
            <p className="text-gray-400 text-sm">Upload your first sales call to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {transcripts.map((transcript) => (
              <div
                key={transcript.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => transcript.status === 'completed' && handleViewAnalysis(transcript.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-medium text-slate-900 truncate">{transcript.title}</h4>
                      {getStatusBadge(transcript.status)}
                      {transcript.challenger_scores && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          {transcript.challenger_scores.teaching.toFixed(1)}
                        </Badge>
                      )}
                    </div>
                    
                    {transcript.account_name && (
                      <p className="text-sm text-slate-600 mb-2">{transcript.account_name}</p>
                    )}
                    
                    <div className="flex items-center space-x-4 text-sm text-slate-500">
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4" />
                        <span>{transcript.participants.length} participants</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{transcript.duration_minutes} min</span>
                      </div>
                      <span>•</span>
                      <span>{formatDistanceToNow(new Date(transcript.created_at), { addSuffix: true })}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {transcript.status === 'completed' && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleViewAnalysis(transcript.id)
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
