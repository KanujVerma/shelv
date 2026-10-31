import test from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";
import { createAdvisorGuidanceController } from "../src/features/advisor/guidance/controller.ts";
import {
  contextApp,
  selection,
  ids,
  clone,
  at,
} from "./rebuild-advisor-guidance-context-fixture.mjs";
const out = new URL(
  "../../../.local-artifacts/portal-rebuild/w2-guidance-context/ssr.cjs",
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

async function ready(t, policy = {}) {
  const h = await contextApp(t, createAdvisorGuidanceController);
  Object.assign(h.data.policy, policy);
  h.data.draft.review = {
    id: ids.report,
    target: clone(h.data.target),
    reviewedBy: ids.actor,
    reviewedAt: at,
  };
  h.data.draft.issues = [];
  await h.c.open(selection);
  await h.c.refreshAuthority();
  h.c.acknowledgeEvidence(true);
  return h;
}
test("actual composed owner policy is visible beside a deliberately enabled exact approval", async (t) => {
  const h = await ready(t);
  const markup = html(h.c);
  assert.match(markup, /owner approval required/);
  assert.match(markup, /refresh approval context/);
  assert.match(markup, /<button(?![^>]*disabled)[^>]*>approve exact review/);
  assert.doesNotMatch(
    markup,
    /current approval policy and exact guidance authority are unavailable/,
  );
});
test("nonowner policy-on gives specific recovery while owner publication is still separate", async (t) => {
  const h = await ready(t, { ownerActorId: ids.other });
  const markup = html(h.c);
  assert.match(markup, /owner approval required/);
  assert.match(markup, /<button[^>]*disabled[^>]*>approve exact review/);
  assert.match(markup, /<button[^>]*disabled[^>]*>publish review/);
});
test("EDIT without PUBLISH is exposed as actual access, not a generic gate error", async (t) => {
  const h = await contextApp(t, createAdvisorGuidanceController);
  h.data.directory.capabilities.publish = false;
  await h.c.open(selection);
  await h.c.refreshAuthority();
  const markup = html(h.c);
  assert.match(markup, /publishing is unavailable with your current access/);
  assert.doesNotMatch(markup, /eligible:true|read_policy_v1|advisor_list/);
});
