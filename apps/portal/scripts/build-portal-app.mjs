import { build } from "esbuild";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { checkStyles } from "./check-ui-system.mjs";
import { writeEmittedNotices } from "./emitted-notices.mjs";
const portal = fileURLToPath(new URL("../", import.meta.url)),
  repo = path.resolve(portal, "../..");
const output = path.join(repo, ".local-artifacts/portal-rebuild/application");
const [major, minor] = process.versions.node.split(".").map(Number);
if (major < 22 || (major === 22 && minor < 23))
  throw Error("Portal builds require Node.js 22.23.0 or newer.");
async function styles(dir, prefix = "") {
  const files = {};
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const relative = path.posix.join(prefix, e.name);
    if (e.isDirectory())
      Object.assign(files, await styles(path.join(dir, e.name), relative));
    else if (e.name.endsWith(".css"))
      files[relative] = await readFile(path.join(dir, e.name), "utf8");
  }
  return files;
}
const css = await styles(path.join(portal, "src"));
css["ui/system.css"] = css["ui/tokens.css"];
delete css["ui/tokens.css"];
const findings = checkStyles(css);
if (findings.length)
  throw Error(
    "Application styles must use semantic tokens: " + JSON.stringify(findings),
  );
await mkdir(output, { recursive: true });
const result = await build({
  absWorkingDir: portal,
  tsconfig: "tsconfig.frontend.json",
  entryPoints: ["src/main.tsx"],
  outdir: output,
  bundle: true,
  format: "esm",
  splitting: true,
  target: ["es2022"],
  metafile: true,
  entryNames: "application",
  chunkNames: "chunks/[name]-[hash]",
  assetNames: "fonts/[name]-[hash]",
  loader: { ".woff2": "file", ".woff": "file" },
  legalComments: "linked",
});
await writeFile(
  path.join(output, "build-metadata.json"),
  JSON.stringify(result.metafile, null, 2) + "\n",
);
await writeEmittedNotices(result.metafile, {
  workingDirectory: portal,
  outputDirectory: output,
});
await writeFile(
  path.join(output, "index.html"),
  await readFile(path.join(portal, "src/app/index.html")),
);
const assets = [];
async function copy(source, relative, expected) {
  const bytes = await readFile(path.join(repo, source)),
    sha256 = createHash("sha256").update(bytes).digest("hex");
  if (expected && sha256 !== expected)
    throw Error("Approved asset hash mismatch: " + source);
  await mkdir(path.dirname(path.join(output, relative)), { recursive: true });
  await writeFile(path.join(output, relative), bytes);
  assets.push({ source, output: relative, bytes: bytes.length, sha256 });
}
const approved = JSON.parse(
  await readFile(
    path.join(repo, "docs/portal-rebuild/design/ASSETS.json"),
    "utf8",
  ),
);
for (const asset of approved.assets)
  await copy(
    "docs/portal-rebuild/design/" + asset.path,
    "assets/approved/" + path.basename(asset.path),
    asset.sha256,
  );
await copy("apps/portal/site/assets/shelv-mark.png", "assets/shelv-mark.png");
// Retained public product recognition imagery only. No private walkthroughs,
// source documents or client-specific pages are copied into this candidate.
for (const filename of await readdir(path.join(portal, "site/maya/assets")))
  if (/\.(png|jpg|webp)$/.test(filename))
    await copy(
      "apps/portal/site/maya/assets/" + filename,
      "maya/assets/" + filename,
    );
const inputs = [];
for (const input of Object.keys(result.metafile.inputs).sort()) {
  const absolute = path.resolve(portal, input),
    bytes = await readFile(absolute);
  inputs.push({
    source: path.relative(repo, absolute),
    bytes: bytes.length,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  });
}
const template = await readFile(path.join(portal, "src/app/index.html"));
inputs.push({
  source: "apps/portal/src/app/index.html",
  bytes: template.length,
  sha256: createHash("sha256").update(template).digest("hex"),
});
const provenance = {
  schemaVersion: 1,
  candidate: true,
  gatewayIncluded: false,
  sourceHead: execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: repo,
    encoding: "utf8",
  }).trim(),
  sourceDirty:
    execFileSync("git", ["status", "--porcelain"], {
      cwd: repo,
      encoding: "utf8",
    }).trim() !== "",
  entry: "apps/portal/src/main.tsx",
  template: "apps/portal/src/app/index.html",
  inputs,
  assets,
};
await writeFile(
  path.join(output, "application-provenance.json"),
  JSON.stringify(provenance, null, 2) + "\n",
);
console.log(
  "Isolated application candidate: " +
    output +
    " (no gateway, cutover or deployment).",
);
