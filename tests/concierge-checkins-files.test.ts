import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import { validateCheckinPhoto } from '../supabase/functions/concierge-checkins/photos.ts';
import { recommendNextCheckinDate, validateCheckinDate } from '../supabase/functions/concierge-checkins/dates.ts';

const requestId = 'ae000000-0000-4000-8000-000000000001';
const png = Uint8Array.from(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64'));
const jpeg = Uint8Array.from([255,216,255,219,0,4,0,0,255,217]);
const webp = Uint8Array.from([82,73,70,70,12,0,0,0,87,69,66,80,86,80,56,76,0,0,0,0]);

for (const [contentType, bytes] of [['image/png', png], ['image/jpeg', jpeg], ['image/webp', webp]] as const) {
  test(`optional ${contentType} photo binds exact bytes to immutable upload metadata`, async () => {
    const source = bytes.slice();
    const metadata = { requestId, angle: 'left', contentType, sizeBytes: source.length };
    const expectedDigest = createHash('sha256').update(source).digest('hex');
    const pending = validateCheckinPhoto(metadata, source);
    source.fill(0); // An upload must retain the bytes it validated even if the caller changes its buffer.
    const result = await pending;
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.value.sha256, expectedDigest);
    assert.equal(result.value.sizeBytes, bytes.length);
    assert.equal(result.value.contentType, contentType);
    assert.equal(result.value.angle, 'left');
    assert.equal(result.value.body.type, contentType);
    assert.deepEqual(new Uint8Array(await result.value.body.arrayBuffer()), bytes);
    assert.equal(Object.isFrozen(result.value), true);
  });
}

test('wrong types, filenames, ownership, mismatched MIME, lengths and empty files are rejected safely', async () => {
  const valid = { requestId, angle: 'front', contentType: 'image/png', sizeBytes: png.length };
  for (const patch of [{ angle: 'shelf' }, { angle: 'FRONT' }, { ownerId: requestId }, { path: 'foreign/file' },
    { fileName: 'sensitive-name.png' }, { contentType: 'image/svg+xml' }, { contentType: 'image/jpeg' },
    { contentType: 'image/avif' }, { sizeBytes: png.length + 1 }, { requestId: 'bad-id' }]) {
    assert.equal((await validateCheckinPhoto({ ...valid, ...patch }, png)).ok, false);
  }
  assert.equal((await validateCheckinPhoto({ ...valid, sizeBytes: 0 }, new Uint8Array())).ok, false);
  const text = new TextEncoder().encode('private synthetic text, never an image');
  assert.equal((await validateCheckinPhoto({ ...valid, sizeBytes: text.length }, text)).ok, false);
  const invalidWebp = webp.slice(); invalidWebp[4] = 20;
  assert.equal((await validateCheckinPhoto({ ...valid, contentType: 'image/webp', sizeBytes: invalidWebp.length }, invalidWebp)).ok, false);
});

test('oversized uploads return a stable nonretryable limit error without exposing file data', async () => {
  const tooLarge = new Uint8Array(5 * 1024 * 1024 + 1); tooLarge.set(png);
  assert.deepEqual(await validateCheckinPhoto({ requestId, angle: 'right', contentType: 'image/png', sizeBytes: tooLarge.length }, tooLarge),
    { ok: false, error: { code: 'photo_too_large', retryable: false } });
});

test('calendar dates reject overflow, timestamps and ambiguous local input', () => {
  assert.deepEqual(validateCheckinDate(null), { ok: true, value: null });
  assert.deepEqual(validateCheckinDate('2028-02-29'), { ok: true, value: '2028-02-29' });
  for (const date of ['2026-02-29', '2026-04-31', '2026-13-01', '2026-1-01', '10/18/2026', '',
    '2026-10-18T00:00:00Z', '0001-01-01', 1792281600000, undefined]) {
    assert.equal(validateCheckinDate(date).ok, false);
  }
});

test('suggested first date is two weeks after routine start; later dates advance by calendar month', () => {
  for (const [input, expected] of [
    [{ routineStartedOn: '2026-10-18' }, '2026-11-01'],
    [{ routineStartedOn: '2026-01-01', previousMeetingOn: '2026-01-31' }, '2026-02-28'],
    [{ routineStartedOn: '2028-01-01', previousMeetingOn: '2028-01-31' }, '2028-02-29'],
    [{ routineStartedOn: '2026-01-01', previousMeetingOn: '2026-12-18' }, '2027-01-18'],
  ] as const) assert.deepEqual(recommendNextCheckinDate(input), { ok: true, value: expected });
  for (const input of [{ routineStartedOn: '2026-02-30' }, { routineStartedOn: '2026-10-18', previousMeetingOn: '2026-10-17' },
    { routineStartedOn: '9999-12-31' }, { routineStartedOn: '2026-01-01', previousMeetingOn: '9999-12-31' }]) {
    assert.equal(recommendNextCheckinDate(input).ok, false);
  }
});
