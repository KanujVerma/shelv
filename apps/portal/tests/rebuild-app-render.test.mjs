import test from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { pathToFileURL } from "node:url";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { createClientPlanController } from "../src/app/client-state.ts";
import { createApplicationSession } from "../src/app/session.ts";
import { createClientPorts } from "../src/app/ports.ts";
const output = new URL(
  "../../../.local-artifacts/portal-rebuild/app-ssr/",
  import.meta.url,
);
await mkdir(output, { recursive: true });
await build({
  absWorkingDir: path.resolve(import.meta.dirname, ".."),
  tsconfig: "tsconfig.frontend.json",
  entryPoints: ["tests/rebuild/app-ssr-entry.tsx"],
  outfile: new URL("entry.cjs", output).pathname,
  platform: "node",
  format: "cjs",
  bundle: true,
  loader: { ".css": "empty" },
});
const m = (await import(pathToFileURL(new URL("entry.cjs", output).pathname)))
  .default;
const { createElement: h, renderToStaticMarkup: render } = m;
const nav = {
  getSnapshot: () => "/plan",
  subscribe: () => () => {},
  navigate() {
    throw Error("unexpected navigation");
  },
  back() {},
  backDestination: () => ({ name: "plan", routine: "morning" }),
  dispose() {},
};
function inside(node) {
  return render(
    h(
      m.OverlayProvider,
      null,
      h(m.NavigationProvider, { navigator: nav }, node),
    ),
  );
}
test("public Maya recovery and unknown page SSR never construct a session or imply a completed tour", () => {
  const page = render(h(m.PublicEntry, { route: { name: "maya", stage: 1 } }));
  assert.match(page, /fictional demo/);
  assert.match(page, /does not include the five-stage tour/);
  assert.doesNotMatch(page, /publication committed|sign out/);
  assert.match(render(h(m.PublicEntry, { route: null })), /check the address/);
});
test("actual application client renders preparation and unavailable modules without care/money/use success placeholders", async () => {
  const runtime = createApplicationSession({
    audience: "client",
    locks: { request: async (_, o, run) => run(o.signal) },
    fetcher: async (url) => {
      if (url === "/api/client/session")
        return Response.json({
          signedIn: true,
          ownerId: "10000000-0000-4000-8000-000000000002",
          generation: 1,
          capabilities: {
            view: true,
            edit: false,
            publish: false,
            confirmPayments: false,
          },
          csrf: "synthetic",
          idleExpiresAt: "2099-01-01T00:00:00Z",
          absoluteExpiresAt: "2099-01-02T00:00:00Z",
        });
      assert.equal(url, "/api/client/plans");
      return Response.json({
        schemaVersion: 1,
        access: "preparation",
        plan: null,
        decisionRevision: 0,
        decisions: [],
        actualUse: [],
        nextReviewOn: null,
      });
    },
  });
  try {
    await runtime.restore();
    const boundary = runtime.getSnapshot().boundary,
      ports = createClientPorts(runtime),
      controller = createClientPlanController(boundary, ports);
    await controller.refresh();
    const content = inside(
      h(m.ClientContent, {
        controller,
        ports,
        boundary,
        route: { name: "plan", routine: "morning" },
        onSignOut() {},
      }),
    );
    assert.match(content, /your plan is being prepared/);
    assert.match(content, /check-ins &amp; history/);
    assert.doesNotMatch(
      content,
      /approve product|record a change in use|download plan|send an update/,
    );
    for (const name of ["orders", "history", "account", "product-use"]) {
      const page = inside(
        h(m.ClientContent, {
          controller,
          ports,
          boundary,
          route: { name, productId: "unknown", routine: "morning" },
          onSignOut() {},
        }),
      );
      assert.match(page, /this page is not connected yet/);
      assert.doesNotMatch(page, /payment confirmed|report sent|order placed/);
    }
    controller.dispose();
  } finally {
    runtime.dispose();
  }
});
