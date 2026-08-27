import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { Database, Json } from "../../src/types/database";

type LocalStatus = {
  API_URL: string;
  ANON_KEY?: string;
  PUBLISHABLE_KEY?: string;
  SECRET_KEY?: string;
  SERVICE_ROLE_KEY?: string;
};

function localStatus(): LocalStatus {
  const cliPath = resolve(
    process.cwd(),
    "node_modules/supabase/dist/supabase.js",
  );
  return JSON.parse(
    execFileSync(process.execPath, [cliPath, "status", "-o", "json"], {
      cwd: process.cwd(),
      encoding: "utf8",
    }),
  ) as LocalStatus;
}

function client(url: string, key: string) {
  return createClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

describe.sequential("daily-plan persistence and isolation", () => {
  let admin: SupabaseClient<Database>;
  let anonymous: SupabaseClient<Database>;
  let learner: SupabaseClient<Database>;
  let other: SupabaseClient<Database>;
  let learnerId = "";
  let otherId = "";
  let lessonId = "";
  let problemId = "";
  let planId = "";
  let itemIds: string[] = [];
  const localDate = new Date().toISOString().slice(0, 10);

  beforeAll(async () => {
    const status = localStatus();
    const publicKey = status.PUBLISHABLE_KEY ?? status.ANON_KEY;
    const secretKey = status.SECRET_KEY ?? status.SERVICE_ROLE_KEY;
    if (!publicKey || !secretKey)
      throw new Error("Local API keys are missing.");
    admin = client(status.API_URL, secretKey);
    anonymous = client(status.API_URL, publicKey);
    learner = client(status.API_URL, publicKey);
    other = client(status.API_URL, publicKey);
    const [first, second] = await Promise.all([
      learner.auth.signUp({
        email: `plan-${randomUUID()}@example.com`,
        password: "DailyPlan123",
      }),
      other.auth.signUp({
        email: `plan-other-${randomUUID()}@example.com`,
        password: "DailyPlan123",
      }),
    ]);
    if (!first.data.user || !second.data.user)
      throw new Error("Test users failed.");
    learnerId = first.data.user.id;
    otherId = second.data.user.id;
    const [{ data: lesson }, { data: problem }] = await Promise.all([
      learner.from("lessons").select("id").limit(1).single(),
      learner.from("problems").select("id").limit(1).single(),
    ]);
    if (!lesson || !problem) throw new Error("Plan entities are missing.");
    lessonId = lesson.id;
    problemId = problem.id;
  });

  afterAll(async () => {
    await Promise.all(
      [learnerId, otherId]
        .filter(Boolean)
        .map((id) => admin.auth.admin.deleteUser(id)),
    );
  });

  it("atomically creates a private three-item plan", async () => {
    const { data, error } = await learner.rpc("replace_daily_plan", {
      p_available_minutes: 60,
      p_items: planItems(lessonId, problemId) as Json,
      p_local_date: localDate,
    });
    expect(error).toBeNull();
    planId = data!;

    const [{ data: plan }, { data: items }] = await Promise.all([
      learner.from("daily_plans").select("*").eq("id", planId).single(),
      learner
        .from("daily_plan_items")
        .select("*")
        .eq("daily_plan_id", planId)
        .order("position"),
    ]);
    expect(plan).toMatchObject({
      available_minutes: 60,
      generation: 1,
      local_date: localDate,
      status: "active",
      user_id: learnerId,
    });
    expect(items).toHaveLength(3);
    expect(items?.reduce((sum, item) => sum + item.estimated_minutes, 0)).toBe(
      60,
    );
    itemIds = (items ?? []).map((item) => item.id);
  });

  it("completes, reopens, and regenerates without mutating old versions", async () => {
    for (const itemId of itemIds) {
      const { error } = await learner.rpc("set_daily_plan_item_completed", {
        p_completed: true,
        p_item_id: itemId,
      });
      expect(error).toBeNull();
    }
    expect(
      (
        await learner
          .from("daily_plans")
          .select("status")
          .eq("id", planId)
          .single()
      ).data?.status,
    ).toBe("completed");

    await learner.rpc("set_daily_plan_item_completed", {
      p_completed: false,
      p_item_id: itemIds[0]!,
    });
    expect(
      (
        await learner
          .from("daily_plans")
          .select("status")
          .eq("id", planId)
          .single()
      ).data?.status,
    ).toBe("active");

    const { data: replacement, error } = await learner.rpc(
      "replace_daily_plan",
      {
        p_available_minutes: 45,
        p_items: planItems(lessonId, problemId, 15) as Json,
        p_local_date: localDate,
      },
    );
    expect(error).toBeNull();
    expect(replacement).not.toBe(planId);
    const { data: plans } = await learner
      .from("daily_plans")
      .select("id, generation, status")
      .eq("local_date", localDate)
      .order("generation");
    expect(plans).toEqual([
      { generation: 1, id: planId, status: "expired" },
      { generation: 2, id: replacement, status: "active" },
    ]);
  });

  it("denies anonymous, cross-learner, and direct browser mutations", async () => {
    expect((await other.from("daily_plans").select("*")).data).toEqual([]);
    expect((await other.from("daily_plan_items").select("*")).data).toEqual([]);
    const { error: crossUserError } = await other.rpc(
      "set_daily_plan_item_completed",
      { p_completed: true, p_item_id: itemIds[0]! },
    );
    expect(crossUserError).not.toBeNull();
    const { error: directInsertError } = await learner
      .from("daily_plans")
      .insert({
        available_minutes: 60,
        local_date: localDate,
        user_id: learnerId,
      });
    expect(directInsertError?.code).toBe("42501");
    const { data: anonymousRows, error: anonymousError } = await anonymous
      .from("daily_plans")
      .select("*");
    expect(anonymousRows).toBeNull();
    expect(anonymousError?.code).toBe("42501");
  });
});

function planItems(lessonId: string, problemId: string, minutes = 20) {
  return [
    {
      action_path: "/learn/topic/lesson",
      entity_id: lessonId,
      estimated_minutes: minutes,
      position: 1,
      priority: 80,
      reason: "Continue the ordered curriculum.",
      title: "Learn: Foundation",
      type: "lesson",
    },
    {
      action_path: "/practice?problem=1",
      entity_id: problemId,
      estimated_minutes: minutes,
      position: 2,
      priority: 70,
      reason: "Practice at the current difficulty.",
      title: "Practice: Two Sum",
      type: "problem",
    },
    {
      action_path: "/history",
      entity_id: null,
      estimated_minutes: minutes,
      position: 3,
      priority: 40,
      reason: "Consolidate today's learning.",
      title: "Reflection and recall check",
      type: "reflection",
    },
  ];
}
