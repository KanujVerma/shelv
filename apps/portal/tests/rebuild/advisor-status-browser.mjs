// SYNTHETIC / DO NOT FULFILL. Actual React workspace/controller, cookie factories,
// transport, app ports and canonical DTO mappers. Only finite HTTP delivery is fake.
import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { build } from "esbuild";
import { execFileSync } from "node:child_process";
import { chromium } from "playwright-core";
import { fixture, ids } from "./advisor-fixture.mjs";
import { buildPaymentCall } from "../../../../supabase/functions/concierge-payments/contract.ts";
import {
  buildPaymentCallV2,
  mapPaymentViewV2,
} from "../../../../supabase/functions/concierge-payments/methods.ts";

const portal = path.resolve(import.meta.dirname, "../.."),
  artifacts = path.resolve(
    portal,
    "../../.local-artifacts/portal-rebuild/w2-status-recovery/browser",
  ),
  origin = "https://shelv-payment-context.invalid",
  secondClaim = "20000000-0000-4000-8000-000000000006",
  secondQuote = "20000000-0000-4000-8000-000000000007",
  optionId = "20000000-0000-4000-8000-000000000008";
let browser, files;
before(async () => {
  await fs.mkdir(artifacts, { recursive: true });
  // Test-only entry. No production exports/hooks or successful application ports.
  const result = await build({
    absWorkingDir: portal,
    stdin: {
      sourcefile: "payment-context-entry.tsx",
      resolveDir: portal,
      loader: "tsx",
      contents: `
      import React from 'react';
      import {createRoot} from 'react-dom/client';
      import {createApplicationSession} from './src/app/session.ts';
      import {createAdvisorPorts} from './src/app/ports.ts';
      import {AdvisorWorkspace,createAdvisorController} from './src/features/advisor/index.ts';
      import {OverlayProvider} from './src/ui/index.ts';
      import {ApplicationShell} from './src/app/Shell.tsx';
      import {createPortalNavigator} from './src/navigation/history.ts';
      import {NavigationProvider,usePortalNavigation} from './src/navigation/react.tsx';
      import './src/ui/foundation.css'; import './src/shell/shell.css'; import './src/app/application.css';
      const runtime=createApplicationSession({audience:'advisor',locks:{request:async(_,o,run)=>run(o.signal)}});
      await runtime.restore();
      const adapter=createAdvisorPorts(runtime),c=createAdvisorController({session:runtime.getSnapshot().boundary,permissions:adapter.permissions,ports:adapter.ports});
      window.__payment={runtime,adapter,c,dispose(){c.dispose();adapter.dispose();runtime.dispose()}};
      const navigator=createPortalNavigator(window,{scopeKey:runtime.getSnapshot().boundary.key});
      function Body(){const {route,navigator}=usePortalNavigation();return <ApplicationShell audience="advisor" onSignOut={()=>void runtime.signOut()}><AdvisorWorkspace controller={c} navigation={{route,navigate:r=>navigator.navigate(r)}}/></ApplicationShell>}
      function App(){return <React.StrictMode><OverlayProvider><NavigationProvider navigator={navigator}><Body/></NavigationProvider></OverlayProvider></React.StrictMode>}
      createRoot(document.getElementById('root')).render(<App/>);
    `,
    },
    outfile: path.join(artifacts, "payment-context.js"),
    tsconfig: "tsconfig.frontend.json",
    bundle: true,
    format: "esm",
    write: false,
    plugins: process.env.SHELV_STATUS_BASE
      ? [
          {
            name: "historical-controller-input",
            setup(builder) {
              builder.onLoad(
                { filter: /features\/advisor\/controller\.ts$/ },
                () => ({
                  contents: execFileSync(
                    "git",
                    [
                      "show",
                      process.env.SHELV_STATUS_BASE +
                        ":apps/portal/src/features/advisor/controller.ts",
                    ],
                    { cwd: portal, encoding: "utf8" },
                  ),
                  loader: "ts",
                }),
              );
            },
          },
        ]
      : [],
    loader: { ".woff2": "file", ".woff": "file" },
    assetNames: "fonts/[name]-[hash]",
  });
  files = new Map(
    result.outputFiles.map((f) => [f.path, Buffer.from(f.contents)]),
  );
  browser = await chromium.launch({
    channel: "chrome",
    headless: true,
    args: [
      "--no-proxy-server",
      "--disable-background-networking",
      "--disable-quic",
      "--host-resolver-rules=MAP * ~NOTFOUND",
    ],
  });
});
after(async () => {
  await browser?.close();
  browser = null;
});
const clone = structuredClone;
function paymentView(f, contractVersion = 1, count = 1) {
  const p = clone(f.context.payments);
  p.schemaVersion = 2;
  p.revision = 2;
  p.quotes = p.quotes.map((q) => ({
    ...q,
    contractVersion,
    paymentOptions:
      contractVersion === 1
        ? []
        : [
            {
              id: optionId,
              recipientVersion: 3,
              recipient: {
                method: "cash_app",
                name: "SYNTHETIC recipient",
                cashtag: "$synthetic",
              },
              available: true,
            },
          ],
  }));
  p.claims = p.claims.map((c) => ({
    ...c,
    paymentOptionId: contractVersion === 1 ? null : optionId,
  }));
  if (count === 0) {
    p.quotes = [];
    p.claims = [];
  }
  if (count === 2) {
    p.quotes.push({ ...clone(p.quotes[0]), id: secondQuote });
    p.claims.push({
      ...clone(p.claims[0]),
      id: secondClaim,
      quoteId: secondQuote,
    });
  }
  return mapPaymentViewV2(p);
}
async function setup(
  t,
  { version = 1, count = 1, width = 1440, later = false } = {},
) {
  const f = fixture({ ready: true }),
    calls = [],
    unexpected = [],
    errors = [],
    expectedErrors = [],
    holds = [];
  const s = {
    f,
    payments: paymentView(f, version, count),
    caps: { ...f.options.permissions },
    login: {
      signedIn: true,
      ownerId: ids.actor,
      generation: 1,
      csrf: "SYNTHETIC-csrf",
      capabilities: {
        view: true,
        edit: true,
        publish: true,
        confirmPayments: true,
      },
      idleExpiresAt: "2099-01-01T00:00:00Z",
      absoluteExpiresAt: "2099-01-02T00:00:00Z",
    },
  };
  if (later) {
    f.context.publication = "later";
    f.context.coverage = "active";
  }
  const bytes = [];
  const context = await browser.newContext({
    viewport: { width, height: 960 },
    serviceWorkers: "block",
  });
  await context.route("**/*", async (route) => {
    const r = route.request(),
      u = new URL(r.url());
    if (u.origin !== origin) {
      unexpected.push(r.method() + " " + u.pathname);
      return route.abort();
    }
    if (u.pathname.startsWith("/api/")) {
      if (u.pathname === "/api/advisor/session" && r.method() === "GET")
        return route.fulfill({ json: s.login });
      if (u.pathname === "/api/advisor/logout" && r.method() === "POST")
        return route.fulfill({ json: { signedOut: true } });
      if (
        r.method() !== "POST" ||
        r.headers()["x-shelv-csrf"] !== s.login.csrf
      ) {
        unexpected.push("bad method/CSRF");
        return route.abort();
      }
      const command = r.postDataJSON();
      calls.push(clone(command));
      bytes.push(r.postData());
      let result,
        status = 200;
      if (u.pathname === "/api/advisor/plans") {
        if (command.action === "read_advisor_gate_v1")
          result = {
            schemaVersion: 1,
            clientId: command.target.clientId,
            target: command.target,
            publisher: command.publisher,
            approval: f.context.approval,
            publication: f.context.publication,
            coverage: f.context.coverage,
            capabilities: s.caps,
            policy: {
              revision: 1,
              ownerActorId: ids.actor,
              requireKanujApproval: true,
            },
          };
        else result = await f.options.ports.plans.execute(command);
      } else if (
        u.pathname === "/api/advisor/operations" &&
        command.action === "advisor_list"
      )
        result = await f.options.ports.clients.execute(command);
      else if (
        u.pathname === "/api/advisor/payments" &&
        command.action === "advisor_read"
      )
        result = mapPaymentViewV2(s.payments);
      else if (
        u.pathname === "/api/advisor/payments" &&
        command.action === "confirm_payment"
      ) {
        // Canonical request parsing remains active on both sides of the boundary.
        (command.schemaVersion === 2 ? buildPaymentCallV2 : buildPaymentCall)(
          command,
          ids.actor,
        );
        const claim = s.payments.claims.find((c) => c.id === command.claimId),
          quote = s.payments.quotes.find((q) => q.id === claim?.quoteId);
        assert.ok(claim && quote);
        assert.equal(command.expectedRevision, s.payments.revision);
        for (const [key, value] of Object.entries({
          clientId: f.getView().draft.clientId,
          quoteId: quote.id,
          quoteVersion: quote.version,
          shippingAddressVersion: quote.shippingAddressVersion,
          serviceCents: quote.serviceCents,
          productCents: quote.productTotalCents,
          totalCents: quote.totalCents,
        }))
          assert.equal(command[key], value, key);
        if (command.schemaVersion === 2)
          assert.equal(command.paymentOptionId, claim.paymentOptionId);
        claim.status = "confirmed";
        s.payments.revision++;
        s.payments.service = { status: "pending_publication", period: null };
        result = {
          revision: s.payments.revision,
          operation: "confirm_payment",
          quoteId: quote.id,
          claimId: claim.id,
          status: "confirmed",
          serviceUnlocked: false,
          serviceAccessStatus: "pending_publication",
          productOrderStatus: null,
          ...(command.schemaVersion === 2
            ? { schemaVersion: 2, paymentOptionId: claim.paymentOptionId }
            : {}),
        };
      } else {
        unexpected.push(u.pathname + " " + command.action);
        return route.abort();
      }
      result = clone(result);
      const hold = holds.find((h) => !h.used && h.action === command.action);
      if (hold) {
        hold.used = true;
        hold.dto = clone(result);
        hold.ready();
        await hold.promise;
        if (hold.status) {
          status = hold.status;
          result = { code: "unavailable" };
        }
        if (hold.transform) result = hold.transform(result);
      }
      if (status === 403)
        expectedErrors.push(
          "Failed to load resource: the server responded with a status of 403 (Forbidden)",
        );
      return route.fulfill({ status, json: result });
    }
    if (r.method() !== "GET") {
      unexpected.push(r.method() + " " + u.pathname);
      return route.abort();
    }
    if (
      r.resourceType() === "document" &&
      u.pathname === `/advisor/plans/${ids.draft}/review-publish`
    )
      return route.fulfill({
        contentType: "text/html",
        body: '<!doctype html><html lang="en"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/payment-context.css"><div id="root"></div><script type="module" src="/payment-context.js"></script></html>',
      });
    const file = path.resolve(artifacts, "." + u.pathname);
    if (!files.has(file)) {
      unexpected.push(u.pathname);
      return route.abort();
    }
    return route.fulfill({
      body: files.get(file),
      contentType: {
        ".js": "text/javascript",
        ".css": "text/css",
        ".woff2": "font/woff2",
        ".woff": "font/woff",
      }[path.extname(file)],
    });
  });
  const p = await context.newPage();
  p.setDefaultTimeout(2500);
  p.on("pageerror", (e) => errors.push(e.message));
  p.on("console", (m) => {
    if (["error", "warning"].includes(m.type())) errors.push(m.text());
  });
  t.after(async () => {
    holds.forEach((h) => h.release());
    await p.evaluate(() => window.__payment?.dispose()).catch(() => {});
    await context.close();
    assert.deepEqual(unexpected, []);
    assert.deepEqual(errors, expectedErrors);
  });
  await p.goto(origin + `/advisor/plans/${ids.draft}/review-publish`);
  await p
    .getByRole("button", { name: "refresh publication checks", exact: true })
    .click();
  await p.waitForFunction(
    () => window.__payment.c.getSnapshot().context !== null,
  );
  try {
    if (!later)
      await p
        .getByRole("button", { name: "open payment verification", exact: true })
        .waitFor();
    else
      await p
        .getByRole("heading", { name: "review & publish", exact: true })
        .waitFor();
  } catch (error) {
    await fs.writeFile(
      path.join(artifacts, "setup-diagnostic.json"),
      JSON.stringify(
        {
          body: await p.locator("body").innerText(),
          calls,
          errors,
          state: await p.evaluate(() => ({
            state: window.__payment?.c.getSnapshot(),
            permissions: window.__payment?.c.permissions,
            status: window.__payment?.runtime.getSnapshot().status,
          })),
        },
        null,
        2,
      ),
    );
    throw error;
  }
  return {
    p,
    s,
    calls,
    bytes,
    writes: () => calls.filter((c) => c.action === "confirm_payment"),
    hold(action, outcome) {
      const status = typeof outcome === "number" ? outcome : null,
        transform = typeof outcome === "function" ? outcome : null;
      let ready, release;
      const reached = new Promise((r) => (ready = r)),
        promise = new Promise((r) => (release = r));
      const h = {
        action,
        status,
        transform,
        ready,
        promise,
        release,
        used: false,
      };
      holds.push(h);
      return {
        reached,
        release,
        get dto() {
          return h.dto;
        },
      };
    },
    async refresh() {
      await p.evaluate(() => window.__payment.c.refreshContext());
    },
    async open() {
      await p
        .getByRole("button", { name: "open payment verification", exact: true })
        .click();
      await p
        .getByRole("heading", { name: "verify first service payment" })
        .waitFor();
    },
  };
}

const button = (f, name) => f.p.getByRole("button", { name, exact: true });
async function keyboard(f, name) {
  await button(f, name).focus();
  await button(f, name).press("Enter");
}
for (const restriction of ["approval", "coverage"])
  for (const order of ["failure-first", "authority-first"])
    test(`UI status403 ${restriction} ${order}: denial retains exact retry and current restriction`, async (t) => {
      const f = await setup(t, { later: true });
      const ack = f.hold("approve_publication_v1", (v) => ({
        ...v,
        unsupported: true,
      }));
      await keyboard(f, "approve this exact version");
      await ack.reached;
      const original = await f.p.evaluate(() =>
        JSON.stringify(window.__payment.c.getSnapshot().pending),
      );
      ack.release();
      await f.p.getByText("result uncertain", { exact: true }).waitFor();
      await keyboard(f, "refresh publication checks");
      await f.p.getByText("revision approved", { exact: true }).waitFor();
      assert.equal(await button(f, "publish plan").isDisabled(), true);
      f.s.f.context[restriction] =
        restriction === "approval" ? null : "inactive";
      const gate = f.hold("read_advisor_gate_v1");
      await keyboard(f, "refresh publication checks");
      await gate.reached;
      if (order === "authority-first") {
        gate.release();
        await f.p.waitForFunction(
          ({ restriction }) =>
            window.__payment.c.getSnapshot().context?.[restriction] ===
            (restriction === "approval" ? null : "inactive"),
          { restriction },
        );
      }
      const denied = f.hold("request_status_v1", 403);
      assert.equal(await button(f, "check request status").isEnabled(), true);
      await keyboard(f, "check request status");
      await denied.reached;
      denied.release();
      await f.p.getByText("action unavailable", { exact: true }).waitFor();
      if (order === "failure-first") gate.release();
      // Wait for both actual HTTP read responses/mapper turns, not a notice alone.
      await f.p.waitForFunction(
        () => window.__payment.c.getSnapshot().busy === false,
      );
      await f.p.evaluate(
        () =>
          new Promise((r) =>
            requestAnimationFrame(() => requestAnimationFrame(r)),
          ),
      );
      await f.p.screenshot({
        path: path.join(artifacts, `${restriction}-${order}.png`),
        fullPage: true,
      });
      assert.equal(
        await button(f, "publish plan").isDisabled(),
        true,
        "failed lookup must never unlock stale publication authority",
      );
      assert.equal(await button(f, "check request status").isEnabled(), true);
      assert.equal(await button(f, "retry same request").isEnabled(), true);
      assert.equal(
        await f.p.evaluate(() =>
          JSON.stringify(window.__payment.c.getSnapshot().pending),
        ),
        original,
      );
      assert.equal(
        await f.p.evaluate(() => window.__payment.c.getSnapshot().save),
        "uncertain",
      );
      await f.p.waitForFunction(
        ({ restriction }) =>
          window.__payment.c.getSnapshot().context?.[restriction] ===
          (restriction === "approval" ? null : "inactive"),
        { restriction },
      );
      // Positive receipt acknowledges exact A, while the completed C restriction survives.
      await keyboard(f, "check request status");
      await f.p.waitForFunction(
        () => window.__payment.c.getSnapshot().pending === null,
      );
      assert.equal(await button(f, "publish plan").isDisabled(), true);
      assert.equal(await button(f, "check request status").count(), 0);
      assert.deepEqual(
        f.calls
          .filter((c) => c.action === "request_status_v1")
          .map((c) => c.requestId),
        [JSON.parse(original).requestId, JSON.parse(original).requestId],
      );
      assert.deepEqual(
        f.bytes.filter(
          (v) => JSON.parse(v).action === "approve_publication_v1",
        ),
        [original],
      );
      assert.equal(
        f.calls.some((c) => c.action === "publish_plan_v1"),
        false,
      );
      f.s.f.context.approval = ack.dto;
      f.s.f.context.coverage = "active";
      await keyboard(f, "refresh publication checks");
      await f.p.waitForFunction(() => window.__payment.c.canPublish());
      assert.equal(
        await button(f, "publish plan").isEnabled(),
        true,
        "only a lawful current gate restores publication eligibility",
      );
      assert.equal(
        f.calls.some((c) => c.action === "publish_plan_v1"),
        false,
      );
    });
