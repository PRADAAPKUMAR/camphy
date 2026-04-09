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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      answer_keys: {
        Row: {
          id: string
          paper_id: string
          q1: string | null
          q10: string | null
          q11: string | null
          q12: string | null
          q13: string | null
          q14: string | null
          q15: string | null
          q16: string | null
          q17: string | null
          q18: string | null
          q19: string | null
          q2: string | null
          q20: string | null
          q21: string | null
          q22: string | null
          q23: string | null
          q24: string | null
          q25: string | null
          q26: string | null
          q27: string | null
          q28: string | null
          q29: string | null
          q3: string | null
          q30: string | null
          q31: string | null
          q32: string | null
          q33: string | null
          q34: string | null
          q35: string | null
          q36: string | null
          q37: string | null
          q38: string | null
          q39: string | null
          q4: string | null
          q40: string | null
          q5: string | null
          q6: string | null
          q7: string | null
          q8: string | null
          q9: string | null
        }
        Insert: {
          id?: string
          paper_id: string
          q1?: string | null
          q10?: string | null
          q11?: string | null
          q12?: string | null
          q13?: string | null
          q14?: string | null
          q15?: string | null
          q16?: string | null
          q17?: string | null
          q18?: string | null
          q19?: string | null
          q2?: string | null
          q20?: string | null
          q21?: string | null
          q22?: string | null
          q23?: string | null
          q24?: string | null
          q25?: string | null
          q26?: string | null
          q27?: string | null
          q28?: string | null
          q29?: string | null
          q3?: string | null
          q30?: string | null
          q31?: string | null
          q32?: string | null
          q33?: string | null
          q34?: string | null
          q35?: string | null
          q36?: string | null
          q37?: string | null
          q38?: string | null
          q39?: string | null
          q4?: string | null
          q40?: string | null
          q5?: string | null
          q6?: string | null
          q7?: string | null
          q8?: string | null
          q9?: string | null
        }
        Update: {
          id?: string
          paper_id?: string
          q1?: string | null
          q10?: string | null
          q11?: string | null
          q12?: string | null
          q13?: string | null
          q14?: string | null
          q15?: string | null
          q16?: string | null
          q17?: string | null
          q18?: string | null
          q19?: string | null
          q2?: string | null
          q20?: string | null
          q21?: string | null
          q22?: string | null
          q23?: string | null
          q24?: string | null
          q25?: string | null
          q26?: string | null
          q27?: string | null
          q28?: string | null
          q29?: string | null
          q3?: string | null
          q30?: string | null
          q31?: string | null
          q32?: string | null
          q33?: string | null
          q34?: string | null
          q35?: string | null
          q36?: string | null
          q37?: string | null
          q38?: string | null
          q39?: string | null
          q4?: string | null
          q40?: string | null
          q5?: string | null
          q6?: string | null
          q7?: string | null
          q8?: string | null
          q9?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "answer_keys_paper_id_fkey"
            columns: ["paper_id"]
            isOneToOne: true
            referencedRelation: "papers"
            referencedColumns: ["id"]
          },
        ]
      }
      attempts: {
        Row: {
          answers: Json
          created_at: string
          id: string
          paper_id: string
          score: number
          total_questions: number
        }
        Insert: {
          answers?: Json
          created_at?: string
          id?: string
          paper_id: string
          score: number
          total_questions: number
        }
        Update: {
          answers?: Json
          created_at?: string
          id?: string
          paper_id?: string
          score?: number
          total_questions?: number
        }
        Relationships: [
          {
            foreignKeyName: "attempts_paper_id_fkey"
            columns: ["paper_id"]
            isOneToOne: false
            referencedRelation: "papers"
            referencedColumns: ["id"]
          },
        ]
      }
      papers: {
        Row: {
          created_at: string
          id: string
          level: string
          paper_code: string
          pdf_url: string
          session: string
          subject: string
          year: number
        }
        Insert: {
          created_at?: string
          id?: string
          level: string
          paper_code: string
          pdf_url: string
          session: string
          subject: string
          year: number
        }
        Update: {
          created_at?: string
          id?: string
          level?: string
          paper_code?: string
          pdf_url?: string
          session?: string
          subject?: string
          year?: number
        }
        Relationships: []
      }
      study_materials: {
        Row: {
          created_at: string
          description: string | null
          file_type: string
          file_url: string
          folder_path: string | null
          id: string
          level: string
          subject: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_type?: string
          file_url: string
          folder_path?: string | null
          id?: string
          level: string
          subject: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          file_type?: string
          file_url?: string
          folder_path?: string | null
          id?: string
          level?: string
          subject?: string
          title?: string
        }
        Relationships: []
      }
      topicwise_mcq_answer_keys: {
        Row: {
          id: string
          paper_id: string
          q1: string | null
          q10: string | null
          q100: string | null
          q11: string | null
          q12: string | null
          q13: string | null
          q14: string | null
          q15: string | null
          q16: string | null
          q17: string | null
          q18: string | null
          q19: string | null
          q2: string | null
          q20: string | null
          q21: string | null
          q22: string | null
          q23: string | null
          q24: string | null
          q25: string | null
          q26: string | null
          q27: string | null
          q28: string | null
          q29: string | null
          q3: string | null
          q30: string | null
          q31: string | null
          q32: string | null
          q33: string | null
          q34: string | null
          q35: string | null
          q36: string | null
          q37: string | null
          q38: string | null
          q39: string | null
          q4: string | null
          q40: string | null
          q41: string | null
          q42: string | null
          q43: string | null
          q44: string | null
          q45: string | null
          q46: string | null
          q47: string | null
          q48: string | null
          q49: string | null
          q5: string | null
          q50: string | null
          q51: string | null
          q52: string | null
          q53: string | null
          q54: string | null
          q55: string | null
          q56: string | null
          q57: string | null
          q58: string | null
          q59: string | null
          q6: string | null
          q60: string | null
          q61: string | null
          q62: string | null
          q63: string | null
          q64: string | null
          q65: string | null
          q66: string | null
          q67: string | null
          q68: string | null
          q69: string | null
          q7: string | null
          q70: string | null
          q71: string | null
          q72: string | null
          q73: string | null
          q74: string | null
          q75: string | null
          q76: string | null
          q77: string | null
          q78: string | null
          q79: string | null
          q8: string | null
          q80: string | null
          q81: string | null
          q82: string | null
          q83: string | null
          q84: string | null
          q85: string | null
          q86: string | null
          q87: string | null
          q88: string | null
          q89: string | null
          q9: string | null
          q90: string | null
          q91: string | null
          q92: string | null
          q93: string | null
          q94: string | null
          q95: string | null
          q96: string | null
          q97: string | null
          q98: string | null
          q99: string | null
        }
        Insert: {
          id?: string
          paper_id: string
          q1?: string | null
          q10?: string | null
          q100?: string | null
          q11?: string | null
          q12?: string | null
          q13?: string | null
          q14?: string | null
          q15?: string | null
          q16?: string | null
          q17?: string | null
          q18?: string | null
          q19?: string | null
          q2?: string | null
          q20?: string | null
          q21?: string | null
          q22?: string | null
          q23?: string | null
          q24?: string | null
          q25?: string | null
          q26?: string | null
          q27?: string | null
          q28?: string | null
          q29?: string | null
          q3?: string | null
          q30?: string | null
          q31?: string | null
          q32?: string | null
          q33?: string | null
          q34?: string | null
          q35?: string | null
          q36?: string | null
          q37?: string | null
          q38?: string | null
          q39?: string | null
          q4?: string | null
          q40?: string | null
          q41?: string | null
          q42?: string | null
          q43?: string | null
          q44?: string | null
          q45?: string | null
          q46?: string | null
          q47?: string | null
          q48?: string | null
          q49?: string | null
          q5?: string | null
          q50?: string | null
          q51?: string | null
          q52?: string | null
          q53?: string | null
          q54?: string | null
          q55?: string | null
          q56?: string | null
          q57?: string | null
          q58?: string | null
          q59?: string | null
          q6?: string | null
          q60?: string | null
          q61?: string | null
          q62?: string | null
          q63?: string | null
          q64?: string | null
          q65?: string | null
          q66?: string | null
          q67?: string | null
          q68?: string | null
          q69?: string | null
          q7?: string | null
          q70?: string | null
          q71?: string | null
          q72?: string | null
          q73?: string | null
          q74?: string | null
          q75?: string | null
          q76?: string | null
          q77?: string | null
          q78?: string | null
          q79?: string | null
          q8?: string | null
          q80?: string | null
          q81?: string | null
          q82?: string | null
          q83?: string | null
          q84?: string | null
          q85?: string | null
          q86?: string | null
          q87?: string | null
          q88?: string | null
          q89?: string | null
          q9?: string | null
          q90?: string | null
          q91?: string | null
          q92?: string | null
          q93?: string | null
          q94?: string | null
          q95?: string | null
          q96?: string | null
          q97?: string | null
          q98?: string | null
          q99?: string | null
        }
        Update: {
          id?: string
          paper_id?: string
          q1?: string | null
          q10?: string | null
          q100?: string | null
          q11?: string | null
          q12?: string | null
          q13?: string | null
          q14?: string | null
          q15?: string | null
          q16?: string | null
          q17?: string | null
          q18?: string | null
          q19?: string | null
          q2?: string | null
          q20?: string | null
          q21?: string | null
          q22?: string | null
          q23?: string | null
          q24?: string | null
          q25?: string | null
          q26?: string | null
          q27?: string | null
          q28?: string | null
          q29?: string | null
          q3?: string | null
          q30?: string | null
          q31?: string | null
          q32?: string | null
          q33?: string | null
          q34?: string | null
          q35?: string | null
          q36?: string | null
          q37?: string | null
          q38?: string | null
          q39?: string | null
          q4?: string | null
          q40?: string | null
          q41?: string | null
          q42?: string | null
          q43?: string | null
          q44?: string | null
          q45?: string | null
          q46?: string | null
          q47?: string | null
          q48?: string | null
          q49?: string | null
          q5?: string | null
          q50?: string | null
          q51?: string | null
          q52?: string | null
          q53?: string | null
          q54?: string | null
          q55?: string | null
          q56?: string | null
          q57?: string | null
          q58?: string | null
          q59?: string | null
          q6?: string | null
          q60?: string | null
          q61?: string | null
          q62?: string | null
          q63?: string | null
          q64?: string | null
          q65?: string | null
          q66?: string | null
          q67?: string | null
          q68?: string | null
          q69?: string | null
          q7?: string | null
          q70?: string | null
          q71?: string | null
          q72?: string | null
          q73?: string | null
          q74?: string | null
          q75?: string | null
          q76?: string | null
          q77?: string | null
          q78?: string | null
          q79?: string | null
          q8?: string | null
          q80?: string | null
          q81?: string | null
          q82?: string | null
          q83?: string | null
          q84?: string | null
          q85?: string | null
          q86?: string | null
          q87?: string | null
          q88?: string | null
          q89?: string | null
          q9?: string | null
          q90?: string | null
          q91?: string | null
          q92?: string | null
          q93?: string | null
          q94?: string | null
          q95?: string | null
          q96?: string | null
          q97?: string | null
          q98?: string | null
          q99?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "topicwise_mcq_answer_keys_paper_id_fkey"
            columns: ["paper_id"]
            isOneToOne: true
            referencedRelation: "topicwise_mcq_papers"
            referencedColumns: ["id"]
          },
        ]
      }
      topicwise_mcq_papers: {
        Row: {
          created_at: string
          id: string
          level: string
          pdf_url: string
          timer_minutes: number
          topic: string
          total_questions: number
        }
        Insert: {
          created_at?: string
          id?: string
          level: string
          pdf_url: string
          timer_minutes?: number
          topic: string
          total_questions?: number
        }
        Update: {
          created_at?: string
          id?: string
          level?: string
          pdf_url?: string
          timer_minutes?: number
          topic?: string
          total_questions?: number
        }
        Relationships: []
      }
      topicwise_theory_questions: {
        Row: {
          answer_pdf_url: string
          created_at: string
          id: string
          level: string
          question_pdf_url: string
          topic: string
        }
        Insert: {
          answer_pdf_url: string
          created_at?: string
          id?: string
          level: string
          question_pdf_url: string
          topic: string
        }
        Update: {
          answer_pdf_url?: string
          created_at?: string
          id?: string
          level?: string
          question_pdf_url?: string
          topic?: string
        }
        Relationships: []
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
