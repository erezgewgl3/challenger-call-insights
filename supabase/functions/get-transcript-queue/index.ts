import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface QueueFilters {
  status?: string[]; // ['uploaded', 'processing', 'completed', 'failed']
  priority?: string[]; // ['urgent', 'high', 'normal', 'low']
  source?: string[]; // ['manual', 'zoom', 'zapier', 'zoho']
  assignment_type?: 'owned' | 'assigned' | 'all';
  zoho_deal_id?: string;
  date_range?: {
    start: string;
    end: string;
  };
}

interface QueueItem {
  id: string;
  title: string;
  meeting_date: string;
  duration_minutes: number | null;
  processing_status: string;
  external_source: string | null;
  priority_level: string;
  zoho_deal_id: string | null;
  assignment_metadata: any;
  created_at: string;
  queue_position: number;
  is_assigned: boolean;
  assignment_status: string | null;
  deal_context?: {
    company_name?: string;
    contact_name?: string;
    deal_name?: string;
  };
}

interface QueueResponse {
  success: boolean;
  queues: {
    owned: QueueItem[];
    assigned: QueueItem[];
    combined: QueueItem[];
  };
  summary: {
    total_pending: number;
    urgent_count: number;
    assigned_pending: number;
    owned_pending: number;
  };
  filters_applied: QueueFilters;
}

serve(async (req) => {
  console.log('📋 [QUEUE] Queue management request started');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user from auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing authorization header'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid authorization'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Parse query parameters
    const url = new URL(req.url);
    const filters = parseFilters(url.searchParams);

    console.log('📋 [QUEUE] Filters applied:', filters);

    // Build base query with left join for assignments
    let query = supabase
      .from('transcripts')
      .select(`
        id,
        title,
        meeting_date,
        duration_minutes,
        processing_status,
        external_source,
        priority_level,
        zoho_deal_id,
        assignment_metadata,
        deal_context,
        created_at,
        user_id,
        assigned_user_id,
        queue_assignments(status, assigned_at, accepted_at)
      `);

    // Apply assignment type filter
    if (filters.assignment_type === 'owned') {
      query = query.eq('user_id', user.id);
    } else if (filters.assignment_type === 'assigned') {
      query = query.eq('assigned_user_id', user.id).neq('user_id', user.id);
    } else {
      // Show both owned and assigned
      query = query.or(`user_id.eq.${user.id},assigned_user_id.eq.${user.id}`);
    }

    // Apply additional filters
    if (filters.status && filters.status.length > 0) {
      query = query.in('processing_status', filters.status);
    }

    if (filters.priority && filters.priority.length > 0) {
      query = query.in('priority_level', filters.priority);
    }

    if (filters.source && filters.source.length > 0) {
      query = query.in('external_source', filters.source);
    }

    if (filters.zoho_deal_id) {
      query = query.eq('zoho_deal_id', filters.zoho_deal_id);
    }

    if (filters.date_range) {
      query = query
        .gte('created_at', filters.date_range.start)
        .lte('created_at', filters.date_range.end);
    }

    // Execute query with priority-based ordering
    query = query.order('priority_level', { ascending: false })
                 .order('created_at', { ascending: true });

    const { data: transcripts, error: queryError } = await query;

    if (queryError) {
      console.error('📋 [ERROR] Queue query failed:', queryError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to fetch queue data'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('📋 [QUEUE] Found transcripts:', transcripts?.length || 0);

    // Process and categorize results
    const processedQueue = processQueueItems(transcripts || [], user.id);
    const summary = generateQueueSummary(processedQueue);

    const response: QueueResponse = {
      success: true,
      queues: {
        owned: processedQueue.filter(item => !item.is_assigned),
        assigned: processedQueue.filter(item => item.is_assigned),
        combined: processedQueue
      },
      summary,
      filters_applied: filters
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('📋 [FATAL] Queue management failed:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function parseFilters(searchParams: URLSearchParams): QueueFilters {
  const filters: QueueFilters = {};

  // Parse array parameters
  const status = searchParams.get('status');
  if (status) filters.status = status.split(',');

  const priority = searchParams.get('priority');
  if (priority) filters.priority = priority.split(',');

  const source = searchParams.get('source');
  if (source) filters.source = source.split(',');

  // Parse single parameters
  const assignmentType = searchParams.get('assignment_type');
  if (assignmentType && ['owned', 'assigned', 'all'].includes(assignmentType)) {
    filters.assignment_type = assignmentType as 'owned' | 'assigned' | 'all';
  }

  const zohoDealId = searchParams.get('zoho_deal_id');
  if (zohoDealId) filters.zoho_deal_id = zohoDealId;

  // Parse date range
  const startDate = searchParams.get('start_date');
  const endDate = searchParams.get('end_date');
  if (startDate && endDate) {
    filters.date_range = { start: startDate, end: endDate };
  }

  return filters;
}

function processQueueItems(transcripts: any[], currentUserId: string): QueueItem[] {
  return transcripts.map((transcript, index) => {
    const isAssigned = transcript.assigned_user_id === currentUserId && 
                      transcript.user_id !== currentUserId;
    
    const assignmentStatus = transcript.queue_assignments?.[0]?.status || null;
    
    return {
      id: transcript.id,
      title: transcript.title,
      meeting_date: transcript.meeting_date,
      duration_minutes: transcript.duration_minutes,
      processing_status: transcript.processing_status,
      external_source: transcript.external_source,
      priority_level: transcript.priority_level,
      zoho_deal_id: transcript.zoho_deal_id,
      assignment_metadata: transcript.assignment_metadata || {},
      created_at: transcript.created_at,
      queue_position: index + 1,
      is_assigned: isAssigned,
      assignment_status: assignmentStatus,
      deal_context: transcript.deal_context || {}
    };
  });
}

function generateQueueSummary(queueItems: QueueItem[]) {
  return {
    total_pending: queueItems.filter(item => item.processing_status === 'pending').length,
    urgent_count: queueItems.filter(item => item.priority_level === 'urgent').length,
    assigned_pending: queueItems.filter(item => 
      item.is_assigned && item.processing_status === 'pending'
    ).length,
    owned_pending: queueItems.filter(item => 
      !item.is_assigned && item.processing_status === 'pending'
    ).length
  };
}