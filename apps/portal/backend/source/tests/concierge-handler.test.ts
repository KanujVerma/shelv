import assert from 'node:assert/strict';
import test from 'node:test';
import { handleConciergeRequest, type ConciergePorts } from '../supabase/functions/concierge-operations/handler.ts';
import { clientFixture, otherId, ownerId, requestId } from './fixtures/concierge.ts';

const origin = 'https://portal.invalid';
function request(body: unknown = { action: 'client_read' }, token = 'verified'): Request {
  return new Request('https://function.invalid', { method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json', origin }, body: JSON.stringify(body) });
}
function ports(overrides: Partial<ConciergePorts> = {}): ConciergePorts {
  return { allowedOrigins: [origin], authenticate: async token => token === 'verified' ? { id: ownerId, is_anonymous: false } : null,
    rpc: async () => ({ data: clientFixture(), error: null }), ...overrides };
}

test('verified client reads receive only the public projection with private no-store responses', async () => {
  const r = await handleConciergeRequest(request(), ports({ rpc: async () => ({ data: { ...clientFixture(), draft: { advisorNote: 'PRIVATE_CANARY' } }, error: null }) }));
  assert.equal(r.status, 200);
  assert.deepEqual(await r.json(), clientFixture());
  assert.match(r.headers.get('cache-control')!, /private, no-store/);
  assert.equal(r.headers.get('access-control-allow-origin'), origin);
  assert.equal(r.headers.get('vary'), 'Origin');
});

test('missing, invalid and newly revoked sessions cannot reach an RPC; identities are never cached', async () => {
  let valid = true, authCalls = 0, rpcCalls = 0;
  const p = ports({ authenticate: async token => { authCalls++; return valid && token === 'verified' ? { id: ownerId, is_anonymous: false } : null; },
    rpc: async () => { rpcCalls++; return { data: clientFixture(), error: null }; } });
  assert.equal((await handleConciergeRequest(request(), p)).status, 200);
  valid = false;
  for (const token of ['verified', 'forged']) assert.equal((await handleConciergeRequest(request(), p)).status, 401);
  const missing = request(); missing.headers.delete('authorization');
  assert.equal((await handleConciergeRequest(missing, p)).status, 401);
  assert.equal(authCalls, 3); assert.equal(rpcCalls, 1);
});

test('anonymous users and malformed verified identities cannot reach persistence', async () => {
  for (const [user, status] of [[{ id: ownerId, is_anonymous: true }, 403], [{ id: 'invalid', is_anonymous: false }, 401]] as const) {
    const r = await handleConciergeRequest(request(), ports({ authenticate: async () => user, rpc: async () => { assert.fail('Unexpected persistence call'); } }));
    assert.equal(r.status, status);
  }
});

test('SQL denies advisor access and revoked advisor replay even with a valid permanent bearer', async () => {
  const r = await handleConciergeRequest(request({ action: 'advisor_read', clientId: otherId }), ports({ rpc: async (_token, call) => {
    assert.deepEqual(call, { name: 'concierge_advisor_view', args: { p_client_id: otherId } });
    return { data: { draft: { advisorNote: 'PRIVATE_CANARY' } }, error: { message: 'concierge_forbidden' } };
  } }));
  assert.equal(r.status, 403); assert.deepEqual(await r.json(), { code: 'concierge_forbidden' });
});

test('stale revisions and changed request identity remain conflicts without automatic retry', async () => {
  for (const code of ['concierge_revision_conflict', 'concierge_request_conflict', 'concierge_publication_conflict', 'concierge_product_not_received']) {
    let calls = 0;
    const r = await handleConciergeRequest(request({ action: 'start', requestId, expectedRevision: 4, version: 2, recommendationId: 'moisturizer-v2', startedOn: '2026-10-01' }), ports({ rpc: async () => { calls++; return { data: null, error: { message: code } }; } }));
    assert.equal(r.status, 409); assert.deepEqual(await r.json(), { code }); assert.equal(calls, 1);
  }
});

test('receive and start remain distinct commands and retries preserve all RPC arguments', async () => {
  const observed: unknown[] = [];
  const p = ports({ rpc: async (token, call) => {
    assert.equal(token, 'verified'); observed.push(call);
    assert.equal(call.name, 'concierge_write');
    if (call.name !== 'concierge_write') throw Error('wrong RPC');
    return { data: { revision: 5, publishedVersion: 2, operation: call.args.p_action, draft: 'PRIVATE_CANARY' }, error: null };
  } });
  const receive = { action: 'receive', requestId, expectedRevision: 4, version: 2, recommendationId: 'moisturizer-v2' };
  for (let i = 0; i < 2; i++) {
    const r = await handleConciergeRequest(request(receive), p);
    assert.equal(r.status, 200); assert.deepEqual(await r.json(), { revision: 5, publishedVersion: 2, operation: 'receive' });
  }
  assert.deepEqual(observed[0], observed[1]);
  assert.deepEqual(observed[0], { name: 'concierge_write', args: { p_client_id: ownerId, p_action: 'receive', p_expected_revision: 4, p_request_id: requestId, p_payload: { version: 2, recommendationId: 'moisturizer-v2' } } });
  assert.equal((await handleConciergeRequest(request({ ...receive, action: 'start', requestId: '00000000-0000-4000-8000-000000000004', startedOn: '2026-10-01' }), p)).status, 200);
  assert.equal(observed.length, 3);
});

test('errors and malformed upstream data never expose backend details or private fields', async () => {
  for (const result of [
    { data: null, error: { message: 'PRIVATE_CANARY statement detail' } },
    { data: { ...clientFixture(), revision: 'PRIVATE_CANARY' }, error: null },
  ]) {
    const r = await handleConciergeRequest(request(), ports({ rpc: async () => result }));
    assert.equal(r.status, 503); assert.deepEqual(await r.json(), { code: 'unavailable' });
  }
  for (const status of [401, 403]) {
    const r = await handleConciergeRequest(request(), ports({ rpc: async () => ({ data: null, error: { status, message: 'PRIVATE_CANARY' } }) }));
    assert.equal(r.status, status); assert.doesNotMatch(await r.text(), /PRIVATE_CANARY/);
  }
});

test('origin, method, content type, streaming size and malformed JSON fail before persistence', async () => {
  const p = ports({ rpc: async () => { assert.fail('Unexpected persistence call'); } });
  const preflight = new Request('https://function.invalid', { method: 'OPTIONS', headers: { origin } });
  assert.equal((await handleConciergeRequest(preflight, p)).status, 204);
  const denied = request(); denied.headers.set('origin', 'https://other.invalid');
  assert.equal((await handleConciergeRequest(denied, p)).status, 403);
  assert.equal((await handleConciergeRequest(new Request('https://function.invalid'), p)).status, 405);
  const wrongType = request(); wrongType.headers.set('content-type', 'text/plain');
  assert.equal((await handleConciergeRequest(wrongType, p)).status, 415);
  assert.equal((await handleConciergeRequest(request({ action: 'client_read', padding: 'x'.repeat(100001) }), p)).status, 413);
  const malformed = new Request('https://function.invalid', { method: 'POST', headers: request().headers, body: '{' });
  assert.equal((await handleConciergeRequest(malformed, p)).status, 400);
  assert.equal((await handleConciergeRequest(request({ action: 'client_read', role: 'advisor' }), p)).status, 400);
});
