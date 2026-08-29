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
    PostgrestVersion: "14.5"
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
          source_pdf_url: string | null
          storage_bucket: string | null
          storage_path: string | null
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
          source_pdf_url?: string | null
          storage_bucket?: string | null
          storage_path?: string | null
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
          source_pdf_url?: string | null
          storage_bucket?: string | null
          storage_path?: string | null
          subject?: string
          year?: number
        }
        Relationships: []
      }
      question_explanations: {
        Row: {
          correct_option: string | null
          created_at: string
          explanation: string | null
          id: string
          option_a: string | null
          option_b: string | null
          option_c: string | null
          option_d: string | null
          paper_id: string | null
          question_number: number
          topic_paper_id: string | null
          updated_at: string
        }
        Insert: {
          correct_option?: string | null
          created_at?: string
          explanation?: string | null
          id?: string
          option_a?: string | null
          option_b?: string | null
          option_c?: string | null
          option_d?: string | null
          paper_id?: string | null
          question_number: number
          topic_paper_id?: string | null
          updated_at?: string
        }
        Update: {
          correct_option?: string | null
          created_at?: string
          explanation?: string | null
          id?: string
          option_a?: string | null
          option_b?: string | null
          option_c?: string | null
          option_d?: string | null
          paper_id?: string | null
          question_number?: number
          topic_paper_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_explanations_paper_id_fkey"
            columns: ["paper_id"]
            isOneToOne: false
            referencedRelation: "papers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_explanations_topic_paper_id_fkey"
            columns: ["topic_paper_id"]
            isOneToOne: false
            referencedRelation: "topicwise_mcq_papers"
            referencedColumns: ["id"]
          },
        ]
      }
      question_images: {
        Row: {
          created_at: string
          height: number | null
          id: string
          paper_id: string
          question_number: number
          storage_path: string
          width: number | null
        }
        Insert: {
          created_at?: string
          height?: number | null
          id?: string
          paper_id: string
          question_number: number
          storage_path: string
          width?: number | null
        }
        Update: {
          created_at?: string
          height?: number | null
          id?: string
          paper_id?: string
          question_number?: number
          storage_path?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "question_images_paper_id_fkey"
            columns: ["paper_id"]
            isOneToOne: false
            referencedRelation: "papers"
            referencedColumns: ["id"]
          },
        ]
      }
      question_topic_mapping: {
        Row: {
          created_at: string
          id: string
          mapping_type: string
          paper_id: string
          question_number: number
          syllabus_topic_id: string
          verified: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          mapping_type?: string
          paper_id: string
          question_number: number
          syllabus_topic_id: string
          verified?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          mapping_type?: string
          paper_id?: string
          question_number?: number
          syllabus_topic_id?: string
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "question_topic_mapping_paper_id_fkey"
            columns: ["paper_id"]
            isOneToOne: false
            referencedRelation: "papers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_topic_mapping_syllabus_topic_id_fkey"
            columns: ["syllabus_topic_id"]
            isOneToOne: false
            referencedRelation: "syllabus_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      question_topic_mapping_audit: {
        Row: {
          audited_at: string | null
          audited_topic_code: string | null
          audited_topic_id: string | null
          audited_topic_name: string | null
          confidence: string | null
          evidence: string | null
          existing_topic_code: string | null
          existing_topic_name: string | null
          id: string
          mapping_id: string
          paper_id: string
          question_number: number
          status: string
          syllabus_topic_id: string
        }
        Insert: {
          audited_at?: string | null
          audited_topic_code?: string | null
          audited_topic_id?: string | null
          audited_topic_name?: string | null
          confidence?: string | null
          evidence?: string | null
          existing_topic_code?: string | null
          existing_topic_name?: string | null
          id?: string
          mapping_id: string
          paper_id: string
          question_number: number
          status?: string
          syllabus_topic_id: string
        }
        Update: {
          audited_at?: string | null
          audited_topic_code?: string | null
          audited_topic_id?: string | null
          audited_topic_name?: string | null
          confidence?: string | null
          evidence?: string | null
          existing_topic_code?: string | null
          existing_topic_name?: string | null
          id?: string
          mapping_id?: string
          paper_id?: string
          question_number?: number
          status?: string
          syllabus_topic_id?: string
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
      syllabus_topics: {
        Row: {
          created_at: string
          display_order: number | null
          id: string
          is_active: boolean
          level: string | null
          parent_topic_id: string | null
          syllabus_version_id: string
          topic_code: string
          topic_name: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean
          level?: string | null
          parent_topic_id?: string | null
          syllabus_version_id: string
          topic_code: string
          topic_name: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean
          level?: string | null
          parent_topic_id?: string | null
          syllabus_version_id?: string
          topic_code?: string
          topic_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "syllabus_topics_parent_topic_id_fkey"
            columns: ["parent_topic_id"]
            isOneToOne: false
            referencedRelation: "syllabus_topics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "syllabus_topics_syllabus_version_id_fkey"
            columns: ["syllabus_version_id"]
            isOneToOne: false
            referencedRelation: "syllabus_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      syllabus_versions: {
        Row: {
          created_at: string
          id: string
          is_current: boolean
          level: string | null
          official_source_url: string | null
          qualification: string | null
          syllabus_code: string
          syllabus_version: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_current?: boolean
          level?: string | null
          official_source_url?: string | null
          qualification?: string | null
          syllabus_code: string
          syllabus_version: string
        }
        Update: {
          created_at?: string
          id?: string
          is_current?: boolean
          level?: string | null
          official_source_url?: string | null
          qualification?: string | null
          syllabus_code?: string
          syllabus_version?: string
        }
        Relationships: []
      }
      theory_explanations: {
        Row: {
          created_at: string
          explanation: string | null
          id: string
          image_path: string | null
          order_index: number
          part_label: string
          question_number: number
          theory_paper_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          explanation?: string | null
          id?: string
          image_path?: string | null
          order_index?: number
          part_label?: string
          question_number: number
          theory_paper_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          explanation?: string | null
          id?: string
          image_path?: string | null
          order_index?: number
          part_label?: string
          question_number?: number
          theory_paper_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "theory_explanations_theory_paper_id_fkey"
            columns: ["theory_paper_id"]
            isOneToOne: false
            referencedRelation: "theory_papers"
            referencedColumns: ["id"]
          },
        ]
      }
      theory_papers: {
        Row: {
          answer_storage_path: string | null
          component: string
          created_at: string
          id: string
          level: string
          paper_code: string
          question_storage_path: string | null
          session: string
          syllabus_code: string
          total_questions: number
          updated_at: string
          year: number
        }
        Insert: {
          answer_storage_path?: string | null
          component: string
          created_at?: string
          id?: string
          level: string
          paper_code: string
          question_storage_path?: string | null
          session: string
          syllabus_code: string
          total_questions?: number
          updated_at?: string
          year: number
        }
        Update: {
          answer_storage_path?: string | null
          component?: string
          created_at?: string
          id?: string
          level?: string
          paper_code?: string
          question_storage_path?: string | null
          session?: string
          syllabus_code?: string
          total_questions?: number
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      topic_practice_syllabus_map: {
        Row: {
          created_at: string
          id: string
          level: string
          syllabus_topic_id: string
          topic: string
        }
        Insert: {
          created_at?: string
          id?: string
          level: string
          syllabus_topic_id: string
          topic: string
        }
        Update: {
          created_at?: string
          id?: string
          level?: string
          syllabus_topic_id?: string
          topic?: string
        }
        Relationships: [
          {
            foreignKeyName: "topic_practice_syllabus_map_syllabus_topic_id_fkey"
            columns: ["syllabus_topic_id"]
            isOneToOne: false
            referencedRelation: "syllabus_topics"
            referencedColumns: ["id"]
          },
        ]
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
