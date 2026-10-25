import { DurableObject } from 'cloudflare:workers';
import { demand, digest, SessionError, type RecordStore, type SessionRecord, type SessionView } from '../../server/types';
import { CredentialEnvelope } from '../../server/credential-envelope';
import { SessionVault } from '../../server/session-vault';
import { AuthFlow, flowExpiryDisposition, type FlowRecord, type SessionTarget } from '../../server/auth-flow';
import { ClientProvider } from '../../server/client-upstream';
import { WalkthroughProvider, readWalkthroughWithKey } from '../../server/walkthrough-upstream';
import { PORTAL_ORIGIN, safeError } from '../../server/policy';
import type { VaultCommand, VaultResult } from '../../server/protocol';
type Env = Omit<VaultBindings, 'ADVISOR_SESSIONS' | 'SESSION_IDLE_SECONDS' | 'SESSION_ABSOLUTE_SECONDS' | 'SESSION_FLOW_SECONDS' | 'CLIENT_SHARED_SESSIONS'> & {
    ADVISOR_SESSIONS: DurableObjectNamespace<AdvisorSessionObject>;
    SESSION_IDLE_SECONDS: string;
    SESSION_ABSOLUTE_SECONDS: string;
    SESSION_FLOW_SECONDS: string;
    CLIENT_SHARED_SESSIONS?: string;
    ADVISOR_SHARED_SESSIONS?: string;
    SUPABASE_PUBLIC_KEY?: string;
    ADVISOR_SESSION_KEYS?: string;
    SUPABASE_WALKTHROUGH_KEY?: string;
};
type LimitRecord = {
    kind: 'limit';
    audience?: 'advisor' | 'client';
    minute: number;
    counts: Record<string, number>;
    daily: Record<string, number>;
    expiresAt: number;
};
type Stored = SessionRecord | FlowRecord | LimitRecord;
export class AdvisorSessionObject extends DurableObject<Env> {
    #audience: 'advisor' | 'client' = 'advisor';
    #vault: SessionVault | undefined;
    #flow: AuthFlow | undefined;
    constructor(ctx: DurableObjectState, env: Env) { super(ctx, env); ctx.blockConcurrencyWhile(async () => { this.#schema(); }); }
    #schema() { this.ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS session_record (singleton INTEGER PRIMARY KEY CHECK (singleton = 1), json TEXT NOT NULL)'); }
    #read(): Stored | null { const rows = this.ctx.storage.sql.exec<{
        json: string;
    }>('SELECT json FROM session_record WHERE singleton = 1').toArray(); return rows.length ? JSON.parse(rows[0].json) as Stored : null; }
    #write(record: Stored) { this.ctx.storage.sql.exec('INSERT INTO session_record(singleton,json) VALUES(1,?) ON CONFLICT(singleton) DO UPDATE SET json=excluded.json', JSON.stringify(record)); }
    #store<T extends Stored>(kind: T['kind']): RecordStore<T> { return { read: () => { const r = this.#read(); demand(!r || r.kind === kind, 503, 'unavailable'); return r as T | null; }, write: r => this.#write({ ...r, audience: this.#audience } as T) }; }
    #limits() {
        const seconds = (raw: string, min: number, max: number) => { demand(typeof raw === 'string' && /^[1-9][0-9]*$/.test(raw), 503, 'configuration_missing'); const n = Number(raw); demand(Number.isSafeInteger(n) && n >= min && n <= max, 503, 'configuration_missing'); return n * 1000; };
        const idleMs = seconds(this.env.SESSION_IDLE_SECONDS, 60, 28800), absoluteMs = seconds(this.env.SESSION_ABSOLUTE_SECONDS, 60, 86400), flowMs = seconds(this.env.SESSION_FLOW_SECONDS, 60, 900);
        demand(idleMs <= absoluteMs, 503, 'configuration_missing');
        if (this.#audience === 'client') {
            const config = this.env as Env & Record<string, string>;
            const rememberedIdleMs = seconds(config.CLIENT_REMEMBER_IDLE_SECONDS, 60, 2592000);
            const rememberedAbsoluteMs = seconds(config.CLIENT_REMEMBER_ABSOLUTE_SECONDS, 60, 2592000);
            demand(rememberedIdleMs <= rememberedAbsoluteMs, 503, 'configuration_missing');
            return { now: () => Date.now(), idleMs, absoluteMs, flowMs, rememberedIdleMs, rememberedAbsoluteMs, recheckContext: true };
        }
        if (this.env.ADVISOR_SHARED_SESSIONS === 'true') {
            // Persistence never enlarges the existing privileged-session limits.
            demand(idleMs <= 3600000 && absoluteMs <= 28800000, 503, 'configuration_missing');
            return { now: () => Date.now(), idleMs, absoluteMs, flowMs, rememberedIdleMs: idleMs, rememberedAbsoluteMs: absoluteMs, recheckContext: true, policyAudience: 'advisor' as const };
        }
        return { now: () => Date.now(), idleMs, absoluteMs, flowMs };
    }
    #auth() { demand(this.env.PORTAL_ORIGIN === PORTAL_ORIGIN && this.env.SUPABASE_PUBLIC_KEY && this.env.ADVISOR_SESSION_KEYS, 503, 'configuration_missing'); return this.#audience === 'client' ? new ClientProvider(this.env.SUPABASE_PUBLIC_KEY) : new WalkthroughProvider(this.env.SUPABASE_PUBLIC_KEY, undefined, 12000, this.env.ADVISOR_SHARED_SESSIONS === 'true'); }
    #session() { if (!this.#vault)
        this.#vault = new SessionVault(this.#store<SessionRecord>('session'), new CredentialEnvelope(this.env.ADVISOR_SESSION_KEYS ?? '', this.ctx.id.toString()), this.#auth(), this.#limits()); return this.#vault; }
    #pending() { if (!this.#flow)
        this.#flow = new AuthFlow(this.#store<FlowRecord>('flow'), new CredentialEnvelope(this.env.ADVISOR_SESSION_KEYS ?? '', this.ctx.id.toString()), this.#auth(), id => this.#target(id), this.#limits()); return this.#flow; }
    #target(id: string): SessionTarget {
        const call = async <T>(command: VaultCommand): Promise<T> => {
            const prefix = this.#audience === 'client' ? 'client:' : '';
            const name = `${prefix}session:${await digest(`${prefix}session:${id}`)}`;
            const result = await this.env.ADVISOR_SESSIONS.getByName(name).invoke({ ...command, audience: this.#audience }) as VaultResult<T>;
            if (!result.ok)
                throw new SessionError(result.error.status, result.error.code);
            return result.value;
        };
        return { initialize: (credentials, grant, remember, policy) => call<SessionView>({ type: 'session.initialize', credentials, grant, remember, policy }), view: () => call<SessionView>({ type: 'session.view' }), retire: () => call<void>({ type: 'session.retire' }) };
    }
    #limit(scope: 'bootstrap' | 'otp' | 'auth' | 'walkthrough') {
        const old = this.#read();
        if (old)
            demand(old.kind === 'limit', 503, 'unavailable');
        const minute = Math.floor(Date.now() / 60000);
        const r: LimitRecord = old ?? { kind: 'limit', minute, counts: {}, daily: {}, expiresAt: (Math.floor(Date.now() / 86400000) + 1) * 86400000 };
        const counts = r.minute === minute ? { ...r.counts } : {}, daily = { ...r.daily };
        counts[scope] = (counts[scope] ?? 0) + 1;
        daily[scope] = (daily[scope] ?? 0) + 1;
        this.#write({ ...r, audience: this.#audience, minute, counts, daily });
        return { allowed: counts[scope] <= { bootstrap: 20, otp: 3, auth: 10, walkthrough: 60 }[scope] && daily[scope] <= { bootstrap: 200, otp: 20, auth: 100, walkthrough: 1000 }[scope] };
    }
    async #schedule() {
        const r = this.#read();
        if (!r)
            return;
        const limits = this.#limits();
        const expires = r.kind === 'session' ? (r.status === 'revoked' ? Math.max(r.absoluteAt, r.createdAt + limits.flowMs) : Math.min(r.lastActive + (r.idleMs ?? (r.remembered ? limits.rememberedIdleMs ?? limits.idleMs : limits.idleMs)), r.absoluteAt))
            : r.kind === 'flow' && r.revocationPending && Date.now() >= r.expiresAt ? Math.min(Date.now() + 60000, r.cleanupAt ?? Infinity)
            : r.kind === 'flow' && r.status === 'failed' && r.payload && r.cleanupAt ? r.cleanupAt : r.expiresAt;
        await this.ctx.storage.setAlarm(Math.max(Date.now() + 1, expires));
    }
    async invoke(command: VaultCommand): Promise<VaultResult<unknown>> {
        try {
            this.#schema();
            if (command.type === 'walkthrough.view') {
                demand(command.audience === undefined && !this.#read() && /^[a-f0-9]{64}$/.test(command.digest), 403, 'forbidden');
                demand(this.env.PORTAL_ORIGIN === PORTAL_ORIGIN, 503, 'configuration_missing');
                return {ok:true,value:await readWalkthroughWithKey(this.env.SUPABASE_WALKTHROUGH_KEY ?? '',command.digest)};
            }
            if (command.type === 'limit' && command.scope === 'walkthrough') {
                demand(command.audience === undefined,403,'forbidden');
                const value=this.#limit(command.scope);await this.#schedule();return {ok:true,value};
            }
            const audience = command.audience ?? 'advisor';
            demand(audience === 'advisor' || audience === 'client');
            const stored = this.#read();
            demand(!stored || ((stored as SessionRecord | FlowRecord).audience ?? 'advisor') === audience, 403, 'forbidden');
            this.#audience = audience;
            if (audience === 'client') demand((this.env as Env & Record<string,string>).CLIENT_SHARED_SESSIONS === 'true',503,'configuration_missing');
            this.#limits();
            const auth = this.#auth();
            let value: unknown;
            switch (command.type) {
                case 'limit':
                    value = this.#limit(command.scope);
                    break;
                case 'flow.bootstrap':
                    value = await this.#pending().bootstrap();
                    break;
                case 'flow.logout-context':
                    value = this.#pending().logoutContext();
                    break;
                case 'flow.restart':
                    value = await this.#pending().restart(command.preserveSessionId);
                    break;
                case 'flow.request':
                    value = await this.#pending().request(command.csrf, command.email, command.remember === true && (this.#audience === 'client' || this.env.ADVISOR_SHARED_SESSIONS === 'true'));
                    break;
                case 'flow.complete':
                    value = await this.#pending().complete(command.csrf, command.code, command.existingId);
                    break;
                case 'flow.upgrade':
                    value = await this.#pending().upgrade(command.csrf, command.pair, command.existingId);
                    break;
                case 'flow.cancel':
                    value = await this.#pending().cancel(command.csrf);
                    break;
                case 'flow.retire':
                    value = await this.#pending().retire(command.preserveSessionId);
                    break;
                case 'session.initialize':
                    value = await this.#session().initialize(command.credentials, command.grant, command.remember === true && (this.#audience === 'client' || this.env.ADVISOR_SHARED_SESSIONS === 'true'), command.policy);
                    break;
                case 'session.view':
                    value = await this.#session().view();
                    break;
                case 'session.logout-context':
                    value = this.#session().logoutContext();
                    break;
                case 'session.execute':
                    value = await this.#session().execute(command.csrf, (credentials, capabilities) => {
                        if(command.operation.kind === 'walkthrough') {
                            demand(this.#audience === 'advisor' && auth instanceof WalkthroughProvider && capabilities.view,403,'forbidden');
                            if(['share_create','share_revoke'].includes(command.operation.command.action))demand(capabilities.publish,403,'forbidden');
                            return auth.performWalkthrough(credentials,command.operation.command);
                        }
                        return auth.perform(credentials, capabilities, command.operation);
                    });
                    break;
                case 'session.logout':
                    value = await this.#session().logout(command.csrf);
                    break;
                case 'session.retire':
                    value = await this.#session().retire();
                    break;
                default: throw new SessionError(400, 'invalid_request');
            }
            const checkpoint = this.#read();
            await this.#schedule();
            // Alarm persistence yields. Recheck the durable fence after that last await, immediately before RPC egress.
            if (command.type === 'session.view' || command.type === 'session.execute' || command.type === 'session.initialize') {
                const current = this.#read(), limits = this.#limits();
                demand(checkpoint?.kind === 'session' && current?.kind === 'session' && current.epoch === checkpoint.epoch && current.csrf === checkpoint.csrf && current.status === 'active' && Date.now() < Math.min(current.lastActive + (current.idleMs ?? (current.remembered ? limits.rememberedIdleMs ?? limits.idleMs : limits.idleMs)), current.absoluteAt), 401, 'session_ended');
            }
            if (command.type === 'flow.complete' || command.type === 'flow.upgrade') {
                const current = this.#read();
                demand(checkpoint?.kind === 'flow' && current?.kind === 'flow' && current.epoch === checkpoint.epoch && current.csrf === checkpoint.csrf && current.status === 'completed' && Date.now() < current.expiresAt, 401, 'flow_ended');
            }
            return { ok: true, value };
        }
        catch (error) {
            await this.#schedule().catch(() => { });
            return { ok: false, error: safeError(error) };
        }
    }
    async alarm() {
        const r = this.#read();
        if (!r)
            return;
        this.#audience = (r as SessionRecord | FlowRecord).audience ?? 'advisor';
        const now = Date.now(), limits = this.#limits();
        if (r.kind === 'flow' && now >= r.expiresAt) {
            // Deadline erasure and retained-reference bookkeeping require no key or Auth configuration.
            const disposition = flowExpiryDisposition(r, now);
            if (disposition === 'erase' || disposition === 'retain') {
                this.#write({ ...r, status: 'failed', epoch: r.epoch + 1, payload: disposition === 'retain' ? r.payload : null, revocationPending: false });
            } else {
                try { await this.#pending().expire(); }
                catch (error) {
                    const current = this.#read();
                    if (current?.kind !== 'flow' || current.csrf !== r.csrf) { await this.#schedule(); return; }
                    if (current?.kind === 'flow' && current.payloadKind !== 'reference') {
                        // An undecryptable/unconfigured unacknowledged handoff must not retain an SDK pair.
                        // No cookie was issued for it; its unreachable target also has its own absolute alarm.
                        this.#write({ ...current, status: 'failed', epoch: current.epoch + 1, payload: null, revocationPending: false });
                    } else {
                        // Platform retries are finite: persist our own retry/deadline before propagating failure.
                        await this.#schedule();
                        throw error;
                    }
                }
            }
            const current = this.#read();
            if (current?.kind === 'flow' && current.csrf !== r.csrf) { await this.#schedule(); return; }
            if (current?.kind === 'flow' && current.payload) { await this.#schedule(); return; }
            await this.ctx.storage.deleteAll();
            await this.ctx.storage.deleteAlarm();
            this.#flow = undefined;
            return;
        }
        if (r.kind === 'session') {
            if (r.status !== 'revoked' && now >= Math.min(r.lastActive + (r.idleMs ?? (r.remembered ? limits.rememberedIdleMs ?? limits.idleMs : limits.idleMs)), r.absoluteAt))
                this.#write({ ...r, status: 'revoked', credentials: null, epoch: r.epoch + 1 });
            if (now >= Math.max(r.absoluteAt, r.createdAt + limits.flowMs)) {
                await this.ctx.storage.deleteAll();
                await this.ctx.storage.deleteAlarm();
                this.#vault = undefined;
                return;
            }
        }
        if (r.kind === 'limit' && now >= r.expiresAt) {
            await this.ctx.storage.deleteAll();
            await this.ctx.storage.deleteAlarm();
            return;
        }
        await this.#schedule();
    }
}
export default { async fetch() { return new Response(null, { status: 404 }); } };
