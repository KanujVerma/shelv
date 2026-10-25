export class PaymentHttpError extends Error {
  readonly status: number;
  constructor(code: string, status: number) { super(code); this.status = status; }
}
/** Only a failed Storage POST may race with an already completed exact upload. */
export class PaymentUploadPostError extends Error {
  constructor() { super('unavailable'); }
}
export async function paymentBytes(stream: ReadableStream<Uint8Array> | null, maximum: number): Promise<Uint8Array> {
  if (!stream) throw new PaymentHttpError('invalid_input', 400);
  const reader = stream.getReader(), chunks: Uint8Array[] = []; let size = 0;
  try {
    for (;;) {
      const result = await reader.read(); if (result.done) break;
      size += result.value.byteLength;
      if (size > maximum) { await reader.cancel(); throw new PaymentHttpError('too_large', 413); }
      chunks.push(result.value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return bytes;
}
export async function paymentJson(stream: ReadableStream<Uint8Array> | null, maximum = 16384): Promise<unknown> {
  const bytes = await paymentBytes(stream, maximum);
  try { return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)); }
  catch { throw new PaymentHttpError('invalid_input', 400); }
}
