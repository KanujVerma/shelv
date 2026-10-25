import assert from 'node:assert/strict';
import test from 'node:test';
import { buildConciergeRpc } from '../supabase/functions/concierge-operations/commands.ts';
import { handleConciergeRequest } from '../supabase/functions/concierge-operations/handler.ts';
import { mapConciergeAdvisorDirectory, mapConciergeAdvisorView } from '../src/contracts/ConciergePortalMapping.ts';
import { clientFixture, ownerId, otherId, requestId } from './fixtures/concierge.ts';

test('advisor list and private intake/meeting commands preserve server authorization and exact retry inputs', () => {
  assert.deepEqual(buildConciergeRpc({ action: 'advisor_list' }, ownerId), { name: 'concierge_advisor_directory', args: {} });
  const base = { clientId: otherId, requestId, expectedRevision: 0 };
  for (const payload of [
    { action: 'save_intake', goal: 'Comfort', note: '', baseline: [{ slot: 'moisturizer', productId: 'original' }] },
    { action: 'save_meeting_note', kind: 'transcript', text: 'Private pasted meeting context' },
  ]) {
    const { action, ...data } = payload;
    assert.deepEqual(buildConciergeRpc({ ...base, ...payload }, ownerId), { name: 'concierge_advisor_write', args: {
      p_client_id: otherId, p_request_id: requestId, p_expected_revision: 0, p_action: action, p_payload: data,
    } });
    assert.throws(() => buildConciergeRpc({ ...base, ...payload, advisor: true }, ownerId), /invalid_input/);
  }
  assert.throws(() => buildConciergeRpc({ ...base, action: 'save_meeting_note', kind: 'audio', text: 'x' }, ownerId), /invalid_input/);
  assert.throws(() => buildConciergeRpc({ ...base, action: 'save_meeting_note', kind: 'notes', text: 'a'.repeat(20001) }, ownerId), /invalid_input/);
});

test('directory and private meeting mappings explicitly project fields and reject forged capability types', () => {
  const raw = { capabilities: { view: true, edit: false, publish: false, confirmPayments: false, admin: true }, clients: [
    { clientId: otherId, displayName: 'Synthetic client', enrollmentStatus: 'active', revision: 4, publishedVersion: 2, hasDraft: true, email: 'PRIVATE_CANARY' },
  ], private: 'PRIVATE_CANARY' };
  const mapped = mapConciergeAdvisorDirectory(raw);
  assert.doesNotMatch(JSON.stringify(mapped), /PRIVATE_CANARY|admin/);
  assert.equal(mapped.capabilities.edit, false);
  assert.throws(() => mapConciergeAdvisorDirectory({ ...raw, capabilities: { ...raw.capabilities, edit: 'true' } }));
  const view = mapConciergeAdvisorView({ client: clientFixture(), intake: null, draft: null,
    meetingNotes: [{ id: requestId, kind: 'notes', text: 'Private meeting note', createdAt: '2026-10-18T12:00:00Z', ownerId }], rawPath: 'PRIVATE_CANARY' });
  assert.equal(view.meetingNotes[0].text, 'Private meeting note');
  assert.doesNotMatch(JSON.stringify(view), /rawPath|ownerId/);
});

test('advisor list HTTP rechecks bearer and maps authoritative capability projection', async () => {
  let calls = 0;
  const request = new Request('https://function.invalid', { method: 'POST', headers: { authorization: 'Bearer synthetic', 'content-type': 'application/json' }, body: '{"action":"advisor_list"}' });
  const response = await handleConciergeRequest(request, { allowedOrigins: [], authenticate: async () => ({ id: ownerId, is_anonymous: false }), rpc: async (_token, call) => {
    calls++; assert.equal(call.name, 'concierge_advisor_directory');
    return { data: { capabilities: { view: true, edit: false, publish: false, confirmPayments: false }, clients: [], internal: 'PRIVATE_CANARY' }, error: null };
  } });
  assert.equal(response.status, 200); assert.equal(calls, 1);
  assert.doesNotMatch(await response.text(), /PRIVATE_CANARY/);
});
