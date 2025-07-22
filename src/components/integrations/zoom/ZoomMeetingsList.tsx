import React from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Video, 
  RefreshCw, 
  FileText, 
  Clock, 
  Users, 
  TrendingUp, 
  Eye, 
  AlertCircle,
  BookOpen,
  Download
} from 'lucide-react'

interface ZoomMeeting {
  id: string;
  title: string;
  date: string;
  duration: number; // minutes
  status: 'transcript_available' | 'processing' | 'no_transcript' | 'analysis_complete';
  transcriptSize?: string;
  attendees: number;
  hasCloudRecording: boolean;
}

interface ZoomMeetingsListProps {
  meetings?: ZoomMeeting[];
  loading?: boolean;
  onSyncMeetings?: () => void;
  onProcessTranscript?: (meetingId: string) => void;
  onViewStatus?: (meetingId: string) => void;
  onViewResults?: (meetingId: string) => void;
}

const mockMeetings: ZoomMeeting[] = [
  {
    id: "1",
    title: "Team Standup - Q4 Planning",
    date: "2025-01-20",
    duration: 30,
    status: "transcript_available",
    transcriptSize: "3.2 MB",
    attendees: 6,
    hasCloudRecording: true
  },
  {
    id: "2", 
    title: "Client Discovery Call - Acme Corp",
    date: "2025-01-19",
    duration: 75,
    status: "processing",
    attendees: 3,
    hasCloudRecording: true
  },
  {
    id: "3",
    title: "Sales Review Meeting", 
    date: "2025-01-18",
    duration: 45,
    status: "transcript_available",
    transcriptSize: "2.1 MB", 
    attendees: 8,
    hasCloudRecording: true
  },
  {
    id: "4",
    title: "Weekly Team Sync",
    date: "2025-01-17", 
    duration: 25,
    status: "no_transcript",
    attendees: 5,
    hasCloudRecording: false
  },
  {
    id: "5",
    title: "Demo Call - Beta Client",
    date: "2025-01-16",
    duration: 50, 
    status: "analysis_complete",
    transcriptSize: "2.8 MB",
    attendees: 4,
    hasCloudRecording: true
  }
];

const getStatusConfig = (status: ZoomMeeting['status']) => {
  switch (status) {
    case 'transcript_available':
      return {
        dot: 'bg-emerald-500',
        text: 'Transcript available',
        textColor: 'text-emerald-700',
        bgColor: 'bg-emerald-50'
      };
    case 'processing':
      return {
        dot: 'bg-amber-500',
        text: 'Transcript processing...',
        textColor: 'text-amber-700',
        bgColor: 'bg-amber-50'
      };
    case 'no_transcript':
      return {
        dot: 'bg-red-500',
        text: 'No transcript available',
        textColor: 'text-red-700',
        bgColor: 'bg-red-50'
      };
    case 'analysis_complete':
      return {
        dot: 'bg-blue-500',
        text: 'Analysis complete',
        textColor: 'text-blue-700',
        bgColor: 'bg-blue-50'
      };
  }
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
};

const formatDuration = (minutes: number) => {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
};

const MeetingCard: React.FC<{ 
  meeting: ZoomMeeting; 
  onProcessTranscript?: (meetingId: string) => void;
  onViewStatus?: (meetingId: string) => void;
  onViewResults?: (meetingId: string) => void;
}> = ({ meeting, onProcessTranscript, onViewStatus, onViewResults }) => {
  const statusConfig = getStatusConfig(meeting.status);

  const getActionButton = () => {
    switch (meeting.status) {
      case 'transcript_available':
        return (
          <Button 
            size="sm" 
            onClick={() => onProcessTranscript?.(meeting.id)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Process for Analysis
          </Button>
        );
      case 'processing':
        return (
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => onViewStatus?.(meeting.id)}
            className="border-amber-300 text-amber-700 hover:bg-amber-50"
          >
            <Eye className="w-4 h-4 mr-2" />
            View Status
          </Button>
        );
      case 'analysis_complete':
        return (
          <Button 
            size="sm"
            onClick={() => onViewResults?.(meeting.id)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            View Results
          </Button>
        );
      case 'no_transcript':
        return (
          <Button 
            size="sm" 
            variant="outline" 
            disabled
            className="text-gray-400 border-gray-200"
          >
            <AlertCircle className="w-4 h-4 mr-2" />
            No Transcript
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="p-4 lg:p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Meeting Title and Status */}
          <div className="flex items-start gap-3 mb-3">
            <div className={`w-3 h-3 rounded-full ${statusConfig.dot} flex-shrink-0 mt-1`} />
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-slate-900 text-base lg:text-lg truncate mb-1">
                {meeting.title}
              </h3>
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {formatDate(meeting.date)} • {formatDuration(meeting.duration)}
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {meeting.attendees} attendees
                </div>
              </div>
            </div>
          </div>

          {/* Status and Transcript Info */}
          <div className="flex flex-wrap items-center gap-3">
            <Badge 
              variant="secondary" 
              className={`${statusConfig.bgColor} ${statusConfig.textColor} border-0`}
            >
              {statusConfig.text}
            </Badge>
            
            {meeting.transcriptSize && (
              <div className="flex items-center gap-1 text-sm text-slate-500">
                <FileText className="w-4 h-4" />
                {meeting.transcriptSize}
              </div>
            )}
            
            {!meeting.hasCloudRecording && (
              <Badge variant="outline" className="text-slate-500 border-slate-300">
                Cloud recording disabled
              </Badge>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="flex-shrink-0">
          {getActionButton()}
        </div>
      </div>
    </Card>
  );
};

const LoadingSkeleton: React.FC = () => (
  <Card className="p-4 lg:p-6">
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-3 mb-3">
          <Skeleton className="w-3 h-3 rounded-full" />
          <div className="min-w-0 flex-1">
            <Skeleton className="h-5 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-16" />
        </div>
      </div>
      <Skeleton className="h-9 w-32" />
    </div>
  </Card>
);

const EmptyState: React.FC<{ onSyncMeetings?: () => void }> = ({ onSyncMeetings }) => (
  <Card className="p-8 lg:p-12 text-center">
    <div className="max-w-md mx-auto">
      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Video className="w-8 h-8 text-slate-400" />
      </div>
      
      <h3 className="text-lg font-semibold text-slate-900 mb-2">
        No recent meetings found
      </h3>
      
      <p className="text-slate-600 mb-6">
        Your Zoom meetings with cloud recordings will appear here.
        Make sure cloud recording is enabled for automatic transcripts.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button variant="outline" className="gap-2">
          <BookOpen className="w-4 h-4" />
          Learn More
        </Button>
        <Button onClick={onSyncMeetings} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Sync Meetings
        </Button>
      </div>
    </div>
  </Card>
);

export const ZoomMeetingsList: React.FC<ZoomMeetingsListProps> = ({
  meetings = mockMeetings,
  loading = false,
  onSyncMeetings,
  onProcessTranscript,
  onViewStatus,
  onViewResults
}) => {
  const hasMeetings = meetings && meetings.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <Video className="w-5 h-5 text-blue-600" />
          </div>
          <h2 className="text-xl lg:text-2xl font-semibold text-slate-900">
            Your Recent Zoom Meetings
          </h2>
        </div>
        
        <Button 
          onClick={onSyncMeetings}
          variant="outline" 
          className="gap-2 self-start sm:self-auto"
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Sync Meetings
        </Button>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {loading ? (
          // Loading State
          Array.from({ length: 3 }, (_, i) => <LoadingSkeleton key={i} />)
        ) : !hasMeetings ? (
          // Empty State
          <EmptyState onSyncMeetings={onSyncMeetings} />
        ) : (
          // Meetings List
          meetings.map((meeting) => (
            <MeetingCard
              key={meeting.id}
              meeting={meeting}
              onProcessTranscript={onProcessTranscript}
              onViewStatus={onViewStatus}
              onViewResults={onViewResults}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default ZoomMeetingsList;