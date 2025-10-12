
import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Clock, Users, ArrowRight, Upload } from 'lucide-react'
import { useTranscriptData } from '@/hooks/useTranscriptData'
import { useNavigate } from 'react-router-dom'
import { formatDistanceToNow, differenceInHours, differenceInDays, format } from 'date-fns'

export function RecentTranscripts() {
  const { transcripts, isLoading } = useTranscriptData()
  const navigate = useNavigate()

  const handleViewTranscript = (transcriptId: string) => {
    navigate(`/analysis/${transcriptId}`)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'processing':
        return 'bg-yellow-100 text-yellow-800'
      case 'uploaded':
        return 'bg-blue-100 text-blue-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getHeatLevel = (analysis: any) => {
    // FIXED: Use database heat_level column as primary source
    if (analysis?.heat_level) {
      return analysis.heat_level.toUpperCase()
    }
    
    // Only fallback if no heat_level in database (shouldn't happen after migration)
    return analysis?.recommendations?.heat_level || 
           analysis?.guidance?.heat_level || 
           analysis?.call_summary?.heat_level
  }

  const getHeatSortValue = (heatLevel: string) => {
    switch (heatLevel?.toUpperCase()) {
      case 'HIGH': return 3
      case 'MEDIUM': return 2
      case 'LOW': return 1
      default: return 0
    }
  }

  // Sort transcripts by heat level (highest first), then by date
  const sortedTranscripts = [...transcripts].sort((a, b) => {
    const heatA = getHeatLevel(a.conversation_analysis?.[0])
    const heatB = getHeatLevel(b.conversation_analysis?.[0])
    
    const heatValueA = getHeatSortValue(heatA)
    const heatValueB = getHeatSortValue(heatB)
    
    if (heatValueA !== heatValueB) {
      return heatValueB - heatValueA // Sort by heat descending
    }
    
    // If heat is the same, sort by date (most recent first)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}h ${remainingMinutes}m`
  }

  const getScoreDisplay = (score: number | null | undefined) => {
    if (score === null || score === undefined) return 'N/A'
    return score.toFixed(1)
  }

  const getParticipantNames = (t: any): string[] => {
    const names: string[] = [];
    
    // Priority 1: extracted_participants from metadata extraction
    if (Array.isArray(t.extracted_participants) && t.extracted_participants.length > 0) {
      const extractedNames = t.extracted_participants
        .map((p: any) => typeof p === 'string' ? p : p.name)
        .filter(Boolean);
      names.push(...extractedNames);
    }
    
    // Priority 2: participants from transcript (simple array)
    if (Array.isArray(t.participants) && t.participants.length > 0) {
      const transcriptNames = t.participants
        .map((p: any) => typeof p === 'string' ? p : (p.name || null))
        .filter(Boolean);
      names.push(...transcriptNames);
    }
    
    // Priority 3: conversation_analysis structured participants
    const analysis: any = t.conversation_analysis?.[0];
    if (analysis?.participants) {
      // Extract client contacts
      if (Array.isArray(analysis.participants.clientContacts)) {
        const clientNames = analysis.participants.clientContacts
          .map((c: any) => c.name)
          .filter(Boolean);
        names.push(...clientNames);
      }
      
      // Extract sales rep(s)
      if (analysis.participants.salesRep?.name) {
        names.push(`${analysis.participants.salesRep.name} (${analysis.participants.salesRep.company || 'Rep'})`);
      }
    }
    
    // Remove duplicates and return
    return [...new Set(names)];
  }

  const isGenericTitle = (title: string): boolean => {
    const genericPatterns = [
      /^the (client|prospect|customer|company)$/i,
      /^(call|meeting|conversation|discussion)$/i,
      /^compliance risks?$/i,
      /^transcript\.?(txt|docx|vtt)?$/i,
      /^unnamed/i,
      /^untitled/i
    ];
    return genericPatterns.some(pattern => pattern.test(title.trim()));
  };

  const buildSmartFallbackTitle = (transcript: any): string => {
    const parts: string[] = [];
    
    // Get participant names
    if (transcript.participants && transcript.participants.length > 0) {
      const firstName = transcript.participants[0].split(' ')[0];
      parts.push(firstName);
    }
    
    // Add date context
    const date = transcript.created_at;
    if (date) {
      const callDate = new Date(date);
      const daysAgo = differenceInDays(new Date(), callDate);
      
      if (daysAgo === 0) {
        parts.push("(Today)");
      } else if (daysAgo === 1) {
        parts.push("(Yesterday)");
      } else if (daysAgo <= 7) {
        parts.push(`(${format(callDate, 'EEEE')})`);
      } else {
        parts.push(`(${format(callDate, 'MMM d')})`);
      }
    }
    
    if (parts.length === 0) {
      return "Unknown Prospect";
    }
    
    return parts.join(" ");
  };

  const getDisplayTitle = (transcript: any) => {
    // Priority 1: Extracted company name
    if (transcript.extracted_company_name) return transcript.extracted_company_name;
    
    // Priority 2: AI-generated title (if substantive)
    const analysis = transcript.conversation_analysis?.[0];
    const cs = analysis?.call_summary;
    const aiTitle = cs?.title || cs?.meeting_title || cs?.deal_name;
    
    if (aiTitle && !isGenericTitle(aiTitle)) {
      return aiTitle;
    }
    
    // Priority 3: Account name
    if (transcript.account_name) return transcript.account_name;
    
    // Priority 4: Smart fallback
    return buildSmartFallbackTitle(transcript);
  };

  const formatAnalysisDate = (dateString: string | undefined) => {
    if (!dateString) return null
    try {
      const analysisDate = new Date(dateString)
      const hoursAgo = differenceInHours(new Date(), analysisDate)
      
      // If within 24 hours, show relative time
      if (hoursAgo < 24) {
        return formatDistanceToNow(analysisDate, { addSuffix: true })
      }
      
      // If older than 24 hours, show actual date
      return format(analysisDate, 'MMM d, yyyy')
    } catch {
      return null
    }
  }

  if (isLoading) {
    return (
      <Card className="shadow-md bg-white">
        <CardHeader>
          <CardTitle className="flex items-center space-x-3 text-xl text-slate-900">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <span>Recent Transcripts</span>
          </CardTitle>
          <CardDescription className="text-slate-600">Loading recent conversations...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 border rounded-lg animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-md hover:shadow-lg transition-all duration-200 bg-white">
      <CardHeader>
        <CardTitle className="flex items-center space-x-3 text-xl text-slate-900">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Clock className="h-6 w-6 text-blue-600" />
          </div>
          <span>Recent Transcripts</span>
        </CardTitle>
        <CardDescription className="text-slate-600">
          Your latest conversation analyses and deal intelligence
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sortedTranscripts.length === 0 ? (
          <div className="text-center py-8 space-y-4">
            <div className="p-4 bg-slate-50 rounded-lg">
              <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
              <p className="text-slate-600 font-medium">No transcripts yet</p>
              <p className="text-sm text-slate-500">Upload your first sales call to get started</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedTranscripts.map((transcript) => (
              <div
                key={transcript.id}
                className="p-4 border rounded-lg hover:bg-slate-50 transition-colors group cursor-pointer"
                onClick={() => handleViewTranscript(transcript.id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors mb-1">
                      {getDisplayTitle(transcript)}
                    </h4>
                    
                    {/* Secondary context - participants */}
                    {(() => {
                      const names = getParticipantNames(transcript);
                      if (names.length > 0) {
                        // Separate client contacts from sales reps
                        const clientContacts = names.filter(n => !n.includes('(Rep)') && !n.includes('(Actifile)'));
                        const salesReps = names.filter(n => n.includes('(Rep)') || n.includes('(Actifile)'));
                        
                        const displayNames = clientContacts.slice(0, 2); // Show max 2 clients
                        const remaining = clientContacts.length - 2;
                        
                        return (
                          <p className="text-sm text-slate-600 mb-1 truncate">
                            👤 {displayNames.join(', ')}
                            {remaining > 0 ? ` +${remaining}` : ''}
                            {salesReps.length > 0 && (
                              <span className="text-slate-500 ml-1">
                                • {salesReps[0]}
                              </span>
                            )}
                          </p>
                        );
                      }
                      return null;
                    })()}
                    
                    {/* Tertiary context - metadata */}
                    <div className="flex items-center space-x-2 text-xs text-slate-500">
                      {transcript.analysis_created_at && (
                        <span>📅 {formatAnalysisDate(transcript.analysis_created_at)}</span>
                      )}
                      {transcript.duration_minutes && (
                        <>
                          <span>•</span>
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatDuration(transcript.duration_minutes)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(transcript.status)} variant="secondary">
                      {transcript.status}
                    </Badge>
                  </div>
                </div>


                {transcript.status === 'processing' && (
                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex items-center space-x-2 text-sm text-slate-600">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                      <span>AI analysis in progress...</span>
                    </div>
                  </div>
                )}

                {transcript.status === 'uploaded' && (
                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex items-center space-x-2 text-sm text-slate-600">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Queued for analysis</span>
                    </div>
                  </div>
                )}

                {transcript.status === 'error' && (
                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex items-center space-x-2 text-sm text-red-600">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span>Analysis failed - click to retry</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
