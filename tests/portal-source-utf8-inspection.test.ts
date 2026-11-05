import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {runInNewContext} from 'node:vm';
import {test} from 'node:test';
import {inspectSourceUtf8} from '../supabase/functions/concierge-sources/utf8-inspection.ts';
import type {SourceUtf8Inspection} from '../supabase/functions/concierge-sources/utf8-inspection.ts';

// This process has no network requirement, including failed/setup paths.
globalThis.fetch = async () => {throw new Error('external_fetch_denied');};

const digest = (bytes: Uint8Array): string => createHash('sha256').update(bytes).digest('hex');
const fixtures: readonly {name: string; bytes: readonly number[]; text: string; offsets: readonly number[]}[] = [
  {name: 'empty', bytes: [], text: '', offsets: [0]},
  {name: 'ASCII', bytes: [0x61, 0x62, 0x63], text: 'abc', offsets: [0, 1, 2, 3]},
  {name: 'non-ASCII', bytes: [0xc3, 0xa9, 0xe4, 0xb8, 0xad], text: 'é中', offsets: [0, 2, 5]},
  {name: 'decomposed and precomposed', bytes: [0x65, 0xcc, 0x81, 0xc3, 0xa9], text: 'e\u0301é', offsets: [0, 1, 3, 5]},
  {name: 'astral', bytes: [0xf0, 0x9f, 0x98, 0x80, 0x41], text: '😀A', offsets: [0, 4, 5]},
  {name: 'BOM', bytes: [0xef, 0xbb, 0xbf, 0x41], text: '\ufeffA', offsets: [0, 3, 4]},
  {name: 'BOM only', bytes: [0xef, 0xbb, 0xbf], text: '\ufeff', offsets: [0, 3]},
  {name: 'CRLF and lone CR', bytes: [0x41, 0x0d, 0x0a, 0x42, 0x0d, 0x43], text: 'A\r\nB\rC', offsets: [0, 1, 2, 3, 4, 5, 6]},
  {name: 'encoded replacement scalar', bytes: [0xef, 0xbf, 0xbd], text: '\ufffd', offsets: [0, 3]},
  {name: 'scalar extremes and NUL', bytes: [0, 0x7f, 0xc2, 0x80, 0xdf, 0xbf, 0xe0, 0xa0, 0x80, 0xed, 0x9f, 0xbf, 0xee, 0x80, 0x80, 0xef, 0xbf, 0xbf, 0xf0, 0x90, 0x80, 0x80, 0xf4, 0x8f, 0xbf, 0xbf], text: '\0\u007f\u0080\u07ff\u0800\ud7ff\ue000\uffff\u{10000}\u{10ffff}', offsets: [0, 1, 2, 4, 6, 9, 12, 15, 18, 22, 26]},
];

for (const fixture of fixtures) {
  // Catches byte re-encoding, normalization, UTF16 indexing, BOM loss and wrong digest inputs.
  test(`exact original bytes, hash and scalar boundaries: ${fixture.name}`, async () => {
    const bytes = Uint8Array.from(fixture.bytes);
    const result = await inspectSourceUtf8(bytes);
    assert.equal(result.text, fixture.text);
    assert.equal(result.sha256, digest(bytes));
    assert.equal(result.byteLength, bytes.byteLength);
    assert.equal(result.scalarCount, fixture.offsets.length - 1);
    assert.deepEqual(result.scalarByteOffsets, fixture.offsets);
    assert.deepEqual(Buffer.from(result.text, 'utf8'), Buffer.from(fixture.bytes));
    assert.equal(result.profile, 'source_utf8_v1');
    assert.equal(result.convention, 'unicode_scalar_utf8_half_open_v1');
    const scalars = [...fixture.text];
    // Independent Node decoder and literal boundaries compare EVERY half-open interval.
    for (let a = 0; a <= scalars.length; a++) {
      for (let b = a; b <= scalars.length; b++) {
        const start = result.scalarByteOffsets[a], end = result.scalarByteOffsets[b];
        assert.equal(typeof start, 'number');
        assert.equal(typeof end, 'number');
        assert.equal(Buffer.from(bytes.subarray(start, end)).toString('utf8'), scalars.slice(a, b).join(''));
      }
    }
  });
}

test('known SHA256 vectors use raw bytes, with no domain framing', async () => {
  assert.equal((await inspectSourceUtf8(new Uint8Array())).sha256, 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  assert.equal((await inspectSourceUtf8(new Uint8Array([97, 98, 99]))).sha256, 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
});

const malformed: readonly [string, readonly number[]][] = [
  ['wrong UTF16 encoding', [0xff, 0xfe, 0x61, 0]],
  ['isolated continuation', [0x80]], ['late continuation', [0x61, 0xbf]],
  ['two-byte overlong', [0xc0, 0x80]], ['two-byte overlong C1', [0xc1, 0xbf]],
  ['three-byte overlong', [0xe0, 0x80, 0x80]], ['four-byte overlong', [0xf0, 0x80, 0x80, 0x80]],
  ['truncated two', [0xc2]], ['truncated three', [0xe2, 0x82]], ['truncated four', [0xf0, 0x9f, 0x98]],
  ['wrong continuation', [0xe2, 0x28, 0xa1]],
  ['high surrogate', [0xed, 0xa0, 0x80]], ['low surrogate', [0xed, 0xbf, 0xbf]],
  ['above Unicode maximum', [0xf4, 0x90, 0x80, 0x80]], ['F5 leading byte', [0xf5, 0x80, 0x80, 0x80]],
  ['legacy five-byte encoding', [0xf8, 0x88, 0x80, 0x80, 0x80]], ['FF leading byte', [0xff]],
  ['malformed after BOM', [0xef, 0xbb, 0xbf, 0xc2]],
];

async function rejectsPrivate(bytes: unknown, message: string): Promise<void> {
  await assert.rejects(inspectSourceUtf8(bytes as Uint8Array), error => {
    assert.ok(error instanceof Error);
    assert.equal(error.message, message);
    assert.equal('cause' in error, false);
    assert.deepEqual(Object.keys(error), []);
    return true;
  });
}

for (const [name, bytes] of malformed) {
  // Catches replacement-mode decoding and acceptance of invalid Unicode scalar encodings.
  test(`native fatal decode refuses ${name}`, async () => {
    await rejectsPrivate(Uint8Array.from(bytes), 'source_utf8_invalid_encoding');
  });
}

test('accepts exactly 500000 original bytes with a complete bounded map', async () => {
  for (const text of ['a'.repeat(500000), '😀'.repeat(125000)]) {
    const bytes = Buffer.from(text, 'utf8');
    const result = await inspectSourceUtf8(bytes);
    const count = text.startsWith('a') ? 500000 : 125000;
    const stride = text.startsWith('a') ? 1 : 4;
    assert.equal(result.byteLength, 500000);
    assert.equal(result.text, text);
    assert.equal(result.sha256, digest(bytes));
    assert.equal(result.scalarCount, count);
    assert.equal(result.scalarByteOffsets.length, count + 1);
    for (let i = 0; i <= count; i++) assert.equal(result.scalarByteOffsets[i], i * stride);
  }
});

test('rejects max+1 actual bytes before decode, ignoring deceptive caller properties', async () => {
  const bytes = new Uint8Array(500001).fill(0xff);
  let reads = 0;
  Object.defineProperties(bytes, {
    byteLength: {get: () => {reads++; return 0;}},
    buffer: {get: () => {reads++; throw new Error('synthetic_private_name.txt');}},
    [Symbol.iterator]: {value: () => {reads++; throw new Error('synthetic_private_bytes');}},
  });
  await rejectsPrivate(bytes, 'source_utf8_byte_limit_exceeded');
  assert.equal(reads, 0);
});

test('honors exact subarray offset and length, including zero-length tail', async () => {
  const backing = new Uint8Array([0xff, 0xef, 0xbb, 0xbf, 0x41, 0xf0, 0x9f, 0x98, 0x80, 0xff]);
  const view = backing.subarray(1, 9);
  const result = await inspectSourceUtf8(view);
  assert.equal(result.text, '\ufeffA😀');
  assert.equal(result.byteLength, 8);
  assert.equal(result.sha256, digest(view));
  assert.deepEqual(result.scalarByteOffsets, [0, 3, 4, 8]);
  const empty = await inspectSourceUtf8(backing.subarray(10));
  assert.equal(empty.byteLength, 0);
  assert.deepEqual(empty.scalarByteOffsets, [0]);
  const large = new Uint8Array(500002).fill(0xff);
  large[250000] = 0x41;
  assert.equal((await inspectSourceUtf8(large.subarray(250000, 250001))).text, 'A');
});

test('captures bytes before native hashing await despite caller mutation and transfer', async () => {
  const caller = new Uint8Array([0xff, 0xef, 0xbb, 0xbf, 0x41, 0xf0, 0x9f, 0x98, 0x80, 0xff]);
  const view = caller.subarray(1, 9);
  const original = Buffer.from(view);
  const pending = inspectSourceUtf8(view);
  let settled = false;
  void pending.then(() => {settled = true;});
  assert.equal(settled, false);
  caller.fill(0x42);
  structuredClone(caller.buffer, {transfer: [caller.buffer]});
  assert.equal(caller.byteLength, 0);
  const result = await pending;
  assert.equal(result.sha256, digest(original));
  assert.equal(result.text, '\ufeffA😀');
  assert.deepEqual(result.scalarByteOffsets, [0, 3, 4, 8]);
  assert.equal(result.byteLength, 8);
});

test('initial invalid bytes cannot borrow a caller repair during an await', async () => {
  const caller = new Uint8Array([0xc0, 0x80]);
  const rejected = rejectsPrivate(caller, 'source_utf8_invalid_encoding');
  caller.set([0xc2, 0x80]);
  await rejected;
});

test('runtime type validation rejects lookalikes and proxies without evaluating their hooks', async () => {
  const bad: unknown[] = [null, undefined, '', 1, [], [65], {}, new ArrayBuffer(1), new DataView(new ArrayBuffer(1)), new Int8Array([65]), new Uint8ClampedArray([65]), new Uint16Array([65]), Object.create(Uint8Array.prototype)];
  let hooks = 0;
  bad.push(new Proxy(new Uint8Array([65]), {get: () => {hooks++; throw new Error('synthetic_private_proxy');}}));
  bad.push({get byteLength() {hooks++; throw new Error('synthetic_private_length');}, [Symbol.toStringTag]: 'Uint8Array'});
  for (const value of bad) await rejectsPrivate(value, 'source_utf8_invalid_input');
  assert.equal(hooks, 0);
});

test('genuine Uint8Array subclasses and cross-realm views use native slots, not overrides', async () => {
  class Bytes extends Uint8Array {}
  const bytes = new Bytes([0x41, 0xc3, 0xa9]);
  let hooks = 0;
  const poison = () => {hooks++; throw new Error('synthetic_private_override');};
  for (const key of ['buffer', 'byteLength', 'byteOffset', 'length', 'slice', 'subarray', 'constructor', Symbol.iterator, Symbol.toStringTag]) Object.defineProperty(bytes, key, {get: poison});
  const result = await inspectSourceUtf8(bytes);
  assert.equal(result.text, 'Aé');
  assert.deepEqual(result.scalarByteOffsets, [0, 1, 3]);
  assert.equal(hooks, 0);
  const otherRealm: unknown = runInNewContext('new Uint8Array([0x41, 0xc3, 0xa9])');
  assert.equal((await inspectSourceUtf8(otherRealm as Uint8Array)).text, 'Aé');
});

test('detached input is refused, including an originally empty view', async () => {
  for (const length of [0, 3]) {
    const bytes = new Uint8Array(length);
    structuredClone(bytes.buffer, {transfer: [bytes.buffer]});
    await rejectsPrivate(bytes, 'source_utf8_unstable_input');
  }
});

test('shared and growable shared memory is refused without a speculative snapshot', async t => {
  if (typeof SharedArrayBuffer === 'undefined') {t.skip('SharedArrayBuffer is unavailable in this runtime'); return;}
  for (const length of [0, 3]) await rejectsPrivate(new Uint8Array(new SharedArrayBuffer(length)), 'source_utf8_unstable_input');
  const growable = Object.getOwnPropertyDescriptor(SharedArrayBuffer.prototype, 'growable')?.get;
  if (growable) {
    const shared = Reflect.construct(SharedArrayBuffer, [3, {maxByteLength: 6}]) as SharedArrayBuffer;
    assert.equal(growable.call(shared), true);
    await rejectsPrivate(new Uint8Array(shared), 'source_utf8_unstable_input');
  }
});

test('resizable inputs are refused for fixed, length-tracking and out-of-bounds views', async t => {
  const resizable = Object.getOwnPropertyDescriptor(ArrayBuffer.prototype, 'resizable')?.get;
  if (!resizable) {t.skip('Resizable ArrayBuffer is unavailable in this runtime'); return;}
  const buffer = Reflect.construct(ArrayBuffer, [8, {maxByteLength: 16}]) as ArrayBuffer;
  assert.equal(resizable.call(buffer), true);
  const fixed = new Uint8Array(buffer, 4, 4), tracking = new Uint8Array(buffer);
  await rejectsPrivate(fixed, 'source_utf8_unstable_input');
  await rejectsPrivate(tracking, 'source_utf8_unstable_input');
  const resize = Reflect.get(ArrayBuffer.prototype, 'resize') as (this: ArrayBuffer, length: number) => void;
  resize.call(buffer, 2);
  assert.equal(fixed.byteLength, 0);
  await rejectsPrivate(fixed, 'source_utf8_unstable_input');
  await rejectsPrivate(tracking, 'source_utf8_unstable_input');
});

test('returned graph is deeply frozen, with no mutable byte aliases or authority fields', async () => {
  const bytes = new Uint8Array([0x41, 0xf0, 0x9f, 0x98, 0x80]);
  const result = await inspectSourceUtf8(bytes);
  assert.deepEqual(Object.keys(result).sort(), ['byteLength', 'convention', 'profile', 'scalarByteOffsets', 'scalarCount', 'sha256', 'text']);
  assert.ok(Object.isFrozen(result));
  assert.ok(Object.isFrozen(result.scalarByteOffsets));
  assert.ok(Array.isArray(result.scalarByteOffsets));
  assert.equal(Reflect.set(result, 'text', 'changed'), false);
  assert.equal(Reflect.set(result.scalarByteOffsets, '1', 999), false);
  assert.throws(() => (result.scalarByteOffsets as number[]).push(999), TypeError);
  bytes.fill(0);
  assert.equal(result.text, 'A😀');
  assert.deepEqual(result.scalarByteOffsets, [0, 1, 5]);
  const again = await inspectSourceUtf8(new Uint8Array([0x41, 0xf0, 0x9f, 0x98, 0x80]));
  assert.notEqual(again.scalarByteOffsets, result.scalarByteOffsets);
  for (const value of Object.values(result)) assert.equal(ArrayBuffer.isView(value), false);
});

// Compile-time consumer checks; never invoked and never use replacement declarations.
function readonlyConsumer(facts: SourceUtf8Inspection): void {
  // @ts-expect-error returned facts cannot be reassigned
  facts.text = 'changed';
  // @ts-expect-error offsets cannot be reassigned
  facts.scalarByteOffsets[0] = 1;
  // @ts-expect-error no mutable array API is exposed
  facts.scalarByteOffsets.push(1);
}
void readonlyConsumer;
