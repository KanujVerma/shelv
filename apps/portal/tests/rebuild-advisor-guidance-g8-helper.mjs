// Finite negative HTTP extension only. No successful context/rights/Auth port.
import assert from "node:assert/strict";
import {
  loaded,
  openHeld,
  selection,
  ids,
  clone,
} from "./rebuild-advisor-guidance-g6-helper.mjs";
import { ready, actionNames } from "./rebuild-advisor-guidance-g123-helper.mjs";
import { deferred } from "./rebuild-advisor-guidance-fixture.mjs";
export { openHeld, selection, ids, clone };
export const actions = {
  create: "create_guidance_draft_v1",
  save: "save_guidance_draft_v1",
  ...actionNames,
  conversation: "record_conversation_v1",
  private_note: "append_private_review_note_v1",
};
export async function prepared(t, kind) {
  const h = kind in actionNames ? await ready(t, kind) : await loaded(t);
  if (kind === "create") h.c.startDraft(clone(h.data.body));
  if (kind === "save")
    h.c.editBody({
      ...clone(h.data.body),
      conclusion: "SYNTHETIC G8 human save",
    });
  h.invoke = () =>
    kind === "private_note"
      ? h.c.savePrivateNote(
          { kind: "goal_report", id: ids.report },
          "SYNTHETIC G8 private preparation",
        )
      : kind === "conversation"
        ? h.c.recordConversation({
            publication: clone(h.data.body.publication),
            occurredOn: { state: "unknown" },
            channel: "call",
            clientReported: [
              {
                id: "confirmed-fact",
                text: "SYNTHETIC G8 confirmed fact",
                sources: [],
              },
            ],
            advisorConclusions: [],
            agentProposals: [],
            contradictions: [],
          })
        : h.c[kind]();
  h.denied = (status = 403) => {
    if (kind !== "revoke") {
      h.override(
        actions[kind],
        {
          code:
            status === 401
              ? "session_ended"
              : status === 503
                ? "unavailable"
                : status === 409
                  ? "revision_conflict"
                  : "forbidden",
        },
        status,
      );
      return h.hold(actions[kind]);
    }
    // The retained finite helper has a success-only revoke responder. Intercept
    // this negative HTTP route before it, without inventing a committed receipt.
    const original = h.runtime.cookie.fetcher,
      entered = deferred(),
      release = deferred();
    h.runtime.cookie.fetcher = async (url, init) => {
      const command = init?.body ? JSON.parse(init.body) : null;
      if (
        url === "/api/advisor/guidance" &&
        command?.action === actions.revoke
      ) {
        assert.equal(init.credentials, "same-origin");
        assert.equal(
          new Headers(init.headers).get("x-shelv-csrf"),
          h.login.csrf,
        );
        h.calls.push({ url, command: clone(command), wire: init.body });
        entered.resolve();
        await release.promise;
        return Response.json(
          {
            code:
              status === 401
                ? "session_ended"
                : status === 503
                  ? "unavailable"
                  : status === 409
                    ? "revision_conflict"
                    : "forbidden",
          },
          { status },
        );
      }
      return original(url, init);
    };
    t.after(() => release.resolve());
    return { ready: entered.promise, release: () => release.resolve() };
  };
  return h;
}
