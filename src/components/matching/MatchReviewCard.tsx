import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Check, X, Search, SkipForward, User, Building, Mail, Phone, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MatchConfidenceIndicator } from "./MatchConfidenceIndicator";
import { ManualContactSearch } from "./ManualContactSearch";

interface MatchReview {
  id: string;
  user_id: string;
  analysis_id: string;
  participant_data: any;
  suggested_matches: any[];
  status: 'pending' | 'confirmed' | 'rejected' | 'skipped';
  created_at: string;
  reviewed_at?: string;
  confirmed_contact_id?: string;
}

interface MatchReviewCardProps {
  review: MatchReview;
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
  onReviewComplete: () => void;
}

export const MatchReviewCard: React.FC<MatchReviewCardProps> = ({
  review,
  isSelected,
  onSelect,
  onReviewComplete
}) => {
  const [showManualSearch, setShowManualSearch] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateReviewMutation = useMutation({
    mutationFn: async ({ status, contactId }: { status: string; contactId?: string }) => {
      const updateData: any = {
        status,
        reviewed_at: new Date().toISOString()
      };
      
      if (contactId) {
        updateData.confirmed_contact_id = contactId;
      }

      const { error } = await supabase
        .from('zapier_match_reviews')
        .update(updateData)
        .eq('id', review.id);

      if (error) throw error;

      // If confirmed, trigger Zapier webhook
      if (status === 'confirmed') {
        // Call Zapier trigger endpoint here
        await fetch('/api/zapier/trigger-match-confirmed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reviewId: review.id,
            analysisId: review.analysis_id,
            contactId: contactId || review.suggested_matches[0]?.contact_id
          })
        });
      }
    },
    onSuccess: (_, { status }) => {
      onReviewComplete();
      toast({
        title: "Match review updated",
        description: `Match ${status === 'confirmed' ? 'confirmed' : status === 'rejected' ? 'rejected' : 'skipped'}`
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update match review",
        variant: "destructive"
      });
    }
  });

  const handleAction = (action: string, contactId?: string) => {
    updateReviewMutation.mutate({ status: action, contactId });
  };

  const handleManualMatch = (contactId: string) => {
    handleAction('confirmed', contactId);
    setShowManualSearch(false);
  };

  const participant = review.participant_data;
  const bestMatch = review.suggested_matches?.[0];
  const hasMatches = review.suggested_matches?.length > 0;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <Card className={`transition-all duration-200 ${isSelected ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={isSelected}
                onCheckedChange={onSelect}
              />
              <CardTitle className="text-lg">Contact Match Review</CardTitle>
              {hasMatches && (
                <MatchConfidenceIndicator confidence={bestMatch.confidence} />
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              {formatDate(review.created_at)}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Participant Info */}
            <div className="space-y-4">
              <h3 className="font-semibold text-base flex items-center gap-2">
                <User className="h-4 w-4" />
                Call Participant
              </h3>
              
              <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                <Avatar className="h-12 w-12">
                  <AvatarFallback>
                    {getInitials(participant.name || 'Unknown')}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 space-y-2">
                  <div className="font-medium">{participant.name || 'Unknown Name'}</div>
                  
                  {participant.email && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      {participant.email}
                    </div>
                  )}
                  
                  {participant.company && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Building className="h-3 w-3" />
                      {participant.company}
                    </div>
                  )}
                  
                  {participant.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      {participant.phone}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Suggested Matches */}
            <div className="space-y-4">
              <h3 className="font-semibold text-base flex items-center gap-2">
                <Search className="h-4 w-4" />
                Suggested Matches
              </h3>
              
              {hasMatches ? (
                <div className="space-y-3">
                  {review.suggested_matches.slice(0, 3).map((match, index) => (
                    <div key={index} className="p-4 border rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{match.name || match.contact_id}</div>
                        <MatchConfidenceIndicator confidence={match.confidence} size="sm" />
                      </div>
                      
                      {match.company && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Building className="h-3 w-3" />
                          {match.company}
                        </div>
                      )}
                      
                      {match.email && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {match.email}
                        </div>
                      )}
                      
                      <div className="text-xs text-muted-foreground italic">
                        {match.reasoning}
                      </div>
                      
                      <Badge variant="outline" className="text-xs">
                        {match.match_method?.replace('_', ' ') || 'Unknown method'}
                      </Badge>
                    </div>
                  ))}
                  
                  {review.suggested_matches.length > 3 && (
                    <div className="text-sm text-muted-foreground text-center">
                      +{review.suggested_matches.length - 3} more matches
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 border border-dashed rounded-lg text-center text-muted-foreground">
                  <X className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No matching contacts found</p>
                  <p className="text-sm">Consider manual search</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {hasMatches && (
                <Button
                  onClick={() => handleAction('confirmed', bestMatch.contact_id)}
                  disabled={updateReviewMutation.isPending}
                  className="flex items-center gap-2"
                >
                  <Check className="h-4 w-4" />
                  Confirm Best Match
                </Button>
              )}
              
              <Button
                variant="outline"
                onClick={() => setShowManualSearch(true)}
                disabled={updateReviewMutation.isPending}
                className="flex items-center gap-2"
              >
                <Search className="h-4 w-4" />
                Search Manually
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => handleAction('rejected')}
                disabled={updateReviewMutation.isPending}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Reject
              </Button>
              
              <Button
                variant="ghost"
                onClick={() => handleAction('skipped')}
                disabled={updateReviewMutation.isPending}
                className="flex items-center gap-2"
              >
                <SkipForward className="h-4 w-4" />
                Skip
              </Button>
            </div>
          </div>

          {updateReviewMutation.isPending && (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manual Search Dialog */}
      <ManualContactSearch
        open={showManualSearch}
        onOpenChange={setShowManualSearch}
        participantData={participant}
        onContactSelected={handleManualMatch}
      />
    </>
  );
};