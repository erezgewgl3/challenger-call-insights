import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Search, Filter, CheckSquare, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MatchReviewCard } from "./MatchReviewCard";
import { MatchRulesManager } from "./MatchRulesManager";

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

export const MatchReviewDashboard: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [confidenceFilter, setConfidenceFilter] = useState('all');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showRulesManager, setShowRulesManager] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch pending match reviews
  const { data: matchReviews = [], isLoading } = useQuery({
    queryKey: ['match-reviews', searchTerm, confidenceFilter],
    queryFn: async () => {
      let query = supabase
        .from('zapier_match_reviews')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.ilike('participant_data->name', `%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as MatchReview[];
    }
  });

  // Filter by confidence level
  const filteredReviews = matchReviews.filter(review => {
    if (confidenceFilter === 'all') return true;
    
    const highestConfidence = Math.max(
      ...(review.suggested_matches?.map(m => m.confidence) || [0])
    );
    
    switch (confidenceFilter) {
      case 'high': return highestConfidence >= 85;
      case 'medium': return highestConfidence >= 70 && highestConfidence < 85;
      case 'low': return highestConfidence >= 50 && highestConfidence < 70;
      case 'none': return highestConfidence < 50;
      default: return true;
    }
  });

  // Batch processing mutation
  const batchProcessMutation = useMutation({
    mutationFn: async ({ action, reviewIds }: { action: string; reviewIds: string[] }) => {
      for (const reviewId of reviewIds) {
        const { error } = await supabase
          .from('zapier_match_reviews')
          .update({
            status: action,
            reviewed_at: new Date().toISOString()
          })
          .eq('id', reviewId);

        if (error) throw error;
      }
    },
    onSuccess: (_, { action, reviewIds }) => {
      queryClient.invalidateQueries({ queryKey: ['match-reviews'] });
      setSelectedItems([]);
      toast({
        title: "Batch processing completed",
        description: `${reviewIds.length} matches ${action === 'confirmed' ? 'confirmed' : action === 'rejected' ? 'rejected' : 'skipped'}`
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to process batch operation",
        variant: "destructive"
      });
    }
  });

  const handleBatchAction = (action: string) => {
    if (selectedItems.length === 0) {
      toast({
        title: "No items selected",
        description: "Please select items to process",
        variant: "destructive"
      });
      return;
    }

    batchProcessMutation.mutate({ action, reviewIds: selectedItems });
  };

  const handleSelectAll = () => {
    if (selectedItems.length === filteredReviews.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredReviews.map(r => r.id));
    }
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 85) return <Badge variant="default" className="bg-green-100 text-green-800">High</Badge>;
    if (confidence >= 70) return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Medium</Badge>;
    if (confidence >= 50) return <Badge variant="outline" className="bg-orange-100 text-orange-800">Low</Badge>;
    return <Badge variant="destructive" className="bg-red-100 text-red-800">No Match</Badge>;
  };

  const completedCount = matchReviews.filter(r => r.status !== 'pending').length;
  const totalCount = matchReviews.length;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Contact Match Reviews</h1>
          <p className="text-muted-foreground">
            Review and approve contact matches from AI analysis
          </p>
        </div>
        <Button onClick={() => setShowRulesManager(true)} variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Matching Rules
        </Button>
      </div>

      {/* Progress Tracking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Review Progress</span>
            <span className="text-sm text-muted-foreground">
              {completedCount} of {totalCount} completed
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={progressPercentage} className="w-full" />
        </CardContent>
      </Card>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search participants..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={confidenceFilter} onValueChange={setConfidenceFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by confidence" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Confidence Levels</SelectItem>
            <SelectItem value="high">High (85%+)</SelectItem>
            <SelectItem value="medium">Medium (70-84%)</SelectItem>
            <SelectItem value="low">Low (50-69%)</SelectItem>
            <SelectItem value="none">No Match (&lt;50%)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Batch Actions */}
      {filteredReviews.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              className="flex items-center gap-2"
            >
              <CheckSquare className="h-4 w-4" />
              {selectedItems.length === filteredReviews.length ? 'Deselect All' : 'Select All'}
            </Button>
            <span className="text-sm text-muted-foreground">
              {selectedItems.length} selected
            </span>
          </div>
          
          {selectedItems.length > 0 && (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => handleBatchAction('confirmed')}
                disabled={batchProcessMutation.isPending}
              >
                Confirm Selected
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBatchAction('rejected')}
                disabled={batchProcessMutation.isPending}
              >
                Reject Selected
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleBatchAction('skipped')}
                disabled={batchProcessMutation.isPending}
              >
                Skip Selected
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Match Review Cards */}
      <div className="space-y-4">
        {filteredReviews.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center h-32">
              <div className="text-center">
                <p className="text-muted-foreground">No pending match reviews found</p>
                {searchTerm && (
                  <Button
                    variant="link"
                    onClick={() => setSearchTerm('')}
                    className="mt-2"
                  >
                    Clear search
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredReviews.map((review) => (
            <MatchReviewCard
              key={review.id}
              review={review}
              isSelected={selectedItems.includes(review.id)}
              onSelect={(selected) => {
                setSelectedItems(prev => 
                  selected 
                    ? [...prev, review.id]
                    : prev.filter(id => id !== review.id)
                );
              }}
              onReviewComplete={() => {
                queryClient.invalidateQueries({ queryKey: ['match-reviews'] });
              }}
            />
          ))
        )}
      </div>

      {/* Rules Manager Dialog */}
      {showRulesManager && (
        <MatchRulesManager
          open={showRulesManager}
          onOpenChange={setShowRulesManager}
        />
      )}
    </div>
  );
};