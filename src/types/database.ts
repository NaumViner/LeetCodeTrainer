export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      attempt_hints: {
        Row: {
          attempt_id: string;
          content: string;
          created_at: string;
          help_level: string;
          id: string;
          ordinal: number;
          title: string;
        };
        Insert: {
          attempt_id: string;
          content: string;
          created_at?: string;
          help_level: string;
          id?: string;
          ordinal: number;
          title: string;
        };
        Update: {
          attempt_id?: string;
          content?: string;
          created_at?: string;
          help_level?: string;
          id?: string;
          ordinal?: number;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "attempt_hints_attempt_id_fkey";
            columns: ["attempt_id"];
            isOneToOne: false;
            referencedRelation: "attempts";
            referencedColumns: ["id"];
          },
        ];
      };
      attempt_performance: {
        Row: {
          attempt_id: string;
          complexity_score: number;
          correctness_score: number;
          created_at: string;
          independence_score: number;
          overall_score: number;
          recognition_score: number;
          retention_score: number;
          speed_score: number;
          topic_id: string;
          user_id: string;
        };
        Insert: {
          attempt_id: string;
          complexity_score: number;
          correctness_score: number;
          created_at?: string;
          independence_score: number;
          overall_score: number;
          recognition_score: number;
          retention_score: number;
          speed_score: number;
          topic_id: string;
          user_id: string;
        };
        Update: {
          attempt_id?: string;
          complexity_score?: number;
          correctness_score?: number;
          created_at?: string;
          independence_score?: number;
          overall_score?: number;
          recognition_score?: number;
          retention_score?: number;
          speed_score?: number;
          topic_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "attempt_performance_attempt_id_fkey";
            columns: ["attempt_id"];
            isOneToOne: true;
            referencedRelation: "attempts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attempt_performance_topic_id_fkey";
            columns: ["topic_id"];
            isOneToOne: false;
            referencedRelation: "topics";
            referencedColumns: ["id"];
          },
        ];
      };
      attempts: {
        Row: {
          brute_force_approach: string | null;
          brute_force_complexity: string | null;
          code_snapshot: string | null;
          completed_at: string | null;
          complexity_correct: boolean | null;
          confidence_after: number | null;
          confidence_before: number | null;
          correct_pattern: string | null;
          created_at: string;
          duration_seconds: number;
          edge_cases_missed: string[];
          help_level: string;
          id: string;
          mistakes: string[];
          mode: string;
          phase: string;
          predicted_pattern: string | null;
          problem_id: string;
          recognized_pattern_correctly: boolean | null;
          result: string | null;
          started_at: string;
          status: string;
          submitted_space_complexity: string | null;
          submitted_time_complexity: string | null;
          takeaway: string | null;
          timer_running: boolean;
          timer_started_at: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          brute_force_approach?: string | null;
          brute_force_complexity?: string | null;
          code_snapshot?: string | null;
          completed_at?: string | null;
          complexity_correct?: boolean | null;
          confidence_after?: number | null;
          confidence_before?: number | null;
          correct_pattern?: string | null;
          created_at?: string;
          duration_seconds?: number;
          edge_cases_missed?: string[];
          help_level?: string;
          id?: string;
          mistakes?: string[];
          mode?: string;
          phase?: string;
          predicted_pattern?: string | null;
          problem_id: string;
          recognized_pattern_correctly?: boolean | null;
          result?: string | null;
          started_at?: string;
          status?: string;
          submitted_space_complexity?: string | null;
          submitted_time_complexity?: string | null;
          takeaway?: string | null;
          timer_running?: boolean;
          timer_started_at?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          brute_force_approach?: string | null;
          brute_force_complexity?: string | null;
          code_snapshot?: string | null;
          completed_at?: string | null;
          complexity_correct?: boolean | null;
          confidence_after?: number | null;
          confidence_before?: number | null;
          correct_pattern?: string | null;
          created_at?: string;
          duration_seconds?: number;
          edge_cases_missed?: string[];
          help_level?: string;
          id?: string;
          mistakes?: string[];
          mode?: string;
          phase?: string;
          predicted_pattern?: string | null;
          problem_id?: string;
          recognized_pattern_correctly?: boolean | null;
          result?: string | null;
          started_at?: string;
          status?: string;
          submitted_space_complexity?: string | null;
          submitted_time_complexity?: string | null;
          takeaway?: string | null;
          timer_running?: boolean;
          timer_started_at?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "attempts_problem_id_fkey";
            columns: ["problem_id"];
            isOneToOne: false;
            referencedRelation: "problems";
            referencedColumns: ["id"];
          },
        ];
      };
      lesson_prerequisites: {
        Row: {
          lesson_id: string;
          prerequisite_lesson_id: string;
        };
        Insert: {
          lesson_id: string;
          prerequisite_lesson_id: string;
        };
        Update: {
          lesson_id?: string;
          prerequisite_lesson_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lesson_prerequisites_lesson_id_fkey";
            columns: ["lesson_id"];
            isOneToOne: false;
            referencedRelation: "lessons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lesson_prerequisites_prerequisite_lesson_id_fkey";
            columns: ["prerequisite_lesson_id"];
            isOneToOne: false;
            referencedRelation: "lessons";
            referencedColumns: ["id"];
          },
        ];
      };
      lesson_progress: {
        Row: {
          completed_at: string | null;
          created_at: string;
          lesson_id: string;
          started_at: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string;
          lesson_id: string;
          started_at?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string;
          lesson_id?: string;
          started_at?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey";
            columns: ["lesson_id"];
            isOneToOne: false;
            referencedRelation: "lessons";
            referencedColumns: ["id"];
          },
        ];
      };
      lessons: {
        Row: {
          active: boolean;
          common_mistakes: string[];
          content_path: string;
          created_at: string;
          estimated_minutes: number;
          id: string;
          learning_objectives: string[];
          lesson_order: number;
          recognition_signals: string[];
          slug: string;
          title: string;
          topic_id: string;
          updated_at: string;
        };
        Insert: {
          active?: boolean;
          common_mistakes?: string[];
          content_path: string;
          created_at?: string;
          estimated_minutes: number;
          id?: string;
          learning_objectives?: string[];
          lesson_order: number;
          recognition_signals?: string[];
          slug: string;
          title: string;
          topic_id: string;
          updated_at?: string;
        };
        Update: {
          active?: boolean;
          common_mistakes?: string[];
          content_path?: string;
          created_at?: string;
          estimated_minutes?: number;
          id?: string;
          learning_objectives?: string[];
          lesson_order?: number;
          recognition_signals?: string[];
          slug?: string;
          title?: string;
          topic_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lessons_topic_id_fkey";
            columns: ["topic_id"];
            isOneToOne: false;
            referencedRelation: "topics";
            referencedColumns: ["id"];
          },
        ];
      };
      problem_prerequisite_topics: {
        Row: {
          problem_id: string;
          topic_id: string;
        };
        Insert: {
          problem_id: string;
          topic_id: string;
        };
        Update: {
          problem_id?: string;
          topic_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "problem_prerequisite_topics_problem_id_fkey";
            columns: ["problem_id"];
            isOneToOne: false;
            referencedRelation: "problems";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "problem_prerequisite_topics_topic_id_fkey";
            columns: ["topic_id"];
            isOneToOne: false;
            referencedRelation: "topics";
            referencedColumns: ["id"];
          },
        ];
      };
      problem_secondary_topics: {
        Row: {
          problem_id: string;
          topic_id: string;
        };
        Insert: {
          problem_id: string;
          topic_id: string;
        };
        Update: {
          problem_id?: string;
          topic_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "problem_secondary_topics_problem_id_fkey";
            columns: ["problem_id"];
            isOneToOne: false;
            referencedRelation: "problems";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "problem_secondary_topics_topic_id_fkey";
            columns: ["topic_id"];
            isOneToOne: false;
            referencedRelation: "topics";
            referencedColumns: ["id"];
          },
        ];
      };
      problems: {
        Row: {
          active: boolean;
          company_tags: string[];
          created_at: string;
          curriculum_level: string;
          dataset_order: number;
          difficulty: string;
          estimated_minutes: number;
          external_id: string | null;
          external_url: string | null;
          id: string;
          pattern_tags: string[];
          premium: boolean;
          primary_topic_id: string;
          recognition_signals: string[];
          slug: string;
          source: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          active?: boolean;
          company_tags?: string[];
          created_at?: string;
          curriculum_level: string;
          dataset_order: number;
          difficulty: string;
          estimated_minutes: number;
          external_id?: string | null;
          external_url?: string | null;
          id?: string;
          pattern_tags?: string[];
          premium?: boolean;
          primary_topic_id: string;
          recognition_signals?: string[];
          slug: string;
          source: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          active?: boolean;
          company_tags?: string[];
          created_at?: string;
          curriculum_level?: string;
          dataset_order?: number;
          difficulty?: string;
          estimated_minutes?: number;
          external_id?: string | null;
          external_url?: string | null;
          id?: string;
          pattern_tags?: string[];
          premium?: boolean;
          primary_topic_id?: string;
          recognition_signals?: string[];
          slug?: string;
          source?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "problems_primary_topic_id_fkey";
            columns: ["primary_topic_id"];
            isOneToOne: false;
            referencedRelation: "topics";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          display_name: string | null;
          experience_level: string;
          id: string;
          interview_date: string | null;
          onboarding_completed: boolean;
          preferred_language: string;
          target_companies: string[];
          target_role: string;
          timezone: string;
          updated_at: string;
          weekly_study_minutes: number;
        };
        Insert: {
          created_at?: string;
          display_name?: string | null;
          experience_level?: string;
          id: string;
          interview_date?: string | null;
          onboarding_completed?: boolean;
          preferred_language?: string;
          target_companies?: string[];
          target_role?: string;
          timezone?: string;
          updated_at?: string;
          weekly_study_minutes?: number;
        };
        Update: {
          created_at?: string;
          display_name?: string | null;
          experience_level?: string;
          id?: string;
          interview_date?: string | null;
          onboarding_completed?: boolean;
          preferred_language?: string;
          target_companies?: string[];
          target_role?: string;
          timezone?: string;
          updated_at?: string;
          weekly_study_minutes?: number;
        };
        Relationships: [];
      };
      topic_mastery: {
        Row: {
          complexity_score: number;
          correctness_score: number;
          created_at: string;
          independence_score: number;
          independent_solves: number;
          last_practiced_at: string | null;
          next_review_at: string | null;
          overall_score: number;
          recognition_score: number;
          retention_score: number;
          speed_score: number;
          topic_id: string;
          total_attempts: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          complexity_score: number;
          correctness_score: number;
          created_at?: string;
          independence_score: number;
          independent_solves?: number;
          last_practiced_at?: string | null;
          next_review_at?: string | null;
          overall_score: number;
          recognition_score: number;
          retention_score: number;
          speed_score: number;
          topic_id: string;
          total_attempts?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          complexity_score?: number;
          correctness_score?: number;
          created_at?: string;
          independence_score?: number;
          independent_solves?: number;
          last_practiced_at?: string | null;
          next_review_at?: string | null;
          overall_score?: number;
          recognition_score?: number;
          retention_score?: number;
          speed_score?: number;
          topic_id?: string;
          total_attempts?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "topic_mastery_topic_id_fkey";
            columns: ["topic_id"];
            isOneToOne: false;
            referencedRelation: "topics";
            referencedColumns: ["id"];
          },
        ];
      };
      topic_prerequisites: {
        Row: {
          prerequisite_topic_id: string;
          topic_id: string;
        };
        Insert: {
          prerequisite_topic_id: string;
          topic_id: string;
        };
        Update: {
          prerequisite_topic_id?: string;
          topic_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "topic_prerequisites_prerequisite_topic_id_fkey";
            columns: ["prerequisite_topic_id"];
            isOneToOne: false;
            referencedRelation: "topics";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "topic_prerequisites_topic_id_fkey";
            columns: ["topic_id"];
            isOneToOne: false;
            referencedRelation: "topics";
            referencedColumns: ["id"];
          },
        ];
      };
      topics: {
        Row: {
          active: boolean;
          created_at: string;
          curriculum_order: number;
          id: string;
          long_description: string;
          name: string;
          short_description: string;
          slug: string;
          stage: number;
          updated_at: string;
        };
        Insert: {
          active?: boolean;
          created_at?: string;
          curriculum_order: number;
          id?: string;
          long_description: string;
          name: string;
          short_description: string;
          slug: string;
          stage: number;
          updated_at?: string;
        };
        Update: {
          active?: boolean;
          created_at?: string;
          curriculum_order?: number;
          id?: string;
          long_description?: string;
          name?: string;
          short_description?: string;
          slug?: string;
          stage?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
