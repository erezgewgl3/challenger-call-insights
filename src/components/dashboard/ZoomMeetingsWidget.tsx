
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Video, Settings, Eye, FileText, Users, Clock, Zap, RefreshCw, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ZoomMeetingQueueItem {
  id: string;
  title: string;
  date: string;
  duration: number; // minutes
  transcriptSize: string;
  attendees: number;
  isNew?: boolean; // Highlight recently imported
}

interface ZoomMeetingsWidgetProps {
  meetings?: ZoomMeetingQueueItem[];
  loading?: boolean;
  maxDisplay?: number; // Default 5, show "View All" if more
  onAnalyzeMeeting?: (meetingId: string) => void;
  onViewAll?: () => void;
  onSettings?: () => void;
  onRefresh?: () => void; // Manual refresh capability
  onRetryMeeting?: (meetingId: string) => void; // Retry failed meeting
  isConnected?: boolean; // Show connect button if false
  processedCount?: number; // Number of already processed meetings
  availableCount?: number; // Number of available unprocessed meetings
  processingMeetings?: Set<string>; // Currently processing meeting IDs
  errorMeetings?: Map<string, string>; // Meeting IDs with error messages
}

// Mock data for dashboard testing
const mockMeetingsQueue: ZoomMeetingQueueItem[] = [
  {
    id: "1",
    title: "Team Standup - Q4 Planning",
    date: "2025-01-20",
    duration: 30,
    transcriptSize: "3.2 MB",
    attendees: 6,
    isNew: true
  },
  {
    id: "2", 
    title: "Client Discovery Call - Acme Corp",
    date: "2025-01-19",
    duration: 75,
    transcriptSize: "4.1 MB",
    attendees: 3,
    isNew: true
  },
  {
    id: "3",
    title: "Sales Review Meeting", 
    date: "2025-01-18",
    duration: 45,
    transcriptSize: "2.1 MB", 
    attendees: 8,
    isNew: false
  },
  {
    id: "4",
    title: "Product Demo - Enterprise Client", 
    date: "2025-01-17",
    duration: 60,
    transcriptSize: "3.8 MB", 
    attendees: 5,
    isNew: false
  },
  {
    id: "5",
    title: "Weekly Pipeline Review", 
    date: "2025-01-16",
    duration: 40,
    transcriptSize: "2.7 MB", 
    attendees: 7,
    isNew: false
  }
];

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) return 'Today';
  if (diffDays === 2) return 'Yesterday';
  if (diffDays <= 7) return `${diffDays - 1} days ago`;
  
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric'
  });
};

const formatDuration = (minutes: number) => {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
};

const MeetingLoadingSkeleton = () => (
  <div className="space-y-3">
    {[1, 2, 3].map((i) => (
      <div key={i} className="flex items-center justify-between p-3 rounded-lg border bg-card">
        <div className="flex items-start gap-3 flex-1">
          <Skeleton className="w-2 h-2 rounded-full mt-2" />
          <div className="flex-1">
            <Skeleton className="h-4 w-48 mb-2" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
        <Skeleton className="h-8 w-24" />
      </div>
    ))}
  </div>
);

export const ZoomMeetingsWidget: React.FC<ZoomMeetingsWidgetProps> = ({
  meetings = mockMeetingsQueue,
  loading = false,
  maxDisplay = 5,
  onAnalyzeMeeting,
  onViewAll,
  onSettings,
  onRefresh,
  onRetryMeeting,
  isConnected = true,
  processedCount = 0,
  availableCount = 0,
  processingMeetings = new Set(),
  errorMeetings = new Map()
}) => {
  const displayMeetings = meetings.slice(0, maxDisplay);
  const hasMoreMeetings = meetings.length > maxDisplay;

  // Function to render the appropriate action button for each meeting
  const renderMeetingAction = (meeting: ZoomMeetingQueueItem) => {
    const isProcessing = processingMeetings.has(meeting.id);
    const error = errorMeetings.get(meeting.id);
    
    if (isProcessing) {
      return (
        <Button 
          size="sm"
          disabled 
          className="gap-1.5 ml-3 shrink-0"
        >
          <Loader2 className="h-3 w-3 animate-spin" />
          Processing...
        </Button>
      );
    }
    
    if (error) {
      return (
        <div className="ml-3 shrink-0 space-y-1">
          <div className="flex items-center gap-1 text-xs text-red-600">
            <AlertCircle className="h-3 w-3" />
            <span className="max-w-20 truncate" title={error}>Error</span>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onRetryMeeting?.(meeting.id)}
            className="gap-1.5 text-xs h-7"
          >
            <RefreshCw className="h-3 w-3" />
            Retry
          </Button>
        </div>
      );
    }
    
    return (
      <Button
        size="sm"
        onClick={() => onAnalyzeMeeting?.(meeting.id)}
        className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white ml-3 shrink-0"
      >
        <Zap className="h-3 w-3" />
        Analyze Now
      </Button>
    );
  };

  const handleAnalyze = (meetingId: string) => {
    console.log('Analyze meeting:', meetingId);
    onAnalyzeMeeting?.(meetingId);
  };

  const handleRetry = (meetingId: string) => {
    console.log('Retry meeting:', meetingId);
    onRetryMeeting?.(meetingId);
  };

  const handleSettings = () => {
    console.log('Open Zoom settings');
    onSettings?.();
  };

  const handleViewAll = () => {
    console.log('View all meetings');
    onViewAll?.();
  };

  const handleConnectZoom = () => {
    console.log('Connect Zoom account');
    onSettings?.(); // Redirect to integration settings
  };

  // Empty state when not connected
  if (!isConnected) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Video className="h-4 w-4 text-blue-600" />
              Zoom Meetings Ready for Analysis
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Video className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-foreground mb-2">No meetings ready for analysis</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
              Connect your Zoom account to automatically import meeting transcripts for AI analysis.
            </p>
            <Button onClick={handleConnectZoom} className="gap-2">
              <Zap className="h-4 w-4" />
              Connect Zoom
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Enhanced empty state with context awareness
  if (!loading && meetings.length === 0) {
    const hasProcessedMeetings = processedCount > 0;
    
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Video className="h-4 w-4 text-blue-600" />
              Zoom Meetings Ready for Analysis
            </CardTitle>
            <div className="flex items-center gap-1">
              {onRefresh && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onRefresh}
                  className="text-muted-foreground hover:text-foreground"
                  title="Refresh meetings"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleSettings}
                className="text-muted-foreground hover:text-foreground"
                title="Zoom settings"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            {hasProcessedMeetings ? (
              <>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-medium text-foreground mb-2">All caught up!</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
                  You've analyzed all available meeting transcripts ({processedCount} processed).
                </p>
                <Button variant="outline" onClick={onRefresh} className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Check for New Meetings
                </Button>
              </>
            ) : (
              <>
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="font-medium text-foreground mb-2">No meetings ready for analysis</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
                  Meetings with cloud recording and transcripts will appear here automatically.
                </p>
                <div className="flex gap-2 justify-center">
                  <Button variant="outline" onClick={onRefresh} className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                  </Button>
                  <Button variant="outline" onClick={handleSettings} className="gap-2">
                    <Settings className="h-4 w-4" />
                    Settings
                  </Button>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Video className="h-4 w-4 text-blue-600" />
              Zoom Meetings Ready for Analysis
              {!loading && meetings.length > 0 && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                  {meetings.length}
                </span>
              )}
            </CardTitle>
            <div className="flex items-center gap-1">
              {onRefresh && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onRefresh}
                  className="text-muted-foreground hover:text-foreground"
                  title="Refresh meetings"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleSettings}
                className="text-muted-foreground hover:text-foreground"
                title="Zoom settings"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <MeetingLoadingSkeleton />
        ) : (
          <div className="space-y-3">
            {displayMeetings.map((meeting) => (
              <div
                key={meeting.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="flex items-center gap-1 mt-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    {meeting.isNew && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-sm text-foreground truncate">
                        {meeting.title}
                      </h3>
                      {meeting.isNew && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">
                          NEW
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(meeting.date)} • {formatDuration(meeting.duration)}
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {meeting.transcriptSize}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {meeting.attendees}
                      </span>
                    </div>
                  </div>
                </div>
                
                {renderMeetingAction(meeting)}
              </div>
            ))}
            
            {hasMoreMeetings && (
              <div className="pt-2 border-t mt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleViewAll}
                  className="w-full gap-2 text-muted-foreground hover:text-foreground"
                >
                  <Eye className="h-4 w-4" />
                  View All Meetings ({meetings.length})
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
