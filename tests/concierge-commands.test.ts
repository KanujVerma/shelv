import assert from 'node:assert/strict';
import test from 'node:test';
import type { ConciergeCommand } from '../src/contracts/ConciergePortal.ts';
import { buildConciergeRpc } from '../supabase/functions/concierge-operations/commands.ts';
import { otherId, ownerId, recommendation, requestId } from './fixtures/concierge.ts';

test('all owner operations derive the target from the verified identity and preserve retry identity', () => {
  const cases = [
    { action: 'submit_intake', goal: 'Comfort', note: '', baseline: [{ slot: 'moisturizer', productId: 'original' }] },
    { action: 'decide', version: 2, recommendationId: 'moisturizer-v2', choice: 'declined', reason: 'Already tried it' },
    { action: 'receive', version: 2, recommendationId: 'moisturizer-v2' },
    { action: 'start', version: 2, recommendationId: 'moisturizer-v2', startedOn: '2026-10-01' },
  ];
  for (const { action, ...payload } of cases) {
    const command = { action, expectedRevision: 4, requestId, ...payload };
    const expected = { name: 'concierge_write', args: { p_client_id: ownerId, p_action: action, p_expected_revision: 4, p_request_id: requestId, p_payload: payload } };
    assert.deepEqual(buildConciergeRpc(command, ownerId), expected);
    assert.deepEqual(buildConciergeRpc(command, ownerId), expected);
    assert.throws(() => buildConciergeRpc({ ...command, clientId: otherId }, ownerId), /invalid_input/);
  }
});

test('advisor routes only select an RPC target; authority remains in the database', () => {
  assert.deepEqual(buildConciergeRpc({ action: 'client_read' }, ownerId), { name: 'concierge_client_view', args: {} });
  assert.deepEqual(buildConciergeRpc({ action: 'advisor_read', clientId: otherId }, ownerId), { name: 'concierge_advisor_view', args: { p_client_id: otherId } });
  const write = { action: 'save_draft', clientId: otherId, expectedRevision: 4, requestId, intakeVersion: 1, recommendations: [recommendation], advisorNote: '' };
  assert.deepEqual(buildConciergeRpc(write, ownerId), { name: 'concierge_write', args: { p_client_id: otherId, p_action: 'save_draft', p_expected_revision: 4, p_request_id: requestId, p_payload: { intakeVersion: 1, recommendations: [recommendation], advisorNote: '' } } });
  const publish: ConciergeCommand = { action: 'publish', clientId: otherId, requestId, expectedRevision: 4 };
  assert.deepEqual(buildConciergeRpc(publish, ownerId), { name: 'concierge_write', args: { p_client_id: otherId, p_action: 'publish', p_expected_revision: 4, p_request_id: requestId, p_payload: {} } });
  for (const role of ['advisor', 'founder', 'operator']) assert.throws(() => buildConciergeRpc({ ...write, role }, ownerId), /invalid_input/);
});

test('rejects unknown actions, malformed dates, unsafe revisions, duplicate slots and blank text', () => {
  const base = { action: 'start', requestId, expectedRevision: 4, version: 2, recommendationId: 'moisturizer-v2', startedOn: '2026-10-01' };
  const draft = { action: 'save_draft', clientId: otherId, requestId, expectedRevision: 4, intakeVersion: 1, recommendations: [recommendation], advisorNote: '' };
  for (const wire of [null, [], {}, { action: 'checkout' }, { ...base, expectedRevision: Number.MAX_SAFE_INTEGER + 1 },
    { ...base, startedOn: '2026-02-30' }, { ...base, startedOn: '1899-12-31' }, { ...base, ready: true },
    { ...draft, recommendations: [recommendation, { ...recommendation, id: 'second' }] },
    { ...draft, recommendations: [{ ...recommendation, rationale: '\t\n\u00a0\ufeff' }] },
    { action: 'decide', requestId, expectedRevision: 4, version: 2, recommendationId: 'a', choice: 'declined', reason: '\t\n' },
    { action: 'decide', requestId, expectedRevision: 4, version: 2, recommendationId: 'a', choice: 'approved', reason: ' ' },
  ]) assert.throws(() => buildConciergeRpc(wire, ownerId), /invalid_input/);
});
