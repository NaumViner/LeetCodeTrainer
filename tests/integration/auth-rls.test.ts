import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { Database } from "../../src/types/database";

type LocalStatus = {
  API_URL: string;
  ANON_KEY?: string;
  PUBLISHABLE_KEY?: string;
  SECRET_KEY?: string;
  SERVICE_ROLE_KEY?: string;
};

const password = "PhaseTwoTest123";

function readLocalStatus(): LocalStatus {
  const cliPath = resolve(
    process.cwd(),
    "node_modules/supabase/dist/supabase.js",
  );
  const output = execFileSync(
    process.execPath,
    [cliPath, "status", "-o", "json"],
    {
      cwd: process.cwd(),
      encoding: "utf8",
    },
  );

  return JSON.parse(output) as LocalStatus;
}

function testClient(url: string, key: string) {
  return createClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

describe.sequential("Supabase authentication and profile RLS", () => {
  let admin: SupabaseClient<Database>;
  let anonymous: SupabaseClient<Database>;
  let learnerA: SupabaseClient<Database>;
  let learnerB: SupabaseClient<Database>;
  let learnerAId = "";
  let learnerBId = "";
  let learnerAEmail = "";

  beforeAll(async () => {
    const status = readLocalStatus();
    const publicKey = status.PUBLISHABLE_KEY ?? status.ANON_KEY;
    const secretKey = status.SECRET_KEY ?? status.SERVICE_ROLE_KEY;

    if (!publicKey || !secretKey) {
      throw new Error("The local Supabase stack did not expose test API keys.");
    }

    admin = testClient(status.API_URL, secretKey);
    anonymous = testClient(status.API_URL, publicKey);
    learnerA = testClient(status.API_URL, publicKey);
    learnerB = testClient(status.API_URL, publicKey);

    const suffix = randomUUID();
    learnerAEmail = `phase2-a-${suffix}@example.com`;
    const learnerBEmail = `phase2-b-${suffix}@example.com`;

    const [{ data: dataA, error: errorA }, { data: dataB, error: errorB }] =
      await Promise.all([
        learnerA.auth.signUp({
          email: learnerAEmail,
          options: { data: { display_name: "Learner A" } },
          password,
        }),
        learnerB.auth.signUp({
          email: learnerBEmail,
          options: { data: { display_name: "Learner B" } },
          password,
        }),
      ]);

    if (errorA || errorB || !dataA.user || !dataB.user) {
      throw new Error(
        errorA?.message ?? errorB?.message ?? "Test users were not created.",
      );
    }

    learnerAId = dataA.user.id;
    learnerBId = dataB.user.id;
  });

  afterAll(async () => {
    await Promise.all(
      [learnerAId, learnerBId]
        .filter(Boolean)
        .map((userId) => admin.auth.admin.deleteUser(userId)),
    );
  });

  it("creates one private profile per signup", async () => {
    const { data, error } = await learnerA
      .from("profiles")
      .select("id, display_name");

    expect(error).toBeNull();
    expect(data).toEqual([{ display_name: "Learner A", id: learnerAId }]);
  });

  it("prevents a learner from reading or updating another profile", async () => {
    const { data: readData, error: readError } = await learnerA
      .from("profiles")
      .select("id")
      .eq("id", learnerBId);
    const { data: updateData, error: updateError } = await learnerA
      .from("profiles")
      .update({ display_name: "Compromised" })
      .eq("id", learnerBId)
      .select("id");

    expect(readError).toBeNull();
    expect(readData).toEqual([]);
    expect(updateError).toBeNull();
    expect(updateData).toEqual([]);
  });

  it("persists an owned profile across logout and login", async () => {
    const { error: updateError } = await learnerA
      .from("profiles")
      .update({
        display_name: "Ada Persisted",
        onboarding_completed: true,
        target_companies: ["Google", "Microsoft"],
      })
      .eq("id", learnerAId);

    expect(updateError).toBeNull();
    expect((await learnerA.auth.signOut({ scope: "local" })).error).toBeNull();
    expect((await learnerA.auth.getSession()).data.session).toBeNull();

    const { error: loginError } = await learnerA.auth.signInWithPassword({
      email: learnerAEmail,
      password,
    });
    expect(loginError).toBeNull();

    const { data, error } = await learnerA
      .from("profiles")
      .select("display_name, onboarding_completed, target_companies")
      .single();

    expect(error).toBeNull();
    expect(data).toEqual({
      display_name: "Ada Persisted",
      onboarding_completed: true,
      target_companies: ["Google", "Microsoft"],
    });
  });

  it("denies profile reads to signed-out clients", async () => {
    const { data, error } = await anonymous.from("profiles").select("id");

    expect(data).toBeNull();
    expect(error?.code).toBe("42501");
  });
});
