import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readConciergeJson } from '../supabase/functions/concierge-operations/body.ts';

test('overflow refuses a body without waiting for an unresolved cancellation', async () => {
  let release: (() => void) | undefined, cancellations = 0;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) { controller.enqueue(new TextEncoder().encode('null ')); },
    cancel() { cancellations++; return new Promise<void>(resolve => { release = resolve; }); },
  });
  const result = readConciergeJson(stream, 4).then(
    value => ({ kind: 'value' as const, value }),
    error => ({ kind: 'error' as const, error: error as Error }),
  );
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const observed = await Promise.race([result, new Promise<{ kind: 'pending' }>(resolve => {
      timer = setTimeout(() => resolve({ kind: 'pending' }), 100);
    })]);
    assert.equal(observed.kind, 'error', 'overflow must not depend on cancellation acknowledgement');
    if (observed.kind === 'error') assert.equal(observed.error.message, 'too_large');
    assert.equal(cancellations, 1);
    assert.equal(stream.locked, false);
  } finally { clearTimeout(timer); release?.(); await result; }
});

for (const mode of ['reject', 'throw'] as const) {
  test(`overflow preserves too_large when cancellation will ${mode}`, async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) { controller.enqueue(new TextEncoder().encode('null ')); },
      cancel() {
        if (mode === 'throw') throw new Error('cleanup_failed');
        return Promise.reject(new Error('cleanup_failed'));
      },
    });
    await assert.rejects(readConciergeJson(stream, 4), { message: 'too_large' });
    assert.equal(stream.locked, false);
  });
}

test('a later cancellation rejection is observed after overflow is refused', async () => {
  let rejectCancellation: ((reason: Error) => void) | undefined;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) { controller.enqueue(new TextEncoder().encode('null ')); },
    cancel() { return new Promise<void>((_resolve, reject) => { rejectCancellation = reject; }); },
  });
  const rejection = assert.rejects(readConciergeJson(stream, 4), { message: 'too_large' });
  await Promise.resolve();
  rejectCancellation?.(new Error('late_cleanup_failed'));
  await rejection;
  await new Promise<void>(resolve => setImmediate(resolve));
  assert.equal(stream.locked, false);
});

test('the exact byte limit accepts a complete UTF8 value across chunks', async () => {
  const bytes = new TextEncoder().encode('"é"');
  const stream = new ReadableStream<Uint8Array>({ start(controller) {
    controller.enqueue(bytes.slice(0, 2)); controller.enqueue(bytes.slice(2)); controller.close();
  } });
  assert.equal(await readConciergeJson(stream, 4), 'é');
  assert.equal(stream.locked, false);
});

test('UTF8 bytes crossing the limit are refused before JSON decoding', async () => {
  let cancellations = 0;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) { controller.enqueue(new TextEncoder().encode('   ')); controller.enqueue(new TextEncoder().encode('é')); },
    cancel() { cancellations++; },
  });
  await assert.rejects(readConciergeJson(stream, 4), { message: 'too_large' });
  assert.equal(cancellations, 1);
  assert.equal(stream.locked, false);
});

test('invalid UTF8 inside the bound remains invalid_input', async () => {
  const stream = new ReadableStream<Uint8Array>({ start(controller) {
    controller.enqueue(new Uint8Array([0x22, 0xc3, 0x22])); controller.close();
  } });
  await assert.rejects(readConciergeJson(stream, 4), { message: 'invalid_input' });
  assert.equal(stream.locked, false);
});
