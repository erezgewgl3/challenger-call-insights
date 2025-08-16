import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MatchingHealthResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  metrics: {
    accuracyRate: number;
    processingTime: number;
    totalMatches: number;
    pendingMatches: number;
    autoMatchRate: number;
    manualReviewRate: number;
  };
  performance: {
    averageMatchTime: number;
    p95MatchTime: number;
    throughput: number;
    confidence: {
      high: number;
      medium: number;
      low: number;
    };
  };
  issues: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    count: number;
  }>;
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    console.log('Starting contact matching health check...');

    // Get match review statistics for the last 24 hours
    const { data: matchReviews, error: matchError } = await supabase
      .from('zapier_match_reviews')
      .select('status, confidence_score, processing_time_ms, review_result, created_at')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });

    if (matchError) {
      throw new Error(`Failed to fetch match reviews: ${matchError.message}`);
    }

    const totalMatches = matchReviews.length;
    const pendingMatches = matchReviews.filter(m => m.status === 'pending').length;
    const completedMatches = matchReviews.filter(m => m.status === 'completed');
    const autoMatches = completedMatches.filter(m => m.review_result === 'auto_matched');
    const manualReviews = completedMatches.filter(m => m.review_result === 'manual_review');

    // Calculate rates
    const autoMatchRate = totalMatches > 0 ? (autoMatches.length / totalMatches) * 100 : 0;
    const manualReviewRate = totalMatches > 0 ? (manualReviews.length / totalMatches) * 100 : 0;

    // Calculate accuracy (assuming completed matches are accurate)
    const accuracyRate = totalMatches > 0 ? (completedMatches.length / totalMatches) * 100 : 100;

    // Calculate processing time metrics
    const processingTimes = matchReviews
      .filter(m => m.processing_time_ms)
      .map(m => m.processing_time_ms)
      .sort((a, b) => a - b);

    const averageMatchTime = processingTimes.length > 0 
      ? processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length 
      : 0;

    const p95Index = Math.floor(processingTimes.length * 0.95);
    const p95MatchTime = processingTimes[p95Index] || 0;

    // Calculate confidence distribution
    const highConfidence = matchReviews.filter(m => m.confidence_score >= 0.8).length;
    const mediumConfidence = matchReviews.filter(m => m.confidence_score >= 0.5 && m.confidence_score < 0.8).length;
    const lowConfidence = matchReviews.filter(m => m.confidence_score < 0.5).length;

    const confidence = {
      high: totalMatches > 0 ? (highConfidence / totalMatches) * 100 : 0,
      medium: totalMatches > 0 ? (mediumConfidence / totalMatches) * 100 : 0,
      low: totalMatches > 0 ? (lowConfidence / totalMatches) * 100 : 0
    };

    // Calculate throughput (matches per hour)
    const throughput = totalMatches;

    // Identify issues
    const issues = [];

    const pendingRate = totalMatches > 0 ? (pendingMatches / totalMatches) * 100 : 0;
    
    if (pendingRate > 30) {
      issues.push({
        type: 'high_pending_rate',
        severity: pendingRate > 70 ? 'critical' : pendingRate > 50 ? 'high' : 'medium',
        message: `${pendingRate.toFixed(1)}% of matches are pending review`,
        count: pendingMatches
      });
    }

    if (autoMatchRate < 60) {
      issues.push({
        type: 'low_auto_match_rate',
        severity: autoMatchRate < 30 ? 'high' : 'medium',
        message: `Only ${autoMatchRate.toFixed(1)}% of matches are processed automatically`,
        count: autoMatches.length
      });
    }

    if (averageMatchTime > 5000) {
      issues.push({
        type: 'slow_processing',
        severity: averageMatchTime > 10000 ? 'high' : 'medium',
        message: `Average match processing time is ${averageMatchTime.toFixed(0)}ms`,
        count: processingTimes.filter(t => t > 5000).length
      });
    }

    if (confidence.low > 40) {
      issues.push({
        type: 'low_confidence_matches',
        severity: confidence.low > 60 ? 'high' : 'medium',
        message: `${confidence.low.toFixed(1)}% of matches have low confidence scores`,
        count: lowConfidence
      });
    }

    if (totalMatches === 0) {
      issues.push({
        type: 'no_matching_activity',
        severity: 'medium',
        message: 'No contact matching activity in the last 24 hours',
        count: 0
      });
    }

    // Determine overall status
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    const criticalIssues = issues.filter(i => i.severity === 'critical').length;
    const highIssues = issues.filter(i => i.severity === 'high').length;
    
    if (criticalIssues > 0 || pendingRate > 80) {
      status = 'unhealthy';
    } else if (highIssues > 0 || pendingRate > 50 || autoMatchRate < 40) {
      status = 'degraded';
    }

    const result: MatchingHealthResult = {
      status,
      timestamp: new Date().toISOString(),
      metrics: {
        accuracyRate: Math.round(accuracyRate * 100) / 100,
        processingTime: Math.round(averageMatchTime),
        totalMatches,
        pendingMatches,
        autoMatchRate: Math.round(autoMatchRate * 100) / 100,
        manualReviewRate: Math.round(manualReviewRate * 100) / 100
      },
      performance: {
        averageMatchTime: Math.round(averageMatchTime),
        p95MatchTime: Math.round(p95MatchTime),
        throughput,
        confidence: {
          high: Math.round(confidence.high * 100) / 100,
          medium: Math.round(confidence.medium * 100) / 100,
          low: Math.round(confidence.low * 100) / 100
        }
      },
      issues
    };

    console.log('Contact matching health check completed:', {
      status,
      accuracyRate,
      totalMatches,
      pendingMatches,
      responseTime: Date.now() - startTime
    });

    return new Response(JSON.stringify(result), {
      status: status === 'unhealthy' ? 503 : 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error) {
    console.error('Contact matching health check failed:', error);
    
    const errorResult: MatchingHealthResult = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      metrics: {
        accuracyRate: 0,
        processingTime: 0,
        totalMatches: 0,
        pendingMatches: 0,
        autoMatchRate: 0,
        manualReviewRate: 0
      },
      performance: {
        averageMatchTime: 0,
        p95MatchTime: 0,
        throughput: 0,
        confidence: {
          high: 0,
          medium: 0,
          low: 0
        }
      },
      issues: [{
        type: 'system_error',
        severity: 'critical',
        message: `Health check failed: ${error.message}`,
        count: 1
      }]
    };

    return new Response(JSON.stringify(errorResult), {
      status: 503,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
};

serve(handler);