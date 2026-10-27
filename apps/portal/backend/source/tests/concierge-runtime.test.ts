import assert from 'node:assert/strict';
import test from 'node:test';
import { createConciergeAuthenticatedPorts, createConciergeSupabasePorts } from '../supabase/functions/concierge-operations/runtime.ts';
import { clientFixture, ownerId, recommendation } from './fixtures/concierge.ts';
import { mapConciergeClientView } from '../src/contracts/ConciergePortalMapping.ts';

test('Auth verification and RPC use the same bearer, a public API key, fixed paths and no cookies or redirects', async () => {
  const calls: { url: string; init: RequestInit }[] = [];
  const p = createConciergeSupabasePorts({ supabaseUrl: 'https://staging.invalid/', publicKey: 'synthetic-public-key', allowedOrigins: [],
    fetch: async (input, init) => { calls.push({ url: String(input), init: init! }); return Response.json(calls.length === 1
      ? { id: ownerId, is_anonymous: false, user_metadata: { role: 'advisor' }, app_metadata: { role: 'operator' } }
      : { revision: 0 }); } });
  assert.deepEqual(await p.authenticate('user-bearer'), { id: ownerId, is_anonymous: false });
  await p.rpc('user-bearer', { name: 'concierge_client_view', args: {} });
  assert.deepEqual(calls.map(c => c.url), ['https://staging.invalid/auth/v1/user', 'https://staging.invalid/rest/v1/rpc/concierge_client_view']);
  for (const c of calls) {
    const headers = new Headers(c.init.headers);
    assert.equal(headers.get('authorization'), 'Bearer user-bearer'); assert.equal(headers.get('apikey'), 'synthetic-public-key');
    assert.equal(c.init.credentials, 'omit'); assert.equal(c.init.redirect, 'error'); assert.equal(c.init.cache, 'no-store');
  }
  assert.equal(calls[0].init.method, 'GET'); assert.equal(calls[1].init.method, 'POST'); assert.equal(calls[1].init.body, '{}');
});

test('Auth rejection, malformed identity and upstream failure remain distinct', async () => {
  for (const status of [401, 403]) {
    const p = createConciergeSupabasePorts({ supabaseUrl: 'https://staging.invalid', publicKey: 'public', allowedOrigins: [], fetch: async () => new Response('PRIVATE_CANARY', { status }) });
    assert.equal(await p.authenticate('revoked'), null);
  }
  for (const response of [Response.json({ id: ownerId }), Response.json({ id: 'bad', is_anonymous: false }), new Response('PRIVATE_CANARY', { status: 500 })]) {
    const p = createConciergeSupabasePorts({ supabaseUrl: 'https://staging.invalid', publicKey: 'public', allowedOrigins: [], fetch: async () => response });
    await assert.rejects(p.authenticate('token'), /unavailable/);
  }
});

test('RPC preserves status for expired/forbidden requests and never retries uncertain mutations', async () => {
  for (const status of [401, 403, 409]) {
    const p = createConciergeSupabasePorts({ supabaseUrl: 'https://staging.invalid', publicKey: 'public', allowedOrigins: [], fetch: async () => Response.json({ message: 'concierge_revision_conflict', details: 'PRIVATE_CANARY' }, { status }) });
    assert.deepEqual(await p.rpc('token', { name: 'concierge_client_view', args: {} }), { data: null, error: { status, message: 'concierge_revision_conflict' } });
  }
  let calls = 0;
  const p = createConciergeSupabasePorts({ supabaseUrl: 'https://staging.invalid', publicKey: 'public', allowedOrigins: [], fetch: async () => { calls++; throw Error('PRIVATE_CANARY'); } });
  await assert.rejects(p.rpc('token', { name: 'concierge_client_view', args: {} })); assert.equal(calls, 1);
});

test('unsafe server URLs, wildcard origins, absent keys and oversized responses fail closed', async () => {
  for (const url of ['http://staging.invalid', 'https://name:pass@staging.invalid', 'https://staging.invalid/path', 'https://staging.invalid?key=x']) {
    assert.throws(() => createConciergeSupabasePorts({ supabaseUrl: url, publicKey: 'public', allowedOrigins: [] }), /unavailable/);
  }
  assert.throws(() => createConciergeSupabasePorts({ supabaseUrl: 'https://staging.invalid', publicKey: '', allowedOrigins: [] }), /unavailable/);
  assert.throws(() => createConciergeSupabasePorts({ supabaseUrl: 'https://staging.invalid', publicKey: 'public', allowedOrigins: ['*'] }), /unavailable/);
  const p = createConciergeSupabasePorts({ supabaseUrl: 'https://staging.invalid', publicKey: 'public', allowedOrigins: [], fetch: async () => new Response('x'.repeat(2097153)) });
  await assert.rejects(p.authenticate('token'), /unavailable/);
});

test('full valid publication history is preserved beyond the bounded Auth/error response size', async () => {
  const wire = clientFixture(); wire.plan!.version = 601;
  wire.history = Array.from({ length: 600 }, (_, i) => ({ version: i + 1, recommendations: [{ ...recommendation, rationale: 'x'.repeat(4000) }] }));
  assert.ok(JSON.stringify(wire).length > 2097152);
  const p = createConciergeSupabasePorts({ supabaseUrl: 'https://staging.invalid', publicKey: 'public', allowedOrigins: [], fetch: async () => Response.json(wire) });
  const result = await p.rpc('token', { name: 'concierge_client_view', args: {} });
  assert.equal(result.error, null);
  assert.deepEqual(mapConciergeClientView(result.data), wire);
});

test('feature ports share bearer verification but can invoke only their configured RPC names', async () => {
  type FeatureCall = { name: 'concierge_checkin_read' | 'concierge_checkin_write'; args: { p_client_id: string } };
  const allowed: FeatureCall['name'][] = ['concierge_checkin_read'];
  const seen: string[] = [];
  const p = createConciergeAuthenticatedPorts<FeatureCall>({ supabaseUrl: 'https://staging.invalid', publicKey: 'public', allowedOrigins: [], allowedRpcNames: allowed,
    fetch: async (url, init) => { assert.equal(new Headers(init!.headers).get('authorization'), 'Bearer user'); seen.push(String(url));
      return Response.json(String(url).endsWith('/user') ? { id: ownerId, is_anonymous: false } : { revision: 1 }); } });
  assert.deepEqual(await p.authenticate('user'), { id: ownerId, is_anonymous: false });
  assert.deepEqual(await p.rpc('user', { name: 'concierge_checkin_read', args: { p_client_id: ownerId } }), { data: { revision: 1 }, error: null });
  allowed.push('concierge_checkin_write');
  await assert.rejects(p.rpc('user', { name: 'concierge_checkin_write', args: { p_client_id: ownerId } }), /unavailable/);
  assert.deepEqual(seen, ['https://staging.invalid/auth/v1/user', 'https://staging.invalid/rest/v1/rpc/concierge_checkin_read']);
});
