import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Brain, Upload } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { CompactTranscriptUpload } from '@/components/upload/CompactTranscriptUpload';
import { HeatDealsSection } from '@/components/dashboard/HeatDealsSection';
import { IntegrationsStatusBadge } from '@/components/dashboard/IntegrationsStatusBadge';
import { CollapsibleProcessingQueue } from '@/components/dashboard/CollapsibleProcessingQueue';
import { ArchivedDealsDrawer } from '@/components/dashboard/ArchivedDealsDrawer';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function ActiveDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

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
            participants,
            created_at
          )
        `)
        .eq('user_id', user?.id)
        .eq('status', 'completed')
        .eq('is_archived', false)
        .order('created_at', { ascending: false })
        .limit(10);
      
      return data?.map(transcript => {
        const analysis = transcript.conversation_analysis?.[0] as any | undefined;
        const callSummary = analysis?.call_summary as Record<string, any> | undefined;
        const analysisParticipants = Array.isArray(analysis?.participants) ? (analysis.participants as any[]) : [];
        const firstParticipant = analysisParticipants?.[0];
        const firstParticipantName = typeof firstParticipant === 'string' 
          ? firstParticipant 
          : (firstParticipant?.name as string | undefined);
        
        // Prefer analysis-derived identifiers, then associated account, then DB title as last resort
        const displayTitle = 
          callSummary?.title ||
          callSummary?.meeting_title ||
          callSummary?.account?.name ||
          callSummary?.company_name ||
          callSummary?.deal_name ||
          callSummary?.contact_name ||
          (firstParticipantName ? `Call with ${firstParticipantName}` : undefined) ||
          transcript.accounts?.name ||
          transcript.title || '';
        
        return {
          id: transcript.id,
          title: displayTitle,
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
        };
      }) || [];
    },
    enabled: !!user?.id,
  });

  const handleAnalysisComplete = (transcriptId: string) => {
    navigate(`/analysis/${transcriptId}`);
  };

  const hotDeals = transcripts.filter(t => t.conversation_analysis?.[0]?.heat_level === 'HIGH');
  const warmDeals = transcripts.filter(t => t.conversation_analysis?.[0]?.heat_level === 'MEDIUM');
  const coldDeals = transcripts.filter(t => t.conversation_analysis?.[0]?.heat_level === 'LOW');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <Brain className="h-5 w-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-semibold text-foreground">Sales Whisperer</h1>
            </div>
            <div className="flex items-center space-x-4">
              <IntegrationsStatusBadge />
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
          
          {/* Sticky Upload Bar */}
          <div className="mb-6 bg-card border rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Upload className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Upload New Transcript</h3>
                  <p className="text-sm text-muted-foreground">Drop a file or connect Zoom</p>
                </div>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2">
                    <Upload className="h-4 w-4" />
                    Upload
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Upload Transcript</DialogTitle>
                  </DialogHeader>
                  <CompactTranscriptUpload onAnalysisComplete={handleAnalysisComplete} />
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Smart Queue Display - Only show if items exist */}
          {user?.id && (
            <div className="mb-6">
              <CollapsibleProcessingQueue user_id={user.id} />
            </div>
          )}

          {/* Your Pipeline Section */}
          <div className="mb-6 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-foreground">
              Your Pipeline
            </h2>
            <ArchivedDealsDrawer />
          </div>

          {/* Three-column layout - hide empty columns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {hotDeals.length > 0 && (
              <HeatDealsSection 
                heatLevel="HIGH" 
                transcripts={transcripts} 
                isLoading={transcriptsLoading} 
              />
            )}
            {warmDeals.length > 0 && (
              <HeatDealsSection 
                heatLevel="MEDIUM" 
                transcripts={transcripts} 
                isLoading={transcriptsLoading} 
              />
            )}
            {coldDeals.length > 0 && (
              <HeatDealsSection 
                heatLevel="LOW" 
                transcripts={transcripts} 
                isLoading={transcriptsLoading} 
              />
            )}
            
            {/* Show all columns if no deals yet */}
            {hotDeals.length === 0 && warmDeals.length === 0 && coldDeals.length === 0 && (
              <>
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
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
