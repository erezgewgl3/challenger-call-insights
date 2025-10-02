import React from 'react';
import { Button } from '@/components/ui/button';
import { Brain, Upload, Sparkles, Target } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { CompactTranscriptUpload } from '@/components/upload/CompactTranscriptUpload';
import { useNavigate } from 'react-router-dom';

export default function ZeroStateDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleAnalysisComplete = (transcriptId: string) => {
    navigate(`/analysis/${transcriptId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Minimal Header */}
      <header className="bg-card border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <Brain className="h-5 w-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-semibold text-foreground">Sales Whisperer</h1>
            </div>
            <Button variant="ghost" size="sm" onClick={signOut} className="text-muted-foreground hover:text-foreground">
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Centered Hero Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center min-h-[80vh] py-12">
          
          {/* Welcome Message */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Turn Sales Conversations Into Intelligence
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Upload your first transcript and get instant buying signals, stakeholder insights, and winning next steps
            </p>
          </div>

          {/* Giant Upload Component */}
          <div className="w-full max-w-2xl mb-16">
            <CompactTranscriptUpload onAnalysisComplete={handleAnalysisComplete} />
          </div>

          {/* Simple 3-Step Explainer */}
          <div className="w-full max-w-3xl">
            <h3 className="text-center text-sm font-medium text-muted-foreground mb-8">
              How It Works
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
                <h4 className="text-lg font-semibold text-foreground mb-2">Upload</h4>
                <p className="text-sm text-muted-foreground">
                  Drop your transcript file (.txt, .docx, .vtt)
                </p>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <h4 className="text-lg font-semibold text-foreground mb-2">Analyze</h4>
                <p className="text-sm text-muted-foreground">
                  AI analyzes deal temperature and buying signals
                </p>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                  <Target className="h-8 w-8 text-primary" />
                </div>
                <h4 className="text-lg font-semibold text-foreground mb-2">Act</h4>
                <p className="text-sm text-muted-foreground">
                  Get tailored insights to close the deal faster
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
