// SYNTHETIC / DO NOT FULFILL. Actual Application/cookie/ports/Root/controller.
// Only finite HTTP DTOs, the synthetic backend ledger and delivery are controlled.
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { chromium } from "playwright-core";
import { fixture, ids, stamp, hash } from "./rebuild/advisor-fixture.mjs";
import {
  original,
  product,
  descriptor,
} from "./rebuild-advisor-dependencies-helper.mjs";
import { projectClientPlan } from "../../../src/contracts/PortalRebuild.ts";
import { parseRoute } from "../src/navigation/routes.ts";
export { ids };
export const portal = path.resolve(import.meta.dirname, ".."),
  origin = "https://shelv-dependencies.local.invalid";
export const artifacts = path.resolve(
  portal,
  "../../.local-artifacts/portal-rebuild/w2-care-dependencies-cd/browser",
);
const output = path.resolve(
  portal,
  "../../.local-artifacts/portal-rebuild/application",
);
const uid = (n) => `40000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const clone = (v) => structuredClone(v);
let runId,
  opened = 0,
  closed = 0;
export function deferred() {
  let resolve;
  const promise = new Promise((r) => (resolve = r));
  return { promise, resolve };
}
export function dependencyBackend(options = {}) {
  const assigned = options.assigned !== false,
    f = fixture({ ready: assigned }),
    calls = [],
    holds = [],
    receipts = new Map();
  const view = f.getView();
  view.draft.basis = {
    publicationVersion: assigned && !options.preparation ? 1 : null,
    useRevision: 0,
  };
  f.setView(view);
  f.context.publication = options.preparation ? "first" : "later";
  f.context.coverage = "active";
  const report = clone(original);
  report.amendment.amendedBy = options.amender ?? ids.other;
  if (options.longText)
    report.change.details +=
      "\n" +
      Array.from(
        { length: 24 },
        (_, i) =>
          `SYNTHETIC report line ${i + 1}: complete client wording remains readable.`,
      ).join("\n") +
      "\nSYNTHETIC ORIGINAL FINAL LINE";
  const attribution = {
    reportedBy: ids.client,
    recordedBy: ids.actor,
    channel: "video",
    occurredOn: { state: "unknown" },
    recordedAt: stamp,
    sourcePublication: { version: 1, documentSchemaVersion: 3 },
  };
  const initialUse = {
    ...clone(report),
    ...attribution,
    eventId: uid(1),
    change: { kind: "unreviewed_added", details: null },
    amendment: null,
  };
  const identity = {
    ...attribution,
    eventId: uid(2),
    target: { subject: clone(product), comparedWith: null },
    answer: {
      match: "not_sure",
      reportedName: "client-reported CeraVe label",
      variant: { state: "known", value: "client-reported variant" },
      strength: { state: "unknown" },
      labelPhotoIds: [],
    },
  };
  const entries = [
    {
      kind: "reported_product",
      event: {
        ...attribution,
        eventId: uid(1),
        product: clone(product),
        descriptor: clone(descriptor),
        previousVersion: null,
        reason: null,
        initialUse,
      },
    },
    { kind: "identity", event: identity },
    { kind: "use", event: report },
    { kind: "amendment", amendment: clone(report.amendment) },
  ];
  if (options.knownStart)
    entries.push({
      kind: "use",
      event: {
        ...clone(report),
        eventId: uid(5),
        change: { kind: "started" },
        occurredOn: { state: "known", value: "2026-10-20" },
        amendment: null,
      },
    });
  if (options.descriptorCorrection)
    entries.push({
      kind: "reported_product",
      event: {
        ...attribution,
        eventId: uid(6),
        product: { ...product, version: 2 },
        descriptor: {
          ...clone(descriptor),
          name: "corrected CeraVe PM SYNTHETIC",
        },
        previousVersion: 1,
        reason: "correct the product name",
        initialUse: null,
      },
    });
  for (let i = entries.length; i < (options.historyCount ?? 0); i++)
    entries.push({
      kind: "use",
      event: {
        ...clone(report),
        eventId: uid(100 + i),
        change: { kind: "paused", details: `SYNTHETIC older report ${i + 1}` },
        amendment: null,
      },
    });
  const base = {
    schemaVersion: 2,
    legacyBasis: { ...view.draft.basis },
    legacyBasisManifestHash: hash,
    useHead: 0,
    reportHead: 0,
    instructionHead: 0,
    references: [],
  };
  const otherDraft = options.secondDraft ? fixture().getView() : null;
  if (otherDraft) otherDraft.draft.id = ids.other;
  const s = {
    f,
    calls,
    holds,
    receipts,
    entries,
    report,
    identity,
    otherDraft,
    captured: clone(base),
    current: {
      ...clone(base),
      useHead: assigned && !options.preparation ? entries.length : 0,
    },
    caps: { ...f.options.permissions, ...options.caps },
    csrf: "SYNTHETIC-dependencies-browser",
    owner: ids.actor,
    signedIn: true,
    dependencyDenied: options.dependencyDenied ?? false,
    clocks: {
      firstPublicationAt: stamp,
      serviceEnd: "2026-11-30",
      originalStart: options.knownStart ? "2026-10-20" : null,
    },
    hold(action, transform = (v) => v) {
      const h = {
        action,
        transform,
        ready: deferred(),
        done: deferred(),
        used: false,
      };
      holds.push(h);
      return {
        ready: h.ready.promise,
        release: () => h.done.resolve(),
        get dto() {
          return h.dto;
        },
        get command() {
          return h.command;
        },
      };
    },
    writes: () =>
      calls.filter(
        (x) => x.command?.requestId && x.command.action !== "request_status_v1",
      ),
  };
  if (options.changed) s.current = { ...s.current, ...options.changed };
  if (options.currentBasis) s.captured = clone(s.current);
  function publication() {
    const { change, amendment, ...event } = s.report,
      { replacement, reason, ...a } = amendment,
      { change: corrected, ...r } = replacement;
    const summary = {
      ...clone(event),
      changeKind: change.kind,
      amendment: { ...clone(a), ...clone(r), changeKind: corrected.kind },
    };
    const { answer, ...identitySummary } = s.identity;
    return {
      schemaVersion: 2,
      clientId: ids.client,
      version: 1,
      plan: {
        documentSchemaVersion: 3,
        version: 1,
        publishedAt: stamp,
        content: projectClientPlan(s.f.getView().draft.content),
      },
      decisionRevision: 0,
      decisions: [],
      actualUse: [],
      nextReviewOn: null,
      reviewSchedule: null,
      clientAccess: options.clientAccess ?? {
        care: "active",
        entitled: true,
        canRead: true,
        canWrite: true,
      },
      latestPublicReview: null,
      use: {
        revision: s.current.useHead,
        planProducts: [],
        reportedProducts: {
          items: [
            {
              product: options.descriptorCorrection
                ? { ...product, version: 2 }
                : clone(product),
              descriptor: options.descriptorCorrection
                ? {
                    ...clone(descriptor),
                    name: "corrected CeraVe PM SYNTHETIC",
                  }
                : clone(descriptor),
              state: options.descriptorCorrection
                ? "unreviewed"
                : "using_differently",
              originalStart: options.knownStart
                ? { state: "known", value: "2026-10-20" }
                : { state: "unknown" },
              latestEvent: options.descriptorCorrection ? null : summary,
              identity: options.descriptorCorrection
                ? null
                : { ...clone(identitySummary), match: answer.match },
              contradiction: !options.descriptorCorrection,
            },
          ],
          nextCursor: null,
        },
      },
    };
  }
  const response = (status, code) => ({ status, body: { code } });
  async function execute(c) {
    if (c.action === "read_advisor_gate_v1")
      return {
        schemaVersion: 1,
        clientId: c.target.clientId,
        target: c.target,
        publisher: c.publisher,
        approval: f.context.approval,
        publication: f.context.publication,
        coverage: f.context.coverage,
        capabilities: clone(s.caps),
        policy: {
          revision: 1,
          ownerActorId: ids.actor,
          requireKanujApproval: true,
        },
      };
    if (c.action === "read_draft_dependencies_v1") {
      if (s.dependencyDenied) return response(403, "forbidden");
      const v = f.getView();
      if (
        c.draftId !== v.draft.id ||
        c.contentRevision !== v.draft.contentRevision ||
        c.assignmentRevision !== v.draft.assignmentRevision
      )
        return response(409, "revision_conflict");
      const changed = JSON.stringify(s.captured) !== JSON.stringify(s.current);
      return {
        draftId: c.draftId,
        contentRevision: c.contentRevision,
        assignmentRevision: c.assignmentRevision,
        captured: clone(s.captured),
        current: clone(s.current),
        needsRebase: changed,
        affectedSections: changed
          ? ["context", "decisions", "routine", "follow_up"]
          : [],
      };
    }
    if (c.action === "request_status_v1" && receipts.has(c.requestId))
      return {
        status: "committed",
        receipt: clone(receipts.get(c.requestId).result),
      };
    if (
      c.requestId &&
      c.action !== "request_status_v1" &&
      receipts.has(c.requestId)
    ) {
      const prior = receipts.get(c.requestId);
      assert.deepEqual(c, prior.command, "retry payload changed");
      return clone(prior.result);
    }
    let result;
    if (
      c.action === "read_draft_v1" &&
      s.otherDraft &&
      c.draftId === s.otherDraft.draft.id
    ) {
      f.setView(s.otherDraft);
      return clone(s.otherDraft);
    }
    if (c.action === "list_plans_v1" && s.otherDraft) {
      const directory = await f.options.ports.plans.execute(c);
      directory.drafts.push({
        id: s.otherDraft.draft.id,
        clientId: null,
        state: "working",
        contentRevision: 1,
        assignmentRevision: 0,
        savedAt: stamp,
      });
      return directory;
    }
    if (c.action === "rebase_draft_dependencies_v1") {
      if (!s.caps.edit) return response(403, "forbidden");
      const v = f.getView(),
        b = s.current;
      if (
        c.draftId !== v.draft.id ||
        c.expectedContentRevision !== v.draft.contentRevision ||
        c.expectedAssignmentRevision !== v.draft.assignmentRevision ||
        JSON.stringify(c.expectedHeads) !==
          JSON.stringify({
            useHead: b.useHead,
            reportHead: b.reportHead,
            instructionHead: b.instructionHead,
          }) ||
        JSON.stringify(c.expectedLegacyBasis) !==
          JSON.stringify(b.legacyBasis) ||
        c.expectedLegacyBasisManifestHash !== b.legacyBasisManifestHash
      )
        return response(409, "revision_conflict");
      v.draft.contentRevision++;
      v.draft.contentHash = "c".repeat(64);
      v.draft.basis = clone(b.legacyBasis);
      v.target = {
        ...v.target,
        contentRevision: v.draft.contentRevision,
        contentHash: v.draft.contentHash,
      };
      v.sections = v.sections.map((section) => ({
        ...section,
        reviewed: false,
      }));
      v.issues = [];
      f.setView(v);
      s.captured = clone(b);
      f.context.approval = null;
      result = v;
    } else if (c.action === "read_advisor_publication_v2") {
      assert.equal(c.clientId, ids.client);
      if (s.publications) {
        const selected = s.publications.get(c.version);
        return selected ? clone(selected) : response(404, "not_found");
      }
      assert.equal(c.version, null);
      if (s.current.legacyBasis.publicationVersion === null)
        return response(404, "not_found");
      return publication();
    } else if (c.action === "read_advisor_use_history_v1") {
      assert.equal(c.clientId, ids.client);
      assert.equal(c.product, null);
      assert.equal(c.limit, 25);
      if (s.current.useHead === 0)
        return { revision: 0, entries: [], nextCursor: null };
      let offset = 0;
      if (c.cursor) {
        const match = /^c:([a-f0-9]{64}):([0-9a-f-]{36})$/.exec(c.cursor);
        assert.ok(match);
        if (match[1] !== String(s.current.useHead).padStart(64, "0"))
          return response(409, "revision_conflict");
        offset = Number(match[2].slice(-12));
      }
      const page = s.entries.slice(offset, offset + c.limit),
        next = offset + page.length;
      return {
        revision: s.current.useHead,
        entries: clone(page),
        nextCursor:
          next < s.entries.length
            ? `c:${String(s.current.useHead).padStart(64, "0")}:${uid(next)}`
            : null,
      };
    } else if (c.action === "advisor_read") {
      const p = f.context.payments;
      return {
        ...clone(p),
        schemaVersion: 2,
        quotes: p.quotes.map((q) => ({
          ...q,
          contractVersion: 1,
          paymentOptions: [],
        })),
        claims: p.claims.map((x) => ({ ...x, paymentOptionId: null })),
      };
    } else if (c.action === "confirm_payment")
      return f.options.ports.payments.execute(c);
    else if (c.action === "advisor_list")
      return f.options.ports.clients.execute(c);
    else if (c.action === "publish_plan_v1") {
      assert.equal(f.context.publication, "later");
      assert.equal(c.firstServiceClaimId, null);
      assert.ok(f.context.approval);
      assert.ok(f.getView().sections.every((x) => x.reviewed));
      result = {
        ...(await f.options.ports.plans.execute(c)),
        firstServiceStarted: false,
        publicationVersion: 2,
      };
      const v = f.getView();
      v.draft.state = "published";
      f.setView(v);
    } else result = await f.options.ports.plans.execute(c);
    if (c.requestId && c.action !== "request_status_v1")
      receipts.set(c.requestId, { command: clone(c), result: clone(result) });
    return result;
  }
  s.respond = async (command, bytes) => {
    const result = clone(await execute(command)),
      held = holds.find((h) => !h.used && h.action === command.action);
    if (held) {
      held.used = true;
      held.dto = clone(result);
      held.command = clone(command);
      held.ready.resolve();
      await held.done.promise;
      return held.transform(result);
    }
    return result;
  };
  return s;
}
/** Test-only historical sensitivity: actual frozen owned modules, with the
 * actual unchanged Application/Root/cookie pipeline. No production file edits. */
export async function prepareFrozenBuild() {
  const repo = path.resolve(portal, "../.."),
    directory = path.resolve(
      portal,
      "../../.local-artifacts/portal-rebuild/w2-care-dependencies-cd",
    );
  await fs.mkdir(directory, { recursive: true });
  execFileSync(
    "git",
    [
      "diff",
      "--quiet",
      "36b3563588b934f8507d1023a426f828674a9b9f",
      "--",
      "src",
      "supabase",
      "apps/portal/session-integration",
      "apps/portal/src/app/Application.tsx",
    ],
    { cwd: repo },
  );
  const original = await fs.readFile(
    path.join(portal, "scripts/build-portal-app.mjs"),
    "utf8",
  );
  let source = original;
  const replacements = [
    [
      'from "esbuild"',
      `from ${JSON.stringify(path.join(portal, "node_modules/esbuild/lib/main.js"))}`,
    ],
    [
      'from "./check-ui-system.mjs"',
      `from ${JSON.stringify(path.join(portal, "scripts/check-ui-system.mjs"))}`,
    ],
    [
      'from "./emitted-notices.mjs"',
      `from ${JSON.stringify(path.join(portal, "scripts/emitted-notices.mjs"))}`,
    ],
    ['fileURLToPath(new URL("../", import.meta.url))', JSON.stringify(portal)],
  ];
  for (const [before, after] of replacements) {
    assert.ok(source.includes(before));
    source = source.replace(before, after);
  }
  const marker = "const result = await build({";
  assert.ok(source.includes(marker));
  source = source.replace(
    marker,
    marker +
      `
    plugins: [{name: "frozen-CD1-CD2-owned-input", setup(b) {
      b.onLoad({filter: /apps\\/portal\\/src\\/features\\/advisor\\/(controller|types|dependencies|DependencyReview)\\.(ts|tsx)$/}, ({path: file}) => {
        const contents = execFileSync("git", ["show", "36b3563588b934f8507d1023a426f828674a9b9f:" + path.relative(repo, file)], {cwd: repo, encoding: "utf8"});
        return {contents, loader: file.endsWith(".tsx") ? "tsx" : "ts", resolveDir: path.dirname(file)};
      });
    }}],`,
  );
  const modules = {};
  for (const name of [
    "controller.ts",
    "types.ts",
    "dependencies.ts",
    "DependencyReview.tsx",
  ]) {
    const relative = "apps/portal/src/features/advisor/" + name;
    modules[relative] = createHash("sha256")
      .update(
        execFileSync(
          "git",
          ["show", "36b3563588b934f8507d1023a426f828674a9b9f:" + relative],
          { cwd: repo },
        ),
      )
      .digest("hex");
  }
  await fs.writeFile(path.join(directory, "build-frozen.mjs"), source);
  await fs.writeFile(
    path.join(directory, "historical-inputs.json"),
    JSON.stringify(
      {
        ref: "36b3563588b934f8507d1023a426f828674a9b9f",
        modules,
        unchanged:
          "Application/Root/session; normal builder provenance alone does not authenticate overridden inputs",
      },
      null,
      2,
    ) + "\n",
  );
}
export async function startBrowser() {
  assert.equal(process.version, "v22.23.0");
  await fs.mkdir(artifacts, { recursive: true });
  runId = String(Date.now());
  opened = 0;
  closed = 0;
  const source = {};
  for (const relative of [
    "src/features/advisor/controller.ts",
    "src/features/advisor/AdvisorWorkspace.tsx",
    "src/features/advisor/DependencyReview.tsx",
    "src/app/ports.ts",
    "src/app/Application.tsx",
    "tests/rebuild-advisor-dependencies-cd-browser.test.mjs",
    "tests/rebuild-advisor-dependencies-cd-browser-helper.mjs",
  ])
    source[relative] = createHash("sha256")
      .update(await fs.readFile(path.join(portal, relative)))
      .digest("hex");
  await fs.writeFile(
    path.join(artifacts, `execution-${runId}.json`),
    JSON.stringify(
      {
        runId,
        historicalInputRef: process.env.SHELV_ADVISOR_CD_SOURCE_REF ?? null,
        historicalInputRef: process.env.SHELV_ADVISOR_CD_SOURCE_REF ?? null,
        node: process.version,
        head: execFileSync("git", ["rev-parse", "HEAD"], {
          cwd: portal,
          encoding: "utf8",
        }).trim(),
        dirty: !!execFileSync("git", ["status", "--porcelain"], {
          cwd: portal,
          encoding: "utf8",
        }).trim(),
        source,
      },
      null,
      2,
    ) + "\n",
  );
  const sourceRef = process.env.SHELV_ADVISOR_CD_SOURCE_REF;
  if (sourceRef)
    assert.equal(sourceRef, "36b3563588b934f8507d1023a426f828674a9b9f");
  if (sourceRef) await prepareFrozenBuild();
  execFileSync(
    process.execPath,
    [
      sourceRef
        ? path.resolve(
            portal,
            "../../.local-artifacts/portal-rebuild/w2-care-dependencies-cd/build-frozen.mjs",
          )
        : "scripts/build-portal-app.mjs",
    ],
    {
      cwd: portal,
      stdio: "pipe",
    },
  );
  const browser = await chromium.launch({
    channel: "chrome",
    headless: true,
    args: [
      "--no-proxy-server",
      "--disable-background-networking",
      "--disable-quic",
      "--host-resolver-rules=MAP * ~NOTFOUND",
    ],
  });
  await fs.writeFile(
    path.join(artifacts, `browser-${runId}.json`),
    JSON.stringify(
      {
        version: browser.version(),
        channel: "chrome",
        headless: true,
        serial: true,
        origin,
      },
      null,
      2,
    ) + "\n",
  );
  return browser;
}
export async function openDependencyApp(browser, options = {}) {
  const s = dependencyBackend(options),
    context = await browser.newContext({
      viewport: { width: options.width ?? 1440, height: 960 },
      serviceWorkers: "block",
    }),
    unexpected = [],
    errors = [],
    consoleFailures = [],
    expectedStatuses = [];
  options.configure?.(s);
  opened++;
  const allowedFiles = new Set(await fs.readdir(output, { recursive: true }));
  await context.route("**/*", async (route) => {
    const request = route.request(),
      url = new URL(request.url());
    if (url.origin !== origin) {
      unexpected.push(request.method() + " " + url.href);
      return route.abort();
    }
    if (url.pathname.startsWith("/api/")) {
      if (url.pathname === "/api/advisor/session" && request.method() === "GET")
        return route.fulfill({
          json: s.signedIn
            ? {
                signedIn: true,
                ownerId: s.owner,
                generation: 1,
                csrf: s.csrf,
                capabilities: {
                  view: true,
                  edit: true,
                  publish: true,
                  confirmPayments: true,
                },
                idleExpiresAt: "2099-01-01T00:00:00Z",
                absoluteExpiresAt: "2099-01-02T00:00:00Z",
              }
            : { signedIn: false, csrf: "SYNTHETIC-flow" },
        });
      if (
        url.pathname === "/api/advisor/logout" &&
        request.method() === "POST"
      ) {
        s.signedIn = false;
        return route.fulfill({ json: { signedOut: true } });
      }
      if (
        ![
          "/api/advisor/plans",
          "/api/advisor/care",
          "/api/advisor/payments",
          "/api/advisor/operations",
        ].includes(url.pathname) ||
        request.method() !== "POST"
      ) {
        unexpected.push(request.method() + " " + url.pathname);
        return route.abort();
      }
      assert.equal(request.headers()["x-shelv-csrf"], s.csrf);
      const command = request.postDataJSON();
      s.calls.push({ url: url.pathname, command, bytes: request.postData() });
      const result = await s.respond(command, request.postData());
      if (result?.status && result.body) {
        expectedStatuses.push(result.status);
        return route.fulfill({ status: result.status, json: result.body });
      }
      return route.fulfill({ json: result });
    }
    if (request.method() !== "GET") {
      unexpected.push(request.method() + " " + url.pathname);
      return route.abort();
    }
    const relative =
        request.resourceType() === "document" && parseRoute(url.pathname)
          ? "index.html"
          : url.pathname.slice(1),
      file = path.resolve(output, relative);
    if (!file.startsWith(output + path.sep) || !allowedFiles.has(relative)) {
      unexpected.push(url.pathname);
      return route.abort();
    }
    return route.fulfill({
      body: await fs.readFile(file),
      contentType:
        {
          ".html": "text/html",
          ".js": "text/javascript",
          ".css": "text/css",
          ".woff2": "font/woff2",
          ".woff": "font/woff",
          ".png": "image/png",
          ".jpg": "image/jpeg",
          ".webp": "image/webp",
        }[path.extname(file)] ?? "application/octet-stream",
    });
  });
  const p = await context.newPage();
  p.setDefaultTimeout(5000);
  p.on("pageerror", (e) => errors.push(e.message));
  p.on("console", (m) => {
    if (m.type() === "error" || m.type() === "warning")
      consoleFailures.push(m.text());
  });
  await p.goto(
    origin +
      (options.route ??
        `/advisor/plans/${ids.draft}/${options.section ?? "review-publish"}`),
  );
  return {
    p,
    s,
    async close() {
      s.holds.forEach((h) => h.done.resolve());
      await context.close();
      closed++;
      await fs.appendFile(
        path.join(artifacts, `cases-${runId}.jsonl`),
        JSON.stringify({
          route:
            options.route ??
            `/advisor/plans/${ids.draft}/${options.section ?? "review-publish"}`,
          width: options.width ?? 1440,
          options: Object.keys(options),
          opened,
          closed,
          unexpected,
          errors,
          consoleFailures,
          expectedStatuses,
          requests: s.calls.map((c) => ({
            url: c.url,
            action: c.command.action,
            requestId: c.command.requestId ?? null,
            sha256: createHash("sha256").update(c.bytes).digest("hex"),
          })),
        }) + "\n",
      );
      assert.deepEqual(unexpected, []);
      assert.deepEqual(errors, []);
      for (const message of consoleFailures) {
        const match =
          /Failed to load resource: the server responded with a status of (\d+)/.exec(
            message,
          );
        assert.ok(
          match && expectedStatuses.includes(Number(match[1])),
          "unexpected console " + message,
        );
      }
    },
    screenshot: (name) =>
      p.screenshot({ path: path.join(artifacts, name), fullPage: false }),
  };
}
export async function acknowledge(p) {
  const control = p.getByRole("combobox", {
    name: "review current reports and corrections",
    exact: true,
  });
  await control.click();
  await p
    .getByRole("option", {
      name: "i reviewed this current information",
      exact: true,
    })
    .click();
}
export async function ready(p) {
  await p
    .getByText("current client information changed", { exact: true })
    .waitFor();
}
export async function rebaseUI(p) {
  await ready(p);
  await acknowledge(p);
  await p
    .getByRole("button", { name: "update draft basis", exact: true })
    .click();
  await p.getByText("draft basis is current", { exact: true }).waitFor();
}
