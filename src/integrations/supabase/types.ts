export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          created_at: string | null
          deal_stage: string | null
          id: string
          name: string
          notes: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          deal_stage?: string | null
          id?: string
          name: string
          notes?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          deal_stage?: string | null
          id?: string
          name?: string
          notes?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      advanced_webhook_triggers: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          last_triggered: string | null
          trigger_condition: Json
          trigger_count: number | null
          trigger_type: string
          updated_at: string | null
          user_id: string
          webhook_url: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_triggered?: string | null
          trigger_condition: Json
          trigger_count?: number | null
          trigger_type: string
          updated_at?: string | null
          user_id: string
          webhook_url: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_triggered?: string | null
          trigger_condition?: Json
          trigger_count?: number | null
          trigger_type?: string
          updated_at?: string | null
          user_id?: string
          webhook_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "advanced_webhook_triggers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_analysis: {
        Row: {
          action_plan: Json | null
          call_summary: Json | null
          challenger_scores: Json | null
          created_at: string | null
          email_followup: Json | null
          guidance: Json | null
          heat_level: string | null
          id: string
          key_takeaways: Json | null
          participants: Json | null
          reasoning: Json | null
          recommendations: Json | null
          transcript_id: string | null
        }
        Insert: {
          action_plan?: Json | null
          call_summary?: Json | null
          challenger_scores?: Json | null
          created_at?: string | null
          email_followup?: Json | null
          guidance?: Json | null
          heat_level?: string | null
          id?: string
          key_takeaways?: Json | null
          participants?: Json | null
          reasoning?: Json | null
          recommendations?: Json | null
          transcript_id?: string | null
        }
        Update: {
          action_plan?: Json | null
          call_summary?: Json | null
          challenger_scores?: Json | null
          created_at?: string | null
          email_followup?: Json | null
          guidance?: Json | null
          heat_level?: string | null
          id?: string
          key_takeaways?: Json | null
          participants?: Json | null
          reasoning?: Json | null
          recommendations?: Json | null
          transcript_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversation_analysis_transcript_id_fkey"
            columns: ["transcript_id"]
            isOneToOne: false
            referencedRelation: "transcripts"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_integration_logs: {
        Row: {
          analysis_id: string
          completed_at: string | null
          created_at: string | null
          crm_record_id: string | null
          crm_type: string
          error_message: string | null
          id: string
          operation_type: string
          retry_count: number | null
          status: string | null
          user_id: string
        }
        Insert: {
          analysis_id: string
          completed_at?: string | null
          created_at?: string | null
          crm_record_id?: string | null
          crm_type: string
          error_message?: string | null
          id?: string
          operation_type: string
          retry_count?: number | null
          status?: string | null
          user_id: string
        }
        Update: {
          analysis_id?: string
          completed_at?: string | null
          created_at?: string | null
          crm_record_id?: string | null
          crm_type?: string
          error_message?: string | null
          id?: string
          operation_type?: string
          retry_count?: number | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_integration_logs_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "conversation_analysis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_integration_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      data_export_requests: {
        Row: {
          completed_at: string | null
          created_at: string | null
          download_url: string | null
          expires_at: string | null
          format: string
          id: string
          options: Json | null
          requested_by: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          download_url?: string | null
          expires_at?: string | null
          format: string
          id?: string
          options?: Json | null
          requested_by?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          download_url?: string | null
          expires_at?: string | null
          format?: string
          id?: string
          options?: Json | null
          requested_by?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "data_export_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_export_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_heat_history: {
        Row: {
          account_id: string | null
          analysis_id: string | null
          change_reason: string | null
          created_at: string | null
          current_heat_level: string
          heat_score_change: number | null
          id: string
          previous_heat_level: string | null
          triggered_webhooks: string[] | null
          user_id: string
        }
        Insert: {
          account_id?: string | null
          analysis_id?: string | null
          change_reason?: string | null
          created_at?: string | null
          current_heat_level: string
          heat_score_change?: number | null
          id?: string
          previous_heat_level?: string | null
          triggered_webhooks?: string[] | null
          user_id: string
        }
        Update: {
          account_id?: string | null
          analysis_id?: string | null
          change_reason?: string | null
          created_at?: string | null
          current_heat_level?: string
          heat_score_change?: number | null
          id?: string
          previous_heat_level?: string | null
          triggered_webhooks?: string[] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_heat_history_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_heat_history_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "conversation_analysis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_heat_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      deletion_requests: {
        Row: {
          completed_at: string | null
          created_at: string | null
          grace_period_end: string | null
          id: string
          immediate_delete: boolean | null
          reason: string
          recovery_token: string | null
          requested_by: string | null
          scheduled_for: string
          status: string | null
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          grace_period_end?: string | null
          id?: string
          immediate_delete?: boolean | null
          reason: string
          recovery_token?: string | null
          requested_by?: string | null
          scheduled_for: string
          status?: string | null
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          grace_period_end?: string | null
          id?: string
          immediate_delete?: boolean | null
          reason?: string
          recovery_token?: string | null
          requested_by?: string | null
          scheduled_for?: string
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deletion_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deletion_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      external_transcript_queue: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          max_retries: number | null
          processing_completed_at: string | null
          processing_started_at: string | null
          queue_position: number | null
          queue_status: string | null
          retry_count: number | null
          transcript_id: string
          updated_at: string | null
          webhook_payload: Json | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          max_retries?: number | null
          processing_completed_at?: string | null
          processing_started_at?: string | null
          queue_position?: number | null
          queue_status?: string | null
          retry_count?: number | null
          transcript_id: string
          updated_at?: string | null
          webhook_payload?: Json | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          max_retries?: number | null
          processing_completed_at?: string | null
          processing_started_at?: string | null
          queue_position?: number | null
          queue_status?: string | null
          retry_count?: number | null
          transcript_id?: string
          updated_at?: string | null
          webhook_payload?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "external_transcript_queue_transcript_id_fkey"
            columns: ["transcript_id"]
            isOneToOne: false
            referencedRelation: "transcripts"
            referencedColumns: ["id"]
          },
        ]
      }
      gdpr_audit_log: {
        Row: {
          admin_id: string | null
          created_at: string | null
          details: Json | null
          event_type: string
          id: string
          legal_basis: string | null
          status: string | null
          timestamp: string | null
          user_id: string | null
        }
        Insert: {
          admin_id?: string | null
          created_at?: string | null
          details?: Json | null
          event_type: string
          id?: string
          legal_basis?: string | null
          status?: string | null
          timestamp?: string | null
          user_id?: string | null
        }
        Update: {
          admin_id?: string | null
          created_at?: string | null
          details?: Json | null
          event_type?: string
          id?: string
          legal_basis?: string | null
          status?: string | null
          timestamp?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gdpr_audit_log_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gdpr_audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_configs: {
        Row: {
          config_key: string
          config_value: Json
          created_at: string
          id: string
          integration_type: string
          is_encrypted: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          config_key: string
          config_value?: Json
          created_at?: string
          id?: string
          integration_type: string
          is_encrypted?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          config_key?: string
          config_value?: Json
          created_at?: string
          id?: string
          integration_type?: string
          is_encrypted?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      integration_connections: {
        Row: {
          configuration: Json
          connection_name: string
          connection_status: string
          created_at: string
          credentials: Json
          id: string
          integration_type: string
          last_sync_at: string | null
          sync_frequency_minutes: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          configuration?: Json
          connection_name: string
          connection_status?: string
          created_at?: string
          credentials?: Json
          id?: string
          integration_type: string
          last_sync_at?: string | null
          sync_frequency_minutes?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          configuration?: Json
          connection_name?: string
          connection_status?: string
          created_at?: string
          credentials?: Json
          id?: string
          integration_type?: string
          last_sync_at?: string | null
          sync_frequency_minutes?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      integration_sync_operations: {
        Row: {
          completed_at: string | null
          connection_id: string
          created_at: string
          error_details: Json | null
          id: string
          operation_data: Json
          operation_status: string
          operation_type: string
          progress_percentage: number | null
          records_processed: number | null
          records_total: number | null
          started_at: string | null
        }
        Insert: {
          completed_at?: string | null
          connection_id: string
          created_at?: string
          error_details?: Json | null
          id?: string
          operation_data?: Json
          operation_status?: string
          operation_type: string
          progress_percentage?: number | null
          records_processed?: number | null
          records_total?: number | null
          started_at?: string | null
        }
        Update: {
          completed_at?: string | null
          connection_id?: string
          created_at?: string
          error_details?: Json | null
          id?: string
          operation_data?: Json
          operation_status?: string
          operation_type?: string
          progress_percentage?: number | null
          records_processed?: number | null
          records_total?: number | null
          started_at?: string | null
        }
        Relationships: []
      }
      integration_webhook_logs: {
        Row: {
          connection_id: string
          created_at: string
          error_message: string | null
          headers: Json
          id: string
          payload: Json
          processed_at: string | null
          processing_status: string
          retry_count: number
          webhook_event: string
        }
        Insert: {
          connection_id: string
          created_at?: string
          error_message?: string | null
          headers?: Json
          id?: string
          payload?: Json
          processed_at?: string | null
          processing_status?: string
          retry_count?: number
          webhook_event: string
        }
        Update: {
          connection_id?: string
          created_at?: string
          error_message?: string | null
          headers?: Json
          id?: string
          payload?: Json
          processed_at?: string | null
          processing_status?: string
          retry_count?: number
          webhook_event?: string
        }
        Relationships: []
      }
      invites: {
        Row: {
          created_at: string | null
          created_by: string | null
          email: string
          email_error: string | null
          email_sent: boolean | null
          email_sent_at: string | null
          expires_at: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          email: string
          email_error?: string | null
          email_sent?: boolean | null
          email_sent_at?: string | null
          expires_at: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          email?: string
          email_error?: string | null
          email_sent?: boolean | null
          email_sent_at?: string | null
          expires_at?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invites_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      password_reset_tokens: {
        Row: {
          attempts: number | null
          created_at: string | null
          email: string
          expires_at: string
          id: string
          ip_address: string | null
          token_hash: string
          used_at: string | null
          user_agent: string | null
        }
        Insert: {
          attempts?: number | null
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          ip_address?: string | null
          token_hash: string
          used_at?: string | null
          user_agent?: string | null
        }
        Update: {
          attempts?: number | null
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          ip_address?: string | null
          token_hash?: string
          used_at?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      prompts: {
        Row: {
          activated_at: string | null
          change_description: string | null
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean
          is_default: boolean
          prompt_name: string | null
          prompt_text: string
          updated_at: string | null
          user_id: string | null
          version_number: number
        }
        Insert: {
          activated_at?: string | null
          change_description?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          prompt_name?: string | null
          prompt_text: string
          updated_at?: string | null
          user_id?: string | null
          version_number?: number
        }
        Update: {
          activated_at?: string | null
          change_description?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          prompt_name?: string | null
          prompt_text?: string
          updated_at?: string | null
          user_id?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "prompts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prompts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      queue_assignments: {
        Row: {
          accepted_at: string | null
          assigned_at: string | null
          assigned_by: string | null
          assigned_to: string
          created_at: string | null
          id: string
          notes: string | null
          rejected_at: string | null
          status: string | null
          transcript_id: string
          updated_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          assigned_at?: string | null
          assigned_by?: string | null
          assigned_to: string
          created_at?: string | null
          id?: string
          notes?: string | null
          rejected_at?: string | null
          status?: string | null
          transcript_id: string
          updated_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          assigned_at?: string | null
          assigned_by?: string | null
          assigned_to?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          rejected_at?: string | null
          status?: string | null
          transcript_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "queue_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "queue_assignments_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "queue_assignments_transcript_id_fkey"
            columns: ["transcript_id"]
            isOneToOne: false
            referencedRelation: "transcripts"
            referencedColumns: ["id"]
          },
        ]
      }
      registration_failures: {
        Row: {
          alert_sent: boolean | null
          alert_sent_at: string | null
          attempted_at: string | null
          error_message: string
          id: string
          resolution_method: string | null
          resolved: boolean | null
          resolved_at: string | null
          user_email: string
          user_id: string
        }
        Insert: {
          alert_sent?: boolean | null
          alert_sent_at?: string | null
          attempted_at?: string | null
          error_message: string
          id?: string
          resolution_method?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          user_email: string
          user_id: string
        }
        Update: {
          alert_sent?: boolean | null
          alert_sent_at?: string | null
          attempted_at?: string | null
          error_message?: string
          id?: string
          resolution_method?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          user_email?: string
          user_id?: string
        }
        Relationships: []
      }
      sync_audit_trail: {
        Row: {
          action_type: string
          after_data: Json | null
          before_data: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json | null
          performed_at: string | null
          performed_by: string | null
          sync_operation_id: string | null
          user_id: string
        }
        Insert: {
          action_type: string
          after_data?: Json | null
          before_data?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json | null
          performed_at?: string | null
          performed_by?: string | null
          sync_operation_id?: string | null
          user_id: string
        }
        Update: {
          action_type?: string
          after_data?: Json | null
          before_data?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json | null
          performed_at?: string | null
          performed_by?: string | null
          sync_operation_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sync_audit_trail_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sync_audit_trail_sync_operation_id_fkey"
            columns: ["sync_operation_id"]
            isOneToOne: false
            referencedRelation: "sync_operations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sync_audit_trail_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_conflicts: {
        Row: {
          conflict_type: string
          created_at: string | null
          field_conflicts: Json
          id: string
          local_data: Json
          remote_data: Json
          resolution_data: Json | null
          resolution_status: string
          resolved_at: string | null
          resolved_by: string | null
          sync_operation_id: string
          user_id: string
        }
        Insert: {
          conflict_type: string
          created_at?: string | null
          field_conflicts: Json
          id?: string
          local_data: Json
          remote_data: Json
          resolution_data?: Json | null
          resolution_status?: string
          resolved_at?: string | null
          resolved_by?: string | null
          sync_operation_id: string
          user_id: string
        }
        Update: {
          conflict_type?: string
          created_at?: string | null
          field_conflicts?: Json
          id?: string
          local_data?: Json
          remote_data?: Json
          resolution_data?: Json | null
          resolution_status?: string
          resolved_at?: string | null
          resolved_by?: string | null
          sync_operation_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sync_conflicts_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sync_conflicts_sync_operation_id_fkey"
            columns: ["sync_operation_id"]
            isOneToOne: false
            referencedRelation: "sync_operations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sync_conflicts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_operations: {
        Row: {
          completed_at: string | null
          conflict_data: Json | null
          created_at: string | null
          error_message: string | null
          id: string
          operation_status: string
          operation_type: string
          resolution_strategy: string | null
          resolved_at: string | null
          resolved_by: string | null
          retry_count: number | null
          source_record_id: string | null
          source_system: string
          sync_data: Json
          sync_type: string
          target_record_id: string | null
          target_system: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          conflict_data?: Json | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          operation_status?: string
          operation_type: string
          resolution_strategy?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          retry_count?: number | null
          source_record_id?: string | null
          source_system: string
          sync_data?: Json
          sync_type: string
          target_record_id?: string | null
          target_system: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          conflict_data?: Json | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          operation_status?: string
          operation_type?: string
          resolution_strategy?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          retry_count?: number | null
          source_record_id?: string | null
          source_system?: string
          sync_data?: Json
          sync_type?: string
          target_record_id?: string | null
          target_system?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sync_operations_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sync_operations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      system_integration_configs: {
        Row: {
          config_key: string
          config_value: Json
          created_at: string
          created_by: string | null
          id: string
          integration_type: string
          is_encrypted: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          config_key: string
          config_value?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          integration_type: string
          is_encrypted?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          config_key?: string
          config_value?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          integration_type?: string
          is_encrypted?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_integration_configs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_integration_configs_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          created_at: string | null
          id: string
          setting_key: string
          setting_value: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          setting_key: string
          setting_value: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          setting_key?: string
          setting_value?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      transcript_progress: {
        Row: {
          message: string | null
          phase: string
          progress: number
          transcript_id: string
          updated_at: string
        }
        Insert: {
          message?: string | null
          phase?: string
          progress?: number
          transcript_id: string
          updated_at?: string
        }
        Update: {
          message?: string | null
          phase?: string
          progress?: number
          transcript_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transcript_progress_transcript_id_fkey"
            columns: ["transcript_id"]
            isOneToOne: true
            referencedRelation: "transcripts"
            referencedColumns: ["id"]
          },
        ]
      }
      transcripts: {
        Row: {
          account_id: string | null
          assigned_user_id: string | null
          assignment_metadata: Json | null
          created_at: string | null
          deal_context: Json | null
          duration_minutes: number | null
          error_message: string | null
          external_source: string | null
          id: string
          meeting_date: string
          participants: Json | null
          priority_level: string | null
          processed_at: string | null
          processing_error: string | null
          processing_started_at: string | null
          processing_status: string | null
          raw_text: string | null
          source_meeting_id: string | null
          source_metadata: Json | null
          status: Database["public"]["Enums"]["processing_status"] | null
          title: string
          user_id: string | null
          zoho_deal_id: string | null
        }
        Insert: {
          account_id?: string | null
          assigned_user_id?: string | null
          assignment_metadata?: Json | null
          created_at?: string | null
          deal_context?: Json | null
          duration_minutes?: number | null
          error_message?: string | null
          external_source?: string | null
          id?: string
          meeting_date: string
          participants?: Json | null
          priority_level?: string | null
          processed_at?: string | null
          processing_error?: string | null
          processing_started_at?: string | null
          processing_status?: string | null
          raw_text?: string | null
          source_meeting_id?: string | null
          source_metadata?: Json | null
          status?: Database["public"]["Enums"]["processing_status"] | null
          title: string
          user_id?: string | null
          zoho_deal_id?: string | null
        }
        Update: {
          account_id?: string | null
          assigned_user_id?: string | null
          assignment_metadata?: Json | null
          created_at?: string | null
          deal_context?: Json | null
          duration_minutes?: number | null
          error_message?: string | null
          external_source?: string | null
          id?: string
          meeting_date?: string
          participants?: Json | null
          priority_level?: string | null
          processed_at?: string | null
          processing_error?: string | null
          processing_started_at?: string | null
          processing_status?: string | null
          raw_text?: string | null
          source_meeting_id?: string | null
          source_metadata?: Json | null
          status?: Database["public"]["Enums"]["processing_status"] | null
          title?: string
          user_id?: string | null
          zoho_deal_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transcripts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transcripts_assigned_user_id_fkey"
            columns: ["assigned_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transcripts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_consent: {
        Row: {
          consent_date: string | null
          consent_version: string | null
          granular_consents: Json | null
          id: string
          last_updated: string | null
          legal_basis: string | null
          renewal_required: boolean | null
          user_id: string | null
          withdrawal_date: string | null
        }
        Insert: {
          consent_date?: string | null
          consent_version?: string | null
          granular_consents?: Json | null
          id?: string
          last_updated?: string | null
          legal_basis?: string | null
          renewal_required?: boolean | null
          user_id?: string | null
          withdrawal_date?: string | null
        }
        Update: {
          consent_date?: string | null
          consent_version?: string | null
          granular_consents?: Json | null
          id?: string
          last_updated?: string | null
          legal_basis?: string | null
          renewal_required?: boolean | null
          user_id?: string | null
          withdrawal_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_consent_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sync_preferences: {
        Row: {
          auto_resolve_conflicts: boolean | null
          created_at: string | null
          crm_type: string
          enabled: boolean | null
          id: string
          preferred_resolution_strategy: string | null
          sync_direction: string
          sync_frequency_minutes: number | null
          sync_settings: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auto_resolve_conflicts?: boolean | null
          created_at?: string | null
          crm_type: string
          enabled?: boolean | null
          id?: string
          preferred_resolution_strategy?: string | null
          sync_direction?: string
          sync_frequency_minutes?: number | null
          sync_settings?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auto_resolve_conflicts?: boolean | null
          created_at?: string | null
          crm_type?: string
          enabled?: boolean | null
          id?: string
          preferred_resolution_strategy?: string | null
          sync_direction?: string
          sync_frequency_minutes?: number | null
          sync_settings?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_sync_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          last_login: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          status: Database["public"]["Enums"]["user_status"] | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id: string
          last_login?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          status?: Database["public"]["Enums"]["user_status"] | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          last_login?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          status?: Database["public"]["Enums"]["user_status"] | null
        }
        Relationships: []
      }
      webhook_delivery_log: {
        Row: {
          created_at: string | null
          delivered_at: string | null
          error_message: string | null
          id: string
          payload_size: number | null
          response_status: number | null
          success: boolean
          transcript_id: string | null
          webhook_url: string
        }
        Insert: {
          created_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          payload_size?: number | null
          response_status?: number | null
          success: boolean
          transcript_id?: string | null
          webhook_url: string
        }
        Update: {
          created_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          payload_size?: number | null
          response_status?: number | null
          success?: boolean
          transcript_id?: string | null
          webhook_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_delivery_log_transcript_id_fkey"
            columns: ["transcript_id"]
            isOneToOne: false
            referencedRelation: "transcripts"
            referencedColumns: ["id"]
          },
        ]
      }
      zapier_api_keys: {
        Row: {
          api_key_hash: string
          created_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          key_name: string
          last_used: string | null
          rate_limit_per_hour: number | null
          scopes: string[] | null
          usage_count: number | null
          user_id: string
        }
        Insert: {
          api_key_hash: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key_name: string
          last_used?: string | null
          rate_limit_per_hour?: number | null
          scopes?: string[] | null
          usage_count?: number | null
          user_id: string
        }
        Update: {
          api_key_hash?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key_name?: string
          last_used?: string | null
          rate_limit_per_hour?: number | null
          scopes?: string[] | null
          usage_count?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "zapier_api_keys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      zapier_circuit_breakers: {
        Row: {
          circuit_state: string
          created_at: string | null
          failure_count: number
          id: string
          last_failure_at: string | null
          updated_at: string | null
          webhook_id: string
        }
        Insert: {
          circuit_state?: string
          created_at?: string | null
          failure_count?: number
          id?: string
          last_failure_at?: string | null
          updated_at?: string | null
          webhook_id: string
        }
        Update: {
          circuit_state?: string
          created_at?: string | null
          failure_count?: number
          id?: string
          last_failure_at?: string | null
          updated_at?: string | null
          webhook_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "zapier_circuit_breakers_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: true
            referencedRelation: "zapier_webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
      zapier_match_reviews: {
        Row: {
          analysis_id: string
          confirmed_contact_id: string | null
          created_at: string | null
          id: string
          participant_data: Json
          reviewed_at: string | null
          status: string | null
          suggested_matches: Json | null
          user_id: string
        }
        Insert: {
          analysis_id: string
          confirmed_contact_id?: string | null
          created_at?: string | null
          id?: string
          participant_data: Json
          reviewed_at?: string | null
          status?: string | null
          suggested_matches?: Json | null
          user_id: string
        }
        Update: {
          analysis_id?: string
          confirmed_contact_id?: string | null
          created_at?: string | null
          id?: string
          participant_data?: Json
          reviewed_at?: string | null
          status?: string | null
          suggested_matches?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "zapier_match_reviews_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "conversation_analysis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zapier_match_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      zapier_webhook_logs: {
        Row: {
          attempt_count: number | null
          created_at: string | null
          delivered_at: string | null
          delivery_status: string | null
          error_message: string | null
          http_status_code: number | null
          id: string
          response_body: string | null
          trigger_data: Json
          webhook_id: string
        }
        Insert: {
          attempt_count?: number | null
          created_at?: string | null
          delivered_at?: string | null
          delivery_status?: string | null
          error_message?: string | null
          http_status_code?: number | null
          id?: string
          response_body?: string | null
          trigger_data: Json
          webhook_id: string
        }
        Update: {
          attempt_count?: number | null
          created_at?: string | null
          delivered_at?: string | null
          delivery_status?: string | null
          error_message?: string | null
          http_status_code?: number | null
          id?: string
          response_body?: string | null
          trigger_data?: Json
          webhook_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "zapier_webhook_logs_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "zapier_webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
      zapier_webhooks: {
        Row: {
          api_key_id: string
          created_at: string | null
          failure_count: number | null
          id: string
          is_active: boolean | null
          last_error: string | null
          last_triggered: string | null
          secret_token: string | null
          success_count: number | null
          trigger_type: string
          user_id: string
          webhook_url: string
        }
        Insert: {
          api_key_id: string
          created_at?: string | null
          failure_count?: number | null
          id?: string
          is_active?: boolean | null
          last_error?: string | null
          last_triggered?: string | null
          secret_token?: string | null
          success_count?: number | null
          trigger_type: string
          user_id: string
          webhook_url: string
        }
        Update: {
          api_key_id?: string
          created_at?: string | null
          failure_count?: number | null
          id?: string
          is_active?: boolean | null
          last_error?: string | null
          last_triggered?: string | null
          secret_token?: string | null
          success_count?: number | null
          trigger_type?: string
          user_id?: string
          webhook_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "zapier_webhooks_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "zapier_api_keys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zapier_webhooks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      activate_single_prompt: {
        Args: { prompt_id_param: string }
        Returns: undefined
      }
      assign_transcript_to_user: {
        Args: {
          assignment_notes?: string
          transcript_uuid: string
          user_email: string
        }
        Returns: Json
      }
      check_prompt_access_rate_limit: {
        Args: { p_user_id?: string }
        Returns: boolean
      }
      cleanup_expired_password_reset_tokens: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      cleanup_old_audit_logs: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      cleanup_old_webhook_logs: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      enhanced_file_validation: {
        Args:
          | {
              p_content_type: string
              p_file_content?: string
              p_file_name: string
              p_file_size: number
              p_ip_address?: string
              p_user_id: string
            }
          | {
              p_content_type: string
              p_file_name: string
              p_file_size: number
              p_ip_address?: string
              p_user_id: string
            }
        Returns: Json
      }
      execute_role_change: {
        Args: {
          p_admin_user_id: string
          p_new_role: string
          p_target_user_id: string
        }
        Returns: Json
      }
      fix_orphaned_auth_users: {
        Args: Record<PropertyKey, never>
        Returns: {
          fixed_email: string
          fixed_user_id: string
        }[]
      }
      get_active_prompt: {
        Args: Record<PropertyKey, never>
        Returns: {
          activated_at: string
          change_description: string
          created_at: string
          created_by: string
          id: string
          is_active: boolean
          is_default: boolean
          prompt_name: string
          prompt_text: string
          updated_at: string
          user_id: string
          version_number: number
        }[]
      }
      get_admin_user_statistics: {
        Args: Record<PropertyKey, never>
        Returns: {
          account_count: number
          assigned_transcript_count: number
          created_at: string
          deletion_scheduled_for: string
          email: string
          id: string
          last_login: string
          owned_transcript_count: number
          pending_deletion: boolean
          role: Database["public"]["Enums"]["user_role"]
          status: Database["public"]["Enums"]["user_status"]
        }[]
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_queue_summary: {
        Args: { user_uuid: string }
        Returns: Json
      }
      hash_token: {
        Args: { token: string }
        Returns: string
      }
      integration_framework_complete_sync: {
        Args: { result_data: Json; sync_id: string; sync_status?: string }
        Returns: Json
      }
      integration_framework_create_connection: {
        Args: {
          configuration?: Json
          connection_name: string
          credentials: Json
          integration_type: string
          user_uuid: string
        }
        Returns: Json
      }
      integration_framework_delete_connection: {
        Args: { connection_id: string }
        Returns: Json
      }
      integration_framework_get_config: {
        Args: {
          config_key: string
          integration_type: string
          user_uuid: string
        }
        Returns: Json
      }
      integration_framework_get_connection: {
        Args: { integration_type_param: string; user_uuid: string }
        Returns: Json
      }
      integration_framework_get_connection_health: {
        Args: { connection_id: string }
        Returns: Json
      }
      integration_framework_get_connection_status: {
        Args: { integration_type: string; user_uuid: string }
        Returns: Json
      }
      integration_framework_get_sync_status: {
        Args: { sync_id: string }
        Returns: Json
      }
      integration_framework_get_system_stats: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      integration_framework_get_user_stats: {
        Args: { user_uuid: string }
        Returns: Json
      }
      integration_framework_get_webhook_logs: {
        Args: { connection_id: string; limit_count?: number }
        Returns: Json
      }
      integration_framework_log_webhook: {
        Args: {
          connection_id: string
          headers?: Json
          payload: Json
          webhook_event: string
        }
        Returns: Json
      }
      integration_framework_start_sync: {
        Args: {
          connection_id: string
          operation_data?: Json
          operation_type: string
        }
        Returns: Json
      }
      integration_framework_update_config: {
        Args: {
          config_key_param: string
          config_value: Json
          integration_type_param: string
          user_uuid: string
        }
        Returns: Json
      }
      integration_framework_update_connection: {
        Args: { connection_id: string; updates: Json }
        Returns: Json
      }
      integration_framework_update_connection_status: {
        Args: { connection_id: string; new_status: string }
        Returns: Json
      }
      log_role_change_attempt: {
        Args: {
          p_admin_id: string
          p_attempted_role: string
          p_reason?: string
          p_success: boolean
          p_target_id: string
        }
        Returns: undefined
      }
      log_security_event: {
        Args: {
          p_details?: Json
          p_event_type: string
          p_ip_address?: string
          p_user_agent?: string
          p_user_id: string
        }
        Returns: undefined
      }
      lookup_user_by_email: {
        Args: { email_address: string }
        Returns: string
      }
      mark_password_reset_token_used: {
        Args: {
          p_ip_address?: string
          p_token_hash: string
          p_user_agent?: string
        }
        Returns: undefined
      }
      mark_users_pending_deletion: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      scan_file_content_security: {
        Args: { p_content: string; p_file_name: string }
        Returns: Json
      }
      update_user_last_login: {
        Args: { p_user_id?: string }
        Returns: Json
      }
      validate_file_signature: {
        Args: { p_declared_type: string; p_file_content: string }
        Returns: Json
      }
      validate_file_upload: {
        Args: {
          p_content_type: string
          p_file_name: string
          p_file_size: number
          p_user_id: string
        }
        Returns: Json
      }
      validate_password_reset_token: {
        Args: {
          p_email: string
          p_ip_address?: string
          p_token: string
          p_user_agent?: string
        }
        Returns: Json
      }
    }
    Enums: {
      processing_status: "uploaded" | "processing" | "completed" | "error"
      user_role: "sales_user" | "admin"
      user_status: "active" | "pending_deletion" | "deleted"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      processing_status: ["uploaded", "processing", "completed", "error"],
      user_role: ["sales_user", "admin"],
      user_status: ["active", "pending_deletion", "deleted"],
    },
  },
} as const
