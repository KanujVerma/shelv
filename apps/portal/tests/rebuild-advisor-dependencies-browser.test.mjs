import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import {
  startBrowser,
  openDependencyApp,
  ready,
  acknowledge,
  rebaseUI,
  ids,
} from "./rebuild-advisor-dependencies-browser-helper.mjs";
let browser;
before(async () => {
  browser = await startBrowser();
});
after(async () => {
  await browser?.close();
  browser = null;
});
const button = (p, name) => p.getByRole("button", { name, exact: true });
const actionCalls = (s, action) =>
  s.calls.filter((x) => x.command.action === action);
async function assertDisabled(locator) {
  assert.equal(await locator.isDisabled(), true);
}
async function selectSection(p, name) {
  await p
    .getByRole("navigation", { name: "review sections" })
    .getByRole("button", { name, exact: true })
    .click();
}
async function openReports(p) {
  const b = button(p, "reports, product identity & corrections");
  await b.focus();
  await p.keyboard.press("Tab");
  await p.keyboard.press("Shift+Tab");
  assert.equal(await b.evaluate((e) => e === document.activeElement), true);
  await p.keyboard.press("Enter");
  assert.equal(await b.getAttribute("aria-expanded"), "true");
  return p.locator(`[id="${await b.getAttribute("aria-controls")}"]`);
}

test("actual Application exposes current reports and requires separate acknowledgement/rebase, five reviews and new exact approval before later publication", async () => {
  const h = await openDependencyApp(browser);
  try {
    const { p, s } = h;
    await ready(p);
    const body = structuredClone(s.f.getView().draft.content),
      clocks = JSON.stringify(s.clocks),
      finance = JSON.stringify(s.f.context.payments);
    await assertDisabled(button(p, "publish plan"));
    await assertDisabled(button(p, "approve this exact version"));
    await assertDisabled(button(p, "update draft basis"));
    assert.equal(s.writes().length, 0);
    const reports = await openReports(p);
    assert.match(await reports.innerText(), /twice a week/);
    assert.match(await reports.innerText(), /once a week/);
    assert.match(await reports.innerText(), /a small amount/);
    assert.match(await reports.innerText(), /correction by another advisor/);
    assert.match(await reports.innerText(), /product match: not sure/);
    await acknowledge(p);
    assert.equal(actionCalls(s, "rebase_draft_dependencies_v1").length, 0);
    await button(p, "update draft basis").click();
    await p.getByText("draft basis is current", { exact: true }).waitFor();
    assert.deepEqual(s.f.getView().draft.content, body);
    assert.equal(s.f.getView().draft.contentRevision, 2);
    assert.ok(s.f.getView().sections.every((x) => !x.reviewed));
    assert.equal(s.f.context.approval, null);
    await assertDisabled(button(p, "publish plan"));
    for (const section of [
      "sources",
      "client context",
      "decisions",
      "routine",
      "follow-up",
    ]) {
      if (p.url().endsWith("review-publish")) await selectSection(p, section);
      else
        await p
          .getByRole("navigation", { name: "plan sections" })
          .getByRole("button", { name: section, exact: true })
          .click();
      const review = button(p, "mark section reviewed");
      await review.waitFor();
      await review.click();
      await button(p, "section reviewed").waitFor();
      await p.getByText("draft basis is current", { exact: true }).waitFor();
    }
    await p
      .getByRole("navigation", { name: "plan sections" })
      .getByRole("button", { name: "review & publish", exact: true })
      .click();
    await button(p, "approve this exact version").click();
    await p
      .getByText("approval matches this client and revision", { exact: true })
      .waitFor();
    await p.getByText("draft basis is current", { exact: true }).waitFor();
    assert.equal(actionCalls(s, "publish_plan_v1").length, 0);
    assert.equal(await button(p, "publish plan").isEnabled(), true);
    await h.screenshot("ready-later-1440.png");
    await button(p, "publish plan").click();
    await p
      .getByRole("heading", { name: "plan published", exact: true })
      .waitFor();
    assert.equal(actionCalls(s, "review_section_v1").length, 5);
    assert.equal(actionCalls(s, "approve_publication_v1").length, 1);
    assert.equal(
      actionCalls(s, "approve_publication_v1")[0].command.target
        .contentRevision,
      2,
    );
    assert.equal(actionCalls(s, "publish_plan_v1").length, 1);
    assert.equal(
      actionCalls(s, "publish_plan_v1")[0].command.firstServiceClaimId,
      null,
    );
    assert.equal(JSON.stringify(s.clocks), clocks);
    assert.equal(JSON.stringify(s.f.context.payments), finance);
    assert.deepEqual(s.f.getView().draft.content, body);
    assert.equal(
      s.calls.filter((x) =>
        /report_product_use|record_client_use|confirm_payment|report_unreviewed|auth\/request/.test(
          x.command.action,
        ),
      ).length,
      0,
    );
    await h.screenshot("later-publication-1440.png");
  } finally {
    await h.close();
  }
});

for (const width of [1440, 390, 320])
  test(`new report disclosure and complete long original/correction remain keyboard readable at ${width}`, async () => {
    const h = await openDependencyApp(browser, {
      width,
      longText: true,
      knownStart: width === 1440,
    });
    try {
      const { p, s } = h;
      await ready(p);
      await p
        .getByText(
          "reported original start: " +
            (width === 1440 ? "2026-10-20" : "not known"),
          { exact: true },
        )
        .waitFor();
      await p
        .getByText("product or reports need clarification", { exact: true })
        .waitFor();
      await p.evaluate(() => document.fonts.ready);
      const reports = await openReports(p);
      const long = reports
        .locator("p")
        .filter({ hasText: "SYNTHETIC ORIGINAL FINAL LINE" });
      assert.equal(
        (await long.textContent()).includes(s.report.change.details),
        true,
      );
      for (let i = 0; i < 30; i++) {
        const visible = await long.evaluate((e) => {
          const r = e.getBoundingClientRect();
          return r.bottom <= innerHeight && r.bottom > 0;
        });
        if (visible) break;
        await p.keyboard.press("PageDown");
        await p.evaluate(
          () =>
            new Promise((resolve) => {
              let last = scrollY,
                stable = 0,
                frames = 0;
              const frame = () => {
                stable = scrollY === last ? stable + 1 : 0;
                last = scrollY;
                if (stable >= 4 || ++frames >= 90) resolve();
                else requestAnimationFrame(frame);
              };
              requestAnimationFrame(frame);
            }),
        );
      }
      assert.equal(
        await long.evaluate((e) => {
          const r = e.getBoundingClientRect();
          return r.bottom <= innerHeight && r.bottom > 0;
        }),
        true,
      );
      assert.match(await reports.innerText(), /correct frequency and amount/);
      assert.match(await reports.innerText(), /correction by another advisor/);
      assert.match(await reports.innerText(), /once a week/);
      assert.match(await reports.innerText(), /a small amount/);
      assert.equal(
        await p.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        true,
      );
      assert.equal(s.writes().length, 0);
      assert.deepEqual(
        await p.evaluate(() => [
          Object.keys(localStorage),
          Object.keys(sessionStorage),
        ]),
        [[], []],
      );
      await h.screenshot(`long-original-${width}.png`);
      const acknowledgement = p.getByRole("combobox", {
        name: "review current reports and corrections",
        exact: true,
      });
      await p.keyboard.press("Tab");
      assert.equal(await button(p, "refresh current client information").evaluate(e => e === document.activeElement), true);
      await p.keyboard.press("Tab");
      assert.equal(await acknowledgement.evaluate(e => e === document.activeElement), true);
      await p.keyboard.press("Enter");
      await p.getByRole("option", {name: "not yet reviewed", exact: true}).waitFor();
      await p.waitForFunction(() => document.activeElement?.getAttribute("role") === "option");
      await p.keyboard.press("End");
      await p.waitForFunction(() => document.activeElement?.textContent?.includes("i reviewed this current information"));
      await p.keyboard.press("Enter");
      await p.waitForFunction(() => Array.from(document.querySelectorAll("button")).some(e => e.textContent?.trim() === "update draft basis" && !e.disabled));
      assert.match(
        await acknowledgement.innerText(),
        /i reviewed this current information/,
      );
      await p.keyboard.press("Tab");
      assert.equal(
        await button(p, "update draft basis").evaluate(
          (e) => e === document.activeElement,
        ),
        true,
      );
      assert.equal(await button(p, "update draft basis").isEnabled(), true);
      assert.equal(
        s.writes().length,
        0,
        "keyboard acknowledgement is not a rebase",
      );
    } finally {
      await h.close();
    }
  });

for (const [head, message] of [
  ["reportHead", "changed client reports are unavailable"],
  ["instructionHead", "changed instructions are unavailable"],
  ["legacyBasisManifestHash", "publication, intake or baseline changed"],
])
  test(`missing ${head} content never becomes a blind rebase acknowledgement`, async () => {
    const h = await openDependencyApp(browser, {
      changed: { [head]: head.endsWith("Hash") ? "d".repeat(64) : 1 },
    });
    try {
      await ready(h.p);
      await h.p.getByText(message, { exact: false }).waitFor();
      await assertDisabled(
        h.p.getByRole("combobox", {
          name: "review current reports and corrections",
        }),
      );
      await assertDisabled(button(h.p, "update draft basis"));
      await assertDisabled(button(h.p, "publish plan"));
      assert.equal(h.s.writes().length, 0);
    } finally {
      await h.close();
    }
  });

test("25-entry history pages must finish at one inspected head before deliberate acknowledgement", async () => {
  const h = await openDependencyApp(browser, { historyCount: 28 });
  try {
    const { p, s } = h;
    await ready(p);
    await assertDisabled(
      p.getByRole("combobox", {
        name: "review current reports and corrections",
      }),
    );
    assert.equal(
      actionCalls(s, "read_advisor_use_history_v1")[0].command.limit,
      25,
    );
    await button(p, "load more client reports").focus();
    await p.keyboard.press("Enter");
    await p
      .getByRole("combobox", { name: "review current reports and corrections" })
      .waitFor();
    await acknowledge(p);
    assert.equal(s.writes().length, 0);
    const reads = actionCalls(s, "read_advisor_use_history_v1");
    assert.equal(reads.length, 2);
    assert.match(reads[1].command.cursor, /^c:[a-f0-9]{64}:/);
    await button(p, "update draft basis").click();
    await p.getByText("draft basis is current", { exact: true }).waitFor();
    assert.equal(
      actionCalls(s, "rebase_draft_dependencies_v1")[0].command.expectedHeads
        .useHead,
      28,
    );
  } finally {
    await h.close();
  }
});

test("a changed history head refuses page mixing and requires refreshed complete information", async () => {
  const h = await openDependencyApp(browser, { historyCount: 28 });
  try {
    const { p, s } = h;
    await ready(p);
    s.current.useHead++;
    await button(p, "load more client reports").click();
    await p
      .getByText("client reports changed or could not be loaded.", {
        exact: false,
      })
      .waitFor();
    await assertDisabled(
      p.getByRole("combobox", {
        name: "review current reports and corrections",
      }),
    );
    assert.equal(s.writes().length, 0);
    await button(p, "refresh current client information").click();
    await ready(p);
    await button(p, "load more client reports").click();
    await acknowledge(p);
    assert.equal(s.writes().length, 0);
    await button(p, "update draft basis").click();
    await p.getByText("draft basis is current", { exact: true }).waitFor();
    assert.equal(
      actionCalls(s, "rebase_draft_dependencies_v1")[0].command.expectedHeads
        .useHead,
      29,
    );
  } finally {
    await h.close();
  }
});

for (const status of [403, 503])
  test(`current care read ${status} exposes honest refresh recovery without accepting the basis`, async () => {
    const h = await openDependencyApp(browser);
    try {
      const { p, s } = h;
      await ready(p);
      const held = s.hold("read_advisor_use_history_v1", () => ({
        status,
        body: { code: "unavailable" },
      }));
      await button(p, "refresh current client information").click();
      await held.ready;
      held.release();
      await p
        .getByText("current client information could not be confirmed.", {
          exact: false,
        })
        .waitFor();
      await assertDisabled(button(p, "publish plan"));
      assert.equal(s.writes().length, 0);
      if (status === 503) await button(p, "check connection").click();
      await button(p, "refresh current client information").click();
      await ready(p);
      await assertDisabled(button(p, "update draft basis"));
      assert.equal(s.writes().length, 0);
    } finally {
      await h.close();
    }
  });

test("uncertain rebase retains exact request through status403/absent and only same-byte retry acknowledges it", async () => {
  const h = await openDependencyApp(browser);
  try {
    const { p, s } = h;
    await ready(p);
    await acknowledge(p);
    const lost = s.hold("rebase_draft_dependencies_v1", (v) => ({
      ...v,
      unsupported: true,
    }));
    await button(p, "update draft basis").click();
    await lost.ready;
    const bytes = actionCalls(s, "rebase_draft_dependencies_v1")[0].bytes;
    lost.release();
    await p.getByText("result uncertain", { exact: true }).waitFor();
    const denied = s.hold("request_status_v1", () => ({
      status: 403,
      body: { code: "forbidden" },
    }));
    await button(p, "check request status").click();
    await denied.ready;
    denied.release();
    await p.getByText("action unavailable", { exact: true }).waitFor();
    assert.equal(actionCalls(s, "rebase_draft_dependencies_v1").length, 1);
    await assertDisabled(button(p, "publish plan"));
    const absent = s.hold("request_status_v1", () => ({ status: "absent" }));
    await button(p, "check request status").click();
    await absent.ready;
    absent.release();
    await button(p, "retry same request").waitFor();
    assert.equal(actionCalls(s, "rebase_draft_dependencies_v1").length, 1);
    await button(p, "retry same request").click();
    await p.getByText("draft basis is current", { exact: true }).waitFor();
    assert.equal(
      actionCalls(s, "rebase_draft_dependencies_v1")[1].bytes,
      bytes,
    );
    assert.equal(await button(p, "retry same request").count(), 0);
    await assertDisabled(button(p, "publish plan"));
    assert.equal(s.f.context.approval, null);
  } finally {
    await h.close();
  }
});

test("CAS409 requires a fresh matching read and another deliberate acknowledgement before a new UUID", async () => {
  const h = await openDependencyApp(browser);
  try {
    const { p, s } = h;
    await ready(p);
    await acknowledge(p);
    s.current.useHead++;
    await button(p, "update draft basis").click();
    await p
      .getByText("client information changed; review it again", { exact: true })
      .waitFor();
    assert.equal(actionCalls(s, "rebase_draft_dependencies_v1").length, 1);
    await button(p, "refresh current client information").click();
    await ready(p);
    await assertDisabled(button(p, "update draft basis"));
    assert.equal(actionCalls(s, "rebase_draft_dependencies_v1").length, 1);
    await acknowledge(p);
    await button(p, "update draft basis").click();
    await p.getByText("draft basis is current", { exact: true }).waitFor();
    const attempts = actionCalls(s, "rebase_draft_dependencies_v1");
    assert.equal(attempts.length, 2);
    assert.notEqual(
      attempts[0].command.requestId,
      attempts[1].command.requestId,
    );
    assert.equal(attempts[1].command.expectedHeads.useHead, 5);
  } finally {
    await h.close();
  }
});

for (const status of [403, 503])
  test(`old dependency read ${status} cannot erase autosaving manual B or its exact uncertain retry`, async () => {
    const h = await openDependencyApp(browser, { section: "client-context" });
    try {
      const { p, s } = h;
      await ready(p);
      const old = s.hold("read_draft_dependencies_v1", () => ({
        status,
        body: { code: "unavailable" },
      }));
      await button(p, "refresh current client information").click();
      await old.ready;
      const saving = s.hold("save_draft_v1", (v) => ({
        ...v,
        unsupported: true,
      }));
      await p
        .getByRole("textbox", { name: "summary", exact: true })
        .fill("SYNTHETIC manual buffer B");
      await saving.ready;
      const before = actionCalls(s, "save_draft_v1")[0];
      old.release();
      if (status === 503) {
        await button(p, "check connection").click();
        await button(p, "check connection").waitFor({ state: "hidden" });
      }
      assert.equal(
        await p
          .getByRole("textbox", { name: "summary", exact: true })
          .inputValue(),
        "SYNTHETIC manual buffer B",
      );
      assert.equal(
        await button(p, "save draft").getAttribute("aria-busy"),
        "true",
      );
      saving.release();
      await p.getByText("result uncertain", { exact: true }).waitFor();
      await button(p, "retry same request").click();
      await p.getByText("saved", { exact: true }).waitFor();
      const after = actionCalls(s, "save_draft_v1");
      assert.equal(after.length, 2);
      assert.equal(after[1].bytes, before.bytes);
      assert.equal(
        s.f.getView().draft.content.summary,
        "SYNTHETIC manual buffer B",
      );
      assert.equal(actionCalls(s, "rebase_draft_dependencies_v1").length, 0);
    } finally {
      await h.close();
    }
  });

test("a newer restrictive gate retires a held current-information read; a later lawful refresh still recovers", async () => {
  const h = await openDependencyApp(browser);
  try {
    const { p, s } = h;
    await ready(p);
    const old = s.hold("read_advisor_use_history_v1");
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
    await assertDisabled(button(p, "publish plan"));
    assert.equal(await button(p, "update draft basis").count(), 0);
    Object.assign(s.caps, {
      edit: true,
      review: true,
      approve: true,
      publish: true,
    });
    s.dependencyDenied = false;
    await button(p, "refresh publication checks").click();
    await ready(p);
    await assertDisabled(button(p, "update draft basis"));
    assert.equal(s.writes().length, 0);
  } finally {
    await h.close();
  }
});

for (const [amender, label] of [
  [ids.client, "correction by client"],
  [ids.actor, "correction by advisor"],
])
  test(`current and original report distinguish ${label} from the original recorder`, async () => {
    const h = await openDependencyApp(browser, { amender });
    try {
      await ready(h.p);
      await h.p.getByText(label, { exact: false }).first().waitFor();
      const reports = await openReports(h.p);
      assert.match(await reports.innerText(), new RegExp(label));
      assert.match(
        await reports.innerText(),
        /reported by client · recorded by advisor/,
      );
      assert.match(await reports.innerText(), /twice a week/);
      assert.match(await reports.innerText(), /once a week/);
      assert.match(await reports.innerText(), /a small amount/);
      assert.equal(h.s.writes().length, 0);
    } finally {
      await h.close();
    }
  });

test("descriptor correction preserves original identity/history without applying the old identity to the new version", async () => {
  const h = await openDependencyApp(browser, { descriptorCorrection: true });
  try {
    await ready(h.p);
    await h.p
      .getByRole("heading", {
        name: "corrected CeraVe PM SYNTHETIC · unreviewed product",
        exact: true,
      })
      .waitFor();
    const reports = await openReports(h.p);
    assert.match(await reports.innerText(), /product description correction/);
    assert.match(await reports.innerText(), /correct the product name/);
    assert.match(await reports.innerText(), /client-reported CeraVe label/);
    assert.match(await reports.innerText(), /product match: not sure/);
    assert.match(
      await reports.innerText(),
      /variant: client-reported variant · strength: not known/,
    );
    assert.equal(
      await h.p
        .getByText("client-reported product match:", { exact: false })
        .count(),
      0,
    );
    assert.equal(h.s.writes().length, 0);
  } finally {
    await h.close();
  }
});

test("route selection retires acknowledgement and hides the old panel while the other unassigned draft read is held", async () => {
  const h = await openDependencyApp(browser, { secondDraft: true });
  try {
    const { p, s } = h;
    await ready(p);
    await acknowledge(p);
    await p.getByRole("link", { name: "plans", exact: true }).click();
    const other = s.hold("read_draft_v1");
    await p
      .getByRole("button", {
        name: "care plan · " + ids.other.slice(0, 8),
        exact: true,
      })
      .last()
      .click();
    await other.ready;
    await p.getByText("loading private draft", { exact: true }).waitFor();
    assert.equal(
      await p
        .getByText("current client information changed", { exact: true })
        .count(),
      0,
    );
    assert.equal(await button(p, "update draft basis").count(), 0);
    other.release();
    await p
      .getByText("client information will be available after assignment", {
        exact: true,
      })
      .waitFor();
    assert.equal(s.f.getView().draft.clientId, null);
    assert.equal(actionCalls(s, "rebase_draft_dependencies_v1").length, 0);
  } finally {
    await h.close();
  }
});

for (const options of [{ assigned: false }, { preparation: true }])
  test(`preparation ${Object.keys(options)[0]} never fabricates care access, reports or an Auth client`, async () => {
    const h = await openDependencyApp(browser, options);
    try {
      if (options.assigned === false)
        await h.p
          .getByText("client information will be available after assignment", {
            exact: true,
          })
          .waitFor();
      else
        await h.p
          .getByText("draft basis is current", { exact: true })
          .waitFor();
      assert.equal(actionCalls(h.s, "read_advisor_publication_v2").length, 0);
      assert.equal(
        await h.p.getByText("client care access:", { exact: false }).count(),
        0,
      );
      assert.equal(await button(h.p, "update draft basis").count(), 0);
      assert.equal(h.s.writes().length, 0);
    } finally {
      await h.close();
    }
  });

test("view-only dependency403 stays unavailable while authorized draft text remains keyboard readable and immutable", async () => {
  const h = await openDependencyApp(browser, {
    section: "client-context",
    dependencyDenied: true,
    caps: { edit: false, review: false, approve: false, publish: false },
  });
  try {
    const { p, s } = h;
    await p
      .getByText("current client information could not be confirmed.", {
        exact: false,
      })
      .waitFor();
    const summary = p.getByRole("textbox", { name: "summary", exact: true });
    assert.equal(
      await summary.evaluate((e) => e.readOnly && !e.disabled),
      true,
    );
    const original = await summary.inputValue();
    await summary.focus();
    await p.keyboard.press("End");
    await p.keyboard.type("UNAUTHORIZED");
    assert.equal(await summary.inputValue(), original);
    assert.equal(await button(p, "update draft basis").count(), 0);
    assert.equal(s.writes().length, 0);
  } finally {
    await h.close();
  }
});

test("confirmed payment waits for its current dependency read before returning to ready publication checks", async () => {
  const h = await openDependencyApp(browser, { preparation: true });
  try {
    const { p, s } = h;
    await p.getByText("draft basis is current", { exact: true }).waitFor();
    await button(p, "refresh publication checks").click();
    await p.getByText("first publication", { exact: true }).waitFor();
    await p.getByText("draft basis is current", { exact: true }).waitFor();
    await button(p, "approve this exact version").click();
    await p.getByText("revision approved", { exact: true }).waitFor();
    await p.getByText("draft basis is current", { exact: true }).waitFor();
    const approval = structuredClone(s.f.context.approval),
      clocks = JSON.stringify(s.clocks);
    await button(p, "open payment verification").click();
    await p
      .getByRole("textbox", {
        name: "actual gross amount received",
        exact: true,
      })
      .fill("100.00");
    await p
      .getByRole("combobox", {
        name: "receipt checked outside shelv",
        exact: true,
      })
      .click();
    await p
      .getByRole("option", {
        name: "amount, recipient and transaction checked",
        exact: true,
      })
      .click();
    const held = s.hold("read_draft_dependencies_v1");
    await button(p, "confirm verified payment").click();
    await Promise.race([
      held.ready,
      p
        .getByRole("heading", { name: "review & publish", exact: true })
        .waitFor()
        .catch(() => {}),
    ]);
    assert.equal(
      await p
        .getByRole("heading", {
          name: "verify first service payment",
          exact: true,
        })
        .isVisible(),
      true,
      "financial acknowledgement must finish its current basis read before leaving this form",
    );
    held.release();
    await button(p, "publish first plan").waitFor();
    assert.equal(await button(p, "publish first plan").isEnabled(), true);
    assert.equal(actionCalls(s, "confirm_payment").length, 1);
    assert.equal(actionCalls(s, "publish_plan_v1").length, 0);
    assert.deepEqual(s.f.context.approval, approval);
    assert.equal(JSON.stringify(s.clocks), clocks);
  } finally {
    await h.close();
  }
});

for (const outcome of ["committed", "denied"])
  test(`old approval ${outcome} status cannot restore newer restricted publication authority`, async () => {
    const h = await openDependencyApp(browser, { currentBasis: true });
    try {
      const { p, s } = h;
      await p.getByText("draft basis is current", { exact: true }).waitFor();
      await button(p, "refresh publication checks").click();
      await p.getByText("updated plan", { exact: true }).waitFor();
      await p.getByText("draft basis is current", { exact: true }).waitFor();
      const lost = s.hold("approve_publication_v1", (v) => ({
        ...v,
        unsupported: true,
      }));
      await button(p, "approve this exact version").click();
      await lost.ready;
      lost.release();
      await p.getByText("result uncertain", { exact: true }).waitFor();
      const original = actionCalls(s, "approve_publication_v1")[0];
      await button(p, "refresh publication checks").click();
      await p.getByText("revision approved", { exact: true }).waitFor();
      s.f.context.approval = null;
      const restrictive = s.hold("read_advisor_gate_v1");
      await button(p, "refresh publication checks").click();
      await restrictive.ready;
      const status = s.hold(
        "request_status_v1",
        outcome === "denied"
          ? () => ({ status: 403, body: { code: "forbidden" } })
          : (v) => v,
      );
      await button(p, "check request status").click();
      await status.ready;
      status.release();
      if (outcome === "denied") {
        await p.getByText("action unavailable", { exact: true }).waitFor();
        assert.equal(await button(p, "retry same request").count(), 1);
      } else await button(p, "retry same request").waitFor({ state: "hidden" });
      restrictive.release();
      await assertDisabled(button(p, "publish plan"));
      if (outcome === "denied") {
        await button(p, "retry same request").click();
        await button(p, "retry same request").waitFor({ state: "hidden" });
        assert.equal(
          actionCalls(s, "approve_publication_v1")[1].bytes,
          original.bytes,
        );
      }
      await button(p, "refresh publication checks").click();
      await p.getByText("draft basis is current", { exact: true }).waitFor();
      await p.getByText("revision not approved", { exact: true }).waitFor();
      await assertDisabled(button(p, "publish plan"));
      assert.equal(actionCalls(s, "publish_plan_v1").length, 0);
      assert.equal(
        actionCalls(s, "request_status_v1")[0].command.requestId,
        original.command.requestId,
      );
    } finally {
      await h.close();
    }
  });

test("old rebase status cannot clear later uncertain save B after exact rebase retry", async () => {
  const h = await openDependencyApp(browser, { section: "client-context" });
  try {
    const { p, s } = h;
    await ready(p);
    await acknowledge(p);
    const a = s.hold("rebase_draft_dependencies_v1", (v) => ({
      ...v,
      unsupported: true,
    }));
    await button(p, "update draft basis").click();
    await a.ready;
    a.release();
    await p.getByText("result uncertain", { exact: true }).waitFor();
    const status = s.hold("request_status_v1", () => ({
      status: 403,
      body: { code: "forbidden" },
    }));
    await button(p, "check request status").click();
    await status.ready;
    await button(p, "retry same request").click();
    await p.getByText("draft basis is current", { exact: true }).waitFor();
    const b = s.hold("save_draft_v1", (v) => ({ ...v, unsupported: true }));
    await p
      .getByRole("textbox", { name: "summary", exact: true })
      .fill("SYNTHETIC B after rebase retry");
    await b.ready;
    const pending = actionCalls(s, "save_draft_v1")[0];
    status.release();
    assert.equal(
      await button(p, "save draft").getAttribute("aria-busy"),
      "true",
    );
    assert.equal(
      await p.getByText("action unavailable", { exact: true }).count(),
      0,
    );
    b.release();
    await p.getByText("result uncertain", { exact: true }).waitFor();
    await button(p, "retry same request").click();
    await p.getByText("saved", { exact: true }).waitFor();
    assert.equal(actionCalls(s, "save_draft_v1")[1].bytes, pending.bytes);
    assert.equal(
      s.f.getView().draft.content.summary,
      "SYNTHETIC B after rebase retry",
    );
    assert.equal(
      actionCalls(s, "rebase_draft_dependencies_v1")[0].bytes,
      actionCalls(s, "rebase_draft_dependencies_v1")[1].bytes,
    );
  } finally {
    await h.close();
  }
});
