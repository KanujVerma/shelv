// SYNTHETIC / DO NOT FULFILL. Actual React workspace/controller, cookie factories,
// transport, app ports and canonical DTO mappers. Only finite HTTP delivery is fake.
import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { build } from "esbuild";
import { chromium } from "playwright-core";
import { fixture, ids } from "./rebuild/advisor-fixture.mjs";
import { buildPaymentCall } from "../../../supabase/functions/concierge-payments/contract.ts";
import {
  buildPaymentCallV2,
  mapPaymentViewV2,
} from "../../../supabase/functions/concierge-payments/methods.ts";

const portal = path.resolve(import.meta.dirname, ".."),
  artifacts = path.resolve(
    portal,
    "../../.local-artifacts/portal-rebuild/w2-payment-context",
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
      import React, {useState} from 'react';
      import {createRoot} from 'react-dom/client';
      import {createApplicationSession} from './src/app/session.ts';
      import {createAdvisorPorts} from './src/app/ports.ts';
      import {AdvisorWorkspace,createAdvisorController} from './src/features/advisor/index.ts';
      import {OverlayProvider} from './src/ui/index.ts';
      import './src/ui/foundation.css'; import './src/shell/shell.css';
      const runtime=createApplicationSession({audience:'advisor',locks:{request:async(_,o,run)=>run(o.signal)}});
      await runtime.restore();
      const adapter=createAdvisorPorts(runtime),c=createAdvisorController({session:runtime.getSnapshot().boundary,permissions:adapter.permissions,ports:adapter.ports});
      window.__payment={runtime,adapter,c,dispose(){c.dispose();adapter.dispose();runtime.dispose()}};
      function App(){const [route,navigate]=useState({name:'advisor-editor',draftId:'${ids.draft}',section:'review-publish'});
        return <React.StrictMode><OverlayProvider><div className="shelv-shell"><div className="shelv-main"><main className="shelv-content"><AdvisorWorkspace controller={c} navigation={{route,navigate}}/></main></div></div></OverlayProvider></React.StrictMode>}
      createRoot(document.getElementById('root')).render(<App/>);
    `,
    },
    outfile: path.join(artifacts, "payment-context.js"),
    tsconfig: "tsconfig.frontend.json",
    bundle: true,
    format: "esm",
    write: false,
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
async function setup(t, { version = 1, count = 1, width = 1440 } = {}) {
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
        hold.ready();
        await hold.promise;
        if (hold.status) {
          status = hold.status;
          result = { code: "unavailable" };
        }
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
    if (r.resourceType() === "document")
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
    await p
      .getByRole("button", { name: "open payment verification", exact: true })
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
    writes: () => calls.filter((c) => c.action === "confirm_payment"),
    hold(action, status) {
      let ready, release;
      const reached = new Promise((r) => (ready = r)),
        promise = new Promise((r) => (release = r));
      const h = { action, status, ready, promise, release, used: false };
      holds.push(h);
      return { reached, release };
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
const amount = (f) =>
  f.p.getByLabel("actual gross amount received", { exact: true });
const confirm = (f) =>
  f.p.getByRole("button", { name: "confirm verified payment", exact: true });
async function receipt(f) {
  await amount(f).fill("100.00");
  await f.p
    .getByLabel("receipt checked outside shelv", { exact: true })
    .click();
  await f.p
    .getByRole("option", {
      name: "amount, recipient and transaction checked",
      exact: true,
    })
    .click();
}
async function resetIntent(f) {
  assert.equal(await amount(f).inputValue(), "");
  assert.equal(await confirm(f).isDisabled(), true);
  assert.match(
    await f.p
      .getByLabel("receipt checked outside shelv", { exact: true })
      .innerText(),
    /not yet checked/,
  );
}
async function choose(f, id) {
  const select = f.p.getByLabel("payment claim", { exact: true });
  await select.focus();
  await select.press("Space");
  const option = f.p.getByRole("option", { name: id, exact: true });
  await option.waitFor();
  await option.press("Enter");
  await f.p.waitForFunction(
    (id) =>
      document.querySelector('[role="combobox"]')?.textContent?.includes(id),
    id,
  );
  assert.match(await select.innerText(), new RegExp(id));
}

for (const version of [1, 2])
  test(`late single v${version} claim arrives after verification opens: explicit receipt submits exact current basis/CAS`, async (t) => {
    const f = await setup(t, { version, count: 0 });
    f.s.payments = paymentView(f.s.f, version, 1);
    const h = f.hold("advisor_read");
    await f.p
      .getByRole("button", { name: "refresh publication checks", exact: true })
      .click();
    await h.reached;
    await f.open();
    assert.equal(
      await f.p
        .getByText("no applicable unverified claim available", { exact: true })
        .isVisible(),
      true,
    );
    assert.equal(f.writes().length, 0);
    h.release();
    await f.p.waitForFunction(
      (id) =>
        window.__payment.c
          .getSnapshot()
          .context?.payments.claims.some((c) => c.id === id),
      ids.claim,
    );
    await amount(f).waitFor(); // Original bug: the sole late claim never becomes selected.
    await resetIntent(f);
    assert.match(
      await f.p.locator("body").innerText(),
      /Maya SYNTHETIC.*first service payment/,
    );
    assert.match(
      await f.p.locator("body").innerText(),
      version === 2
        ? /cash app.*SYNTHETIC recipient.*\$synthetic/
        : /frozen method and recipient on this legacy quote/,
    );
    assert.equal(f.writes().length, 0);
    if (version === 2)
      await f.p.screenshot({
        path: path.join(artifacts, "late-v2-receipt-form-1440.png"),
        fullPage: true,
      });
    await receipt(f);
    assert.equal(await confirm(f).isEnabled(), true);
    await confirm(f).click();
    await f.p
      .getByRole("button", { name: "open payment verification", exact: true })
      .waitFor();
    assert.equal(f.writes().length, 1);
    const c = f.writes()[0];
    assert.match(c.requestId, /^[0-9a-f-]{36}$/);
    assert.equal(c.claimId, ids.claim);
    assert.equal(c.expectedRevision, 2);
    assert.equal(c.schemaVersion, version === 2 ? 2 : undefined);
    assert.equal(c.bankReceiptVerified, version === 1 ? true : undefined);
    assert.equal(c.receiptVerified, version === 2 ? true : undefined);
    assert.equal(
      f.calls.some((c) => c.action === "publish_plan_v1"),
      false,
    );
  });

test("multiple claims: switching and switching back never transfers manual receipt intent", async (t) => {
  const f = await setup(t, { version: 2, count: 2 });
  await f.open();
  await receipt(f);
  await choose(f, secondClaim);
  await resetIntent(f);
  await receipt(f);
  await choose(f, ids.claim);
  await resetIntent(f);
  assert.equal(f.writes().length, 0);
});

test("same claim and frozen basis preserves manual work across a harmless finance revision and uses current CAS", async (t) => {
  const f = await setup(t, { version: 2 });
  await f.open();
  await receipt(f);
  f.s.payments.revision = 9;
  await f.refresh();
  assert.equal(await amount(f).inputValue(), "100.00");
  assert.equal(await confirm(f).isEnabled(), true);
  await confirm(f).click();
  await f.p
    .getByRole("button", { name: "open payment verification", exact: true })
    .waitFor();
  assert.equal(f.writes()[0].expectedRevision, 9);
});

for (const change of [
  "claim",
  "quote",
  "quote version",
  "claim status",
  "quote status",
  "recipient",
  "option",
  "service cancelled",
]) {
  test(`changed ${change} resets receipt intent without automatic confirmation`, async (t) => {
    const f = await setup(t, { version: 2 });
    await f.open();
    await receipt(f);
    const p = f.s.payments,
      q = p.quotes[0],
      c = p.claims[0],
      original = clone(p);
    if (change === "claim") c.id = secondClaim;
    if (change === "quote") {
      q.id = secondQuote;
      c.quoteId = secondQuote;
    }
    if (change === "quote version") {
      q.version++;
      c.quoteVersion++;
    }
    if (change === "claim status") c.status = "rejected";
    if (change === "quote status") q.status = "superseded";
    if (change === "recipient")
      q.paymentOptions[0].recipient.cashtag = "$changed";
    if (change === "option") {
      q.paymentOptions[0].id = secondQuote;
      c.paymentOptionId = secondQuote;
    }
    if (change === "service cancelled") p.service.status = "cancelled";
    p.revision++;
    await f.refresh();
    if (
      ["claim status", "quote status", "service cancelled"].includes(change)
    ) {
      if (await confirm(f).count())
        assert.equal(await confirm(f).isDisabled(), true);
      f.s.payments = { ...original, revision: p.revision + 1 };
      await f.refresh();
    }
    await resetIntent(f);
    assert.equal(f.writes().length, 0);
  });
}

test("selected claim removal chooses the remaining exact claim, then zero and late reappearance need fresh verification", async (t) => {
  const f = await setup(t, { count: 2 });
  await f.open();
  await receipt(f);
  f.s.payments.claims.shift();
  f.s.payments.quotes.shift();
  f.s.payments.revision++;
  await f.refresh();
  await resetIntent(f);
  await receipt(f);
  f.s.payments = paymentView(f.s.f, 1, 0);
  await f.refresh();
  assert.equal(await amount(f).count(), 0);
  f.s.payments = paymentView(f.s.f, 1, 1);
  await f.refresh();
  await resetIntent(f);
  assert.equal(f.writes().length, 0);
});

test("back and reopening clears unsubmitted manual verification", async (t) => {
  const f = await setup(t);
  await f.open();
  await receipt(f);
  await f.p
    .getByRole("button", { name: "back to publication checks", exact: true })
    .click();
  await f.open();
  await resetIntent(f);
  assert.equal(f.writes().length, 0);
});

test("late multiple claims reconcile selection and keep explicit choice available", async (t) => {
  const f = await setup(t, { count: 0 });
  f.s.payments = paymentView(f.s.f, 1, 2);
  const h = f.hold("advisor_read");
  await f.p
    .getByRole("button", { name: "refresh publication checks", exact: true })
    .click();
  await h.reached;
  await f.open();
  h.release();
  await amount(f).waitFor();
  await resetIntent(f);
  await choose(f, secondClaim);
  await resetIntent(f);
  await receipt(f);
  await confirm(f).click();
  await f.p
    .getByRole("button", { name: "open payment verification", exact: true })
    .waitFor();
  assert.equal(f.writes()[0].claimId, secondClaim);
});

test("claim order and unrelated claims do not replace the selected unchanged receipt basis", async (t) => {
  const f = await setup(t, { count: 2 });
  await f.open();
  await choose(f, secondClaim);
  await receipt(f);
  f.s.payments.claims.reverse();
  f.s.payments.quotes.reverse();
  f.s.payments.revision++;
  await f.refresh();
  assert.equal(await amount(f).inputValue(), "100.00");
  assert.equal(await confirm(f).isEnabled(), true);
  assert.match(
    await f.p.getByLabel("payment claim", { exact: true }).innerText(),
    new RegExp(secondClaim),
  );
});

test("a frozen v2 recipient still supports receipt confirmation after availability for new claims changes", async (t) => {
  const f = await setup(t, { version: 2 });
  await f.open();
  await receipt(f);
  f.s.payments.quotes[0].paymentOptions[0].available = false;
  f.s.payments.revision++;
  await f.refresh();
  assert.equal(await amount(f).inputValue(), "100.00");
  assert.equal(await confirm(f).isEnabled(), true);
  await confirm(f).click();
  await f.p
    .getByRole("button", { name: "open payment verification", exact: true })
    .waitFor();
  assert.equal(f.writes()[0].paymentOptionId, optionId);
});

for (const width of [390, 320])
  test(`late sole claim is operable by keyboard at ${width}px`, async (t) => {
    const f = await setup(t, { count: 0, width });
    f.s.payments = paymentView(f.s.f, 1);
    const h = f.hold("advisor_read");
    await f.p
      .getByRole("button", { name: "refresh publication checks", exact: true })
      .click();
    await h.reached;
    await f.open();
    h.release();
    await amount(f).waitFor();
    await amount(f).focus();
    await f.p.keyboard.type("100.00");
    const checked = f.p.getByLabel("receipt checked outside shelv", {
      exact: true,
    });
    await checked.focus();
    await checked.press("Space");
    const option = f.p.getByRole("option", {
      name: "amount, recipient and transaction checked",
      exact: true,
    });
    await option.waitFor();
    await option.press("Enter");
    assert.equal(await confirm(f).isEnabled(), true);
    await confirm(f).focus();
    await f.p.keyboard.press("Enter");
    await f.p
      .getByRole("button", { name: "open payment verification", exact: true })
      .waitFor();
    assert.equal(f.writes().length, 1);
    assert.equal(
      await f.p.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
    );
  });

test("an obsolete visible confirmation cannot act during a same-tick draft switch", async (t) => {
  const f = await setup(t);
  await f.open();
  await receipt(f);
  const v = f.s.f.getView();
  v.draft.id = secondQuote;
  v.target.draftId = secondQuote;
  f.s.f.setView(v);
  await f.p.evaluate((id) => {
    const button = [...document.querySelectorAll("button")].find(
      (b) => b.textContent === "confirm verified payment",
    );
    window.__payment.c.open(id);
    button.click();
  }, secondQuote);
  await f.p.waitForFunction(
    (id) => window.__payment.c.getSnapshot().view?.draft.id === id,
    secondQuote,
  );
  assert.equal(f.writes().length, 0);
});

for (const event of [
  "payment permission",
  "source denial",
  "later gate",
  "new client",
  "new draft",
  "session",
  "same-owner CSRF",
  "current operation",
]) {
  test(`${event} makes old receipt intent unavailable`, async (t) => {
    const f = await setup(t);
    await f.open();
    await receipt(f);
    if (event === "payment permission") {
      f.s.caps.confirmPayments = false;
      await f.refresh();
    }
    if (event === "source denial") {
      const h = f.hold("read_advisor_gate_v1", 403);
      const task = f.refresh();
      await h.reached;
      h.release();
      await task;
    }
    if (event === "later gate") {
      f.s.f.context.publication = "later";
      await f.refresh();
    }
    if (event === "new client" || event === "new draft") {
      const v = f.s.f.getView();
      v.draft.id = secondQuote;
      v.target.draftId = secondQuote;
      if (event === "new client") {
        v.draft.clientId = ids.other;
        v.target.clientId = ids.other;
      }
      f.s.f.setView(v);
      await f.p.evaluate((id) => window.__payment.c.open(id), secondQuote);
      await f.refresh();
    }
    if (event === "session")
      await f.p.evaluate(() => window.__payment.runtime.signOut());
    if (event === "same-owner CSRF") {
      f.s.login = { ...f.s.login, csrf: "SYNTHETIC-replaced" };
      await f.p.evaluate(() => window.__payment.runtime.restore());
    }
    if (event === "current operation") {
      const h = f.hold("approve_publication_v1");
      await f.p.evaluate(() => {
        window.__payment.c.approve();
      });
      await h.reached;
      assert.equal(await confirm(f).isDisabled(), true);
      h.release();
      await f.p.waitForFunction(() => !window.__payment.c.getSnapshot().busy);
    }
    if (await confirm(f).count())
      assert.equal(await confirm(f).isDisabled(), true);
    assert.equal(f.writes().length, 0);
  });
}
