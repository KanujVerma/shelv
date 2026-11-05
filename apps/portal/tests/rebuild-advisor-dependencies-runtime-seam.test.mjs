// SYNTHETIC / DO NOT FULFILL. Actual cookie/factory/transport/Root mappers;
// only the finite HTTP boundary and checked-in synthetic reducer are controlled.
import test from "node:test";
import assert from "node:assert/strict";
import { dependencyApp, ids } from "./rebuild-advisor-dependencies-helper.mjs";

const read = {
  schemaVersion: 1,
  action: "read_draft_dependencies_v1",
  draftId: ids.draft,
  contentRevision: 1,
  assignmentRevision: 1,
};
function rebase(h) {
  const {
    useHead,
    reportHead,
    instructionHead,
    legacyBasis,
    legacyBasisManifestHash,
  } = h.current;
  return {
    schemaVersion: 1,
    action: "rebase_draft_dependencies_v1",
    requestId: crypto.randomUUID(),
    draftId: ids.draft,
    expectedContentRevision: 1,
    expectedAssignmentRevision: 1,
    expectedHeads: { useHead, reportHead, instructionHead },
    expectedLegacyBasis: legacyBasis,
    expectedLegacyBasisManifestHash: legacyBasisManifestHash,
  };
}
for (const command of [
  { schemaVersion: 1, action: "read_draft_v1", draftId: ids.draft },
  {
    schemaVersion: 1,
    action: "list_plans_v1",
    clientId: null,
    cursor: null,
    limit: 25,
  },
  {
    schemaVersion: 1,
    action: "validate_draft_v1",
    draftId: ids.draft,
    contentRevision: 1,
    assignmentRevision: 1,
  },
])
  test(
    "dependency runtime seam rejects otherwise-valid " +
      command.action +
      " before HTTP egress",
    async (t) => {
      const h = await dependencyApp(t),
        before = h.calls.length;
      let error;
      try {
        await h.adapter.ports.dependencies.execute(command);
      } catch (caught) {
        error = caught;
      }
      const emitted = h.calls.slice(before).map((x) => x.command.action);
      assert.deepEqual(
        emitted,
        [],
        "unexpected action escaped through the dependency port",
      );
      assert.ok(
        error?.status === 403 || error?.status === 400,
        "finite refusal required",
      );
      // This operation is still lawful on the broad plans port. The narrow seam
      // cannot silently widen, and the fix cannot reduce the existing advisor API.
      const result = await h.adapter.ports.plans.execute(command);
      assert.ok(result);
      assert.equal(h.calls[before].command.action, command.action);
    },
  );

test("legitimate dependency read and rebase retain strict decoding, body and selection behavior", async (t) => {
  const h = await dependencyApp(t);
  await h.c.open(ids.draft);
  const original = structuredClone(h.f.getView().draft.content);
  const dependencies = await h.adapter.ports.dependencies.execute(read);
  assert.equal(dependencies.needsRebase, true);
  assert.equal(dependencies.current.useHead, 2);
  const command = rebase(h),
    view = await h.adapter.ports.dependencies.execute(command);
  assert.equal(view.draft.contentRevision, 2);
  assert.deepEqual(view.draft.content, original);
  assert.ok(view.sections.every((s) => !s.reviewed));
  const gate = h.calls.at(-1).command;
  assert.equal(gate.action, "read_advisor_gate_v1");
  assert.equal(gate.target.contentRevision, 2);
  assert.deepEqual(
    h.calls.find((x) => x.command.action === command.action).command,
    command,
  );
  assert.ok(
    h.calls
      .filter(
        (x) =>
          x.command.action === read.action ||
          x.command.action === command.action,
      )
      .every((x) => x.url === "/api/advisor/plans"),
  );
});

for (const operation of ["read", "write"])
  for (const fault of ["http503", "malformed200"])
    test(
      "dependency " + operation + " keeps its " + fault + " operation outcome",
      async (t) => {
        const h = await dependencyApp(t),
          command = operation === "read" ? read : rebase(h);
        const held = h.hold(command.action, (v) =>
          fault === "http503"
            ? Response.json({ code: "unavailable" }, { status: 503 })
            : { ...v, unsupported: true },
        );
        const running = assert.rejects(
          h.adapter.ports.dependencies.execute(command),
          (error) =>
            error.status === 503 &&
            error.outcome === (operation === "read" ? "rejected" : "uncertain"),
        );
        await held.ready;
        held.release();
        await running;
        assert.deepEqual(
          h.calls.find((x) => x.command.action === command.action).command,
          command,
        );
      },
    );

for (const operation of ["read", "write"])
  test(
    "dependency " +
      operation +
      " malformed fields still use the strict existing parser without egress",
    async (t) => {
      const h = await dependencyApp(t),
        command = operation === "read" ? read : rebase(h);
      const before = h.calls.length;
      for (const malformed of [
        { ...command, unsupported: true },
        { ...command, draftId: "not-a-uuid" },
        { ...command, schemaVersion: 99 },
      ])
        await assert.rejects(
          async () => h.adapter.ports.dependencies.execute(malformed),
          /invalid_input/,
        );
      assert.equal(h.calls.length, before);
    },
  );

test("legitimate dependency action retains creation-bound session replacement denial", async (t) => {
  const h = await dependencyApp(t),
    port = h.adapter.ports.dependencies;
  h.login.csrf = "replacement-seam-csrf";
  await h.runtime.restore();
  const before = h.calls.length;
  await assert.rejects(port.execute(read), (error) => error.status === 401);
  assert.equal(h.calls.length, before);
});
