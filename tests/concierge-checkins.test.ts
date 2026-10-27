import assert from 'node:assert/strict';
import test from 'node:test';
import { validateCheckinSubmission } from '../supabase/functions/concierge-checkins/validation.ts';

const requestId = 'ae000000-0000-4000-8000-000000000001';
const frontId = 'ae000000-0000-4000-8000-000000000002';
const base = { requestId, comfort: 'Comfortable', consistency: 'Most days', changes: '' };

test('a short client report needs no photos or generated interpretation', () => {
  assert.deepEqual(validateCheckinSubmission(base), { ok: true, value: { ...base, photoIds: [] } });
});

test('submission identifiers and photo references are normalized UUIDs with duplicate references rejected', () => {
  assert.deepEqual(validateCheckinSubmission({ ...base, requestId: requestId.toUpperCase(), photoIds: [frontId.toUpperCase()] }),
    { ok: true, value: { ...base, photoIds: [frontId] } });
  for (const photoIds of [[frontId, frontId.toUpperCase()], [frontId, 'not-an-id'], [frontId, frontId, frontId, frontId]]) {
    assert.equal(validateCheckinSubmission({ ...base, photoIds }).ok, false);
  }
  for (const bad of ['', 'synthetic-id', 'ae000000-0000-0000-0000-000000000001', null]) {
    assert.equal(validateCheckinSubmission({ ...base, requestId: bad }).ok, false);
  }
});

test('client answers are bounded by Unicode code points and required answers reject whitespace', () => {
  assert.equal(validateCheckinSubmission({ ...base, comfort: '🙂'.repeat(1000), changes: 'x'.repeat(1000) }).ok, true);
  for (const patch of [{ comfort: '🙂'.repeat(1001) }, { consistency: 'x'.repeat(1001) }, { changes: 'x'.repeat(1001) },
    { comfort: '\t\n\uFEFF' }, { consistency: ' ' }, { changes: null }, { comfort: 4 }, { changes: 'bad\u0000text' }]) {
    assert.deepEqual(validateCheckinSubmission({ ...base, ...patch }), { ok: false, error: { code: 'invalid_input', retryable: false } });
  }
});

test('untrusted client payloads cannot provide owner, role, private notes, paths, dates or routine decisions', () => {
  for (const patch of [{ clientId: frontId }, { ownerId: frontId }, { advisor: true }, { meetingNote: 'private' },
    { storagePath: 'foreign/path' }, { signedUrl: 'https://example.com/photo' }, { nextCheckinOn: '2026-11-01' }, { approved: true }]) {
    assert.equal(validateCheckinSubmission({ ...base, ...patch }).ok, false);
  }
  for (const input of [null, [], 'report', {}, { ...base, photoIds: null }, { ...base, photoIds: ['https://example.com/photo'] }]) {
    assert.equal(validateCheckinSubmission(input).ok, false);
  }
});
