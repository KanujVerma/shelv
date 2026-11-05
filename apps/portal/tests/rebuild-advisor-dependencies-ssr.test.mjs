import test from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { mkdir } from "node:fs/promises";
import {
  dependencyApp,
  ids,
  descriptor,
  product,
  original,
} from "./rebuild-advisor-dependencies-helper.mjs";
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
const render = (c, draftId = ids.draft) =>
  m.renderToStaticMarkup(
    m.createElement(
      m.OverlayProvider,
      null,
      m.createElement(m.AdvisorWorkspace, {
        controller: c,
        navigation: {
          route: {
            name: "advisor-editor",
            draftId,
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
test("actual safe history renders versioned product descriptions, full identity answers and their real attribution", async (t) => {
  const h = await dependencyApp(t);
  const attribution = {
    sourcePublication: original.sourcePublication,
    reportedBy: ids.client,
    recordedBy: ids.actor,
    channel: "video",
    occurredOn: { state: "unknown" },
    recordedAt: original.recordedAt,
  };
  const creationId = "30000000-0000-4000-8000-000000000001";
  const initialUse = {
    ...original,
    ...attribution,
    eventId: creationId,
    change: { kind: "unreviewed_added", details: null },
    amendment: null,
  };
  const entries = [
    {
      kind: "reported_product",
      event: {
        ...attribution,
        eventId: creationId,
        product,
        descriptor,
        previousVersion: null,
        reason: null,
        initialUse,
      },
    },
    {
      kind: "reported_product",
      event: {
        ...attribution,
        eventId: "30000000-0000-4000-8000-000000000002",
        product: { ...product, version: 2 },
        descriptor: { ...descriptor, name: "corrected CeraVe PM SYNTHETIC" },
        previousVersion: 1,
        reason: "correct the product name",
        initialUse: null,
      },
    },
    {
      kind: "identity",
      event: {
        ...attribution,
        eventId: "30000000-0000-4000-8000-000000000003",
        target: { subject: { ...product, version: 2 }, comparedWith: null },
        answer: {
          match: "not_sure",
          reportedName: "client's actual label",
          variant: { state: "known", value: "client-reported variant" },
          strength: { state: "unknown" },
          labelPhotoIds: [],
        },
      },
    },
  ];
  h.setCurrent({ useHead: 3 });
  h.setHistory(entries, null, 3);
  await h.c.open(ids.draft);
  const held = h.hold("read_advisor_publication_v2", (v) => {
    const state = v.use.reportedProducts.items[0];
    state.product = { ...product, version: 2 };
    state.descriptor = entries[1].event.descriptor;
    state.latestEvent = null;
    state.state = "unreviewed";
    state.contradiction = false;
    return v;
  });
  const reading = h.c.inspectDependencies();
  await held.ready;
  held.release();
  await reading;
  assert.equal(h.c.getSnapshot().dependencies.status, "ready");
  const html = render(h.c);
  for (const text of [
    /product description correction/,
    /correct the product name/,
    /client&#x27;s actual label/,
    /client-reported variant/,
    /strength:.*not known/,
    /product match:.*not sure/,
    /recorded by advisor.*video/,
  ])
    assert.match(html, text);
  assert.doesNotMatch(
    html,
    /formula verified|start recorded|privateNotes|labelPhotoIds/,
  );
  assert.equal(
    h.calls.filter((x) => /report_|amend_|record_client/.test(x.command.action))
      .length,
    0,
  );
});
test("an incoming different draft route cannot expose the old client's review or rebase control before its read completes", async (t) => {
  const h = await dependencyApp(t);
  await h.c.open(ids.draft);
  await h.c.inspectDependencies();
  const html = render(h.c, ids.other);
  assert.doesNotMatch(
    html,
    /client reported dryness|current client information changed|update draft basis/,
  );
  assert.match(html, /loading private draft/);
});
