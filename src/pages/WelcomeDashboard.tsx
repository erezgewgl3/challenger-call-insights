import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { CompactTranscriptUpload } from '@/components/upload/CompactTranscriptUpload';
import { HeatDealsSection } from '@/components/dashboard/HeatDealsSection';
import { ZoomStatusBadge } from '@/components/dashboard/ZoomStatusBadge';
import { ZoomMeetingsWidget } from '@/components/dashboard/ZoomMeetingsWidget';
import { QueueInterfaceTester } from '@/components/testing/QueueInterfaceTester';
import { FileText, TrendingUp, Thermometer, Clock, LogOut, Brain } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function WelcomeDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const { data: transcriptCount = 0 } = useQuery({
    queryKey: ['transcript-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('transcripts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id);
      return count || 0;
    },
    enabled: !!user?.id,
  });

  const { data: transcripts = [], isLoading: transcriptsLoading } = useQuery({
    queryKey: ['heat-transcripts'],
    queryFn: async () => {
      const { data } = await supabase
        .from('transcripts')
        .select(`
          *,
          accounts(name),
          conversation_analysis(
            challenger_scores,
            heat_level,
            guidance,
            recommendations,
            call_summary,
            created_at
          )
        `)
        .eq('user_id', user?.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(10);
      
      return data?.map(transcript => ({
        id: transcript.id,
        title: transcript.title || '',
        participants: Array.isArray(transcript.participants) 
          ? (transcript.participants as string[])
          : typeof transcript.participants === 'string' 
            ? [transcript.participants] 
            : [],
        duration_minutes: transcript.duration_minutes || 0,
        created_at: transcript.created_at || '',
        status: transcript.status as 'uploaded' | 'processing' | 'completed' | 'error',
        source: transcript.source_meeting_id ? 'zoom' : 'manual',
        account_name: transcript.accounts?.name,
        challenger_scores: transcript.conversation_analysis?.[0]?.challenger_scores as {
          teaching: number;
          tailoring: number;
          control: number;
        } | undefined,
        conversation_analysis: transcript.conversation_analysis || [],
        analysis_created_at: transcript.conversation_analysis?.[0]?.created_at
      })) || [];
    },
    enabled: !!user?.id,
  });

  // Check for Zoom integration status
  const { data: integrations = [] } = useQuery({
    queryKey: ['user-integrations'],
    queryFn: async () => {
      const { data } = await supabase
        .from('integration_connections')
        .select('*')
        .eq('user_id', user?.id)
        .eq('connection_status', 'active');
      return data || [];
    },
    enabled: !!user?.id,
  });

  const hasZoomIntegration = integrations.some(
    integration => integration.integration_type === 'zoom'
  );

  // Fetch real Zoom meetings data with auto-refresh
  const { data: zoomMeetingsData, isLoading: zoomLoading, error: zoomError, refetch: refetchZoomMeetings } = useQuery({
    queryKey: ['zoom-meetings', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('get-zoom-meetings');
      if (error) {
        console.error('Error fetching Zoom meetings:', error);
        throw error;
      }
      return data;
    },
    enabled: !!user && hasZoomIntegration,
    staleTime: 2 * 60 * 1000, // 2 minutes - shorter for better responsiveness
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
    retryDelay: 2000,
    refetchOnWindowFocus: true, // Auto refresh when user returns to dashboard
  });

  const zoomMeetings = zoomMeetingsData?.meetings || [];

  // State for processing and error handling
  const [processingMeetings, setProcessingMeetings] = useState<Set<string>>(new Set());
  const [errorMeetings, setErrorMeetings] = useState<Map<string, string>>(new Map());

  // Enhanced auto-refresh logic with better timing
  useEffect(() => {
    let refreshTimer: NodeJS.Timeout;
    
    const scheduleRefresh = () => {
      // Clear any existing timer
      if (refreshTimer) clearTimeout(refreshTimer);
      
      // Schedule refresh after analysis likely completed
      refreshTimer = setTimeout(() => {
        if (hasZoomIntegration && !document.hidden) {
          refetchZoomMeetings();
        }
      }, 2000); // 2 second delay after navigation
    };

    // Listen for navigation back to dashboard
    const handleNavigation = () => {
      if (location.pathname === '/dashboard') {
        scheduleRefresh();
      }
    };

    // Listen for visibility changes (tab switching)
    const handleVisibilityChange = () => {
      if (!document.hidden && location.pathname === '/dashboard' && hasZoomIntegration) {
        scheduleRefresh();
      }
    };

    // Listen for storage events (cross-tab communication)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'zoom-analysis-completed' && hasZoomIntegration) {
        scheduleRefresh();
      }
    };

    // Add event listeners
    window.addEventListener('popstate', handleNavigation);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('storage', handleStorageChange);

    // Cleanup
    return () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      window.removeEventListener('popstate', handleNavigation);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [hasZoomIntegration, refetchZoomMeetings, location.pathname]);

  // Check for analysis completion on return
  useEffect(() => {
    // Check if user returned from analysis page
    const urlParams = new URLSearchParams(location.search);
    const analysisCompleted = urlParams.get('zoom-analysis-completed');
    
    if (analysisCompleted === 'true') {
      // Remove parameter from URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('zoom-analysis-completed');
      window.history.replaceState({}, '', newUrl.toString());
      
      // Refresh queue after small delay
      setTimeout(() => {
        refetchZoomMeetings();
      }, 1000);
      
      // Show success message (optional)
      console.log('Zoom analysis completed - queue refreshed');
    }
  }, [location.search, refetchZoomMeetings]);

  // Enhanced analyze meeting handler
  const handleAnalyzeMeeting = async (meetingId: string) => {
    const meetingData = zoomMeetingsData?.meetings?.find(m => m.id === meetingId);
    if (!meetingData) {
      console.error('Meeting data not found for ID:', meetingId);
      return;
    }

    try {
      console.log('Starting analysis for meeting:', meetingId);
      
      // Add to processing set
      setProcessingMeetings(prev => new Set(prev).add(meetingId));
      setErrorMeetings(prev => {
        const newMap = new Map(prev);
        newMap.delete(meetingId);
        return newMap;
      });

      // Call new process-zoom-transcript function
      const { data, error } = await supabase.functions.invoke('process-zoom-transcript', {
        body: {
          meetingId: meetingId,
          meetingTitle: meetingData.title,
          meetingDate: meetingData.date,
          meetingDuration: meetingData.duration,
          attendeeCount: meetingData.attendees
        }
      });

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to process meeting');
      }

      console.log('Meeting processed successfully:', data.transcriptId);

      // Store analysis info for refresh trigger
      localStorage.setItem('zoom-analysis-in-progress', JSON.stringify({
        transcriptId: data.transcriptId,
        meetingId: meetingId,
        startedAt: Date.now()
      }));

      // Success - navigate to analysis view with refresh parameter
      navigate(`/analysis/${data.transcriptId}?return-refresh=zoom-queue`, {
        state: { 
          source: 'zoom',
          meetingTitle: meetingData.title,
          justCreated: true
        }
      });

    } catch (error) {
      console.error('Error analyzing Zoom meeting:', error);
      
      // Add to error map with user-friendly message
      const errorMessage = error.message.includes('already processed') 
        ? 'This meeting has already been analyzed.' 
        : error.message;
      
      setErrorMeetings(prev => new Map(prev).set(meetingId, errorMessage));
      
    } finally {
      // Remove from processing set
      setProcessingMeetings(prev => {
        const newSet = new Set(prev);
        newSet.delete(meetingId);
        return newSet;
      });

      // Refresh queue after processing (successful or failed)
      setTimeout(() => refetchZoomMeetings(), 1000);
    }
  };

  // Enhanced retry handler
  const handleRetryMeeting = async (meetingId: string) => {
    // Clear previous error and retry
    setErrorMeetings(prev => {
      const newMap = new Map(prev);
      newMap.delete(meetingId);
      return newMap;
    });
    
    await handleAnalyzeMeeting(meetingId);
  };

  const handleAnalysisComplete = (transcriptId: string) => {
    navigate(`/analysis/${transcriptId}`);
  };

  const hotDealsCount = transcripts.filter(t => t.conversation_analysis?.[0]?.heat_level === 'HIGH').length;
  const warmDealsCount = transcripts.filter(t => t.conversation_analysis?.[0]?.heat_level === 'MEDIUM').length;

  return (
    <div className="min-h-screen bg-background">
      {/* Updated Header to Match Screenshot */}
      <header className="bg-card border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              {/* Logo - Blue circle with brain icon */}
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">Sales Whisperer</h1>
                <p className="text-sm text-muted-foreground">Get instant deal intelligence from every sales conversation</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">Welcome, {user?.email}</span>
              <ZoomStatusBadge />
              <Button variant="ghost" size="sm" onClick={signOut} className="text-muted-foreground hover:text-foreground">
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          {/* Compressed Hero Section */}
          <div className="mb-8">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Turn Every Sales Conversation Into Deal Intelligence
              </h1>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Upload your call transcript and instantly unlock buying signals, stakeholder insights, and strategic next steps to accelerate your opportunities
              </p>
            </div>

            {/* Upload Section */}
            <div className="mb-8">
              <CompactTranscriptUpload onAnalysisComplete={handleAnalysisComplete} />
            </div>
          </div>

          {/* Deal Intelligence Pipeline - Now the primary focus */}
          <div className="mb-8">
            <div className="mb-6 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Deal Intelligence Pipeline
                </h2>
                <p className="text-muted-foreground">
                  Track deal temperature and get actionable insights to close faster
                </p>
              </div>
            </div>

            {/* Three-column layout for all heat levels */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <HeatDealsSection 
                heatLevel="HIGH" 
                transcripts={transcripts} 
                isLoading={transcriptsLoading} 
              />
              <HeatDealsSection 
                heatLevel="MEDIUM" 
                transcripts={transcripts} 
                isLoading={transcriptsLoading} 
              />
              <HeatDealsSection 
                heatLevel="LOW" 
                transcripts={transcripts} 
                isLoading={transcriptsLoading} 
              />
            </div>
          </div>

          {/* Subtle Section Divider */}
          {hasZoomIntegration && (
            <div className="mb-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-muted-foreground/20"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-4 text-muted-foreground/60 font-medium tracking-wide">
                    Zoom Integration
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Zoom Meetings Widget - More Dominant Section */}
          {hasZoomIntegration && (
            <div className="mb-10">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Ready to Analyze
                </h2>
                <p className="text-muted-foreground">
                  Your latest Zoom meetings with transcripts available for immediate AI analysis
                </p>
              </div>
              <ZoomMeetingsWidget 
                meetings={zoomMeetings}
                loading={zoomLoading}
                onAnalyzeMeeting={handleAnalyzeMeeting}
                onRetryMeeting={handleRetryMeeting}
                processingMeetings={processingMeetings}
                errorMeetings={errorMeetings}
                onViewAll={() => {
                  console.log('View all meetings');
                  // TODO: Navigate to meetings list page
                }}
                onSettings={() => navigate('/integrations')}
                onRefresh={refetchZoomMeetings} // Manual refresh capability
                isConnected={hasZoomIntegration}
                maxDisplay={5}
                processedCount={zoomMeetingsData?.processedCount || 0}
                availableCount={zoomMeetingsData?.availableCount || 0}
              />
            </div>
          )}

          {/* Queue Interface Testing Section */}
          <div className="mb-10">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Queue Management Testing
              </h2>
              <p className="text-muted-foreground">
                Test the enhanced queue interface with external transcript assignments and filtering
              </p>
            </div>
            <QueueInterfaceTester />
          </div>

          {/* Getting Started - Progressive Disclosure */}
          {transcriptCount === 0 && (
            <Card className="bg-muted/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Get Started in 3 Steps</CardTitle>
                <CardDescription>Transform your sales conversations into intelligence</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-medium text-primary">1</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">Upload</h4>
                      <p className="text-muted-foreground">Drop your transcript file</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-medium text-primary">2</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">Analyze</h4>
                      <p className="text-muted-foreground">AI processes deal temperature</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-medium text-primary">3</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">Act</h4>
                      <p className="text-muted-foreground">Get insights to close faster</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
