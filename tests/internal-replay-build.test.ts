import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {join, resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import test from 'node:test';

const root = resolve(import.meta.dirname, '..');
const patchPath = join(root, 'modules/internal-replay/build/patch-posthog.rb');
const pluginPath = join(root, 'plugins/with-internal-replay.js');
const originalPins: Record<string, string> = {
  'PostHog/PostHogConfig.swift': 'fd2ae95ff9cbc43f8bf47b1737985c017c6ffacd6415025346f12e6136ac1141',
  'PostHog/Replay/PostHogReplayIntegration.swift': 'fa897696386eb79c53e3a8454bcd9f022aacfc44bca7e31bb4897effaea19222',
};
const sha = (source: string) => createHash('sha256').update(source).digest('hex');
const require = createRequire(import.meta.url);
const ruby = (args: string[]) => spawnSync('ruby', args, {encoding: 'utf8', env: {...process.env, TMPDIR: '/tmp'}});
const ensurePatch = () => assert.ok(existsSync(patchPath), 'the repository must provide the pinned CocoaPods patch');
function patchManifest(): Record<string, {original_sha256: string; patched_sha256: string; replacements: [string, string][]}> {
  ensurePatch();
  const result = ruby(['-rjson', '-r', patchPath, '-e', 'puts JSON.generate(DeriveInternalReplayCapturePatch::FILES)']);
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}
function fixture() {
  const manifest = patchManifest();
  const folder = mkdtempSync('/tmp/internal-replay-build-');
  const sdk = join(folder, 'ios/Pods/PostHog');
  const originals: Record<string, string> = {};
  for (const [relative, originalPin] of Object.entries(originalPins)) {
    const source = readFileSync(join(root, 'tests/fixtures/posthog-3.88.2', relative), 'utf8');
    assert.equal(sha(source), originalPin, 'controlled source fixture must reproduce the independently pinned upstream bytes');
    originals[relative] = source;
    mkdirSync(resolve(sdk, relative, '..'), {recursive: true});
    writeFileSync(join(sdk, relative), source);
  }
  return {folder, sdk, originals, manifest};
}
function apply(sdk: string, version = '3.88.2', name = 'PostHog') {
  return ruby(['-r', patchPath, '-e', `
    require 'ostruct'
    spec = OpenStruct.new(name: ARGV[2], version: ARGV[1])
    sandbox = Object.new
    sandbox.define_singleton_method(:pod_dir) { |name| raise 'wrong pod' unless name == 'PostHog'; ARGV[0] }
    installer = OpenStruct.new(pod_targets: [OpenStruct.new(root_spec: spec)], sandbox: sandbox)
    DeriveInternalReplayCapturePatch.apply!(installer)
  `, sdk, version, name]);
}
async function modifyPodfile(contents: string) {
  assert.ok(existsSync(pluginPath), 'the Expo plugin must register a real Podfile mod');
  const plugin = require(pluginPath);
  const config = plugin({name: 'Replay fixture', slug: 'replay-fixture'});
  const result = await config.mods.ios.podfile({
    ...config, modResults: {contents, language: 'rb'},
    modRequest: {projectRoot: root, platformProjectRoot: join(root, 'ios'), platform: 'ios', modName: 'podfile'},
  });
  return result.modResults.contents as string;
}

test('the Expo Podfile mod installs one executable repository patch inside post_install', async () => {
  const podfile = "target 'Fixture' do\n  post_install do |installer|\n    puts 'existing hook'\n  end\nend\n";
  const patched = await modifyPodfile(podfile);
  assert.equal(await modifyPodfile(patched), patched, 'prebuild must be idempotent');
  const temp = mkdtempSync('/tmp/internal-replay-plugin-');
  try {
    mkdirSync(join(temp, 'ios'), {recursive: true});
    mkdirSync(join(temp, 'modules/internal-replay/build'), {recursive: true});
    // Ruby evaluates the generated require/call, with CocoaPods itself replaced at its boundary.
    writeFileSync(join(temp, 'modules/internal-replay/build/patch-posthog.rb'), `
      module DeriveInternalReplayCapturePatch
        def self.apply!(installer)
          raise 'installer was not forwarded' unless installer == :installer
          puts 'repository patch applied'
        end
      end
    `);
    writeFileSync(join(temp, 'ios/Podfile'), `
      def target(_); yield; end
      def post_install; yield :installer; end
    ` + patched);
    const result = ruby([join(temp, 'ios/Podfile')]);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout, 'repository patch applied\nexisting hook\n');
  } finally { rmSync(temp, {recursive: true, force: true}); }
});

test('the Expo mod rejects missing, duplicated or changed installation blocks', async () => {
  await assert.rejects(modifyPodfile("target 'Fixture' do\nend\n"), /post_install/i);
  const anchor = '  post_install do |installer|\n  end\n';
  await assert.rejects(modifyPodfile(anchor + anchor), /post_install|ambiguous/i);
  const patched = await modifyPodfile(anchor);
  await assert.rejects(modifyPodfile(patched.replace('apply!(installer)', 'apply!(nil)')), /changed|modified|exact|block/i);
  await assert.rejects(modifyPodfile(patched + patched), /post_install|ambiguous/i);
  await assert.rejects(modifyPodfile(patched.replace('# @generated end internal-replay-capture-admission', '# @generated end internal-replay-capture-admission changed')), /changed|modified|exact|block/i);
  const crlf = anchor.replaceAll('\n', '\r\n');
  const patchedCrlf = await modifyPodfile(crlf);
  assert.equal(await modifyPodfile(patchedCrlf), patchedCrlf);
});

test('the Ruby patch transforms real pinned SDK files and repeated pod install leaves bytes unchanged', () => {
  const f = fixture();
  try {
    const first = apply(f.sdk);
    assert.equal(first.status, 0, first.stderr);
    const patched = Object.fromEntries(Object.keys(originalPins).map(relative => [relative, readFileSync(join(f.sdk, relative), 'utf8')]));
    for (const [relative, source] of Object.entries(patched)) {
      assert.notEqual(source, f.originals[relative]);
      assert.equal(sha(source), f.manifest[relative].patched_sha256);
    }
    assert.equal(apply(f.sdk).status, 0);
    for (const [relative, source] of Object.entries(patched)) assert.equal(readFileSync(join(f.sdk, relative), 'utf8'), source);
  } finally { rmSync(f.folder, {recursive: true, force: true}); }
});

test('source drift in the second SDK file fails before either file changes, including marker-preserving drift', () => {
  for (const alreadyPatched of [false, true]) {
    const f = fixture();
    try {
      if (alreadyPatched) assert.equal(apply(f.sdk).status, 0);
      const relative = 'PostHog/Replay/PostHogReplayIntegration.swift';
      writeFileSync(join(f.sdk, relative), readFileSync(join(f.sdk, relative), 'utf8') + '\n// unexpected SDK drift\n');
      const before = Object.keys(originalPins).map(path => readFileSync(join(f.sdk, path), 'utf8'));
      const result = apply(f.sdk);
      assert.notEqual(result.status, 0);
      assert.match(result.stderr, /SHA|hash|digest|source/i);
      assert.deepEqual(Object.keys(originalPins).map(path => readFileSync(join(f.sdk, path), 'utf8')), before);
    } finally { rmSync(f.folder, {recursive: true, force: true}); }
  }
});

test('an absent root spec or a PostHog version mismatch fails without source writes', () => {
  for (const [version, name] of [['3.88.3', 'PostHog'], ['3.88.2', 'OtherSDK']]) {
    const f = fixture();
    try {
      const result = apply(f.sdk, version, name);
      assert.notEqual(result.status, 0);
      assert.match(result.stderr, /PostHog|3\.88\.2|version/i);
      for (const [relative, source] of Object.entries(f.originals)) assert.equal(readFileSync(join(f.sdk, relative), 'utf8'), source);
    } finally { rmSync(f.folder, {recursive: true, force: true}); }
  }
});

function swiftMethod(source: string, signature: string) {
  const start = source.indexOf(signature);
  assert.notEqual(start, -1, `patched SDK must define ${signature}`);
  const open = source.indexOf('{', start);
  let depth = 1, end = open + 1;
  for (; end < source.length && depth > 0; end++) {
    if (source[end] === '{') depth++;
    if (source[end] === '}') depth--;
  }
  assert.equal(depth, 0);
  return source.slice(start, end);
}
const swiftCompiler = spawnSync('swiftc', ['--version'], {encoding: 'utf8'});
test('emitted SDK entry points deny before native reads and preserve captures without a hook', {
  skip: swiftCompiler.status === 0 ? false : 'Swift compiler unavailable; portable Ruby/Expo behavioral tests still run',
}, () => {
  const f = fixture();
  try {
    assert.equal(apply(f.sdk).status, 0);
    const source = readFileSync(join(f.sdk, 'PostHog/Replay/PostHogReplayIntegration.swift'), 'utf8');
    const signatures = [
      'private func deriveReplayCaptureAllowed(', 'private func generateSnapshot(',
      'private func collectMaskedRegions(', 'private func collectScreenshotMetadata(',
      'private func renderAndEnqueueScreenshot(', 'private func performBracketedBackgroundCapture(',
    ];
    const methods = signatures.map(signature => swiftMethod(source, signature)).join('\n\n');
    const harness = readFileSync(join(root, 'tests/fixtures/posthog-capture-admission-harness.swift'), 'utf8').replace('// PATCHED_METHODS', methods);
    const path = join(f.folder, 'capture-admission.swift'), executable = join(f.folder, 'capture-admission');
    writeFileSync(path, harness);
    const compiled = spawnSync('swiftc', ['-swift-version', '5', '-module-cache-path', join(f.folder, 'module-cache'), path, '-o', executable], {
      encoding: 'utf8', env: {...process.env, TMPDIR: '/tmp'}, timeout: 60_000,
    });
    assert.equal(compiled.status, 0, compiled.stderr);
    const result = spawnSync(executable, [], {encoding: 'utf8', timeout: 10_000});
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.equal(result.stdout, 'native capture admission checks passed\n');
  } finally { rmSync(f.folder, {recursive: true, force: true}); }
});
