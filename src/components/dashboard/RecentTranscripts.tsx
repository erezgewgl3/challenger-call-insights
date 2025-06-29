
import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, Clock, Users, MoreHorizontal } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Transcript {
  id: string
  title: string
  participants: string[]
  duration: number
  createdAt: Date
  status: 'completed' | 'processing' | 'error'
  accountName?: string
}

// Mock data - will be replaced with real data from Supabase
const mockTranscripts: Transcript[] = [
  {
    id: '1',
    title: 'Discovery Call - Acme Corp',
    participants: ['John Doe', 'Jane Smith'],
    duration: 45,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    status: 'completed',
    accountName: 'Acme Corporation'
  },
  {
    id: '2',
    title: 'Follow-up Meeting - TechStart Inc',
    participants: ['Mike Johnson', 'Sarah Wilson'],
    duration: 30,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    status: 'processing',
    accountName: 'TechStart Inc'
  },
  {
    id: '3',
    title: 'Sales Demo - GlobalTech',
    participants: ['Alex Brown', 'Lisa Chen'],
    duration: 60,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    status: 'completed',
    accountName: 'GlobalTech Solutions'
  }
]

export function RecentTranscripts() {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>
      case 'processing':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Processing</Badge>
      case 'error':
        return <Badge variant="destructive">Error</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
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
        {mockTranscripts.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">No transcripts yet</p>
            <p className="text-gray-400 text-sm">Upload your first sales call to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {mockTranscripts.map((transcript) => (
              <div
                key={transcript.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-medium text-slate-900 truncate">{transcript.title}</h4>
                      {getStatusBadge(transcript.status)}
                    </div>
                    
                    {transcript.accountName && (
                      <p className="text-sm text-slate-600 mb-2">{transcript.accountName}</p>
                    )}
                    
                    <div className="flex items-center space-x-4 text-sm text-slate-500">
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4" />
                        <span>{transcript.participants.length} participants</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{transcript.duration} min</span>
                      </div>
                      <span>•</span>
                      <span>{formatDistanceToNow(transcript.createdAt, { addSuffix: true })}</span>
                    </div>
                  </div>
                  
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
