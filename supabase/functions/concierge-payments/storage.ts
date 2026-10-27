import {paymentBytes, paymentJson} from './body.ts';
import {paymentObject, paymentUuid} from './contract.ts';
import {MAX_PAYMENT_EVIDENCE_BYTES, PAYMENT_EVIDENCE_BUCKET, PAYMENT_EVIDENCE_READ_SECONDS, type PaymentStorage} from './evidence.ts';

type StorageConfiguration = {supabaseUrl: string; serviceKey: string; fetch?: typeof globalThis.fetch};
function fail(): never { throw new Error('unavailable'); }
function storagePath(path: string): string {
  try {
    const parts = path.split('/'); if (parts.length !== 3) fail(); paymentUuid(parts[0]); paymentUuid(parts[1]);
    const match = /^(.+)\.(png|jpg)$/.exec(parts[2]); if (!match) fail(); paymentUuid(match[1]); return path;
  } catch { return fail(); }
}
/** Server-only transport: private bucket, immutable uploads, no signed uploads, public URLs or logs. */
export function createPaymentStorage(config: StorageConfiguration): PaymentStorage {
  let base: URL;
  try {
    base = new URL(config.supabaseUrl);
    if (base.protocol !== 'https:' || base.username || base.password || base.pathname !== '/' || base.search || base.hash || !config.serviceKey.trim()) fail();
  } catch { return fail(); }
  const send = config.fetch ?? globalThis.fetch;
  const common = (signal?: AbortSignal): RequestInit => ({
    credentials:'omit', redirect:'error', cache:'no-store',
    signal:signal ? AbortSignal.any([signal,AbortSignal.timeout(15000)]) : AbortSignal.timeout(15000),
  });
  const headers = (contentType = 'application/json') => ({authorization:`Bearer ${config.serviceKey}`,apikey:config.serviceKey,'content-type':contentType});
  const objectUrl = (kind: string, path: string) => new URL(`/storage/v1/object/${kind}${PAYMENT_EVIDENCE_BUCKET}/${storagePath(path)}`,base).href;
  return {
    upload: async(path,bytes,contentType,signal) => {
      storagePath(path); if (bytes.byteLength === 0 || bytes.byteLength > MAX_PAYMENT_EVIDENCE_BYTES || !['image/png','image/jpeg'].includes(contentType)) fail();
      const response = await send(objectUrl('',path), {...common(signal),method:'POST',headers:{...headers(contentType),'x-upsert':'false','cache-control':'private, no-store, max-age=0'},body:new Uint8Array(bytes).buffer});
      if (response.ok) { await response.body?.cancel(); return; }
      let existing = response.status === 409;
      if (response.status === 400) {
        try { const error = paymentObject(await paymentJson(response.body,4096)); existing = error.statusCode === '409' && error.error === 'Duplicate'; }
        catch { fail(); }
      } else await response.body?.cancel();
      if (!existing) fail();
      // A lost upload response may be retried, but never overwrite an immutable
      // screenshot or treat a collision containing different bytes as success.
      const stored = await send(objectUrl('authenticated/',path),{...common(signal),method:'GET',headers:headers()});
      if (!stored.ok) { await stored.body?.cancel(); fail(); }
      let prior: Uint8Array;
      try { prior = await paymentBytes(stored.body,MAX_PAYMENT_EVIDENCE_BYTES); } catch { fail(); }
      if (prior.byteLength !== bytes.byteLength || prior.some((value,index)=>value !== bytes[index])) fail();
    },
    sign: async(path,expiresInSeconds,signal) => {
      storagePath(path); if (!Number.isInteger(expiresInSeconds) || expiresInSeconds < 1 || expiresInSeconds > PAYMENT_EVIDENCE_READ_SECONDS) fail();
      const response = await send(objectUrl('sign/',path),{...common(signal),method:'POST',headers:headers(),body:JSON.stringify({expiresIn:expiresInSeconds})});
      if (!response.ok) { await response.body?.cancel(); fail(); }
      let raw: Record<string,unknown>;
      try { raw = paymentObject(await paymentJson(response.body,8192)); } catch { return fail(); }
      if (typeof raw.signedURL !== 'string' || !raw.signedURL.startsWith('/object/sign/')) fail();
      const url = new URL(`/storage/v1${raw.signedURL}`,base);
      if (url.origin !== base.origin || url.pathname !== new URL(objectUrl('sign/',path)).pathname || !url.searchParams.get('token') || url.hash || url.username || url.password) fail();
      return url.href;
    },
  };
}
