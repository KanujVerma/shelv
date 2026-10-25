import {GoTrueClient, navigatorLock, processLock} from './supabase-auth.js';
import {PortalStorage, sessionIdentity} from './storage.js';
import {PortalError} from '../advisor/api.js';

function authError(error) {
  if (error?.code === 'pkce_code_verifier_not_found') return new PortalError(401, 'pkce_verifier_missing');
  if (error?.status === 401 || error?.status === 403 || (error?.status >= 400 && error?.status < 500 && error?.status !== 429)) return new PortalError(401);
  return new PortalError(503);
}

export class PortalSession {
  constructor(config, fetcher = fetch, options = {}) {
    this.config = config;
    this.fetcher = async (input, init = {}) => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), options.requestTimeoutMs ?? 15000);
      const abort = () => controller.abort();
      if (init.signal?.aborted) abort();
      init.signal?.addEventListener('abort', abort, {once: true});
      try { return await fetcher(input, {...init, signal: controller.signal}); }
      finally { clearTimeout(timer); init.signal?.removeEventListener('abort', abort); }
    };
    this.now = options.now ?? (() => Date.now());
    this.onState = options.onState ?? (() => {}); this.generation = 0; this.tokenRevision = 0;
    this.identity = null; this.status = 'initial'; this._token = null; this._refreshToken = null; this._epoch = 0;
    this._ending = false; this._disposed = false; this._legacy = false; this._expiryTimer = null; this._lastVerified = null; this._verifySequence = 0;
    this.scope = `shelv:portal:auth:v2:${encodeURIComponent(config.authUrl)}`;
    this.legacyKey = `shelv:concierge:session:v1:${encodeURIComponent(config.authUrl)}`;
    this.storage = new PortalStorage({...options, scope: this.scope, now: this.now,
      onCredential: raw => this.verify(raw, {force: true}), onLogout: (ownerId, rawSnapshot) => { void this.signOut({broadcast: false, rawSnapshot}); }});
    const lockName = `${this.scope}:sdk-lock`;
    const lock = (name, timeout, fn) => (globalThis.navigator?.locks ? navigatorLock : processLock)(lockName, timeout, fn);
    this.auth = new GoTrueClient({url: `${config.authUrl}/auth/v1`,
      headers: {apikey: config.publishableKey, Authorization: `Bearer ${config.publishableKey}`},
      fetch: async (...args) => {
        try {
          const response = await this.fetcher(...args);
          const url = new URL(typeof args[0] === 'string' ? args[0] : args[0].url);
          if (response.status >= 500 || response.status === 429) this.suspend();
          else if (url.pathname.endsWith('/token') && url.searchParams.get('grant_type') === 'refresh_token' && response.status >= 400) {
            const ownerId = this.identity?.ownerId ?? this.storage.current?.ownerId ?? this.storage.binding?.ownerId;
            if (ownerId) this.storage.clearAccount(ownerId);
            this.end('signedout');
            void this.auth.stopAutoRefresh();
          }
          return response;
        } catch (error) { this.suspend(); throw error; }
      }, storage: this.storage,
      // The adapter owns all real keys/namespaces. An empty internal key also
      // disables the SDK's optional session-bearing BroadcastChannel. Our
      // separate logout channel carries identifiers only. Pinned SDK contract
      // tests cover this; no SDK internals or rotation code are modified.
      storageKey: '', persistSession: true, autoRefreshToken: true, flowType: 'pkce',
      detectSessionInUrl: false, skipAutoInitialize: true, debug: false, lock, lockAcquireTimeout: -1});
    const {data} = this.auth.onAuthStateChange((event, raw) => {
      if (this._ending || this._disposed) return;
      if (event === 'SIGNED_OUT') this.end('signedout');
      // The storage callback already validated new pairs before durable commit.
      // Never await SDK session operations from a subscriber holding its lock.
      else if (raw && !this.storage.current) queueMicrotask(() => { if (!this._ending) this.end('signedout'); });
    });
    this.subscription = data.subscription;
  }

  get remembered() { return this.storage.remembered; }
  get token() { return this.status === 'ready' && this.now() < this.expiresAt ? this._token : null; }
  emit() {
    if (this._disposed) return;
    const state = {status: this.status, generation: this.generation, role: this.identity?.role ?? null,
      remembered: this.remembered, durableAvailable: this.storage.durableAvailable, ambiguous: this.storage.ambiguous};
    queueMicrotask(() => { if (!this._disposed) this.onState(state); });
  }
  suspend() {
    if (this._ending || this._disposed || this.status === 'signedout') return;
    this.status = 'offline'; this.lastError = new PortalError(503); this.emit();
  }
  async role(token) {
    const request = async action => {
      let response;
      try { response = await this.fetcher(this.config.operationsUrl, {method: 'POST',
        headers: {apikey: this.config.publishableKey, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json'},
        body: JSON.stringify({action}), credentials: 'omit', cache: 'no-store', redirect: 'error'}); }
      catch { throw new PortalError(503); }
      if (!response.ok) throw new PortalError(response.status);
      try { return await response.json(); } catch { throw new PortalError(503); }
    };
    try {
      const directory = await request('advisor_list');
      if (directory?.capabilities?.view !== true || !Array.isArray(directory.clients)) throw new PortalError(503);
      return 'advisor';
    } catch (error) {
      if (error.status !== 403) throw error;
      const client = await request('client_read_v2');
      if (!Number.isSafeInteger(client?.revision) || client.revision < 0) throw new PortalError(503);
      return 'client';
    }
  }
  async verify(raw, {force = false} = {}) {
    if (this._disposed || this._ending) return false;
    if (!force && this._lastVerified === raw?.access_token && this.status === 'ready') return true;
    const epoch = this._epoch, check = ++this._verifySequence, identity = sessionIdentity(raw);
    try {
      if (!identity || identity.issuer !== `${this.config.authUrl}/auth/v1` || identity.expiresAt <= this.now()) throw new PortalError(401);
      if (this.identity && (identity.ownerId !== this.identity.ownerId || identity.sessionId !== this.identity.sessionId)) {
        this.clearExpiryTimer(); this.generation++; this.identity = null; this._token = null; this.status = 'checking'; this.emit();
      }
      const {data, error} = await this.auth.getUser(raw.access_token);
      if (error) throw authError(error);
      if (!data?.user || data.user.is_anonymous === true || data.user.id !== identity.ownerId) throw new PortalError(403);
      const role = await this.role(raw.access_token);
      if (epoch !== this._epoch || this._ending || this._disposed || this.storage.blocked) return false;
      if (check !== this._verifySequence) return this.status === 'ready' && this.identity?.ownerId === identity.ownerId && this.identity?.sessionId === identity.sessionId;
      if (!this.identity || this.identity.role !== role) this.generation++;
      this.identity = {...identity, role};
      if (this._token !== raw.access_token || this._refreshToken !== raw.refresh_token) this.tokenRevision++;
      this._refreshToken = raw.refresh_token;
      this._token = raw.access_token; this.expiresAt = identity.expiresAt; this._lastVerified = raw.access_token;
      if (!this.storage.authorize({...identity, role, remember: this.storage.remember && !this._legacy && !!raw.refresh_token})) {
        await this.storage.removeItem('');
        if (epoch === this._epoch) this.end('signedout');
        return false;
      }
      this.status = 'ready'; this.lastError = null; this.armLegacyExpiry(); this.emit(); return true;
    } catch (error) {
      if (epoch !== this._epoch || this._ending || this._disposed) return false;
      if (check !== this._verifySequence) return this.status === 'ready' && this.identity?.ownerId === identity?.ownerId && this.identity?.sessionId === identity?.sessionId;
      this.lastError = error instanceof PortalError ? error : new PortalError(503);
      if (this.lastError.status === 401 || this.lastError.status === 403) {
        const owner = identity?.ownerId ?? this.identity?.ownerId;
        if (owner) this.storage.clearAccount(owner);
        this.end('signedout');
      } else this.suspend();
      return false;
    }
  }
  async sendLink(email, redirect, remember = false) {
    if (!this.config.enabled) throw new PortalError(503);
    this.storage.prepareLogin(remember);
    const {error} = await this.auth.signInWithOtp({email, options: {emailRedirectTo: redirect, shouldCreateUser: false}});
    if (error) throw authError(error);
  }
  async accept(callback = {}) {
    if (callback.error) { this.end('signedout'); throw new PortalError(401); }
    this.clearExpiryTimer();
    this.status = 'checking'; this.emit();
    // Explicit initialization follows synchronous callback scrubbing and the
    // restoration policy; it also installs the SDK's visibility/refresh loop.
    await this.auth.initialize();
    const kind = callback.kind ?? (callback.code ? 'pkce' : callback.tokenHash ? 'token_hash' : callback.accessToken ? 'implicit' : null);
    let result;
    if (kind) {
      this._legacy = false;
      this._epoch++; this.generation++; this.identity = null; this._token = null; this._refreshToken = null; this._lastVerified = null;
      const preference = this.storage.callbackPreference(kind);
      this.storage.beginAuthentication(preference);
      if (kind === 'pkce') result = await this.auth.exchangeCodeForSession(callback.code);
      else if (kind === 'token_hash') result = await this.auth.verifyOtp({token_hash: callback.tokenHash, type: 'email'});
      else if (callback.refreshToken) result = await this.auth.setSession({access_token: callback.accessToken, refresh_token: callback.refreshToken});
      else {
        // Older valid access-only links remain usable until their original
        // expiry. They cannot acquire a made-up refresh token or be remembered.
        this._legacy = true;
        const identity = sessionIdentity({access_token: callback.accessToken});
        if (!identity) throw new PortalError(401);
        await this.storage.setItem('', JSON.stringify({access_token: callback.accessToken, expires_at: identity.expiresAt / 1000}), {legacy: true});
        if (this.status !== 'ready') throw this.lastError ?? new PortalError(401);
        return true;
      }
    } else {
      let raw = this.storage.restore()?.raw ?? null;
      if (!raw) {
        try {
          const old = JSON.parse(this.storage.read(this.storage.tab, this.legacyKey));
          if (typeof old?.accessToken === 'string') raw = JSON.stringify({access_token: old.accessToken, expires_at: old.expiresAt / 1000});
        } catch { /* A missing/invalid old record is signed out. */ }
      }
      if (raw) {
        let record; try { record = JSON.parse(raw); } catch { /* SDK handles malformed records. */ }
        if (record?.access_token && !record.refresh_token) {
          this._legacy = true;
          if (!this.storage.binding) this.storage.beginAuthentication({remember: false});
          await this.storage.setItem('', raw, {legacy: true});
          if (this.status !== 'ready') throw this.lastError ?? new PortalError(401);
          this.storage.remove(this.storage.tab, this.legacyKey); return true;
        }
      }
      result = await this.auth.getSession();
    }
    if (result?.error) {
      const error = authError(result.error);
      if (error.status === 503) this.suspend(); else this.end('signedout');
      throw error;
    }
    const raw = result?.data?.session;
    if (!raw) { this.status = 'signedout'; this.emit(); return false; }
    this._legacy = false;
    if (!await this.verify(raw)) throw this.lastError ?? new PortalError(401);
    this.storage.remove(this.storage.tab, this.legacyKey); return true;
  }
  async acquire() {
    if (this._disposed || this._ending || !this.identity || this.status === 'signedout') throw new PortalError(401);
    if (this.status !== 'ready') throw new PortalError(503);
    if (!this._legacy) {
      const {data, error} = await this.auth.getSession();
      if (error) { if (authError(error).status === 503) this.suspend(); else this.end('signedout'); throw authError(error); }
      if (!data?.session) { this.end('signedout'); throw new PortalError(401); }
      if (!await this.verify(data.session)) throw this.lastError ?? new PortalError(401);
    }
    if (!this.token) { this.end('signedout'); throw new PortalError(401); }
    return {token: this._token, generation: this.generation, tokenRevision: this.tokenRevision,
      ownerId: this.identity.ownerId, sessionId: this.identity.sessionId};
  }
  isCurrent(lease) {
    return !this._ending && !this._disposed && !!this.identity && lease.generation === this.generation &&
      lease.ownerId === this.identity.ownerId && lease.sessionId === this.identity.sessionId;
  }
  async reject(lease) {
    if (this.isCurrent(lease) && lease.tokenRevision === this.tokenRevision) await this.signOut();
  }
  async recover() {
    if (this._disposed || this._ending) throw new PortalError(401);
    if (!this.identity && !this.storage.current) return this.accept();
    const result = this._legacy ? {data: {session: JSON.parse(this.storage.current.raw)}} : await this.auth.getSession();
    if (result.error) { const error = authError(result.error); if (error.status === 503) this.suspend(); else this.end('signedout'); throw error; }
    if (!result.data?.session) { this.end('signedout'); throw new PortalError(401); }
    if (!await this.verify(result.data.session, {force: true})) throw this.lastError ?? new PortalError(401);
    return true;
  }
  async refresh() {
    if (this._legacy) return this.recover();
    const {error} = await this.auth.refreshSession();
    if (error) throw authError(error);
    if (this.status !== 'ready') throw this.lastError ?? new PortalError(401);
    return true;
  }
  clearExpiryTimer() {
    clearTimeout(this._expiryTimer); this._expiryTimer = null;
  }
  armLegacyExpiry() {
    this.clearExpiryTimer();
    if (!this._legacy || !this.identity || this._disposed || this._ending) return;
    const epoch = this._epoch, generation = this.generation;
    const expire = () => {
      if (this._disposed || this._ending || !this._legacy || epoch !== this._epoch || generation !== this.generation) return;
      const remaining = this.expiresAt - this.now();
      if (remaining > 0) {
        this._expiryTimer = setTimeout(expire, Math.min(remaining, 2147483647));
        this._expiryTimer?.unref?.(); return;
      }
      // Invalidate this nonrefreshable session only. A different remembered
      // session of the same account must not be erased by an old tab's expiry.
      void this.storage.removeItem('');
      this.storage.remove(this.storage.tab, this.legacyKey);
      this.end('signedout'); void this.auth.stopAutoRefresh();
    };
    expire();
  }
  end(status) {
    this.clearExpiryTimer();
    this._epoch++; this.generation++; this.identity = null; this._token = null; this._refreshToken = null; this._lastVerified = null;
    this.status = status; this.emit();
  }
  async signOut({broadcast = true, rawSnapshot = null} = {}) {
    if (this._ending || this._disposed) return;
    this._ending = true;
    const raw = rawSnapshot ?? this.storage.current?.raw ?? null, token = this._token;
    const ownerId = this.identity?.ownerId ?? this.storage.current?.ownerId ?? this.storage.binding?.ownerId;
    this.end('signedout');
    if (ownerId) this.storage.clearAccount(ownerId, {broadcast});
    this.storage.remove(this.storage.tab, this.legacyKey);
    await this.auth.stopAutoRefresh();
    try {
      if (this._legacy) {
        // The SDK itself uses this same local-logout HTTP helper. Only the
        // current user's access JWT and public key are available here.
        if (token) await this.auth.admin.signOut(token, 'local');
      } else {
        this.storage.logoutSnapshot = raw;
        await this.auth.signOut({scope: 'local'});
      }
    } catch { /* Local fences/clearing never depend on logout transport. */ }
    finally { this.storage.logoutSnapshot = null; this._ending = false; }
  }
  dispose() {
    this.clearExpiryTimer();
    this._disposed = true; this._epoch++; this.generation++;
    void this.auth.stopAutoRefresh(); this.subscription?.unsubscribe(); this.storage.dispose();
  }
}
