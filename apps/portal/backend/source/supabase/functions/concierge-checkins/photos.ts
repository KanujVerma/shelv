import { checkinFailure, isCheckinUuid } from './validation.ts';
import type { CheckinResult } from './validation.ts';
export type CheckinPhotoAngle = 'front' | 'left' | 'right';
export type CheckinPhotoType = 'image/jpeg' | 'image/png' | 'image/webp';
export type ValidatedCheckinPhoto = Readonly<{
  requestId: string; angle: CheckinPhotoAngle; contentType: CheckinPhotoType;
  sizeBytes: number; sha256: string; body: Blob;
}>;
export function isCheckinPhotoAngle(value: unknown): value is CheckinPhotoAngle {
  return value === 'front' || value === 'left' || value === 'right';
}
function matchesSignature(type: string, bytes: Uint8Array): boolean {
  if (type === 'image/jpeg') return bytes.length >= 4 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
    && bytes[bytes.length - 2] === 255 && bytes[bytes.length - 1] === 217;
  if (type === 'image/png') return bytes.length >= 24 && [137,80,78,71,13,10,26,10].every((value, i) => bytes[i] === value)
    && String.fromCharCode(...bytes.subarray(12,16)) === 'IHDR';
  if (type === 'image/webp' && bytes.length >= 20) {
    const word = (start: number, end: number) => String.fromCharCode(...bytes.subarray(start,end));
    const length = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(4, true);
    return word(0,4) === 'RIFF' && word(8,12) === 'WEBP' && ['VP8 ', 'VP8L', 'VP8X'].includes(word(12,16))
      && length + 8 === bytes.length;
  }
  return false;
}

/** Signature/metadata validation only, not image decoding, diagnosis or photo processing. */
export async function validateCheckinPhoto(metadata: unknown, bytes: Uint8Array): Promise<CheckinResult<ValidatedCheckinPhoto>> {
  if (!(bytes instanceof Uint8Array)) return checkinFailure('invalid_input');
  if (bytes.length > 5 * 1024 * 1024) return checkinFailure('photo_too_large');
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return checkinFailure('invalid_input');
  const value = metadata as Record<string, unknown>;
  const fields = ['requestId', 'angle', 'contentType', 'sizeBytes'];
  if (Object.keys(value).length !== fields.length || !fields.every(key => Object.hasOwn(value, key))
    || !isCheckinUuid(value.requestId) || !isCheckinPhotoAngle(value.angle) || bytes.length === 0
    || value.sizeBytes !== bytes.length) return checkinFailure('invalid_input');
  if (typeof value.contentType !== 'string' || !matchesSignature(value.contentType, bytes)) return checkinFailure('unsupported_photo');
  // Copy synchronously before hashing. Blob owns immutable bytes for the later upload.
  const snapshot = new Uint8Array(bytes.length); snapshot.set(bytes);
  const body = new Blob([snapshot], { type: value.contentType });
  try {
    const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', snapshot));
    const sha256 = Array.from(digest, byte => byte.toString(16).padStart(2, '0')).join('');
    return { ok: true, value: Object.freeze({ requestId: value.requestId.toLowerCase(), angle: value.angle,
      contentType: value.contentType as CheckinPhotoType, sizeBytes: snapshot.length, sha256, body }) };
  } catch { return checkinFailure('unavailable'); }
}
