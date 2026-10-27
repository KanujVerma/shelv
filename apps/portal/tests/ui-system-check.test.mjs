import test from 'node:test';
import assert from 'node:assert/strict';

const load = async () => {try {return await import('../scripts/check-ui-system.mjs');} catch {return {};}};

test('UI system guard permits known legacy values but rejects new literal color drift', async () => {
  const {checkStyles} = await load();
  assert.equal(typeof checkStyles, 'function', 'The UI consistency guard must be executable');
  assert.deepEqual(checkStyles({'client.css': '.row{color:#123456}'}, {'client.css': {'#123456': 1}}), []);
  const findings = checkStyles({'client.css': '.row{color:#123456}.other{color:#654321}'}, {'client.css': {'#123456': 1}});
  assert.ok(findings.some(finding => finding.file === 'client.css' && finding.value === '#654321'));
});

test('UI system guard rejects growing a grandfathered literal and new untracked stylesheets', async () => {
  const {checkStyles} = await load();
  assert.equal(typeof checkStyles, 'function');
  assert.equal(checkStyles({'client.css': '.a{color:#123456}.b{color:#123456}'}, {'client.css': {'#123456': 1}}).length, 1);
  assert.equal(checkStyles({'new.css': '.button{background:rgb(1 2 3)}'}, {}).length, 1);
});

test('UI system guard allows palette values only inside the canonical token root', async () => {
  const {checkStyles} = await load();
  assert.equal(typeof checkStyles, 'function');
  assert.deepEqual(checkStyles({'ui/system.css': ':root{--color-text:#171a18}.a{color:var(--color-text)}'}, {}), []);
  assert.equal(checkStyles({'ui/system.css': ':root{--color-text:#171a18}.a{color:#171a18}'}, {}).length, 1);
});
