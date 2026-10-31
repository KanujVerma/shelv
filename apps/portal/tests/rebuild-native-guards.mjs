import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {localPolicy, providerTarget, portalOrigin, providerOrigin} from '../scripts/rebuild-native-boundary.mjs';

// Run explicitly. This file is intentionally outside *.test.mjs automatic globs.
assert.equal(process.env.SHELV_REBUILD_NATIVE_GUARDS, '1', 'Explicit guard-test opt-in required');

test('test bundle changes exactly the two pinned origins and refuses unreviewed source', async () => {
  const source = await readFile(new URL('../session-integration/runtime/server/policy.ts', import.meta.url), 'utf8');
  const output = localPolicy(source);
  assert.ok(output.includes(`export const PORTAL_ORIGIN = '${portalOrigin}';`));
  assert.ok(output.includes(`export const SUPABASE_ORIGIN = '${providerOrigin}';`));
  assert.equal(output.replace(portalOrigin, 'https://portal.goshelv.com').replace(providerOrigin, 'https://snojlbqovlawewwqbviz.supabase.co'), source);
  assert.throws(() => localPolicy(source + '\n// unexpected source'), /source hash/);
});

test('provider routing denies external, ambiguous and unlisted destinations before fetch', () => {
  for (const raw of [
    'https://snojlbqovlawewwqbviz.supabase.co/auth/v1/user',
    'http://localhost:57421/auth/v1/user',
    'http://127.0.0.1:57422/auth/v1/user',
    'http://user@127.0.0.1:57421/auth/v1/user',
    providerOrigin + '/rest/v1/rpc/arbitrary',
    providerOrigin + '/auth/v1/admin/users',
    providerOrigin + '/auth/v1/user?redirect_to=https://external.invalid',
    providerOrigin + '/functions/v1/concierge-admission',
    providerOrigin + '/functions/v1/concierge-plans?url=http://external.invalid',
  ]) assert.throws(() => providerTarget(raw), /provider boundary/);
  assert.equal(providerTarget(providerOrigin + '/auth/v1/token?grant_type=pkce'), providerOrigin + '/auth/v1/token?grant_type=pkce');
  assert.equal(providerTarget(providerOrigin + '/rest/v1/rpc/concierge_advisor_session_context'), providerOrigin + '/rest/v1/rpc/concierge_advisor_session_context');
  assert.equal(providerTarget(providerOrigin + '/functions/v1/concierge-plans'), 'http://127.0.0.1:57440/');
});
