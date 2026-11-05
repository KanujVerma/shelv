import test from "node:test";
import assert from "node:assert/strict";
const client = await import("../src/app/client-state.ts").catch(() => ({}));
const nav = await import("../src/app/preview-navigation.ts").catch(() => ({}));
const view = {
  schemaVersion: 1,
  access: "preparation",
  plan: null,
  decisionRevision: 0,
  decisions: [],
  actualUse: [],
  nextReviewOn: null,
};
function boundary() {
  let live = true;
  const listeners = new Set(),
    memory = new Map();
  return {
    key: "session",
    isCurrent: () => live,
    subscribeInvalidation(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    memory: {
      get: (k) => memory.get(k),
      set: (k, v) => memory.set(k, v),
      delete: (k) => memory.delete(k),
    },
    end() {
      live = false;
      memory.clear();
      listeners.forEach((fn) => fn());
    },
  };
}
test("initial client read is owner-derived and a newer authority refresh wins reverse completion", async () => {
  assert.equal(typeof client.createClientPlanController, "function");
  const s = boundary(),
    pending = [];
  const c = client.createClientPlanController(s, {
    read: {
      execute(command) {
        assert.deepEqual(command, {
          schemaVersion: 1,
          action: "read_client_plan_v1",
          version: null,
        });
        return new Promise((resolve) => pending.push(resolve));
      },
    },
    decision: {
      execute() {
        throw Error("unexpected write");
      },
    },
  });
  const a = c.refresh(),
    b = c.refresh();
  pending[1]({ ...view, access: "read_only" });
  await b;
  pending[0](view);
  await a;
  assert.equal(c.getSnapshot().view.access, "read_only");
  c.dispose();
});
test("logout clears rendered authority before any late initial read; offline error preserves loaded view", async () => {
  const s = boundary();
  let release,
    fail = false;
  const c = client.createClientPlanController(s, {
    read: {
      execute() {
        if (fail) return Promise.reject({ status: 503 });
        return new Promise((r) => (release = r));
      },
    },
    decision: {
      execute() {
        throw Error("unexpected write");
      },
    },
  });
  const first = c.refresh();
  release(view);
  await first;
  fail = true;
  await c.refresh();
  assert.deepEqual(c.getSnapshot().view, view);
  assert.equal(c.getSnapshot().error, 503);
  fail = false;
  const pending = c.refresh();
  s.end();
  release(view);
  await pending;
  assert.equal(c.getSnapshot().view, null);
  assert.equal(c.getSnapshot().ended, true);
  c.dispose();
});
test("browser preview cursor delegates safe history markers while retaining product/routine and exact editor exit", async () => {
  const { createPortalNavigator } = await import(
    "../src/navigation/history.ts"
  );
  const entries = [{ url: "/advisor/plans/draft/routine", state: null }],
    listeners = new Map();
  let index = 0;
  const win = {
    location: { pathname: "/advisor/plans/draft/routine", search: "" },
    document: {
      activeElement: { id: "preview-opener" },
      getElementById() {
        return null;
      },
      querySelector() {
        return null;
      },
    },
    scrollY: 300,
    scrollTo() {},
    requestAnimationFrame(fn) {
      queueMicrotask(fn);
    },
    addEventListener(name, fn) {
      if (!listeners.has(name)) listeners.set(name, new Set());
      listeners.get(name).add(fn);
    },
    removeEventListener(name, fn) {
      listeners.get(name)?.delete(fn);
    },
    history: {
      get state() {
        return entries[index].state;
      },
      replaceState(state, _, url) {
        entries[index] = { state, url };
        setUrl(url);
      },
      pushState(state, _, url) {
        entries.splice(++index);
        entries[index] = { state, url };
        setUrl(url);
      },
      back() {
        this.go(-1);
      },
      go(delta) {
        index += delta;
        setUrl(entries[index].url);
        listeners.get("popstate")?.forEach((fn) => fn());
      },
    },
  };
  function setUrl(url) {
    const u = new URL(url, "https://portal.invalid");
    win.location.pathname = u.pathname;
    win.location.search = u.search;
  }
  const outer = createPortalNavigator(win, { scopeKey: "session" }),
    stop = outer.subscribe(() => {});
  outer.navigate({ name: "advisor-preview", draftId: "draft" });
  const cursor = nav.createBrowserPreviewNavigation(win, outer, "draft"),
    unsub = cursor.subscribe(() => {});
  cursor.navigate({ name: "plan", routine: "evening" });
  cursor.navigate({ name: "product", productId: "cerave", routine: "evening" });
  cursor.navigate({
    name: "product-evidence",
    productId: "cerave",
    routine: "evening",
  });
  assert.equal(win.location.pathname, "/advisor/plans/draft/preview");
  assert.deepEqual(cursor.backDestination(), {
    name: "product",
    productId: "cerave",
    routine: "evening",
  });
  win.history.back();
  assert.equal(cursor.getSnapshot().name, "product");
  win.history.go(1);
  assert.equal(cursor.getSnapshot().name, "product-evidence");
  assert.equal(JSON.stringify(entries).includes("cerave"), false);
  cursor.exit();
  assert.equal(win.location.pathname, "/advisor/plans/draft/routine");
  assert.equal(
    entries[index].state.shelvNavigation.restore.focusKey,
    "preview-opener",
  );
  unsub();
  stop();
  cursor.dispose();
  outer.dispose();
});
