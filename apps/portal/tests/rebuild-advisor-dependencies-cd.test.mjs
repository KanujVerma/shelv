import test from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { mkdir } from "node:fs/promises";
import {
  cdApp,
  multiVersion,
  pagedReported,
} from "./rebuild-advisor-dependencies-cd-helper.mjs";
import { ids, stamp } from "./rebuild/advisor-fixture.mjs";
import {
  dependencyProductIdentity,
  missingReportedProductsReader,
} from "../src/features/advisor/dependencies.ts";
import {
  adaptLegacyPlan,
  projectClientPlan,
} from "../../../src/contracts/PortalRebuild.ts";
import { createMayaSample } from "../site/advisor/maya-sample.js";
const out = new URL(
  "../../../.local-artifacts/portal-rebuild/w2-care-dependencies-cd/ssr.cjs",
  import.meta.url,
);
await mkdir(new URL(".", out), { recursive: true });
await build({
  absWorkingDir: new URL("..", import.meta.url).pathname,
  tsconfig: "tsconfig.frontend.json",
  entryPoints: ["tests/rebuild-advisor-dependencies-cd-ssr-entry.tsx"],
  outfile: out.pathname,
  platform: "node",
  format: "cjs",
  bundle: true,
  loader: { ".css": "empty" },
});
const m = (await import(out.href)).default,
  render = (c) =>
    m.renderToStaticMarkup(
      m.createElement(m.DependencyReview, {
        controller: c,
        state: c.getSnapshot(),
      }),
    );
test("CD1 original independent distinction: two Pub1 products cannot collapse under current Pub2", async (t) => {
  const data = multiVersion(),
    h = await cdApp(t, { data });
  await h.c.inspectDependencies();
  assert.equal(h.c.getSnapshot().dependencies.status, "ready");
  h.c.acknowledgeDependencies(true);
  assert.equal(h.c.canRebaseDependencies(), true);
  const headings = [
    ...render(h.c).matchAll(/<h4>(.*?) · original report<\/h4>/g),
  ].map((x) => x[1]);
  assert.equal(headings.length, 2);
  assert.notEqual(
    headings[0],
    headings[1],
    "distinct exact products cannot collapse to the same historical heading",
  );
  const reads = h.calls.filter(
    (x) => x.command.action === "read_advisor_publication_v2",
  );
  assert.deepEqual(
    reads.map((x) => x.command.version),
    [null, 1],
  );
});

test("historical names/descriptors and exact slot come from Pub1, never current same-ID names", async (t) => {
  const data = multiVersion({ renamedCurrent: true }),
    ref = data.entries[0].event.product,
    step = structuredClone(
      data.historical.plan.content.routine.find(
        (s) => s.productId === ref.productId,
      ),
    );
  assert.ok(step);
  step.id = "historical-slot-step";
  step.slotId = "historical-evening-slot";
  step.title = "historical evening moisturizer";
  step.schedule.periods = ["evening"];
  data.historical.plan.content.routine.push(step);
  ref.slotId = step.slotId;
  const h = await cdApp(t, { data });
  await h.c.inspectDependencies();
  const review = h.c.getSnapshot().dependencies,
    label = dependencyProductIdentity(ref, review);
  assert.equal(label.resolved, true);
  assert.ok(label.label.includes(data.names[0]));
  assert.ok(label.label.includes("historical evening moisturizer"));
  assert.ok(!label.label.includes("CURRENT ONLY"));
  const html = render(h.c);
  assert.ok(html.includes("SYNTHETIC FIRST PRODUCT COMFORT"));
  assert.ok(html.includes("two pumps"));
  assert.equal(review.status, "ready");
  assert.equal(h.calls.filter((x) => x.command.version === 1).length, 1);
});
test("historical read caches immutable identity only, not historical/current care state or entitlement", async (t) => {
  const h = await cdApp(t);
  await h.c.inspectDependencies();
  const r = h.c.getSnapshot().dependencies,
    doc = r.documents[1];
  assert.deepEqual(Object.keys(doc).sort(), [
    "documentSchemaVersion",
    "products",
    "slots",
    "version",
  ]);
  assert.equal(Object.hasOwn(doc, "use"), false);
  assert.equal(Object.hasOwn(doc, "clientAccess"), false);
  assert.equal(r.publication.version, 2);
  assert.equal(r.publication.use.planProducts[0].state, "using_differently");
  assert.equal(h.calls.filter((x) => x.command.version === 1).length, 1);
});
for (const scenario of ["schema", "product", "slot"])
  test(
    "unresolvable " +
      scenario +
      " stays distinct and cannot acknowledge a historical reference",
    async (t) => {
      const data = multiVersion(),
        ref = data.entries[0].event.product;
      if (scenario === "schema") ref.publication.documentSchemaVersion = 2;
      if (scenario === "product") ref.productId = "missing-historical-product";
      if (scenario === "slot") ref.slotId = "missing-historical-slot";
      const h = await cdApp(t, { data });
      await h.c.inspectDependencies();
      const r = h.c.getSnapshot().dependencies;
      assert.equal(r.status, "unavailable");
      assert.equal(r.history.length, 2);
      assert.equal(r.publication.version, 2);
      h.c.acknowledgeDependencies(true);
      assert.equal(h.c.canRebaseDependencies(), false);
      const identity = dependencyProductIdentity(ref, r);
      assert.equal(identity.resolved, false);
      assert.ok(
        identity.label.includes(
          scenario === "product"
            ? "missing-historical-product"
            : scenario === "slot"
              ? "missing-historical-slot"
              : "document format 2",
        ),
      );
      assert.ok(render(h.c).includes(identity.reason));
    },
  );
for (const status of [403, 404, 503])
  test(
    "historical " +
      status +
      " preserves readable facts and blocks acknowledgement until a fresh successful lease",
    async (t) => {
      const h = await cdApp(t);
      h.errors.set(1, status);
      await h.c.inspectDependencies();
      const r = h.c.getSnapshot().dependencies;
      assert.equal(r.status, "unavailable");
      assert.equal(r.publication.version, 2);
      assert.equal(r.history.length, 2);
      const labels = r.history.map(
        (e) => dependencyProductIdentity(e.event.product, r).label,
      );
      assert.notEqual(labels[0], labels[1]);
      assert.ok(labels.every((x) => x.includes("unresolved plan product")));
      h.c.acknowledgeDependencies(true);
      assert.equal(h.c.canRebaseDependencies(), false);
      assert.ok(render(h.c).includes("SYNTHETIC SECOND PRODUCT IRRITATION"));
      h.errors.delete(1);
      if (status === 503) await h.runtime.restore();
      await h.c.inspectDependencies();
      assert.equal(h.c.getSnapshot().dependencies.status, "ready");
      assert.equal(h.calls.filter((x) => x.command.version === 1).length, 2);
      assert.equal(h.c.canRebaseDependencies(), false);
      h.c.acknowledgeDependencies(true);
      assert.equal(h.c.canRebaseDependencies(), true);
    },
  );
for (const fault of ["client", "version", "head"])
  test(
    "historical response with wrong " +
      fault +
      " cannot enter the identity cache",
    async (t) => {
      const h = await cdApp(t);
      const held = h.hold(
        "read_advisor_publication_v2",
        (v) => {
          if (fault === "client") v.clientId = ids.other;
          if (fault === "version") {
            v.version = 2;
            v.plan.version = 2;
          }
          if (fault === "head") v.use.revision++;
          return v;
        },
        (c) => c.version === 1,
      );
      const reading = h.c.inspectDependencies();
      await held.ready;
      held.release();
      await reading;
      const r = h.c.getSnapshot().dependencies;
      assert.equal(r.status, "unavailable");
      assert.equal(r.documents[1], undefined);
      assert.equal(r.history.length, 2);
      h.c.acknowledgeDependencies(true);
      assert.equal(h.c.canRebaseDependencies(), false);
    },
  );
test("later history pages fetch each unique historical version once and cannot use an earlier acknowledgement", async (t) => {
  const data = multiVersion();
  data.current.plan.version = 3;
  for (const u of data.current.use.planProducts)
    u.product.publication.version = 3;
  const first = data.entries[0];
  data.entries = Array.from({ length: 25 }, (_, i) => ({
    kind: "use",
    event: {
      ...structuredClone(first.event),
      eventId: `70000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
    },
  }));
  const second = structuredClone(first);
  second.event.eventId = "70000000-0000-4000-8000-000000000026";
  second.event.product.publication.version = 2;
  second.event.sourcePublication.version = 2;
  data.entries.push(second);
  data.current.use.revision = 26;
  data.historical.use.revision = 26;
  const doc2 = structuredClone(data.historical);
  doc2.plan.version = 2;
  for (const u of doc2.use.planProducts) u.product.publication.version = 2;
  const h = await cdApp(t, { data });
  h.historical.set(2, doc2);
  await h.c.inspectDependencies();
  h.c.acknowledgeDependencies(true);
  assert.equal(h.c.canRebaseDependencies(), false);
  await h.c.loadDependencyHistory();
  const r = h.c.getSnapshot().dependencies;
  assert.equal(r.history.length, 26);
  assert.equal(r.status, "ready");
  assert.equal(r.acknowledged, false);
  assert.deepEqual(
    h.calls
      .filter((x) => x.command.action === "read_advisor_publication_v2")
      .map((x) => x.command.version),
    [null, 1, 2],
  );
  h.c.acknowledgeDependencies(true);
  assert.equal(h.c.canRebaseDependencies(), true);
});
test("product-changing amendments retain both original and replacement names and correction actor/body", async (t) => {
  const data = multiVersion(),
    original = data.entries[0].event,
    replacement = structuredClone(data.entries[1].event.product);
  original.amendment = {
    id: "71000000-0000-4000-8000-000000000001",
    eventId: original.eventId,
    previousAmendmentHeadId: null,
    replacement: {
      product: replacement,
      change: {
        kind: "different",
        frequency: { state: "unknown" },
        amount: { state: "known", value: "corrected one drop" },
        details: "SYNTHETIC changed-product correction",
      },
      sourcePublication: replacement.publication,
      occurredOn: { state: "unknown" },
      acquisition: "self",
      identityEventId: null,
    },
    amendedBy: ids.other,
    amendedAt: stamp,
    reason: "SYNTHETIC product identity correction",
  };
  data.entries.push({
    kind: "amendment",
    amendment: structuredClone(original.amendment),
  });
  data.current.use.revision = 3;
  data.historical.use.revision = 3;
  const h = await cdApp(t, { data });
  await h.c.inspectDependencies();
  assert.equal(h.c.getSnapshot().dependencies.status, "ready");
  const html = render(h.c);
  for (const text of [
    ...data.names,
    "corrected one drop",
    "frequency: not known",
    "correction by another advisor",
    "SYNTHETIC changed-product correction",
  ])
    assert.ok(html.includes(text), text);
  assert.equal(h.calls.filter((x) => x.command.version === 1).length, 1);
});
test("reported UUID/version is separate from a same-text plan product ID and never borrows a corrected descriptor", async (t) => {
  const report = pagedReported({ count: 2 }),
    id = report.entries[0].event.product.reportedProductId;
  let data = multiVersion();
  const oldId = data.refs[0].productId;
  data = JSON.parse(
    JSON.stringify(data).replaceAll(JSON.stringify(oldId), JSON.stringify(id)),
  );
  data.current.use.reportedProducts = {
    items: [report.current.use.reportedProducts.items[0]],
    nextCursor: null,
  };
  data.entries.push(report.entries[0]);
  data.current.use.revision = 3;
  data.historical.use.revision = 3;
  const h = await cdApp(t, { data });
  await h.c.inspectDependencies();
  const r = h.c.getSnapshot().dependencies;
  assert.equal(r.status, "ready");
  const plan = dependencyProductIdentity(data.entries[0].event.product, r),
    reported = dependencyProductIdentity(report.entries[0].event.product, r);
  assert.ok(plan.label.includes(data.names[0]));
  assert.ok(reported.label.includes("SYNTHETIC named product 1"));
  assert.notEqual(plan.label, reported.label);
  const wrongVersion = { ...report.entries[0].event.product, version: 2 };
  assert.equal(dependencyProductIdentity(wrongVersion, r).resolved, false);
  assert.ok(
    dependencyProductIdentity(wrongVersion, r).label.includes(
      "description version 2",
    ),
  );
});
test("R2 immutable document metadata is preserved by exact historical identity resolution", async (t) => {
  const data = multiVersion(),
    raw = createMayaSample().clientView.plan,
    legacy = {
      version: 1,
      recommendations: raw.recommendations,
      presentation: raw.presentation,
    };
  data.historical.plan = {
    documentSchemaVersion: 2,
    version: 1,
    publishedAt: stamp,
    content: projectClientPlan(adaptLegacyPlan(legacy, 2).content),
    legacyOriginal: legacy,
  };
  for (const u of data.historical.use.planProducts)
    u.product.publication.documentSchemaVersion = 2;
  for (const u of data.current.use.planProducts)
    if (u.latestEvent) {
      u.latestEvent.product.publication.documentSchemaVersion = 2;
      u.latestEvent.sourcePublication.documentSchemaVersion = 2;
    }
  for (const entry of data.entries) {
    entry.event.product.publication.documentSchemaVersion = 2;
    entry.event.sourcePublication.documentSchemaVersion = 2;
  }
  const h = await cdApp(t, { data });
  await h.c.inspectDependencies();
  assert.equal(h.c.getSnapshot().dependencies.status, "ready");
  assert.equal(
    h.c.getSnapshot().dependencies.documents[1].documentSchemaVersion,
    2,
  );
  assert.ok(
    dependencyProductIdentity(
      data.entries[0].event.product,
      h.c.getSnapshot().dependencies,
    ).label.includes(data.names[0]),
  );
});
test("reported-state continuation is a typed missing reader and never invokes the owner-only paging action", async (t) => {
  const data = pagedReported(),
    h = await cdApp(t, { data });
  await h.c.inspectDependencies();
  while (h.c.getSnapshot().dependencies.nextCursor)
    await h.c.loadDependencyHistory();
  const r = h.c.getSnapshot().dependencies;
  assert.equal(r.history.length, 102);
  assert.equal(
    missingReportedProductsReader(r.publication)[0].family,
    "reported_products",
  );
  assert.ok(
    render(h.c).includes(
      "SYNTHETIC last product stop needs effective current state",
    ),
  );
  assert.equal(
    h.calls.some(
      (x) =>
        x.command.action === "read_reported_products_v1" ||
        x.command.action === "rebase_draft_dependencies_v1",
    ),
    false,
  );
});
for (const status of [403, 503, "success"])
  test(
    "late historical " +
      status +
      " cannot alter manual buffer B or its exact pending payload",
    async (t) => {
      const h = await cdApp(t);
      const old = h.hold(
          "read_advisor_publication_v2",
          (v) =>
            status === "success"
              ? v
              : Response.json({ code: "unavailable" }, { status }),
          (c) => c.version === 1,
        ),
        reading = h.c.inspectDependencies();
      await old.ready;
      h.c.edit((p) => ({ ...p, summary: "CD PRIVATE MANUAL B" }));
      const saving = h.hold("save_draft_v1", (v) => ({
          ...v,
          untrustedExtra: true,
        })),
        writing = h.c.save();
      await saving.ready;
      saving.release();
      await writing;
      const pending = h.c.getSnapshot().pending,
        bytes = JSON.stringify(pending),
        notice = h.c.getSnapshot().notice;
      old.release();
      await reading;
      assert.equal(h.c.getSnapshot().pending, pending);
      assert.equal(JSON.stringify(pending), bytes);
      assert.equal(h.c.getSnapshot().notice, notice);
      assert.equal(h.c.getSnapshot().local.summary, "CD PRIVATE MANUAL B");
      assert.equal(h.c.getSnapshot().dependencies, null);
      assert.equal(h.c.canPublish(), false);
    },
  );
for (const field of ["ownerId", "csrf"])
  test(
    "historical cache/read retires on actual " + field + " replacement",
    async (t) => {
      const h = await cdApp(t),
        held = h.hold(
          "read_advisor_publication_v2",
          (v) => v,
          (c) => c.version === 1,
        ),
        reading = h.c.inspectDependencies();
      await held.ready;
      h.login[field] = field === "ownerId" ? ids.other : "CD-replacement-csrf";
      await h.runtime.restore();
      held.release();
      await reading;
      assert.equal(h.c.getSnapshot().ended, true);
      assert.equal(h.c.getSnapshot().dependencies, null);
      assert.equal(h.c.getSnapshot().local, null);
    },
  );
test("view-only dependency denial cannot acknowledge; a safe historical identity read grants no rebase authority", async (t) => {
  const h = await cdApp(t);
  h.caps.edit = false;
  h.caps.review = false;
  h.caps.approve = false;
  await h.c.refreshContext();
  await h.c.inspectDependencies();
  assert.equal(h.c.getSnapshot().dependencies.status, "unavailable");
  h.c.acknowledgeDependencies(true);
  assert.equal(h.c.canRebaseDependencies(), false);
  const command = {
      schemaVersion: 1,
      action: "read_advisor_publication_v2",
      clientId: ids.client,
      version: 1,
    },
    historical = await h.adapter.ports.careRead.execute(command);
  assert.equal(historical.version, 1);
  assert.equal(historical.plan.content.products[0].name, h.data.names[0]);
  assert.ok(render(h.c).includes("current client information not confirmed"));
  assert.equal(
    h.calls.some((x) => x.command.action === "rebase_draft_dependencies_v1"),
    false,
  );
});
test("later current data and a new inspection never accept an older historical result or share its cache", async (t) => {
  const h = await cdApp(t),
    old = h.hold(
      "read_advisor_publication_v2",
      (v) => v,
      (c) => c.version === 1,
    ),
    reading = h.c.inspectDependencies();
  await old.ready;
  h.data.current.plan.version = 3;
  for (const row of h.data.current.use.planProducts)
    row.product.publication.version = 3;
  h.data.current.use.revision = 3;
  h.current.useHead = 3;
  h.current.legacyBasis.publicationVersion = 3;
  h.historical.get(1).use.revision = 3;
  await h.c.inspectDependencies();
  const current = h.c.getSnapshot().dependencies;
  assert.equal(current.publication.version, 3);
  assert.ok(current.documents[3]);
  assert.equal(
    current.status,
    "unavailable",
    "changed opaque publication basis remains a blocker",
  );
  old.release();
  await reading;
  assert.equal(h.c.getSnapshot().dependencies, current);
  assert.equal(h.calls.filter((x) => x.command.version === 1).length, 2);
});
test("historical identity cache is reused per review, retired by mode/authority, and refetched after refresh", async (t) => {
  const data = multiVersion();
  data.entries = [
    ...data.entries,
    ...Array.from({ length: 25 }, (_, i) => ({
      kind: "use",
      event: {
        ...structuredClone(data.entries[0].event),
        eventId: `72000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
      },
    })),
  ];
  data.current.use.revision = data.entries.length;
  data.historical.use.revision = data.entries.length;
  const h = await cdApp(t, { data });
  await h.c.inspectDependencies();
  await h.c.loadDependencyHistory();
  assert.equal(h.calls.filter((x) => x.command.version === 1).length, 1);
  h.c.retireDependencyReview();
  assert.equal(h.c.getSnapshot().dependencies, null);
  await h.c.inspectDependencies();
  assert.equal(h.calls.filter((x) => x.command.version === 1).length, 2);
  const held = h.hold(
      "read_advisor_publication_v2",
      (v) => v,
      (c) => c.version === 1,
    ),
    reading = h.c.inspectDependencies();
  await held.ready;
  h.caps.edit = false;
  await h.c.refreshContext();
  held.release();
  await reading;
  assert.equal(h.c.getSnapshot().dependencies, null);
  assert.equal(h.c.canRebaseDependencies(), false);
});
test("a later complete bounded reported projection requires fresh inspection and acknowledgement", async (t) => {
  const data = pagedReported({ count: 90, byteSplit: true }),
    h = await cdApp(t, { data });
  assert.ok(data.visible < 89);
  await h.c.inspectDependencies();
  while (h.c.getSnapshot().dependencies.nextCursor)
    await h.c.loadDependencyHistory();
  h.c.acknowledgeDependencies(true);
  assert.equal(h.c.canRebaseDependencies(), false);
  // Later explicit descriptor corrections shrink all90 current descriptors so
  // the existing100-item/byte-bounded read can genuinely return the whole set.
  // No product or old event is discarded, and no state is inferred from history.
  const items = Array.from({ length: 90 }, (_, i) => {
    const product = {
        kind: "client_reported_product",
        reportedProductId: `60000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
        version: 2,
      },
      descriptor = {
        name: `SYNTHETIC corrected product ${i + 1}`,
        brand: { state: "unknown" },
        variant: { state: "unknown" },
        strength: { state: "unknown" },
        sizeLabel: { state: "unknown" },
        labelPhotoIds: [],
      };
    h.entries.push({
      kind: "reported_product",
      event: {
        reportedBy: ids.client,
        recordedBy: ids.client,
        channel: "portal",
        occurredOn: { state: "unknown" },
        recordedAt: stamp,
        sourcePublication: { version: 1, documentSchemaVersion: 3 },
        eventId: `73000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
        product,
        descriptor,
        previousVersion: 1,
        reason: "SYNTHETIC shorter corrected description",
        initialUse: null,
      },
    });
    return {
      product,
      descriptor,
      state: "unreviewed",
      originalStart: { state: "unknown" },
      latestEvent: null,
      identity: null,
      contradiction: false,
    };
  });
  h.data.current.use.reportedProducts = { items, nextCursor: null };
  h.current.useHead += 90;
  h.data.current.use.revision = h.current.useHead;
  await h.c.inspectDependencies();
  while (h.c.getSnapshot().dependencies.nextCursor)
    await h.c.loadDependencyHistory();
  const r = h.c.getSnapshot().dependencies;
  assert.equal(r.publication.use.reportedProducts.items.length, 90);
  assert.equal(r.history.length, data.entries.length + 90);
  assert.equal(r.status, "ready");
  assert.equal(r.acknowledged, false);
  assert.equal(h.c.canRebaseDependencies(), false);
  h.c.acknowledgeDependencies(true);
  assert.equal(h.c.canRebaseDependencies(), true);
  assert.equal(
    h.calls.some((x) => x.command.action === "read_reported_products_v1"),
    false,
  );
});
for (const byteSplit of [false, true])
  test(
    "CD2 complete history cannot cure incomplete current reported products " +
      (byteSplit ? "byte page" : "over100"),
    async (t) => {
      const data = pagedReported({ byteSplit }),
        h = await cdApp(t, { data });
      await h.c.inspectDependencies();
      while (h.c.getSnapshot().dependencies.nextCursor)
        await h.c.loadDependencyHistory();
      const state = h.c.getSnapshot();
      assert.equal(state.dependencies.history.length, data.entries.length);
      assert.equal(state.dependencies.nextCursor, null);
      h.c.acknowledgeDependencies(true);
      assert.equal(
        h.c.canRebaseDependencies(),
        false,
        "truncated effective current product state needs an honest unavailable gate",
      );
      assert.equal(state.dependencies.status, "unavailable");
      assert.ok(render(h.c).includes("current reported products"));
      assert.equal(
        h.calls.filter((x) => x.command.action === "read_reported_products_v1")
          .length,
        0,
      );
      if (byteSplit) {
        assert.ok(data.visible < 100);
        assert.ok(data.currentBytes > 350000);
      }
    },
  );
