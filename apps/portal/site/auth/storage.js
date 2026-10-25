// Credential storage is separate from authorization. Only PortalSession calls
// authorize(), after Auth and the portal backend have verified this identity.
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const intentLifetime = 60 * 60 * 1000;

export function sessionIdentity(session) {
  try {
    if (!session || typeof session.access_token !== 'string' || session.access_token.length > 16384) return null;
    const payload = session.access_token.split('.')[1];
    const claims = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(payload.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0))));
    if (!uuid.test(claims.sub) || !uuid.test(claims.session_id) || !Number.isSafeInteger(claims.exp)) return null;
    if (session.user?.id && session.user.id !== claims.sub) return null;
    return {ownerId: claims.sub, sessionId: claims.session_id, issuer: claims.iss, expiresAt: claims.exp * 1000};
  } catch { return null; }
}

function decodeRecord(raw) {
  try {
    if (typeof raw !== 'string' || raw.length > 100000) return null;
    const record = JSON.parse(raw), session = JSON.parse(record.raw), identity = sessionIdentity(session);
    if (record.version !== 1 || !identity || record.ownerId !== identity.ownerId || record.sessionId !== identity.sessionId) return null;
    if (!Number.isSafeInteger(record.revision) || record.revision < 0 || !Number.isFinite(record.savedAt)) return null;
    return record;
  } catch { return null; }
}

export class PortalStorage {
  constructor({scope, tab = () => globalThis.sessionStorage, durable = () => globalThis.localStorage,
    now = () => Date.now(), events = globalThis.window, channelFactory = name => new BroadcastChannel(name),
    onCredential = async () => {}, onLogout = () => {}, restore = true}) {
    this.scope = scope; this.tab = tab; this.durable = durable; this.now = now;
    this.onCredential = onCredential; this.onLogout = onLogout; this.current = null; this.binding = null;
    this.remember = false; this.remembered = false; this.ambiguous = false;
    this.allowRestore = restore; this.disposed = false; this.blocked = false; this.fresh = false;
    this.memory = new Map(); this.channel = null; this.events = events;
    this.tabKey = `${scope}:tab`; this.durablePrefix = `${scope}:remembered:`;
    this.intentKey = `${scope}:pkce`; this.logoutPrefix = `${scope}:logout:`;
    try { const s = durable(); s.setItem(`${scope}:probe`, '1'); s.removeItem(`${scope}:probe`); this.durableAvailable = true; }
    catch { this.durableAvailable = false; }
    if (channelFactory) try {
      this.channel = channelFactory(`${scope}:events`);
      this.channel.addEventListener('message', event => this.receive(event.data));
    } catch { /* Storage-event logout remains available. */ }
    this.storageListener = event => {
      if (event.key?.startsWith(this.logoutPrefix) && event.newValue) {
        const ownerId = event.key.slice(this.logoutPrefix.length);
        if (uuid.test(ownerId)) this.receive({type: 'logout', ownerId, scope: this.scope});
      }
    };
    events?.addEventListener('storage', this.storageListener);
  }

  read(store, key) { try { return store().getItem(key); } catch { return null; } }
  write(store, key, value) { try { store().setItem(key, value); return true; } catch { return false; } }
  remove(store, key) { try { store().removeItem(key); } catch { /* Already unavailable. */ } }
  tombstone(ownerId) {
    try { return JSON.parse(this.read(this.durable, this.logoutPrefix + ownerId))?.nonce ?? null; } catch { return null; }
  }
  valid(record) { return record && record.logoutNonce === this.tombstone(record.ownerId); }
  saveTab() {
    if (this.current) this.write(this.tab, this.tabKey, JSON.stringify(this.current));
    else this.remove(this.tab, this.tabKey);
  }
  rememberedRecords() {
    const records = [];
    try {
      const store = this.durable();
      for (let i = 0; i < store.length; i++) {
        const key = store.key(i);
        if (!key?.startsWith(this.durablePrefix)) continue;
        const record = decodeRecord(store.getItem(key));
        if (this.valid(record) && record.role === 'client' && record.remember === true) records.push(record);
      }
    } catch { /* A denied durable store is a session-only login. */ }
    return records;
  }
  invalidate(record = this.current ?? this.binding) {
    const notify = !this.blocked;
    if (record && !this.binding) this.binding = {...record};
    const context = this.binding ?? record, raw = this.current?.raw ?? context?.raw ?? null;
    this.blocked = true; this.allowRestore = false; this.current = null;
    this.remembered = false; this.remember = false; this.saveTab();
    // Keep the bound owner/session/nonce after dropping credentials. A delayed
    // notice and a late SDK write still belong to this invalidated generation.
    if (notify && context) this.onLogout(context.ownerId, raw);
  }
  restore() {
    if (this.disposed || this.blocked) return null;
    if (!this.current && this.allowRestore) {
      const tabRecord = decodeRecord(this.read(this.tab, this.tabKey));
      if (tabRecord && !this.valid(tabRecord)) { this.invalidate(tabRecord); return null; }
      if (tabRecord) this.current = tabRecord;
      else {
        this.remove(this.tab, this.tabKey);
        const records = this.rememberedRecords(); this.ambiguous = records.length > 1;
        if (records.length === 1) this.current = records[0];
      }
    }
    if (!this.current) return null;
    if (!this.valid(this.current) || (this.binding && !this.valid(this.binding))) {
      this.invalidate(); return null;
    }
    if (!this.binding) this.binding = {...this.current};
    if (this.current.ownerId !== this.binding.ownerId || this.current.sessionId !== this.binding.sessionId || this.current.logoutNonce !== this.binding.logoutNonce) {
      this.invalidate(); return null;
    }
    // The SDK lock surrounds reading, rotation and our verified commit.
    if (this.current.remember) {
      const latest = decodeRecord(this.read(this.durable, this.durablePrefix + this.current.ownerId));
      if (this.valid(latest) && latest.sessionId === this.binding.sessionId && latest.logoutNonce === this.binding.logoutNonce && latest.revision > this.current.revision) this.current = latest;
    }
    this.binding.raw = this.current.raw;
    this.remember = this.current.remember === true;
    this.saveTab(); return this.current;
  }
  async getItem(key) {
    if (this.disposed) return null;
    if (key === '') {
      if (this.logoutSnapshot) return this.logoutSnapshot;
      const record = this.restore();
      return record?.legacy ? null : record?.raw ?? null;
    }
    if (key === '-code-verifier') return this.intent()?.value ?? null;
    return this.memory.get(key) ?? null;
  }
  async setItem(key, value, {legacy = false} = {}) {
    if (this.disposed) return;
    if (key === '-code-verifier') {
      const intent = {value, remember: this.nextConsent === true, createdAt: this.now()};
      const raw = JSON.stringify(intent);
      if (!this.write(this.durable, this.intentKey, raw)) this.write(this.tab, this.intentKey, raw);
      this.memory.set(key, intent); return;
    }
    if (key !== '') { this.memory.set(key, value); return; }
    if (this.blocked) return;
    let session; try { session = JSON.parse(value); } catch { return; }
    const identity = sessionIdentity(session); if (!identity) return;
    const previous = this.restore(), same = previous?.ownerId === identity.ownerId && previous?.sessionId === identity.sessionId;
    if (this.blocked) return;
    // An absent/dropped record is never a new login. Only the explicit
    // authentication transition may bind a new owner/session/logout nonce.
    if (!this.fresh && (!same || !this.binding || !this.valid(this.binding))) {
      this.invalidate(); return;
    }
    const nonce = this.fresh ? this.tombstone(identity.ownerId) : this.binding.logoutNonce;
    this.current = {version: 1, raw: value, ownerId: identity.ownerId, sessionId: identity.sessionId,
      revision: same ? previous.revision : 0, savedAt: this.now(), logoutNonce: nonce,
      role: null, legacy, remember: this.fresh ? this.nextConsent === true : previous.remember === true};
    if (this.fresh) this.binding = {...this.current};
    else this.binding.raw = value;
    this.fresh = false; this.remember = this.current.remember; this.saveTab();
    // No durable credential write happens before the verified policy callback.
    await this.onCredential(session);
  }
  authorize({ownerId, sessionId, role, remember}) {
    if (this.disposed || this.blocked || !this.valid(this.binding) || !this.valid(this.current) || this.current.ownerId !== ownerId || this.current.sessionId !== sessionId || !['client', 'advisor'].includes(role)) return false;
    this.current.role = role;
    this.current.remember = role === 'client' && remember === true && !this.current.legacy;
    this.remember = this.current.remember;
    this.remembered = false;
    const key = this.durablePrefix + ownerId;
    if (this.current.remember) {
      const old = decodeRecord(this.read(this.durable, key));
      this.current.revision = Math.max(this.current.revision, old?.revision ?? 0) + 1;
      this.remembered = this.write(this.durable, key, JSON.stringify(this.current));
    } else this.remove(this.durable, key);
    this.saveTab(); return true;
  }
  prepareLogin(remember) { this.nextConsent = remember === true; }
  beginAuthentication(preference) {
    this.blocked = false; this.allowRestore = false; this.current = null; this.binding = null;
    this.nextConsent = preference?.remember === true; this.remember = this.nextConsent; this.fresh = true;
    this.saveTab();
  }
  intent() {
    let value;
    try {
      const raw = this.read(this.durable, this.intentKey) ?? this.read(this.tab, this.intentKey);
      value = raw === null ? this.memory.get('-code-verifier') : JSON.parse(raw);
    } catch { return null; }
    if (!value || typeof value.value !== 'string' || value.value.length > 4096 || !Number.isFinite(value.createdAt) || value.createdAt > this.now() + 60000 || this.now() - value.createdAt > intentLifetime) {
      this.remove(this.durable, this.intentKey); this.remove(this.tab, this.intentKey); this.memory.delete('-code-verifier'); return null;
    }
    return value;
  }
  callbackPreference(kind) { return {remember: kind === 'pkce' && this.durableAvailable && this.intent()?.remember === true}; }
  async removeItem(key) {
    if (this.disposed) return;
    if (key === '-code-verifier') { this.remove(this.durable, this.intentKey); this.remove(this.tab, this.intentKey); this.memory.delete(key); return; }
    if (key !== '') { this.memory.delete(key); return; }
    this.logoutSnapshot = null;
    const current = this.current ?? this.binding;
    if (current) {
      const key = this.durablePrefix + current.ownerId, saved = decodeRecord(this.read(this.durable, key));
      if (saved?.sessionId === current.sessionId) this.remove(this.durable, key);
    }
    this.current = null; this.blocked = true; this.allowRestore = false; this.remembered = false; this.remember = false; this.saveTab();
  }
  clearAccount(ownerId, {broadcast = true} = {}) {
    if (this.disposed || !uuid.test(ownerId)) return;
    const matching = (this.current ?? this.binding)?.ownerId === ownerId;
    this.remove(this.durable, this.durablePrefix + ownerId);
    if (matching) { this.blocked = true; this.allowRestore = false; this.current = null; this.remembered = false; this.saveTab(); }
    if (broadcast) {
      const notice = {type: 'logout', scope: this.scope, ownerId, nonce: crypto.randomUUID(), at: this.now()};
      this.write(this.durable, this.logoutPrefix + ownerId, JSON.stringify(notice));
      this.channel?.postMessage(notice); // Identifiers only; never credentials.
    }
  }
  receive(notice) {
    const context = this.current ?? this.binding;
    if (this.disposed || notice?.type !== 'logout' || notice.scope !== this.scope || !uuid.test(notice.ownerId) || context?.ownerId !== notice.ownerId) return;
    this.invalidate(context);
  }
  dispose() { this.disposed = true; this.memory.clear(); this.logoutSnapshot = null; this.channel?.close(); this.events?.removeEventListener('storage', this.storageListener); }
}
