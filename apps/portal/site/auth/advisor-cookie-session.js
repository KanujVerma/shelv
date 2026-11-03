import {advisorCommerceActions,COMMERCE_COMMAND_MAX_BYTES} from './commerce-actions.js';
import {navigationReturnTo} from './navigation-return.js';
import {advisorPlanActions,PLAN_COMMAND_MAX_BYTES} from './plan-actions.js';
import {advisorCareActions,CARE_COMMAND_MAX_BYTES} from './care-actions.js';
import {advisorReviewActions,advisorGuidanceActions,REVIEW_COMMAND_MAX_BYTES} from './review-actions.js';
// Denial provenance is private and can never authorize a success or private return.
const cookieHttpDenials = new WeakMap();
export function cookieDenialStatus(error, session, lease) {
    const origin = error && typeof error === 'object' ? cookieHttpDenials.get(error) : null;
    if (!origin || origin.session !== session || !lease) return null;
    const matches = () => origin.owner && origin.audience === session.audience && origin.role === origin.audience &&
        session.identity?.role === origin.audience && session.identity.ownerId === origin.owner &&
        origin.owner === lease.ownerId && origin.epoch === lease.localEpoch && session._epoch === origin.epoch &&
        session.generation === origin.generation && session._view?.generation === origin.serverGeneration &&
        origin.csrf === lease.csrf && session._view?.csrf === lease.csrf && ['ready','offline'].includes(session.status);
    if (!matches()) return null;
    let now;
    try { now = session.now?.() ?? Date.now(); } catch { return null; }
    return matches() && now < Math.min(Date.parse(session._view.idleExpiresAt), Date.parse(session._view.absoluteExpiresAt)) ? origin.status : null;
}
const actions = { operations: ['advisor_preview_read_v2', 'advisor_list', 'advisor_read_v2', 'save_intake_v2', 'save_draft_v2', 'publish_v2', 'save_meeting_note', 'service_advisor_read', 'record_review', 'save_instruction_draft', 'publish_instruction_revision', 'record_purchase', 'record_return_event', 'cancel_service'], payments: ['advisor_read', 'issue_quote', 'confirm_payment', 'reject_claim', 'evidence_url'], checkins: ['advisor_read', 'advisor_photo_view', 'set_next_checkin', 'add_meeting_note', 'send_advisor_reply'], admission: ['capabilities','add_client','admission_status'], walkthroughs:['library','open','share_list','share_create','share_revoke'],plans:advisorPlanActions,care:advisorCareActions,reviews:advisorReviewActions,guidance:advisorGuidanceActions,commerce:advisorCommerceActions };
actions.notifications = ['list_inbox_v1','mark_seen_v1','read_event_deliveries_v1','retry_failed_email_v1','request_status_v1'];
export class CookieSessionError extends Error {
    constructor(status, code = 'unavailable') { super(status === 401 ? 'Your session has ended. Sign in again.' : status === 403 ? 'You do not have access to this action.' : 'We could not complete this request.'); this.status = status; this.code = /^[a-z_]{1,60}$/.test(code) ? code : 'unavailable'; }
}
// Local cancellation only, with no status/code/authority or wire representation.
export class CookieRequestCancelled extends Error {
    constructor() { super('The operation was cancelled.'); this.name = 'AbortError'; }
}
// Inventory keeps its original default; own-client administration selects fixed limits.
async function photoInventoryJson(response,signal,current,maxBytes=8192){
    const reader=response.body?.getReader(),chunks=[];let length=0;
    const cancel=()=>{try{void reader?.cancel().catch(()=>{});}catch{}};
    let registering=false;
    try{
        registering=true;signal.addEventListener('abort',cancel,{once:true});
        current();
        if(reader)for(;;){
            const {done,value}=await reader.read();current();if(done)break;
            length+=value.byteLength;if(length>maxBytes){cancel();throw new CookieSessionError(503);}
            chunks.push(value);
        }
        current();const bytes=new Uint8Array(length);let offset=0;
        for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
        current();const value=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));current();return value;
    }finally{try{if(registering)signal.removeEventListener('abort',cancel);}finally{reader?.releaseLock();}}
}
export class CookieAdvisorSession {
    constructor({ fetcher = (...args) => globalThis.fetch(...args), onState = () => { }, timeoutMs = 15000, now = () => Date.now(), locks = globalThis.navigator?.locks, audience = 'advisor' } = {}) {
        this.audience = audience === 'client' ? 'client' : 'advisor';
        this.fetcher = fetcher;
        this.onState = onState;
        this.timeoutMs = timeoutMs;
        this.now = now;
        this.locks = locks;
        this.status = 'initial';
        this.identity = null;
        this.generation = 0;
        this._epoch = 0;
        this._view = null;
        this._flow = null;
        if (this.audience === 'advisor') {
            this._logoutKey = 'shelv:advisor:signout-pending';
            try {
                this._channel = new BroadcastChannel('shelv-advisor-cookie-events');
                this._channel.addEventListener('message', event => {
                    if (event.data?.type === 'logout') { this._logoutPending = true; this._logoutIntent = event.data.id; this._end(); }
                    if (event.data?.type === 'logout-complete' && event.data.id === this._logoutIntent) this._logoutPending = false;
                });
                this._channel.unref?.();
            } catch {}
            this._storageChanged = event => { if (event.key === this._logoutKey && event.newValue === '1') { this._logoutPending = true; this._end(); } };
            globalThis.addEventListener?.('storage', this._storageChanged);
        }
    }
    _emit() { this.onState({ status: this.status, role: this.identity ? this.audience : null, generation: this.generation, remembered: this._view?.remembered === true }); }
    _accept(data) {
        if (data?.signedIn === false) {
            this.identity = null;
            this._view = null;
            this._flow = data;
            this.status = 'signedout';
            this._emit();
            return false;
        }
        if (data?.signedIn !== true || typeof data.ownerId !== 'string' || !Number.isSafeInteger(data.generation) || data.capabilities?.view !== true || typeof data.csrf !== 'string' || !Number.isFinite(Date.parse(data.idleExpiresAt)) || !Number.isFinite(Date.parse(data.absoluteExpiresAt)))
            throw new CookieSessionError(503);
        // A response can remain in transit beyond the server's lease deadline.
        if (this.now() >= Math.min(Date.parse(data.idleExpiresAt), Date.parse(data.absoluteExpiresAt))) {
            this._end();
            throw new CookieSessionError(401);
        }
        if (this.identity?.ownerId !== data.ownerId || this._view?.csrf !== data.csrf) {
            this._epoch++;
            this.generation++;
        }
        this._view = { ownerId: data.ownerId, generation: data.generation, capabilities: { ...data.capabilities }, csrf: data.csrf, idleExpiresAt: data.idleExpiresAt, absoluteExpiresAt: data.absoluteExpiresAt, remembered: data.remembered === true };
        this.identity = { ownerId: data.ownerId, role: this.audience };
        if (data.flow)
            this._flow = data.flow;
        this.status = 'ready';
        this._scheduleDeadline();
        this._emit();
        return true;
    }
    async _coordinate(run, signal) {
        if (typeof this.locks?.request !== 'function')
            throw new CookieSessionError(503, 'coordination_unavailable');
        const controller = new AbortController(), timer = setTimeout(() => controller.abort(), this.timeoutMs), abort = () => controller.abort();
        if (signal?.aborted) abort();
        signal?.addEventListener('abort', abort, { once: true });
        try { return await this.locks.request(`shelv-${this.audience}-cookie-auth`, { mode: 'exclusive', signal: controller.signal }, () => run(controller.signal)); }
        catch (error) { if (signal?.aborted || error instanceof CookieSessionError) throw error; throw new CookieSessionError(503); }
        finally { clearTimeout(timer); signal?.removeEventListener('abort', abort); }
    }
    async _fetch(path, options = {}) {
        if (['session', 'auth/request', 'auth/complete', 'session/upgrade', 'logout'].includes(path))
            return this._coordinate(signal => this._transport(path, { ...options, signal }), options.signal);
        return this._transport(path, options);
    }
    async _transport(path, { body, signal, csrf, headers = {}, isApplicable } = {}) {
        let callerAborted = false;
        const controller = new AbortController(), timer = setTimeout(() => controller.abort(), this.timeoutMs), abort = () => {
            // Keep the first abort's provenance: a later caller cancellation
            // cannot turn an expired network deadline into an intentional abort.
            if (!controller.signal.aborted) { callerAborted = true; controller.abort(); }
        };
        if (signal?.aborted)
            abort();
        signal?.addEventListener('abort', abort, { once: true });
        const requestOrigin = {session:this,audience:this.audience,role:this.identity?.role,owner:this.identity?.ownerId,epoch:this._epoch,generation:this.generation,serverGeneration:this._view?.generation,csrf};
        const applicable = () => {
            if (isApplicable === undefined) return;
            // A prior deadline/caller abort keeps C9's first-abort provenance.
            if (controller.signal.aborted) throw new DOMException('The operation was aborted.', 'AbortError');
            if (isApplicable() !== true) throw new CookieRequestCancelled();
        };
        try {
            if (callerAborted) throw new DOMException('The operation was aborted.', 'AbortError');
            const init = { method: body === undefined ? 'GET' : 'POST', headers: { ...headers, ...(body === undefined || body instanceof FormData || body instanceof Blob ? {} : { 'Content-Type': 'application/json' }), ...(csrf ? { 'X-Shelv-CSRF': csrf } : {}) }, ...(body === undefined ? {} : { body: body instanceof FormData || body instanceof Blob ? body : JSON.stringify(body) }), signal: controller.signal, credentials: 'same-origin', cache: 'no-store', redirect: 'error' };
            const ownAdmin=this.audience==='client'&&['account-profile','account-contact','client-orders'].includes(path);
            const inventoryRead=this.audience==='client'&&path==='checkins'&&typeof init.body==='string'&&(()=>{try{return JSON.parse(init.body)?.action==='read_photo_inventory_v1';}catch{return false;}})();
            const inventoryCurrent=()=>{
                const matches=()=>this.status==='ready'&&this.audience==='client'&&this.identity?.role==='client'&&
                    this.identity.ownerId===requestOrigin.owner&&this._epoch===requestOrigin.epoch&&this.generation===requestOrigin.generation&&
                    this._view?.generation===requestOrigin.serverGeneration&&this._view?.csrf===requestOrigin.csrf;
                if(!matches())throw new CookieSessionError(401);
                if(ownAdmin&&this._view.capabilities.view!==true)throw new CookieSessionError(403,'forbidden');
                const now=this.now();if(!matches()||now>=Math.min(Date.parse(this._view.idleExpiresAt),Date.parse(this._view.absoluteExpiresAt)))throw new CookieSessionError(401);
                applicable();if(!matches())throw new CookieSessionError(401);
                if(ownAdmin&&this._view.capabilities.view!==true)throw new CookieSessionError(403,'forbidden');
                if(controller.signal.aborted)throw new DOMException('The operation was aborted.','AbortError');
            };
            // After serialization callbacks and actual acquire, immediately before fetch.
            applicable();
            const response = await this.fetcher(`/api/${this.audience}/${path}`, init);
            const authority = response.status === 401 || response.status === 403;
            const receivedBeforeAbort = !controller.signal.aborted;
            const responseError = code => {
                if (authority && !receivedBeforeAbort) return callerAborted ? new CookieRequestCancelled() : new CookieSessionError(503);
                const error = new CookieSessionError(response.status, code);
                if (authority) cookieHttpDenials.set(error, {...requestOrigin,status:response.status});
                return error;
            };
            if (authority && !receivedBeforeAbort) throw responseError();
            if (response.ok) applicable();
            // Notification authority denials survive unreadable or unfinishable bodies.
            if ((path === 'notifications'||inventoryRead||ownAdmin) && [401,403].includes(response.status)) {
                const error = responseError(response.status === 401 ? 'session_ended' : 'forbidden');
                try { void response.body?.cancel().catch(() => {}); } catch {}
                throw error;
            }
            let data;
            try {
                if(ownAdmin){data=await photoInventoryJson(response,controller.signal,inventoryCurrent,path==='client-orders'?2000000:16384);inventoryCurrent();}
                else if(inventoryRead&&response.ok)data=await photoInventoryJson(response,controller.signal,inventoryCurrent);
                else if (path === 'notifications') {
                    const reader = response.body?.getReader(), chunks = []; let length = 0, cancelRequested = false;
                    const cancel = () => {
                        if (cancelRequested) return;
                        cancelRequested = true;
                        try { void reader?.cancel().catch(() => {}); } catch {}
                    };
                    const readCurrent = () => {
                        applicable();
                        if (controller.signal.aborted) { cancel(); throw new DOMException('The operation was aborted.', 'AbortError'); }
                    };
                    try {
                        controller.signal.addEventListener('abort', cancel, {once:true});
                        readCurrent();
                        if (reader) for (;;) {
                            const {done,value} = await reader.read(); readCurrent(); if (done) break;
                            length += value.byteLength;
                            if (length > 100000) { cancel(); throw new CookieSessionError(503); }
                            chunks.push(value);
                        }
                    } finally {
                        try { controller.signal.removeEventListener('abort', cancel); }
                        finally { reader?.releaseLock(); }
                    }
                    readCurrent();
                    const bytes = new Uint8Array(length); let offset = 0;
                    for (const chunk of chunks) { bytes.set(chunk,offset); offset += chunk.byteLength; }
                    data = JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
                } else data = await response.json();
            }
            catch (error) {
                // Known HTTP denials/failures survive caller or deadline body cancellation.
                if (!response.ok && controller.signal.aborted && error?.name === 'AbortError')
                    throw responseError();
                if (authority) throw responseError();
                throw error;
            }
            if (!response.ok)
                throw responseError(data?.code);
            // A signal-ignoring fetcher/body cannot deliver success past either abort.
            if (controller.signal.aborted) throw new DOMException('The operation was aborted.', 'AbortError');
            applicable();
            return data;
        }
        catch (error) {
            if (callerAborted && error?.name === 'AbortError')
                throw error;
            if (error instanceof CookieRequestCancelled)
                throw error;
            if (error instanceof CookieSessionError)
                throw error;
            throw new CookieSessionError(503);
        }
        finally {
            clearTimeout(timer);
            signal?.removeEventListener('abort', abort);
        }
    }
    async restore() {
        if (this._pendingAdvisorLogout()) await this._finishAdvisorLogout();
        const epoch = this._epoch;
        try {
            const data = await this._fetch('session');
            if (epoch !== this._epoch)
                throw new CookieSessionError(401);
            this._accept(data);
            return this._view ? { ...this._view } : null;
        }
        catch (error) {
            if (epoch === this._epoch) {
                if (error.status === 401 || error.status === 403)
                    this._end();
                else if (error.status === 503)
                    this.suspend();
            }
            throw error;
        }
    }
    async prepareFlow() {
        const epoch = this._epoch;
        const data = await this._fetch('session', { headers: { 'X-Shelv-New-Flow': '1' } });
        if (epoch !== this._epoch)
            throw new CookieSessionError(401);
        if (data.signedIn) {
            this._accept(data);
            this._flow = data.flow;
        }
        else {
            this._flow = data;
        }
        if (typeof this._flow?.csrf !== 'string')
            throw new CookieSessionError(503);
        return { csrf: this._flow.csrf };
    }
    async sendLink(email, redirect, remember = false) { const returnTo=navigationReturnTo(redirect,this.audience); if (this._pendingAdvisorLogout()) await this._finishAdvisorLogout(); await this.prepareFlow(); return this._fetch('auth/request', { body: { email, remember: remember === true, ...(returnTo?{returnTo}:{}) }, csrf: this._flow.csrf }); }
    async complete(code) {
        if (this._pendingAdvisorLogout()) await this._finishAdvisorLogout();
        if (!this._flow) {
            const epoch = this._epoch;
            const data = await this._fetch('session', { headers: { 'X-Shelv-Flow': '1' } });
            if (epoch !== this._epoch)
                throw new CookieSessionError(401);
            this._flow = data.signedIn ? data.flow : data;
        }
        const epoch = this._epoch;
        const data = await this._fetch('auth/complete', { body: { code }, csrf: this._flow?.csrf });
        if (epoch !== this._epoch)
            throw new CookieSessionError(401);
        this._accept(data);
        return { ...this._view };
    }
    async upgrade(pair) { if (!this._flow)
        await this.prepareFlow(); const epoch = this._epoch; const data = await this._fetch('session/upgrade', { body: pair, csrf: this._flow.csrf }); if (epoch !== this._epoch)
        throw new CookieSessionError(401); this._accept(data); return { ...this._view }; }
    async acquire() {
        if (this._pendingAdvisorLogout()) { this._end(); throw new CookieSessionError(401); }
        if (this.status !== 'ready' || !this._view)
            throw new CookieSessionError(this.status === 'offline' ? 503 : 401);
        if (this.now() >= Math.min(Date.parse(this._view.idleExpiresAt), Date.parse(this._view.absoluteExpiresAt))) {
            await this.restore();
            if (!this._view || this.now() >= Math.min(Date.parse(this._view.idleExpiresAt), Date.parse(this._view.absoluteExpiresAt))) {
                this._end();
                throw new CookieSessionError(401);
            }
        }
        return { ...this._view, localEpoch: this._epoch };
    }
    isCurrent(lease) {
        // Timers may run late in a suspended/busy tab. Check at private-result
        // delivery, using the latest server-acknowledged idle deadline.
        if (this.status === 'ready' && this._view && this.now() >= Math.min(Date.parse(this._view.idleExpiresAt), Date.parse(this._view.absoluteExpiresAt))) this._end();
        return this.status === 'ready' && lease?.localEpoch === this._epoch && lease.ownerId === this.identity?.ownerId && lease.csrf === this._view?.csrf;
    }
    _applicability(lease, isApplicable, audience = this.audience) {
        if (isApplicable === undefined) return undefined;
        const current = () => {
            if (this.audience !== audience || this.identity?.role !== audience || !this.isCurrent(lease)) throw new CookieSessionError(401);
        };
        return () => {
            current();let applies = false;
            try { applies = typeof isApplicable === 'function' && isApplicable() === true; } catch {}
            current();return applies;
        };
    }
    _end() { clearTimeout(this._deadlineTimer); this._epoch++; this.generation++; this._view = null; this._flow = null; this.identity = null; this.status = 'signedout'; this._emit(); }
    suspend() { clearTimeout(this._deadlineTimer); this.status = 'offline'; this._emit(); }
    async _serverSignOut() {
        this._end();
        return this._coordinate(async signal => {
            // Cookie state may have changed in another tab while this call waited for the lock.
            // This metadata-only endpoint bypasses the operation queue, so logout stays prompt.
            const current = await this._transport('session', { signal, headers: { 'X-Shelv-Logout': '1' } });
            if (typeof current?.csrf !== 'string') throw new CookieSessionError(503);
            return this._transport('logout', { signal, body: {}, csrf: current.csrf });
        });
    }
    _scheduleDeadline() {
        clearTimeout(this._deadlineTimer);
        if (this.audience !== 'advisor' || !this._view) return;
        const epoch = this._epoch;
        const deadline = Math.min(Date.parse(this._view.idleExpiresAt),Date.parse(this._view.absoluteExpiresAt));
        this._deadlineTimer = setTimeout(() => {
            // A passive timer must never touch/extend the server idle lease. Focus or
            // an explicit user action can subsequently revalidate the cookie.
            if (this._epoch === epoch && this.status === 'ready') this._end();
        },Math.max(1,Math.min(2147483647,deadline-this.now())));
        this._deadlineTimer.unref?.();
    }
    _pendingAdvisorLogout() {
        if (this.audience !== 'advisor') return false;
        try { return this._logoutPending === true || globalThis.localStorage?.getItem(this._logoutKey) === '1' || /(?:^|;\s*)__Host-shelv_advisor_ending=1(?:;|$)/.test(globalThis.document?.cookie ?? ''); }
        catch { return this._logoutPending === true; }
    }
    _markAdvisorEnding(ending) {
        try { globalThis.document.cookie = `__Host-shelv_advisor_ending=${ending ? '1' : ''}; Path=/; Secure; SameSite=Lax; Max-Age=${ending ? 28800 : 0}`; } catch {}
    }
    async _finishAdvisorLogout() {
        let result;
        try { result = await this._serverSignOut(); } catch(error) { if(error.status !== 401) throw error; }
        this._logoutPending = false; this._markAdvisorEnding(false);
        try { globalThis.localStorage?.removeItem(this._logoutKey); } catch {}
        this._channel?.postMessage({type:'logout-complete',id:this._logoutIntent});
        return result;
    }
    async signOut() {
        if (this.audience !== 'advisor') return this._serverSignOut();
        this._logoutPending = true; this._logoutIntent = crypto.randomUUID(); this._end(); this._markAdvisorEnding(true);
        try { globalThis.localStorage?.setItem(this._logoutKey,'1'); } catch {}
        this._channel?.postMessage({type:'logout',id:this._logoutIntent});
        return this._finishAdvisorLogout();
    }
    dispose() { this._end(); this._channel?.close(); globalThis.removeEventListener?.('storage',this._storageChanged); }
    request(command, options) { return createCookieRequest('operations', this)(command, options); }
}
export function createCookieRequest(channel, session) {
    const allowed = session.actions ?? actions;
    const audience = session.audience;
    if (!Object.hasOwn(allowed, channel))
        throw new CookieSessionError(403, 'action_forbidden');
    if (channel === 'notifications') return notificationRequest(session, audience, allowed[channel]);
    return async (command, { signal, isApplicable } = {}) => {
        const typedReview = channel === 'reviews' || channel === 'guidance' || channel === 'commerce';
        const ownAdmin = audience === 'client' && ['account-profile','account-contact','client-orders'].includes(channel);
        if ((typedReview || ownAdmin) && command instanceof FormData)
            throw new CookieSessionError(403, 'action_forbidden');
        if (!command || typeof command !== 'object' || !allowed[channel].includes(command.action))
            throw new CookieSessionError(403, 'action_forbidden');
        const body = JSON.stringify(command);
        if (new TextEncoder().encode(body).length > (ownAdmin?8192:channel==='commerce'?COMMERCE_COMMAND_MAX_BYTES:channel==='plans'?PLAN_COMMAND_MAX_BYTES:channel==='care'?CARE_COMMAND_MAX_BYTES:typedReview?REVIEW_COMMAND_MAX_BYTES:100000))
            throw new CookieSessionError(413, 'too_large');
        const payload = typedReview || ownAdmin ? JSON.parse(body) : command;
        const lease = await session.acquire();
        const applicable = isApplicable === undefined ? undefined : session._applicability(lease, isApplicable, audience);
        try {
            if ((typedReview || ownAdmin || applicable) && !session.isCurrent(lease)) throw new CookieSessionError(401);
            if ((typedReview || ownAdmin || applicable) && signal?.aborted) throw new DOMException('The operation was aborted.', 'AbortError');
            const data = await session._fetch(channel, { body: payload, signal, csrf: lease.csrf, ...(applicable ? {isApplicable:applicable} : {}) });
            if (!session.isCurrent(lease))
                throw new CookieSessionError(401);
            if (applicable && applicable() !== true) throw new CookieRequestCancelled();
            if (ownAdmin && session._view?.capabilities.view !== true) throw new CookieSessionError(403,'forbidden');
            return data;
        }
        catch (error) {
            const denial = cookieDenialStatus(error,session,lease);
            if (denial === 401) { session._end(); throw error; }
            if (denial === 403) throw error;
            if (!session.isCurrent(lease))
                throw new CookieSessionError(401);
            // A caller-owned operation may have retired while this failure was
            // in flight. Genuine received denials above retain their priority.
            if (error instanceof CookieRequestCancelled || applicable && applicable() !== true)
                throw new CookieRequestCancelled();
            if (error.status === 503)
                session.suspend();
            throw error;
        }
    };
}
/** Notification bookkeeping is a write, but is not a clinical EDIT capability. */
function notificationRequest(session, audience, allowed) {
    return async (input, {signal,isApplicable} = {}) => {
        const actor = session.identity?.ownerId, epoch = session._epoch, generation = session.generation, serverGeneration = session._view?.generation;
        const same = () => session.audience === audience && session.identity?.role === audience && session.identity.ownerId === actor && session._epoch === epoch && session.generation === generation && session._view?.generation === serverGeneration;
        if (!same()) throw new CookieSessionError(401);
        let command;
        try {
            const body = JSON.stringify(input);
            if (typeof body !== 'string') throw new CookieSessionError(400,'invalid_input');
            if (new TextEncoder().encode(body).byteLength > 8192) throw new CookieSessionError(413,'too_large');
            command = JSON.parse(body);
        } catch(error) { if (!same()) throw new CookieSessionError(401); if (error instanceof CookieSessionError) throw error; throw new CookieSessionError(400,'invalid_input'); }
        if (!same()) throw new CookieSessionError(401);
        if (!command || !allowed.includes(command.action) || audience === 'client' && (command.action === 'read_event_deliveries_v1' || command.action === 'retry_failed_email_v1' || command.action === 'request_status_v1' && command.original?.action !== 'mark_seen_v1')) throw new CookieSessionError(403,'action_forbidden');
        const needsEdit = (command.action === 'request_status_v1' ? command.original?.action : command.action) === 'retry_failed_email_v1';
        const caps = () => session._view?.capabilities.view === true && (!needsEdit || session._view.capabilities.edit === true);
        if (!caps()) throw new CookieSessionError(403,'forbidden');
        const lease = await session.acquire();
        const current = () => { if (!same() || !session.isCurrent(lease)) throw new CookieSessionError(401); if (!caps()) throw new CookieSessionError(403,'forbidden'); };
        const applicable = () => {
            current(); let applies = true;
            try { applies = isApplicable === undefined || typeof isApplicable === 'function' && isApplicable() === true; } catch { applies = false; }
            current(); return applies;
        };
        try {
            current(); if (signal?.aborted) throw new CookieRequestCancelled();
            const data = await session._fetch('notifications',{body:command,signal,csrf:lease.csrf,isApplicable:applicable});
            current(); if (!applicable()) throw new CookieRequestCancelled(); return data;
        } catch(error) {
            const denial = cookieDenialStatus(error,session,lease);
            if (denial === 401) { session._end(); throw error; }
            if (denial === 403) throw error;
            current();
            // A cancelled or replaced operation has no session-wide side effects.
            if (signal?.aborted || error instanceof CookieRequestCancelled || !applicable()) throw new CookieRequestCancelled();
            if (error.status === 503) session.suspend();
            throw error;
        }
    };
}
// The integrator supplies a verified advisor-only pause/snapshot/retirement seam.
// No storage handle and no provider signOut callback are accepted here.
export async function upgradeLegacyAdvisor(legacy, cookie) {
    await legacy.pause();
    const pair = legacy.readPair();
    const session = await cookie.upgrade(pair);
    if (session.ownerId !== legacy.ownerId)
        throw new CookieSessionError(409, 'account_conflict');
    await legacy.retireLocal();
    return session;
}
