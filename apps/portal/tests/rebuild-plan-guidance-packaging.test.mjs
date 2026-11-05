// Pure harness packaging checks. No browser entry is executed and no Chrome is opened.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, mkdir, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {runInNewContext} from 'node:vm';
import {spawnSync} from 'node:child_process';
import ts from 'typescript';
import {prepareGuidanceBrowserSource} from './rebuild-plan-guidance-browser.mjs';

const portal = fileURLToPath(new URL('../', import.meta.url));
const root = fileURLToPath(new URL('../../../', import.meta.url));
const artifacts = new URL('../../../.local-artifacts/portal-rebuild/w3-v3-packaging-source/', import.meta.url);
const required = ['setCallbackEnabled', 'replaceReviewSource', 'replaceViewCallback', 'rerender'];

async function withSelectors(values, run) {
  const keys = ['W3_GUIDANCE_CONTEXT_BROWSER_ENTRY', 'W3_GUIDANCE_BROWSER_CONTEXT_BASELINE', 'W3_GUIDANCE_BROWSER_OLD_COOKIE'];
  const previous = keys.map(key => [key, process.env[key]]);
  try {
    for (const key of keys) {
      if (values[key] === undefined) delete process.env[key];
      else process.env[key] = values[key];
    }
    return await run();
  } finally {
    for (const [key, value] of previous) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

// Execute only the file's actual setup wrapper to capture its build options.
// The browser boundary is observed, never invoked. Hooks and all DOM code stay unrun.
async function callerOptions(name) {
  const text = await readFile(new URL(name, import.meta.url), 'utf8');
  const ast = ts.createSourceFile(name, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  const setup = ast.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === 'setupBrowser');
  if (!setup) return {}; // Pre-fix residual file directly used the default helper.
  const call = runInNewContext('(' + setup.getText(ast) + ')', {
    setupBaseBrowser: async (_t, _server, options) => options,
  });
  return call({after() {}}, undefined, undefined);
}

function assignedHarnessMethods(files) {
  const bytes = files.get('rebuild-plan-guidance-browser-entry.js');
  assert.ok(bytes, 'real browser entry must compile');
  const ast = ts.createSourceFile('entry.js', bytes.toString(), ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  const names = new Set();
  function visit(node) {
    if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
        ts.isPropertyAccessExpression(node.left) && ts.isIdentifier(node.left.expression) &&
        node.left.expression.text === 'harness') names.add(node.left.name.text);
    ts.forEachChild(node, visit);
  }
  visit(ast);
  return names;
}

for (const file of ['rebuild-plan-guidance-context-browser.test.mjs', 'rebuild-plan-guidance-residual-browser.test.mjs']) {
  test(file + ' selects its required real context entry without an external flag', async () => {
    await withSelectors({}, async () => {
      const options = await callerOptions(file);
      const methods = assignedHarnessMethods(await prepareGuidanceBrowserSource(options));
      for (const method of required) assert.ok(methods.has(method), file + ' is missing actual ' + method);
    });
  });
}

test('explicit bounded entry selection preserves the legacy environment default and source sensitivity inputs', async () => {
  await withSelectors({}, async () => {
    const ordinary = await prepareGuidanceBrowserSource();
    assert.equal(assignedHarnessMethods(ordinary).has('setCallbackEnabled'), false);
    const context = await prepareGuidanceBrowserSource({entry: 'context'});
    assert.ok(assignedHarnessMethods(context).has('setCallbackEnabled'));
    await withSelectors({W3_GUIDANCE_CONTEXT_BROWSER_ENTRY: '1'}, async () => {
      assert.deepEqual(await prepareGuidanceBrowserSource(), context);
      assert.deepEqual(await prepareGuidanceBrowserSource({entry: 'default'}), ordinary);
    });
    for (const selector of ['W3_GUIDANCE_BROWSER_CONTEXT_BASELINE', 'W3_GUIDANCE_BROWSER_OLD_COOKIE']) {
      await withSelectors({[selector]: '1'}, async () => {
        const old = await prepareGuidanceBrowserSource({entry: 'context'});
        assert.ok(assignedHarnessMethods(old).has('setCallbackEnabled'));
        assert.notDeepEqual(old, context, selector + ' must still substitute its actual historical inputs');
      });
    }
    await assert.rejects(prepareGuidanceBrowserSource({entry: '../unowned-entry.tsx'}), /entry/);
  });
});

for (const [name, cwd, input] of [
  ['repo-root', root, 'apps/portal/tests/rebuild-plan-guidance-residual-source.test.mjs'],
  ['portal', portal, 'tests/rebuild-plan-guidance-residual-source.test.mjs'],
]) {
  test('actual residual source assertions compile and pass from ' + name + ' cwd', async () => {
    const env = {...process.env};
    // A separate Node test runner must not inherit the parent's private child IPC mode.
    delete env.NODE_TEST_CONTEXT;
    const result = spawnSync(process.execPath, ['--experimental-strip-types', '--test', '--test-concurrency=1', input], {
      cwd, env, encoding: 'utf8', maxBuffer: 5_000_000,
    });
    await mkdir(artifacts, {recursive: true});
    await writeFile(new URL('packaging-child-' + name + '.log', artifacts), result.stdout + result.stderr);
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.match(result.stdout, /# pass 25\b/);
    assert.match(result.stdout, /# fail 0\b/);
    assert.match(result.stdout, /# skipped 0\b/);
  });
}
