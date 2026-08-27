import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type DailyPlanRow = Tables<"daily_plans">;
export type DailyPlanItemRow = Tables<"daily_plan_items">;

export type DailyPlanWithItems = DailyPlanRow & {
  items: DailyPlanItemRow[];
};

export async function getDailyPlan(
  userId: string,
  localDate: string,
): Promise<DailyPlanWithItems | null> {
  const supabase = await createClient();
  const { data: plan, error } = await supabase
    .from("daily_plans")
    .select("*")
    .eq("user_id", userId)
    .eq("local_date", localDate)
    .neq("status", "expired")
    .order("generation", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error("Today's plan could not be loaded.");
  if (!plan) return null;

  const { data: items, error: itemError } = await supabase
    .from("daily_plan_items")
    .select("*")
    .eq("daily_plan_id", plan.id)
    .order("position");
  if (itemError) throw new Error("Today's plan items could not be loaded.");
  return { ...plan, items: items ?? [] };
}

export function dailyPlanProgress(plan: DailyPlanWithItems) {
  const completed = plan.items.filter((item) => item.completed).length;
  return {
    completed,
    percent:
      plan.items.length === 0 ? 0 : (completed / plan.items.length) * 100,
    total: plan.items.length,
  };
}
