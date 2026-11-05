// SYNTHETIC / DO NOT FULFILL. Real controller, delayed in-memory transport only.
import test from "node:test";
import assert from "node:assert/strict";
import { createAdvisorController } from "../src/features/advisor/controller.ts";
import { fixture, ids, draftView } from "./rebuild/advisor-fixture.mjs";

// Capture the real response before delaying delivery. Never replace feature behavior.
function holdNext(port, matches = () => true, outcome = (value) => value) {
  const execute = port.execute;
  let release,
    captured,
    used = false;
  const ready = new Promise((resolve) => (captured = resolve));
  const wait = new Promise((resolve) => (release = resolve));
  port.execute = async (...args) => {
    const value = await execute(...args);
    if (!used && matches(args[0])) {
      used = true;
      captured();
      await wait;
      return outcome(value);
    }
    return value;
  };
  return { ready, release };
}
async function approved() {
  const f = fixture({ ready: true }),
    c = createAdvisorController(f.options);
  await c.open(ids.draft);
  await c.refreshContext();
  await c.approve();
  await c.confirmPayment(ids.claim, "100.00", true);
  assert.equal(c.canPublish(), true);
  return { f, c };
}

for (const restriction of [
  "approval",
  "coverage",
  "policy",
  "source",
  "payment",
  "unavailable",
]) {
  test(`F1: newer ${restriction} restriction survives an older eligible gate response`, async () => {
    const { f, c } = await approved();
    try {
      f.context.publication = "later";
      f.context.coverage = "active";
      await c.refreshContext();
      const old = holdNext(f.options.ports.context),
        a = c.refreshContext();
      await old.ready;
      if (restriction === "approval") f.context.approval = null;
      else if (restriction === "coverage") f.context.coverage = "inactive";
      else if (restriction === "payment")
        f.context.payments = { unsupported: true };
      else
        f.options.ports.context.execute = async () => {
          throw { status: restriction === "unavailable" ? 503 : 409 };
        };
      await c.refreshContext();
      const restricted = structuredClone(c.getSnapshot().context);
      assert.equal(c.canPublish(), false);
      old.release();
      await a;
      assert.deepEqual(c.getSnapshot().context, restricted);
      assert.equal(c.canPublish(), false);
    } finally {
      c.dispose();
    }
  });
}

for (const status of [401, 403, 409, 503]) {
  test(`F1: stale ${status} gate error cannot clear newer valid authority or end its view`, async () => {
    const { f, c } = await approved();
    try {
      const old = holdNext(f.options.ports.context, undefined, () => {
        throw { status };
      });
      const a = c.refreshContext();
      await old.ready;
      await c.refreshContext();
      const before = c.getSnapshot();
      old.release();
      await a;
      assert.deepEqual(c.getSnapshot(), before);
      assert.equal(c.canPublish(), true);
    } finally {
      c.dispose();
    }
  });
}

test("F1: newer read wins even when the older read finishes first", async () => {
  const { f, c } = await approved();
  try {
    const old = holdNext(f.options.ports.context),
      a = c.refreshContext();
    await old.ready;
    const newer = holdNext(f.options.ports.context),
      b = c.refreshContext();
    await newer.ready;
    old.release();
    await a;
    newer.release();
    await b;
    assert.equal(c.canPublish(), true);
    assert.equal(c.getSnapshot().notice, null);
  } finally {
    c.dispose();
  }
});

for (const change of ["draft", "session", "saved-target", "reviewed-view"]) {
  for (const error of [false, true]) {
    test(`F1: old gate ${error ? "error" : "success"} is discarded after ${change} replacement`, async () => {
      const { f, c } = await approved();
      try {
        const old = holdNext(f.options.ports.context, undefined, (value) => {
            if (error) throw { status: 409 };
            return value;
          }),
          a = c.refreshContext();
        await old.ready;
        if (change === "session") f.invalidate();
        else if (change === "draft") {
          const v = draftView(true);
          v.draft.id = ids.other;
          v.target.draftId = ids.other;
          f.setView(v);
          await c.open(ids.other);
        } else if (change === "saved-target") {
          c.edit((v) => ({ ...v, summary: "new manual content" }));
          await c.save();
        } else await c.review("routine");
        const before = c.getSnapshot();
        old.release();
        await a;
        assert.deepEqual(c.getSnapshot(), before);
      } finally {
        c.dispose();
      }
    });
  }
}

for (const outcome of [
  "committed",
  "absent",
  "malformed",
  401,
  403,
  409,
  503,
]) {
  test(`F2: old A status ${outcome} cannot change pending B or its exact lost-ack retry`, async () => {
    const f = fixture(),
      execute = f.options.ports.plans.execute;
    let malformed = true;
    f.options.ports.plans.execute = async (...args) => {
      const value = await execute(...args);
      if (malformed && args[0].action === "save_draft_v1") {
        malformed = false;
        return { ...value, unsupported: true };
      }
      return value;
    };
    const c = createAdvisorController(f.options);
    try {
      await c.open(ids.draft);
      c.edit((v) => ({ ...v, title: "save A" }));
      await c.save();
      assert.equal(c.getSnapshot().save, "uncertain");
      const status = holdNext(
          f.options.ports.plans,
          (c) => c.action === "request_status_v1",
          (value) => {
            if (typeof outcome === "number") throw { status: outcome };
            if (outcome === "absent") return { status: "absent" };
            if (outcome === "malformed") return { ...value, unsupported: true };
            return value;
          },
        ),
        a = c.reconcile();
      await status.ready;
      await c.retry();
      assert.equal(c.getSnapshot().save, "saved");
      c.edit((v) => ({ ...v, summary: "manual B must survive" }));
      const save = holdNext(
        f.options.ports.plans,
        (c) => c.action === "save_draft_v1",
        () => {
          throw { status: 503 };
        },
      );
      const b = c.save();
      await save.ready;
      const pending = structuredClone(c.getSnapshot().pending),
        before = c.getSnapshot();
      assert.notEqual(
        pending.requestId,
        f.calls.find((c) => c.action === "save_draft_v1").requestId,
      );
      await c.open(ids.other);
      assert.equal(c.getSnapshot().view.draft.id, ids.draft);
      const afterRefusedSwitch = c.getSnapshot();
      status.release();
      await a;
      assert.deepEqual(c.getSnapshot(), afterRefusedSwitch);
      assert.deepEqual(c.getSnapshot().pending, pending);
      assert.equal(c.getSnapshot().busy, true);
      assert.equal(c.getSnapshot().local, before.local);
      save.release();
      await b;
      assert.equal(c.getSnapshot().save, "uncertain");
      assert.deepEqual(c.getSnapshot().pending, pending);
      assert.equal(c.getSnapshot().local.summary, "manual B must survive");
      await c.retry();
      const attempts = f.calls.filter(
        (v) =>
          v.action === "save_draft_v1" && v.requestId === pending.requestId,
      );
      assert.equal(attempts.length, 2);
      assert.deepEqual(attempts[0], pending);
      assert.deepEqual(attempts[1], pending);
      assert.equal(c.getSnapshot().save, "saved");
      assert.equal(c.getSnapshot().pending, null);
      assert.equal(c.getSnapshot().local.summary, "manual B must survive");
    } finally {
      c.dispose();
    }
  });
}

test("F3: stable view-only and published drafts deny every mutation without granting source rights", async () => {
  for (const published of [false, true]) {
    const f = fixture({ ready: true });
    if (published) {
      const v = f.getView();
      v.draft.state = "published";
      f.setView(v);
    } else
      for (const key of [
        "edit",
        "assign",
        "review",
        "approve",
        "publish",
        "confirmPayments",
      ])
        f.options.permissions[key] = false;
    const c = createAdvisorController(f.options);
    try {
      await c.open(ids.draft);
      await c.refreshContext();
      await c.loadClients();
      c.edit((v) => ({ ...v, title: "denied edit" }));
      await c.save();
      await c.assign(ids.client);
      await c.review("routine");
      await c.approve();
      await c.publish();
      await c.confirmPayment(ids.claim, "100.00", true);
      assert.equal(f.calls.filter((v) => "requestId" in v).length, 0);
      assert.equal(c.getSnapshot().local.title, "SYNTHETIC / DO NOT FULFILL");
      assert.equal(c.permissions.edit, published);
    } finally {
      c.dispose();
    }
  }
});

test("F2: status error from before an exact retry cannot release its busy state", async () => {
  const f = fixture(),
    c = createAdvisorController(f.options);
  try {
    await c.open(ids.draft);
    c.edit((v) => ({ ...v, summary: "uncertain A" }));
    f.fail = 503;
    await c.save();
    f.fail = 0;
    const status = holdNext(
      f.options.ports.plans,
      (c) => c.action === "request_status_v1",
      () => {
        throw { status: 403 };
      },
    );
    const checking = c.reconcile();
    await status.ready;
    const retry = holdNext(
      f.options.ports.plans,
      (c) => c.action === "save_draft_v1",
    );
    const retrying = c.retry();
    await retry.ready;
    const before = c.getSnapshot();
    status.release();
    await checking;
    assert.deepEqual(c.getSnapshot(), before);
    retry.release();
    await retrying;
    assert.equal(c.getSnapshot().save, "saved");
  } finally {
    c.dispose();
  }
});

test("F1: stale malformed approval is discarded before validation can clear newer authority", async () => {
  const { f, c } = await approved();
  try {
    const old = holdNext(f.options.ports.context, undefined, (value) => ({
      ...value,
      approval: { ...value.approval, unsupported: true },
    }));
    const reading = c.refreshContext();
    await old.ready;
    await c.refreshContext();
    const before = c.getSnapshot();
    old.release();
    await reading;
    assert.deepEqual(c.getSnapshot(), before);
    assert.equal(c.canPublish(), true);
  } finally {
    c.dispose();
  }
});

test("F1: a current refresh error cannot release an in-flight save", async () => {
  const { f, c } = await approved();
  try {
    c.edit((v) => ({ ...v, summary: "pending manual work" }));
    const save = holdNext(
      f.options.ports.plans,
      (c) => c.action === "save_draft_v1",
    );
    const saving = c.save();
    await save.ready;
    const pending = structuredClone(c.getSnapshot().pending);
    f.options.ports.context.execute = async () => {
      throw { status: 503 };
    };
    await c.refreshContext();
    assert.equal(c.getSnapshot().busy, true);
    assert.deepEqual(c.getSnapshot().pending, pending);
    assert.equal(c.getSnapshot().context, null);
    save.release();
    await saving;
    assert.equal(c.getSnapshot().save, "saved");
  } finally {
    c.dispose();
  }
});
