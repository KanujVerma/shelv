// Standalone SSR of the actual component; no DOM, browser or App activation.
import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import { build } from "../node_modules/esbuild/lib/main.js";
import {
  loaded,
  openHeld,
  selection,
  canary,
  ids,
} from "./rebuild-advisor-guidance-g6-helper.mjs";
const portal = new URL("../", import.meta.url).pathname;
const out = new URL(
  "../../../.local-artifacts/portal-rebuild/w2-guidance-g7/durable-ssr.cjs",
  import.meta.url,
);
await mkdir(new URL(".", out), { recursive: true });
const result = await build({
  absWorkingDir: portal,
  tsconfig: "tsconfig.frontend.json",
  stdin: {
    contents: `import React from 'react';import{renderToStaticMarkup}from'react-dom/server';import{AdvisorGuidanceWorkspace}from'./src/features/advisor/guidance/AdvisorGuidanceWorkspace.tsx';export const render=(props)=>renderToStaticMarkup(React.createElement(AdvisorGuidanceWorkspace,props));`,
    resolveDir: portal,
    loader: "tsx",
  },
  outfile: out.pathname,
  bundle: true,
  platform: "node",
  format: "cjs",
  loader: { ".css": "empty" },
  write: false,
});
await writeFile(out, result.outputFiles[0].contents);
const { render } = createRequire(import.meta.url)(out.pathname);
const html = (c) =>
  render({
    controller: c,
    navigation: {
      selection: c.getSnapshot().selection ?? selection,
      onSelect() {},
      onBack() {},
    },
  });

for (const read of ["history", "reported", "instructions"])
  test(
    "G7 SSR inner " + read + " denial keeps the newer B view clean",
    async (t) => {
      const h = await loaded(t);
      if (read === "reported") {
        h.data.view.use.reportedProducts.nextCursor = `c:${"a".repeat(64)}:${ids.report}`;
        await h.c.refreshPublication();
      }
      const action =
        read === "history"
          ? "read_advisor_care_history_v1"
          : read === "reported"
            ? "read_advisor_reported_products_v1"
            : "read_advisor_instruction_manifest_v1";
      h.override(action, { code: "forbidden" }, 403);
      const held = h.hold(action);
      const work =
        h.c[
          read === "history"
            ? "refreshHistory"
            : read === "reported"
              ? "loadMoreReportedProducts"
              : "loadInstructions"
        ]();
      await held.ready;
      let count = 0,
        next;
      const off = h.c.subscribe(() => {
        if (++count === 2) next = openHeld(h);
      });
      t.after(off);
      try {
        held.release();
        await work;
        assert.ok(next);
        await next.held.ready;
        assert.equal(h.c.getSnapshot().body, null);
        assert.equal(h.c.getSnapshot().privateDenied, false);
        assert.equal(h.c.getSnapshot().notice, null);
        assert.match(html(h.c), new RegExp("client " + ids.other));
        assert.match(
          html(h.c),
          /<button[^>]*aria-busy="true"[^>]*>[\s\S]*?refresh current publication<\/button>/,
        );
        assert.doesNotMatch(html(h.c), new RegExp(canary));
        assert.equal(h.c.can("publish"), false);
      } finally {
        next?.held?.release();
        await next?.work;
      }
      assert.equal(h.c.getSnapshot().publication?.clientId, ids.other);
      assert.doesNotMatch(html(h.c), new RegExp(canary));
    },
  );

test("G7 SSR owning denial still removes the actual private draft and report", async (t) => {
  const h = await loaded(t);
  assert.match(html(h.c), /SYNTHETIC original comfort/);
  h.override("read_advisor_care_history_v1", { code: "forbidden" }, 403);
  await h.c.refreshHistory();
  assert.equal(h.c.getSnapshot().body, null);
  assert.doesNotMatch(
    html(h.c),
    /SYNTHETIC original comfort|keep the current plan/,
  );
  assert.match(html(h.c), /private care history is unavailable/);
});

test("G7 SSR signout inside the inner helper stays ended after settlement", async (t) => {
  const h = await loaded(t);
  h.override("read_advisor_care_history_v1", { code: "forbidden" }, 403);
  const held = h.hold("read_advisor_care_history_v1"),
    work = h.c.refreshHistory();
  await held.ready;
  let count = 0,
    ended;
  const off = h.c.subscribe(() => {
    if (++count === 2) ended = h.runtime.signOut();
  });
  t.after(off);
  held.release();
  await work;
  await ended;
  assert.equal(h.c.getSnapshot().ended, true);
  assert.equal(h.c.getSnapshot().body, null);
  assert.doesNotMatch(
    html(h.c),
    /SYNTHETIC original comfort|keep the current plan/,
  );
});
