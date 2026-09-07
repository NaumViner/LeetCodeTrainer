import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Database } from "../../src/types/database";

describe.sequential(
  "first interview guest entitlement and account ownership",
  () => {
    let admin: SupabaseClient<Database>;
    let guest: SupabaseClient<Database>;
    let other: SupabaseClient<Database>;
    let member: SupabaseClient<Database>;
    let unsigned: SupabaseClient<Database>;
    let url: string;
    let key: string;
    let guestId: string;
    let memberId: string;
    let problem: { id: string; primary_topic_id: string };
    let interviewId: string;
    let claim: string;
    const users: string[] = [];
    const sql = (query: string) =>
      execFileSync(
        "docker",
        [
          "exec",
          "supabase_db_faang-interview-academy",
          "psql",
          "-U",
          "postgres",
          "-d",
          "postgres",
          "-At",
          "-v",
          "ON_ERROR_STOP=1",
          "-c",
          query,
        ],
        { encoding: "utf8" },
      ).trim();
    const makeClient = () =>
      createClient<Database>(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
    const start = (who: SupabaseClient<Database>) =>
      who.rpc("start_mock_interview_v2", {
        p_coding_language: "python",
        p_duration_minutes: 30,
        p_interview_language: "english",
        p_interviewer_level: "beginner",
        p_problem_id: problem.id,
        p_requested_difficulties: ["easy"],
        p_requested_topic_id: null!,
        p_selected_topic_id: problem.primary_topic_id,
        p_selection_algorithm_version: 1,
        p_selection_metadata: {},
        p_selection_mode: "coverage",
      });
    async function activate(who: SupabaseClient<Database>, id: string) {
      const attempt = randomUUID();
      expect(
        (
          await who.rpc("prepare_realtime_interview_connection", {
            p_mock_interview_id: id,
            p_connection_attempt_id: attempt,
          })
        ).error,
      ).toBeNull();
      expect(
        (
          await who.rpc("reserve_interview_voice_request", {
            p_mock_interview_id: id,
            p_connection_attempt_id: attempt,
          })
        ).data,
      ).toBe(true);
      expect(
        (
          await who.rpc("reserve_interview_voice_request", {
            p_mock_interview_id: id,
            p_connection_attempt_id: attempt,
          })
        ).data,
      ).toBe(false);
      expect(
        (
          await who.rpc("confirm_realtime_interview_connection", {
            p_mock_interview_id: id,
            p_connection_attempt_id: attempt,
            p_provider: "gemini",
            p_model: "test-live",
          })
        ).error,
      ).toBeNull();
      expect(
        (
          await who.rpc("activate_voice_mock_interview", {
            p_mock_interview_id: id,
          })
        ).error,
      ).toBeNull();
    }
    beforeAll(async () => {
      const status = JSON.parse(
        execFileSync(
          process.execPath,
          [
            resolve("node_modules/supabase/dist/supabase.js"),
            "status",
            "-o",
            "json",
          ],
          { encoding: "utf8" },
        ),
      );
      url = status.API_URL;
      key = status.PUBLISHABLE_KEY ?? status.ANON_KEY;
      admin = createClient<Database>(
        url,
        status.SECRET_KEY ?? status.SERVICE_ROLE_KEY,
        { auth: { persistSession: false, autoRefreshToken: false } },
      );
      guest = makeClient();
      other = makeClient();
      member = makeClient();
      unsigned = makeClient();
      for (const who of [guest, other]) {
        const result = await who.auth.signInAnonymously();
        expect(result.error).toBeNull();
        users.push(result.data.user!.id);
      }
      guestId = users[0]!;
      const result = await member.auth.signUp({
        email: `guest-claim-${randomUUID()}@example.com`,
        password: "GuestTest123",
      });
      expect(result.error).toBeNull();
      memberId = result.data.user!.id;
      users.push(memberId);
      await new Promise((resolve) => setTimeout(resolve, 1100));
      const catalog = await member
        .from("problems")
        .select("id, primary_topic_id")
        .eq("active", true)
        .eq("interview_ready", true)
        .eq("difficulty", "easy")
        .limit(1)
        .single();
      expect(catalog.error).toBeNull();
      problem = catalog.data!;
    });
    afterAll(async () => {
      for (const id of users) await admin.auth.admin.deleteUser(id);
    });

    it("starts without onboarding or diagnostic, serializes double clicks, and hides private data", async () => {
      const starts = await Promise.all([start(guest), start(guest)]);
      expect(starts.filter((result) => !result.error)).toHaveLength(1);
      interviewId = starts.find((result) => !result.error)!.data!;
      expect((await guest.rpc("get_guest_interview_trial")).data).toMatchObject(
        { consumed: false, interviewId },
      );
      expect(
        (
          await guest.rpc("get_owned_active_mock_interview", {
            p_mock_interview_id: interviewId,
          })
        ).data,
      ).toMatchObject({ codingLanguage: "python", voiceActivated: false });
      expect(
        (
          await other.rpc("get_owned_active_mock_interview", {
            p_mock_interview_id: interviewId,
          })
        ).data,
      ).toBeNull();
      expect(
        (await unsigned.rpc("get_guest_interview_trial")).error,
      ).not.toBeNull();
      expect(
        (await guest.rpc("begin_diagnostic", { p_answers: [] })).error,
      ).not.toBeNull();
      expect(
        (
          await guest
            .from("attempts")
            .insert({ user_id: guestId, problem_id: problem.id })
        ).error,
      ).not.toBeNull();
      expect(
        (
          await guest
            .from("profiles")
            .update({ onboarding_completed: true })
            .eq("id", guestId)
            .select("id")
        ).data,
      ).toEqual([]);
    });

    it("retries a failed provider connection without consuming the trial", async () => {
      const attempt = randomUUID();
      expect(
        (
          await guest.rpc("prepare_realtime_interview_connection", {
            p_mock_interview_id: interviewId,
            p_connection_attempt_id: attempt,
          })
        ).error,
      ).toBeNull();
      expect(
        (
          await guest.rpc("cancel_realtime_interview_connection", {
            p_mock_interview_id: interviewId,
            p_connection_attempt_id: attempt,
            p_reason_code: "provider_connection_failed",
          })
        ).data,
      ).toBe(true);
      expect((await guest.rpc("get_guest_interview_trial")).data).toMatchObject(
        { consumed: false },
      );
      expect(
        (
          await guest.rpc("abandon_mock_interview", {
            p_mock_interview_id: interviewId,
          })
        ).error,
      ).toBeNull();
      const next = await start(guest);
      expect(next.error).toBeNull();
      interviewId = next.data!;
    });

    it("consumes only on activation and prevents foreign mutation or cleanup", async () => {
      await activate(guest, interviewId);
      expect((await guest.rpc("get_guest_interview_trial")).data).toMatchObject(
        { consumed: true, interviewId },
      );
      expect(
        (
          await other.rpc("abandon_mock_interview", {
            p_mock_interview_id: interviewId,
          })
        ).error,
      ).not.toBeNull();
      expect(
        (await guest.rpc("cleanup_expired_guest_interviews")).error,
      ).not.toBeNull();
      expect(
        (
          await guest.rpc("finish_concluded_mock_interview", {
            p_mock_interview_id: interviewId,
          })
        ).error,
      ).not.toBeNull();
      expect(
        (
          await guest.rpc("append_realtime_interview_event", {
            p_mock_interview_id: interviewId,
            p_event_type: "user_transcript",
            p_phase: "intro",
            p_content: "My private interview answer.",
          })
        ).error,
      ).toBeNull();
      expect(
        (
          await guest.rpc("abandon_mock_interview", {
            p_mock_interview_id: interviewId,
          })
        ).error,
      ).toBeNull();
      expect((await start(guest)).error?.message).toContain("guest_trial_used");
      expect(
        (await other.from("mock_interviews").select("id").eq("id", interviewId))
          .data,
      ).toEqual([]);
    });

    it("requires both guest proof and a registered account, then transfers all evidence once", async () => {
      const prepared = await guest.rpc("prepare_guest_interview_claim");
      expect(prepared.error).toBeNull();
      claim = prepared.data!;
      expect(
        (await other.rpc("claim_guest_interview", { p_token: claim })).error,
      ).not.toBeNull();
      expect(
        (await member.rpc("claim_guest_interview", { p_token: "0".repeat(64) }))
          .error,
      ).not.toBeNull();
      const moved = await member.rpc("claim_guest_interview", {
        p_token: claim,
      });
      expect(moved.error).toBeNull();
      expect(moved.data).toBe(interviewId);
      expect(
        (await member.rpc("claim_guest_interview", { p_token: claim })).data,
      ).toBe(interviewId);
      expect(
        (await guest.from("mock_interviews").select("id").eq("id", interviewId))
          .data,
      ).toEqual([]);
      expect(
        (
          await member
            .from("mock_interviews")
            .select("id, user_id")
            .eq("id", interviewId)
            .single()
        ).data,
      ).toEqual({ id: interviewId, user_id: memberId });
      expect(
        sql(
          `select user_id from public.realtime_interview_events where content = 'My private interview answer.' and session_id in (select id from public.realtime_interview_sessions where mock_interview_id = '${interviewId}')`,
        ),
      ).toBe(memberId);
      expect((await guest.rpc("get_guest_interview_trial")).data).toMatchObject(
        { consumed: true, interviewId: null },
      );
      expect((await start(guest)).error?.message).toContain("guest_trial_used");
    });

    it("upgrades an anonymous identity in place and preserves the interview", async () => {
      const who = makeClient();
      const signed = await who.auth.signInAnonymously();
      expect(signed.error).toBeNull();
      const id = signed.data.user!.id;
      users.push(id);
      await new Promise((resolve) => setTimeout(resolve, 1100));
      const created = await start(who);
      expect(created.error).toBeNull();
      await activate(who, created.data!);
      expect(
        (
          await who.rpc("abandon_mock_interview", {
            p_mock_interview_id: created.data!,
          })
        ).error,
      ).toBeNull();
      // Local Auth has email confirmation disabled; production requires verification.
      const upgraded = await who.auth.updateUser({
        email: `upgrade-${randomUUID()}@example.com`,
      });
      expect(upgraded.error).toBeNull();
      expect(upgraded.data.user?.id).toBe(id);
      expect(upgraded.data.user?.is_anonymous).toBe(false);
      expect(
        (await who.auth.updateUser({ password: "UpgradeTest123" })).error,
      ).toBeNull();
      expect(
        (
          await who
            .from("mock_interviews")
            .select("id")
            .eq("id", created.data!)
            .single()
        ).data?.id,
      ).toBe(created.data);
      const another = await start(who);
      expect(another.error).toBeNull();
    });

    it("finishes after voice closes without self-ratings and transfers a finalized evaluation unchanged", async () => {
      const created = await start(other);
      expect(created.error).toBeNull();
      const id = created.data!;
      await activate(other, id);
      // Fixture represents a persisted authoritative conclusion; voice is then stale.
      sql(
        `update public.mock_interviews set phase = 'retrospective', started_at = now() - interval '20 minutes' where id = '${id}'; update public.mock_interview_conversation_state set lifecycle = 'concluding', current_phase = 'retrospective', conclusion_reason = 'enough_evidence' where mock_interview_id = '${id}'; update public.mock_interviews set voice_last_heartbeat_at = now() - interval '5 minutes' where id = '${id}'`,
      );
      expect(
        (
          await other.rpc("finish_concluded_mock_interview", {
            p_mock_interview_id: id,
          })
        ).error,
      ).toBeNull();
      expect(
        (
          await other.rpc("finish_concluded_mock_interview", {
            p_mock_interview_id: id,
          })
        ).error,
      ).toBeNull();
      expect(
        (
          await other
            .from("mock_interviews")
            .select("status, result")
            .eq("id", id)
            .single()
        ).data,
      ).toEqual({ status: "completed", result: null });
      const timing = await other
        .from("mock_interviews")
        .select("elapsed_seconds")
        .eq("id", id)
        .single();
      expect(timing.error).toBeNull();
      expect(timing.data!.elapsed_seconds).toBeGreaterThanOrEqual(1200);
      const reserved = await other.rpc("reserve_mock_interview_evaluation", {
        p_mock_interview_id: id,
        p_provider: "test",
        p_model: "test",
        p_evaluation_version: 1,
        p_evidence_version: 1,
      });
      expect(reserved.error).toBeNull();
      const evaluationId = (reserved.data as { evaluationId: string })
        .evaluationId;
      const leases = await Promise.all([
        other.rpc("reserve_interview_evaluation_request", {
          p_evaluation_id: evaluationId,
        }),
        other.rpc("reserve_interview_evaluation_request", {
          p_evaluation_id: evaluationId,
        }),
      ]);
      expect(leases.map((result) => result.data).sort()).toEqual([false, true]);
      const prepared = await other.rpc("prepare_guest_interview_claim");
      expect(prepared.error).toBeNull();
      expect(
        (await member.rpc("claim_guest_interview", { p_token: prepared.data! }))
          .error?.code,
      ).toBe("55P03");
      sql(
        `update public.mock_interview_evaluations set status = 'provisional', completed_at = now(), raw_score = 50, confidence = 0.2, summary = 'Fixture evaluation remains immutable.', dimensions = '{}', recommended_actions = '[]', evidence_coverage = '{}' where mock_interview_id = '${id}'`,
      );
      const before = sql(
        `select (to_jsonb(e) - 'user_id')::text from public.mock_interview_evaluations e where mock_interview_id = '${id}'`,
      );
      expect(
        (await member.rpc("claim_guest_interview", { p_token: prepared.data! }))
          .error,
      ).toBeNull();
      expect(
        sql(
          `select (to_jsonb(e) - 'user_id')::text from public.mock_interview_evaluations e where mock_interview_id = '${id}'`,
        ),
      ).toBe(before);
      expect(
        (
          await member
            .from("mock_interview_evaluations")
            .select("user_id")
            .eq("mock_interview_id", id)
            .single()
        ).data?.user_id,
      ).toBe(memberId);
    });

    it("counts parallel pending voice allocations before any transport activates", async () => {
      const participants: {
        who: SupabaseClient<Database>;
        id: string;
        attempt: string;
      }[] = [];
      for (let index = 0; index < 6; index++) {
        const who = makeClient();
        const signed = await who.auth.signInAnonymously();
        expect(signed.error).toBeNull();
        users.push(signed.data.user!.id);
        participants.push({ who, id: "", attempt: randomUUID() });
      }
      await new Promise((resolve) => setTimeout(resolve, 1100));
      for (const participant of participants) {
        const created = await start(participant.who);
        expect(created.error).toBeNull();
        participant.id = created.data!;
        expect(
          (
            await participant.who.rpc("prepare_realtime_interview_connection", {
              p_mock_interview_id: participant.id,
              p_connection_attempt_id: participant.attempt,
            })
          ).error,
        ).toBeNull();
      }
      const reservations = await Promise.all(
        participants.map((participant) =>
          participant.who.rpc("reserve_interview_voice_request", {
            p_mock_interview_id: participant.id,
            p_connection_attempt_id: participant.attempt,
          }),
        ),
      );
      expect(reservations.every((result) => !result.error)).toBe(true);
      expect(
        reservations.filter((result) => result.data === true),
      ).toHaveLength(5);
      expect(
        reservations.filter((result) => result.data === false),
      ).toHaveLength(1);
      for (const participant of participants)
        expect(
          (
            await participant.who.rpc("abandon_mock_interview", {
              p_mock_interview_id: participant.id,
            })
          ).error,
        ).toBeNull();
    });

    it("cleanup removes expired guest content but retains consumed trial accounting", async () => {
      const who = makeClient();
      const signed = await who.auth.signInAnonymously();
      expect(signed.error).toBeNull();
      const userId = signed.data.user!.id;
      users.push(userId);
      await new Promise((resolve) => setTimeout(resolve, 1100));
      const created = await start(who);
      expect(created.error).toBeNull();
      const id = created.data!;
      await activate(who, id);
      expect(
        (await who.rpc("abandon_mock_interview", { p_mock_interview_id: id }))
          .error,
      ).toBeNull();
      sql(
        `update public.mock_interviews set completed_at = now() - interval '8 days' where id = '${id}'`,
      );
      expect(
        (await admin.rpc("cleanup_expired_guest_interviews")).error,
      ).toBeNull();
      expect((await who.rpc("get_guest_interview_trial")).data).toMatchObject({
        consumed: true,
        interviewId: null,
      });
      expect((await start(who)).error?.message).toContain("guest_trial_used");
    });
  },
);
