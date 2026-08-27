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
      daily_plan_items: {
        Row: {
          action_path: string;
          completed: boolean;
          completed_at: string | null;
          created_at: string;
          daily_plan_id: string;
          entity_id: string | null;
          estimated_minutes: number;
          id: string;
          position: number;
          priority: number;
          reason: string;
          title: string;
          type: string;
          updated_at: string;
        };
        Insert: {
          action_path: string;
          completed?: boolean;
          completed_at?: string | null;
          created_at?: string;
          daily_plan_id: string;
          entity_id?: string | null;
          estimated_minutes: number;
          id?: string;
          position: number;
          priority: number;
          reason: string;
          title: string;
          type: string;
          updated_at?: string;
        };
        Update: {
          action_path?: string;
          completed?: boolean;
          completed_at?: string | null;
          created_at?: string;
          daily_plan_id?: string;
          entity_id?: string | null;
          estimated_minutes?: number;
          id?: string;
          position?: number;
          priority?: number;
          reason?: string;
          title?: string;
          type?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "daily_plan_items_daily_plan_id_fkey";
            columns: ["daily_plan_id"];
            isOneToOne: false;
            referencedRelation: "daily_plans";
            referencedColumns: ["id"];
          },
        ];
      };
      daily_plans: {
        Row: {
          available_minutes: number;
          created_at: string;
          generated_at: string;
          generation: number;
          id: string;
          local_date: string;
          status: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          available_minutes: number;
          created_at?: string;
          generated_at?: string;
          generation?: number;
          id?: string;
          local_date: string;
          status?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          available_minutes?: number;
          created_at?: string;
          generated_at?: string;
          generation?: number;
          id?: string;
          local_date?: string;
          status?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      diagnostic_attempts: {
        Row: {
          assigned_coding_question_ids: string[];
          coding_score: number | null;
          coding_tier: string;
          completed_at: string | null;
          concept_score: number;
          created_at: string;
          id: string;
          overall_score: number | null;
          pattern_score: number;
          placement_level: string | null;
          started_at: string;
          status: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          assigned_coding_question_ids: string[];
          coding_score?: number | null;
          coding_tier: string;
          completed_at?: string | null;
          concept_score: number;
          created_at?: string;
          id?: string;
          overall_score?: number | null;
          pattern_score: number;
          placement_level?: string | null;
          started_at?: string;
          status?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          assigned_coding_question_ids?: string[];
          coding_score?: number | null;
          coding_tier?: string;
          completed_at?: string | null;
          concept_score?: number;
          created_at?: string;
          id?: string;
          overall_score?: number | null;
          pattern_score?: number;
          placement_level?: string | null;
          started_at?: string;
          status?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      diagnostic_question_keys: {
        Row: {
          active: boolean;
          correct_answer: string;
          difficulty: number;
          question_id: string;
          section: string;
          topic_id: string;
        };
        Insert: {
          active?: boolean;
          correct_answer: string;
          difficulty: number;
          question_id: string;
          section: string;
          topic_id: string;
        };
        Update: {
          active?: boolean;
          correct_answer?: string;
          difficulty?: number;
          question_id?: string;
          section?: string;
          topic_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "diagnostic_question_keys_topic_id_fkey";
            columns: ["topic_id"];
            isOneToOne: false;
            referencedRelation: "topics";
            referencedColumns: ["id"];
          },
        ];
      };
      diagnostic_responses: {
        Row: {
          correct: boolean;
          created_at: string;
          diagnostic_attempt_id: string;
          id: string;
          question_id: string;
          section: string;
          selected_answer: string;
          topic_id: string;
        };
        Insert: {
          correct: boolean;
          created_at?: string;
          diagnostic_attempt_id: string;
          id?: string;
          question_id: string;
          section: string;
          selected_answer: string;
          topic_id: string;
        };
        Update: {
          correct?: boolean;
          created_at?: string;
          diagnostic_attempt_id?: string;
          id?: string;
          question_id?: string;
          section?: string;
          selected_answer?: string;
          topic_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "diagnostic_responses_diagnostic_attempt_id_fkey";
            columns: ["diagnostic_attempt_id"];
            isOneToOne: false;
            referencedRelation: "diagnostic_attempts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "diagnostic_responses_question_id_fkey";
            columns: ["question_id"];
            isOneToOne: false;
            referencedRelation: "diagnostic_question_keys";
            referencedColumns: ["question_id"];
          },
          {
            foreignKeyName: "diagnostic_responses_topic_id_fkey";
            columns: ["topic_id"];
            isOneToOne: false;
            referencedRelation: "topics";
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
      problem_reviews: {
        Row: {
          created_at: string;
          easiness_factor: number;
          failure_streak: number;
          interval_days: number;
          last_performance_score: number;
          last_reviewed_at: string | null;
          next_review_at: string;
          problem_id: string;
          repetition: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          easiness_factor?: number;
          failure_streak?: number;
          interval_days: number;
          last_performance_score: number;
          last_reviewed_at?: string | null;
          next_review_at: string;
          problem_id: string;
          repetition?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          easiness_factor?: number;
          failure_streak?: number;
          interval_days?: number;
          last_performance_score?: number;
          last_reviewed_at?: string | null;
          next_review_at?: string;
          problem_id?: string;
          repetition?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "problem_reviews_problem_id_fkey";
            columns: ["problem_id"];
            isOneToOne: false;
            referencedRelation: "problems";
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
          diagnostic_completed: boolean;
          diagnostic_completed_at: string | null;
          diagnostic_level: string | null;
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
          diagnostic_completed?: boolean;
          diagnostic_completed_at?: string | null;
          diagnostic_level?: string | null;
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
          diagnostic_completed?: boolean;
          diagnostic_completed_at?: string | null;
          diagnostic_level?: string | null;
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
      review_events: {
        Row: {
          attempt_id: string;
          attempt_mode: string;
          created_at: string;
          easiness_factor: number;
          failure_streak: number;
          help_level: string;
          id: string;
          interval_days: number;
          next_review_at: string;
          performance_score: number;
          previous_interval_days: number | null;
          problem_id: string;
          quality_score: number;
          repetition: number;
          result: string;
          reviewed_at: string;
          user_id: string;
        };
        Insert: {
          attempt_id: string;
          attempt_mode: string;
          created_at?: string;
          easiness_factor: number;
          failure_streak: number;
          help_level: string;
          id?: string;
          interval_days: number;
          next_review_at: string;
          performance_score: number;
          previous_interval_days?: number | null;
          problem_id: string;
          quality_score: number;
          repetition: number;
          result: string;
          reviewed_at: string;
          user_id: string;
        };
        Update: {
          attempt_id?: string;
          attempt_mode?: string;
          created_at?: string;
          easiness_factor?: number;
          failure_streak?: number;
          help_level?: string;
          id?: string;
          interval_days?: number;
          next_review_at?: string;
          performance_score?: number;
          previous_interval_days?: number | null;
          problem_id?: string;
          quality_score?: number;
          repetition?: number;
          result?: string;
          reviewed_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "review_events_attempt_id_fkey";
            columns: ["attempt_id"];
            isOneToOne: true;
            referencedRelation: "attempts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "review_events_problem_id_fkey";
            columns: ["problem_id"];
            isOneToOne: false;
            referencedRelation: "problems";
            referencedColumns: ["id"];
          },
        ];
      };
      topic_mastery: {
        Row: {
          complexity_score: number;
          correctness_score: number;
          created_at: string;
          diagnostic_initialized_at: string | null;
          diagnostic_score: number | null;
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
          diagnostic_initialized_at?: string | null;
          diagnostic_score?: number | null;
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
          diagnostic_initialized_at?: string | null;
          diagnostic_score?: number | null;
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
      begin_diagnostic: { Args: { p_answers: Json }; Returns: string };
      complete_diagnostic: {
        Args: { p_answers: Json; p_attempt_id: string };
        Returns: undefined;
      };
      replace_daily_plan: {
        Args: {
          p_available_minutes: number;
          p_items: Json;
          p_local_date: string;
        };
        Returns: string;
      };
      set_daily_plan_item_completed: {
        Args: { p_completed: boolean; p_item_id: string };
        Returns: undefined;
      };
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
