const actions = { operations: ['advisor_preview_read_v2', 'advisor_list', 'advisor_read_v2', 'save_intake_v2', 'save_draft_v2', 'publish_v2', 'save_meeting_note'], payments: ['advisor_read', 'issue_quote', 'confirm_payment', 'reject_claim', 'evidence_url'], checkins: ['advisor_read', 'advisor_photo_view', 'set_next_checkin', 'add_meeting_note', 'send_advisor_reply'], admission: ['capabilities','add_client','admission_status'] };
export class CookieSessionError extends Error {
    constructor(status, code = 'unavailable') { super(status === 401 ? 'Your session has ended. Sign in again.' : status === 403 ? 'You do not have access to this action.' : 'We could not complete this request.'); this.status = status; this.code = /^[a-z_]{1,60}$/.test(code) ? code : 'unavailable'; }
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
    async _transport(path, { body, signal, csrf, headers = {} } = {}) {
        const controller = new AbortController(), timer = setTimeout(() => controller.abort(), this.timeoutMs), abort = () => controller.abort();
        if (signal?.aborted)
            abort();
        signal?.addEventListener('abort', abort, { once: true });
        try {
            const response = await this.fetcher(`/api/${this.audience}/${path}`, { method: body === undefined ? 'GET' : 'POST', headers: { ...headers, ...(body === undefined || body instanceof FormData || body instanceof Blob ? {} : { 'Content-Type': 'application/json' }), ...(csrf ? { 'X-Shelv-CSRF': csrf } : {}) }, ...(body === undefined ? {} : { body: body instanceof FormData || body instanceof Blob ? body : JSON.stringify(body) }), signal: controller.signal, credentials: 'same-origin', cache: 'no-store', redirect: 'error' });
            let data;
            try {
                data = await response.json();
            }
            catch {
                throw new CookieSessionError(503);
            }
            if (!response.ok)
                throw new CookieSessionError(response.status, data?.code);
            return data;
        }
        catch (error) {
            if (signal?.aborted)
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
    async sendLink(email, _redirect, remember = false) { if (this._pendingAdvisorLogout()) await this._finishAdvisorLogout(); await this.prepareFlow(); return this._fetch('auth/request', { body: { email, remember: remember === true }, csrf: this._flow.csrf }); }
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
    if (!Object.hasOwn(allowed, channel))
        throw new CookieSessionError(403, 'action_forbidden');
    return async (command, { signal } = {}) => {
        if (!command || typeof command !== 'object' || !allowed[channel].includes(command.action))
            throw new CookieSessionError(403, 'action_forbidden');
        const body = JSON.stringify(command);
        if (new TextEncoder().encode(body).length > 100000)
            throw new CookieSessionError(413, 'too_large');
        const lease = await session.acquire();
        try {
            const data = await session._fetch(channel, { body: command, signal, csrf: lease.csrf });
            if (!session.isCurrent(lease))
                throw new CookieSessionError(401);
            return data;
        }
        catch (error) {
            if (!session.isCurrent(lease))
                throw new CookieSessionError(401);
            if (error.status === 401)
                session._end();
            else if (error.status === 503)
                session.suspend();
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
