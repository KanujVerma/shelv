import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import { chromium } from "playwright-core";
const portal = fileURLToPath(new URL("../", import.meta.url)),
  repo = path.resolve(portal, "../.."),
  artifacts = path.join(repo, ".local-artifacts/portal-rebuild/w2"),
  origin = "https://shelv-advisor.invalid";
let browser, files;
before(async () => {
  await fs.mkdir(artifacts, { recursive: true });
  const result = await build({
    absWorkingDir: portal,
    entryPoints: ["tests/rebuild/advisor-browser-entry.tsx"],
    outdir: artifacts,
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
after(async () => browser?.close());
async function setup(route = "/advisor/plans", width = 1440) {
  const context = await browser.newContext({
      viewport: { width, height: 960 },
      serviceWorkers: "block",
    }),
    errors = [],
    unexpected = [];
  await context.route("**/*", async (r) => {
    const u = new URL(r.request().url());
    if (u.origin !== origin || r.request().method() !== "GET") {
      unexpected.push(u.pathname);
      return r.abort();
    }
    if (u.pathname.startsWith("/advisor/"))
      return r.fulfill({
        contentType: "text/html",
        body: '<!doctype html><html lang="en"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/advisor-browser-entry.css"><div id="root"></div><script type="module" src="/advisor-browser-entry.js"></script></html>',
      });
    const file = path.resolve(artifacts, "." + u.pathname);
    if (!file.startsWith(artifacts + path.sep) || !files.has(file)) {
      unexpected.push(u.pathname);
      return r.abort();
    }
    return r.fulfill({
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
  p.setDefaultTimeout(5000);
  p.on("pageerror", (e) => errors.push(e.message));
  p.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await p.goto(origin + route);
  await p.evaluate(() => document.fonts.ready);
  return {
    p,
    async close() {
      await context.close();
      assert.deepEqual(errors, []);
      assert.deepEqual(unexpected, []);
    },
  };
}

test("SYNTHETIC/DO NOT FULFILL: real draft directory creates an unassigned draft and free keyboard sections edit structured modules", async () => {
  const f = await setup();
  try {
    const p = f.p;
    await p.getByRole("heading", { name: "plans", exact: true }).waitFor();
    await p.getByRole("button", { name: "new plan", exact: true }).click();
    await p.getByText("not assigned", { exact: true }).first().waitFor();
    await p.getByRole("button", { name: "routine", exact: true }).click();
    await p.getByRole("button", { name: "add routine step" }).click();
    await p.getByLabel("step title").fill("water rinse");
    await p.getByLabel("directions", { exact: true }).fill("if comfortable");
    await p
      .getByRole("button", { name: "client context", exact: true })
      .focus();
    await p.keyboard.press("Enter");
    await p.getByRole("button", { name: "add goal" }).click();
    await p.getByLabel("goal").fill("comfort");
    await p.getByRole("button", { name: "save draft", exact: true }).click();
    await p.getByText("saved", { exact: true }).waitFor();
    assert.equal(
      await p.evaluate(
        () => window.__advisor.c.getSnapshot().view.draft.clientId,
      ),
      null,
    );
    assert.equal(
      await p.evaluate(
        () => window.__advisor.c.getSnapshot().view.draft.content.goals[0].text,
      ),
      "comfort",
    );
    await p.screenshot({
      path: path.join(artifacts, "A02-context-1440.png"),
      fullPage: true,
    });
  } finally {
    await f.close();
  }
});

test("SYNTHETIC/DO NOT FULFILL: A04/A04P/A05/A06 publication is deliberate and preview stays private", async () => {
  const f = await setup(
    "/advisor/plans/10000000-0000-4000-8000-000000000001/review-publish",
  );
  try {
    const p = f.p;
    await p
      .getByRole("heading", { name: "review & publish", exact: true })
      .waitFor();
    await p.getByRole("button", { name: "refresh publication checks" }).click();
    await p.getByRole("button", { name: "approve this exact version" }).click();
    await p
      .getByText("approval matches this client and revision", { exact: true })
      .waitFor();
    assert.equal(
      await p
        .getByRole("button", { name: "publish first plan", exact: true })
        .isDisabled(),
      true,
    );
    await p.screenshot({ path: path.join(artifacts, "A04-blocked-1440.png") });
    await p.getByRole("button", { name: "open client preview" }).click();
    assert.equal(await p.evaluate(() => window.__advisor.f.previews.length), 1);
    await p.getByRole("button", { name: "open payment verification" }).click();
    await p.getByLabel("actual gross amount received").fill("100.00");
    await p
      .getByRole("combobox", { name: "receipt checked outside shelv" })
      .click();
    await p
      .getByRole("option", {
        name: "amount, recipient and transaction checked",
      })
      .click();
    await p.screenshot({ path: path.join(artifacts, "A04P-payment-1440.png") });
    await p.getByRole("button", { name: "confirm verified payment" }).click();
    await p
      .getByRole("button", { name: "publish first plan", exact: true })
      .waitFor();
    assert.equal(
      await p
        .getByRole("button", { name: "publish first plan", exact: true })
        .isEnabled(),
      true,
    );
    assert.equal(
      await p.evaluate(
        () =>
          window.__advisor.f.calls.filter((c) => c.action === "publish_plan_v1")
            .length,
      ),
      0,
    );
    await p.screenshot({ path: path.join(artifacts, "A05-ready-1440.png") });
    await p
      .getByRole("button", { name: "publish first plan", exact: true })
      .click();
    await p
      .getByRole("heading", { name: "plan published", exact: true })
      .waitFor();
    assert.match(
      await p.locator("[data-advisor-receipt]").innerText(),
      /queued/,
    );
    assert.doesNotMatch(
      await p.locator("[data-advisor-receipt]").innerText(),
      /email delivered/,
    );
    await p.screenshot({ path: path.join(artifacts, "A06-receipt-1440.png") });
  } finally {
    await f.close();
  }
});

test("SYNTHETIC/DO NOT FULFILL: uncertain/conflict/import/denied states preserve manual content and session replacement clears it", async () => {
  const f = await setup(
    "/advisor/plans/10000000-0000-4000-8000-000000000001/client-context",
  );
  try {
    const p = f.p;
    await p.getByLabel("plan title").waitFor();
    await p.evaluate(() => (window.__advisor.f.fail = 503));
    await p.getByLabel("plan title").fill("private manual work");
    await p.getByRole("button", { name: "save draft", exact: true }).click();
    await p.getByText("result uncertain", { exact: true }).waitFor();
    assert.equal(await p.getByText("saved", { exact: true }).count(), 0);
    await p.evaluate(() => (window.__advisor.f.fail = 0));
    await p.getByRole("button", { name: "retry same request" }).click();
    await p.getByText("saved", { exact: true }).waitFor();
    await p.evaluate(() => (window.__advisor.f.fail = 409));
    await p.getByLabel("plan title").fill("new manual correction");
    await p.getByRole("button", { name: "save draft", exact: true }).click();
    await p.getByText("draft changed", { exact: true }).waitFor();
    await p.evaluate(() => (window.__advisor.f.fail = 0));
    await p.getByRole("button", { name: "compare my work" }).click();
    await p.getByText("latest saved version", { exact: true }).waitFor();
    assert.equal(
      await p.getByLabel("plan title").inputValue(),
      "new manual correction",
    );
    await p.getByRole("button", { name: "import agent draft" }).click();
    await p.getByRole("dialog").waitFor();
    await p.getByLabel("plan JSON").fill('{"approved":true}');
    await p.getByRole("button", { name: "compare import" }).click();
    await p.getByRole("dialog").waitFor({ state: "hidden" });
    await p
      .getByText(
        "import must match the plan fields; unsupported fields are not accepted",
        { exact: true },
      )
      .waitFor();
    await p.evaluate(() => window.__advisor.f.invalidate());
    await p.getByText("session changed", { exact: true }).waitFor();
    assert.equal(await p.getByLabel("plan title").count(), 0);
    assert.deepEqual(
      await p.evaluate(() => ({
        local: localStorage.length,
        session: sessionStorage.length,
      })),
      { local: 0, session: 0 },
    );
  } finally {
    await f.close();
  }
});

test("SYNTHETIC/DO NOT FULFILL: approved editor geometry and long/empty repeated modules reflow at laptop/390/320", async () => {
  for (const width of [1440, 1280, 390, 320]) {
    const f = await setup(
      "/advisor/plans/10000000-0000-4000-8000-000000000001/decisions",
      width,
    );
    try {
      const p = f.p;
      await p.getByRole("button", { name: "add decision" }).waitFor();
      if (width === 1440) {
        const box = await p.locator("[data-advisor-editor-form]").boundingBox();
        assert.equal(box.x, 456);
        assert.equal(box.width, 584);
        assert.equal(box.y,228);
      }
      await p.getByRole("button", { name: "add decision" }).click();
      await p
        .getByLabel("why this fits")
        .fill("long source-derived rationale ".repeat(40));
      await p
        .getByLabel("directions", { exact: true })
        .fill("if comfortable\nkeep complete instructions");
      assert.equal(
        await p.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
      );
      await p.screenshot({
        path: path.join(artifacts, `A02-decisions-${width}.png`),
        fullPage: true,
      });
      await p.getByRole("button", { name: "follow-up", exact: true }).click();
      await p.getByRole("button", { name: "add follow-up criterion" }).click();
      await p.getByLabel("criterion 1").fill("report any discomfort");
      assert.equal(
        await p.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
      );
    } finally {
      await f.close();
    }
  }
});

test("SYNTHETIC/DO NOT FULFILL: assignment is a deliberate existing-client confirmation and Escape restores focus", async () => {
  const f = await setup();
  try {
    const p = f.p;
    await p.getByRole("button", { name: "new plan" }).click();
    await p.getByRole("button", { name: "assign client" }).click();
    await p.getByRole("dialog").waitFor();
    await p.keyboard.press("Escape");
    await p.getByRole("dialog").waitFor({ state: "hidden" });
    assert.equal(
      await p
        .getByRole("button", { name: "assign client" })
        .evaluate((e) => e === document.activeElement),
      true,
    );
    await p.getByRole("button", { name: "assign client" }).click();
    await p.getByRole("combobox", { name: "admitted client" }).click();
    await p.getByRole("option", { name: "Maya SYNTHETIC" }).click();
    assert.equal(
      await p.evaluate(
        () => window.__advisor.c.getSnapshot().view.draft.clientId,
      ),
      null,
    );
    await p.getByRole("button", { name: "confirm intended client" }).click();
    await p.getByRole("dialog").waitFor({ state: "hidden" });
    assert.equal(
      await p.evaluate(
        () => window.__advisor.c.getSnapshot().view.draft.clientId,
      ),
      "10000000-0000-4000-8000-000000000002",
    );
    assert.equal(
      await p.evaluate(
        () =>
          window.__advisor.f.calls.filter((c) => c.action === "assign_draft_v1")
            .length,
      ),
      1,
    );
  } finally {
    await f.close();
  }
});

test("SYNTHETIC/DO NOT FULFILL: all decision kinds and authored schedules survive save with stable same-category products", async () => {
  const f = await setup(
    "/advisor/plans/10000000-0000-4000-8000-000000000001/decisions",
  );
  try {
    const p = f.p;
    await p.getByRole("button", { name: "add decision" }).click();
    for (const kind of [
      "keep",
      "pause",
      "leave out",
      "replace",
      "finish then replace",
      "addition",
      "optional alternative",
      "no addition",
    ]) {
      await p.getByRole("combobox", { name: "action", exact: true }).click();
      await p.getByRole("option", { name: kind, exact: true }).click();
      assert.equal(
        await p
          .getByRole("combobox", { name: "action", exact: true })
          .innerText(),
        kind,
      );
    }
    await p.getByRole("combobox", { name: "authored schedule" }).click();
    await p.getByRole("option", { name: "recorded", exact: true }).click();
    await p.getByRole("button", { name: "evening", exact: true }).click();
    await p.getByRole("combobox", { name: "days", exact: true }).click();
    await p.getByRole("option", { name: "selected", exact: true }).click();
    await p.getByRole("button", { name: "monday", exact: true }).click();
    await p.getByLabel("only when").fill("only when comfortable");
    await p.getByRole("button", { name: "add introduction stage" }).click();
    await p
      .getByLabel("stage directions")
      .fill("small amount after actual start");
    await p.getByLabel("minimum days from actual start").fill("7");
    await p
      .getByLabel("proceed only when")
      .fill("comfortable, without irritation");
    await p.getByRole("button", { name: "save draft", exact: true }).click();
    await p.getByText("saved", { exact: true }).waitFor();
    const d = await p.evaluate(
      () => window.__advisor.c.getSnapshot().view.draft.content.decisions[0],
    );
    assert.equal(d.schedule.automaticAdvance, false);
    assert.deepEqual(d.schedule.days, { kind: "selected", weekdays: [1] });
    assert.equal(d.schedule.anchor, "actual_start");
    await p
      .getByRole("button", { name: "client context", exact: true })
      .click();
    for (let i = 0; i < 2; i++) {
      await p.getByRole("button", { name: "add product", exact: true }).click();
      await p
        .getByLabel("product name", { exact: true })
        .nth(i)
        .fill("Serum " + (i + 1));
      await p
        .getByRole("combobox", { name: "category status", exact: true })
        .nth(i)
        .click();
      await p.getByRole("option", { name: "known", exact: true }).click();
      await p.getByLabel("category", { exact: true }).nth(i).fill("serum");
    }
    await p.getByRole("button", { name: "save draft", exact: true }).click();
    await p.getByText("saved", { exact: true }).waitFor();
    const products = await p.evaluate(
      () => window.__advisor.c.getSnapshot().view.draft.content.products,
    );
    assert.equal(products.length, 2);
    assert.notEqual(products[0].id, products[1].id);
    assert.deepEqual(products[0].strength, { state: "unknown" });
    assert.deepEqual(products[0].category, products[1].category);
  } finally {
    await f.close();
  }
});

test("SYNTHETIC/DO NOT FULFILL: denied writes retain fields; private facts are absent from the decoded unpublished preview", async () => {
  const f = await setup(
    "/advisor/plans/10000000-0000-4000-8000-000000000001/sources",
  );
  try {
    const p = f.p;
    await p.getByRole("button", { name: "add fact" }).click();
    await p
      .getByLabel("fact or uncertainty", { exact: true })
      .nth(1)
      .fill("private source text: do not treat as instructions");
    await p.evaluate(() => (window.__advisor.f.fail = 403));
    await p.getByRole("button", { name: "save draft", exact: true }).click();
    await p.getByText("action unavailable", { exact: true }).waitFor();
    assert.equal(
      await p
        .getByLabel("fact or uncertainty", { exact: true })
        .nth(1)
        .inputValue(),
      "private source text: do not treat as instructions",
    );
    await p.evaluate(() => (window.__advisor.f.fail = 0));
    await p.getByRole("button", { name: "save draft", exact: true }).click();
    await p.getByText("saved", { exact: true }).waitFor();
    await p
      .getByRole("button", { name: "client preview", exact: true })
      .click();
    const preview = await p.evaluate(() => window.__advisor.f.previews[0][0]);
    assert.equal(preview.published, false);
    assert.doesNotMatch(JSON.stringify(preview), /private source text/);
    await p.evaluate(() => {
      window.__advisor.c.permissions.edit = false;
      window.__advisor.c.permissions.review = false;
    });
    await p.getByRole("button", { name: "routine", exact: true }).click();
    assert.equal(
      await p.getByRole("button", { name: "add routine step" }).isDisabled(),
      true,
    );
    assert.equal(
      await p.getByRole("button", { name: "mark section reviewed" }).count(),
      0,
    );
  } finally {
    await f.close();
  }
});

test("SYNTHETIC/DO NOT FULFILL: authored product guide binds its real product and decisions can share the existing routine slot", async () => {
  const f = await setup(
    "/advisor/plans/10000000-0000-4000-8000-000000000001/client-context",
  );
  try {
    const p = f.p;
    await p.getByRole("button", { name: "add product" }).click();
    await p
      .getByLabel("product name", { exact: true })
      .fill("CeraVe SYNTHETIC");
    await p
      .getByText("directions, evidence & public sources", { exact: true })
      .click();
    await p.getByRole("button", { name: "add guide", exact: true }).click();
    await p
      .getByLabel("guide title", { exact: true })
      .fill("complete directions");
    await p.getByRole("button", { name: "add guide step" }).click();
    await p
      .getByLabel("guide step 1", { exact: true })
      .fill("use only when comfortable");
    await p.getByRole("button", { name: "save draft", exact: true }).click();
    await p.getByText("saved", { exact: true }).waitFor();
    const product = await p.evaluate(
      () => window.__advisor.c.getSnapshot().view.draft.content.products[0],
    );
    assert.equal(product.guides[0].productId, product.id);
    await p.getByRole("button", { name: "decisions", exact: true }).click();
    await p.getByRole("button", { name: "add decision" }).click();
    await p.getByLabel("routine slot", { exact: true }).fill("water");
    await p.getByRole("button", { name: "save draft", exact: true }).click();
    await p.getByText("saved", { exact: true }).waitFor();
    assert.equal(
      await p.evaluate(
        () =>
          window.__advisor.c.getSnapshot().view.draft.content.decisions[0]
            .slotId,
      ),
      "water",
    );
  } finally {
    await f.close();
  }
});

test('SYNTHETIC/DO NOT FULFILL: autosave waits for acknowledgement and changed sections require deliberate human reviews',async()=>{const f=await setup('/advisor/plans/10000000-0000-4000-8000-000000000001/client-context');try{const p=f.p;await p.getByLabel('plan title').waitFor();await p.evaluate(()=>window.__advisor.f.hold=true);await p.getByLabel('plan title').fill('manual title');await p.getByText('saving',{exact:true}).waitFor();assert.equal(await p.getByText('saved',{exact:true}).count(),0);await p.evaluate(()=>window.__advisor.f.release());await p.getByText('saved',{exact:true}).waitFor();await p.getByRole('button',{name:'review & publish',exact:true}).first().click();assert.equal(await p.getByRole('button',{name:'approve this exact version'}).isDisabled(),true);for(const section of ['follow-up','routine','decisions','sources','client context']){await p.getByRole('button',{name:section,exact:true}).click();await p.getByRole('button',{name:'mark section reviewed',exact:true}).click();await p.getByRole('button',{name:'section reviewed',exact:true}).waitFor();await p.getByRole('button',{name:'review & publish',exact:true}).first().click();}assert.equal(await p.getByRole('button',{name:'approve this exact version'}).isEnabled(),true);}finally{await f.close();}});

test('SYNTHETIC/DO NOT FULFILL: client/plan directories and publication checks retain native columns and narrow recovery',async()=>{for(const width of [1440,1280,390,320]){const f=await setup('/advisor/plans/10000000-0000-4000-8000-000000000001/review-publish',width);try{const p=f.p;await p.getByRole('heading',{name:'review & publish',exact:true}).waitFor();if(width===1440){const box=await p.locator('.advisor-gate-grid .shelv-panel').first().boundingBox();assert.deepEqual({x:box.x,y:box.y,width:box.width},{x:264,y:209,width:736});}await p.getByRole('button',{name:'refresh publication checks'}).click();assert.equal(await p.getByRole('button',{name:'publish first plan'}).isDisabled(),true);assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await p.screenshot({path:path.join(artifacts,`gate-${width}.png`),fullPage:true});}finally{await f.close();}}for(const route of ['clients','plans']){const f=await setup('/advisor/'+route);try{await f.p.getByRole('heading',{name:route,exact:true}).waitFor();await f.p.getByText('Maya SYNTHETIC',{exact:true}).first().waitFor();await f.p.screenshot({path:path.join(artifacts,`${route==='clients'?'A00':'A01'}-1440.png`)});}finally{await f.close();}}});
