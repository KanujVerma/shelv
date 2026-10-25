import { demand, equalNonce, randomId, type AuthProvider, type Credentials, type RecordStore, type SessionRecord, type SessionView, type Capabilities, type SessionPolicy } from './types';
import { CredentialEnvelope } from './credential-envelope';
type Options = {
    now: () => number;
    idleMs: number;
    absoluteMs: number;
    rememberedIdleMs?: number;
    rememberedAbsoluteMs?: number;
    recheckContext?: boolean;
    policyAudience?: 'advisor' | 'client';
};
export class SessionVault {
    private queue: Promise<unknown> = Promise.resolve();
    constructor(private store: RecordStore<SessionRecord>, private envelope: CredentialEnvelope, private auth: AuthProvider, private options: Options) { }
    private serial<T>(fn: () => Promise<T>): Promise<T> { const task = this.queue.then(fn); this.queue = task.catch(() => { }); return task; }
    private end(record: SessionRecord) { this.store.write({ ...record, status: 'revoked', epoch: record.epoch + 1, credentials: null }); }
    private idle(r: SessionRecord) { return r.idleMs ?? (r.remembered ? this.options.rememberedIdleMs ?? this.options.idleMs : this.options.idleMs); }
    private live(): SessionRecord {
        const r = this.store.read();
        demand(r, 401, 'session_ended');
        if (r.status !== 'active' || !r.credentials || this.options.now() >= Math.min(r.lastActive + this.idle(r), r.absoluteAt)) {
            if (r.status !== 'revoked')
                this.end(r);
            demand(false, 401, 'session_ended');
        }
        return r;
    }
    private fence(expected: Pick<SessionRecord, 'epoch' | 'csrf'>, allowRefreshing = false) {
        const r = this.store.read();
        demand(r && r.epoch === expected.epoch && r.csrf === expected.csrf && (r.status === 'active' || (allowRefreshing && r.status === 'refreshing')), 401, 'session_ended');
        if (this.options.now() >= Math.min(r.lastActive + this.idle(r), r.absoluteAt)) {
            this.end(r);
            demand(false, 401, 'session_ended');
        }
        return r;
    }
    private csrf(r: SessionRecord, csrf: string) { demand(typeof csrf === 'string' && equalNonce(r.csrf, csrf), 403, 'csrf_rejected'); }
    private viewOf(r: SessionRecord, capabilities: Capabilities): SessionView { return { ownerId: r.ownerId, generation: r.generation, capabilities, idleExpiresAt: new Date(Math.min(r.lastActive + this.idle(r), r.absoluteAt)).toISOString(), absoluteExpiresAt: new Date(r.absoluteAt).toISOString(), csrf: r.csrf, ...(r.remembered !== undefined ? { remembered: r.remembered } : {}) }; }
    async initialize(credentials: Credentials, grant: string, remember = false, policy?: SessionPolicy): Promise<SessionView> {
        return this.serial(async () => {
            const existing = this.store.read();
            if (existing) {
                demand(existing.grant === grant, 409, 'account_conflict');
                this.live();
                return (await this.authorized()).view;
            }
            const context = await this.auth.context(credentials);
            demand(context.ownerId === credentials.user.id && context.providerSessionId === credentials.providerSessionId && context.capabilities.view, 403, 'forbidden');
            const encrypted = await this.envelope.seal(credentials, context.ownerId);
            demand(!this.store.read(), 409, 'account_conflict');
            if (policy) demand(this.options.recheckContext && Number.isSafeInteger(policy.idleMs) && policy.idleMs >= 60000 && policy.idleMs <= policy.absoluteMs && Number.isSafeInteger(policy.absoluteMs) && policy.absoluteMs <= (this.options.policyAudience === 'advisor' ? 28800000 : 2592000000) && (this.options.policyAudience !== 'advisor' || policy.idleMs <= 3600000) && policy.remembered === remember && policy.policyId === (`${this.options.policyAudience ?? 'client'}-${remember ? 'remember' : 'session'}-v1`),503,'configuration_missing');
            const now = this.options.now();
            const remembered = remember === true && !!this.options.rememberedIdleMs && !!this.options.rememberedAbsoluteMs;
            const r: SessionRecord = { kind: 'session', status: 'active', ownerId: context.ownerId, providerSessionId: context.providerSessionId, epoch: 1, generation: 1, createdAt: now, lastActive: now, absoluteAt: Math.min(now + (policy?.absoluteMs ?? (remembered ? this.options.rememberedAbsoluteMs! : this.options.absoluteMs)), context.sessionNotAfter ?? Infinity), ...(this.options.recheckContext ? {idleMs: policy?.idleMs ?? (remembered ? this.options.rememberedIdleMs! : this.options.idleMs), policyId: `${this.options.policyAudience ?? 'client'}-${remembered ? 'remember' : 'session'}-v1`} : {}), ...(this.options.rememberedIdleMs ? {remembered} : {}), grant, credentials: encrypted, csrf: randomId() };
            demand(r.absoluteAt > now, 401, 'session_ended');
            this.store.write(r);
            return this.viewOf(r, context.capabilities);
        });
    }
    private async authorized(csrf?: string) {
        let r = this.live();
        if (csrf !== undefined)
            this.csrf(r, csrf);
        const checkpoint = {epoch:r.epoch,csrf:r.csrf};
        let credentials: Credentials;
        try {
            credentials = await this.envelope.open<Credentials>(r.credentials!, r.ownerId);
            this.fence(checkpoint);
            if (credentials.expires_at * 1000 - this.options.now() <= 60000) {
                // Durable intent precedes external rotation. Eviction/uncertain acknowledgement never retries this pair.
                this.store.write({ ...r, status: 'refreshing' });
                credentials = await this.auth.refresh(credentials);
                r = this.fence(checkpoint, true);
                demand(credentials.user.id === r.ownerId && credentials.providerSessionId === r.providerSessionId, 401, 'session_ended');
                const encrypted = await this.envelope.seal(credentials, r.ownerId);
                r = this.fence(checkpoint, true);
                this.store.write({ ...r, status: 'active', generation: r.generation + 1, credentials: encrypted });
                r = this.live();
            }
        }
        catch (error) {
            const latest = this.store.read();
            if (latest && latest.epoch === checkpoint.epoch && latest.csrf === checkpoint.csrf && latest.status !== 'revoked')
                this.end(latest);
            throw error;
        }
        let context;
        try {
            context = await this.auth.context(credentials);
            r = this.fence(checkpoint);
            demand(context.ownerId === r.ownerId && context.providerSessionId === r.providerSessionId && context.capabilities.view, 403, 'forbidden');
        }
        catch (error) {
            const status = (error as {
                status?: number;
            }).status;
            if (status === 401 || status === 403) {
                const latest = this.store.read();
                if (latest && latest.epoch === checkpoint.epoch && latest.csrf === checkpoint.csrf && latest.status !== 'revoked')
                    this.end(latest);
            }
            throw error;
        }
        if (context.sessionNotAfter != null) {
            r = {...r, absoluteAt: Math.min(r.absoluteAt, context.sessionNotAfter)};
            this.store.write(r); this.fence(checkpoint);
        }
        if (r.credentials!.keyId !== this.envelope.activeKey) {
            const encrypted = await this.envelope.seal(credentials, r.ownerId);
            r = this.fence(checkpoint);
            this.store.write({ ...r, credentials: encrypted });
            r = this.live();
        }
        r = { ...r, lastActive: this.options.now() };
        this.store.write(r);
        return { credentials, checkpoint, view: this.viewOf(r, context.capabilities) };
    }
    async view(): Promise<SessionView> { return this.serial(async () => (await this.authorized()).view); }
    async execute<T>(csrf: string | undefined, operation: (credentials: Credentials, capabilities: Capabilities) => Promise<T>): Promise<T> {
        return this.serial(async () => {
            const { credentials, checkpoint, view } = await this.authorized(csrf);
            let result: T;
            try {
                result = await operation(credentials, view.capabilities);
            }
            catch (error) {
                if ((error as {
                    status?: number;
                }).status === 401) {
                    const r = this.store.read();
                    if (r && r.epoch === checkpoint.epoch && r.csrf === checkpoint.csrf && r.status !== 'revoked')
                        this.end(r);
                }
                throw error;
            }
            if (this.options.recheckContext) {
                try {
                    const context = await this.auth.context(credentials);
                    let r = this.fence(checkpoint);
                    demand(context.ownerId === r.ownerId && context.providerSessionId === r.providerSessionId && context.capabilities.view,403,'forbidden');
                    if (context.sessionNotAfter != null) { r = {...r, absoluteAt:Math.min(r.absoluteAt,context.sessionNotAfter)}; this.store.write(r); }
                } catch(error) {
                    if ([401,403].includes((error as {status?:number}).status ?? 0)) { const r = this.store.read(); if(r && r.epoch===checkpoint.epoch && r.csrf===checkpoint.csrf && r.status!=='revoked')this.end(r); }
                    throw error;
                }
            }
            this.fence(checkpoint);
            return result;
        });
    }
    logoutContext() { const r = this.store.read(); demand(r, 401, 'session_ended'); return { csrf: r.csrf }; }
    async logout(csrf: string) {
        const r = this.store.read();
        demand(r, 401, 'session_ended');
        this.csrf(r, csrf);
        if (r.status === 'revoked')
            return { providerRevoked: false };
        // This method deliberately bypasses the request queue and fences before any external await.
        this.end(r);
        let providerRevoked = false;
        try {
            if (r.credentials) {
                const credentials = await this.envelope.open<Credentials>(r.credentials, r.ownerId);
                await this.auth.logout(credentials);
                providerRevoked = true;
            }
        }
        catch { /* Local revocation is authoritative even if the provider is unavailable. */ }
        return { providerRevoked };
    }
    expire() { const r = this.store.read(); if (r && r.status !== 'revoked' && (r.status === 'refreshing' || this.options.now() >= Math.min(r.lastActive + this.idle(r), r.absoluteAt)))
        this.end(r); }
    async retire() { const r = this.store.read(); if (r) {
        if (r.status !== 'revoked')
            await this.logout(r.csrf);
    }
    else {
        const now = this.options.now();
        this.store.write({ kind: 'session', status: 'revoked', ownerId: '', providerSessionId: '', epoch: 1, generation: 0, createdAt: now, lastActive: now, absoluteAt: now, grant: '', credentials: null, csrf: randomId() });
    } }
}
