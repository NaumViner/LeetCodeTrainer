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
      ai_coach_interactions: {
        Row: {
          attempt_id: string;
          created_at: string;
          error_code: string | null;
          id: string;
          input_tokens: number;
          interaction_type: string;
          model: string;
          output_tokens: number;
          provider: string;
          response: Json | null;
          status: string;
          total_tokens: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          attempt_id: string;
          created_at?: string;
          error_code?: string | null;
          id?: string;
          input_tokens?: number;
          interaction_type: string;
          model: string;
          output_tokens?: number;
          provider: string;
          response?: Json | null;
          status?: string;
          total_tokens?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          attempt_id?: string;
          created_at?: string;
          error_code?: string | null;
          id?: string;
          input_tokens?: number;
          interaction_type?: string;
          model?: string;
          output_tokens?: number;
          provider?: string;
          response?: Json | null;
          status?: string;
          total_tokens?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ai_coach_interactions_attempt_id_fkey";
            columns: ["attempt_id"];
            isOneToOne: false;
            referencedRelation: "attempts";
            referencedColumns: ["id"];
          },
        ];
      };
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
      mock_interview_code_submissions: {
        Row: {
          code_snapshot: string;
          coding_language: string;
          elapsed_seconds: number;
          id: string;
          mock_interview_id: string;
          phase: string;
          snapshot_version: number;
          submission_kind: string;
          submitted_at: string;
          user_id: string;
        };
        Insert: {
          code_snapshot: string;
          coding_language: string;
          elapsed_seconds: number;
          id?: string;
          mock_interview_id: string;
          phase: string;
          snapshot_version: number;
          submission_kind: string;
          submitted_at?: string;
          user_id: string;
        };
        Update: {
          code_snapshot?: string;
          coding_language?: string;
          elapsed_seconds?: number;
          id?: string;
          mock_interview_id?: string;
          phase?: string;
          snapshot_version?: number;
          submission_kind?: string;
          submitted_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "mock_interview_code_submissions_mock_interview_id_fkey";
            columns: ["mock_interview_id"];
            isOneToOne: false;
            referencedRelation: "mock_interviews";
            referencedColumns: ["id"];
          },
        ];
      };
      mock_interview_evaluations: {
        Row: {
          completed_at: string | null;
          confidence: number | null;
          created_at: string;
          dimensions: Json | null;
          error_code: string | null;
          evaluation_version: number;
          evidence_coverage: Json | null;
          evidence_version: number;
          id: string;
          improvements: string[];
          input_tokens: number;
          is_current: boolean;
          mock_interview_id: string;
          model: string;
          output_tokens: number;
          provider: string;
          raw_score: number | null;
          recommended_actions: Json | null;
          recurring_signals: string[];
          source_difficulty: string;
          source_duration_minutes: number;
          source_interview_language: string;
          source_interviewer_level: string;
          status: string;
          strengths: string[];
          summary: string | null;
          total_tokens: number;
          user_id: string;
          version: number;
        };
        Insert: {
          completed_at?: string | null;
          confidence?: number | null;
          created_at?: string;
          dimensions?: Json | null;
          error_code?: string | null;
          evaluation_version: number;
          evidence_coverage?: Json | null;
          evidence_version: number;
          id?: string;
          improvements?: string[];
          input_tokens?: number;
          is_current?: boolean;
          mock_interview_id: string;
          model: string;
          output_tokens?: number;
          provider: string;
          raw_score?: number | null;
          recommended_actions?: Json | null;
          recurring_signals?: string[];
          source_difficulty: string;
          source_duration_minutes: number;
          source_interview_language?: string;
          source_interviewer_level: string;
          status?: string;
          strengths?: string[];
          summary?: string | null;
          total_tokens?: number;
          user_id: string;
          version: number;
        };
        Update: {
          completed_at?: string | null;
          confidence?: number | null;
          created_at?: string;
          dimensions?: Json | null;
          error_code?: string | null;
          evaluation_version?: number;
          evidence_coverage?: Json | null;
          evidence_version?: number;
          id?: string;
          improvements?: string[];
          input_tokens?: number;
          is_current?: boolean;
          mock_interview_id?: string;
          model?: string;
          output_tokens?: number;
          provider?: string;
          raw_score?: number | null;
          recommended_actions?: Json | null;
          recurring_signals?: string[];
          source_difficulty?: string;
          source_duration_minutes?: number;
          source_interview_language?: string;
          source_interviewer_level?: string;
          status?: string;
          strengths?: string[];
          summary?: string | null;
          total_tokens?: number;
          user_id?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "mock_interview_evaluations_mock_interview_id_fkey";
            columns: ["mock_interview_id"];
            isOneToOne: false;
            referencedRelation: "mock_interviews";
            referencedColumns: ["id"];
          },
        ];
      };
      mock_interview_phase_events: {
        Row: {
          code_submission_ids: string[];
          created_at: string;
          display_summary: string | null;
          evidence_event_ids: number[];
          evidence_fields: string[];
          id: string;
          mock_interview_id: string;
          model: string | null;
          phase: string;
          provider: string | null;
          reason_code: string | null;
          source: string;
          suggested_phase: string | null;
          transition_type: string;
          user_id: string;
        };
        Insert: {
          code_submission_ids?: string[];
          created_at?: string;
          display_summary?: string | null;
          evidence_event_ids?: number[];
          evidence_fields?: string[];
          id?: string;
          mock_interview_id: string;
          model?: string | null;
          phase: string;
          provider?: string | null;
          reason_code?: string | null;
          source: string;
          suggested_phase?: string | null;
          transition_type: string;
          user_id: string;
        };
        Update: {
          code_submission_ids?: string[];
          created_at?: string;
          display_summary?: string | null;
          evidence_event_ids?: number[];
          evidence_fields?: string[];
          id?: string;
          mock_interview_id?: string;
          model?: string | null;
          phase?: string;
          provider?: string | null;
          reason_code?: string | null;
          source?: string;
          suggested_phase?: string | null;
          transition_type?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "mock_interview_phase_events_mock_interview_id_fkey";
            columns: ["mock_interview_id"];
            isOneToOne: false;
            referencedRelation: "mock_interviews";
            referencedColumns: ["id"];
          },
        ];
      };
      mock_interview_scorecards: {
        Row: {
          approach_quality: number;
          clarification: number;
          code_quality: number;
          communication: number;
          complexity_reasoning: number;
          correctness: number;
          created_at: string;
          improvements: string[];
          independence: number;
          mock_interview_id: string;
          optimization: number;
          overall_score: number;
          problem_understanding: number;
          strengths: string[];
          testing: number;
          topic_id: string;
          user_id: string;
        };
        Insert: {
          approach_quality: number;
          clarification: number;
          code_quality: number;
          communication: number;
          complexity_reasoning: number;
          correctness: number;
          created_at?: string;
          improvements?: string[];
          independence: number;
          mock_interview_id: string;
          optimization: number;
          overall_score: number;
          problem_understanding: number;
          strengths?: string[];
          testing: number;
          topic_id: string;
          user_id: string;
        };
        Update: {
          approach_quality?: number;
          clarification?: number;
          code_quality?: number;
          communication?: number;
          complexity_reasoning?: number;
          correctness?: number;
          created_at?: string;
          improvements?: string[];
          independence?: number;
          mock_interview_id?: string;
          optimization?: number;
          overall_score?: number;
          problem_understanding?: number;
          strengths?: string[];
          testing?: number;
          topic_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "mock_interview_scorecards_mock_interview_id_fkey";
            columns: ["mock_interview_id"];
            isOneToOne: true;
            referencedRelation: "mock_interviews";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mock_interview_scorecards_topic_id_fkey";
            columns: ["topic_id"];
            isOneToOne: false;
            referencedRelation: "topics";
            referencedColumns: ["id"];
          },
        ];
      };
      mock_interviews: {
        Row: {
          brute_force_notes: string | null;
          clarification_notes: string | null;
          code_snapshot: string | null;
          code_submitted_at: string | null;
          code_updated_at: string | null;
          coding_language: string;
          completed_at: string | null;
          created_at: string;
          difficulty_mode: string;
          duration_minutes: number;
          elapsed_seconds: number;
          examples_notes: string | null;
          id: string;
          interview_language: string;
          interviewer_level: string;
          optimization_notes: string | null;
          phase: string;
          problem_id: string;
          question_content_version: number | null;
          requested_difficulties: string[];
          requested_topic_id: string | null;
          result: string | null;
          retrospective: string | null;
          scratchpad: string | null;
          selected_topic_id: string;
          selection_algorithm_version: number;
          selection_metadata: Json;
          selection_mode: string;
          started_at: string;
          status: string;
          submitted_space_complexity: string | null;
          submitted_time_complexity: string | null;
          testing_notes: string | null;
          timer_running: boolean;
          updated_at: string;
          user_id: string;
          voice_activated_at: string | null;
          voice_activation_deadline: string | null;
          voice_last_heartbeat_at: string | null;
          voice_required: boolean;
          workspace_updated_at: string | null;
          workspace_version: number;
        };
        Insert: {
          brute_force_notes?: string | null;
          clarification_notes?: string | null;
          code_snapshot?: string | null;
          code_submitted_at?: string | null;
          code_updated_at?: string | null;
          coding_language?: string;
          completed_at?: string | null;
          created_at?: string;
          difficulty_mode: string;
          duration_minutes: number;
          elapsed_seconds?: number;
          examples_notes?: string | null;
          id?: string;
          interview_language?: string;
          interviewer_level?: string;
          optimization_notes?: string | null;
          phase?: string;
          problem_id: string;
          question_content_version?: number | null;
          requested_difficulties?: string[];
          requested_topic_id?: string | null;
          result?: string | null;
          retrospective?: string | null;
          scratchpad?: string | null;
          selected_topic_id: string;
          selection_algorithm_version?: number;
          selection_metadata?: Json;
          selection_mode?: string;
          started_at?: string;
          status?: string;
          submitted_space_complexity?: string | null;
          submitted_time_complexity?: string | null;
          testing_notes?: string | null;
          timer_running?: boolean;
          updated_at?: string;
          user_id: string;
          voice_activated_at?: string | null;
          voice_activation_deadline?: string | null;
          voice_last_heartbeat_at?: string | null;
          voice_required?: boolean;
          workspace_updated_at?: string | null;
          workspace_version?: number;
        };
        Update: {
          brute_force_notes?: string | null;
          clarification_notes?: string | null;
          code_snapshot?: string | null;
          code_submitted_at?: string | null;
          code_updated_at?: string | null;
          coding_language?: string;
          completed_at?: string | null;
          created_at?: string;
          difficulty_mode?: string;
          duration_minutes?: number;
          elapsed_seconds?: number;
          examples_notes?: string | null;
          id?: string;
          interview_language?: string;
          interviewer_level?: string;
          optimization_notes?: string | null;
          phase?: string;
          problem_id?: string;
          question_content_version?: number | null;
          requested_difficulties?: string[];
          requested_topic_id?: string | null;
          result?: string | null;
          retrospective?: string | null;
          scratchpad?: string | null;
          selected_topic_id?: string;
          selection_algorithm_version?: number;
          selection_metadata?: Json;
          selection_mode?: string;
          started_at?: string;
          status?: string;
          submitted_space_complexity?: string | null;
          submitted_time_complexity?: string | null;
          testing_notes?: string | null;
          timer_running?: boolean;
          updated_at?: string;
          user_id?: string;
          voice_activated_at?: string | null;
          voice_activation_deadline?: string | null;
          voice_last_heartbeat_at?: string | null;
          voice_required?: boolean;
          workspace_updated_at?: string | null;
          workspace_version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "mock_interviews_problem_id_fkey";
            columns: ["problem_id"];
            isOneToOne: false;
            referencedRelation: "problems";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mock_interviews_requested_topic_id_fkey";
            columns: ["requested_topic_id"];
            isOneToOne: false;
            referencedRelation: "topics";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mock_interviews_selected_topic_id_fkey";
            columns: ["selected_topic_id"];
            isOneToOne: false;
            referencedRelation: "topics";
            referencedColumns: ["id"];
          },
        ];
      };
      problem_collection_memberships: {
        Row: {
          collection_id: string;
          created_at: string;
          ordinal: number;
          primary_topic_id: string;
          problem_id: string;
        };
        Insert: {
          collection_id: string;
          created_at?: string;
          ordinal: number;
          primary_topic_id: string;
          problem_id: string;
        };
        Update: {
          collection_id?: string;
          created_at?: string;
          ordinal?: number;
          primary_topic_id?: string;
          problem_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "problem_collection_memberships_collection_id_fkey";
            columns: ["collection_id"];
            isOneToOne: false;
            referencedRelation: "problem_collections";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "problem_collection_memberships_primary_topic_id_fkey";
            columns: ["primary_topic_id"];
            isOneToOne: false;
            referencedRelation: "topics";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "problem_collection_memberships_problem_id_fkey";
            columns: ["problem_id"];
            isOneToOne: false;
            referencedRelation: "problems";
            referencedColumns: ["id"];
          },
        ];
      };
      problem_collections: {
        Row: {
          active: boolean;
          created_at: string;
          expected_primary_topic_count: number;
          expected_problem_count: number;
          id: string;
          name: string;
          slug: string;
          version: number;
        };
        Insert: {
          active?: boolean;
          created_at?: string;
          expected_primary_topic_count: number;
          expected_problem_count: number;
          id?: string;
          name: string;
          slug: string;
          version: number;
        };
        Update: {
          active?: boolean;
          created_at?: string;
          expected_primary_topic_count?: number;
          expected_problem_count?: number;
          id?: string;
          name?: string;
          slug?: string;
          version?: number;
        };
        Relationships: [];
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
          interview_content_provenance: string | null;
          interview_content_version: number | null;
          interview_ready: boolean;
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
          interview_content_provenance?: string | null;
          interview_content_version?: number | null;
          interview_ready?: boolean;
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
          interview_content_provenance?: string | null;
          interview_content_version?: number | null;
          interview_ready?: boolean;
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
      realtime_interview_events: {
        Row: {
          content: string;
          created_at: string;
          event_type: string;
          id: number;
          phase: string | null;
          session_id: string;
          user_id: string;
        };
        Insert: {
          content: string;
          created_at?: string;
          event_type: string;
          id?: never;
          phase?: string | null;
          session_id: string;
          user_id: string;
        };
        Update: {
          content?: string;
          created_at?: string;
          event_type?: string;
          id?: never;
          phase?: string | null;
          session_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "realtime_interview_events_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "realtime_interview_sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      realtime_interview_sessions: {
        Row: {
          connected_at: string;
          created_at: string;
          ended_at: string | null;
          id: string;
          mock_interview_id: string;
          model: string;
          provider: string;
          provider_call_id: string | null;
          status: string;
          summary: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          connected_at?: string;
          created_at?: string;
          ended_at?: string | null;
          id?: string;
          mock_interview_id: string;
          model: string;
          provider: string;
          provider_call_id?: string | null;
          status?: string;
          summary?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          connected_at?: string;
          created_at?: string;
          ended_at?: string | null;
          id?: string;
          mock_interview_id?: string;
          model?: string;
          provider?: string;
          provider_call_id?: string | null;
          status?: string;
          summary?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "realtime_interview_sessions_mock_interview_id_fkey";
            columns: ["mock_interview_id"];
            isOneToOne: true;
            referencedRelation: "mock_interviews";
            referencedColumns: ["id"];
          },
        ];
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
          last_interviewed_at: string | null;
          last_practiced_at: string | null;
          mock_interview_count: number;
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
          last_interviewed_at?: string | null;
          last_practiced_at?: string | null;
          mock_interview_count?: number;
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
          last_interviewed_at?: string | null;
          last_practiced_at?: string | null;
          mock_interview_count?: number;
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
      activate_voice_mock_interview: {
        Args: { p_mock_interview_id: string };
        Returns: Json;
      };
      abandon_mock_interview: {
        Args: { p_mock_interview_id: string };
        Returns: undefined;
      };
      advance_mock_interview: {
        Args: {
          p_elapsed_seconds: number;
          p_mock_interview_id: string;
          p_payload: Json;
          p_target_phase: string;
        };
        Returns: undefined;
      };
      append_realtime_interview_event: {
        Args: {
          p_content: string;
          p_event_type: string;
          p_mock_interview_id: string;
          p_phase: string;
        };
        Returns: number;
      };
      begin_diagnostic: { Args: { p_answers: Json }; Returns: string };
      begin_realtime_interview_session: {
        Args: {
          p_mock_interview_id: string;
          p_model: string;
          p_provider: string;
          p_provider_call_id?: string;
        };
        Returns: string;
      };
      complete_diagnostic: {
        Args: { p_answers: Json; p_attempt_id: string };
        Returns: undefined;
      };
      cancel_pending_voice_interview: {
        Args: { p_mock_interview_id: string };
        Returns: undefined;
      };
      complete_mock_interview: {
        Args: {
          p_code_quality_rating: number;
          p_communication_rating: number;
          p_complexity_rating: number;
          p_elapsed_seconds: number;
          p_independence_rating: number;
          p_mock_interview_id: string;
          p_result: string;
          p_retrospective: string;
        };
        Returns: undefined;
      };
      delete_owned_mock_interview: {
        Args: { p_mock_interview_id: string };
        Returns: string;
      };
      end_realtime_interview_session: {
        Args: {
          p_mock_interview_id: string;
          p_status: string;
          p_summary?: string;
        };
        Returns: undefined;
      };
      finalize_mock_interview_evaluation: {
        Args: {
          p_confidence: number;
          p_dimensions: Json;
          p_error_code: string;
          p_evaluation_id: string;
          p_evidence_coverage: Json;
          p_improvements: string[];
          p_input_tokens: number;
          p_output_tokens: number;
          p_raw_score: number;
          p_recommended_actions: Json;
          p_recurring_signals: string[];
          p_status: string;
          p_strengths: string[];
          p_summary: string;
          p_total_tokens: number;
        };
        Returns: undefined;
      };
      finish_ai_coach_interaction: {
        Args: {
          p_error_code?: string;
          p_input_tokens: number;
          p_interaction_id: string;
          p_output_tokens: number;
          p_response: Json;
          p_status: string;
          p_total_tokens: number;
        };
        Returns: undefined;
      };
      get_active_mock_interview_id: { Args: never; Returns: string };
      get_owned_active_mock_interview: {
        Args: { p_mock_interview_id: string };
        Returns: Json;
      };
      get_recent_active_interview_transcript: {
        Args: { p_limit?: number; p_mock_interview_id: string };
        Returns: Json;
      };
      heartbeat_voice_mock_interview: {
        Args: { p_mock_interview_id: string };
        Returns: string;
      };
      mock_interview_evidence_score: {
        Args: {
          p_developing_lines: number;
          p_strong_lines: number;
          p_value: string;
        };
        Returns: number;
      };
      mock_interview_phase_summary: {
        Args: {
          p_interview: Database["public"]["Tables"]["mock_interviews"]["Row"];
          p_phase: string;
        };
        Returns: string;
      };
      recompute_topic_mastery_from_evidence: {
        Args: { p_topic_id: string; p_user_id: string };
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
      reserve_ai_coach_interaction: {
        Args: {
          p_attempt_id: string;
          p_interaction_type: string;
          p_model: string;
          p_provider: string;
        };
        Returns: string;
      };
      reserve_mock_interview_evaluation: {
        Args: {
          p_evaluation_version: number;
          p_evidence_version: number;
          p_mock_interview_id: string;
          p_model: string;
          p_provider: string;
        };
        Returns: Json;
      };
      save_mock_interview_workspace: {
        Args: {
          p_code_snapshot: string;
          p_expected_version: number;
          p_mock_interview_id: string;
          p_scratchpad: string;
        };
        Returns: number;
      };
      set_daily_plan_item_completed: {
        Args: { p_completed: boolean; p_item_id: string };
        Returns: undefined;
      };
      start_mock_interview:
        | {
            Args: {
              p_difficulty_mode: string;
              p_duration_minutes: number;
              p_problem_id: string;
            };
            Returns: string;
          }
        | {
            Args: {
              p_difficulty_mode: string;
              p_duration_minutes: number;
              p_interviewer_level: string;
              p_problem_id: string;
            };
            Returns: string;
          }
        | {
            Args: {
              p_difficulty_mode: string;
              p_duration_minutes: number;
              p_interview_language: string;
              p_interviewer_level: string;
              p_problem_id: string;
            };
            Returns: string;
          };
      start_mock_interview_v2: {
        Args: {
          p_coding_language: string;
          p_duration_minutes: number;
          p_interview_language: string;
          p_interviewer_level: string;
          p_problem_id: string;
          p_requested_difficulties: string[];
          p_requested_topic_id: string;
          p_selected_topic_id: string;
          p_selection_algorithm_version: number;
          p_selection_metadata: Json;
          p_selection_mode: string;
        };
        Returns: string;
      };
      submit_mock_interview_code: {
        Args: {
          p_advance_to_testing: boolean;
          p_code_snapshot: string;
          p_elapsed_seconds: number;
          p_expected_version: number;
          p_mock_interview_id: string;
          p_scratchpad: string;
        };
        Returns: Json;
      };
      suggest_mock_interview_phase: {
        Args: {
          p_evidence_event_ids: number[];
          p_expected_current_phase: string;
          p_mock_interview_id: string;
          p_reason_code: string;
          p_suggested_next_phase: string;
        };
        Returns: string;
      };
      valid_interview_difficulty_filter: {
        Args: { p_value: string[] };
        Returns: boolean;
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
