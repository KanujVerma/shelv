import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluateCheckinSubmission, submitCheckin } from '../supabase/functions/concierge-checkins/submissions.ts';
import { mapCheckinClientView } from '../supabase/functions/concierge-checkins/projection.ts';

const ownerId = 'ae000000-0000-4000-8000-000000000001';
const otherId = 'ae000000-0000-4000-8000-000000000002';
const requestId = 'ae000000-0000-4000-8000-000000000003';
const reportId = 'ae000000-0000-4000-8000-000000000004';
const photoId = 'ae000000-0000-4000-8000-000000000005';
const secondPhotoId = 'ae000000-0000-4000-8000-000000000006';
const submittedAt = '2026-10-18T12:00:00.000Z';
const submission = { requestId, comfort: 'Comfortable', consistency: 'Most days', changes: '', photoIds: [] as string[] };
const command = { ownerId, expectedRevision: 3, submission };
const receipt = { revision: 4, operation: 'submit_report', reportId } as const;
const snapshot = () => ({ ownerId, authorization: { ok: true, value: true } as const, revision: 3,
  previousRequest: null, reportId, submittedAt, photos: [] });

test('submission creates one immutable client report without modifying routine, scheduling or advisor decisions', () => {
  const state = { ...snapshot(), routine: [{ productId: 'synthetic-product' }], advisorDecision: null, nextCheckinOn: '2026-11-01' };
  const before = JSON.stringify(state);
  const result = evaluateCheckinSubmission(state, command);
  assert.deepEqual(result, { ok: true, value: { mode: 'create', receipt,
    report: { id: reportId, submittedAt, comfort: 'Comfortable', consistency: 'Most days', changes: '', photos: [] } } });
  assert.equal(JSON.stringify(state), before);
  if (result.ok) { assert.equal(Object.isFrozen(result.value.report), true); assert.equal(Object.isFrozen(result.value.receipt), true); }
});

test('every replay checks current guard outcome first, including revocation and the ended paid service period', () => {
  const previousRequest = { command, receipt };
  for (const code of ['forbidden', 'service_inactive', 'routine_not_started'] as const) {
    const result = evaluateCheckinSubmission({ ...snapshot(), revision: 4, previousRequest,
      authorization: { ok: false, error: { code, retryable: false } } }, command);
    assert.deepEqual(result, { ok: false, error: { code, retryable: false } });
  }
  assert.deepEqual(evaluateCheckinSubmission({ ...snapshot(), ownerId: otherId }, command),
    { ok: false, error: { code: 'forbidden', retryable: false } });
});

test('an exact duplicate replays its original receipt; changed payload or revision under that UUID conflicts', () => {
  const state = { ...snapshot(), revision: 4, previousRequest: { command, receipt } };
  assert.deepEqual(evaluateCheckinSubmission(state, command), { ok: true, value: { mode: 'replay', receipt } });
  for (const changed of [{ ...command, expectedRevision: 4 }, { ...command, submission: { ...submission, changes: 'New change' } },
    { ...command, submission: { ...submission, photoIds: [photoId] } }]) {
    assert.deepEqual(evaluateCheckinSubmission(state, changed), { ok: false, error: { code: 'request_conflict', retryable: false } });
  }
  assert.deepEqual(evaluateCheckinSubmission(snapshot(), { ...command, expectedRevision: 2 }),
    { ok: false, error: { code: 'revision_conflict', retryable: false } });
});

test('optional photo subsets bind only completed owner references with distinct angles', () => {
  const ready = { id: photoId, ownerId, angle: 'front', state: 'complete', attachedReportId: null } as const;
  const withPhoto = { ...command, submission: { ...submission, photoIds: [photoId] } };
  const result = evaluateCheckinSubmission({ ...snapshot(), photos: [ready] }, withPhoto);
  assert.equal(result.ok, true);
  if (result.ok && result.value.mode === 'create') assert.deepEqual(result.value.report.photos, [{ id: photoId, angle: 'front' }]);
  for (const photo of [{ ...ready, ownerId: otherId }, { ...ready, state: 'pending' as const }, { ...ready, attachedReportId: reportId }]) {
    assert.deepEqual(evaluateCheckinSubmission({ ...snapshot(), photos: [photo] }, withPhoto),
      { ok: false, error: { code: 'photo_unavailable', retryable: false } });
  }
  assert.equal(evaluateCheckinSubmission(snapshot(), withPhoto).ok, false);
  assert.equal(evaluateCheckinSubmission({ ...snapshot(), photos: [ready, { ...ready, id: secondPhotoId }] },
    { ...command, submission: { ...submission, photoIds: [photoId, secondPhotoId] } }).ok, false);
});

test('repository receives an immutable owner-bound command and may atomically return only a public receipt', async () => {
  let calls = 0;
  const result = await submitCheckin(submission, { ownerId, expectedRevision: 3 }, {
    submitAtomically: async input => {
      calls++;
      assert.deepEqual(input, command);
      assert.equal(Object.isFrozen(input), true); assert.equal(Object.isFrozen(input.submission), true);
      return { data: { ...receipt, advisorNote: 'never return', storagePath: 'private/path' }, error: null };
    },
  });
  assert.deepEqual(result, { ok: true, value: receipt }); assert.equal(calls, 1);
});

test('bad inputs never reach persistence; upstream failures are sanitized and retry keeps the caller identifiers', async () => {
  let calls = 0, fail = true;
  const repository = { submitAtomically: async (input: unknown) => {
    calls++; assert.deepEqual(input, command);
    if (fail) throw new Error('private upstream details and secret tokens');
    return { data: receipt, error: null };
  } };
  assert.equal((await submitCheckin({ ...submission, ownerId: otherId }, { ownerId, expectedRevision: 3 }, repository)).ok, false);
  assert.equal((await submitCheckin(submission, { ownerId: 'bad-id', expectedRevision: 3 }, repository)).ok, false);
  assert.equal(calls, 0);
  assert.deepEqual(await submitCheckin(submission, { ownerId, expectedRevision: 3 }, repository),
    { ok: false, error: { code: 'unavailable', retryable: true } });
  fail = false;
  assert.deepEqual(await submitCheckin(submission, { ownerId, expectedRevision: 3 }, repository), { ok: true, value: receipt });
  assert.equal(calls, 2);
});

test('client history projection removes private notes and storage descriptors at every level', () => {
  const raw = { revision: 4, nextCheckinOn: '2026-11-01', meetingNotes: [{ note: 'private' }], advisorId: otherId,
    reports: [{ id: reportId, submittedAt, comfort: 'Comfortable', consistency: 'Most days', changes: '', advisorNote: 'private',
      photos: [{ id: photoId, angle: 'front', ownerId, path: 'private/path', signedUrl: 'https://example.com/private' }] }] };
  assert.deepEqual(mapCheckinClientView(raw), { ok: true, value: { revision: 4, nextCheckinOn: '2026-11-01',
    reports: [{ id: reportId, submittedAt, comfort: 'Comfortable', consistency: 'Most days', changes: '',
      photos: [{ id: photoId, angle: 'front' }] }] } });
  for (const patch of [{ reports: null }, { nextCheckinOn: '2026-02-30' }, { revision: -1 },
    { reports: [{ ...raw.reports[0], photos: [{ id: photoId, angle: 'shelf' }] }] }]) {
    assert.deepEqual(mapCheckinClientView({ ...raw, ...patch }), { ok: false, error: { code: 'unavailable', retryable: true } });
  }
});
