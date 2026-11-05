// SYNTHETIC HTTP only. Actual ApplicationSession, retained cookie, fixed raw factories,
// and positive Root parsing/mapping execute. No listener, provider or browser.
import test from "node:test";
import assert from "node:assert/strict";
import { createApplicationSession } from "../src/app/session.ts";
import { createAdvisorGuidanceAdapters } from "../src/features/advisor/guidance/adapters.ts";
const actor = "11111111-1111-4111-8111-111111111111",
  client = "22222222-2222-4222-8222-222222222222";
async function fixture(t) {
  let response = { status: "absent" },
    status = 200,
    hold = null;
  const calls = [],
    login = {
      signedIn: true,
      ownerId: actor,
      generation: 1,
      csrf: "SYNTHETIC-guidance-csrf",
      capabilities: {
        view: true,
        edit: true,
        publish: true,
        confirmPayments: false,
      },
      idleExpiresAt: "2099-01-01T00:00:00Z",
      absoluteExpiresAt: "2099-01-02T00:00:00Z",
    };
  const runtime = createApplicationSession({
    audience: "advisor",
    locks: { request: async (_n, _o, run) => run() },
    fetcher: async (url, init) => {
      assert.ok(
        [
          "/api/advisor/session",
          "/api/advisor/reviews",
          "/api/advisor/guidance",
          "/api/advisor/logout",
        ].includes(url),
        "unexpected network " + url,
      );
      if (url.endsWith("/session")) return Response.json(login);
      if (url.endsWith("/logout")) return Response.json({ signedOut: true });
      assert.equal(new Headers(init.headers).get("x-shelv-csrf"), login.csrf);
      calls.push({ url, command: JSON.parse(init.body), wire: init.body });
      const body = structuredClone(response),
        http = status;
      if (hold) {
        const h = hold;
        hold = null;
        h.enter();
        await h.done;
      }
      return Response.json(body, { status: http });
    },
  });
  t.after(() => runtime.dispose());
  await runtime.restore();
  const adapters = createAdvisorGuidanceAdapters(runtime);
  t.after(() => adapters.dispose());
  return {
    runtime,
    adapters,
    calls,
    login,
    set(body, http = 200) {
      response = body;
      status = http;
    },
    hold() {
      let enter, release;
      const entered = new Promise((r) => (enter = r)),
        done = new Promise((r) => (release = r));
      hold = { enter, done };
      return { entered, release };
    },
  };
}
const statusCommand = {
  schemaVersion: 1,
  action: "request_status_v1",
  requestId: "33333333-3333-4333-8333-333333333333",
};
test("fixed actual adapters accept READ status and positively reject malformed successful replies", async (t) => {
  const f = await fixture(t);
  assert.deepEqual(await f.adapters.guidance.execute(statusCommand), {
    status: "absent",
  });
  f.set({ status: "absent", privateSource: "SYNTHETIC-private" });
  await assert.rejects(
    f.adapters.guidance.execute(statusCommand),
    (e) => e.status === 503 && e.outcome === "rejected",
  );
  assert.equal(f.calls[0].url, "/api/advisor/guidance");
});
test("allowed actions parse before egress and runtime rejects other valid families", async (t) => {
  const f = await fixture(t);
  await assert.rejects(
    f.adapters.review.execute({
      ...statusCommand,
      action: "read_guidance_draft_v1",
      draftId: client,
    }),
    (e) => e.status === 403,
  );
  await assert.rejects(
    f.adapters.guidance.execute({ ...statusCommand, extra: "no" }),
    (e) => e.status === 400,
  );
  assert.equal(f.calls.length, 0);
});
test("current raw 403 is finite and old success/error cannot cross actual CSRF restore", async (t) => {
  const f = await fixture(t);
  f.set({ code: "forbidden" }, 403);
  await assert.rejects(
    f.adapters.guidance.execute(statusCommand),
    (e) => e.status === 403,
  );
  for (const http of [200, 403, 503]) {
    f.set(http === 200 ? { status: "absent" } : { code: "unavailable" }, http);
    const h = f.hold(),
      p = f.adapters.guidance.execute(statusCommand);
    const denied = assert.rejects(p, (e) => e.status === 401);
    await h.entered;
    f.login.csrf += "x";
    await f.runtime.restore();
    h.release();
    await denied;
    break;
  }
});
test("missing source, policy and upload dependencies are typed unavailable, never working ports", async (t) => {
  const f = await fixture(t);
  assert.deepEqual(
    f.adapters.unavailable.map((x) => x.kind),
    [
      "private_source_reader",
      "guidance_authority",
      "legacy_basis_reader",
      "photo_upload",
    ],
  );
  assert.equal("fetch" in f.adapters, false);
});
