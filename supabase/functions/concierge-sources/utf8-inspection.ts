/** Server-internal inspection facts; these confer no Source authority or admission. */
export type SourceUtf8Inspection = Readonly<{
  profile: 'source_utf8_v1';
  convention: 'unicode_scalar_utf8_half_open_v1';
  sha256: string;
  byteLength: number;
  text: string;
  scalarCount: number;
  scalarByteOffsets: readonly number[];
}>;

// Engineering candidate bound only; no SourcePolicy/profile is enabled by this module.
const maxOriginalBytes = 500000;
const typedArrayPrototype: object = Object.getPrototypeOf(Uint8Array.prototype);
const nativeTag = Object.getOwnPropertyDescriptor(typedArrayPrototype, Symbol.toStringTag)?.get;
const nativeBuffer = Object.getOwnPropertyDescriptor(typedArrayPrototype, 'buffer')?.get;
const nativeLength = Object.getOwnPropertyDescriptor(typedArrayPrototype, 'byteLength')?.get;
const nativeOffset = Object.getOwnPropertyDescriptor(typedArrayPrototype, 'byteOffset')?.get;
const nativeBufferLength = Object.getOwnPropertyDescriptor(ArrayBuffer.prototype, 'byteLength')?.get;
const nativeResizable = Object.getOwnPropertyDescriptor(ArrayBuffer.prototype, 'resizable')?.get;

type Failure = 'invalid_input' | 'unstable_input' | 'byte_limit_exceeded' | 'invalid_encoding' | 'inspection_unavailable';
function fail(reason: Failure): never {
  // Never attach the input or an underlying exception/cause to this private error.
  throw new Error(`source_utf8_${reason}`);
}

function captureBytes(bytes: Uint8Array): Uint8Array<ArrayBuffer> {
  if (!nativeTag || !nativeBuffer || !nativeLength || !nativeOffset || !nativeBufferLength) fail('inspection_unavailable');
  let buffer: unknown, length: unknown, offset: unknown;
  try {
    // Intrinsic getters reject lookalikes/proxies and do not invoke caller hooks.
    if (nativeTag.call(bytes) !== 'Uint8Array') fail('invalid_input');
    length = nativeLength.call(bytes);
    offset = nativeOffset.call(bytes);
    buffer = nativeBuffer.call(bytes);
  } catch {
    fail('invalid_input');
  }
  if (typeof length !== 'number' || !Number.isSafeInteger(length) || length < 0 ||
      typeof offset !== 'number' || !Number.isSafeInteger(offset) || offset < 0) fail('invalid_input');
  // Must precede all content copies, decoding, hashing and mapping allocations.
  if (length > maxOriginalBytes) fail('byte_limit_exceeded');

  let bufferLength: unknown;
  try {
    // The ArrayBuffer getter's brand check refuses SharedArrayBuffer, even cross-realm.
    bufferLength = nativeBufferLength.call(buffer);
    if (nativeResizable?.call(buffer)) fail('unstable_input');
  } catch {
    fail('unstable_input');
  }
  if (typeof bufferLength !== 'number' || !Number.isSafeInteger(bufferLength) ||
      offset > bufferLength || length > bufferLength - offset) fail('unstable_input');

  let exactView: Uint8Array<ArrayBuffer>;
  try {
    // Also refuses a detached buffer with length/offset zero, unlike length getters.
    // The native buffer brand above justifies this type narrowing.
    exactView = new Uint8Array(buffer as ArrayBuffer, offset, length);
  } catch {
    fail('unstable_input');
  }
  try {
    // A fresh native view avoids caller iterators, methods, species and accessors.
    // A fixed, non-shared buffer cannot change concurrently during this sync copy.
    return new Uint8Array(exactView);
  } catch {
    fail('inspection_unavailable');
  }
}

/**
 * Inspects actual UTF-8 bytes only. The caller must separately establish format,
 * authority and any later proof linkage. No caller data is read after the await.
 */
export async function inspectSourceUtf8(bytes: Uint8Array): Promise<SourceUtf8Inspection> {
  const captured = captureBytes(bytes);
  const byteLength = captured.byteLength;
  if (typeof TextDecoder !== 'function') fail('inspection_unavailable');
  const decoder = new TextDecoder('utf-8', {fatal: true, ignoreBOM: true});
  let text: string;
  try {
    text = decoder.decode(captured);
  } catch {
    fail('invalid_encoding');
  }

  let scalarCount = 0;
  for (const _scalar of text) scalarCount++;
  if (!Number.isSafeInteger(scalarCount) || scalarCount > byteLength) fail('inspection_unavailable');
  // At most 500001 number slots. This is a code bound, not an Edge peak-memory claim.
  const offsets = new Array<number>(scalarCount + 1);
  offsets[0] = 0;
  let offset = 0;
  for (let scalar = 1; scalar <= scalarCount; scalar++) {
    const lead = captured[offset];
    if (lead === undefined) fail('inspection_unavailable');
    // Fatal native decoding has already proved canonical UTF-8 and valid scalars.
    const width = lead < 0x80 ? 1 : lead < 0xe0 ? 2 : lead < 0xf0 ? 3 : 4;
    if (width > byteLength - offset) fail('inspection_unavailable');
    offset += width;
    offsets[scalar] = offset;
  }
  if (offset !== byteLength) fail('inspection_unavailable');
  const scalarByteOffsets = Object.freeze(offsets);

  let hash: ArrayBuffer;
  try {
    // Native SHA256 receives the same owned exact bytes as decode/mapping.
    hash = await crypto.subtle.digest('SHA-256', captured);
  } catch {
    fail('inspection_unavailable');
  }
  if (hash.byteLength !== 32) fail('inspection_unavailable');
  const sha256 = Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, '0')).join('');
  return Object.freeze({
    profile: 'source_utf8_v1',
    convention: 'unicode_scalar_utf8_half_open_v1',
    sha256, byteLength, text, scalarCount, scalarByteOffsets,
  });
}
