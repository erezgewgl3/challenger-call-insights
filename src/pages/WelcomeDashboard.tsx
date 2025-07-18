
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { RecentTranscripts } from '@/components/dashboard/RecentTranscripts';
import { HeatDealsSection } from '@/components/dashboard/HeatDealsSection';
import { FileText, Upload, Video, TrendingUp, Settings, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function WelcomeDashboard() {
  const { user, signOut } = useAuth();

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

  const { data: accountCount = 0 } = useQuery({
    queryKey: ['account-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('accounts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id);
      return count || 0;
    },
    enabled: !!user?.id,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
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
                className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2"
              >
                <Zap className="w-4 h-4" />
                Integrations
              </Link>
              <Button variant="outline" onClick={signOut}>
                Sign Out
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Welcome Section */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {user?.email?.split('@')[0]}!
            </h2>
            <p className="text-lg text-gray-600">
              Your AI-powered sales intelligence dashboard
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Transcripts</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{transcriptCount}</div>
                <p className="text-xs text-muted-foreground">
                  Analyzed conversations
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Accounts</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{accountCount}</div>
                <p className="text-xs text-muted-foreground">
                  Prospects in pipeline
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Zoom Integration</CardTitle>
                <Video className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Ready</div>
                <p className="text-xs text-muted-foreground">
                  <Link to="/integrations" className="text-blue-600 hover:underline">
                    Connect your account
                  </Link>
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
                <Upload className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <Button size="sm" className="w-full">
                  Upload Transcript
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Dashboard Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Transcripts */}
            <div className="space-y-6">
              <RecentTranscripts />
            </div>

            {/* Heat Deals */}
            <div className="space-y-6">
              <HeatDealsSection />
            </div>
          </div>

          {/* Getting Started Section */}
          {transcriptCount === 0 && (
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Get Started with Sales Whisperer</CardTitle>
                <CardDescription>
                  Start analyzing your sales conversations in just a few steps
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                        <span className="text-sm font-medium text-blue-600">1</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Connect Zoom</h3>
                      <p className="text-sm text-gray-500">
                        <Link to="/integrations" className="text-blue-600 hover:underline">
                          Connect your Zoom account
                        </Link> for automatic transcript processing
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
                      <h3 className="text-sm font-medium text-gray-900">Upload Transcript</h3>
                      <p className="text-sm text-gray-500">
                        Upload a sales call transcript to get AI-powered insights
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
