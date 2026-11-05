// Actual component SSR only, with real session/cookie/Root/controller sources.
import test from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";
import { ready, clone } from "./rebuild-advisor-guidance-g123-helper.mjs";
const out = new URL(
  "../../../.local-artifacts/portal-rebuild/w2-guidance-g123/ssr.cjs",
  import.meta.url,
);
await mkdir(new URL(".", out), { recursive: true });
await build({
  absWorkingDir: new URL("..", import.meta.url).pathname,
  tsconfig: "tsconfig.frontend.json",
  stdin: {
    contents: `import React from 'react';import{renderToStaticMarkup}from'react-dom/server';import{AdvisorGuidanceWorkspace}from'./src/features/advisor/guidance/AdvisorGuidanceWorkspace.tsx';export const render=(props)=>renderToStaticMarkup(React.createElement(AdvisorGuidanceWorkspace,props));`,
    resolveDir: new URL("..", import.meta.url).pathname,
    loader: "tsx",
  },
  outfile: out.pathname,
  platform: "node",
  format: "cjs",
  bundle: true,
  loader: { ".css": "empty" },
});
const { render } = createRequire(import.meta.url)(out.pathname);
for (const kind of ["publication", "private403"])
  test(
    "G2 SSR " +
      kind +
      " exposes usable original uncertainty without restoring cleared private text",
    async (t) => {
      const h = await ready(t);
      h.c.editBody({
        ...clone(h.data.body),
        conclusion: "SYNTHETIC-G2-PRIVATE-BUFFER",
      });
      const hold = h.hold("save_guidance_draft_v1");
      const write = h.c.save();
      await hold.ready;
      if (kind === "publication") await h.c.refreshPublication();
      else {
        h.override("read_advisor_care_history_v1", { code: "forbidden" }, 403);
        await h.c.refreshHistory();
      }
      hold.release();
      await write;
      const html = render({
        controller: h.c,
        navigation: {
          selection: h.c.getSnapshot().selection,
          onSelect() {},
          onBack() {},
        },
      });
      assert.match(html, /result uncertain/);
      assert.match(
        html,
        /<button(?![^>]*disabled)[^>]*>check original request status/,
      );
      assert.match(
        html,
        /<button(?![^>]*disabled)[^>]*>retry the same request/,
      );
      if (kind === "private403")
        assert.doesNotMatch(
          html,
          /SYNTHETIC-G2-PRIVATE-BUFFER|SYNTHETIC original comfort|private working note/,
        );
      else assert.match(html, /SYNTHETIC-G2-PRIVATE-BUFFER/);
    },
  );
