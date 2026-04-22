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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      analysis_jobs: {
        Row: {
          analysis_source: string | null
          created_at: string
          documents: Json | null
          error: string | null
          id: string
          judit_request_id: string | null
          lawsuit_cnj: string
          phase_label: string | null
          policies_found: number | null
          search_id: string
          sentences_found: number | null
          status: string
          updated_at: string
        }
        Insert: {
          analysis_source?: string | null
          created_at?: string
          documents?: Json | null
          error?: string | null
          id?: string
          judit_request_id?: string | null
          lawsuit_cnj: string
          phase_label?: string | null
          policies_found?: number | null
          search_id: string
          sentences_found?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          analysis_source?: string | null
          created_at?: string
          documents?: Json | null
          error?: string | null
          id?: string
          judit_request_id?: string | null
          lawsuit_cnj?: string
          phase_label?: string | null
          policies_found?: number | null
          search_id?: string
          sentences_found?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "analysis_jobs_search_id_fkey"
            columns: ["search_id"]
            isOneToOne: false
            referencedRelation: "searches"
            referencedColumns: ["id"]
          },
        ]
      }
      batch_queue: {
        Row: {
          batch_index: number
          cnjs: Json
          created_at: string
          error: string | null
          id: string
          search_id: string
          status: string
          total_batches: number
          updated_at: string
        }
        Insert: {
          batch_index: number
          cnjs?: Json
          created_at?: string
          error?: string | null
          id?: string
          search_id: string
          status?: string
          total_batches: number
          updated_at?: string
        }
        Update: {
          batch_index?: number
          cnjs?: Json
          created_at?: string
          error?: string | null
          id?: string
          search_id?: string
          status?: string
          total_batches?: number
          updated_at?: string
        }
        Relationships: []
      }
      insurance_policies: {
        Row: {
          additional_data: Json | null
          beneficiary: string | null
          contract_reference: string | null
          court_order_reference: string | null
          coverage_amount: number | null
          coverage_type: string | null
          created_at: string
          deductible_amount: number | null
          document_id: string | null
          end_date: string | null
          guarantee_object: string | null
          guarantee_type: string | null
          id: string
          insured: string | null
          insured_cnpj: string | null
          insurer: string | null
          lawsuit_id: string
          policy_number: string | null
          policy_type: string | null
          premium_amount: number | null
          raw_ocr_text: string | null
          search_id: string
          start_date: string | null
        }
        Insert: {
          additional_data?: Json | null
          beneficiary?: string | null
          contract_reference?: string | null
          court_order_reference?: string | null
          coverage_amount?: number | null
          coverage_type?: string | null
          created_at?: string
          deductible_amount?: number | null
          document_id?: string | null
          end_date?: string | null
          guarantee_object?: string | null
          guarantee_type?: string | null
          id?: string
          insured?: string | null
          insured_cnpj?: string | null
          insurer?: string | null
          lawsuit_id: string
          policy_number?: string | null
          policy_type?: string | null
          premium_amount?: number | null
          raw_ocr_text?: string | null
          search_id: string
          start_date?: string | null
        }
        Update: {
          additional_data?: Json | null
          beneficiary?: string | null
          contract_reference?: string | null
          court_order_reference?: string | null
          coverage_amount?: number | null
          coverage_type?: string | null
          created_at?: string
          deductible_amount?: number | null
          document_id?: string | null
          end_date?: string | null
          guarantee_object?: string | null
          guarantee_type?: string | null
          id?: string
          insured?: string | null
          insured_cnpj?: string | null
          insurer?: string | null
          lawsuit_id?: string
          policy_number?: string | null
          policy_type?: string | null
          premium_amount?: number | null
          raw_ocr_text?: string | null
          search_id?: string
          start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "insurance_policies_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "lawsuit_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_policies_lawsuit_id_fkey"
            columns: ["lawsuit_id"]
            isOneToOne: false
            referencedRelation: "lawsuits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_policies_search_id_fkey"
            columns: ["search_id"]
            isOneToOne: false
            referencedRelation: "searches"
            referencedColumns: ["id"]
          },
        ]
      }
      judit_callbacks: {
        Row: {
          created_at: string
          id: string
          payload: Json | null
          request_id: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          payload?: Json | null
          request_id: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          payload?: Json | null
          request_id?: string
          status?: string
        }
        Relationships: []
      }
      lawsuit_documents: {
        Row: {
          ai_analysis: string | null
          ai_confidence: number | null
          created_at: string
          document_name: string
          document_type: string | null
          document_url: string | null
          id: string
          is_policy_candidate: boolean | null
          lawsuit_id: string
        }
        Insert: {
          ai_analysis?: string | null
          ai_confidence?: number | null
          created_at?: string
          document_name: string
          document_type?: string | null
          document_url?: string | null
          id?: string
          is_policy_candidate?: boolean | null
          lawsuit_id: string
        }
        Update: {
          ai_analysis?: string | null
          ai_confidence?: number | null
          created_at?: string
          document_name?: string
          document_type?: string | null
          document_url?: string | null
          id?: string
          is_policy_candidate?: boolean | null
          lawsuit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lawsuit_documents_lawsuit_id_fkey"
            columns: ["lawsuit_id"]
            isOneToOne: false
            referencedRelation: "lawsuits"
            referencedColumns: ["id"]
          },
        ]
      }
      lawsuit_sentences: {
        Row: {
          created_at: string
          document_id: string | null
          document_name: string
          document_type: string | null
          document_url: string | null
          id: string
          is_termination: boolean
          judge_name: string | null
          key_points: Json | null
          lawsuit_id: string
          outcome: string | null
          raw_text: string | null
          release_confidence: string | null
          release_reason: string | null
          search_id: string
          sentence_date: string | null
          summary: string
          termination_type: string | null
        }
        Insert: {
          created_at?: string
          document_id?: string | null
          document_name: string
          document_type?: string | null
          document_url?: string | null
          id?: string
          is_termination?: boolean
          judge_name?: string | null
          key_points?: Json | null
          lawsuit_id: string
          outcome?: string | null
          raw_text?: string | null
          release_confidence?: string | null
          release_reason?: string | null
          search_id: string
          sentence_date?: string | null
          summary?: string
          termination_type?: string | null
        }
        Update: {
          created_at?: string
          document_id?: string | null
          document_name?: string
          document_type?: string | null
          document_url?: string | null
          id?: string
          is_termination?: boolean
          judge_name?: string | null
          key_points?: Json | null
          lawsuit_id?: string
          outcome?: string | null
          raw_text?: string | null
          release_confidence?: string | null
          release_reason?: string | null
          search_id?: string
          sentence_date?: string | null
          summary?: string
          termination_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lawsuit_sentences_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "lawsuit_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      lawsuits: {
        Row: {
          amount: number | null
          court: string | null
          created_at: string
          distribution_date: string | null
          id: string
          lawsuit_cnj: string | null
          lawsuit_id: string | null
          parties: Json | null
          search_id: string
          status: string | null
          subject: string | null
        }
        Insert: {
          amount?: number | null
          court?: string | null
          created_at?: string
          distribution_date?: string | null
          id?: string
          lawsuit_cnj?: string | null
          lawsuit_id?: string | null
          parties?: Json | null
          search_id: string
          status?: string | null
          subject?: string | null
        }
        Update: {
          amount?: number | null
          court?: string | null
          created_at?: string
          distribution_date?: string | null
          id?: string
          lawsuit_cnj?: string | null
          lawsuit_id?: string | null
          parties?: Json | null
          search_id?: string
          status?: string | null
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lawsuits_search_id_fkey"
            columns: ["search_id"]
            isOneToOne: false
            referencedRelation: "searches"
            referencedColumns: ["id"]
          },
        ]
      }
      searches: {
        Row: {
          cnpj: string
          created_at: string
          date_from: string | null
          date_to: string | null
          id: string
          judit_request_id: string | null
          status: string
          total_lawsuits: number | null
          total_policies_found: number | null
          total_sentences_found: number | null
          updated_at: string
        }
        Insert: {
          cnpj: string
          created_at?: string
          date_from?: string | null
          date_to?: string | null
          id?: string
          judit_request_id?: string | null
          status?: string
          total_lawsuits?: number | null
          total_policies_found?: number | null
          total_sentences_found?: number | null
          updated_at?: string
        }
        Update: {
          cnpj?: string
          created_at?: string
          date_from?: string | null
          date_to?: string | null
          id?: string
          judit_request_id?: string | null
          status?: string
          total_lawsuits?: number | null
          total_policies_found?: number | null
          total_sentences_found?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      system_logs: {
        Row: {
          action: string
          created_at: string
          duration_ms: number | null
          id: string
          lawsuit_cnj: string | null
          level: string
          message: string
          metadata: Json | null
          request_id: string | null
          search_id: string | null
          source: string
        }
        Insert: {
          action: string
          created_at?: string
          duration_ms?: number | null
          id?: string
          lawsuit_cnj?: string | null
          level?: string
          message: string
          metadata?: Json | null
          request_id?: string | null
          search_id?: string | null
          source: string
        }
        Update: {
          action?: string
          created_at?: string
          duration_ms?: number | null
          id?: string
          lawsuit_cnj?: string | null
          level?: string
          message?: string
          metadata?: Json | null
          request_id?: string | null
          search_id?: string | null
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "system_logs_search_id_fkey"
            columns: ["search_id"]
            isOneToOne: false
            referencedRelation: "searches"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
