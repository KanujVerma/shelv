// SSR only, never mounts App or launches a browser. Actual component + controller.
import test from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";
import { createAdvisorGuidanceController } from "../src/features/advisor/guidance/controller.ts";
import {
  guidanceApp,
  selection,
  ids,
  clone,
  at,
} from "./rebuild-advisor-guidance-fixture.mjs";
const out = new URL(
  "../../../.local-artifacts/portal-rebuild/w2-guidance/ssr.cjs",
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
const html = (c) =>
  render({
    controller: c,
    navigation: {
      selection: c.getSnapshot().selection ?? selection,
      onSelect() {},
      onBack() {},
    },
  });
test("A07 composition separates actual reports, public draft fields and private preparation with actionable unavailable gates", async (t) => {
  const h = await guidanceApp(t, createAdvisorGuidanceController);
  await h.c.open(selection);
  const markup = html(h.c);
  assert.match(markup, /review a check-in/);
  assert.match(markup, /client-visible after publication/);
  assert.match(markup, /private advisor notes/);
  assert.match(markup, /SYNTHETIC original comfort/);
  assert.match(markup, /current approval policy/);
  assert.match(markup, /<button[^>]*disabled[^>]*>approve exact/);
  assert.match(markup, /client-visible reply|decision/);
  assert.doesNotMatch(
    markup,
    /SourceStorage|access_token|<input[^>]*type="file"|JSON\.stringify|privateSource/,
  );
});
test("full published history uses actual publisher; compact summary does not infer a preparer", async (t) => {
  const h = await guidanceApp(t, createAdvisorGuidanceController);
  h.data.view.latestPublicReview = {
    reviewId: ids.other,
    publicationVersion: 1,
    publishedAt: at,
    occurredOn: { state: "unknown" },
    conclusion: "SYNTHETIC compact conclusion",
    rationale: "SYNTHETIC compact rationale",
    nextStep: "SYNTHETIC compact next step",
    nextReviewOn: null,
  };
  h.setHistory([
    {
      ...h.data.page,
      entries: [
        ...h.data.page.entries,
        {
          kind: "guidance",
          guidance: {
            record: { kind: "review", id: ids.other },
            body: h.data.body,
            publishedBy: ids.actor,
            publishedAt: at,
            originalStart: null,
          },
        },
        { kind: "legacy_review_note", reviewId: ids.report, note: "" },
      ],
    },
  ]);
  await h.c.open(selection);
  const markup = html(h.c);
  assert.match(markup, new RegExp("published by " + ids.actor));
  assert.match(markup, /note author and time were not recorded/);
  assert.doesNotMatch(markup, new RegExp("published by " + ids.other));
  assert.match(markup, /SYNTHETIC compact conclusion/);
});
test("route mismatch renders recovery without old private draft or history text", async (t) => {
  const h = await guidanceApp(t, createAdvisorGuidanceController);
  await h.c.open(selection);
  const markup = render({
    controller: h.c,
    navigation: {
      selection: { ...selection, clientId: ids.other },
      onSelect() {},
      onBack() {},
    },
  });
  assert.doesNotMatch(
    markup,
    /SYNTHETIC original comfort|SYNTHETIC client report/,
  );
  assert.match(markup, /loading the selected client/);
});
test("safe VIEW-only projection has readable safe summary and no private textarea", async (t) => {
  const h = await guidanceApp(t, createAdvisorGuidanceController);
  await h.caps({ edit: false, publish: false });
  await h.c.open(selection);
  const markup = html(h.c);
  assert.match(markup, /published guidance/);
  assert.doesNotMatch(
    markup,
    /SYNTHETIC original comfort|<textarea|private working note/,
  );
});
