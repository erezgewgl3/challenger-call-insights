export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
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
          created_at: string | null
          duration_minutes: number | null
          error_message: string | null
          id: string
          meeting_date: string
          participants: Json | null
          processed_at: string | null
          raw_text: string | null
          status: Database["public"]["Enums"]["processing_status"] | null
          title: string
          user_id: string | null
        }
        Insert: {
          account_id?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          error_message?: string | null
          id?: string
          meeting_date: string
          participants?: Json | null
          processed_at?: string | null
          raw_text?: string | null
          status?: Database["public"]["Enums"]["processing_status"] | null
          title: string
          user_id?: string | null
        }
        Update: {
          account_id?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          error_message?: string | null
          id?: string
          meeting_date?: string
          participants?: Json | null
          processed_at?: string | null
          raw_text?: string | null
          status?: Database["public"]["Enums"]["processing_status"] | null
          title?: string
          user_id?: string | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      activate_single_prompt: {
        Args: { prompt_id_param: string }
        Returns: undefined
      }
      cleanup_expired_password_reset_tokens: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      fix_orphaned_auth_users: {
        Args: Record<PropertyKey, never>
        Returns: {
          fixed_user_id: string
          fixed_email: string
        }[]
      }
      get_active_prompt: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          version_number: number
          user_id: string
          prompt_text: string
          prompt_name: string
          is_default: boolean
          is_active: boolean
          change_description: string
          activated_at: string
          created_at: string
          updated_at: string
          created_by: string
        }[]
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      hash_token: {
        Args: { token: string }
        Returns: string
      }
      mark_password_reset_token_used: {
        Args: {
          p_token_hash: string
          p_ip_address?: string
          p_user_agent?: string
        }
        Returns: undefined
      }
      mark_users_pending_deletion: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      validate_password_reset_token: {
        Args: {
          p_token: string
          p_email: string
          p_ip_address?: string
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
