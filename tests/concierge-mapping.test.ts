import assert from 'node:assert/strict';
import test from 'node:test';
import { mapConciergeAdvisorView, mapConciergeClientView, mapConciergeWriteReceipt } from '../src/contracts/ConciergePortalMapping.ts';
import { clientFixture, emptyClientFixture, recommendation } from './fixtures/concierge.ts';

test('client projection allowlists public fields at every nesting level and detaches input references', () => {
  const expected = clientFixture();
  const wire = {
    ...clientFixture(), draft: { advisorNote: 'PRIVATE_CANARY' }, intake: { note: 'PRIVATE_CANARY' },
    advisorIds: ['PRIVATE_CANARY'],
    plan: { ...expected.plan!, advisorNote: 'PRIVATE_CANARY', recommendations: [{ ...recommendation, transcript: 'PRIVATE_CANARY' }],
      itemStates: [{ ...expected.plan!.itemStates[0], privateNote: 'PRIVATE_CANARY' }] },
    history: [{ ...expected.history[0], advisorNote: 'PRIVATE_CANARY' }],
    orderProposal: { ...expected.orderProposal, paymentScreenshot: 'PRIVATE_CANARY', items: [{ ...recommendation, privateNote: 'PRIVATE_CANARY' }] },
    routine: [{ slot: 'moisturizer', productId: 'original', notes: 'PRIVATE_CANARY' }],
  };
  const result = mapConciergeClientView(wire);
  assert.deepEqual(result, expected);
  assert.doesNotMatch(JSON.stringify(result), /PRIVATE_CANARY/);
  result.plan!.recommendations[0].rationale = 'Changed output';
  assert.equal(wire.plan.recommendations[0].rationale, 'One selected replacement for the stated goal.');
});

test('an unpublished case has no plan; malformed projections fail instead of inventing an empty plan', () => {
  assert.deepEqual(mapConciergeClientView(emptyClientFixture()), emptyClientFixture());
  for (const wire of [null, [], {}, { ...clientFixture(), revision: -1 }, { ...clientFixture(), routine: null }]) {
    assert.throws(() => mapConciergeClientView(wire), /invalid_concierge_response/);
  }
});

test('approval and receipt never imply a start or replace the active routine', () => {
  const approved = mapConciergeClientView(clientFixture());
  assert.deepEqual(approved.routine, [{ slot: 'moisturizer', productId: 'original' }]);
  const received = clientFixture();
  received.plan!.itemStates[0].received = true;
  received.orderProposal.items = [];
  received.orderProposal.subtotalCents = 0;
  assert.equal(mapConciergeClientView(received).plan!.itemStates[0].startedOn, null);
  assert.deepEqual(mapConciergeClientView(received).routine, approved.routine);
  received.plan!.itemStates[0].startedOn = '2026-10-01';
  received.routine = [{ slot: 'moisturizer', productId: 'replacement' }];
  received.routineHistory = [{ version: 2, recommendationId: 'moisturizer-v2', slot: 'moisturizer', productId: 'replacement', startedOn: '2026-10-01' }];
  assert.deepEqual(mapConciergeClientView(received), received);
});

test('malformed states, duplicate selections and payable or inconsistent proposals fail closed', () => {
  const cases: unknown[] = [];
  for (const mutate of [
    (v: ReturnType<typeof clientFixture>) => { v.plan!.recommendations.push({ ...recommendation, id: 'another' }); },
    (v: ReturnType<typeof clientFixture>) => { v.plan!.itemStates = []; },
    (v: ReturnType<typeof clientFixture>) => { v.plan!.itemStates[0].startedOn = '2026-02-30'; },
    (v: ReturnType<typeof clientFixture>) => { v.plan!.itemStates[0].startedOn = '2026-10-01'; },
    (v: ReturnType<typeof clientFixture>) => { v.plan!.itemStates[0].choice = 'declined'; v.plan!.itemStates[0].reason = ' '; },
    (v: ReturnType<typeof clientFixture>) => { v.orderProposal.subtotalCents = 1; },
    (v: ReturnType<typeof clientFixture>) => { v.orderProposal.items[0].proposedProductId = 'different'; },
  ]) { const v = clientFixture(); mutate(v); cases.push(v); }
  cases.push({ ...clientFixture(), orderProposal: { ...clientFixture().orderProposal, payable: true } });
  for (const wire of cases) assert.throws(() => mapConciergeClientView(wire), /invalid_concierge_response/);
});

test('advisor mapping has an explicit private projection and never spreads raw RPC rows', () => {
  const wire = { client: clientFixture(), intake: { version: 1, goal: 'Comfort', note: 'Advisor call notes', storagePath: 'HIDDEN' },
    draft: { intakeVersion: 1, recommendations: [{ ...recommendation }], advisorNote: 'Private draft note', secret: 'HIDDEN' }, otherClient: 'HIDDEN' };
  assert.deepEqual(mapConciergeAdvisorView(wire), {
    client: clientFixture(), intake: { version: 1, goal: 'Comfort', note: 'Advisor call notes' },
    draft: { intakeVersion: 1, recommendations: [{ ...recommendation }], advisorNote: 'Private draft note' },
  });
  assert.deepEqual(mapConciergeAdvisorView({ client: emptyClientFixture(), intake: null, draft: null }), { client: emptyClientFixture(), intake: null, draft: null });
});

test('SQL-valid Unicode text limits count code points, including astral characters', () => {
  const wire = { client: emptyClientFixture(), intake: { version: 1, goal: '🧴'.repeat(300), note: '🧴'.repeat(4000) },
    draft: { intakeVersion: 1, recommendations: [{ ...recommendation, rationale: '🧴'.repeat(4000) }], advisorNote: '🧴'.repeat(4000) } };
  assert.deepEqual(mapConciergeAdvisorView(wire), wire);
  assert.throws(() => mapConciergeAdvisorView({ ...wire, intake: { ...wire.intake, goal: '🧴'.repeat(301) } }), /invalid_concierge_response/);
});

test('write receipts must match the requested operation and expose no private result fields', () => {
  assert.deepEqual(mapConciergeWriteReceipt({ revision: 5, publishedVersion: 2, operation: 'receive', privateNote: 'HIDDEN' }, 'receive'), { revision: 5, publishedVersion: 2, operation: 'receive' });
  for (const wire of [{ revision: 5, publishedVersion: 2, operation: 'start' }, { revision: 1.5, publishedVersion: 2, operation: 'receive' }]) {
    assert.throws(() => mapConciergeWriteReceipt(wire, 'receive'), /invalid_concierge_response/);
  }
});
