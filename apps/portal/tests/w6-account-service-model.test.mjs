import test from 'node:test';
import assert from 'node:assert/strict';
import { matchesCancellationDraft, serviceAmountLabel, serviceDateLabel } from '../src/features/account/service/model.ts';

const current = () => ({
  serviceRevision: 7, basisHash: 'a'.repeat(64), asOfDay: '2026-11-03',
  coverage: { status: 'active', paidSupportEndsOn: '2027-01-01' },
  periodEndCancellation: { state: 'available', supportEndsOn: '2027-01-01', readOnlyEndsOn: '2027-01-31' },
});
const draft = value => ({ current: value, supportEndsOn: '2027-01-01', readOnlyEndsOn: '2027-01-31', generation: 1 });

test('cancellation confirmation requires the exact current server basis and both reviewed exclusive dates', () => {
  const value = current(), review = draft(value);
  assert.equal(matchesCancellationDraft(value, review), true);
  for (const changed of [
    { ...value, serviceRevision: 8 }, { ...value, basisHash: 'b'.repeat(64) },
    { ...value, asOfDay: '2026-11-04' },
    { ...value, coverage: { ...value.coverage, status: 'cancelled' } },
    { ...value, coverage: { ...value.coverage, paidSupportEndsOn: '2027-02-01' } },
    { ...value, periodEndCancellation: { ...value.periodEndCancellation, readOnlyEndsOn: '2027-02-01' } },
    { ...value, periodEndCancellation: { state: 'unavailable', reason: 'already_cancelled' } },
  ]) assert.equal(matchesCancellationDraft(changed, review), false);
  assert.equal(matchesCancellationDraft(null, review), false);
  assert.equal(matchesCancellationDraft(value, null), false);
});

test('service dates display only real calendar dates and never invent an access boundary', () => {
  for (const day of ['2028-02-29', '2026-11-03']) assert.equal(serviceDateLabel(day), day);
  for (const unknown of [null, undefined, '', '2026-02-29', '2026-11-03T00:00:00Z'])
    assert.equal(serviceDateLabel(unknown), 'unavailable');
});

test('service amount display preserves historical paid amounts and keeps unknown separate from zero', () => {
  assert.equal(serviceAmountLabel(2500), '$25.00');
  assert.equal(serviceAmountLabel(10000), '$100.00');
  assert.equal(serviceAmountLabel(0), '$0.00');
  for (const unknown of [null, undefined, NaN, -1, 1.5, '10000'])
    assert.equal(serviceAmountLabel(unknown), 'unavailable');
});
