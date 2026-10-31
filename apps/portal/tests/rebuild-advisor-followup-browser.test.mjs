// SYNTHETIC / DO NOT FULFILL. Run only after explicit exclusive Chrome grant.
import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import { chromium } from "playwright-core";
const portal = fileURLToPath(new URL("../", import.meta.url)),
  repo = path.resolve(portal, "../.."),
  artifacts = path.join(repo, ".local-artifacts/portal-rebuild/w2-followup");
const origin = "https://shelv-r3-review.invalid";
let browser, files;
before(async () => {
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
    plugins: [
      {
        name: "review-transport-hook",
        setup(b) {
          b.onLoad({ filter: /advisor-browser-entry\.tsx$/ }, async (args) => ({
            contents: (await fs.readFile(args.path, "utf8")).replace(
              "const c = createAdvisorController(f.options);",
              "if (window.__prepareAdvisorFixture) window.__prepareAdvisorFixture(f);\nconst c = createAdvisorController(f.options);",
            ),
            loader: "tsx",
          }));
        },
      },
    ],
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
  console.log("Chrome", browser.version());
});
after(async () => browser?.close());
async function setup(mode, width, section = "client-context", prepare) {
  const context = await browser.newContext({
      viewport: { width, height: 960 },
      serviceWorkers: "block",
    }),
    errors = [],
    unexpected = [];
  if (prepare) await context.addInitScript(prepare);
  await context.route("**/*", async (r) => {
    const u = new URL(r.request().url());
    if (u.origin !== origin || r.request().method() !== "GET") {
      unexpected.push(r.request().url());
      return r.abort();
    }
    if (
      u.pathname ===
      (section === "plans"
        ? "/advisor/plans"
        : `/advisor/plans/10000000-0000-4000-8000-000000000001/${section}`)
    )
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
  await p.goto(
    `${origin}${section === "plans" ? "/advisor/plans" : `/advisor/plans/10000000-0000-4000-8000-000000000001/${section}`}${mode ? "?" + mode : ""}`,
  );
  await p
    .getByRole("heading", {
      name:
        section === "client-context"
          ? "client context"
          : section === "review-publish"
            ? "review & publish"
            : section,
      exact: true,
    })
    .waitFor();
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
async function openAll(p) {
  const disclosures = p.locator(".advisor-disclosure > button");
  for (let i = 0; i < (await disclosures.count()); i++) {
    const b = disclosures.nth(i);
    if (!(await b.isVisible())) continue;
    assert.equal(await b.isEnabled(), true);
    await b.focus();
    await p.keyboard.press("Tab");
    await p.keyboard.press("Shift+Tab");
    assert.equal(await b.evaluate((e) => e === document.activeElement), true);
    if ((await b.getAttribute("aria-expanded")) === "false")
      await p.keyboard.press("Enter");
    assert.equal(await b.getAttribute("aria-expanded"), "true");
  }
  return disclosures.count();
}
for (const action of [
  "validate_draft_v1",
  "preview_draft_v1",
  "compare_import_v1",
  "list_plans_v1",
])
  test(`R3-1 actual UI ${action} 503 must not release pending B`, async () => {
    const isDirectory = action === "list_plans_v1";
    const prepare = isDirectory
      ? () => {
          window.__prepareAdvisorFixture = (f) => {
            const execute = f.options.ports.plans.execute;
            window.__probe = {};
            f.options.ports.plans.execute = async (...args) => {
              const v = await execute(...args),
                q = window.__probe,
                x = args[0];
              if (x.action === "list_plans_v1" && !q.readCaptured) {
                q.readCaptured = true;
                await new Promise((r) => (q.releaseRead = r));
                q.readReleased = true;
                throw { status: 503 };
              }
              if (x.action === "save_draft_v1" && !q.saveCaptured) {
                q.saveCaptured = true;
                await new Promise((r) => (q.releaseSave = r));
              }
              return v;
            };
          };
        }
      : undefined;
    const f = await setup(
        "",
        1440,
        isDirectory ? "plans" : "client-context",
        prepare,
      ),
      p = f.p;
    try {
      if (isDirectory) {
        await p.waitForFunction(() => window.__probe.readCaptured);
        await p.getByRole("button", { name: "new plan", exact: true }).click();
        await p.getByLabel("plan title", { exact: true }).waitFor();
      } else {
        await p.evaluate((action) => {
          const { f } = window.__advisor,
            execute = f.options.ports.plans.execute;
          window.__probe = {};
          f.options.ports.plans.execute = async (...args) => {
            const v = await execute(...args),
              q = window.__probe,
              x = args[0];
            if (x.action === action && !q.readCaptured) {
              q.readCaptured = true;
              await new Promise((r) => (q.releaseRead = r));
              q.readReleased = true;
              throw { status: 503 };
            }
            if (x.action === "save_draft_v1" && !q.saveCaptured) {
              q.saveCaptured = true;
              await new Promise((r) => (q.releaseSave = r));
            }
            return v;
          };
        }, action);
        if (action === "validate_draft_v1")
          await p
            .getByRole("button", { name: "validate draft", exact: true })
            .click();
        if (action === "preview_draft_v1")
          await p
            .getByRole("button", { name: "client preview", exact: true })
            .click();
        if (action === "compare_import_v1") {
          const raw = await p.evaluate(() =>
            JSON.stringify({
              ...window.__advisor.c.getSnapshot().local,
              title: "synthetic proposal",
            }),
          );
          await p
            .getByRole("button", { name: "import agent draft", exact: true })
            .click();
          await p.getByLabel("plan JSON", { exact: true }).fill(raw);
          await p
            .getByRole("button", { name: "compare import", exact: true })
            .click();
          await p.getByRole("dialog").waitFor({ state: "hidden" });
        }
        await p.waitForFunction(() => window.__probe.readCaptured);
      }
      await p.getByLabel("summary", { exact: true }).fill("SYNTHETIC manual B");
      await p.getByRole("button", { name: "save draft", exact: true }).click();
      await p.waitForFunction(() => window.__probe.saveCaptured);
      const before = await p.evaluate(() =>
        structuredClone(window.__advisor.c.getSnapshot()),
      );
      assert.equal(before.busy, true);
      await p.evaluate(() => window.__probe.releaseRead());
      await p.waitForFunction(() => window.__probe.readReleased);
      await p.evaluate(() => new Promise((r) => setTimeout(r, 0)));
      const after = await p.evaluate(() =>
        structuredClone(window.__advisor.c.getSnapshot()),
      );
      const observation = {
        action,
        beforeBusy: before.busy,
        afterBusy: after.busy,
        pendingSame:
          JSON.stringify(after.pending) === JSON.stringify(before.pending),
        save: after.save,
        manual: after.local.summary,
        retryVisible: await p
          .getByRole("button", { name: "retry same request", exact: true })
          .isVisible(),
        saves: await p.evaluate(
          () =>
            window.__advisor.f.calls.filter((x) => x.action === "save_draft_v1")
              .length,
        ),
      };
      console.log("OBS reachable-stale-read", JSON.stringify(observation));
      await p.screenshot({
        path: path.join(artifacts, `stale-${action}.png`),
        fullPage: true,
      });
      await p.evaluate(() => window.__probe.releaseSave());
      await p.getByText("saved", { exact: true }).waitFor();
      assert.equal(
        after.busy,
        true,
        "obsolete read cannot release newer pending save",
      );
      assert.equal(after.notice, null);
      assert.deepEqual(after.pending, before.pending);
      assert.equal(after.local.summary, "SYNTHETIC manual B");
      assert.equal(observation.retryVisible, false);
    } finally {
      await f.close();
    }
  });
test("R3-1 actual validation 409 after Back and acknowledged B must not block ordinary C save", async () => {
  const f = await setup("", 1440),
    p = f.p;
  try {
    await p.evaluate(() => {
      const { f } = window.__advisor,
        execute = f.options.ports.plans.execute;
      window.__probe = {};
      f.options.ports.plans.execute = async (...args) => {
        const v = await execute(...args);
        if (
          args[0].action === "validate_draft_v1" &&
          !window.__probe.readCaptured
        ) {
          window.__probe.readCaptured = true;
          await new Promise((r) => (window.__probe.releaseRead = r));
          window.__probe.readReleased = true;
          throw { status: 409 };
        }
        return v;
      };
    });
    await p
      .getByRole("button", { name: "validate draft", exact: true })
      .click();
    await p.waitForFunction(() => window.__probe.readCaptured);
    await p
      .getByRole("button", { name: "review & publish", exact: true })
      .first()
      .click();
    await p.getByRole("button", { name: "back to draft", exact: true }).click();
    await p
      .getByRole("navigation", { name: "plan sections" })
      .getByRole("button", { name: "client context", exact: true })
      .click();
    await p
      .getByLabel("summary", { exact: true })
      .fill("SYNTHETIC B acknowledged");
    await p.getByRole("button", { name: "save draft", exact: true }).click();
    await p.getByText("saved", { exact: true }).waitFor();
    await p.evaluate(() => window.__probe.releaseRead());
    await p.waitForFunction(() => window.__probe.readReleased);
    await p.evaluate(() => new Promise((r) => setTimeout(r, 0)));
    await p
      .getByLabel("summary", { exact: true })
      .fill("SYNTHETIC C retained but must remain saveable");
    await p.evaluate(() => new Promise((r) => setTimeout(r, 1100)));
    const obs = await p.evaluate(() => ({
      needsComparison: window.__advisor.c.getSnapshot().needsComparison,
      save: window.__advisor.c.getSnapshot().save,
      pending: window.__advisor.c.getSnapshot().pending,
      manual: window.__advisor.c.getSnapshot().local.summary,
      saves: window.__advisor.f.calls.filter(
        (x) => x.action === "save_draft_v1",
      ).length,
      revision: window.__advisor.c.getSnapshot().view.draft.contentRevision,
    }));
    obs.buttonDisabled = await p
      .getByRole("button", { name: "save draft", exact: true })
      .isDisabled();
    console.log("OBS reachable-false-conflict", JSON.stringify(obs));
    await p.screenshot({
      path: path.join(artifacts, "stale-validation409-Back-C.png"),
      fullPage: true,
    });
    assert.equal(
      obs.needsComparison,
      false,
      "obsolete validation revision must not force comparison against current saved B",
    );
    assert.equal(obs.save, "saved");
    assert.equal(obs.saves, 2);
    assert.equal(obs.revision, 3);
    assert.equal(obs.manual, "SYNTHETIC C retained but must remain saveable");
  } finally {
    await f.close();
  }
});
for (const mode of ["view-only", "published"])
  for (const width of [1440, 390, 320])
    test(`R3-2 full retained decision reason must reach last line by keyboard ${mode} ${width}`, async () => {
      const f = await setup(mode, width, "decisions", () => {
          window.__prepareAdvisorFixture = (f) => {
            const v = f.getView(),
              c = v.draft.content;
            const long = (name) =>
              Array.from(
                { length: 20 },
                (_, i) =>
                  `SYNTHETIC ${name} retained line ${i + 1}: Preserve Proper Names and exact cautions.`,
              ).join("\n") +
              `\nFINAL retained ${name} line: do not omit this instruction.`;
            c.products[0].guides[0] = structuredClone(c.products[0].guides[0]);
            c.routineGuides[0] = structuredClone(c.routineGuides[0]);
            c.products[0].guides[0].steps[0].body = long("product");
            c.routineGuides[0].steps[0].body = long("routine");
            c.context.facts.at(-1).text = long("source");
            f.setView(v);
          };
        }),
        p = f.p;
      try {
        await openAll(p);
        const e = p.getByLabel("why this fits", { exact: true }).first();
        const before = await e.evaluate((e) => ({
          id: e.id,
          disabled: e.disabled,
          valueLength: e.value.length,
          clientHeight: e.clientHeight,
          scrollHeight: e.scrollHeight,
          scrollTop: e.scrollTop,
          lastLine: e.value.slice(-112),
        }));
        const trigger = p.locator(".advisor-disclosure > button").first();
        await trigger.focus();
        await p.keyboard.press("Tab");
        await p.keyboard.press("Shift+Tab");
        await e.scrollIntoViewIfNeeded();
        await e.focus();
        const focused = await e.evaluate((e) => e === document.activeElement);
        for (const key of [
          "Control+End",
          "Meta+ArrowDown",
          "End",
          "PageDown",
          "ArrowDown",
        ])
          await p.keyboard.press(key);
        await waitForLastLine(p, e);
        const after = await e.evaluate((e) => ({
          scrollTop: e.scrollTop,
          clientHeight: e.clientHeight,
          scrollHeight: e.scrollHeight,
          value: e.value,
        }));
        const obs = {
          mode,
          width,
          ...before,
          focused,
          afterTop: after.scrollTop,
          lastLineReached:
            after.scrollTop + after.clientHeight >= after.scrollHeight - 2,
          writes: await p.evaluate(
            () =>
              window.__advisor.f.calls.filter((x) => "requestId" in x).length,
          ),
        };
        console.log("OBS fulltext-keyboard", JSON.stringify(obs));
        await e.screenshot({
          path: path.join(artifacts, `fulltext-${mode}-${width}.png`),
        });
        assert.equal(after.value.length, before.valueLength);
        assert.equal(obs.writes, 0);
        assert.ok(
          obs.lastLineReached,
          "complete retained reason remains clipped and cannot be scrolled by keyboard",
        );
        assert.equal(focused, true);
        assert.equal(await e.evaluate((e) => e.readOnly && !e.disabled), true);
        await verifyOtherModules(p, mode, width);
      } finally {
        await f.close();
      }
    });

async function keyboardLastLine(p, field, expected, name, mode, width) {
  await field.scrollIntoViewIfNeeded();
  await field.focus();
  await p.keyboard.press("Tab");
  await p.keyboard.press("Shift+Tab");
  assert.equal(
    await field.evaluate((e) => e === document.activeElement),
    true,
    `${name} is reachable in the keyboard focus order`,
  );
  for (const key of ["Control+End", "Meta+ArrowDown", "End", "PageDown"])
    await p.keyboard.press(key);
  await waitForLastLine(p, field);
  const seen = await field.evaluate((e) => ({
    value: e.value,
    top: e.scrollTop,
    height: e.clientHeight,
    total: e.scrollHeight,
    readonly: e.readOnly,
    disabled: e.disabled,
  }));
  assert.equal(seen.value, expected);
  assert.ok(
    seen.top + seen.height >= seen.total - 2,
    `${name}: keyboard reached the last retained line`,
  );
  assert.equal(seen.readonly, true);
  assert.equal(seen.disabled, false);
  await field.screenshot({
    path: path.join(artifacts, `fulltext-${name}-${mode}-${width}.png`),
  });
  await p.keyboard.press("Meta+a");
  await p.keyboard.type("DENIED mutation");
  await p.keyboard.press("Backspace");
  assert.equal(
    await field.inputValue(),
    expected,
    `${name}: typing cannot edit the read-only DOM field`,
  );
  console.log(
    "OBS last-line",
    JSON.stringify({
      name,
      mode,
      width,
      length: expected.length,
      top: seen.top,
      total: seen.total,
      lastLine: expected.split("\n").at(-1),
    }),
  );
}
async function waitForLastLine(p, field) {
  // Native keyboard scrolling completes over animation frames. Observe the
  // resulting viewport, rather than reading before the first scroll frame.
  await p.waitForFunction(
    (id) => {
      const e = document.getElementById(id);
      return e && e.scrollTop + e.clientHeight >= e.scrollHeight - 2;
    },
    await field.getAttribute("id"),
    { timeout: 2000 },
  );
}
async function verifyOtherModules(p, mode, width) {
  const before = await p.evaluate(() =>
    JSON.stringify(window.__advisor.c.getSnapshot().local),
  );
  // Source-derived reason and long azelaic directions must stay exact, with no shortened fixture.
  const reason = await p.evaluate(
    () => window.__advisor.c.getSnapshot().local.decisions[0].reason,
  );
  await keyboardLastLine(
    p,
    p.getByLabel("why this fits", { exact: true }).first(),
    reason,
    "decision",
    mode,
    width,
  );
  const decisions = await p.evaluate(
    () => window.__advisor.c.getSnapshot().local.decisions,
  );
  const index = decisions.findIndex(
    (d) => d.directions.join("\n").length >= 823,
  );
  assert.ok(index >= 0, "actual retained long directions are present");
  await keyboardLastLine(
    p,
    p.getByLabel("directions", { exact: true }).nth(index),
    decisions[index].directions.join("\n"),
    "azelaic",
    mode,
    width,
  );
  for (const [section, name, label] of [
    ["client-context", "product", "guide step 1"],
    ["routine", "routine", "guide step 1"],
    ["sources", "source", "fact or uncertainty"],
  ]) {
    await p
      .getByRole("navigation", { name: "plan sections" })
      .getByRole("button", {
        name: section === "client-context" ? "client context" : section,
        exact: true,
      })
      .click();
    await openAll(p);
    const expected = await p.evaluate((section) => {
      const c = window.__advisor.c.getSnapshot().local;
      return section === "client-context"
        ? c.products[0].guides[0].steps[0].body
        : section === "routine"
          ? c.routineGuides[0].steps[0].body
          : c.context.facts.at(-1).text;
    }, section);
    const target = p.getByLabel(label, { exact: true });
    await keyboardLastLine(
      p,
      section === "sources" ? target.last() : target.first(),
      expected,
      name,
      mode,
      width,
    );
    assert.equal(
      await p
        .locator("[data-advisor-editor-form] [role=combobox]")
        .evaluateAll((es) => es.every((e) => e.disabled)),
      true,
    );
    assert.equal(
      await p
        .locator(
          "[data-advisor-editor-form] > .advisor-fields button:not([aria-controls])",
        )
        .evaluateAll((es) => es.every((e) => e.disabled)),
      true,
    );
    if (section === "sources")
      assert.equal(
        await p
          .getByText(
            '10000000-0000-4000-8000-000000000010 · version 1 · {"kind":"page","page":7}',
            { exact: true },
          )
          .isVisible(),
        true,
      );
  }
  await p.evaluate(async () => {
    const { c } = window.__advisor;
    c.edit((v) => ({ ...v, title: "denied" }));
    await c.save();
    await c.assign("10000000-0000-4000-8000-000000000002");
    await c.review("routine");
    await c.approve();
    await c.publish();
    await c.confirmPayment(
      "10000000-0000-4000-8000-000000000006",
      "100.00",
      true,
    );
  });
  assert.equal(
    await p.evaluate(() =>
      JSON.stringify(window.__advisor.c.getSnapshot().local),
    ),
    before,
  );
  assert.equal(
    await p.evaluate(
      () => window.__advisor.f.calls.filter((x) => "requestId" in x).length,
    ),
    0,
  );
  assert.equal(
    await p.evaluate(() => document.documentElement.scrollWidth > innerWidth),
    false,
  );
}
