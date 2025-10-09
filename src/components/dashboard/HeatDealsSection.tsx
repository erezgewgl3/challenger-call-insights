
import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Clock, Users, ArrowRight, Archive, MoreVertical } from 'lucide-react'
import { useTranscriptData } from '@/hooks/useTranscriptData'
import { useNavigate } from 'react-router-dom'
import { formatDistanceToNow, differenceInHours, differenceInDays, format } from 'date-fns'
import { SourceBadge } from '@/components/ui/SourceBadge'
import { useArchiveTranscript } from '@/hooks/useArchiveTranscript'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface TranscriptSummary {
  id: string
  title: string
  participants: string[]
  duration_minutes: number
  created_at: string
  status: 'uploaded' | 'processing' | 'completed' | 'error'
  account_name?: string
  source?: 'manual' | 'zoom' | string
  extracted_company_name?: string
  extracted_participants?: any[]
  challenger_scores?: {
    teaching: number
    tailoring: number
    control: number
  }
  conversation_analysis?: any[]
  analysis_created_at?: string
}

interface HeatDealsSectionProps {
  heatLevel: 'HIGH' | 'MEDIUM' | 'LOW'
  transcripts: TranscriptSummary[]
  isLoading: boolean
}

export function HeatDealsSection({ heatLevel, transcripts, isLoading }: HeatDealsSectionProps) {
  const navigate = useNavigate()
  const archiveMutation = useArchiveTranscript()

  const handleViewTranscript = (transcriptId: string) => {
    navigate(`/analysis/${transcriptId}`)
  }

  const handleArchive = (e: React.MouseEvent, transcriptId: string) => {
    e.stopPropagation()
    archiveMutation.mutate({ transcriptId, shouldArchive: true })
  }

  const getHeatLevel = (analysis: any) => {
    // PRIORITY 1: Use database heat_level as primary source (single source of truth)
    if (analysis?.heat_level) {
      return analysis.heat_level.toUpperCase()
    }
    
    // LEGACY FALLBACK: Only for old records that don't have heat_level in database
    // This should become rare as new analyses will always have heat_level
    return analysis?.recommendations?.heat_level || 
           analysis?.guidance?.heat_level || 
           analysis?.call_summary?.heat_level ||
           'LOW'
  }

  // Filter transcripts by heat level using database-first approach
  const filteredTranscripts = transcripts.filter(transcript => {
    if (transcript.status !== 'completed' || !transcript.conversation_analysis?.length) {
      return false
    }
    
    const transcriptHeat = getHeatLevel(transcript.conversation_analysis[0])
    return transcriptHeat === heatLevel
  })

  const getThemeClasses = () => {
    switch (heatLevel) {
      case 'HIGH':
        return {
          border: 'border-l-red-500',
          bg: 'bg-red-50',
          icon: '🔥',
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          title: 'text-red-900'
        }
      case 'MEDIUM':
        return {
          border: 'border-l-orange-500',
          bg: 'bg-orange-50',
          icon: '🌡️',
          iconBg: 'bg-orange-100',
          iconColor: 'text-orange-600',
          title: 'text-orange-900'
        }
      case 'LOW':
        return {
          border: 'border-l-blue-500',
          bg: 'bg-blue-50',
          icon: '❄️',
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600',
          title: 'text-blue-900'
        }
    }
  }

  const theme = getThemeClasses()

  const getParticipantNames = (t: TranscriptSummary): string[] => {
    // Priority 1: extracted_participants from database
    if (t.extracted_participants && Array.isArray(t.extracted_participants) && t.extracted_participants.length > 0) {
      return t.extracted_participants.map((p: any) => 
        typeof p === 'string' ? p : (p.name || 'Unknown')
      ).filter(Boolean);
    }
    
    // Priority 2: transcript.participants
    if (t.participants && Array.isArray(t.participants) && t.participants.length > 0) {
      return t.participants.map((p: any) => 
        typeof p === 'string' ? p : (p.name || 'Unknown')
      ).filter(Boolean);
    }
    
    // Priority 3: conversation_analysis participants
    const analysis: any = t.conversation_analysis?.[0];
    const participants = Array.isArray(analysis?.participants) ? analysis.participants : [];
    if (participants.length > 0) {
      return participants.map((p: any) => 
        typeof p === 'string' ? p : (p.name || 'Unknown')
      ).filter(Boolean);
    }
    
    return [];
  };

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

  const buildSmartFallbackTitle = (t: TranscriptSummary): string => {
    const parts: string[] = [];
    
    // Get participant names
    const names = getParticipantNames(t);
    if (names.length > 0) {
      // Use first participant's name (usually the prospect)
      const firstName = names[0].split(' ')[0]; // Just first name for brevity
      parts.push(firstName);
    }
    
    // Add date context
    const date = t.created_at || t.analysis_created_at;
    if (date) {
      const callDate = new Date(date);
      const daysAgo = differenceInDays(new Date(), callDate);
      
      if (daysAgo === 0) {
        parts.push("(Today)");
      } else if (daysAgo === 1) {
        parts.push("(Yesterday)");
      } else if (daysAgo <= 7) {
        parts.push(`(${format(callDate, 'EEEE')})`); // "Monday", "Tuesday", etc.
      } else {
        parts.push(`(${format(callDate, 'MMM d')})`); // "Jan 15"
      }
    }
    
    // If we have nothing, use a generic but descriptive fallback
    if (parts.length === 0) {
      return "Unknown Prospect";
    }
    
    return parts.join(" ");
  };

  const getDisplayTitle = (t: TranscriptSummary) => {
    // Priority 1: Extracted company name
    if (t.extracted_company_name) return t.extracted_company_name;
    
    // Priority 2: AI-generated title (if it looks substantive)
    const analysis: any = t.conversation_analysis?.[0];
    const cs = analysis?.call_summary as Record<string, any> | undefined;
    const aiTitle = cs?.title || cs?.meeting_title || cs?.deal_name;
    
    // Check if AI title is substantive (not generic)
    if (aiTitle && !isGenericTitle(aiTitle)) {
      return aiTitle;
    }
    
    // Priority 3: Account name from linked account
    if (t.account_name) return t.account_name;
    
    // Priority 4: Smart fallback - construct from participants + date
    return buildSmartFallbackTitle(t);
  };

  const formatDuration = (minutes: number | null | undefined) => {
    if (!minutes || minutes === 0) return null
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}h ${remainingMinutes}m`
  }

  const getScoreDisplay = (score: number | null | undefined) => {
    if (score === null || score === undefined) return 'N/A'
    return score.toFixed(1)
  }

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
      <Card className={`${theme.border} border-l-4 hover:shadow-lg transition-all duration-200 bg-white`}>
        <CardHeader className={`${theme.bg} py-2`}>
          <CardTitle className={`flex items-center space-x-2 text-base ${theme.title}`}>
            <div className={`p-1.5 ${theme.iconBg} rounded-lg`}>
              <span className="text-base">{theme.icon}</span>
            </div>
            <span>{heatLevel} HEAT DEALS</span>
          </CardTitle>
          <CardDescription className="text-slate-600 text-sm">Loading...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-3 border rounded-lg animate-pulse">
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
    <Card className={`${theme.border} border-l-4 hover:shadow-lg transition-all duration-200 bg-white`}>
      <CardHeader className={`${theme.bg} py-2`}>
        <CardTitle className={`flex items-center space-x-2 text-base ${theme.title}`}>
          <div className={`p-1.5 ${theme.iconBg} rounded-lg`}>
            <span className="text-base">{theme.icon}</span>
          </div>
          <span>{heatLevel} HEAT DEALS</span>
        </CardTitle>
        <CardDescription className="text-slate-600 text-sm">
          {filteredTranscripts.length} active opportunities
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        {filteredTranscripts.length === 0 ? (
          <div className="text-center py-6">
            <div className={`p-4 ${theme.bg} rounded-lg border border-gray-200`}>
              <p className="text-sm text-slate-600">No {heatLevel.toLowerCase()} heat deals yet</p>
            </div>
          </div>
        ) : (
          <div className="relative">
            <div 
              className="max-h-96 overflow-y-auto pr-2 custom-scrollbar"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: '#64748b #e2e8f0'
              }}
            >
              <div className="space-y-3">
                {filteredTranscripts.map((transcript) => (
                  <div
                    key={transcript.id}
                    className="p-3 border rounded-lg hover:bg-slate-50 transition-colors group cursor-pointer"
                    onClick={() => handleViewTranscript(transcript.id)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors text-sm mb-1">
                          {getDisplayTitle(transcript)}
                        </h4>
                        {(() => {
                          const names = getParticipantNames(transcript);
                          if (names.length > 0) {
                            const displayNames = names.slice(0, 3).join(', ');
                            const remaining = names.length - 3;
                            const fullNames = names.join(', ');
                            return (
                              <p 
                                className="text-xs text-slate-600 mb-1 truncate" 
                                title={fullNames}
                                aria-label={`Participants: ${fullNames}`}
                              >
                                {displayNames}{remaining > 0 ? ` +${remaining} more` : ''}
                              </p>
                            );
                          }
                          return null;
                        })()}
                         <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
                           <SourceBadge source={transcript.source || 'manual'} className="text-xs h-4" />
                           <span className="flex items-center">
                             <Users className="h-3 w-3 mr-1" />
                             {getParticipantNames(transcript).length}
                           </span>
                           {formatDuration(transcript.duration_minutes) && (
                             <span className="flex items-center">
                               <Clock className="h-3 w-3 mr-1" />
                               {formatDuration(transcript.duration_minutes)}
                             </span>
                           )}
                         </div>
                         {transcript.analysis_created_at && (
                           <div className="flex items-center text-xs text-slate-500">
                             <span className="flex items-center">
                               📅 Analyzed {formatAnalysisDate(transcript.analysis_created_at)}
                             </span>
                           </div>
                         )}
                        {transcript.account_name && (
                          <div className="mt-1">
                            <span className="text-xs text-blue-600 font-medium">
                              {transcript.account_name}
                            </span>
                          </div>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-accent"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              handleViewTranscript(transcript.id)
                            }}
                          >
                            <ArrowRight className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => handleArchive(e, transcript.id)}
                            disabled={archiveMutation.isPending}
                          >
                            <Archive className="h-4 w-4 mr-2" />
                            Archive Deal
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {transcript.challenger_scores && (
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex items-center space-x-3 text-xs">
                          <div className="text-center">
                            <div className="font-medium text-yellow-600">
                              {getScoreDisplay(transcript.challenger_scores.teaching)}
                            </div>
                            <div className="text-xs text-slate-500">T</div>
                          </div>
                          <div className="text-center">
                            <div className="font-medium text-blue-600">
                              {getScoreDisplay(transcript.challenger_scores.tailoring)}
                            </div>
                            <div className="text-xs text-slate-500">T</div>
                          </div>
                          <div className="text-center">
                            <div className="font-medium text-green-600">
                              {getScoreDisplay(transcript.challenger_scores.control)}
                            </div>
                            <div className="text-xs text-slate-500">C</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            {filteredTranscripts.length > 4 && (
              <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-white to-transparent pointer-events-none" />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
