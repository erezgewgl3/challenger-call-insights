
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { TranscriptUpload } from '@/components/upload/TranscriptUpload';
import { HeatDealsSection } from '@/components/dashboard/HeatDealsSection';
import { FileText, Upload, Video, TrendingUp, Settings, Zap, LogOut } from 'lucide-react';
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

  const handleAnalysisComplete = (transcriptId: string) => {
    navigate(`/analysis/${transcriptId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-gray-900">Sales Whisperer</h1>
              </div>
            </div>
            <nav className="flex items-center space-x-4">
              <Link 
                to="/integrations"
                className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors"
              >
                <Zap className="w-4 h-4" />
                Connect Zoom
              </Link>
              <Button variant="outline" onClick={signOut} className="flex items-center gap-2">
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          {/* Hero Upload Section */}
          <div className="mb-12">
            <div className="text-center mb-8">
              <h1 className="text-5xl font-bold text-gray-900 mb-4 leading-tight">
                Turn Every Sales Conversation<br />
                Into Deal Intelligence
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Upload your call transcripts and get instant AI-powered insights to accelerate your deals. 
                Our advanced analysis reveals what prospects are really thinking and exactly what to do next.
              </p>
            </div>

            {/* Upload Component with Hero Styling */}
            <div className="max-w-4xl mx-auto">
              <TranscriptUpload onAnalysisComplete={handleAnalysisComplete} />
            </div>
          </div>

          {/* Deal Intelligence Pipeline Section */}
          <div className="mb-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Your Deal Intelligence Pipeline
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Track the temperature of your deals and get actionable insights to close faster
              </p>
            </div>

            {/* Pipeline Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="text-center">
                <CardHeader className="pb-2">
                  <CardTitle className="text-2xl font-bold text-blue-600">{transcriptCount}</CardTitle>
                  <CardDescription>Total Conversations</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500">Analyzed with AI</p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader className="pb-2">
                  <CardTitle className="text-2xl font-bold text-green-600">
                    {transcripts.filter(t => t.conversation_analysis?.[0]?.heat_level === 'HIGH').length}
                  </CardTitle>
                  <CardDescription>Hot Deals</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500">Ready to close</p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader className="pb-2">
                  <CardTitle className="text-2xl font-bold text-orange-600">
                    {transcripts.filter(t => t.conversation_analysis?.[0]?.heat_level === 'MEDIUM').length}
                  </CardTitle>
                  <CardDescription>Warm Prospects</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500">Need nurturing</p>
                </CardContent>
              </Card>
            </div>

            {/* Heat Deals Display */}
            <HeatDealsSection 
              heatLevel="HIGH" 
              transcripts={transcripts} 
              isLoading={transcriptsLoading} 
            />
          </div>

          {/* Getting Started Section for new users */}
          {transcriptCount === 0 && (
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="w-5 h-5 text-blue-600" />
                  Get Started in 3 Easy Steps
                </CardTitle>
                <CardDescription>
                  Transform your sales conversations into actionable intelligence
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                        <span className="text-sm font-medium text-blue-600">1</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Upload Transcript</h3>
                      <p className="text-sm text-gray-500">
                        Drag & drop your call transcript or browse files above
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                        <span className="text-sm font-medium text-blue-600">2</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">AI Analysis</h3>
                      <p className="text-sm text-gray-500">
                        Our AI analyzes buyer intent and deal temperature
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                        <span className="text-sm font-medium text-blue-600">3</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Get Insights</h3>
                      <p className="text-sm text-gray-500">
                        Receive actionable recommendations to close faster
                      </p>
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
