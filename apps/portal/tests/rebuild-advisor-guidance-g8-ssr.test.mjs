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
  "../../../.local-artifacts/portal-rebuild/w2-guidance-g8/durable-ssr.cjs",
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

import { prepared, actions } from "./rebuild-advisor-guidance-g8-helper.mjs";

for (const kind of Object.keys(actions))
  test(
    "G8 SSR " + kind + " denial keeps B recoverable without A content",
    async (t) => {
      const h = await prepared(t, kind),
        held = h.denied();
      const work = h.invoke();
      await held.ready;
      let once = true,
        next;
      const off = h.c.subscribe(() => {
        if (once && h.c.getSnapshot().saveState === "error") {
          once = false;
          next = openHeld(h);
        }
      });
      t.after(off);
      try {
        held.release();
        await work;
        assert.equal(once, false);
        await next.held.ready;
        const s = h.c.getSnapshot();
        assert.equal(s.body, null);
        assert.equal(s.privateDenied, false);
        assert.equal(s.pending, null);
        assert.equal(s.notice, null);
        assert.match(html(h.c), /aria-busy="true"/);
        assert.doesNotMatch(
          html(h.c),
          /SYNTHETIC original comfort|keep the current plan|SYNTHETIC G8 human save|access to this information is unavailable/,
        );
        assert.equal(h.c.can("publish"), false);
      } finally {
        held.release();
        next?.held?.release();
        await next?.work;
      }
    },
  );
