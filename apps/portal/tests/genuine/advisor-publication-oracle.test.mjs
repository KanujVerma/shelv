import assert from 'node:assert/strict';
import { test } from 'node:test';
import { assertPublicationOracle, runModule } from './advisor-publication.browser.mjs';

// Hand-built SYNTHETIC observations exercise the oracle, never Auth/SQL/browser
// acceptance. No fixture, producer response, session, or authority is created.
const id = n => `10000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const at = '2026-11-03T12:00:00.000Z';
function example() {
  const descriptor = {
    schemaVersion: 1, ownerId: id(1), projectId: 'synthetic-m04-unit',
    fixtureDirectory: '/tmp/synthetic-m04-unit', privateDirectory: '/tmp/synthetic-m04-unit/private',
    sourceCommit: '004c7a3a145f472f79c2bb6860ebf917798527b8',
    endpoints: { portal: 'https://127.0.0.1:49001', supabase: 'https://127.0.0.1:49002', mailpit: 'http://127.0.0.1:49003' },
    actors: {
      a: { id: id(2), email: 'a@example.invalid', initialDisplayName: 'SYNTHETIC A' },
      b: { id: id(3), email: 'b@example.invalid', initialDisplayName: 'SYNTHETIC B' },
      advisor: { id: id(4), email: 'advisor@example.invalid' },
      viewer: { id: id(5), email: 'viewer@example.invalid' },
    },
    publicationScenario: {
      clientId: id(2), quoteId: id(6), claimId: id(7), paymentOptionId: id(8),
      publicMarker: 'SYNTHETIC M04 PUBLIC', privateMarker: 'SYNTHETIC M04 PRIVATE',
      content: { schemaVersion: 1, title: 'SYNTHETIC M04 PUBLIC', context: { facts: [{ visibility: 'advisor_only', text: 'SYNTHETIC M04 PRIVATE', sources: [] }] } },
    },
  };
  const target = { draftId: id(9), clientId: id(2), contentRevision: 2, assignmentRevision: 1, contentHash: 'a'.repeat(64) };
  const receipt = { requestId: id(10), publicationReceiptId: id(11), target, kind: 'care_plan', publicationVersion: 1, instructionId: null, reviewId: null, publishedAt: at, firstServiceStarted: true, notificationEventId: id(12) };
  const command = { schemaVersion: 1, action: 'publish_plan_v1', requestId: id(10), target, approvalId: id(13), firstServiceClaimId: id(7) };
  const document = { schemaVersion: 1, title: 'SYNTHETIC M04 PUBLIC', context: { products: { state: 'unknown' }, facts: [] } };
  const payment = { quoteId: id(6), quoteClientId: id(2), publicationVersion: 0, quoteStatus: 'settled', serviceCents: 10000, productCents: 0, totalCents: 10000, claimId: id(7), claimClientId: id(2), claimQuoteId: id(6), claimStatus: 'confirmed', paymentOptionId: id(8), confirmedBy: id(4), confirmationClientId: id(2), confirmationQuoteId: id(6), confirmedAt: at, confirmedServiceCents: 10000, confirmedProductCents: 0, confirmedTotalCents: 10000 };
  const approval = { id: id(13), target, publisher: { kind: 'human', actorId: id(4) }, scope: 'care_plan.publish', approvedBy: id(4), approvedAt: at, revoked: false };
  const before = { schemaVersion: 1, clientId: id(2), draftId: id(9), caseRevision: 1, publishedVersion: 0,
    draft: { id: id(9), clientId: id(2), contentRevision: 2, assignmentRevision: 1, state: 'working', target }, expectedDocument: document,
    publications: [], documents: [], receipts: [], events: [], deliveries: [], entitlements: [], requests: [],
    approvals: [approval], payment, servicePeriods: [{ claimId: id(7), clientId: id(2), startsOn: null, endsOn: null }], reviewSchedules: [], actualStarts: 0 };
  const after = structuredClone(before);
  Object.assign(after, { caseRevision: 2, publishedVersion: 1 });
  after.draft.state = 'published';
  after.publications = [{ clientId: id(2), version: 1, publishedAt: at, publishedBy: id(4), documentSchemaVersion: 3 }];
  after.documents = [{ clientId: id(2), version: 1, approvalId: id(13), receiptId: id(11), document }];
  after.receipts = [{ id: id(11), approvalId: id(13), clientId: id(2), version: 1, actorId: id(4), requestId: id(10), firstServiceClaimId: id(7), eventId: id(12), receipt }];
  after.events = [{ id: id(12), clientId: id(2), publicationVersion: 1, kind: 'plan_published', sourceKind: 'publication' }];
  after.deliveries = ['portal', 'email'].map((channel, i) => ({ id: id(14 + i), eventId: id(12), recipientId: id(2), channel, status: 'queued', revision: 0, attempts: 0, seenAt: null }));
  after.entitlements = [{ clientId: id(2), version: 1, claimId: id(7), startsOn: '2026-11-03' }];
  after.requests = [{ actorId: id(4), requestId: id(10), command, result: receipt }];
  after.servicePeriods[0].startsOn = '2026-11-03';
  after.servicePeriods[0].endsOn = '2026-12-03';
  after.reviewSchedules = [{ clientId: id(2), firstPublicationAt: at, twoWeekOn: '2026-11-17', monthOneOn: '2026-12-03', monthTwoOn: '2027-01-03', monthThreeOn: '2027-02-03' }];
  return { descriptor, publication: { draftId: id(9), target, approvalId: id(13), receipt, command }, before, after, replay: structuredClone(after) };
}

test('complete synthetic relationships return only observations and the actually supplied downstream IDs', () => {
  const result = assertPublicationOracle(example());
  assert.equal(result.status, 'OBSERVATIONS_ONLY');
  assert.deepEqual(result.scenario, { clientId: id(2), publicationVersion: 1, notificationEventId: id(12), portalDeliveryId: id(14), publicationReceiptId: id(11), publishRequestId: id(10) });
  assert.equal(result.genuineAcceptance, 'NOT_ASSESSED');
});

const corruptions = [
  ['missing immutable document', x => { x.after.documents = []; }],
  ['missing publication', x => { x.after.publications = []; }],
  ['duplicate publication', x => { x.after.publications.push(structuredClone(x.after.publications[0])); }],
  ['missing event', x => { x.after.events = []; }],
  ['wrong event producer', x => { x.after.events[0].sourceKind = 'guidance'; }],
  ['event from another client', x => { x.after.events[0].clientId = id(3); }],
  ['missing portal delivery', x => { x.after.deliveries.shift(); }],
  ['two emails masquerading as two channels', x => { x.after.deliveries[0].channel = 'email'; }],
  ['outbox belongs to other recipient', x => { x.after.deliveries[0].recipientId = id(3); }],
  ['fabricated delivered email', x => { x.after.deliveries[1].status = 'delivered'; }],
  ['dispatcher already ran', x => { x.after.deliveries[1].attempts = 1; }],
  ['document not bound to receipt', x => { x.after.documents[0].receiptId = id(99); }],
  ['private source marker in published document', x => { x.after.documents[0].document.context.facts.push({ text: 'SYNTHETIC M04 PRIVATE' }); }],
  ['missing exact approval', x => { x.after.approvals = []; }],
  ['approval for wrong revision', x => { x.after.approvals[0].target.contentRevision++; }],
  ['approval for wrong publisher', x => { x.after.approvals[0].publisher.actorId = id(5); }],
  ['revoked approval', x => { x.after.approvals[0].revoked = true; }],
  ['missing canonical confirmation', x => { x.after.payment.confirmedAt = null; }],
  ['unverified claim', x => { x.after.payment.claimStatus = 'submitted_unverified'; }],
  ['wrong applicable quote', x => { x.after.payment.confirmationQuoteId = id(99); }],
  ['wrong payment option', x => { x.after.payment.paymentOptionId = id(99); }],
  ['wrong gross receipt', x => { x.after.payment.confirmedTotalCents = 9999; }],
  ['missing service entitlement', x => { x.after.entitlements = []; }],
  ['service clock started before deliberate publication', x => { x.before.servicePeriods[0].startsOn = '2026-11-02'; }],
  ['review clock does not bind publication', x => { x.after.reviewSchedules[0].firstPublicationAt = '2026-11-02T12:00:00.000Z'; }],
  ['payment created a plan before command', x => { x.before.publishedVersion = 1; }],
  ['publication implicitly starts product use', x => { x.after.actualStarts = 1; }],
  ['missing persisted request', x => { x.after.requests = []; }],
  ['request payload differs', x => { x.after.requests[0].command.firstServiceClaimId = null; }],
  ['receipt event differs', x => { x.after.receipts[0].eventId = id(99); }],
  ['replay duplicates service schedule', x => { x.replay.reviewSchedules.push(structuredClone(x.replay.reviewSchedules[0])); }],
  ['replay advances case revision', x => { x.replay.caseRevision++; }],
  ['replay changes immutable content', x => { x.replay.documents[0].document.title = 'SYNTHETIC changed'; }],
  ['denied write changed persisted data', x => { x.denials = [{ phase: 'missing-payment', before: structuredClone(x.before), after: structuredClone(x.before) }]; x.denials[0].after.caseRevision++; }],
];
for (const [name, corrupt] of corruptions) test(`oracle refuses ${name}`, () => {
  const input = example(); corrupt(input);
  assert.throws(() => assertPublicationOracle(input), undefined, name);
});

for (const [name, corrupt] of [
  ['remote portal', d => { d.endpoints.portal = 'https://example.com'; }],
  ['credential-bearing origin', d => { d.endpoints.portal = 'https://user:secret@127.0.0.1:49001'; }],
  ['implicit HTTPS port', d => { d.endpoints.portal = 'https://127.0.0.1'; }],
  ['different scenario owner', d => { d.publicationScenario.clientId = id(3); }],
  ['actor identity alias', d => { d.actors.b.id = d.actors.a.id; }],
  ['descriptor private credential', d => { d.access_token = 'do-not-emit'; }],
  ['non-synthetic recipient', d => { d.actors.advisor.email = 'someone@example.com'; }],
]) test(`runner refuses ${name} before touching a page`, async () => {
  const { descriptor } = example(); corrupt(descriptor);
  let touched = false;
  const page = { url() { touched = true; return descriptor.endpoints.portal; } };
  await assert.rejects(runModule({ page, descriptor, phase: 'prepare' }));
  assert.equal(touched, false);
});

test('runner refuses a mismatched actual page origin without evaluation or navigation', async () => {
  const { descriptor } = example(); let touched = false;
  const page = { url: () => 'https://127.0.0.1:49999/plan', evaluate() { touched = true; }, goto() { touched = true; } };
  await assert.rejects(runModule({ page, descriptor, phase: 'prepare' }));
  assert.equal(touched, false);
});

test('runner refuses an invented route phase without touching a real page', async () => {
  const { descriptor } = example(); let touched = false;
  const page = { url() { touched = true; } };
  await assert.rejects(runModule({ page, descriptor, phase: 'a07-fallback' }));
  assert.equal(touched, false);
});

test('a real unavailable observation cannot be relabeled as signed-out denial', async () => {
  const { descriptor } = example();
  const observed = { stage: 'session', status: 503, cacheControl: 'private, no-store', body: null };
  let evaluations = 0;
  const page = { url: () => descriptor.endpoints.portal + '/plan', evaluate() { evaluations++; return structuredClone(observed); } };
  await assert.rejects(runModule({ page, descriptor, phase: 'signed-out' }), error => {
    assert.equal(error.m04Observations.status, 'OBSERVATIONS_ONLY');
    assert.equal(error.m04Observations.observations[0].status, 503);
    return true;
  });
  assert.equal(evaluations, 1);
});

test('transport exception stays a failure without retry, receipt or caller cleanup', async () => {
  const { descriptor } = example(); let evaluations = 0, closed = false;
  const failure = Error('SYNTHETIC negative transport control');
  const page = { url: () => descriptor.endpoints.portal + '/plan', evaluate() { evaluations++; throw failure; }, close() { closed = true; } };
  await assert.rejects(runModule({ page, descriptor, phase: 'signed-out' }), error => {
    assert.equal(error, failure); assert.equal(error.m04Observations.publication, null);
    assert.deepEqual(error.m04Observations.observations, []); return true;
  });
  assert.equal(evaluations, 1); assert.equal(closed, false);
});

test('synthetic 401 negative can omit unread session bytes without inventing a body or authority', async () => {
  const { descriptor } = example();
  const page = { url: () => descriptor.endpoints.portal + '/plan', evaluate: async () => ({ stage: 'session', status: 401, cacheControl: 'private, no-store', bodyOmitted: true }) };
  const result = await runModule({ page, descriptor, phase: 'signed-out' });
  assert.equal(result.genuineAcceptance, 'NOT_ASSESSED');
  assert.equal(result.status, 'OBSERVATIONS_ONLY');
  assert.equal(result.observations[0].status, 401);
  assert.equal(result.observations[0].bodyOmitted, true);
  assert.equal(Object.hasOwn(result.observations[0], 'body'), false);
});
