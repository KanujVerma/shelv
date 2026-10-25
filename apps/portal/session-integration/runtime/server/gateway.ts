import { demand, digest, randomId, SessionError, type SessionView } from './types';
import { PORTAL_ORIGIN, validateRequest, jsonBody, parseCommand, parsePreview, parseAdvisorEvidence, exact, safeError, readBounded, type Channel } from './policy';
import { parseClientCommand, parseClientMedia, validateClientUpload } from './client-policy';
import type { Completed, VaultCommand, VaultResult, WireResponse } from './protocol';
import type { AdvisorSessionObject } from '../workers/session-vault/index';
export type GatewayEnv = Omit<GatewayBindings, 'ADVISOR_SESSIONS' | 'CLIENT_SHARED_SESSIONS'> & {
    CLIENT_SHARED_SESSIONS?: string;
    ASSETS: Fetcher;
    ADVISOR_SESSIONS: DurableObjectNamespace<AdvisorSessionObject>;
};

const noStore = { 'Cache-Control': 'private, no-store', 'Pragma': 'no-cache', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' };
function json(body: unknown, status = 200, headers: HeadersInit = {}) { const h = new Headers(headers); for (const [k, v] of Object.entries(noStore))
    h.set(k, v); h.set('Content-Type', 'application/json; charset=utf-8'); return new Response(JSON.stringify(body), { status, headers: h }); }
function cookie(name: string, id: string) { return `${name}=${id}; Path=/; Secure; HttpOnly; SameSite=Lax`; }
function getCookie(request: Request, name: string) { const matches = (request.headers.get('cookie') ?? '').split(';').map(p => p.trim()).filter(p => p.startsWith(name + '=')); if (!matches.length)
    return undefined; demand(matches.length === 1, 401, 'session_ended'); const id = matches[0].slice(name.length + 1); demand(/^[A-Za-z0-9_-]{43}$/.test(id), 401, 'session_ended'); return id; }
async function call<T>(env: GatewayEnv, kind: 'session' | 'flow' | 'limit', id: string, command: VaultCommand, audience: 'advisor' | 'client' = 'advisor'): Promise<T> {
    const prefix = audience === 'client' ? 'client:' : '';
    const name = `${prefix}${kind}:${await digest(`${prefix}${kind}:${id}`)}`;
    const result = await env.ADVISOR_SESSIONS.getByName(name).invoke(audience === 'client' ? {...command, audience} : command) as VaultResult<T>;
    demand(result && typeof result.ok === 'boolean', 503, 'unavailable');
    if (!result.ok)
        throw new SessionError(result.error.status, result.error.code);
    return result.value;
}
async function rate(env: GatewayEnv, request: Request, scope: 'bootstrap' | 'otp' | 'auth', audience: 'advisor' | 'client' = 'advisor') {
    const ip = request.headers.get('cf-connecting-ip');
    demand(ip && ip.length <= 64, 503, 'configuration_missing');
    const result = await call<{
        allowed: boolean;
    }>(env, 'limit', `${Math.floor(Date.now() / 86400000)}:${ip}`, { type: 'limit', scope }, audience);
    demand(result.allowed, 429, 'rate_limited');
}
function createGateway(audience: 'advisor' | 'client') {
    const client = audience === 'client', base = `/api/${audience}/`;
    const SESSION = `__Host-shelv_${audience}`, FLOW = `${SESSION}_flow`;
function clearCookies() { const headers = new Headers();
    headers.append('Set-Cookie', `${cookie(SESSION, '')}; Max-Age=0`);
    headers.append('Set-Cookie', `${cookie(`__Host-shelv_${audience}_ending`, '')}; Max-Age=0`); return headers; }
    return { async fetch(request: Request, env: GatewayEnv): Promise<Response> {
        const dispatch = <T>(kind: 'session' | 'flow' | 'limit', id: string, command: VaultCommand) => call<T>(env, kind, id, command, audience);
        const throttle = (scope: 'bootstrap' | 'otp' | 'auth') => rate(env, request, scope, audience);
        const url = new URL(request.url);
        if (!url.pathname.startsWith(base))
            return env.ASSETS.fetch(request);
        let lockedControl = false, clearUnusableSession = false;
        try {
            const route = client ? url.pathname.replace('/api/client/', '/api/advisor/') : url.pathname;
            if (client) demand(env.CLIENT_SHARED_SESSIONS === 'true', 503, 'configuration_missing');
            const rawUpload = client && route === '/api/advisor/checkins/photos/upload';
            const known = ['/api/advisor/session', '/api/advisor/auth/request', '/api/advisor/auth/complete', '/api/advisor/session/upgrade', '/api/advisor/logout', '/api/advisor/operations', '/api/advisor/payments', '/api/advisor/checkins', '/api/advisor/admission', ...(!client ? ['/api/advisor/walkthroughs'] : [])];
            const media = client ? /^\/api\/advisor\/media\/(photo|evidence)$/.test(route) : route==='/api/advisor/media/evidence';
            const preview = !client && /^\/api\/advisor\/preview\/(draft|published|payments|checkins|photo)$/.test(route);
            demand((known.includes(route) && !(client && route.endsWith('/session/upgrade'))) || preview || media || rawUpload, 404, 'not_found');
            demand(request.method === ((route === '/api/advisor/session' || preview || media) ? 'GET' : 'POST'), 405, 'invalid_request');
            const multipart = client && request.method === 'POST' && ['/api/advisor/payments','/api/advisor/checkins'].includes(route) && request.headers.get('content-type')?.startsWith('multipart/form-data;');
            if (multipart || rawUpload) { const h = new Headers(request.headers); h.set('Content-Type','application/json'); validateRequest(new Request(request.url,{method:'POST',headers:h}),env.PORTAL_ORIGIN); }
            else validateRequest(request, env.PORTAL_ORIGIN);
            lockedControl = route === '/api/advisor/session';
            demand(env.ADVISOR_SESSIONS && typeof env.ADVISOR_SESSIONS.getByName === 'function' && env.PORTAL_ORIGIN === PORTAL_ORIGIN, 503, 'configuration_missing');
            if (!preview && !media)
                demand(url.search === '', 400, 'invalid_request');
            const fresh = route === '/api/advisor/session' && request.headers.get('x-shelv-new-flow') === '1';
            let sid: string | undefined, fid: string | undefined, staleSession = false;
            try { sid = getCookie(request, SESSION); } catch (error) { clearUnusableSession = lockedControl; if (!fresh) throw error; staleSession = true; }
            try { fid = getCookie(request, FLOW); } catch (error) { if (!fresh) throw error; }
            const csrf = request.headers.get('x-shelv-csrf') ?? '';
            const ending = (request.headers.get('cookie')??'').split(';').some(v=>v.trim().startsWith(`__Host-shelv_${audience}_ending=`));
            if (ending && route !== '/api/advisor/logout' && !(route === '/api/advisor/session' && request.headers.get('x-shelv-logout')==='1')) demand(false,401,'session_ended');
            if (route === '/api/advisor/session') {
                if (request.headers.get('x-shelv-logout') === '1') {
                    demand(sid || fid, 401, 'session_ended');
                    if (sid) {
                        try { return json(await dispatch('session', sid, { type: 'session.logout-context' })); }
                        catch (error) { if (error instanceof SessionError && error.status === 401) clearUnusableSession = true; if (!(error instanceof SessionError && error.status === 401 && fid)) throw error; }
                    }
                    return json(await dispatch('flow', fid!, { type: 'flow.logout-context' }), 200, clearUnusableSession ? clearCookies() : {});
                }
                let session: SessionView | null = null;
                if (sid) {
                    try { session = await dispatch<SessionView>('session', sid, { type: 'session.view' }); }
                    catch (error) { if (error instanceof SessionError && [401, 403].includes(error.status)) clearUnusableSession = true; if (!(fresh && clearUnusableSession)) throw error; staleSession = true; }
                }
                if (session && !fresh && request.headers.get('x-shelv-flow') !== '1')
                    return json({ signedIn: true, ...session });
                await throttle('bootstrap');
                const id = fid ?? randomId(), flow = await dispatch('flow', id, fresh
                    ? { type: 'flow.restart', ...(session && sid ? { preserveSessionId: sid } : {}) }
                    : { type: 'flow.bootstrap' });
                const headers = staleSession ? clearCookies() : new Headers();
                if (fresh || !fid) headers.append('Set-Cookie', cookie(FLOW, id));
                return json(session ? { signedIn: true, ...session, flow } : flow, 200, headers);
            }
            if (preview || media) {
                const operation = media ? (client?parseClientMedia(url):parseAdvisorEvidence(url)) : parsePreview(url);
                demand(sid, 401, 'session_ended');
                const result = await dispatch<WireResponse>('session', sid, { type: 'session.execute', ...(csrf ? { csrf } : {}), operation });
                return result.bytes ? new Response(result.bytes, { status: result.status, headers: { ...noStore, 'Content-Type': result.contentType ?? 'application/octet-stream' } }) : json(result.body, result.status);
            }
            if (rawUpload) {
                demand(sid,401,'session_ended');
                const h=request.headers;
                const revision=h.get('x-expected-revision')??''; demand(/^(0|[1-9][0-9]*)$/.test(revision));
                const operation=validateClientUpload('checkins',{action:'upload_photo',requestId:h.get('x-request-id'),completionRequestId:h.get('x-completion-request-id'),expectedRevision:Number(revision),angle:h.get('x-photo-angle')},await readBounded(request.body,5242880),h.get('content-type')??'');
                const result=await dispatch<WireResponse>('session',sid,{type:'session.execute',csrf,operation});
                return json(result.body,result.status);
            }
            if (multipart) {
                demand(sid,401,'session_ended');
                const bytes = await readBounded(request.body,5260000);
                const form = await new Response(bytes,{headers:{'Content-Type':request.headers.get('content-type')!}}).formData();
                demand([...form.keys()].length===2 && form.getAll('metadata').length===1 && form.getAll('file').length===1);
                const raw = form.get('metadata'), file = form.get('file');
                demand(typeof raw==='string' && raw.length <= 10000 && file && typeof file !== 'string');
                let metadata;try{metadata=JSON.parse(raw);}catch{demand(false);}
                const operation=validateClientUpload(route.slice('/api/advisor/'.length) as Channel,metadata,new Uint8Array(await file.arrayBuffer()),file.type);
                const result=await dispatch<WireResponse>('session',sid,{type:'session.execute',csrf,operation});
                return json(result.body,result.status);
            }
            const body = await jsonBody(request);
            if (route === '/api/advisor/logout') {
                exact(body, []);
                demand(sid || fid, 401, 'session_ended');
                let result: unknown, usedSession = false;
                if (sid) {
                    try { result = await dispatch('session', sid, { type: 'session.logout', csrf }); usedSession = true; }
                    catch (error) { if (!(error instanceof SessionError && error.status === 401 && fid)) throw error; }
                }
                if (!usedSession) result = await dispatch('flow', fid!, { type: 'flow.cancel', csrf });
                if (usedSession && fid)
                    await dispatch('flow', fid, { type: 'flow.retire' });
                return json(result, 200, clearCookies());
            }
            if (route === '/api/advisor/auth/request') {
                exact(body, client || Object.hasOwn(body, 'remember') ? ['email', 'remember'] : ['email']);
                if (client || Object.hasOwn(body, 'remember')) demand(typeof body.remember === 'boolean');
                demand(fid && typeof body.email === 'string', 401, 'flow_ended');
                await throttle('otp');
                return json(await dispatch('flow', fid, { type: 'flow.request', csrf, email: body.email, remember: body.remember === true }));
            }
            if (route === '/api/advisor/auth/complete' || route === '/api/advisor/session/upgrade') {
                demand(fid, 401, 'flow_ended');
                let command: VaultCommand;
                if (route.endsWith('/complete')) {
                    exact(body, ['code']);
                    demand(typeof body.code === 'string');
                    command = { type: 'flow.complete', csrf, code: body.code, ...(sid ? { existingId: sid } : {}) };
                }
                else {
                    exact(body, ['accessToken', 'refreshToken']);
                    demand(typeof body.accessToken === 'string' && typeof body.refreshToken === 'string');
                    command = { type: 'flow.upgrade', csrf, pair: { accessToken: body.accessToken, refreshToken: body.refreshToken }, ...(sid ? { existingId: sid } : {}) };
                }
                await throttle('auth');
                const result = await dispatch<Completed>('flow', fid, command);
                demand(/^[A-Za-z0-9_-]{43}$/.test(result.sessionId), 503, 'unavailable');
                const remaining = Math.floor((Date.parse(result.session.absoluteExpiresAt) - Date.now()) / 1000);
                if (client || result.session.remembered === true) demand(Number.isSafeInteger(remaining) && remaining > 0 && remaining <= (client ? 2592000 : 28800), 503, 'unavailable');
                return json({ signedIn: true, ...result.session }, 200, { 'Set-Cookie': cookie(SESSION, result.sessionId) + (result.session.remembered === true ? `; Max-Age=${remaining}` : '') });
            }
            const channel = route.slice('/api/advisor/'.length) as Channel, operation = client ? parseClientCommand(channel, body) : parseCommand(channel, body);
            demand(sid, 401, 'session_ended');
            const result = await dispatch<WireResponse>('session', sid, { type: 'session.execute', csrf, operation });
            return json(result.body, result.status);
        }
        catch (error) {
            const { status, code } = safeError(error);
            return json({ code }, status, lockedControl && clearUnusableSession && [401, 403].includes(status) ? clearCookies() : {});
        }
    } };
}
// Held advisor lifecycle stays available to explicit test fixtures only. The public
// client entry below cannot dispatch it, regardless of flags, cookies or bindings.
export const advisorGateway = /* @__PURE__ */ createGateway('advisor');
const clientGateway = createGateway('client');
export default { fetch(request: Request, env: GatewayEnv) {
    const path = new URL(request.url).pathname;
    if (path === '/api/advisor' || path.startsWith('/api/advisor/'))
        return Promise.resolve(json({ code: 'not_found' }, 404));
    return clientGateway.fetch(request, env);
} };
