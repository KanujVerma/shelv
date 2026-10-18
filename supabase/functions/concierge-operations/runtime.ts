import { readObject, readUuid, requireValue } from '../../../src/contracts/ConciergePortalValidation.ts';
import { readConciergeJson } from './body.ts';
import type { ConciergePorts } from './handler.ts';

type Configuration = { supabaseUrl: string; publicKey: string; allowedOrigins: readonly string[]; fetch?: typeof globalThis.fetch };

/** Native Auth/PostgREST transport. Configuration is server-owned, never request input. */
export function createConciergeSupabasePorts(config: Configuration): ConciergePorts {
  let base: URL;
  const allowedOrigins = [...config.allowedOrigins];
  try {
    base = new URL(config.supabaseUrl);
    requireValue(base.protocol === 'https:' && !base.username && !base.password && base.pathname === '/' && !base.search && !base.hash);
    requireValue(config.publicKey.trim().length > 0);
    for (const origin of allowedOrigins) {
      const url = new URL(origin);
      requireValue(['https:', 'http:'].includes(url.protocol) && url.origin === origin);
    }
  } catch { throw new Error('unavailable'); }
  const send = config.fetch ?? globalThis.fetch;
  const headers = (token: string) => ({ authorization: `Bearer ${token}`, apikey: config.publicKey, 'content-type': 'application/json' });
  const options = (token: string, signal?: AbortSignal): RequestInit => ({ headers: headers(token), credentials: 'omit', redirect: 'error', cache: 'no-store',
    signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(10000)]) : AbortSignal.timeout(10000) });
  const decode = async (response: Response, maximum = 2097152): Promise<unknown> => {
    try { return await readConciergeJson(response.body, maximum); } catch { throw new Error('unavailable'); }
  };
  return {
    allowedOrigins,
    authenticate: async (token, signal) => {
      const response = await send(new URL('/auth/v1/user', base).href, { ...options(token, signal), method: 'GET' });
      if (response.status === 401 || response.status === 403) { await response.body?.cancel(); return null; }
      if (!response.ok) { await response.body?.cancel(); throw new Error('unavailable'); }
      try {
        const user = readObject(await decode(response));
        requireValue(typeof user.is_anonymous === 'boolean');
        return { id: readUuid(user.id), is_anonymous: user.is_anonymous };
      } catch { throw new Error('unavailable'); }
    },
    rpc: async (token, call, signal) => {
      const response = await send(new URL(`/rest/v1/rpc/${call.name}`, base).href, { ...options(token, signal), method: 'POST', body: JSON.stringify(call.args) });
      // R1 returns complete immutable history without pagination or a SQL size cap.
      if (response.ok) return { data: await decode(response, Number.MAX_SAFE_INTEGER), error: null };
      let message: string | undefined;
      try { const value = readObject(await decode(response)); if (typeof value.message === 'string') message = value.message; } catch { /* Status still reports rejected sessions. */ }
      return { data: null, error: { status: response.status, ...(message === undefined ? {} : { message }) } };
    },
  };
}
