// Prepared during source-only custody. Execute only after an explicit serial
// synthetic Chrome grant. R1 assertions are preserved in original-r1 evidence.
import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import {
  startBrowser,
  openDependencyApp,
  ready,
  acknowledge,
  artifacts,
} from "./rebuild-advisor-dependencies-cd-browser-helper.mjs";
import {
  multiVersion,
  pagedReported,
  ids,
} from "./rebuild-advisor-dependencies-cd-helper.mjs";
import fs from "node:fs/promises";
import path from "node:path";
let browser;
before(async () => {
  browser = await startBrowser();
});
after(async () => {
  await browser?.close();
  browser = null;
});
const button = (p, name) => p.getByRole("button", { name, exact: true });
function publication(view) {
  const { access, ...body } = structuredClone(view);
  return {
    ...body,
    clientId: ids.client,
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
function configure(data) {
  return (s) => {
    const v = s.f.getView();
    v.draft.basis.publicationVersion = data.current.plan.version;
    s.f.setView(v);
    s.current.legacyBasis.publicationVersion =
      s.captured.legacyBasis.publicationVersion = data.current.plan.version;
    s.current.useHead = data.current.use.revision;
    s.entries = structuredClone(data.entries);
    s.publications = new Map([[null, publication(data.current)]]);
    if (data.historical)
      s.publications.set(
        data.historical.plan.version,
        publication(data.historical),
      );
  };
}
async function disclose(p) {
  const b = button(p, "reports, product identity & corrections");
  await b.focus();
  await p.keyboard.press("Tab");
  await p.keyboard.press("Shift+Tab");
  await p.keyboard.press("Enter");
  const id = await b.getAttribute("aria-controls"),
    body = p.locator(`[id="${id}"]`);
  await body.waitFor();
  return { body, id };
}

for (const width of [1440, 390, 320])
  test(`CD1 original distinction at ${width}: each historical report binds to its exact immutable product`, async () => {
    const data = multiVersion(),
      h = await openDependencyApp(browser, {
        width,
        configure: configure(data),
      });
    try {
      await ready(h.p);
      const { body } = await disclose(h.p),
        headings = await body.locator("h4").allTextContents();
      assert.equal(headings.length, 2);
      await acknowledge(h.p);
      assert.equal(await button(h.p, "update draft basis").isEnabled(), true);
      assert.equal(h.s.writes().length, 0);
      await h.screenshot(`CD1-${width}.png`);
      await fs.writeFile(
        path.join(artifacts, `CD1-${width}.json`),
        JSON.stringify(
          {
            names: data.names,
            headings,
            reads: h.s.calls
              .filter((c) => c.command.action === "read_advisor_publication_v2")
              .map((c) => c.command),
          },
          null,
          2,
        ),
      );
      assert.notEqual(
        headings[0],
        headings[1],
        "the advisor cannot bind distinct original facts to their products",
      );
      assert.ok(headings[0].includes(data.names[0]));
      assert.ok(headings[1].includes(data.names[1]));
      assert.deepEqual(
        h.s.calls
          .filter((c) => c.command.action === "read_advisor_publication_v2")
          .map((c) => c.command.version),
        [null, 1],
      );
    } finally {
      await h.close();
    }
  });

for (const byteSplit of [false, true])
  test(`CD2 ${byteSplit ? "byte split" : "over100"}: complete history is not a complete effective projection`, async () => {
    const data = pagedReported({ byteSplit }),
      h = await openDependencyApp(browser, { configure: configure(data) });
    try {
      await ready(h.p);
      const { body, id } = await disclose(h.p);
      let page = 1;
      while (await button(h.p, "load more client reports").count()) {
        assert.ok(page++ < 20);
        const previous = (await body.textContent()).length;
        await button(h.p, "load more client reports").focus();
        await h.p.keyboard.press("Enter");
        await h.p.waitForFunction(
          ({ id, previous }) =>
            (document.getElementById(id)?.textContent?.length ?? 0) > previous,
          { id, previous },
        );
      }
      assert.ok(
        (await body.innerText()).includes(data.omitted.descriptor.name),
      );
      assert.match(await body.innerText(), /last product stop/);
      assert.equal(
        h.s.calls.filter(
          (x) => x.command.action === "read_advisor_use_history_v1",
        ).length,
        Math.ceil(data.entries.length / 25),
      );
      const current = await h.p.locator("h3").allTextContents();
      assert.equal(
        current.some((x) => x.includes(data.omitted.descriptor.name)),
        false,
      );
      const control = h.p.getByRole("combobox", {
        name: "review current reports and corrections",
        exact: true,
      });
      // The old implementation permits acknowledgement. The corrected UI may
      // disable it outright; preserve the intended rebase-disabled assertion.
      if (await control.isEnabled()) await acknowledge(h.p);
      const enabled = await button(h.p, "update draft basis").isEnabled();
      await h.screenshot(`CD2-${byteSplit ? "bytes" : "items"}.png`);
      assert.equal(
        enabled,
        false,
        "a non-null reportedProducts cursor must not silently count as complete current information",
      );
      assert.equal(await control.isDisabled(), true);
      assert.equal(h.s.writes().length, 0);
      assert.ok(
        (await h.p.locator("body").innerText()).includes(
          "more current reported products are unavailable",
        ),
      );
      assert.equal(
        h.s.calls.some((c) => c.command.action === "read_reported_products_v1"),
        false,
      );
    } finally {
      await h.close();
    }
  });

for (const width of [1440, 390, 320])
  test(`historical identity unavailable at ${width} stays distinct/readable and cannot acknowledge`, async () => {
    const data = multiVersion(),
      h = await openDependencyApp(browser, {
        width,
        configure: (s) => {
          configure(data)(s);
          s.publications.delete(1);
        },
      });
    try {
      await ready(h.p);
      const { body } = await disclose(h.p),
        headings = await body.locator("h4").allTextContents();
      assert.equal(headings.length, 2);
      assert.notEqual(headings[0], headings[1]);
      assert.ok(headings.every((x) => x.includes("unresolved plan product")));
      assert.match(await body.innerText(), /SYNTHETIC FIRST PRODUCT COMFORT/);
      assert.match(
        await body.innerText(),
        /SYNTHETIC SECOND PRODUCT IRRITATION/,
      );
      assert.equal(await button(h.p, "update draft basis").isDisabled(), true);
      assert.equal(h.s.writes().length, 0);
      assert.ok(
        await h.p.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
    } finally {
      await h.close();
    }
  });
