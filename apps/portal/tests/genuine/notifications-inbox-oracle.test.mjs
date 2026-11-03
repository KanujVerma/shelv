import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateNotificationInboxEvidence, observeNotificationInboxMilestone } from './notifications-inbox.browser.mjs';

// Entirely synthetic unit inputs, NEVER producer results or genuine acceptance.
const uuid = n => `10000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const instant = '2026-11-03T08:00:00.000Z';
const later = '2026-11-03T08:00:01.000Z';
const labels = ['baseline', 'after_seen', 'after_replay', 'after_owner_denial', 'after_session_denial', 'after_relogin'];
function syntheticEvidence() {
  const descriptor = { schemaVersion: 1, ownerId: uuid(90), projectId: 'synthetic-unit-only',
    fixtureDirectory: '/synthetic/unit-only', sourceCommit: '0'.repeat(40),
    endpoints: { portal: 'https://127.0.0.1:41001', supabase: 'https://127.0.0.1:41002', mailpit: 'http://127.0.0.1:41003' },
    actors: { a: { id: uuid(1), email: 'a@unit.invalid', initialDisplayName: 'unit A' }, b: { id: uuid(2), email: 'b@unit.invalid', initialDisplayName: 'unit B' } },
    privateDirectory: '/synthetic/unit-only/private', fingerprints: { source: 'SOURCE.json', config: 'CONFIG.json', images: 'IMAGES.json', processes: 'PROCESSES.json', resources: 'RESOURCES.json' } };
  const target = (n, clientId) => ({ clientId, publicationVersion: n, notificationEventId: uuid(n + 10), portalDeliveryId: uuid(n + 20), publicationReceiptId: uuid(n + 30), publishRequestId: uuid(n + 40) });
  const notificationScenario = { schemaVersion: 1, a: target(1, uuid(1)), b: target(2, uuid(2)), privateMarkers: ['UNIT_PRIVATE_SOURCE_CANARY'] };
  const { a, b } = notificationScenario;
  const binding = { ownerId: descriptor.ownerId, projectId: descriptor.projectId, sourceCommit: descriptor.sourceCommit };
  const command = { schemaVersion: 1, action: 'mark_seen_v1', requestId: uuid(70), deliveryId: a.portalDeliveryId, expectedRevision: 0 };
  const receipt = { requestId: command.requestId, action: command.action, deliveryId: a.portalDeliveryId, previousRevision: 0, revision: 1, recordedAt: later, effect: 'seen' };
  const item = (t, seen) => ({ deliveryId: t.portalDeliveryId, revision: seen ? 1 : 0, seenAt: seen ? later : null,
    event: { eventId: t.notificationEventId, createdAt: instant, source: { kind: 'publication', publicationVersion: t.publicationVersion }, destination: { kind: 'plan_version', version: t.publicationVersion } }, email: null });
  const list = (t, seen) => ({ schemaVersion: 1, consistency: 'live_keyset', observedAt: later, cursor: null, items: [item(t, seen)], nextCursor: null });
  const request = (label, actor, cmd, status, body, generation = 1) => ({ label, actorId: actor.clientId, sessionOwnerId: label === 'signedout_denial' ? null : actor.clientId,
    sessionIdentityDigest: label === 'signedout_denial' ? null : String(generation).repeat(64), method: 'POST', url: `${descriptor.endpoints.portal}/api/client/notifications`, origin: descriptor.endpoints.portal,
    csrfPresent: true, authorizationPresent: false, noStore: true, command: cmd, status, body });
  const listCommand = { schemaVersion: 1, action: 'list_inbox_v1', cursor: null, limit: 50 };
  const requests = [request('inbox_a', a, listCommand, 200, list(a, false)), request('seen', a, command, 200, receipt),
    request('refresh', a, listCommand, 200, list(a, true)), request('replay', a, command, 200, receipt),
    request('status', a, { schemaVersion: 1, action: 'request_status_v1', original: command }, 200, { status: 'committed', receipt }),
    request('relogin', a, listCommand, 200, list(a, true), 2), request('inbox_b', b, listCommand, 200, list(b, false)),
    request('owner_denial', b, { ...command, requestId: uuid(71) }, 404, { code: 'not_found' }),
    request('owner_status_denial', b, { schemaVersion: 1, action: 'request_status_v1', original: command }, 404, { code: 'not_found' }),
    request('private_event_denial', b, { schemaVersion: 1, action: 'read_event_deliveries_v1', eventId: a.notificationEventId, cursor: null, limit: 50 }, 403, { code: 'action_forbidden' }),
    request('signedout_denial', b, { ...command, requestId: uuid(72) }, 401, { code: 'session_ended' })];
  const views = ['inbox_a', 'destination', 'refresh', 'relogin', 'inbox_b', 'signedout'].map(label => ({ label,
    url: `${descriptor.endpoints.portal}${label === 'destination' ? `/history/versions/${a.publicationVersion}` : '/notifications'}`,
    ownDeliveryId: label === 'inbox_b' ? b.portalDeliveryId : a.portalDeliveryId,
    href: `/history/versions/${label === 'inbox_b' ? b.publicationVersion : a.publicationVersion}`,
    seen: ['refresh', 'relogin'].includes(label), privateLeak: false, otherOwnerVisible: false,
    historicalVisible: label === 'destination', notificationRows: label === 'signedout' ? 0 : 1 }));
  const canonicalTarget = (t, seen) => ({ ...t, entitled: true,
    publication: { client_id: t.clientId, version: t.publicationVersion, published_at: instant },
    event: { id: t.notificationEventId, client_id: t.clientId, publication_version: t.publicationVersion, kind: 'plan_published', source_kind: 'publication', source_id: null, source_version: null, created_at: instant },
    delivery: { id: t.portalDeliveryId, event_id: t.notificationEventId, recipient_id: t.clientId, channel: 'portal', status: 'queued', revision: seen ? 1 : 0, attempts: 0, seen_at: seen ? later : null, updated_at: seen ? later : instant },
    publicationReceipt: { id: t.publicationReceiptId, client_id: t.clientId, version: t.publicationVersion, event_id: t.notificationEventId, request_id: t.publishRequestId,
      receipt: { requestId: t.publishRequestId, publicationReceiptId: t.publicationReceiptId, publicationVersion: t.publicationVersion, notificationEventId: t.notificationEventId } },
    publicationRequestMatches: true });
  const journal = { actor_id: a.clientId, request_id: command.requestId, command, fingerprintMatches: true, event_id: a.notificationEventId, delivery_id: a.portalDeliveryId, result: receipt, recorded_at: later };
  const canonical = labels.map((label, i) => ({ label, binding, observedAt: i === 0 ? instant : later,
    targets: [canonicalTarget(a, i > 0), canonicalTarget(b, false)],
    protectedState: Object.fromEntries(['cases', 'publications', 'documents', 'entitlements', 'servicePeriods', 'schedule', 'publicationReceipts', 'planRequests', 'events', 'otherDeliveries', 'attempts', 'careHeads'].map(k => [k, 'a'.repeat(64)])),
    journal: i === 0 ? [] : [journal] }));
  const observations = { classification: 'OBSERVATIONS_ONLY', binding, requests, views,
    logouts: [a, b].map(t => ({ actorId: t.clientId, status: 200, url: `${descriptor.endpoints.portal}/api/client/logout`, origin: descriptor.endpoints.portal, csrfPresent: true, authorizationPresent: false })),
    destinationRead: { method: 'POST', url: `${descriptor.endpoints.portal}/api/client/reviews`, origin: descriptor.endpoints.portal, csrfPresent: true, authorizationPresent: false, noStore: true,
      command: { schemaVersion: 1, action: 'read_client_plan_v3', version: a.publicationVersion }, status: 200, schemaVersion: 3, publicationVersion: a.publicationVersion, privateLeak: false } };
  return { descriptor, notificationScenario, observations, canonical };
}
function issue(input, expected) { assert.ok(evaluateNotificationInboxEvidence(input).issues.includes(expected), expected); }

test('unit-only coherent row/head/journal and HTTP observations stay observations only', () => {
  const result = evaluateNotificationInboxEvidence(syntheticEvidence());
  assert.deepEqual(result.issues, []);
  assert.equal(result.classification, 'OBSERVATIONS_ONLY');
  assert.equal(result.acceptance, 'NOT_EVALUATED');
});
test('missing canonical snapshots cannot turn HTTP successes into effects proof', () => {
  const e = syntheticEvidence(); e.canonical = []; issue(e, 'canonical_missing');
});
test('a 400 alone never proves owner denial or no effects', () => {
  const e = syntheticEvidence(); e.observations.requests.find(r => r.label === 'owner_denial').status = 400;
  issue(e, 'owner_denial');
});
test('seen receipt with no persisted revision increment is rejected', () => {
  const e = syntheticEvidence(); e.canonical[1].targets[0].delivery.revision = 0; issue(e, 'seen_effect');
});
test('exact replay cannot increment delivery revision or write a second journal', () => {
  const e = syntheticEvidence(); e.canonical[2].targets[0].delivery.revision++; issue(e, 'replay_effects');
});
test('browser request ID must bind exactly to canonical journal command and result', () => {
  const e = syntheticEvidence(); e.canonical[1].journal[0] = { ...e.canonical[1].journal[0], request_id: uuid(88) }; issue(e, 'journal_binding');
});
test('owner denial must leave canonical rows and journal unchanged', () => {
  const e = syntheticEvidence(); e.canonical[3].targets[1].delivery.seen_at = later; issue(e, 'owner_denial_effects');
});
test('private event-delivery read requires actual client-policy denial and unchanged state', () => {
  const e = syntheticEvidence(); e.observations.requests.find(r => r.label === 'private_event_denial').status = 200; issue(e, 'private_event_denial');
});
test('replay payload cannot differ while retaining the request ID', () => {
  const e = syntheticEvidence(); const r = e.observations.requests.find(x => x.label === 'replay'); r.command = { ...r.command, expectedRevision: 1 }; issue(e, 'replay_effects');
});
test('strict projection also rejects unknown neutral-looking fields', () => {
  const e = syntheticEvidence(); e.observations.requests[0].body.items[0].event.extra = 'neutral'; issue(e, 'private_projection');
});
test('an absent protected digest cannot pass because two missing values match', () => {
  const e = syntheticEvidence(); for (const s of e.canonical) delete s.protectedState.schedule; issue(e, 'canonical_shape');
});
test('ended session denial must leave canonical rows and journal unchanged', () => {
  const e = syntheticEvidence(); e.canonical[4].journal = []; issue(e, 'session_denial_effects');
});
test('publication, service clocks, outbox and care heads must not change', () => {
  const e = syntheticEvidence(); e.canonical[1].protectedState.servicePeriods = 'b'.repeat(64); issue(e, 'protected_state');
});
test('actual M04 publication, entitlement and receipt relationships are mandatory', () => {
  const e = syntheticEvidence(); e.canonical[0].targets[0].event.source_kind = 'care'; issue(e, 'publication_relationship');
});
test('a client B positive list cannot contain A delivery even with a neutral title', () => {
  const e = syntheticEvidence(); e.observations.requests.find(r => r.label === 'inbox_b').body.items.push(e.observations.requests[0].body.items[0]); issue(e, 'inbox_ownership');
});
test('strict projection rejects raw private data and unknown fields', () => {
  const e = syntheticEvidence(); e.observations.requests[0].body.items[0].event.privateNote = 'UNIT_PRIVATE_SOURCE_CANARY'; issue(e, 'private_projection');
});
test('same origin and CSRF are required and Authorization is prohibited', () => {
  for (const patch of [{ origin: 'https://evil.invalid' }, { csrfPresent: false }, { authorizationPresent: true }, { noStore: false }, { url: 'https://evil.invalid/api/client/notifications' }]) {
    const e = syntheticEvidence(); Object.assign(e.observations.requests[0], patch); issue(e, 'http_boundary');
  }
});
test('historical destination is bound to real publication version, not a URL alone', () => {
  const e = syntheticEvidence(); e.observations.views.find(v => v.label === 'destination').historicalVisible = false; issue(e, 'safe_destination');
});
test('historical destination requires actual V3 HTTP read with the captured version', () => {
  const e = syntheticEvidence(); e.observations.destinationRead.status = 503; issue(e, 'destination_http');
});
test('duplicate notification rows cannot establish an own inbox observation', () => {
  const e = syntheticEvidence(); e.observations.requests[0].body.items.push(e.observations.requests[0].body.items[0]); issue(e, 'inbox_order');
});
test('relogin must return actual A owner with a different session cookie digest and seen state', () => {
  const e = syntheticEvidence(); e.observations.requests.find(r => r.label === 'relogin').sessionIdentityDigest = '1'.repeat(64); issue(e, 'relogin_persistence');
});
test('logout must clear notification rows and private markers', () => {
  const e = syntheticEvidence(); e.observations.views.find(v => v.label === 'signedout').notificationRows = 1; issue(e, 'signedout_private_ui');
});
test('ordinary relogin requires actual successful UI-triggered logout HTTP observations', () => {
  const e = syntheticEvidence(); e.observations.logouts = []; issue(e, 'ordinary_logout');
});
test('descriptor source/resource mismatch cannot be promoted to evidence', () => {
  const e = syntheticEvidence(); e.observations.binding = { ...e.observations.binding, sourceCommit: 'f'.repeat(40) }; issue(e, 'binding');
});
test('invalid loopback descriptor and absent producer scenario reject before browser work', () => {
  for (const mutate of [e => { e.descriptor.endpoints.portal = 'https://example.invalid'; }, e => { e.notificationScenario.a = null; }, e => { e.notificationScenario.a.clientId = e.notificationScenario.b.clientId; }]) {
    const e = syntheticEvidence(); mutate(e); assert.throws(() => evaluateNotificationInboxEvidence(e), /notification input/);
  }
});
test('browser observer refuses absent caller-owned helpers before any page use', async () => {
  const e = syntheticEvidence();
  const page = new Proxy({}, { get() { assert.fail('page must remain untouched'); } });
  await assert.rejects(observeNotificationInboxMilestone({ ...e, page }), /caller-owned/);
});
test('canonical capture errors refuse the phase before any browser activity', async () => {
  const e = syntheticEvidence();
  const page = new Proxy({}, { get() { assert.fail('page must remain untouched'); } });
  await assert.rejects(observeNotificationInboxMilestone({ ...e, page, relogin: async () => assert.fail('no login'),
    captureCanonical: async label => ({ observations: { label }, errors: ['unit unavailable'] }) }), /canonical capture/);
});

test('A original replay cannot be acknowledged under the B actor/session identity',()=>{
 const e=syntheticEvidence(),r=e.observations.requests.find(r=>r.label==='replay');r.actorId=e.notificationScenario.b.clientId;r.sessionOwnerId=e.notificationScenario.b.clientId;r.sessionIdentityDigest='b'.repeat(64);issue(e,'replay_effects');
});
test('A original status cannot be acknowledged under the B actor/session identity',()=>{
 const e=syntheticEvidence(),r=e.observations.requests.find(r=>r.label==='status');r.actorId=e.notificationScenario.b.clientId;r.sessionOwnerId=e.notificationScenario.b.clientId;r.sessionIdentityDigest='b'.repeat(64);issue(e,'status_binding');
});

for(const label of ['owner_denial','owner_status_denial','private_event_denial'])for(const dimension of ['actorId','sessionOwnerId','sessionIdentityDigest'])test(`B ${label} refuses mismatched ${dimension}`,()=>{
 const e=syntheticEvidence(),r=e.observations.requests.find(r=>r.label===label);
 r[dimension]=dimension==='sessionIdentityDigest'?'b'.repeat(64):e.notificationScenario.a.clientId;
 issue(e,label==='private_event_denial'?'private_event_denial':'owner_denial');
});

for(const [name,mutate]of [
 ['wrong action',c=>c.action='list_inbox_v1'],
 ['wrong schema',c=>c.schemaVersion=2],
 ['extra selector',c=>c.clientId='10000000-0000-4000-8000-000000000001'],
 ['missing action',c=>delete c.action]
])test(`B denied status requires the exact status envelope: ${name}`,()=>{
 const e=syntheticEvidence(),r=e.observations.requests.find(r=>r.label==='owner_status_denial');mutate(r.command);issue(e,'owner_denial');
});
