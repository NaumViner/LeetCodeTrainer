export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  graphql_public: {
    Tables: { [_ in never]: never };
    Views: { [_ in never]: never };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
  public: {
    Tables: {
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
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
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
      Row: infer Row;
    }
    ? Row
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer Row;
      }
      ? Row
      : never
    : never;

export type TablesUpdate<TableName extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][TableName] extends { Update: infer Update }
    ? Update
    : never;
