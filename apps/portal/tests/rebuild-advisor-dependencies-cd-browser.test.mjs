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

for (const status of [403, 503])
  test(`late historical ${status} cannot erase manual B or its exact uncertain retry`, async () => {
    const data = multiVersion(),
      h = await openDependencyApp(browser, {
        section: "client-context",
        configure: configure(data),
      });
    try {
      const { p, s } = h;
      await ready(p);
      const old = s.hold(
        "read_advisor_publication_v2",
        () => ({ status, body: { code: "unavailable" } }),
        (c) => c.version === 1,
      );
      await button(p, "refresh current client information").click();
      await old.ready;
      const b = s.hold("save_draft_v1", (v) => ({
        ...v,
        untrustedExtra: true,
      }));
      await p
        .getByRole("textbox", { name: "summary", exact: true })
        .fill("CD MANUAL BUFFER B");
      await b.ready;
      const pending = s.calls.find((c) => c.command.action === "save_draft_v1");
      old.release();
      if (status === 503) {
        await button(p, "check connection").click();
        await button(p, "check connection").waitFor({ state: "hidden" });
      }
      assert.equal(
        await p
          .getByRole("textbox", { name: "summary", exact: true })
          .inputValue(),
        "CD MANUAL BUFFER B",
      );
      assert.equal(
        await button(p, "save draft").getAttribute("aria-busy"),
        "true",
      );
      b.release();
      await p.getByText("result uncertain", { exact: true }).waitFor();
      await button(p, "retry same request").click();
      await p.getByText("saved", { exact: true }).waitFor();
      const attempts = s.calls.filter(
        (c) => c.command.action === "save_draft_v1",
      );
      assert.equal(attempts.length, 2);
      assert.equal(attempts[1].bytes, pending.bytes);
      assert.equal(s.f.getView().draft.content.summary, "CD MANUAL BUFFER B");
      assert.equal(
        s.calls.some(
          (c) => c.command.action === "rebase_draft_dependencies_v1",
        ),
        false,
      );
    } finally {
      await h.close();
    }
  });

test("unmounted historical inspection cannot repopulate the prior panel on plans or reuse its cache", async () => {
  const data = multiVersion(),
    h = await openDependencyApp(browser, { configure: configure(data) });
  try {
    const { p, s } = h;
    await ready(p);
    const old = s.hold(
      "read_advisor_publication_v2",
      (v) => v,
      (c) => c.version === 1,
    );
    await button(p, "refresh current client information").click();
    await old.ready;
    await p.getByRole("link", { name: "plans", exact: true }).click();
    await p.getByRole("heading", { name: "plans", exact: true }).waitFor();
    old.release();
    assert.equal(
      await button(p, "reports, product identity & corrections").count(),
      0,
    );
    await p
      .getByRole("button", {
        name: "care plan · " + ids.draft.slice(0, 8),
        exact: true,
      })
      .click();
    await ready(p);
    assert.equal(
      s.calls.filter(
        (c) =>
          c.command.action === "read_advisor_publication_v2" &&
          c.command.version === 1,
      ).length,
      3,
    );
    assert.equal(s.writes().length, 0);
  } finally {
    await h.close();
  }
});

test("historical response after logout never restores prior private names or controls", async () => {
  const data = multiVersion(),
    h = await openDependencyApp(browser, { configure: configure(data) });
  try {
    const { p, s } = h;
    await ready(p);
    const old = s.hold(
      "read_advisor_publication_v2",
      (v) => v,
      (c) => c.version === 1,
    );
    await button(p, "refresh current client information").click();
    await old.ready;
    await button(p, "sign out").click();
    old.release();
    await button(p, "send sign-in link").waitFor();
    assert.equal(
      await button(p, "reports, product identity & corrections").count(),
      0,
    );
    assert.equal(await p.getByText(data.names[0], { exact: false }).count(), 0);
    assert.equal(s.writes().length, 0);
  } finally {
    await h.close();
  }
});

test("a current restrictive gate retires an old historical read and keeps acknowledgement unavailable", async () => {
  const data = multiVersion(),
    h = await openDependencyApp(browser, { configure: configure(data) });
  try {
    const { p, s } = h;
    await ready(p);
    const old = s.hold(
      "read_advisor_publication_v2",
      (v) => v,
      (c) => c.version === 1,
    );
    await button(p, "refresh current client information").click();
    await old.ready;
    Object.assign(s.caps, {
      edit: false,
      review: false,
      approve: false,
      publish: false,
    });
    s.dependencyDenied = true;
    await button(p, "refresh publication checks").click();
    await p
      .getByText("current client information could not be confirmed.", {
        exact: false,
      })
      .waitFor();
    old.release();
    assert.equal(await button(p, "update draft basis").count(), 0);
    assert.equal(await button(p, "publish plan").isDisabled(), true);
    assert.equal(s.writes().length, 0);
  } finally {
    await h.close();
  }
});

test("historical slot/name binding uses the exact old document instead of current same-ID descriptors", async () => {
  const data = multiVersion({ renamedCurrent: true }),
    ref = data.entries[0].event.product,
    step = structuredClone(
      data.historical.plan.content.routine.find(
        (x) => x.productId === ref.productId,
      ),
    );
  step.id = "historical-browser-slot";
  step.slotId = "historical-evening-slot";
  step.title = "historical evening moisturizer";
  step.schedule.periods = ["evening"];
  data.historical.plan.content.routine.push(step);
  ref.slotId = step.slotId;
  const h = await openDependencyApp(browser, {
    width: 320,
    configure: configure(data),
  });
  try {
    await ready(h.p);
    const { body } = await disclose(h.p),
      headings = await body.locator("h4").allTextContents();
    assert.ok(headings[0].includes(data.names[0]));
    assert.ok(headings[0].includes("historical evening moisturizer"));
    assert.ok(!headings[0].includes("CURRENT ONLY"));
    await acknowledge(h.p);
    assert.equal(await button(h.p, "update draft basis").isEnabled(), true);
    assert.ok(
      await h.p.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    assert.equal(h.s.writes().length, 0);
  } finally {
    await h.close();
  }
});

test("a mismatched historical document schema is explicit and cannot borrow the current product name", async () => {
  const data = multiVersion();
  data.entries[0].event.product.publication.documentSchemaVersion = 2;
  const h = await openDependencyApp(browser, {
    width: 390,
    configure: configure(data),
  });
  try {
    await ready(h.p);
    const { body } = await disclose(h.p);
    assert.match(
      await body.innerText(),
      /referenced document format or version does not match/,
    );
    assert.match(
      (await body.locator("h4").allTextContents())[0],
      /unresolved plan product.*document format 2/,
    );
    assert.equal(await button(h.p, "update draft basis").isDisabled(), true);
    assert.equal(h.s.writes().length, 0);
  } finally {
    await h.close();
  }
});

test("actual owner/CSRF restore retires a held historical response before the new denied private scope", async () => {
  const data = multiVersion(),
    h = await openDependencyApp(browser, { configure: configure(data) });
  try {
    const { p, s } = h;
    await ready(p);
    const old = s.hold(
      "read_advisor_publication_v2",
      (v) => v,
      (c) => c.version === 1,
    );
    await button(p, "refresh current client information").click();
    await old.ready;
    const gate = s.hold("read_advisor_gate_v1", () => ({
      status: 503,
      body: { code: "unavailable" },
    }));
    await button(p, "refresh publication checks").click();
    await gate.ready;
    gate.release();
    await button(p, "check connection").waitFor();
    const respond = s.respond;
    s.respond = (...args) =>
      s.owner === ids.actor
        ? respond(...args)
        : Promise.resolve({ status: 403, body: { code: "forbidden" } });
    s.owner = ids.other;
    s.csrf = "SYNTHETIC-CD-replaced-owner";
    await button(p, "check connection").click();
    await button(p, "check connection").waitFor({ state: "hidden" });
    old.release();
    await p.getByText("action unavailable", { exact: true }).waitFor();
    assert.equal(
      await button(p, "reports, product identity & corrections").count(),
      0,
    );
    assert.equal(await p.getByText(data.names[0], { exact: false }).count(), 0);
    assert.equal(s.writes().length, 0);
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
