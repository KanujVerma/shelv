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
} from "./rebuild-advisor-guidance-g6-helper.mjs";
const portal = new URL("../", import.meta.url).pathname;
const out = new URL(
  "../../../.local-artifacts/portal-rebuild/w2-guidance-g6/durable-ssr.cjs",
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
test("G6 SSR ordinary exact instruction remains visible and complete", async (t) => {
  const h = await loaded(t);
  await h.c.loadInstructions();
  assert.match(html(h.c), new RegExp(canary));
  assert.match(html(h.c), /all applicable directions loaded/);
});
for (const change of ["selection", "dispose", "signout"])
  test(
    "G6 SSR and source snapshots stay cleared after " + change,
    async (t) => {
      const h = await loaded(t);
      let once = true,
        next,
        held;
      const off = h.c.subscribe(() => {
        const s = h.c.getSnapshot();
        if (
          once &&
          s.instructions.details.length === 1 &&
          !s.instructions.complete
        ) {
          once = false;
          if (change === "dispose") h.c.dispose();
          else if (change === "signout") next = h.runtime.signOut();
          else ({ held, work: next } = openHeld(h));
        }
      });
      t.after(off);
      try {
        await h.c.loadInstructions();
        assert.equal(once, false);
        assert.equal(h.c.getSnapshot().instructions.details.length, 0);
        assert.doesNotMatch(html(h.c), new RegExp(canary));
        assert.equal(h.c.can("publish"), false);
      } finally {
        held?.release();
        await next;
      }
      assert.equal(h.c.getSnapshot().instructions.details.length, 0);
      assert.doesNotMatch(html(h.c), new RegExp(canary));
    },
  );
