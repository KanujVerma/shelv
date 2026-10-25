import { demand, digest, equalNonce, randomId, type Credentials, type Envelope, type RecordStore, type SessionView, type SessionPolicy } from './types';
import { CredentialEnvelope } from './credential-envelope';
export type LegacyPair = {
    accessToken: string;
    refreshToken: string;
};
export type FlowRecord = {
    kind: 'flow';
    audience?: 'advisor' | 'client';
    remember?: boolean;
    sessionPolicy?: SessionPolicy;
    status: 'pending' | 'requesting' | 'sent' | 'exchanging' | 'handoff' | 'completed' | 'failed';
    epoch: number;
    csrf: string;
    expiresAt: number;
    payload: Envelope | null;
    cleanupAt?: number;
    revocationPending?: boolean;
    payloadKind?: 'sdk' | 'credentials' | 'reference';
    preserveTargetHash?: string;
};
type FlowPayload = {
    sdk?: Record<string, string>;
    credentials?: Credentials;
    targetId?: string;
    grant?: string;
    fingerprint?: string;
    existing?: boolean;
};
export function flowExpiryDisposition(record: FlowRecord, now: number): 'pending' | 'erase' | 'retain' | 'retire' {
    if (now < record.expiresAt) return 'pending';
    if (!record.payload || (record.cleanupAt !== undefined && now >= record.cleanupAt) || record.payloadKind === 'sdk') return 'erase';
    if ((record.payloadKind === 'reference' || record.status === 'completed') && !record.revocationPending) return 'retain';
    return 'retire';
}
export interface FlowAuth {
    requestOtp(email: string): Promise<Record<string, string>>;
    exchange(code: string, sdk: Record<string, string>): Promise<Credentials>;
    upgrade(pair: LegacyPair): Promise<Credentials>;
}
export interface SessionTarget {
    initialize(credentials: Credentials, grant: string, remember?: boolean, policy?: SessionPolicy): Promise<SessionView>;
    view(): Promise<SessionView>;
    retire(): Promise<void>;
}
type Completed = {
    sessionId: string;
    session: SessionView;
};
export class AuthFlow {
    private queue: Promise<unknown> = Promise.resolve();
    constructor(private store: RecordStore<FlowRecord>, private envelope: CredentialEnvelope, private auth: FlowAuth, private target: (id: string) => SessionTarget, private options: {
        now: () => number;
        flowMs: number;
        absoluteMs?: number;
        idleMs?: number;
        rememberedIdleMs?: number;
        rememberedAbsoluteMs?: number;
        recheckContext?: boolean;
    policyAudience?: 'advisor' | 'client';
    }) { }
    private serial<T>(fn: () => Promise<T>): Promise<T> { const result = this.queue.then(fn); this.queue = result.catch(() => { }); return result; }
    private live(csrf?: string) {
        const r = this.store.read();
        demand(r, 401, 'flow_ended');
        if (this.options.now() >= r.expiresAt) {
            const retain = flowExpiryDisposition(r, this.options.now()) !== 'erase';
            this.store.write({ ...r, status: 'failed', payload: retain ? r.payload : null, epoch: r.epoch + 1,
                revocationPending: r.revocationPending });
            demand(false, 401, 'flow_ended');
        }
        demand(r.status !== 'failed' && r.status !== 'requesting' && r.status !== 'exchanging', 401, 'flow_ended');
        if (csrf !== undefined)
            demand(equalNonce(r.csrf, csrf), 403, 'csrf_rejected');
        return r;
    }
    private fence(expected: Pick<FlowRecord, 'epoch' | 'csrf'>) { const r = this.store.read(); demand(r && r.epoch === expected.epoch && r.csrf === expected.csrf && r.status !== 'failed' && this.options.now() < r.expiresAt, 401, 'flow_ended'); return r; }
    private fail(expected: Pick<FlowRecord, 'epoch' | 'csrf'>) { const r = this.store.read(); if (r && r.epoch === expected.epoch && r.csrf === expected.csrf)
        this.store.write({ ...r, status: 'failed', payload: null, epoch: r.epoch + 1 }); }
    logoutContext() { const r = this.store.read(); demand(r, 401, 'flow_ended'); return { csrf: r.csrf }; }
    async bootstrap() { return this.serial(async () => { let r = this.store.read(); if (!r) {
        r = { kind: 'flow', status: 'pending', epoch: 1, csrf: randomId(), expiresAt: this.options.now() + this.options.flowMs, payload: null };
        this.store.write(r);
    } r = this.live(); return { signedIn: false as const, csrf: r.csrf, flowExpiresAt: new Date(r.expiresAt).toISOString() }; }); }
    async restart(preserveSessionId?: string) {
        return this.serial(async () => {
            const preserveHash = preserveSessionId ? await digest(preserveSessionId) : undefined;
            const prior = this.store.read();
            if (prior) {
                await this.endFlow(prior, true, preserveHash);
                const current = this.store.read();
                demand(current?.epoch === prior.epoch + 1 && current.csrf === prior.csrf, 401, 'flow_ended');
            }
            const r: FlowRecord = { kind: 'flow', status: 'pending', epoch: (prior?.epoch ?? 0) + 2,
                csrf: randomId(), expiresAt: this.options.now() + this.options.flowMs, payload: null };
            this.store.write(r);
            return { signedIn: false as const, csrf: r.csrf, flowExpiresAt: new Date(r.expiresAt).toISOString() };
        });
    }
    async request(csrf: string, email: string, remember = false) {
        return this.serial(async () => {
            const r = this.live(csrf);
            demand(r.status === 'pending', 409, 'flow_replayed');
            demand(typeof email === 'string' && email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
            const sessionPolicy: SessionPolicy | undefined = this.options.recheckContext ? {idleMs: (remember ? this.options.rememberedIdleMs : this.options.idleMs)!, absoluteMs: (remember ? this.options.rememberedAbsoluteMs : this.options.absoluteMs)!, policyId: `${this.options.policyAudience ?? 'client'}-${remember ? 'remember' : 'session'}-v1`, remembered: remember === true} : undefined;
            this.store.write({ ...r, status: 'requesting', remember:remember === true, ...(sessionPolicy ? {sessionPolicy} : {}) });
            try {
                const sdk = await this.auth.requestOtp(email);
                this.fence(r);
                const payload = await this.envelope.seal({ sdk }, 'pending');
                const current = this.fence(r);
                this.store.write({ ...current, status: 'sent', payload, payloadKind: 'sdk', remember: remember === true });
                return { sent: true };
            }
            catch (error) {
                this.fail(r);
                throw error;
            }
        });
    }
    private async payload(r: FlowRecord) { const p = r.payload ? await this.envelope.open<FlowPayload>(r.payload, 'pending') : {}; this.fence(r); return p; }
    private async acknowledge(r: FlowRecord, p: FlowPayload): Promise<Completed> { demand(p.targetId, 401, 'flow_ended'); const session = await this.target(p.targetId).view(); this.fence(r); return { sessionId: p.targetId, session }; }
    private async finish(r: FlowRecord, p: FlowPayload): Promise<Completed> {
        demand(p.targetId && p.grant && p.credentials, 401, 'flow_ended');
        const target = this.target(p.targetId);
        const session = p.existing ? await target.view() : await target.initialize(p.credentials, p.grant, r.remember === true, r.sessionPolicy);
        try {
            this.fence(r);
        }
        catch (error) {
            const targetHash = await digest(p.targetId);
            if (!p.existing && this.store.read()?.preserveTargetHash !== targetHash)
                await target.retire();
            throw error;
        }
        const payload = await this.envelope.seal({ targetId: p.targetId, grant: p.grant, fingerprint: p.fingerprint, existing: p.existing }, 'pending');
        const current = this.fence(r);
        const absoluteAt = Date.parse(session.absoluteExpiresAt);
        demand(Number.isFinite(absoluteAt), 503, 'unavailable');
        this.store.write({ ...current, status: 'completed', payload, payloadKind: 'reference', cleanupAt: Math.max(r.expiresAt, absoluteAt), revocationPending: false });
        return { sessionId: p.targetId, session };
    }
    private async accept(r: FlowRecord, credentials: Credentials, fingerprint: string, existingId?: string): Promise<Completed> {
        this.fence(r);
        let existing = false;
        if (existingId) {
            const current = await this.target(existingId).view();
            this.fence(r);
            demand(current.ownerId === credentials.user.id, 409, 'account_conflict');
            existing = true;
        }
        const p: FlowPayload = { credentials, fingerprint, targetId: existingId ?? randomId(), grant: randomId(), existing };
        const payload = await this.envelope.seal(p, 'pending');
        const current = this.fence(r);
        this.store.write({ ...current, status: 'handoff', payload, payloadKind: 'credentials', cleanupAt: r.expiresAt + (r.sessionPolicy?.absoluteMs ?? this.options.absoluteMs ?? 28800000) });
        return this.finish(current, p);
    }
    async complete(csrf: string, code: string, existingId?: string): Promise<Completed> {
        return this.serial(async () => {
            const r = this.live(csrf);
            demand(typeof code === 'string' && code.length >= 1 && code.length <= 2048 && !/[\x00-\x20\x7f]/.test(code));
            const fingerprint = await digest(`code:${code}`);
            this.fence(r);
            const p = await this.payload(r);
            if (r.status === 'completed' || r.status === 'handoff') {
                demand(p.fingerprint === fingerprint, 409, 'flow_replayed');
                if (this.options.recheckContext) demand(!existingId || p.targetId === existingId,409,'account_conflict');
                return r.status === 'completed' ? this.acknowledge(r, p) : this.finish(r, p);
            }
            demand(r.status === 'sent' && p.sdk, 401, 'flow_ended');
            if (this.options.recheckContext) demand(!existingId,409,'account_conflict');
            this.store.write({ ...r, status: 'exchanging' });
            let credentials: Credentials;
            try {
                credentials = await this.auth.exchange(code, p.sdk);
                this.fence(r);
            }
            catch (error) {
                this.fail(r);
                throw error;
            }
            return this.accept(r, credentials, fingerprint, existingId);
        });
    }
    async upgrade(csrf: string, pair: LegacyPair, existingId?: string): Promise<Completed> {
        return this.serial(async () => {
            const r = this.live(csrf);
            demand(typeof pair?.accessToken === 'string' && pair.accessToken.length >= 1 && pair.accessToken.length <= 16384 && typeof pair.refreshToken === 'string' && pair.refreshToken.length >= 1 && pair.refreshToken.length <= 8192);
            const fingerprint = await digest(`upgrade:${pair.accessToken}:${pair.refreshToken}`);
            this.fence(r);
            const p = await this.payload(r);
            if (r.status === 'completed' || r.status === 'handoff') {
                demand(p.fingerprint === fingerprint, 409, 'flow_replayed');
                if (this.options.recheckContext) demand(!existingId || p.targetId === existingId,409,'account_conflict');
                return r.status === 'completed' ? this.acknowledge(r, p) : this.finish(r, p);
            }
            demand(r.status === 'pending', 409, 'flow_replayed');
            this.store.write({ ...r, status: 'exchanging' });
            let credentials: Credentials;
            try {
                credentials = await this.auth.upgrade(pair);
                this.fence(r);
            }
            catch (error) {
                this.fail(r);
                throw error;
            }
            return this.accept(r, credentials, fingerprint, existingId);
        });
    }
    private async endFlow(r: FlowRecord, explicitLogout: boolean, preserveTargetHash?: string) {
        // A failed record cannot authenticate. Keep an encrypted retry reference until target retirement is acknowledged.
        const shouldRetire = !!r.payload && (r.status === 'handoff' || r.status === 'failed' || (explicitLogout && r.status === 'completed'));
        const epoch = r.epoch + 1;
        this.store.write({ ...r, status: 'failed', payload: shouldRetire ? r.payload : null, epoch, revocationPending: explicitLogout || r.revocationPending, preserveTargetHash });
        if (shouldRetire) {
            const p = await this.envelope.open<FlowPayload>(r.payload!, 'pending');
            if (p.targetId) {
                const targetHash = await digest(p.targetId);
                const willRetire = targetHash !== preserveTargetHash && (explicitLogout || r.revocationPending || !p.existing);
                // Never retain the SDK pair while waiting for a second object's revocation acknowledgement.
                const payload = await this.envelope.seal({ targetId: p.targetId, existing: p.existing }, 'pending');
                const current = this.store.read();
                if (current?.epoch === epoch && current.csrf === r.csrf) this.store.write({ ...current, payload, payloadKind: 'reference',
                    cleanupAt: r.cleanupAt ?? r.expiresAt + (r.sessionPolicy?.absoluteMs ?? this.options.absoluteMs ?? 28800000), revocationPending: willRetire });
                if (willRetire) await this.target(p.targetId).retire();
            }
        }
        const current = this.store.read();
        if (current?.epoch === epoch && current.csrf === r.csrf)
            this.store.write({ ...current, payload: null, revocationPending: false });
        return { ended: true };
    }
    async cancel(csrf: string) { const r = this.store.read(); demand(r && equalNonce(r.csrf, csrf), 403, 'csrf_rejected'); return this.endFlow(r, true); }
    async retire(preserveSessionId?: string) { const preserveHash = preserveSessionId ? await digest(preserveSessionId) : undefined; const r = this.store.read(); return r ? this.endFlow(r, true, preserveHash) : { ended: true }; }
    async expire() {
        const r = this.store.read();
        if (!r) return;
        const disposition = flowExpiryDisposition(r, this.options.now());
        if (disposition === 'pending') return;
        if (disposition === 'erase' || disposition === 'retain') {
            this.store.write({ ...r, status: 'failed', epoch: r.epoch + 1, payload: disposition === 'retain' ? r.payload : null, revocationPending: false }); return;
        }
        await this.endFlow(r, !!r.revocationPending);
    }
}
