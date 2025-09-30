-- Drop and recreate the get_unified_transcript_queue function with enhanced metadata extraction
DROP FUNCTION IF EXISTS public.get_unified_transcript_queue(uuid);

CREATE OR REPLACE FUNCTION public.get_unified_transcript_queue(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    queue_data jsonb;
BEGIN
    -- Enhanced queue with multiple categories and rich metadata
    WITH owned_transcripts AS (
        SELECT 
            t.*,
            ca.challenger_scores,
            ca.heat_level,
            -- Extract rich metadata for display
            t.zoho_deal_id,
            t.source_metadata->'webhook_payload'->>'zoho_meeting_id' as zoho_meeting_id,
            t.source_metadata->'webhook_payload'->>'transcript_filename' as original_filename
        FROM public.transcripts t
        LEFT JOIN public.conversation_analysis ca ON t.id = ca.transcript_id
        WHERE t.user_id = p_user_id 
        AND (t.assigned_user_id IS NULL OR t.assigned_user_id = p_user_id)
    ),
    assigned_transcripts AS (
        SELECT 
            t.*,
            ca.challenger_scores,
            ca.heat_level,
            -- Extract rich metadata for display
            t.zoho_deal_id,
            t.source_metadata->'webhook_payload'->>'zoho_meeting_id' as zoho_meeting_id,
            t.source_metadata->'webhook_payload'->>'transcript_filename' as original_filename
        FROM public.transcripts t
        LEFT JOIN public.conversation_analysis ca ON t.id = ca.transcript_id
        WHERE t.assigned_user_id = p_user_id 
        AND t.user_id != p_user_id
    )
    SELECT jsonb_build_object(
        'owned', jsonb_build_object(
            'pending', (
                SELECT COALESCE(jsonb_agg(
                    jsonb_build_object(
                        'id', id,
                        'title', title,
                        'meeting_date', meeting_date,
                        'external_source', external_source,
                        'priority_level', priority_level,
                        'processing_status', processing_status,
                        'created_at', created_at,
                        'zoho_deal_id', zoho_deal_id,
                        'zoho_meeting_id', zoho_meeting_id,
                        'original_filename', original_filename
                    ) ORDER BY created_at DESC
                ), '[]'::jsonb)
                FROM owned_transcripts 
                WHERE processing_status IN ('pending', 'uploaded')
            ),
            'processing', (
                SELECT COALESCE(jsonb_agg(
                    jsonb_build_object(
                        'id', id,
                        'title', title,
                        'meeting_date', meeting_date,
                        'external_source', external_source,
                        'processing_status', processing_status,
                        'processing_started_at', processing_started_at,
                        'created_at', created_at,
                        'zoho_deal_id', zoho_deal_id,
                        'zoho_meeting_id', zoho_meeting_id,
                        'original_filename', original_filename
                    ) ORDER BY processing_started_at DESC
                ), '[]'::jsonb)
                FROM owned_transcripts 
                WHERE processing_status = 'processing'
            ),
            'failed', (
                SELECT COALESCE(jsonb_agg(
                    jsonb_build_object(
                        'id', id,
                        'title', title,
                        'meeting_date', meeting_date,
                        'external_source', external_source,
                        'processing_error', processing_error,
                        'error_message', error_message,
                        'created_at', created_at,
                        'zoho_deal_id', zoho_deal_id,
                        'zoho_meeting_id', zoho_meeting_id,
                        'original_filename', original_filename
                    ) ORDER BY created_at DESC
                ), '[]'::jsonb)
                FROM owned_transcripts 
                WHERE processing_status = 'error' OR processing_error IS NOT NULL
            ),
            'completed', (
                SELECT COALESCE(jsonb_agg(
                    jsonb_build_object(
                        'id', id,
                        'title', title,
                        'meeting_date', meeting_date,
                        'external_source', external_source,
                        'heat_level', heat_level,
                        'challenger_scores', challenger_scores,
                        'processed_at', processed_at,
                        'created_at', created_at,
                        'zoho_deal_id', zoho_deal_id,
                        'zoho_meeting_id', zoho_meeting_id,
                        'original_filename', original_filename
                    ) ORDER BY processed_at DESC
                ), '[]'::jsonb)
                FROM owned_transcripts 
                WHERE processing_status = 'completed'
                LIMIT 10
            )
        ),
        'assigned', jsonb_build_object(
            'pending', (
                SELECT COALESCE(jsonb_agg(
                    jsonb_build_object(
                        'id', id,
                        'title', title,
                        'meeting_date', meeting_date,
                        'external_source', external_source,
                        'priority_level', priority_level,
                        'processing_status', processing_status,
                        'created_at', created_at,
                        'zoho_deal_id', zoho_deal_id,
                        'zoho_meeting_id', zoho_meeting_id,
                        'original_filename', original_filename
                    ) ORDER BY created_at DESC
                ), '[]'::jsonb)
                FROM assigned_transcripts 
                WHERE processing_status IN ('pending', 'uploaded')
            ),
            'processing', (
                SELECT COALESCE(jsonb_agg(
                    jsonb_build_object(
                        'id', id,
                        'title', title,
                        'meeting_date', meeting_date,
                        'external_source', external_source,
                        'processing_status', processing_status,
                        'processing_started_at', processing_started_at,
                        'created_at', created_at,
                        'zoho_deal_id', zoho_deal_id,
                        'zoho_meeting_id', zoho_meeting_id,
                        'original_filename', original_filename
                    ) ORDER BY processing_started_at DESC
                ), '[]'::jsonb)
                FROM assigned_transcripts 
                WHERE processing_status = 'processing'
            ),
            'completed', (
                SELECT COALESCE(jsonb_agg(
                    jsonb_build_object(
                        'id', id,
                        'title', title,
                        'meeting_date', meeting_date,
                        'external_source', external_source,
                        'heat_level', heat_level,
                        'challenger_scores', challenger_scores,
                        'processed_at', processed_at,
                        'created_at', created_at,
                        'zoho_deal_id', zoho_deal_id,
                        'zoho_meeting_id', zoho_meeting_id,
                        'original_filename', original_filename
                    ) ORDER BY processed_at DESC
                ), '[]'::jsonb)
                FROM assigned_transcripts 
                WHERE processing_status = 'completed'
                LIMIT 5
            )
        ),
        'stats', jsonb_build_object(
            'total_owned', (SELECT COUNT(*) FROM owned_transcripts),
            'total_assigned', (SELECT COUNT(*) FROM assigned_transcripts),
            'pending_owned', (SELECT COUNT(*) FROM owned_transcripts WHERE processing_status IN ('pending', 'uploaded')),
            'pending_assigned', (SELECT COUNT(*) FROM assigned_transcripts WHERE processing_status IN ('pending', 'uploaded')),
            'processing_count', (
                SELECT COUNT(*) 
                FROM public.transcripts 
                WHERE (user_id = p_user_id OR assigned_user_id = p_user_id) 
                AND processing_status = 'processing'
            ),
            'error_count', (
                SELECT COUNT(*) 
                FROM public.transcripts 
                WHERE (user_id = p_user_id OR assigned_user_id = p_user_id) 
                AND (processing_status = 'error' OR processing_error IS NOT NULL)
            )
        )
    ) INTO queue_data;
    
    RETURN queue_data;
END;
$function$;