import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import {selfPurchaseApplicationPreimage} from './helpers/self-purchase-application-preimage.mjs';

const applicationPath = new URL('../src/app/Application.tsx',import.meta.url);
// Immutable Root68 block hashes; CI does not require historical Git objects.
const sha = source => createHash('sha256').update(source).digest('hex');
function block(source, begin, end) { return source.slice(source.indexOf(begin), source.indexOf(end, source.indexOf(begin))); }
test('Account and Notifications retain their original witness outside the exact reviewed self-purchase seam', async () => {
  const current = selfPurchaseApplicationPreimage(await readFile(applicationPath, 'utf8'));
  assert.match(current, /createNotificationsEntry/);
  assert.match(current, /createAccountEntry/);
  const route = block(current, 'function ConnectedRoute(', 'function ClientApplication(');
  assert.ok(route.indexOf('route.name === "notifications"') < route.indexOf('<ClientApplication'));
  assert.ok(route.indexOf('route.name === "account"') < route.indexOf('<ClientApplication'));
  assert.equal(sha(block(current, 'function ClientApplication(', 'function AdvisorApplication(')), 'a1d8eb835aa7610b406032a51aec66eb2432d4f0d8b6244c9742b9805e399ce9');
  assert.equal(sha(current.slice(current.indexOf('function AdvisorApplication('))), '1a76eaf81e835efaed1d61901eb09e5bfec46dbe41667033b047ec324d1a949c');
  assert.equal(sha(block(current, 'export function PublicEntry(', 'function ConnectedRoute(')), 'c0250db1ff2220e873c6a24ad846d02ff7d1d824fd4631a8e84a72764f3522b6');
});
test('Account has no clinical authorization, parallel shell, transport or successful facade', async () => {
  const source = await readFile(new URL('../src/app/account-entry.tsx',import.meta.url), 'utf8');
  assert.doesNotMatch(source, /canAdmin|createClientComposition|createClientPorts|createClientPlanController|fetch\(|localStorage|sessionStorage|<ApplicationShell|<PortalShell|\.navigate\(/);
  assert.match(source, /createAccountProfileController/);
  assert.match(source, /createAccountContactController/);
});
