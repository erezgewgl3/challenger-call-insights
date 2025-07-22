import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { CompactTranscriptUpload } from '@/components/upload/CompactTranscriptUpload';
import { HeatDealsSection } from '@/components/dashboard/HeatDealsSection';
import { ZoomStatusBadge } from '@/components/dashboard/ZoomStatusBadge';
import { ZoomMeetingsWidget } from '@/components/dashboard/ZoomMeetingsWidget';
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

          {/* Zoom Meetings Widget - Show when user has Zoom integration */}
          {hasZoomIntegration && (
            <div className="mb-8">
              <ZoomMeetingsWidget 
                loading={false}
                onAnalyzeMeeting={(meetingId) => {
                  console.log('Analyze meeting:', meetingId);
                  // TODO: Navigate to transcript processing
                }}
                onViewAll={() => {
                  console.log('View all meetings');
                  // TODO: Navigate to meetings list page
                }}
                onSettings={() => navigate('/integrations')}
                isConnected={hasZoomIntegration}
              />
            </div>
          )}

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
