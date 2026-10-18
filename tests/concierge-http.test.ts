import assert from 'node:assert/strict';
import { createServer, type IncomingMessage } from 'node:http';
import { once } from 'node:events';
import test from 'node:test';
import { handleConciergeRequest } from '../supabase/functions/concierge-operations/handler.ts';
import { createConciergeSupabasePorts } from '../supabase/functions/concierge-operations/runtime.ts';
import { clientFixture, ownerId, requestId } from './fixtures/concierge.ts';

type Exchange = { path: string; method: string; body?: unknown; status?: number; response: unknown };
async function textBody(request: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString('utf8');
}
async function fixtureServer(exchanges: Exchange[], run: (edgeUrl: string) => Promise<void>) {
  let base = '', completed = 0;
  const failures: unknown[] = [];
  const nativeFetch = globalThis.fetch;
  const ports = createConciergeSupabasePorts({ supabaseUrl: 'https://synthetic-supabase.invalid', publicKey: 'synthetic-public-key', allowedOrigins: ['https://portal.invalid'],
    fetch: (input, init) => {
      const url = new URL(String(input));
      assert.equal(url.origin, 'https://synthetic-supabase.invalid');
      return nativeFetch(`${base}${url.pathname}`, init);
    } });
  const server = createServer((incoming, outgoing) => {
    void (async () => {
      const body = await textBody(incoming);
      if (incoming.url === '/edge') {
        const request = new Request('https://edge.invalid/concierge', { method: incoming.method, headers: incoming.headers as Record<string, string>, body });
        const result = await handleConciergeRequest(request, ports);
        outgoing.writeHead(result.status, Object.fromEntries(result.headers)); outgoing.end(await result.text()); return;
      }
      const expected = exchanges[completed++];
      assert.ok(expected, 'Unexpected extra upstream call (including an automatic retry)');
      assert.equal(incoming.url, expected.path); assert.equal(incoming.method, expected.method);
      assert.equal(incoming.headers.authorization, 'Bearer synthetic-user-token');
      assert.equal(incoming.headers.apikey, 'synthetic-public-key'); assert.equal(incoming.headers.cookie, undefined);
      if (expected.body !== undefined) assert.deepEqual(JSON.parse(body), expected.body);
      outgoing.writeHead(expected.status ?? 200, { 'content-type': 'application/json' }); outgoing.end(JSON.stringify(expected.response));
    })().catch(cause => { failures.push(cause); outgoing.writeHead(500); outgoing.end('Synthetic fixture failure'); });
  });
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const address = server.address(); assert.ok(address && typeof address !== 'string'); base = `http://127.0.0.1:${address.port}`;
  try { await run(`${base}/edge`); assert.deepEqual(failures, []); assert.equal(completed, exchanges.length); }
  finally { server.closeAllConnections(); await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())); }
}
const auth = (): Exchange => ({ path: '/auth/v1/user', method: 'GET', response: { id: ownerId, is_anonymous: false, user_metadata: { role: 'advisor' } } });
const read = (response: unknown): Exchange => ({ path: '/rest/v1/rpc/concierge_client_view', method: 'POST', body: {}, response });
function post(url: string, body: unknown) {
  return fetch(url, { method: 'POST', headers: { authorization: 'Bearer synthetic-user-token', 'content-type': 'application/json', origin: 'https://portal.invalid' }, body: JSON.stringify(body) });
}

test('offline HTTP contract: read → receive → exact retry → read → explicit start → read', async () => {
  const received = clientFixture(); received.revision = 5; received.plan!.itemStates[0].received = true;
  received.orderProposal.items = []; received.orderProposal.subtotalCents = 0;
  const started = structuredClone(received); started.revision = 6; started.plan!.itemStates[0].startedOn = '2026-10-01';
  started.routine = [{ slot: 'moisturizer', productId: 'replacement' }];
  started.routineHistory = [{ version: 2, recommendationId: 'moisturizer-v2', slot: 'moisturizer', productId: 'replacement', startedOn: '2026-10-01' }];
  const receiveBody = { p_client_id: ownerId, p_action: 'receive', p_expected_revision: 4, p_request_id: requestId, p_payload: { version: 2, recommendationId: 'moisturizer-v2' } };
  const receipt = { revision: 5, publishedVersion: 2, operation: 'receive' };
  const startRequestId = '00000000-0000-4000-8000-000000000004';
  const receiveExchange: Exchange = { path: '/rest/v1/rpc/concierge_write', method: 'POST', body: receiveBody, response: receipt };
  await fixtureServer([
    auth(), read({ ...clientFixture(), draft: { advisorNote: 'PRIVATE_CANARY' } }),
    auth(), receiveExchange, auth(), receiveExchange, auth(), read(received),
    auth(), { path: '/rest/v1/rpc/concierge_write', method: 'POST', body: { p_client_id: ownerId, p_action: 'start', p_expected_revision: 5, p_request_id: startRequestId, p_payload: { version: 2, recommendationId: 'moisturizer-v2', startedOn: '2026-10-01' } }, response: { revision: 6, publishedVersion: 2, operation: 'start' } },
    auth(), read(started),
  ], async url => {
    const initial = await post(url, { action: 'client_read' }); assert.equal(initial.status, 200); assert.deepEqual(await initial.json(), clientFixture());
    for (let i = 0; i < 2; i++) {
      const result = await post(url, { action: 'receive', requestId, expectedRevision: 4, version: 2, recommendationId: 'moisturizer-v2' });
      assert.equal(result.status, 200); assert.deepEqual(await result.json(), receipt);
    }
    const beforeStart = await post(url, { action: 'client_read' }); assert.deepEqual(await beforeStart.json(), received);
    const result = await post(url, { action: 'start', requestId: startRequestId, expectedRevision: 5, version: 2, recommendationId: 'moisturizer-v2', startedOn: '2026-10-01' }); assert.equal(result.status, 200);
    const afterStart = await post(url, { action: 'client_read' }); assert.deepEqual(await afterStart.json(), started);
  });
});

test('offline HTTP contract: rejected session, stale revision and SQL authorization remain failures', async () => {
  await fixtureServer([
    { ...auth(), status: 401, response: { msg: 'Session rejected', private: 'PRIVATE_CANARY' } },
    auth(), { path: '/rest/v1/rpc/concierge_write', method: 'POST', body: { p_client_id: ownerId, p_action: 'receive', p_expected_revision: 1, p_request_id: requestId, p_payload: { version: 2, recommendationId: 'moisturizer-v2' } }, status: 400, response: { code: 'P0001', message: 'concierge_revision_conflict', details: 'PRIVATE_CANARY' } },
    auth(), { path: '/rest/v1/rpc/concierge_advisor_view', method: 'POST', body: { p_client_id: ownerId }, status: 400, response: { code: 'P0001', message: 'concierge_forbidden', details: 'PRIVATE_CANARY' } },
  ], async url => {
    const rejected = await post(url, { action: 'client_read' }); assert.equal(rejected.status, 401); assert.deepEqual(await rejected.json(), { code: 'unauthorized' });
    const stale = await post(url, { action: 'receive', requestId, expectedRevision: 1, version: 2, recommendationId: 'moisturizer-v2' }); assert.equal(stale.status, 409); assert.deepEqual(await stale.json(), { code: 'concierge_revision_conflict' });
    const advisor = await post(url, { action: 'advisor_read', clientId: ownerId }); assert.equal(advisor.status, 403); assert.deepEqual(await advisor.json(), { code: 'concierge_forbidden' });
  });
});
