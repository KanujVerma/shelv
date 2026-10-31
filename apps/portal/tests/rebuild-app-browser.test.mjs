import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { chromium } from "playwright-core";
import { fixture, ids, stamp } from "./rebuild/advisor-fixture.mjs";
import { mayaPlan } from "./rebuild/plan-fixture.mjs";
import { projectClientPlan } from "../../../src/contracts/PortalRebuild.ts";
import { parseRoute, buildRoute } from "../src/navigation/routes.ts";
const portal = path.resolve(import.meta.dirname, ".."),
  output = path.resolve(
    portal,
    "../../.local-artifacts/portal-rebuild/application",
  ),
  artifacts = path.resolve(
    portal,
    "../../.local-artifacts/portal-rebuild/w0-app",
  );
const origin = "https://shelv-app.invalid";
const localImages = new Map(
  mayaPlan()
    .plan.content.products.filter((p) =>
      p.imageUrl?.startsWith("https://portal.goshelv.com/maya/assets/"),
    )
    .map((p) => {
      const source = new URL(p.imageUrl).pathname.slice(1);
      return ["/assets/" + path.basename(source), source];
    }),
);
let browser;
async function selectCare(page,label,value) {
  await page.getByRole("combobox",{name:label,exact:true}).click();
  await page.getByRole("option",{name:value,exact:true}).click();
}
before(async () => {
  await fs.mkdir(artifacts, { recursive: true });
  execFileSync(process.execPath, ["scripts/build-portal-app.mjs"], {
    cwd: portal,
    stdio: "pipe",
  });
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
function state() {
  const f = fixture({ ready: true }),
    view = mayaPlan();
  for (const p of view.plan.content.products)
    if (p.imageUrl)
      p.imageUrl = "assets/" + path.basename(new URL(p.imageUrl).pathname);
  return {
    f,
    view,
    careRevision: 0,
    reportedUse: new Map(),
    calls: [],
    signedIn: true,
    csrf: "SYNTHETIC-csrf",
    failure: 0,
    callback: 0,
  };
}
async function setup(initial = "/plan", width = 1440, s = state()) {
  const context = await browser.newContext({
      viewport: { width, height: 960 },
      serviceWorkers: "block",
    }),
    unexpected = [],
    errors = [];
  await context.route("**/*", async (route) => {
    const request = route.request(),
      url = new URL(request.url());
    if (url.origin !== origin) {
      unexpected.push(request.method() + " " + url.pathname);
      return route.abort();
    }
    if (url.pathname.startsWith("/api/")) {
      const audience = url.pathname.split("/")[2],
        endpoint = url.pathname.split("/").slice(3).join("/"),
        command = request.method() === "POST" ? request.postDataJSON() : null;
      s.calls.push({ audience, endpoint, command });
      if (!["client", "advisor"].includes(audience)) {
        unexpected.push("unknown audience");
        return route.abort();
      }
      if (endpoint === "session" && request.method() === "GET")
        return route.fulfill({
          json: s.signedIn
            ? {
                signedIn: true,
                ownerId: ids.actor,
                generation: 1,
                capabilities: {
                  view: true,
                  edit: true,
                  publish: true,
                  confirmPayments: true,
                },
                csrf: s.csrf,
                idleExpiresAt: "2099-01-01T00:00:00Z",
                absoluteExpiresAt: "2099-01-02T00:00:00Z",
              }
            : { signedIn: false, csrf: "SYNTHETIC-flow" },
        });
      if (endpoint === "auth/complete" && request.method() === "POST") {
        s.callback++;
        assert.equal(Object.keys(command).join(","), "code");
        return route.fulfill({
          json: {
            signedIn: true,
            ownerId: ids.actor,
            generation: 1,
            capabilities: {
              view: true,
              edit: true,
              publish: true,
              confirmPayments: true,
            },
            csrf: s.csrf,
            idleExpiresAt: "2099-01-01T00:00:00Z",
            absoluteExpiresAt: "2099-01-02T00:00:00Z",
          },
        });
      }
      if (endpoint === "logout" && request.method() === "POST") {
        s.signedIn = false;
        return route.fulfill({ json: { signedOut: true } });
      }
      if (endpoint === "auth/request" && request.method() === "POST") {
        assert.equal(request.headers()["x-shelv-csrf"], "SYNTHETIC-flow");
        return route.fulfill({ json: { sent: true } });
      }
      if (endpoint === "care" && request.method() === "POST") {
        if (s.failure) return route.fulfill({status:s.failure,json:{code:"unavailable"}});
        const careView = view => ({...view,schemaVersion:2,use:{revision:s.careRevision,planProducts:(view.plan?.content.products??[]).map(product=>({product:{kind:"plan_product",publication:{version:view.plan.version,documentSchemaVersion:view.plan.documentSchemaVersion},productId:product.id,slotId:null},state:"not_reported",originalStart:{state:"unknown"},latestEvent:null,identity:null,contradiction:false,...s.reportedUse.get(product.id)})),reportedProducts:{items:[],nextCursor:null}},latestPublicReview:null});
        if (audience === "client" && command.action === "read_client_plan_v2") {
          assert.deepEqual(command,{schemaVersion:1,action:"read_client_plan_v2",version:null});
          if(s.hold)await new Promise(resolve=>s.release=resolve);
          return route.fulfill({json:careView(s.view)});
        }
        if (audience === "advisor" && command.action === "read_advisor_publication_v2" && s.publication) return route.fulfill({json:careView(s.publication)});
        if (audience === "client" && command.action === "report_product_use_v1") {
          assert.equal(command.change.kind,"stopped");assert.equal(command.expectedUseRevision,s.careRevision);
          s.careRevision++;
          s.reportedUse.set(command.product.productId,{state:"stopped",latestEvent:{eventId:command.requestId,product:command.product,changeKind:"stopped",occurredOn:command.occurredOn,channel:command.channel,reportedBy:ids.actor,recordedBy:ids.actor,recordedAt:stamp,sourcePublication:command.sourcePublication,acquisition:command.acquisition,identityEventId:null,originalActivationId:null,amendment:null}});
          return route.fulfill({json:{requestId:command.requestId,event:{kind:"use",id:command.requestId},revision:s.careRevision,recordedAt:stamp,notificationEventId:null}});
        }
        throw Error("unexpected finite care command "+command.action);
      }
      if (endpoint === "plans" && request.method() === "POST") {
        if (s.failure)
          return route.fulfill({
            status: s.failure,
            json: { code: "unavailable" },
          });
        if (audience === "client") {
          if (command.action === "read_client_plan_v1") {
            assert.deepEqual(command, {
              schemaVersion: 1,
              action: "read_client_plan_v1",
              version: null,
            });
            if (s.hold) {
              await new Promise((r) => (s.release = r));
            }
            return route.fulfill({ json: s.view });
          }
          if (command.action === "record_decision_v1") {
            s.view = {
              ...s.view,
              decisionRevision: s.view.decisionRevision + 1,
              decisions: [
                {
                  decisionId: command.decisionId,
                  choice: command.choice,
                  reason: command.reason,
                },
              ],
            };
            return route.fulfill({
              json: {
                requestId: command.requestId,
                decisionRevision: s.view.decisionRevision,
                publicationVersion: command.publicationVersion,
                decisionId: command.decisionId,
                choice: command.choice,
                reason: command.reason,
              },
            });
          }
        } else {
          if (command.action === "read_advisor_publication_v1" && s.publication)
            return route.fulfill({ json: s.publication });
          if (command.action === "read_advisor_gate_v1")
            return route.fulfill({
              json: {
                schemaVersion: 1,
                clientId: ids.client,
                target: command.target,
                publisher: command.publisher,
                approval: s.f.context.approval,
                publication: s.f.context.publication,
                coverage: s.f.context.coverage,
                capabilities: s.f.options.permissions,
                policy: {
                  revision: 1,
                  ownerActorId: ids.actor,
                  requireKanujApproval: true,
                },
              },
            });
          const actions = [
            "list_plans_v1",
            "read_draft_v1",
            "create_draft_v1",
            "save_draft_v1",
            "assign_draft_v1",
            "compare_import_v1",
            "apply_import_v1",
            "validate_draft_v1",
            "preview_draft_v1",
            "review_section_v1",
            "approve_publication_v1",
            "publish_plan_v1",
            "request_status_v1",
          ];
          if (actions.includes(command.action))
            return route.fulfill({
              json: await s.f.options.ports.plans.execute(command),
            });
        }
      }
      if (
        audience === "advisor" &&
        endpoint === "operations" &&
        request.method() === "POST" &&
        command.action === "advisor_list"
      ) {
        const directory = await s.f.options.ports.clients.execute(command);
        if (s.publication)
          directory.clients[0].publishedVersion = s.publication.version;
        return route.fulfill({ json: directory });
      }
      if (
        audience === "advisor" &&
        endpoint === "payments" &&
        request.method() === "POST"
      ) {
        if (command.action === "advisor_read")
          return route.fulfill({
            json: {
              ...s.f.context.payments,
              schemaVersion: 2,
              quotes: s.f.context.payments.quotes.map((q) => ({
                ...q,
                contractVersion: 1,
                paymentOptions: [],
              })),
              claims: s.f.context.payments.claims.map((c) => ({
                ...c,
                paymentOptionId: null,
              })),
            },
          });
        if (command.action === "confirm_payment")
          return route.fulfill({
            json: await s.f.options.ports.payments.execute(command),
          });
      }
      unexpected.push(
        request.method() + " " + url.pathname + " " + (command?.action ?? ""),
      );
      return route.abort();
    }
    if (request.method() !== "GET") {
      unexpected.push(request.method() + " " + url.pathname);
      return route.abort();
    }
    const pathname =
        request.resourceType() === "document" &&
        (parseRoute(url.pathname) || url.pathname === "/missing")
          ? "index.html"
          : (localImages.get(url.pathname) ?? url.pathname.slice(1)),
      file = path.resolve(output, pathname);
    if (!file.startsWith(output + path.sep)) {
      unexpected.push(url.pathname);
      return route.abort();
    }
    try {
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
    } catch {
      unexpected.push(url.pathname);
      return route.abort();
    }
  });
  const page = await context.newPage();
  page.setDefaultTimeout(5000);
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(origin + initial);
  return {
    page,
    s,
    async close() {
      s.release?.();
      await context.close();
      assert.deepEqual(unexpected, []);
      assert.deepEqual(errors, []);
    },
  };
}
test("actual app public Maya/unknown entry never contacts auth; PKCE callback scrubbed before navigation state", async () => {
  for (const initial of ["/maya", "/missing"]) {
    const f = await setup(initial);
    try {
      await f.page.getByRole("heading", { level: 1 }).waitFor();
      assert.equal(f.s.calls.length, 0);
      assert.match(
        await f.page.locator("body").innerText(),
        initial === "/maya" ? /fictional demo/ : /page unavailable/,
      );
    } finally {
      await f.close();
    }
  }
  const f = await setup("/plan?code=SYNTHETIC-callback");
  try {
    await f.page
      .getByRole("heading", { name: "your current routine" })
      .waitFor();
    assert.equal(f.page.url(), origin + "/plan");
    assert.equal(f.s.callback, 1);
    assert.equal(
      JSON.stringify(await f.page.evaluate(() => history.state)).includes(
        "callback",
      ),
      false,
    );
  } finally {
    await f.close();
  }
});
test("actual client app reads/decides through fixed cookie ports and restores product/evidence/routine context", async () => {
  const f = await setup("/plan");
  try {
    const p = f.page;
    await p.getByRole("heading", { name: "your current routine" }).waitFor();
    await p.getByRole("tab", { name: "evening", exact: true }).click();
    await p.waitForURL("**/plan?routine=evening");
    await p.locator("#plan-product-cerave-pm").click();
    await p.getByRole("dialog").waitFor();
    await p
      .getByRole("button", { name: "ingredients & evidence", exact: true })
      .click();
    await p
      .getByRole("heading", {
        name: "CeraVe PM Facial Moisturizing Lotion · ingredients & reasoning",
      })
      .waitFor();
    await p
      .getByRole("button", { name: "back to product", exact: true })
      .click();
    await p.getByRole("dialog").waitFor();
    await p.keyboard.press("Escape");
    await p.waitForURL("**/plan?routine=evening");
    await p
      .locator(".plan-proposal")
      .filter({ hasText: "Azelaic Acid Suspension 10%" })
      .getByRole("button", { name: "review recommendation", exact: true })
      .click();
    await p
      .getByRole("button", { name: "approve product", exact: true })
      .click();
    await p.getByText("choice recorded", { exact: true }).waitFor();
    assert.equal(
      f.s.calls.filter((c) => c.command?.action === "record_decision_v1")
        .length,
      1,
    );
    assert.equal(
      f.s.calls.filter((c) => c.command?.action === "read_client_plan_v2")
        .length,
      2,
    );
    assert.deepEqual(f.s.view.actualUse, []);
    assert.equal(
      f.s.calls.some((c) =>
        /start|payment|publish|notification/.test(c.command?.action ?? ""),
      ),
      false,
    );
    await p.screenshot({
      path: path.join(artifacts, "client-1440.png"),
      fullPage: true,
    });
    await p.getByRole("link", { name: "orders", exact: true }).click();
    await p
      .getByText("this page is not connected yet", { exact: true })
      .waitFor();
    await p.getByRole("button", { name: "sign out", exact: true }).click();
    await p
      .getByRole("button", { name: "send sign-in link", exact: true })
      .waitFor();
    assert.equal(
      await p
        .getByText("Azelaic Acid Suspension 10%", { exact: false })
        .count(),
      0,
    );
  } finally {
    await f.close();
  }
});
test("advisor workspace uses actual draft source for unpublished preview and returns to exact editor section", async () => {
  const s = state(),
    v = s.f.getView();
  v.draft.content = mayaPlan().plan.content;
  s.f.setView(v);
  const f = await setup(`/advisor/plans/${ids.draft}/routine`, 1440, s);
  try {
    const p = f.page;
    await p.getByRole("heading", { name: "routine", exact: true }).waitFor();
    await p
      .getByRole("button", { name: "open client preview", exact: true })
      .click();
    await p.waitForURL(`**/advisor/plans/${ids.draft}/preview`);
    await p.getByText("unpublished preview", { exact: true }).last().waitFor();
    await p
      .getByRole("heading", { name: "draft routine", exact: true })
      .waitFor();
    await p.getByRole("tab", { name: "evening", exact: true }).click();
    await p.locator("#plan-product-cerave-pm").click();
    await p.getByRole("dialog").waitFor();
    await p
      .getByRole("button", { name: "ingredients & evidence", exact: true })
      .click();
    assert.ok(p.url().endsWith("/preview"));
    await p.goBack();
    await p.getByRole("dialog").waitFor();
    assert.ok(p.url().endsWith("/preview"));
    await p.goForward();
    await p.locator("[data-plan-evidence]").waitFor();
    await p
      .getByRole("button", { name: "back to product", exact: true })
      .click();
    await p.keyboard.press("Escape");
    await p.getByRole("button", { name: "back to draft", exact: true }).click();
    await p.waitForURL(`**/advisor/plans/${ids.draft}/routine`);
    await p.getByRole("heading", { name: "routine", exact: true }).waitFor();
    await p.waitForFunction(
      () => document.activeElement?.id === "advisor-preview-open-plan",
    );
    await p
      .getByRole("button", { name: "open client preview", exact: true })
      .click();
    await p
      .getByRole("heading", { name: "draft routine", exact: true })
      .waitFor();
    await p.getByRole("button", { name: "back to draft", exact: true }).click();
    await p.waitForURL(`**/advisor/plans/${ids.draft}/routine`);
    assert.equal(
      s.calls.some((c) => c.command?.action === "record_decision_v1"),
      false,
    );
    await p.screenshot({
      path: path.join(artifacts, "advisor-editor-1440.png"),
      fullPage: true,
    });
  } finally {
    await f.close();
  }
});
test("preview native history retains nonzero scroll and distinct focus through repeated traversal and resets", async () => {
  const s = state(),
    view = s.f.getView();
  view.draft.content = mayaPlan().plan.content;
  s.f.setView(view);
  const f = await setup(`/advisor/plans/${ids.draft}/routine`, 1440, s);
  try {
    const p = f.page;
    // Deliberately long synthetic viewport geometry, without changing UI source.
    await p.addStyleTag({ content: ".shelv-content { min-height: 2400px; }" });
    await p.getByRole("heading", { name: "routine", exact: true }).waitFor();
    await p
      .getByRole("button", { name: "open client preview", exact: true })
      .click();
    await p
      .getByRole("heading", { name: "draft routine", exact: true })
      .waitFor();
    await p.getByRole("tab", { name: "evening", exact: true }).click();
    await p.locator("#plan-product-cerave-pm").click();
    await p.getByRole("dialog").waitFor();
    await p.evaluate(
      () =>
        new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(resolve)),
        ),
    );
    await p.evaluate(() => window.scrollTo({ top: 250, behavior: "instant" }));
    await p.waitForFunction(
      () =>
        window.scrollY === 250 &&
        history.state.shelvNavigation.restore.scrollY === 250,
    );
    await p
      .getByRole("button", { name: "ingredients & evidence", exact: true })
      .click();
    await p.locator("[data-plan-evidence]").waitFor();
    await p.evaluate(
      () =>
        new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(resolve)),
        ),
    );
    await p.evaluate(() => {
      document.getElementById("portal-content").focus({ preventScroll: true });
      window.scrollTo({ top: 600, behavior: "instant" });
    });
    await p.waitForFunction(
      () =>
        scrollY === 600 &&
        document.activeElement.id === "portal-content" &&
        history.state.shelvNavigation.restore.scrollY === 600,
    );
    for (let repeat = 0; repeat < 3; repeat++) {
      await p.goBack();
      await p.getByRole("dialog").waitFor();
      await p.waitForFunction(
        () =>
          scrollY === 250 &&
          document.activeElement?.textContent === "back to plan",
      );
      await p.goForward();
      await p.locator("[data-plan-evidence]").waitFor();
      try {
        await p.waitForFunction(
          () =>
            scrollY === 600 && document.activeElement?.id === "portal-content",
        );
      } catch (error) {
        assert.deepEqual(
          await p.evaluate(() => ({
            scrollY,
            focus: document.activeElement?.id,
          })),
          { scrollY: 600, focus: "portal-content" },
        );
        throw error;
      }
    }
    assert.equal(
      JSON.stringify(await p.evaluate(() => history.state)).includes(
        "cerave-pm",
      ),
      false,
    );
    await p.goBack();
    await p.getByRole("dialog").waitFor();
    await p.keyboard.press("Escape");
    await p
      .getByRole("tab", { name: "evening", exact: true, selected: true })
      .waitFor();
    await p.getByRole("button", { name: "back to draft", exact: true }).click();
    await p.waitForURL(`**/advisor/plans/${ids.draft}/routine`);
    await p.waitForFunction(
      () => document.activeElement.id === "advisor-preview-open-plan",
    );
    await p
      .getByRole("button", { name: "open client preview", exact: true })
      .click();
    await p
      .getByRole("tab", { name: "morning", exact: true, selected: true })
      .waitFor();
    await p.reload();
    await p
      .getByRole("heading", { name: "draft routine", exact: true })
      .waitFor();
    await p
      .getByRole("tab", { name: "morning", exact: true, selected: true })
      .waitFor();
    await p.getByRole("tab", { name: "evening", exact: true }).click();
    await p.locator("#plan-product-cerave-pm").click();
    await p.getByRole("dialog").waitFor();
    const oldScope = await p.evaluate(
      () => history.state.shelvNavigation.scopeKey,
    );
    s.csrf = "SYNTHETIC-replacement-csrf";
    await p.evaluate(() => window.dispatchEvent(new Event("focus")));
    await p.waitForFunction(
      (scope) => history.state?.shelvNavigation?.scopeKey !== scope,
      oldScope,
    );
    await p
      .getByRole("heading", { name: "draft routine", exact: true })
      .waitFor();
    await p
      .getByRole("tab", { name: "morning", exact: true, selected: true })
      .waitFor();
    assert.equal(await p.getByRole("dialog").count(), 0);
    await p.getByRole("button", { name: "back to draft", exact: true }).click();
    await p.waitForURL(`**/advisor/plans/${ids.draft}/sources`);
    assert.equal(
      s.calls.some((c) => c.command?.action === "record_decision_v1"),
      false,
    );
  } finally {
    await f.close();
  }
});

test("first publication needs current approval and separately verified manual receipt plus deliberate publish", async () => {
  const f = await setup(`/advisor/plans/${ids.draft}/review-publish`);
  try {
    const p = f.page;
    await p
      .getByRole("button", { name: "refresh publication checks", exact: true })
      .click();
    await p.getByText("first publication", { exact: true }).waitFor();
    assert.equal(
      await p
        .getByRole("button", { name: "publish first plan", exact: true })
        .isDisabled(),
      true,
    );
    await p
      .getByRole("button", { name: "approve this exact version", exact: true })
      .click();
    await p.getByText("revision approved", { exact: true }).waitFor();
    assert.equal(
      await p
        .getByRole("button", { name: "publish first plan", exact: true })
        .isDisabled(),
      true,
    );
    assert.equal(
      f.s.calls.some((c) => c.command?.action === "publish_plan_v1"),
      false,
    );
    await p
      .getByRole("button", { name: "open payment verification", exact: true })
      .click();
    await p
      .getByRole("textbox", { name: "actual gross amount received" })
      .fill("100.00");
    await p
      .getByRole("combobox", { name: "receipt checked outside shelv" })
      .click();
    await p
      .getByRole("option", {
        name: "amount, recipient and transaction checked",
      })
      .click();
    await p
      .getByRole("button", { name: "confirm verified payment", exact: true })
      .click();
    await p
      .getByRole("button", { name: "publish first plan", exact: true })
      .waitFor();
    assert.equal(
      f.s.calls.filter((c) => c.command?.action === "publish_plan_v1").length,
      0,
    );
    assert.equal(
      await p
        .getByRole("button", { name: "publish first plan", exact: true })
        .isEnabled(),
      true,
    );
    await p
      .getByRole("button", { name: "publish first plan", exact: true })
      .click();
    await p
      .getByRole("heading", { name: "publication committed", exact: true })
      .waitFor();
    assert.equal(
      f.s.calls.filter((c) => c.command?.action === "publish_plan_v1").length,
      1,
    );
    assert.equal(
      f.s.calls.filter((c) => c.command?.action === "confirm_payment").length,
      1,
    );
    await p.screenshot({
      path: path.join(artifacts, "publication-1440.png"),
      fullPage: true,
    });
  } finally {
    await f.close();
  }
});
test("direct preview reload and client responsive preparation/denied states use current source and truthful recovery", async () => {
  const f = await setup(`/advisor/plans/${ids.draft}/preview`, 390);
  try {
    await f.page
      .getByRole("heading", { name: "draft routine", exact: true })
      .waitFor();
    assert.deepEqual(
      f.s.calls
        .filter(
          (c) =>
            c.endpoint === "plans" &&
            c.command.action !== "read_advisor_gate_v1",
        )
        .map((c) => c.command.action),
      ["read_draft_v1", "preview_draft_v1", "read_draft_v1"],
    );
    await f.page.getByRole("button", { name: "menu", exact: true }).click();
    await f.page
      .getByRole("navigation", { name: "advisor navigation" })
      .waitFor();
    await f.page.keyboard.press("Escape");
    assert.equal(
      await f.page
        .getByRole("navigation", { name: "advisor navigation" })
        .isVisible(),
      false,
    );
    await f.page.reload();
    await f.page
      .getByRole("heading", { name: "draft routine", exact: true })
      .waitFor();
    assert.equal(
      await f.page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
    await f.page.screenshot({
      path: path.join(artifacts, "preview-390.png"),
      fullPage: true,
    });
  } finally {
    await f.close();
  }
  for (const width of [320, 390]) {
    const s = state();
    s.view = {
      schemaVersion: 1,
      access: "preparation",
      plan: null,
      decisionRevision: 0,
      decisions: [],
      actualUse: [],
      nextReviewOn: null,
    };
    const c = await setup("/plan", width, s);
    try {
      await c.page
        .getByText("your plan is being prepared", { exact: true })
        .waitFor();
      assert.equal(
        await c.page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
      );
    } finally {
      await c.close();
    }
  }
  const s = state();
  s.failure = 403;
  const denied = await setup("/plan", 1440, s);
  try {
    await denied.page
      .getByText("plan access unavailable", { exact: true })
      .waitFor();
    assert.equal(
      await denied.page
        .getByRole("button", { name: "approve product", exact: true })
        .count(),
      0,
    );
  } finally {
    await denied.close();
  }
});

test("unassigned draft create/edit/import/review/assign uses actual controller and fixed application ports", async () => {
  const s = state();
  s.f = fixture({ ready: false });
  const f = await setup("/advisor/plans", 1440, s);
  try {
    const p = f.page;
    await p.getByRole("button", { name: "new plan", exact: true }).click();
    await p.waitForURL(`**/advisor/plans/${ids.draft}/client-context`);
    await p
      .getByRole("textbox", { name: "plan title", exact: true })
      .fill("SYNTHETIC incomplete work");
    await p.getByText("saved", { exact: true }).waitFor();
    assert.equal(
      s.f.getView().draft.content.title,
      "SYNTHETIC incomplete work",
    );
    assert.equal(s.f.getView().draft.clientId, null);
    await p
      .getByRole("button", { name: "import agent draft", exact: true })
      .click();
    const content = structuredClone(s.f.getView().draft.content);
    content.summary = "SYNTHETIC imported summary";
    await p
      .getByRole("textbox", { name: "plan JSON", exact: true })
      .fill(JSON.stringify(content));
    await p
      .getByRole("button", { name: "compare import", exact: true })
      .click();
    await p
      .getByRole("button", { name: "apply compared import", exact: true })
      .click();
    await p.getByText("saved", { exact: true }).waitFor();
    assert.equal(
      s.f.getView().draft.content.summary,
      "SYNTHETIC imported summary",
    );
    await p
      .getByRole("button", { name: "mark section reviewed", exact: true })
      .click();
    await p
      .getByRole("button", { name: "section reviewed", exact: true })
      .waitFor();
    await p.getByRole("button", { name: "assign client", exact: true }).click();
    await p.getByRole("combobox", { name: "admitted client" }).click();
    await p.getByRole("option", { name: "Maya SYNTHETIC" }).click();
    await p
      .getByRole("button", { name: "confirm intended client", exact: true })
      .click();
    await p.getByText("Maya SYNTHETIC", { exact: true }).first().waitFor();
    assert.equal(s.f.getView().draft.clientId, ids.client);
    assert.equal(
      s.calls.some(
        (c) =>
          c.endpoint === "admission" ||
          /auth.*create/.test(c.command?.action ?? ""),
      ),
      false,
    );
    assert.equal(
      s.calls.some((c) => c.command?.action === "publish_plan_v1"),
      false,
    );
  } finally {
    await f.close();
  }
});
test("canonical publication audit preserves ended client access and real envelope metadata", async () => {
  const s = state();
  s.publication = {
    schemaVersion: 1,
    clientId: ids.client,
    version: 7,
    plan: { ...s.view.plan, version: 7 },
    decisionRevision: 0,
    decisions: [],
    actualUse: [],
    nextReviewOn: null,
    reviewSchedule: null,
    clientAccess: {
      care: "ended",
      entitled: false,
      canRead: false,
      canWrite: false,
    },
  };
  const f = await setup(`/advisor/clients/${ids.client}?task=history`, 1440, s);
  try {
    const p = f.page;
    await p
      .getByRole("button", { name: "read current publication", exact: true })
      .click();
    await p
      .getByRole("heading", { name: "published plan record", exact: true })
      .waitFor();
    assert.match(await p.locator("main").innerText(), /ended/);
    assert.match(
      await p.locator("main").innerText(),
      /full history and restore controls are not connected yet/,
    );
    assert.equal(
      s.calls.filter((c) => c.command?.action === "read_advisor_publication_v2")
        .length,
      1,
    );
    assert.equal(
      await p
        .getByRole("button", { name: "approve product", exact: true })
        .count(),
      0,
    );
  } finally {
    await f.close();
  }
});
test("late private read after logout cannot remount data; bad callback never starts completion", async () => {
  const s = state();
  s.hold = true;
  const f = await setup("/plan", 1440, s);
  try {
    const p = f.page;
    await p.getByRole("button", { name: "sign out", exact: true }).waitFor();
    await p.getByRole("button", { name: "sign out", exact: true }).click();
    s.release?.();
    await p
      .getByRole("button", { name: "send sign-in link", exact: true })
      .waitFor();
    assert.equal(
      await p.getByRole("heading", { name: "your current routine" }).count(),
      0,
    );
    assert.equal(
      await p
        .getByText("Azelaic Acid Suspension 10%", { exact: false })
        .count(),
      0,
    );
  } finally {
    await f.close();
  }
  const bad = await setup(
    "/plan?code=SYNTHETIC-code&token_hash=SYNTHETIC-hash",
  );
  try {
    await bad.page
      .getByText("sign-in link unavailable", { exact: true })
      .waitFor();
    assert.equal(bad.s.calls.length, 0);
    assert.equal(bad.page.url(), origin + "/plan");
  } finally {
    await bad.close();
  }
});

test("signed-out advisor recovery retains exact same-origin destination and actual remembered-link request", async () => {
  const s = state();
  s.signedIn = false;
  const target = `/advisor/plans/${ids.draft}/routine`,
    f = await setup(target, 390, s);
  try {
    const p = f.page;
    await p
      .getByRole("button", { name: "send sign-in link", exact: true })
      .waitFor();
    await p
      .getByRole("textbox", { name: "email", exact: true })
      .fill("synthetic@example.invalid");
    await p
      .getByRole("checkbox", {
        name: "remember me on this browser",
        exact: true,
      })
      .check();
    await p
      .getByRole("button", { name: "send sign-in link", exact: true })
      .click();
    await p.getByText("check your email", { exact: true }).waitFor();
    const command = s.calls.find((c) => c.endpoint === "auth/request").command;
    assert.deepEqual(command, {
      email: "synthetic@example.invalid",
      remember: true,
      returnTo: target,
    });
    assert.equal(
      s.calls.some((c) => c.audience === "client"),
      false,
    );
    assert.equal(p.url(), origin + target);
  } finally {
    await f.close();
  }
});

test("actual startup rejects partial, empty, duplicate, mixed and oversized callbacks without auth requests", async () => {
  const f = await setup("/maya");
  const messages = [];
  f.page.on("console", (message) => messages.push(message.text()));
  try {
    const keys = [
      "token_hash",
      "type",
      "error",
      "error_code",
      "error_description",
      "code",
      "access_token",
      "refresh_token",
      "expires_at",
      "expires_in",
      "token_type",
      "provider_token",
      "provider_refresh_token",
    ];
    const cases = [];
    for (const key of keys)
      for (const side of ["?", "#"]) {
        cases.push("/plan" + side + key + "=");
        if (
          !(
            (side === "?" && ["code", "token_hash"].includes(key)) ||
            (side === "#" && key === "access_token")
          )
        )
          cases.push("/plan" + side + key + "=SYNTHETIC-private");
      }
    for (const key of keys)
      cases.push(
        "/plan?code=a&" + key + "=one&" + key + "=two",
        "/plan#access_token=a&" + key + "=one&" + key + "=two",
        "/plan?code=a&" + key + "=one#" + key + "=two",
      );
    cases.push(
      "/plan?code=a&code=b",
      "/plan?code=a#access_token=b",
      "/plan?error_description=SYNTHETIC-private",
      "/plan?code=" + "a".repeat(2049),
    );
    for (const path of ["/maya", "/missing"])
      for (const key of keys)
        cases.push(path + "#" + key + "=SYNTHETIC-private");
    for (const initial of cases) {
      await f.page.goto("about:blank");
      await f.page.goto(origin + initial);
      const path = new URL(origin + initial).pathname;
      await f.page.getByRole("heading", { level: 1 }).waitFor();
      if (path === "/plan")
        await f.page
          .getByText("sign-in link unavailable", { exact: true })
          .waitFor();
      assert.equal(f.page.url(), origin + path);
      assert.equal(f.s.calls.length, 0);
      assert.equal(
        JSON.stringify(await f.page.evaluate(() => history.state)).includes(
          "SYNTHETIC-private",
        ),
        false,
      );
      assert.equal(
        (await f.page.locator("body").innerText()).includes(
          "SYNTHETIC-private",
        ),
        false,
      );
    }
    assert.equal(
      messages.some((value) => value.includes("SYNTHETIC-private")),
      false,
    );
  } finally {
    await f.close();
  }
});

test("real application v2 care composition records stop and keeps its confirmed state across reload", async () => {
  const f=await setup(buildRoute({name:"product-use",productId:"cerave-pm",routine:"evening"}),390);
  try {
    const p=f.page;
    await p.getByRole("group",{name:"is this your product?",exact:true}).waitFor();
    await selectCare(p,"what changed?","stopped");
    await selectCare(p,"when did this happen?","date not known");
    await p.getByRole("textbox",{name:"anything we should know? (optional)",exact:true}).fill("synthetic actual-app stop note");
    await p.getByRole("button",{name:"record change",exact:true}).click();
    await p.getByText("use report recorded",{exact:true}).waitFor();
    const writes=f.s.calls.filter(c=>c.command?.action==="report_product_use_v1");
    assert.equal(writes.length,1);assert.equal(writes[0].endpoint,"care");
    assert.deepEqual(writes[0].command.change,{kind:"stopped",details:"synthetic actual-app stop note"});
    assert.deepEqual(writes[0].command.occurredOn,{state:"unknown"});assert.equal(writes[0].command.identityEventId,null);
    await p.reload();
    await p.getByRole("button",{name:"back to product",exact:true}).click();
    await p.getByRole("dialog").waitFor();await p.getByRole("dialog").getByText("reported stopped",{exact:true}).waitFor();
    assert.deepEqual(f.s.view.actualUse,[]);
    assert.equal(f.s.calls.filter(c=>c.command?.action==="report_product_use_v1").length,1);
    assert.equal(f.s.calls.some(c=>c.command?.action==="read_client_plan_v1"),false);
    assert.equal(f.s.calls.some(c=>c.endpoint==="payments"),false);
  } finally { await f.close(); }
});

test("real application general care route respects read-only access without a write",async()=>{
  const s=state();s.view.access="read_only";
  const f=await setup(buildRoute({name:"report-use",routine:"evening"}),320,s);
  try{
    await f.page.getByText("this view cannot record care changes.",{exact:true}).waitFor();
    assert.equal(await f.page.getByRole("button",{name:"record change",exact:true}).count(),0);
    assert.equal(s.calls.some(c=>["report_product_use_v1","create_reported_product_v1","report_identity_v1"].includes(c.command?.action)),false);
    assert.equal(s.calls.some(c=>c.command?.action==="read_client_plan_v1"),false);
  }finally{await f.close();}
});

for(const status of [403,409,503])for(const route of [{name:"product-use",productId:"cerave-pm",routine:"evening"},{name:"report-use",routine:"evening"}])test(`direct ${route.name} first ${status} keeps care read recovery`,async()=>{
  const s=state();s.failure=status;const f=await setup(buildRoute(route),390,s);
  try{
    const p=f.page;
    await p.getByRole("button",{name:"try again",exact:true}).waitFor({timeout:1500});
    assert.equal(await p.getByRole("heading",{level:1}).innerText(),"record actual use");
    assert.equal(await p.locator("main form").count(),0);
    s.failure=0;
    if(status===503){await p.getByRole("button",{name:"check connection",exact:true}).click();await p.getByRole("button",{name:"check connection",exact:true}).waitFor({state:"hidden"});}
    await p.getByRole("button",{name:"try again",exact:true}).click();
    await p.getByRole("combobox",{name:"what changed?",exact:true}).waitFor();
    assert.equal(s.calls.some(c=>c.command?.action==="read_client_plan_v1"),false);
    assert.equal(s.calls.some(c=>["report_product_use_v1","report_identity_v1","report_unreviewed_product_v1"].includes(c.command?.action)),false);
  }finally{await f.close();}
});
