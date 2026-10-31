// SYNTHETIC / DO NOT FULFILL. Actual session/cookie/Root/ports/controller.
// Only finite HTTP DTOs, fixture ledger and response delivery are controlled.
import assert from "node:assert/strict";
import { fixture, ids, stamp, hash } from "./rebuild/advisor-fixture.mjs";
import { carePlan, summary, uid } from "./rebuild/care-fixture.mjs";
import { createApplicationSession } from "../src/app/session.ts";
import { createAdvisorPorts } from "../src/app/ports.ts";
import { createAdvisorController } from "../src/features/advisor/controller.ts";
export { ids };
const clone = (v) => structuredClone(v),
  cursor = (offset) => `c:${"a".repeat(64)}:${uid(offset)}`;
const attribution = {
  reportedBy: ids.client,
  recordedBy: ids.actor,
  channel: "call",
  occurredOn: { state: "unknown" },
  recordedAt: stamp,
  sourcePublication: { version: 1, documentSchemaVersion: 3 },
};
export function multiVersion({ renamedCurrent = false } = {}) {
  const source = carePlan(),
    old = clone(source.plan),
    current = clone(source);
  current.plan.version = 2;
  current.use.revision = 2;
  current.use.reportedProducts = { items: [], nextCursor: null };
  const refs = current.use.planProducts
    .slice(0, 2)
    .map((u) => clone(u.product));
  const entries = refs.map((product, i) => ({
    kind: "use",
    event: {
      ...attribution,
      eventId: uid(71 + i),
      product,
      change: {
        kind: "different",
        frequency: {
          state: "known",
          value: i ? "once weekly" : "every evening",
        },
        amount: { state: "known", value: i ? "one drop" : "two pumps" },
        details: i
          ? "SYNTHETIC SECOND PRODUCT IRRITATION"
          : "SYNTHETIC FIRST PRODUCT COMFORT",
      },
      acquisition: "self",
      identityEventId: null,
      originalActivationId: null,
      amendment: null,
    },
  }));
  for (const [i, u] of current.use.planProducts.entries()) {
    u.product.publication.version = 2;
    if (i < 2) {
      const { change, ...event } = entries[i].event;
      u.latestEvent = { ...clone(event), changeKind: change.kind };
      u.state = renamedCurrent ? "not_reported" : "using_differently";
      u.contradiction = renamedCurrent;
    }
  }
  if (renamedCurrent)
    for (const p of current.plan.content.products)
      p.name = "CURRENT ONLY " + p.name;
  const historical = clone(source);
  historical.use.revision = 2;
  return {
    current,
    historical,
    entries,
    refs,
    names: refs.map(
      (ref) => old.content.products.find((p) => p.id === ref.productId).name,
    ),
  };
}
export function pagedReported({ count = 101, byteSplit = false } = {}) {
  const base = carePlan(),
    descriptors = [],
    entries = [];
  for (let i = 0; i < count; i++) {
    const product = {
      kind: "client_reported_product",
      reportedProductId: `60000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
      version: 1,
    };
    const descriptor = {
      name: `SYNTHETIC named product ${i + 1}`,
      brand: { state: "unknown" },
      variant: { state: "unknown" },
      strength: { state: "unknown" },
      sizeLabel: { state: "unknown" },
      labelPhotoIds: [],
    };
    if (byteSplit) {
      descriptor.name = (descriptor.name + " 界".repeat(200)).slice(0, 200);
      for (const key of ["brand", "variant", "strength", "sizeLabel"])
        descriptor[key] = { state: "known", value: "界".repeat(200) };
    }
    const event = {
      ...attribution,
      recordedBy: ids.client,
      eventId: uid(201 + i),
      product,
      change: { kind: "unreviewed_added", details: null },
      acquisition: "self",
      identityEventId: null,
      originalActivationId: null,
      amendment: null,
    };
    const compact = {
      ...summary(product, "unreviewed_added", 201 + i),
      reportedBy: ids.client,
      recordedBy: ids.client,
      eventId: event.eventId,
      sourcePublication: attribution.sourcePublication,
    };
    const row = {
      product,
      descriptor,
      state: "unreviewed",
      originalStart: { state: "unknown" },
      latestEvent: compact,
      identity: null,
      contradiction: false,
    };
    if (byteSplit) {
      const identity = {
        ...attribution,
        eventId: uid(1201 + i),
        target: {
          subject: product,
          comparedWith: clone(base.use.planProducts[0].product),
        },
        answer: {
          match: "not_sure",
          reportedName: null,
          variant: { state: "known", value: "界".repeat(200) },
          strength: { state: "unknown" },
          labelPhotoIds: [],
        },
      };
      const amendment = {
        id: uid(2201 + i),
        eventId: event.eventId,
        previousAmendmentHeadId: null,
        replacement: {
          product,
          change: { kind: "unreviewed_added", details: null },
          sourcePublication: attribution.sourcePublication,
          occurredOn: { state: "unknown" },
          acquisition: "self",
          identityEventId: identity.eventId,
        },
        amendedBy: ids.actor,
        amendedAt: stamp,
        reason: "SYNTHETIC correction retains unknown Start",
      };
      event.amendment = amendment;
      const { replacement, reason, ...a } = amendment,
        { change, ...r } = replacement;
      compact.amendment = { ...a, ...r, changeKind: change.kind };
      const { answer, ...who } = identity;
      row.identity = { ...who, match: answer.match };
      row.contradiction = true;
      entries.push(
        { kind: "identity", event: identity },
        { kind: "amendment", amendment },
      );
    }
    entries.push({
      kind: "reported_product",
      event: {
        ...attribution,
        recordedBy: ids.client,
        eventId: event.eventId,
        product,
        descriptor,
        previousVersion: null,
        reason: null,
        initialUse: event,
      },
    });
    descriptors.push(row);
  }
  const stopped = {
    ...attribution,
    recordedBy: ids.client,
    eventId: uid(9901),
    product: descriptors.at(-1).product,
    change: {
      kind: "stopped",
      details: "SYNTHETIC last product stop needs effective current state",
    },
    acquisition: "self",
    identityEventId: null,
    originalActivationId: null,
    amendment: null,
  };
  entries.push({ kind: "use", event: stopped });
  const { change, ...stopSummary } = stopped;
  descriptors.at(-1).state = "stopped";
  descriptors.at(-1).latestEvent = { ...stopSummary, changeKind: change.kind };
  let visible = Math.min(100, count - 1);
  if (byteSplit) {
    visible = 0;
    while (
      visible + 1 < count &&
      visible < 100 &&
      Buffer.byteLength(
        JSON.stringify({
          items: descriptors.slice(0, visible + 1),
          nextCursor: cursor(100),
        }),
      ) <= 390000
    )
      visible++;
    assert.ok(visible < 100, "byte cap must split before the item cap");
  }
  const reported = {
      items: clone(descriptors.slice(0, visible)),
      nextCursor: cursor(visible),
    },
    current = carePlan();
  current.use.revision = entries.length;
  current.use.reportedProducts = reported;
  return {
    current,
    entries,
    omitted: descriptors.at(-1),
    visible,
    currentBytes: Buffer.byteLength(JSON.stringify(reported)),
  };
}
export async function cdApp(t, options = {}) {
  const data = options.data ?? multiVersion(),
    f = fixture({ ready: true }),
    calls = [],
    holds = [];
  const v = f.getView();
  v.draft.basis = {
    publicationVersion: data.current.plan.version,
    useRevision: 0,
  };
  f.setView(v);
  const s = {
    data,
    f,
    calls,
    holds,
    caps: { ...f.options.permissions, ...options.caps },
    login: {
      signedIn: true,
      ownerId: ids.actor,
      generation: 1,
      csrf: "SYNTHETIC-CD",
      capabilities: {
        view: true,
        edit: true,
        publish: true,
        confirmPayments: true,
      },
      idleExpiresAt: "2099-01-01T00:00:00Z",
      absoluteExpiresAt: "2099-01-02T00:00:00Z",
    },
    historical: new Map(
      data.historical
        ? [[data.historical.plan.version, clone(data.historical)]]
        : [],
    ),
    errors: new Map(),
    entries: clone(data.entries),
  };
  s.current = {
    schemaVersion: 2,
    legacyBasis: clone(v.draft.basis),
    legacyBasisManifestHash: hash,
    useHead: data.current.use.revision,
    reportHead: 0,
    instructionHead: 0,
    references: [],
  };
  s.captured = { ...clone(s.current), useHead: 0 };
  s.hold = (action, transform = (value) => value, predicate = () => true) => {
    let enter, release;
    const ready = new Promise((r) => (enter = r)),
      done = new Promise((r) => (release = r)),
      h = { action, transform, predicate, used: false, enter, done };
    holds.push(h);
    return {
      ready,
      release,
      get command() {
        return h.command;
      },
    };
  };
  function envelope(view, c) {
    const { access, ...body } = clone(view);
    return {
      ...body,
      clientId: c.clientId,
      version: body.plan.version,
      reviewSchedule: null,
      clientAccess: {
        care: "active",
        entitled: true,
        canRead: true,
        canWrite: true,
      },
    };
  }
  const runtime = createApplicationSession({
    audience: "advisor",
    locks: { request: async (_n, o, run) => run(o.signal) },
    fetcher: async (url, o) => {
      if (url === "/api/advisor/session") return Response.json(s.login);
      if (url === "/api/advisor/logout")
        return Response.json({ signedOut: true });
      assert.ok(
        [
          "/api/advisor/plans",
          "/api/advisor/care",
          "/api/advisor/payments",
          "/api/advisor/operations",
        ].includes(url),
      );
      assert.equal(new Headers(o.headers).get("x-shelv-csrf"), s.login.csrf);
      const c = JSON.parse(o.body);
      calls.push({ url, command: clone(c), bytes: o.body });
      let result,
        status = 200;
      if (c.action === "read_advisor_gate_v1")
        result = {
          schemaVersion: 1,
          clientId: c.target.clientId,
          target: c.target,
          publisher: c.publisher,
          approval: f.context.approval,
          publication: "later",
          coverage: "active",
          capabilities: clone(s.caps),
          policy: {
            revision: 1,
            ownerActorId: ids.actor,
            requireKanujApproval: true,
          },
        };
      else if (c.action === "read_draft_dependencies_v1") {
        if (!s.caps.edit) {
          status = 403;
          result = { code: "forbidden" };
        } else
          result = {
            draftId: c.draftId,
            contentRevision: c.contentRevision,
            assignmentRevision: c.assignmentRevision,
            captured: clone(s.captured),
            current: clone(s.current),
            needsRebase: true,
            affectedSections: ["context", "decisions", "routine", "follow_up"],
          };
      } else if (c.action === "read_advisor_publication_v2") {
        assert.equal(c.clientId, ids.client);
        const doc =
          c.version === null ? s.data.current : s.historical.get(c.version);
        if (s.errors.has(c.version)) {
          status = s.errors.get(c.version);
          result = { code: "unavailable" };
        } else if (!doc) {
          status = 404;
          result = { code: "not_found" };
        } else result = envelope(doc, c);
      } else if (c.action === "read_advisor_use_history_v1") {
        assert.equal(c.clientId, ids.client);
        assert.equal(c.limit, 25);
        assert.equal(c.product, null);
        const offset = c.cursor ? Number(c.cursor.slice(-12)) : 0,
          items = s.entries.slice(offset, offset + c.limit),
          next = offset + items.length;
        result = {
          revision: s.current.useHead,
          entries: clone(items),
          nextCursor: next < s.entries.length ? cursor(next) : null,
        };
      } else if (c.action === "advisor_read") {
        const p = f.context.payments;
        result = {
          ...clone(p),
          schemaVersion: 2,
          quotes: p.quotes.map((q) => ({
            ...q,
            contractVersion: 1,
            paymentOptions: [],
          })),
          claims: p.claims.map((x) => ({ ...x, paymentOptionId: null })),
        };
      } else result = await f.options.ports.plans.execute(c);
      result = clone(result);
      const held = holds.find(
        (h) => !h.used && h.action === c.action && h.predicate(c),
      );
      if (held) {
        held.used = true;
        held.command = clone(c);
        held.enter();
        await held.done;
        const next = held.transform(result);
        if (next instanceof Response) return next;
        result = next;
      }
      return Response.json(result, { status });
    },
  });
  await runtime.restore();
  const adapter = createAdvisorPorts(runtime, { care: true }),
    c = createAdvisorController({
      session: runtime.getSnapshot().boundary,
      permissions: adapter.permissions,
      ports: adapter.ports,
    });
  t.after(() => {
    for (const release of releases) release();
    c.dispose();
    adapter.dispose();
    runtime.dispose();
  });
  const releases = [];
  const originalHold = s.hold;
  s.hold = (...args) => {
    const h = originalHold(...args);
    releases.push(h.release);
    return h;
  };
  await c.open(ids.draft);
  return { ...s, runtime, adapter, c };
}
