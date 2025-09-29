-- ===== Phase 2 & 3: Unified Integration Architecture Migration (Fixed) =====

-- 1. Add zapier integration type to integration_connections
-- First ensure we have all necessary columns
ALTER TABLE integration_connections 
ADD COLUMN IF NOT EXISTS error_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_error text,
ADD COLUMN IF NOT EXISTS webhook_url text;

-- 2. Migrate existing Zapier data to unified schema
DO $$
DECLARE
    zapier_user record;
    new_connection_id uuid;
BEGIN
    -- For each user with Zapier API keys, create a unified connection
    FOR zapier_user IN 
        SELECT DISTINCT user_id 
        FROM zapier_api_keys 
        WHERE is_active = true
    LOOP
        -- Create unified integration connection
        INSERT INTO integration_connections (
            user_id,
            integration_type,
            connection_name,
            connection_status,
            credentials,
            configuration,
            created_at,
            updated_at
        ) VALUES (
            zapier_user.user_id,
            'zapier',
            'Zapier Integration',
            'active',
            -- Aggregate all API keys for this user
            jsonb_build_object(
                'api_keys', (
                    SELECT jsonb_agg(
                        jsonb_build_object(
                            'id', id,
                            'key_name', key_name,
                            'api_key_hash', api_key_hash,
                            'scopes', scopes,
                            'rate_limit_per_hour', rate_limit_per_hour,
                            'usage_count', usage_count,
                            'last_used', last_used,
                            'expires_at', expires_at,
                            'is_active', is_active
                        )
                    )
                    FROM zapier_api_keys 
                    WHERE user_id = zapier_user.user_id
                )
            ),
            -- Aggregate webhooks and settings
            jsonb_build_object(
                'auto_transcript_processing', true,
                'webhook_events', jsonb_build_object(
                    'transcript_completed', true,
                    'analysis_completed', true
                ),
                'analysis_settings', jsonb_build_object(
                    'min_duration_minutes', 5,
                    'auto_analyze', true
                ),
                'webhooks', (
                    SELECT jsonb_agg(
                        jsonb_build_object(
                            'id', zw.id,
                            'webhook_url', zw.webhook_url,
                            'trigger_type', zw.trigger_type,
                            'is_active', zw.is_active,
                            'secret_token', zw.secret_token,
                            'success_count', zw.success_count,
                            'failure_count', zw.failure_count,
                            'last_triggered', zw.last_triggered,
                            'last_error', zw.last_error
                        )
                    )
                    FROM zapier_webhooks zw 
                    WHERE zw.user_id = zapier_user.user_id
                )
            ),
            now(),
            now()
        ) RETURNING id INTO new_connection_id;
        
        RAISE NOTICE 'Created unified connection % for user %', new_connection_id, zapier_user.user_id;
    END LOOP;
END $$;

-- 3. Update webhook logs to reference new connection IDs
DO $$
DECLARE
    webhook_log record;
    connection_id uuid;
BEGIN
    FOR webhook_log IN 
        SELECT zwl.*, zw.user_id
        FROM zapier_webhook_logs zwl
        JOIN zapier_webhooks zw ON zwl.webhook_id = zw.id
    LOOP
        -- Find the corresponding unified connection
        SELECT ic.id INTO connection_id
        FROM integration_connections ic
        WHERE ic.user_id = webhook_log.user_id 
        AND ic.integration_type = 'zapier'
        LIMIT 1;
        
        IF connection_id IS NOT NULL THEN
            -- Create new webhook log entry in unified table
            INSERT INTO integration_webhook_logs (
                connection_id,
                webhook_event,
                payload,
                headers,
                processing_status,
                error_message,
                retry_count,
                created_at,
                processed_at
            ) VALUES (
                connection_id,
                'transcript.submitted',
                webhook_log.trigger_data,
                '{}',
                CASE 
                    WHEN webhook_log.delivery_status = 'delivered' THEN 'completed'
                    WHEN webhook_log.delivery_status = 'failed' THEN 'failed'
                    ELSE 'pending'
                END,
                webhook_log.error_message,
                webhook_log.attempt_count - 1,
                webhook_log.created_at,
                webhook_log.delivered_at
            );
        END IF;
    END LOOP;
END $$;

-- 4. Fix Zapier transcript ownership pattern
UPDATE transcripts 
SET assigned_user_id = NULL
WHERE external_source = 'zapier' 
AND user_id = assigned_user_id;

-- 5. Enhanced queue system - add new queue indexes (without CONCURRENTLY)
CREATE INDEX IF NOT EXISTS idx_transcripts_queue_owned 
    ON transcripts(user_id, processing_status, created_at DESC) 
    WHERE assigned_user_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_transcripts_queue_assigned 
    ON transcripts(assigned_user_id, processing_status, created_at DESC) 
    WHERE assigned_user_id IS NOT NULL AND user_id != assigned_user_id;

CREATE INDEX IF NOT EXISTS idx_transcripts_integration_source
    ON transcripts(external_source, processing_status, created_at DESC);

-- 6. Enhanced queue functions for unified system
CREATE OR REPLACE FUNCTION public.get_unified_transcript_queue(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
    queue_data jsonb;
BEGIN
    -- Enhanced queue with multiple categories
    WITH owned_transcripts AS (
        SELECT t.*, ca.challenger_scores, ca.heat_level
        FROM transcripts t
        LEFT JOIN conversation_analysis ca ON t.id = ca.transcript_id
        WHERE t.user_id = p_user_id 
        AND t.assigned_user_id IS NULL
    ),
    assigned_transcripts AS (
        SELECT t.*, ca.challenger_scores, ca.heat_level
        FROM transcripts t
        LEFT JOIN conversation_analysis ca ON t.id = ca.transcript_id
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
                        'created_at', created_at
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
                        'created_at', created_at
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
                        'created_at', created_at
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
                        'created_at', created_at
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
                        'created_at', created_at
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
                        'created_at', created_at
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
                        'created_at', created_at
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
                FROM transcripts 
                WHERE (user_id = p_user_id OR assigned_user_id = p_user_id) 
                AND processing_status = 'processing'
            ),
            'error_count', (
                SELECT COUNT(*) 
                FROM transcripts 
                WHERE (user_id = p_user_id OR assigned_user_id = p_user_id) 
                AND (processing_status = 'error' OR processing_error IS NOT NULL)
            )
        )
    ) INTO queue_data;
    
    RETURN queue_data;
END;
$$;

-- 7. Enable realtime for enhanced queue updates
ALTER PUBLICATION supabase_realtime ADD TABLE integration_connections;
ALTER PUBLICATION supabase_realtime ADD TABLE integration_webhook_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE integration_sync_operations;