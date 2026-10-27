import {validatedReturnPath} from './navigation-return';
import { GoTrueClient, type Session } from '@supabase/auth-js';
import { demand, decode, SessionError, type AuthProvider, type Credentials, type Capabilities, type AdvisorContext } from './types';
import { PORTAL_ORIGIN, SUPABASE_ORIGIN, readBounded, parseCommand, object, safeCodes, uuid, type Operation } from './policy';
import type { FlowAuth, LegacyPair } from './auth-flow';
import type { WireResponse } from './protocol';
export function claims(token: string) { try {
    demand(token.length <= 16384);
    return object(JSON.parse(new TextDecoder().decode(decode(token.split('.')[1]))));
}
catch {
    throw new SessionError(401, 'session_ended');
} }
function assertPublicKey(key: string) {
    let publicKey = /^sb_publishable_[A-Za-z0-9_-]+$/.test(key);
    if (!publicKey && key.split('.').length === 3) {
        try {
            publicKey = claims(key).role === 'anon';
        }
        catch { /* Invalid legacy key. */ }
    }
    demand(publicKey, 503, 'configuration_missing');
}
function cleanSession(session: Session | null): Credentials {
    demand(session && typeof session.access_token === 'string' && typeof session.refresh_token === 'string' && session.refresh_token.length > 0 && session.refresh_token.length <= 8192, 401, 'session_ended');
    const jwt = claims(session.access_token);
    demand(jwt.iss === `${SUPABASE_ORIGIN}/auth/v1` && jwt.role === 'authenticated' && jwt.is_anonymous !== true && typeof jwt.exp === 'number' && jwt.exp > Date.now() / 1000, 401, 'session_ended');
    const ownerId = uuid(jwt.sub), providerSessionId = uuid(jwt.session_id);
    demand(session.user.id === ownerId, 401, 'session_ended');
    return { access_token: session.access_token, refresh_token: session.refresh_token, expires_at: jwt.exp, user: { id: ownerId }, providerSessionId };
}
export function hasCredentials(data: unknown, credentials: Credentials): boolean {
    const raw = JSON.stringify(data);
    if (raw.includes(credentials.access_token) || raw.includes(credentials.refresh_token))
        return true;
    const visit = (v: unknown): boolean => { if (v && typeof v === 'object')
        return Object.entries(v).some(([k, x]) => /^(access_?token|refresh_?token|provider_?token|provider_?refresh_?token|code_?verifier)$/i.test(k) || visit(x)); return typeof v === 'string' && /\/storage\/v1\/object\/sign\/|[?&](access_token|refresh_token|token)=/.test(v); };
    return visit(data);
}
export class SupabaseProvider implements AuthProvider, FlowAuth {
    constructor(private publicKey: string, private fetcher: typeof fetch = (input, init) => globalThis.fetch(input, init), private timeoutMs = 12000, private durableContext = false) { assertPublicKey(publicKey); }
    protected headers(token?: string) { return { 'Content-Type': 'application/json', apikey: this.publicKey, Authorization: `Bearer ${token ?? this.publicKey}`, Origin: PORTAL_ORIGIN }; }
    protected async response(url: string, init: RequestInit, max = 2000000): Promise<{
        status: number;
        headers: Headers;
        bytes: Uint8Array;
    }> {
        const controller = new AbortController(), timer = setTimeout(() => controller.abort(), this.timeoutMs);
        try {
            const response = await this.fetcher(url, { ...init, signal: controller.signal, redirect: 'manual', cache: 'no-store' });
            if (response.status >= 300 && response.status < 400) {
                await response.body?.cancel();
                throw new SessionError(503, 'unavailable');
            }
            return { status: response.status, headers: response.headers, bytes: await readBounded(response.body, max) };
        }
        catch {
            throw new SessionError(503, 'unavailable');
        }
        finally {
            clearTimeout(timer);
        }
    }
    protected sdk(values: Record<string, string> = {}) {
        const entries = new Map(Object.entries(values));
        let uncertain = false;
        const authFetch: typeof fetch = async (input, init) => {
            const raw = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
            const url = new URL(raw);
            demand(url.origin === SUPABASE_ORIGIN && /^\/auth\/v1\/(otp|token|user|logout)$/.test(url.pathname), 503, 'unavailable');
            try {
                const response = await this.response(url.href, init ?? {});
                if (response.status === 429 || response.status >= 500) {
                    uncertain = true;
                    return Response.json({ msg: 'session_transport_unavailable' }, { status: 400 });
                }
                return new Response(response.status === 204 || response.status === 205 ? null : response.bytes, { status: response.status, headers: response.headers });
            }
            catch {
                uncertain = true;
                return Response.json({ msg: 'session_transport_unavailable' }, { status: 400 });
            }
        };
        const client = new GoTrueClient({ url: `${SUPABASE_ORIGIN}/auth/v1`, headers: this.headers(), fetch: authFetch, flowType: 'pkce', detectSessionInUrl: false, autoRefreshToken: false, persistSession: true, storageKey: 'shelv-server-auth', skipAutoInitialize: true, debug: false,
            storage: { getItem: (k: string) => entries.get(k) ?? null, setItem: (k: string, v: string) => { entries.set(k, v); }, removeItem: (k: string) => { entries.delete(k); } } });
        const check = (error: unknown) => { if (uncertain)
            throw new SessionError(503, 'unavailable'); if (error)
            throw new SessionError(401, 'session_ended'); };
        return { client, check, values: () => Object.fromEntries(entries) };
    }
    async requestOtp(email: string, returnTo?:string) { const path=validatedReturnPath(returnTo,'advisor'); const { client, check, values } = this.sdk(); const { error } = await client.signInWithOtp({ email, options: { shouldCreateUser: false, emailRedirectTo: `${PORTAL_ORIGIN}${path}` } }); check(error); return values(); }
    async exchange(code: string, storage: Record<string, string>) { const { client, check } = this.sdk(storage); const { data, error } = await client.exchangeCodeForSession(code); check(error); const credentials = cleanSession(data.session); await this.context(credentials); return credentials; }
    async upgrade(pair: LegacyPair) {
        const { client, check } = this.sdk();
        const { data, error } = await client.setSession({ access_token: pair.accessToken, refresh_token: pair.refreshToken });
        check(error);
        const credentials = cleanSession(data.session);
        const source = claims(pair.accessToken);
        demand(source.sub === credentials.user.id && source.session_id === credentials.providerSessionId, 401, 'session_ended');
        await this.context(credentials);
        return credentials;
    }
    async refresh(credentials: Credentials) { const { client, check } = this.sdk(); const { data, error } = await client.refreshSession({ refresh_token: credentials.refresh_token }); check(error); const fresh = cleanSession(data.session); demand(fresh.user.id === credentials.user.id && fresh.providerSessionId === credentials.providerSessionId, 401, 'session_ended'); return fresh; }
    protected async json(url: string, token: string, body: unknown) {
        const response = await this.response(url, { method: 'POST', headers: this.headers(token), body: JSON.stringify(body) });
        let data: unknown;
        try {
            data = JSON.parse(new TextDecoder('utf-8', { fatal: true, ignoreBOM: false }).decode(response.bytes));
        }
        catch {
            throw new SessionError(503, 'unavailable');
        }
        if (response.status < 200 || response.status >= 300) {
            const value = data && typeof data === 'object' ? data as Record<string, unknown> : {};
            const code = typeof value.code === 'string' && safeCodes.has(value.code) ? value.code : response.status === 401 ? 'session_ended' : response.status === 403 ? 'forbidden' : 'unavailable';
            throw new SessionError([400, 401, 403, 404, 409, 413, 415, 429].includes(response.status) ? response.status : 503, code);
        }
        return data;
    }
    async context(credentials: Credentials): Promise<AdvisorContext> {
        const jwt = claims(credentials.access_token);
        demand(jwt.sub === credentials.user.id && jwt.session_id === credentials.providerSessionId && typeof jwt.exp === 'number' && jwt.exp > Date.now() / 1000, 401, 'session_ended');
        const context = object(await this.json(`${SUPABASE_ORIGIN}/rest/v1/rpc/concierge_advisor_session_context`, credentials.access_token, {}));
        demand(context.ownerId === credentials.user.id, 403, 'forbidden');
        let deadline: number | null | undefined;
        if (this.durableContext) {
            demand(context.providerSessionId === credentials.providerSessionId && context.role === 'advisor', 403, 'forbidden');
            deadline = context.sessionNotAfter === null ? null : typeof context.sessionNotAfter === 'string' ? Date.parse(context.sessionNotAfter) : NaN;
            demand(deadline === null || (Number.isFinite(deadline) && deadline > Date.now()), 401, 'session_ended');
        }
        const raw = object(context.capabilities);
        demand(['view', 'edit', 'publish', 'confirmPayments'].every(k => typeof raw[k] === 'boolean'), 503, 'unavailable');
        demand(raw.view === true, 403, 'forbidden');
        return { ownerId: credentials.user.id, providerSessionId: credentials.providerSessionId, ...(this.durableContext ? {sessionNotAfter: deadline} : {}), capabilities: { view: raw.view, edit: raw.edit as boolean, publish: raw.publish as boolean, confirmPayments: raw.confirmPayments as boolean } };
    }
    async logout(credentials: Credentials) {
        const { client, check } = this.sdk();
        // Auth JS's server sign-out method takes the ordinary user JWT. It calls /logout?scope=local;
        // no admin credential is used, and unlike signOut() it cannot implicitly refresh an expired session.
        const { error } = await client.admin.signOut(credentials.access_token, 'local');
        check(error);
    }
    protected edge(credentials: Credentials, service: string, command: unknown) { return this.json(`${SUPABASE_ORIGIN}/functions/v1/${service}`, credentials.access_token, command); }
    private async paymentEvidence(credentials:Credentials,evidenceId:string,v2:boolean,clientId?:string){
        // Reauthorize through the existing Edge/SQL guard on every descriptor and image read.
        const raw=await this.edge(credentials,'concierge-payments',{action:'evidence_url',evidenceId,...(v2?{schemaVersion:2}:{})});
        try{
            const descriptor=object(raw);demand(descriptor.evidenceId===evidenceId&&Number.isSafeInteger(descriptor.expiresInSeconds)&&Number(descriptor.expiresInSeconds)>0&&Number(descriptor.expiresInSeconds)<=60&&typeof descriptor.signedUrl==='string',503,'unavailable');
            const signed=new URL(descriptor.signedUrl),prefix='/storage/v1/object/sign/concierge-payment-evidence/';
            demand(signed.origin===SUPABASE_ORIGIN&&!signed.username&&!signed.password&&!signed.hash&&signed.searchParams.size===1&&signed.searchParams.getAll('token').length===1&&!!signed.searchParams.get('token')&&signed.pathname.startsWith(prefix),503,'unavailable');
            const parts=signed.pathname.slice(prefix.length).split('/');demand(parts.length===3,503,'unavailable');const owner=uuid(parts[0]);uuid(parts[1]);
            demand(!clientId||owner===clientId,503,'unavailable');const extension=['png','jpg'].find(ext=>parts[2]===`${evidenceId}.${ext}`);demand(extension,503,'unavailable');
            let paymentOptionId:string|null=null;if(v2){demand(descriptor.schemaVersion===2,503,'unavailable');paymentOptionId=descriptor.paymentOptionId===null?null:uuid(descriptor.paymentOptionId);}else demand(descriptor.schemaVersion!==2,503,'unavailable');
            return {signed,owner,extension,expiresInSeconds:Number(descriptor.expiresInSeconds),paymentOptionId};
        }catch{throw new SessionError(503,'unavailable');}
    }
    private async preview(credentials: Credentials, clientId: unknown, mode: unknown, expectedRevision: unknown) {
        const command = { action: 'advisor_preview_read_v2', clientId: uuid(clientId), mode, expectedRevision };
        parseCommand('operations', command);
        // Keep provider HTTP errors outside response validation so stale/missing/denied statuses survive.
        const response = await this.edge(credentials, 'concierge-operations', command);
        try {
            const envelope = object(response), clientView = object(envelope.clientView);
            demand(envelope.schemaVersion === 1 && envelope.mode === mode && uuid(envelope.clientId) === command.clientId);
            const revision = envelope.revision;
            demand(typeof revision === 'number' && Number.isSafeInteger(revision) && revision >= 0 && clientView.revision === revision);
            let draft: Record<string, unknown> | null = null;
            if (mode === 'draft') {
                draft = object(envelope.draft);
                demand(revision === expectedRevision && draft.savedRevision === revision);
                demand(typeof draft.intakeVersion === 'number' && Number.isSafeInteger(draft.intakeVersion) && draft.intakeVersion >= 1);
                object(draft.presentation);
                demand(Array.isArray(draft.recommendations));
            }
            else demand(envelope.draft === null);
            const payments = object(envelope.payments), checkins = object(envelope.checkins);
            demand(!hasCredentials(response, credentials));
            // The existing Edge handler owns full clinical/panel schemas; bind this envelope and expose only its public roots.
            return { schemaVersion: 1, mode, clientId: command.clientId, revision, clientView, draft, payments, checkins };
        }
        catch {
            throw new SessionError(503, 'unavailable');
        }
    }
    async perform(credentials: Credentials, capabilities: Capabilities, operation: Operation): Promise<WireResponse> {
        demand(capabilities.view, 403, 'forbidden');
        demand(operation.kind !== 'client-media' && operation.kind !== 'client-upload' && operation.kind !== 'walkthrough', 403, 'action_forbidden');
        let body: unknown;
        if (operation.kind === 'command') {
            parseCommand(operation.channel, operation.command);
            const action = operation.command.action;
            if (action === 'publish_v2' || action === 'publish_instruction_revision')
                demand(capabilities.publish, 403, 'forbidden');
            else if (action === 'confirm_payment' || action === 'reject_claim' || action === 'record_return_event' && ['retailer_funds_received','client_repaid'].includes(String(operation.command.status)))
                demand(capabilities.confirmPayments, 403, 'forbidden');
            else if (['save_intake_v2', 'save_draft_v2', 'save_meeting_note', 'issue_quote', 'set_next_checkin', 'add_meeting_note', 'send_advisor_reply','record_review','save_instruction_draft','record_purchase','record_return_event','cancel_service'].includes(String(action)))
                demand(capabilities.edit, 403, 'forbidden');
            if (action === 'advisor_photo_view') {
                const clientId = uuid(operation.command.clientId), photoId = uuid(operation.command.photoId);
                return { status: 200, body: { photoId, signedUrl: `${PORTAL_ORIGIN}/api/advisor/preview/photo?clientId=${clientId}&photoId=${photoId}`, expiresIn: 60 } };
            }
            if(action==='evidence_url'){
                const evidenceId=uuid(operation.command.evidenceId),v2=operation.command.schemaVersion===2,descriptor=await this.paymentEvidence(credentials,evidenceId,v2);
                body={evidenceId,signedUrl:`${PORTAL_ORIGIN}/api/advisor/media/evidence?clientId=${descriptor.owner}&evidenceId=${evidenceId}&view=${crypto.randomUUID()}${v2?'&v=2':''}`,expiresInSeconds:descriptor.expiresInSeconds,...(v2?{schemaVersion:2,paymentOptionId:descriptor.paymentOptionId}:{})};
            }else body = action === 'advisor_preview_read_v2'
                ? await this.preview(credentials, operation.command.clientId, operation.command.mode, operation.command.expectedRevision)
                : await this.edge(credentials, `concierge-${operation.channel}`, operation.command);
        }
        else if (operation.kind === 'preview') {
            uuid(operation.clientId);
            demand(['draft', 'published', 'payments', 'checkins'].includes(operation.mode));
            if (operation.mode === 'draft')
                demand(Number.isSafeInteger(operation.expectedRevision) && operation.expectedRevision! >= 0);
            const envelope = await this.preview(credentials, operation.clientId, operation.mode === 'draft' ? 'draft' : 'published', operation.mode === 'draft' ? operation.expectedRevision : null);
            body = operation.mode === 'payments' ? envelope.payments : operation.mode === 'checkins' ? envelope.checkins : envelope;
        }
        else if(operation.kind==='advisor-evidence'){
            const clientId=uuid(operation.clientId),evidenceId=uuid(operation.evidenceId),descriptor=await this.paymentEvidence(credentials,evidenceId,operation.schemaVersion===2,clientId);
            const response=await this.response(descriptor.signed.href,{method:'GET'},5242880),contentType=response.headers.get('content-type')?.split(';')[0];
            demand(response.status===200&&contentType===(descriptor.extension==='png'?'image/png':'image/jpeg'),503,'unavailable');return {status:200,bytes:response.bytes,contentType};
        }
        else {
            uuid(operation.clientId);
            uuid(operation.photoId);
            const { checkins } = await this.preview(credentials, operation.clientId, 'published', null);
            demand(Array.isArray(checkins.reports) && checkins.reports.some(raw => { const report = object(raw); return Array.isArray(report.photos) && report.photos.some(p => object(p).id === operation.photoId); }), 404, 'photo_unavailable');
            const descriptor = object(await this.edge(credentials, 'concierge-checkins', { action: 'advisor_photo_view', clientId: operation.clientId, photoId: operation.photoId }));
            demand(descriptor.photoId === operation.photoId && descriptor.expiresIn === 60 && typeof descriptor.signedUrl === 'string', 503, 'unavailable');
            const signed = new URL(descriptor.signedUrl);
            demand(signed.origin === SUPABASE_ORIGIN && !signed.username && !signed.password && !signed.hash && signed.searchParams.size === 1 && signed.searchParams.getAll('token').length === 1 && !!signed.searchParams.get('token'), 503, 'unavailable');
            const prefix = `/storage/v1/object/sign/concierge-checkin-photos/${operation.clientId}/`;
            demand(['jpg', 'png', 'webp'].some(ext => signed.pathname === `${prefix}${operation.photoId}.${ext}`), 503, 'unavailable');
            const response = await this.response(signed.href, { method: 'GET' }, 5242880);
            const contentType = response.headers.get('content-type')?.split(';')[0];
            demand(response.status === 200 && ['image/jpeg', 'image/png', 'image/webp'].includes(contentType ?? ''), 503, 'unavailable');
            return { status: 200, bytes: response.bytes, contentType: contentType! };
        }
        demand(!hasCredentials(body, credentials), 503, 'unavailable');
        return { status: 200, body };
    }
}
