import test from "node:test";
import assert from "node:assert/strict";
import { createPortalNavigator } from "../src/navigation/history.ts";
import { createBrowserPreviewNavigation } from "../src/app/preview-navigation.ts";

// Plain history/event/viewport objects, not a DOM or browser implementation.
function model(path = "/advisor/plans/draft/routine") {
  const entries = [{ url: path, state: null }],
    events = new Map(),
    frames = [],
    nodes = new Map();
  let index = 0;
  const fire = (name) => events.get(name)?.forEach((fn) => fn());
  const setUrl = (url) => {
    const next = new URL(url, "https://portal.invalid");
    win.location.pathname = next.pathname;
    win.location.search = next.search;
  };
  function node(id) {
    if (!nodes.has(id))
      nodes.set(id, {
        id,
        focus() {
          win.document.activeElement = this;
          fire("focusin");
        },
      });
    return nodes.get(id);
  }
  const win = {
    location: { pathname: path, search: "" },
    document: {
      activeElement: null,
      getElementById: node,
      querySelector: () => node("page-heading"),
    },
    scrollY: 100,
    scrollTo({ top }) {
      this.scrollY = top;
    },
    requestAnimationFrame(fn) {
      frames.push(fn);
    },
    addEventListener(name, fn) {
      if (!events.has(name)) events.set(name, new Set());
      events.get(name).add(fn);
    },
    removeEventListener(name, fn) {
      events.get(name)?.delete(fn);
    },
    history: {
      scrollRestoration: "auto",
      get state() {
        return entries[index].state;
      },
      replaceState(state, _, url) {
        entries[index] = { state: structuredClone(state), url };
        setUrl(url);
      },
      pushState(state, _, url) {
        entries.splice(++index);
        entries[index] = { state: structuredClone(state), url };
        setUrl(url);
      },
      back() {
        this.go(-1);
      },
      go(delta) {
        assert.ok(entries[index + delta]);
        index += delta;
        setUrl(entries[index].url);
        fire("popstate");
      },
    },
  };
  win.document.activeElement = node("editor-opener");
  return {
    win,
    entries,
    frames,
    settle() {
      while (frames.length) frames.splice(0).forEach((fn) => fn());
    },
    context(scroll, id) {
      win.scrollY = scroll;
      node(id).focus();
      fire("scroll");
    },
    assertContext(scroll, id) {
      assert.equal(win.scrollY, scroll);
      assert.equal(win.document.activeElement.id, id);
    },
  };
}
test("actual canonical navigator owns nonzero scroll and distinct focus through repeated native preview Back/Forward", () => {
  const m = model(),
    outer = createPortalNavigator(m.win, { scopeKey: "session" }),
    stop = outer.subscribe(() => {});
  outer.navigate({ name: "advisor-preview", draftId: "draft" });
  m.settle();
  const cursor = createBrowserPreviewNavigation(m.win, outer, "draft"),
    unsub = cursor.subscribe(() => {});
  try {
    cursor.navigate({ name: "plan", routine: "evening" });
    m.settle();
    m.context(150, "routine-focus");
    cursor.navigate({
      name: "product",
      productId: "cerave-private",
      routine: "evening",
    });
    m.settle();
    m.context(250, "product-focus");
    cursor.navigate({
      name: "product-evidence",
      productId: "cerave-private",
      routine: "evening",
    });
    m.settle();
    m.context(600, "evidence-focus");
    for (let repeat = 0; repeat < 3; repeat++) {
      m.win.history.back();
      m.settle();
      m.assertContext(250, "product-focus");
      assert.deepEqual(cursor.getSnapshot(), {
        name: "product",
        productId: "cerave-private",
        routine: "evening",
      });
      m.win.history.go(1);
      m.settle();
      m.assertContext(600, "evidence-focus");
      assert.equal(cursor.backDestination().name, "product");
    }
    m.win.history.go(-2);
    m.settle();
    m.assertContext(150, "routine-focus");
    assert.deepEqual(cursor.getSnapshot(), {
      name: "plan",
      routine: "evening",
    });
    m.win.history.go(2);
    m.settle();
    m.assertContext(600, "evidence-focus");
    assert.equal(JSON.stringify(m.entries).includes("cerave-private"), false);
    cursor.exit();
    m.settle();
    assert.equal(m.win.location.pathname, "/advisor/plans/draft/routine");
    m.assertContext(100, "editor-opener");
    outer.navigate({ name: "advisor-preview", draftId: "draft" });
    m.settle();
    assert.deepEqual(cursor.getSnapshot(), {
      name: "plan",
      routine: "morning",
    });
    cursor.exit();
    m.settle();
    assert.equal(m.win.location.pathname, "/advisor/plans/draft/routine");
  } finally {
    unsub();
    cursor.dispose();
    stop();
    outer.dispose();
  }
  assert.equal(m.win.history.scrollRestoration, "auto");
});
test("preview refresh and session replacement discard private cursor routes and cancel old queued restoration", () => {
  const m = model("/advisor/plans/draft/preview");
  let live = true;
  const outer = createPortalNavigator(m.win, { scopeKey: "old" }),
    stop = outer.subscribe(() => {});
  const cursor = createBrowserPreviewNavigation(
      m.win,
      outer,
      "draft",
      () => live,
    ),
    unsub = cursor.subscribe(() => {});
  cursor.navigate({
    name: "product-evidence",
    productId: "private-product",
    routine: "evening",
  });
  live = false;
  unsub();
  cursor.dispose();
  stop();
  outer.dispose();
  const fresh = createPortalNavigator(m.win, { scopeKey: "new" }),
    end = fresh.subscribe(() => {});
  const replacement = createBrowserPreviewNavigation(m.win, fresh, "draft"),
    off = replacement.subscribe(() => {});
  try {
    m.context(375, "fresh-focus");
    m.settle();
    m.assertContext(375, "fresh-focus");
    assert.deepEqual(replacement.getSnapshot(), {
      name: "plan",
      routine: "morning",
    });
    assert.equal(JSON.stringify(m.entries).includes("private-product"), false);
    replacement.exit();
    m.settle();
    assert.equal(m.win.location.pathname, "/advisor/plans/draft/sources");
  } finally {
    off();
    replacement.dispose();
    end();
    fresh.dispose();
  }
});
