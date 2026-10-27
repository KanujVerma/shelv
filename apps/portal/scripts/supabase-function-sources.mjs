import { readFile, lstat, realpath } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import ts from 'typescript';

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const demand = (condition, message) => { if (!condition) throw new Error(message); };
const canonical = value => JSON.stringify(value);
const compareText = (a, b) => a < b ? -1 : a > b ? 1 : 0;
const exists = async filename => { try { await lstat(filename); return true; } catch (error) { if (error.code === 'ENOENT') return false; throw error; } };

function relativeName(name) {
  demand(typeof name === 'string' && name && !name.includes('\\') && !name.includes('\0') && !path.posix.isAbsolute(name) && name.split('/').every(part => part && part !== '.' && part !== '..'), 'Source reference is outside the repository or unsupported');
  demand(!name.split('/').some(part => /^\.(?:env|dev\.vars|npmrc)(?:\.|$)/.test(part) || /\.(?:pem|key|p12|p8|private\.json)$/i.test(part)), 'Private configuration cannot enter a function source closure');
  return name;
}
async function ownedFile(repository, name) {
  relativeName(name);
  let filename = repository;
  for (const part of name.split('/')) {
    filename = path.join(filename, part);
    let entry;
    try { entry = await lstat(filename); } catch (error) { if (error.code === 'ENOENT') throw new Error(`Missing function source reference: ${name}`); throw error; }
    demand(!entry.isSymbolicLink(), `Symlink function source reference is forbidden: ${name}`);
  }
  demand((await lstat(filename)).isFile(), `Function source reference must be a regular file: ${name}`);
  const bytes = await readFile(filename);
  demand(bytes.length <= 2 * 1024 * 1024, `Function source exceeds the reviewed size bound: ${name}`);
  const content = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes);
  return { name, bytes: bytes.length, sha256: sha256(bytes), content };
}

function functionConfigurations(content, selected) {
  const found = new Map();
  let active = null;
  for (const raw of content.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    if (line.startsWith('[')) {
      active = null;
      const match = /^\[functions\.(?:"([^"]+)"|'([^']+)'|([A-Za-z0-9_-]+))\]\s*(?:#.*)?$/.exec(line);
      if (match && selected.has(match[1] || match[2] || match[3])) {
        active = match[1] || match[2] || match[3];
        demand(!found.has(active), 'Duplicate function configuration section');
        found.set(active, {});
      } else demand(!/^\[functions\./.test(line) || match, 'Unsupported function configuration section');
      continue;
    }
    if (!active) continue;
    const match = /^(verify_jwt|enabled|entrypoint)\s*=\s*(.*)$/.exec(line);
    demand(match, `Unsupported release function configuration: ${active}`);
    const key = match[1], values = found.get(active);
    demand(!Object.hasOwn(values, key), `Duplicate function configuration key: ${active}`);
    if (key === 'entrypoint') {
      const value = /^("[^"\\]*"|'[^']*')\s*(?:#.*)?$/.exec(match[2]);
      demand(value, 'Entrypoint configuration must be an explicit local string');
      values[key] = value[1].slice(1, -1);
    } else {
      const value = /^(true|false)\s*(?:#.*)?$/.exec(match[2]);
      demand(value, 'Function auth configuration must be an explicit boolean');
      values[key] = value[1] === 'true';
    }
  }
  return found;
}

function dependencies(file) {
  const javascript = /\.(?:mjs|js)$/.test(file.name);
  const tree = ts.createSourceFile(file.name, file.content, ts.ScriptTarget.Latest, true, javascript ? ts.ScriptKind.JS : ts.ScriptKind.TS);
  demand(tree.parseDiagnostics.length === 0, `Unsupported or invalid source syntax: ${file.name}`);
  const references = [];
  const literal = (node, kind) => {
    demand(node && (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)), `Computed or unsupported import reference: ${file.name}`);
    references.push({ specifier: node.text, kind });
  };
  const visit = node => {
    // These loader identifiers are unsupported even when referenced indirectly
    // (for example `const load = require`). Do not claim a closed ESM graph.
    if (ts.isIdentifier(node) && ['require', 'module', 'exports', 'createRequire'].includes(node.text)) throw new Error(`Unsupported CommonJS loader reference: ${file.name}`);
    if (ts.isImportDeclaration(node)) literal(node.moduleSpecifier, node.importClause?.isTypeOnly ? 'type-import' : 'import');
    else if (ts.isExportDeclaration(node) && node.moduleSpecifier) literal(node.moduleSpecifier, node.isTypeOnly ? 'type-export' : 'export');
    else if (ts.isImportTypeNode(node)) { demand(ts.isLiteralTypeNode(node.argument), `Computed import type: ${file.name}`); literal(node.argument.literal, 'import-type'); }
    else if (ts.isImportEqualsDeclaration(node)) throw new Error(`Unsupported import-equals reference: ${file.name}`);
    else if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
      demand(node.arguments.length === 1, `Unsupported dynamic import options: ${file.name}`); literal(node.arguments[0], 'literal-dynamic-import');
    } else if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'require') throw new Error(`Unsupported require reference: ${file.name}`);
    ts.forEachChild(node, visit);
  };
  visit(tree);
  for (const reference of tree.referencedFiles) references.push({ specifier: reference.fileName, kind: 'reference-path' });
  for (const reference of tree.typeReferenceDirectives) references.push({ specifier: reference.fileName, kind: 'reference-types' });
  return references;
}
function functionIdentity(fn) {
  return { name: fn.name, entrypoint: fn.entrypoint, requiredVerifyJwt: fn.requiredVerifyJwt, verifyJwt: fn.verifyJwt, verifyJwtEvidence: fn.verifyJwtEvidence, hostedBaseline: fn.hostedBaseline, files: fn.files.map(({ name, bytes, sha256 }) => ({ name, bytes, sha256 })), externalImports: fn.externalImports };
}
function aggregateIdentity(manifest) {
  return { schemaVersion: manifest.schemaVersion, typescriptVersion: manifest.typescriptVersion, supportedModuleMode: manifest.supportedModuleMode, projectRef: manifest.projectRef, sourceConfig: manifest.sourceConfig, hostedPreimages: manifest.hostedPreimages, functions: manifest.functions.map(fn => ({ name: fn.name, sourceSha256: fn.sourceSha256 })) };
}

export async function collectSupabaseFunctionSources({ repositoryRoot, configuration }) {
  demand(ts.version === '6.0.3', 'Function source closure requires the pinned TypeScript 6.0.3 parser');
  const repository = await realpath(repositoryRoot);
  demand(configuration?.functions?.length === 4 && new Set(configuration.functions.map(fn => fn.name)).size === 4, 'The four reviewed function targets are required');
  demand(configuration.functions.every(fn => fn.requiredVerifyJwt === true), 'Every release function must explicitly require verify-JWT true');
  const captured = new Map();
  const capture = async name => { if (!captured.has(name)) captured.set(name, await ownedFile(repository, name)); return captured.get(name); };
  const config = await capture(configuration.sourceConfig), preimages = await capture(configuration.hostedPreimages);
  const hosted = JSON.parse(preimages.content);
  demand(Array.isArray(hosted), 'Missing hosted function preimage evidence');
  const configs = functionConfigurations(config.content, new Set(configuration.functions.map(fn => fn.name)));
  const unsupportedConfigNames = ['deno.json', 'deno.jsonc', 'import_map.json'];
  for (const base of ['', 'supabase/functions', ...configuration.functions.map(fn => `supabase/functions/${fn.name}`)]) {
    for (const name of unsupportedConfigNames) demand(!await exists(path.join(repository, base, name)), 'Deno/import-map configuration requires an explicitly supported closure resolver');
  }
  const functions = [];
  for (const definition of configuration.functions) {
    const selected = configs.get(definition.name), baseline = hosted.find(fn => fn.slug === definition.name);
    demand(!selected || selected.enabled !== false, `Function disabled in source configuration: ${definition.name}`);
    if (selected?.entrypoint) demand(path.posix.normalize(`supabase/${selected.entrypoint}`) === definition.entrypoint, 'Unexpected function entrypoint override');
    let verifyJwt;
    if (definition.verifyJwtEvidence === 'preserve_hosted_true') {
      demand(baseline?.verifyJwt === true && (!selected || selected.verify_jwt !== false), `Existing function verify-JWT must remain true: ${definition.name}`);
      verifyJwt = baseline.verifyJwt;
    } else {
      demand(definition.verifyJwtEvidence === 'explicit_source_config' && typeof selected?.verify_jwt === 'boolean', `New function verify-JWT requires explicit source configuration: ${definition.name}`);
      verifyJwt = selected.verify_jwt;
    }
    demand(verifyJwt === definition.requiredVerifyJwt, `Release-required verify-JWT must remain true: ${definition.name}`);
    const files = new Map(), externalImports = [];
    const visit = async name => {
      name = relativeName(name);
      demand(name.startsWith('supabase/functions/') || name.startsWith('src/contracts/'), `Function import is outside the reviewed source roots: ${name}`);
      demand(!/\.(?:cts|cjs)$/.test(name), `Unsupported CommonJS module: ${name}`);
      demand(/\.(?:ts|mts|js|mjs)$/.test(name), `Unsupported function source module: ${name}`);
      if (files.has(name)) return;
      const file = await capture(name); files.set(name, file);
      for (const reference of dependencies(file)) {
        const specifier = reference.specifier;
        if (/^(npm|jsr):[^\s?#]+$/.test(specifier)) {
          demand(!/[\u0000-\u001f\u007f%]/.test(specifier) && !specifier.split('/').includes('..'), 'Unsupported external module reference');
          externalImports.push({ from: name, ...reference, retrieved: false, contentIntegrity: 'not resolved or downloaded by preparation' }); continue;
        }
        demand(specifier.startsWith('./') || specifier.startsWith('../'), `Unsupported function import reference in ${name}`);
        demand(!/[\\%?#\0]/.test(specifier), 'Unsupported encoded or query-bearing import reference');
        const absolute = path.resolve(repository, path.dirname(name), specifier), relative = path.relative(repository, absolute).split(path.sep).join('/');
        demand(relative && relative !== '..' && !relative.startsWith('../') && !path.isAbsolute(relative), 'Function import is outside the repository');
        await visit(relative);
      }
      if (name.endsWith('.mjs')) {
        const declaration = name.slice(0, -4) + '.d.mts';
        if (await exists(path.join(repository, declaration))) await visit(declaration);
      }
    };
    await visit(definition.entrypoint);
    const jpeg = 'supabase/functions/_shared/vendor/jpeg-js/decoder.mjs';
    if (files.has(jpeg)) for (const name of ['LICENSE', 'APACHE-2.0', 'NOTICE.md']) {
      const license = await capture(path.posix.join(path.posix.dirname(jpeg), name)); files.set(license.name, license);
    }
    const fn = { name: definition.name, entrypoint: definition.entrypoint, requiredVerifyJwt: definition.requiredVerifyJwt, verifyJwt, verifyJwtEvidence: definition.verifyJwtEvidence, hostedBaseline: baseline ? { version: baseline.version, verifyJwt: baseline.verifyJwt, bundleSha256: baseline.bundleSha256 } : null, files: [...files.values()].sort((a, b) => compareText(a.name, b.name)), externalImports: externalImports.sort((a, b) => compareText(canonical(a), canonical(b))) };
    fn.sourceSha256 = sha256(canonical(functionIdentity(fn))); functions.push(fn);
  }
  const manifest = { schemaVersion: 1, typescriptVersion: ts.version, supportedModuleMode: 'static-esm', projectRef: configuration.projectRef, sourceConfig: { name: config.name, sha256: config.sha256 }, hostedPreimages: { name: preimages.name, sha256: preimages.sha256 }, functions, contentBinding: 'Deploy only these embedded UTF-8 contents after comparing the approved capsule and release-manifest hashes; never reread mutable workspace files for deployment.', providerCalls: 0, secretsRead: false };
  manifest.aggregateSha256 = sha256(canonical(aggregateIdentity(manifest)));
  for (const [name, file] of captured) demand((await ownedFile(repository, name)).sha256 === file.sha256, 'Supabase function source changed while capturing the reviewed closure');
  return manifest;
}

export async function verifySupabaseFunctionSources({ repositoryRoot, configuration, manifest }) {
  demand(manifest?.schemaVersion === 1 && Array.isArray(manifest.functions) && manifest.functions.length === 4, 'Invalid Supabase function source manifest');
  for (const fn of manifest.functions) {
    demand(Array.isArray(fn.files) && new Set(fn.files.map(file => file.name)).size === fn.files.length, 'Duplicate Supabase function source file');
    for (const file of fn.files) demand(typeof file.content === 'string' && Buffer.byteLength(file.content) === file.bytes && sha256(Buffer.from(file.content)) === file.sha256, 'Supabase function source content hash mismatch');
    demand(sha256(canonical(functionIdentity(fn))) === fn.sourceSha256, 'Supabase function source digest mismatch');
  }
  demand(sha256(canonical(aggregateIdentity(manifest))) === manifest.aggregateSha256, 'Supabase function source aggregate mismatch');
  const current = await collectSupabaseFunctionSources({ repositoryRoot, configuration });
  demand(current.aggregateSha256 === manifest.aggregateSha256, 'Supabase function source hash mismatch against reviewed closure');
  return manifest;
}
