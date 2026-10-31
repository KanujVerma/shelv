import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
const portal = path.resolve(import.meta.dirname, ".."),
  output = path.resolve(
    portal,
    "../../.local-artifacts/portal-rebuild/application",
  );
test("application candidate bundles actual mount, self-only connection policy, fonts/assets and original notices without changing release composition", async () => {
  execFileSync(process.execPath, ["scripts/build-portal-app.mjs"], {
    cwd: portal,
    stdio: "pipe",
  });
  const html = await fs.readFile(path.join(output, "index.html"), "utf8");
  assert.match(html, /data-portal-application/);
  assert.match(html, /connect-src 'self'/);
  assert.doesNotMatch(html, /https:\/\/|data-foundation-preview|supabase/);
  const manifest = JSON.parse(
    await fs.readFile(path.join(output, "application-provenance.json"), "utf8"),
  );
  assert.equal(manifest.candidate, true);
  assert.equal(manifest.gatewayIncluded, false);
  assert.ok(
    manifest.assets.some(
      (a) => a.output === "assets/approved/C03-imgProductPhoto.png",
    ),
  );
  assert.ok(manifest.assets.some((a) => a.output === "assets/shelv-mark.png"));
  const metadata = JSON.parse(
    await fs.readFile(path.join(output, "build-metadata.json"), "utf8"),
  );
  assert.ok(
    Object.keys(metadata.inputs).some((p) => p.endsWith("src/app/start.tsx")),
  );
  assert.ok(
    Object.keys(metadata.inputs).some((p) =>
      p.endsWith("site/auth/client-cookie-session.js"),
    ),
  );
  assert.equal(
    Object.keys(metadata.inputs).some((p) =>
      p.endsWith("site/auth/supabase-auth.js"),
    ),
    false,
  );
  const inventory = JSON.parse(
    await fs.readFile(
      path.join(output, "licenses/emitted-packages.json"),
      "utf8",
    ),
  );
  assert.ok(inventory.packages.some((p) => p.name === "react"));
  assert.ok(inventory.packages.some((p) => p.name === "@fontsource/inter"));
  for (const p of inventory.packages)
    for (const legal of p.legalFiles) {
      const bytes = await fs.readFile(
        path.join(output, "licenses", legal.output),
      );
      assert.equal(
        createHash("sha256").update(bytes).digest("hex"),
        legal.sha256,
      );
    }
  for (const asset of manifest.assets) {
    const bytes = await fs.readFile(path.join(output, asset.output));
    assert.equal(
      createHash("sha256").update(bytes).digest("hex"),
      asset.sha256,
    );
  }
});
