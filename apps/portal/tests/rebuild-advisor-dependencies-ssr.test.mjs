import test from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { mkdir } from "node:fs/promises";
import { dependencyApp, ids } from "./rebuild-advisor-dependencies-helper.mjs";
const out = new URL(
  "../../../.local-artifacts/portal-rebuild/w2-care-dependencies/ssr.cjs",
  import.meta.url,
);
await mkdir(new URL(".", out), { recursive: true });
await build({
  absWorkingDir: new URL("..", import.meta.url).pathname,
  tsconfig: "tsconfig.frontend.json",
  entryPoints: ["tests/rebuild-advisor-dependencies-ssr-entry.tsx"],
  outfile: out.pathname,
  platform: "node",
  format: "cjs",
  bundle: true,
  loader: { ".css": "empty" },
});
const m = (await import(out.href)).default;
const render = (c) =>
  m.renderToStaticMarkup(
    m.createElement(
      m.OverlayProvider,
      null,
      m.createElement(m.AdvisorWorkspace, {
        controller: c,
        navigation: {
          route: {
            name: "advisor-editor",
            draftId: ids.draft,
            section: "review-publish",
          },
          navigate() {
            throw Error("unexpected navigation");
          },
        },
      }),
    ),
  );
test("actual advisor markup exposes meaningful reports and corrections without raw source, counters or invented client entitlement", async (t) => {
  const h = await dependencyApp(t);
  await h.c.open(ids.draft);
  await h.c.inspectDependencies();
  const html = render(h.c);
  assert.match(html, /current client information changed/);
  assert.match(html, /client reported dryness/);
  assert.match(html, /twice a week/);
  assert.match(html, /once a week/);
  assert.match(html, /a small amount/);
  assert.match(html, /correction by another advisor/);
  assert.match(html, /occurred date not known/);
  assert.match(html, /updating the basis keeps the draft text/);
  assert.doesNotMatch(
    html,
    /useHead|legacyBasisManifestHash|"reportedBy"|JSON|textarea[^>]*disabled/,
  );
  assert.match(html, /<button[^>]*disabled[^>]*>update draft basis/);
});
test("unavailable report/instruction content and view-only mode expose recovery while rebase stays unavailable", async (t) => {
  const h = await dependencyApp(t);
  h.setCurrent({ reportHead: 1, instructionHead: 1 });
  await h.c.open(ids.draft);
  await h.c.inspectDependencies();
  const html = render(h.c);
  assert.match(html, /changed client reports are unavailable/);
  assert.match(html, /changed instructions are unavailable/);
  assert.match(html, /refresh current client information/);
  assert.match(html, /<button[^>]*disabled[^>]*>update draft basis/);
});
