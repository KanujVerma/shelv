// Finite SYNTHETIC HTTP extension only. Every ApplicationSession, cookie,
// acquire/current check, factory, Root parser/mapper and controller stays real.
import assert from "node:assert/strict";
import {
  contextApp,
  selection,
  ids,
  clone,
  at,
  deferred,
} from "./rebuild-advisor-guidance-context-fixture.mjs";
import { createAdvisorGuidanceController } from "../src/features/advisor/guidance/controller.ts";
export { selection, ids, clone, at };
export async function ready(t, action = "approve") {
  let h, revokeHold;
  t.after(() => revokeHold?.done.resolve());
  h = await contextApp(t, (options) => {
    const fetcher = options.runtime.cookie.fetcher;
    // The earlier finite fixture has no revoke responder. Extend only that
    // actual HTTP route; never supply a successful domain/context/authority port.
    options.runtime.cookie.fetcher = async (url, init) => {
      if (url === "/api/advisor/guidance" && init?.body) {
        const command = JSON.parse(init.body);
        if (command.action === "revoke_guidance_approval_v1") {
          assert.equal(init.credentials, "same-origin");
          assert.equal(
            new Headers(init.headers).get("x-shelv-csrf"),
            h.login.csrf,
          );
          h.calls.push({ url, command: clone(command), wire: init.body });
          const result = {
            requestId: command.requestId,
            approvalId: command.approvalId,
            revokedBy: h.login.ownerId,
            revokedAt: at,
            policyRevision: h.data.policy.revision,
          };
          h.receipts.set(command.requestId, clone(result));
          h.data.draft.approval = null;
          if (revokeHold) {
            revokeHold.ready.resolve();
            await revokeHold.done.promise;
          }
          return Response.json(result);
        }
      }
      return fetcher(url, init);
    };
    return createAdvisorGuidanceController(options);
  });
  h.holdHttp = (name) => {
    if (name !== "revoke_guidance_approval_v1") return h.hold(name);
    revokeHold = { ready: deferred(), done: deferred() };
    return {
      ready: revokeHold.ready.promise,
      release: () => revokeHold.done.resolve(),
    };
  };
  if (action !== "review") {
    h.data.draft.review = {
      id: ids.report,
      target: clone(h.data.target),
      reviewedBy: ids.actor,
      reviewedAt: at,
    };
    h.data.draft.issues = [];
  }
  if (action === "publish" || action === "revoke")
    h.data.draft.approval = {
      id: ids.other,
      target: clone(h.data.target),
      scope: "review.publish",
      publisher: { kind: "human", actorId: ids.actor },
      approvedBy: ids.actor,
      approvedAt: at,
      policyRevision: 1,
      revokedAt: null,
      receiptId: null,
    };
  if (action === "rebase") {
    h.data.draft.currentBasis = {
      ...clone(h.data.draft.capturedBasis),
      useHead: 1,
    };
    h.data.draft.needsRebase = true;
    h.data.draft.review = null;
    h.data.draft.issues = [
      { path: "basis", code: "basis_conflict" },
      { path: "review", code: "review_required" },
    ];
    h.data.view.use.revision = 1;
    h.data.view.currentGuidance.snapshot.useHead = 1;
    h.data.page.heads.useHead = 1;
  }
  await h.c.open(selection);
  await h.c.refreshAuthority();
  h.c.acknowledgeEvidence(true);
  assert.equal(
    h.c.can(action),
    true,
    "SYNTHETIC setup must reach real current action readiness",
  );
  return h;
}
export const actionNames = {
  review: "review_guidance_v1",
  rebase: "rebase_guidance_draft_v1",
  approve: "approve_guidance_v1",
  publish: "publish_guidance_v1",
  revoke: "revoke_guidance_approval_v1",
};
