// SYNTHETIC / DO NOT FULFILL. Actual controller and fixture reducer; delivery faults only.
import test from "node:test";
import assert from "node:assert/strict";
import { createAdvisorController } from "../src/features/advisor/controller.ts";
import { fixture, ids, draftView } from "./rebuild/advisor-fixture.mjs";

function hold(port, match, outcome = (value) => value) {
  const execute = port.execute;
  let captured,
    release,
    used = false;
  const ready = new Promise((resolve) => (captured = resolve));
  const wait = new Promise((resolve) => (release = resolve));
  port.execute = async (...args) => {
    const value = await execute(...args);
    if (!used && match(args[0])) {
      used = true;
      captured();
      await wait;
      return outcome(value);
    }
    return value;
  };
  return { ready, release };
}
const paths = [
  "validate",
  "preview",
  "compare",
  "loadDirectory",
  "loadClients",
];
const actions = {
  validate: "validate_draft_v1",
  preview: "preview_draft_v1",
  compare: "compare_import_v1",
  loadDirectory: "list_plans_v1",
  loadClients: "advisor_list",
};
const port = (f, path) =>
  path === "loadClients" ? f.options.ports.clients : f.options.ports.plans;
const start = (c, path) =>
  path === "compare"
    ? c.compare({
        ...c.getSnapshot().local,
        summary: "SYNTHETIC proposed content",
      })
    : c[path]();
const outcome = (value) => {
  if (typeof value === "number")
    return () => {
      throw { status: value };
    };
  return value === "malformed"
    ? (v) => ({ ...v, unsupported: true })
    : (v) => v;
};
const setup = async () => {
  const f = fixture({ ready: true }),
    c = createAdvisorController(f.options);
  await c.open(ids.draft);
  return { f, c };
};
const bytes = (value) => JSON.stringify(value);

// Removing a read's operation/view fence must fail these assertions, including success paths.
for (const path of paths)
  for (const result of ["success", "malformed", 401, 403, 409, 503]) {
    for (const ordering of ["B-pending", "B-acknowledged"]) {
      test(`R3-1 ${path} old ${result} at ${ordering} preserves current work and exact retry`, async () => {
        const { f, c } = await setup();
        try {
          const old = hold(
            port(f, path),
            (x) => x.action === actions[path],
            outcome(result),
          );
          const reading = start(c, path);
          await old.ready;
          c.edit((v) => ({ ...v, summary: "SYNTHETIC manual B" }));
          const save = hold(
            f.options.ports.plans,
            (x) => x.action === "save_draft_v1",
            ordering === "B-pending"
              ? () => {
                  throw { status: 503 };
                }
              : undefined,
          );
          const saving = c.save();
          await save.ready;
          const command = bytes(c.getSnapshot().pending);
          if (ordering === "B-acknowledged") {
            save.release();
            await saving;
          }
          const before = c.getSnapshot(),
            previews = f.previews.length;
          old.release();
          await reading;
          assert.deepEqual(c.getSnapshot(), before);
          assert.equal(f.previews.length, previews);
          if (ordering === "B-pending") {
            assert.equal(c.getSnapshot().busy, true);
            assert.equal(bytes(c.getSnapshot().pending), command);
            save.release();
            await saving;
            assert.equal(c.getSnapshot().save, "uncertain");
            assert.equal(bytes(c.getSnapshot().pending), command);
            await c.retry();
            const attempts = f.calls.filter(
              (x) => x.requestId === JSON.parse(command).requestId,
            );
            assert.deepEqual(attempts.map(bytes), [command, command]);
          }
          assert.equal(c.getSnapshot().pending, null);
          assert.equal(c.getSnapshot().save, "saved");
          assert.equal(c.getSnapshot().local.summary, "SYNTHETIC manual B");
          c.edit((v) => ({ ...v, summary: "SYNTHETIC ordinary C" }));
          await c.save();
          assert.equal(c.getSnapshot().needsComparison, false);
          assert.equal(c.getSnapshot().save, "saved");
          assert.equal(
            c.getSnapshot().view.draft.content.summary,
            "SYNTHETIC ordinary C",
          );
        } finally {
          c.dispose();
        }
      });
    }
  }

for (const path of paths)
  for (const result of ["success", 409, 503]) {
    for (const ordering of ["old-first", "new-first"]) {
      test(`R3-1 ${path} purpose generation ignores old ${result}, ${ordering}`, async () => {
        const { f, c } = await setup();
        try {
          const old = hold(
            port(f, path),
            (x) => x.action === actions[path],
            outcome(result),
          );
          const readingA = start(c, path);
          await old.ready;
          const newer = hold(port(f, path), (x) => x.action === actions[path]);
          const readingB = start(c, path);
          await newer.ready;
          if (ordering === "new-first") {
            newer.release();
            await readingB;
          }
          const before = c.getSnapshot(),
            previews = f.previews.length;
          old.release();
          await readingA;
          assert.deepEqual(c.getSnapshot(), before);
          assert.equal(f.previews.length, previews);
          if (ordering === "old-first") {
            newer.release();
            await readingB;
          }
          assert.equal(c.getSnapshot().notice, null);
          if (path === "preview") assert.equal(f.previews.length, 1);
          if (path === "compare") assert.ok(c.getSnapshot().comparison);
          if (path === "loadDirectory") assert.ok(c.getSnapshot().directory);
          if (path === "loadClients") assert.ok(c.getSnapshot().clients);
        } finally {
          c.dispose();
        }
      });
    }
  }

for (const path of paths)
  for (const change of ["draft", "manual", "role", "session", "review"]) {
    for (const result of ["success", 409]) {
      test(`R3-1 ${path} old ${result} after ${change} replacement cannot apply`, async () => {
        const { f, c } = await setup();
        try {
          const old = hold(
            port(f, path),
            (x) => x.action === actions[path],
            outcome(result),
          );
          const reading = start(c, path);
          await old.ready;
          if (change === "session") f.invalidate();
          else if (change === "role") f.options.permissions.view = false;
          else if (change === "manual")
            c.edit((v) => ({ ...v, summary: "new manual work" }));
          else if (change === "review") await c.review("routine");
          else {
            const v = draftView(true);
            v.draft.id = ids.other;
            v.target.draftId = ids.other;
            f.setView(v);
            await c.open(ids.other);
          }
          const before = c.getSnapshot(),
            previews = f.previews.length;
          old.release();
          await reading;
          assert.deepEqual(c.getSnapshot(), before);
          assert.equal(f.previews.length, previews);
        } finally {
          c.dispose();
        }
      });
    }
  }

for (const path of paths)
  for (const status of [401, 403, 409, 503]) {
    test(`R3-1 current ${path} ${status} keeps legitimate session/error/conflict handling`, async () => {
      const { f, c } = await setup();
      try {
        const fail = hold(
          port(f, path),
          (x) => x.action === actions[path],
          outcome(status),
        );
        const reading = start(c, path);
        await fail.ready;
        fail.release();
        await reading;
        const s = c.getSnapshot();
        if (status === 401) {
          assert.equal(s.ended, true);
          assert.equal(s.local, null);
          assert.equal(f.memory.size, 0);
        } else {
          assert.equal(
            s.notice.kind,
            status === 403 ? "denied" : status === 409 ? "conflict" : "error",
          );
          assert.equal(s.needsComparison, status === 409);
          assert.equal(s.local.summary, "reviewed synthetic plan");
          assert.equal(s.busy, false);
          assert.equal(s.pending, null);
        }
      } finally {
        c.dispose();
      }
    });
  }

for (const result of ["success", 401, 409, 503]) {
  test(`R3-1 open ${result} cannot change a newer draft view`, async () => {
    const f = fixture(),
      c = createAdvisorController(f.options);
    try {
      const old = hold(
        f.options.ports.plans,
        (x) => x.action === "read_draft_v1",
        outcome(result),
      );
      const reading = c.open(ids.draft);
      await old.ready;
      const v = draftView(true);
      v.draft.id = ids.other;
      v.target.draftId = ids.other;
      f.setView(v);
      await c.open(ids.other);
      const before = c.getSnapshot();
      old.release();
      await reading;
      assert.deepEqual(c.getSnapshot(), before);
      assert.equal(c.getSnapshot().view.draft.id, ids.other);
    } finally {
      c.dispose();
    }
  });
}

for (const path of ["loadDirectory", "loadClients"])
  for (const status of [403, 409, 503]) {
    test(`R3-1 current ${path} ${status} during B reports failure without releasing B`, async () => {
      const { f, c } = await setup();
      try {
        c.edit((v) => ({ ...v, summary: "manual B still pending" }));
        const save = hold(
          f.options.ports.plans,
          (x) => x.action === "save_draft_v1",
        );
        const saving = c.save();
        await save.ready;
        const command = bytes(c.getSnapshot().pending);
        const read = hold(
          port(f, path),
          (x) => x.action === actions[path],
          outcome(status),
        );
        const reading = start(c, path);
        await read.ready;
        read.release();
        await reading;
        assert.equal(c.getSnapshot().busy, true);
        assert.equal(bytes(c.getSnapshot().pending), command);
        assert.equal(c.getSnapshot().local.summary, "manual B still pending");
        assert.equal(
          c.getSnapshot().notice.kind,
          status === 403 ? "denied" : status === 409 ? "conflict" : "error",
        );
        save.release();
        await saving;
        assert.equal(c.getSnapshot().save, "saved");
        assert.equal(c.getSnapshot().pending, null);
      } finally {
        c.dispose();
      }
    });
  }
