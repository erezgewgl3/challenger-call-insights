export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
          challenger_scores: Json | null
          created_at: string | null
          email_followup: Json | null
          guidance: Json | null
          id: string
          transcript_id: string | null
        }
        Insert: {
          challenger_scores?: Json | null
          created_at?: string | null
          email_followup?: Json | null
          guidance?: Json | null
          id?: string
          transcript_id?: string | null
        }
        Update: {
          challenger_scores?: Json | null
          created_at?: string | null
          email_followup?: Json | null
          guidance?: Json | null
          id?: string
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
      invites: {
        Row: {
          created_at: string | null
          created_by: string | null
          email: string
          expires_at: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          email: string
          expires_at: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          email?: string
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
      transcripts: {
        Row: {
          account_id: string | null
          created_at: string | null
          duration_minutes: number | null
          id: string
          meeting_date: string
          participants: Json | null
          raw_text: string | null
          status: Database["public"]["Enums"]["processing_status"] | null
          title: string
          user_id: string | null
        }
        Insert: {
          account_id?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          meeting_date: string
          participants?: Json | null
          raw_text?: string | null
          status?: Database["public"]["Enums"]["processing_status"] | null
          title: string
          user_id?: string | null
        }
        Update: {
          account_id?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          meeting_date?: string
          participants?: Json | null
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
      users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          role: Database["public"]["Enums"]["user_role"] | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id: string
          role?: Database["public"]["Enums"]["user_role"] | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"] | null
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
    }
    Enums: {
      processing_status: "uploaded" | "processing" | "completed" | "error"
      user_role: "sales_user" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      processing_status: ["uploaded", "processing", "completed", "error"],
      user_role: ["sales_user", "admin"],
    },
  },
} as const
