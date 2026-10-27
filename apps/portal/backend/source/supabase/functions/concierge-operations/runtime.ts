import { readObject, readUuid, requireValue } from '../../../src/contracts/ConciergePortalValidation.ts';
import type { ConciergeAuthenticatedPorts, ConciergeRpcCall } from '../../../src/contracts/ConciergePortal.ts';
import { readConciergeJson } from './body.ts';
import type { ConciergePorts } from './handler.ts';

export type ConciergeTransportConfiguration = { supabaseUrl: string; publicKey: string; allowedOrigins: readonly string[]; fetch?: typeof globalThis.fetch };

/** Native Auth/PostgREST transport. Configuration is server-owned, never request input. */
export function createConciergeAuthenticatedPorts<Call extends { name: string; args: object }>(
  config: ConciergeTransportConfiguration & { allowedRpcNames: readonly Call['name'][] },
): ConciergeAuthenticatedPorts<Call> {
  let base: URL;
  const allowedOrigins = [...config.allowedOrigins];
  const allowedRpcNames = new Set<string>(config.allowedRpcNames);
  try {
    base = new URL(config.supabaseUrl);
    requireValue(base.protocol === 'https:' && !base.username && !base.password && base.pathname === '/' && !base.search && !base.hash);
    requireValue(config.publicKey.trim().length > 0);
    requireValue(allowedRpcNames.size > 0 && [...allowedRpcNames].every(name => /^concierge_[a-z0-9_]{1,90}$/.test(name)));
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
      if (!allowedRpcNames.has(call.name)) throw new Error('unavailable');
      const response = await send(new URL(`/rest/v1/rpc/${call.name}`, base).href, { ...options(token, signal), method: 'POST', body: JSON.stringify(call.args) });
      // R1 returns complete immutable history without pagination or a SQL size cap.
      if (response.ok) return { data: await decode(response, Number.MAX_SAFE_INTEGER), error: null };
      let message: string | undefined;
      try { const value = readObject(await decode(response)); if (typeof value.message === 'string') message = value.message; } catch { /* Status still reports rejected sessions. */ }
      return { data: null, error: { status: response.status, ...(message === undefined ? {} : { message }) } };
    },
  };
}

/** Operations callers use this fixed server-owned RPC registry. */
export function createConciergeSupabasePorts(config: ConciergeTransportConfiguration): ConciergePorts {
  return createConciergeAuthenticatedPorts<ConciergeRpcCall>({ ...config,
    allowedRpcNames: ['concierge_advisor_preview_v2','concierge_client_view_v2','concierge_advisor_view_v2','concierge_presentation_write','concierge_client_view', 'concierge_advisor_view', 'concierge_write', 'concierge_advisor_directory', 'concierge_advisor_write'] });
}
