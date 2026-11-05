import type { ApplicationSession } from '../../../app/session.ts';
import { TransportError } from '../../../transport/session.ts';
import { createOwnerPolicyPort, policyResult } from './port.ts';
import type { OwnerPolicyCommand, OwnerPolicyState, Policy, PolicyConfirmation, PolicyIntent } from './types.ts';
type Setting = Extract<OwnerPolicyCommand, {
    action: 'set_sami_approval_policy_v1';
}>;
type Pending = {
    readonly command: Setting;
    readonly base: Policy;
    readonly summary: PolicyIntent;
};
type Operation = {
    readonly controller: AbortController;
    readonly kind: 'read' | 'write' | 'status';
    readonly caps: string;
    readonly day: string;
    readonly intent: Pending | null;
    dispatched: boolean;
};
type PolicyMemory = {
    readonly owner: object;
    readonly pending: Pending | null;
};
const memoryKey = 'advisor.owner-policy.pending.v1';
const empty: OwnerPolicyState = Object.freeze({ phase: 'unread', current: null, base: null, desired: null, writable: false, writeState: 'idle', confirmation: null, pending: null, message: null });
/** Session-owned, in-memory policy control. Construction accepts actual runtime
 * only; owner/read/current/confirmation authority cannot be supplied as flags. */
export function createOwnerPolicyController(runtime: ApplicationSession) {
    const boundary = runtime.getSnapshot().boundary, port = createOwnerPolicyPort(runtime), listeners = new Set<() => void>();
    let disposed = false, active: Operation | null = null, state = empty, notification = 0;
    const laneOwner = Object.freeze({});
    let pending = boundary?.memory.get<PolicyMemory>(memoryKey)?.pending ?? null;
    boundary?.memory.set(memoryKey, Object.freeze({ owner: laneOwner, pending }));
    const ownsMemory = () => boundary?.memory.get<PolicyMemory>(memoryKey)?.owner === laneOwner;
    if (pending)
        state = Object.freeze({ ...state, pending: pending.summary, base: pending.base, desired: pending.command.requireKanujApproval, writeState: 'uncertain' });
    const caps = () => JSON.stringify(runtime.cookie._view?.capabilities ?? null);
    let lastCaps = caps();
    const dayFormat = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit' });
    const day = () => dayFormat.format(runtime.cookie.now?.() ?? Date.now());
    let readDay: string | null = null;
    const current = () => !disposed && port.isCurrent() && runtime.getSnapshot().boundary === boundary && ownsMemory();
    const view = () => runtime.cookie._view?.capabilities.view === true;
    const canWrite = () => current() && view() && runtime.cookie.status === 'ready' && runtime.cookie._view?.capabilities.publish === true && !!state.current && state.current.ownerActorId === runtime.cookie.identity?.ownerId && readDay === day();
    function publish(next: OwnerPolicyState) {
        state = Object.freeze(next);
        notification++;
        for (const fn of [...listeners]) {
            try { fn(); } catch { /* Local observer faults cannot become transport failures. */ }
        }
    }
    function remember() {
        if (current()) {
            boundary?.memory.set(memoryKey, Object.freeze({ owner: laneOwner, pending }));
        }
    }
    // Detach before abort/notification: an A callback must never cancel newer B.
    function detach() { const old = active; active = null; old?.controller.abort(); return old; }
    function retire(phase: 'ended' | 'denied') {
        detach();
        pending = null;
        if (ownsMemory())
            boundary?.memory.set(memoryKey, Object.freeze({ owner: laneOwner, pending: null }));
        readDay = null;
        publish({ ...empty, phase, message: phase === 'ended' ? 'your session has ended. sign in again.' : 'you do not have access to this policy.' });
    }
    function reconcile() {
        if (disposed)
            return;
        if (!current()) {
            if (state.phase !== 'ended')
                retire('ended');
            return;
        }
        if (!view()) {
            if (state.phase !== 'denied')
                retire('denied');
            return;
        }
        const nextCaps = caps(), newDay = readDay !== null && readDay !== day();
        if (nextCaps !== lastCaps || newDay) {
            lastCaps = nextCaps;
            const old = detach();
            if (old?.kind === 'write' && old.dispatched && pending === old.intent)
                remember();
            else if (old?.kind === 'write' && pending === old.intent) {
                pending = null;
                remember();
            }
            if (newDay)
                readDay = null;
            publish({ ...state, ...(newDay ? { current: null, phase: 'unread' } : {}), confirmation: null, writable: canWrite(), pending: pending?.summary ?? null, writeState: pending ? 'uncertain' : state.writeState === 'confirming' || state.writeState === 'saving' ? 'idle' : state.writeState });
        }
        const writable = canWrite();
        if (state.writable !== writable)
            publish({ ...state, writable });
    }
    function owned(op: Operation) {
        return !disposed && active === op && current() && view() && caps() === op.caps && day() === op.day;
    }
    function applicable(op: Operation) { return owned(op) && runtime.cookie.status === 'ready' && (op.kind !== 'write' || canWrite()); }
    function begin(kind: Operation['kind'], intent: Pending | null = null) {
        detach();
        const op: Operation = { controller: new AbortController(), kind, caps: caps(), day: day(), intent, dispatched: false };
        active = op;
        return op;
    }
    async function ready(op: Operation) {
        if (runtime.cookie.status === 'offline')
            await runtime.restore();
        reconcile();
        return owned(op) && runtime.cookie.status === 'ready';
    }
    function done(op: Operation, next: OwnerPolicyState) {
        if (!owned(op))
            return false;
        active = null;
        state = Object.freeze(next);
        publish({ ...state, writable: canWrite() });
        return true;
    }
    function failed(op: Operation, error: unknown) {
        reconcile();
        if (!owned(op))
            return false;
        const status = error instanceof TransportError ? error.status : 503;
        if (status === 401 || status === 403) {
            retire(status === 401 ? 'ended' : 'denied');
            return false;
        }
        active = null;
        if (op.kind === 'write') {
            if (status === 503) {
                remember();
                publish({ ...state, confirmation: null, pending: pending?.summary ?? null, writeState: 'uncertain', message: 'the result is uncertain. check its status or retry the original change.' });
            }
            else {
                if (pending === op.intent) {
                    pending = null;
                    remember();
                }
                publish({ ...state, ...(status === 409 ? { current: null, writable: false } : {}), confirmation: null, pending: null, writeState: status === 409 ? 'conflict' : 'idle', message: status === 409 ? 'this policy changed. refresh it, compare your change, then reapply.' : 'the policy was not saved. your change is still here.' });
            }
        }
        else
            publish({ ...state, ...(op.kind === 'read' ? { current: null, phase: 'error', writable: false } : {}), confirmation: null, message: op.kind === 'status' ? 'the original result is still uncertain. check again or retry the original change.' : 'the current policy is unavailable. refresh to try again.' });
        return false;
    }
    function acknowledge(op: Operation, value: unknown, historical = false) {
        const original = op.intent;
        if (!original || pending !== original)
            throw new TransportError(503, 'write');
        const result = policyResult(value);
        if (result.ownerActorId !== original.base.ownerActorId || result.requireKanujApproval !== original.command.requireKanujApproval || result.revision !== original.command.expectedPolicyRevision + 1)
            throw new TransportError(503, 'write');
        if (!owned(op))
            return false;
        const desired = state.desired;
        pending = null;
        remember();
        readDay = historical ? null : day();
        return done(op, { ...state, phase: historical ? 'unread' : 'ready', current: historical ? null : result, base: result, desired, pending: null, confirmation: null, writeState: desired === result.requireKanujApproval ? 'saved' : 'idle', message: desired === result.requireKanujApproval ? 'policy saved.' : 'the original change was saved. your newer change is unsaved.' });
    }
    async function dispatch(intent: Pending, recovering = false) {
        reconcile();
        if (!canWrite() || pending !== intent)
            return false;
        const op = begin('write', intent);
        publish({ ...state, confirmation: null, pending: intent.summary, writeState: 'saving', message: null });
        if (!applicable(op))
            return false;
        try {
            // No await/serialization gap can change this immutable command or its UUID.
            op.dispatched = true;
            const result = await port.execute(intent.command, { signal: op.controller.signal, isApplicable: () => applicable(op) });
            reconcile();
            if (!owned(op))
                return false;
            const before = notification, applied = acknowledge(op, result, recovering);
            if (recovering && applied && notification === before + 1 && !active && current())
                return refresh();
            return applied;
        }
        catch (error) {
            return failed(op, error);
        }
    }
    async function refresh() {
        reconcile();
        if (!current() || !view())
            return false;
        const prior = active;
        if (prior?.kind === 'write' && prior.dispatched && pending === prior.intent)
            remember();
        const op = begin('read');
        publish({ ...state, phase: 'loading', current: null, writable: false, confirmation: null, writeState: pending ? 'uncertain' : state.writeState, message: null });
        try {
            if (!await ready(op))
                return false;
            const result = await port.execute({ schemaVersion: 1, action: 'read_policy_v1' }, { signal: op.controller.signal, isApplicable: () => applicable(op) });
            reconcile();
            if (!owned(op))
                return false;
            const policy = policyResult(result), keep = state.base !== null && (state.desired !== state.base.requireKanujApproval || state.writeState === 'conflict' || !!pending);
            // A fresh read can discover the same revision conflict as a rejected
            // write. Preserve unsent work for deliberate reapply; an unresolved
            // original operation retains its separate uncertainty/recovery path.
            const conflict = keep && !pending && state.base !== null && (state.base.revision !== policy.revision || state.base.ownerActorId !== policy.ownerActorId);
            readDay = day();
            const next: OwnerPolicyState = { ...state, phase: 'ready', current: policy, base: keep ? state.base : policy, desired: keep ? state.desired : policy.requireKanujApproval, confirmation: null, writeState: conflict ? 'conflict' : state.writeState, message: conflict ? 'this policy changed. refresh it, compare your change, then reapply.' : null };
            active = null;
            state = Object.freeze(next);
            publish({ ...state, writable: canWrite() });
            return true;
        }
        catch (error) {
            return failed(op, error);
        }
    }
    function edit(desired: boolean) {
        reconcile();
        if (!current() || !view() || state.desired === null || typeof desired !== 'boolean')
            return;
        const old = detach();
        if (old?.kind === 'write' && !old.dispatched && pending === old.intent) {
            pending = null;
            remember();
        }
        publish({ ...state, desired, confirmation: null, pending: pending?.summary ?? null, writeState: pending ? 'uncertain' : state.writeState === 'conflict' ? 'conflict' : 'idle', message: null, writable: canWrite() });
    }
    function requestSave(): PolicyConfirmation | null {
        reconcile();
        if (!canWrite() || active || pending || !state.current || !state.base || state.current.revision !== state.base.revision || state.current.ownerActorId !== state.base.ownerActorId || state.desired === null || state.desired === state.current.requireKanujApproval || state.writeState === 'conflict')
            return null;
        const confirmation = Object.freeze({ base: state.base, desired: state.desired });
        publish({ ...state, confirmation, writeState: 'confirming', message: null });
        return state.confirmation === confirmation ? confirmation : null;
    }
    function cancelConfirmation() {
        reconcile();
        if (state.confirmation)
            publish({ ...state, confirmation: null, writeState: 'idle' });
    }
    async function confirmSave(confirmation: PolicyConfirmation) {
        reconcile();
        if (!confirmation || confirmation !== state.confirmation || !canWrite() || pending || active || state.base !== confirmation.base || state.desired !== confirmation.desired)
            return false;
        const command: Setting = Object.freeze({ schemaVersion: 1, action: 'set_sami_approval_policy_v1', requestId: crypto.randomUUID(), expectedPolicyRevision: confirmation.base.revision, requireKanujApproval: confirmation.desired, confirmed: true });
        pending = Object.freeze({ command, base: confirmation.base, summary: Object.freeze({ requestId: command.requestId, expectedPolicyRevision: command.expectedPolicyRevision, desired: command.requireKanujApproval }) });
        remember();
        return dispatch(pending);
    }
    async function checkStatus() {
        reconcile();
        if (!current() || !view() || !pending || active)
            return false;
        const intent = pending, op = begin('status', intent);
        publish({ ...state, message: null });
        try {
            if (!await ready(op))
                return false;
            const result = await port.execute({ schemaVersion: 1, action: 'request_status_v1', requestId: intent.command.requestId }, { signal: op.controller.signal, isApplicable: () => applicable(op) });
            reconcile();
            if (!owned(op) || pending !== intent)
                return false;
            if (!('status' in result))
                throw new TransportError(503);
            if (result.status === 'committed') {
                const before = notification, applied = acknowledge(op, result.receipt, true);
                if (applied && notification === before + 1 && !active && current())
                    return refresh();
                return applied;
            }
            pending = null;
            remember();
            return done(op, { ...state, pending: null, confirmation: null, writeState: 'absent', message: 'the original change was not recorded. review your change before saving again.' });
        }
        catch (error) {
            return failed(op, error);
        }
    }
    async function retryOriginal() {
        reconcile();
        if (!pending || active || !current() || !view())
            return false;
        const intent = pending, op = begin('status', intent);
        try {
            if (!await ready(op) || pending !== intent)
                return false;
            active = null;
            if (!canWrite())
                return false;
            return dispatch(intent, true);
        }
        catch (error) {
            return failed(op, error);
        }
    }
    function reapply() {
        reconcile();
        if (!canWrite() || pending || active || !state.current || state.desired === null || state.writeState !== 'conflict')
            return;
        publish({ ...state, base: state.current, confirmation: null, writeState: 'idle', message: state.desired === state.current.requireKanujApproval ? 'the current policy already matches your change.' : 'your change is ready to review and save.' });
    }
    const stop = runtime.subscribe(reconcile);
    const stopBoundary = boundary?.subscribeInvalidation(reconcile);
    return {
        getSnapshot() {
            reconcile();
            // A synchronous subscriber can replace this controller while reconciling.
            if (!disposed && (!current() || !view())) reconcile();
            return state;
        },
        subscribe(fn: () => void) { listeners.add(fn); return () => listeners.delete(fn); },
        refresh, edit, requestSave, cancelConfirmation, confirmSave, checkStatus, retryOriginal, reapply,
        dispose() {
            if (disposed)
                return;
            const old = detach();
            if (old?.kind === 'write' && !old.dispatched && pending === old.intent) {
                pending = null;
                remember();
            }
            disposed = true;
            stop();
            stopBoundary?.();
            port.dispose();
            state = Object.freeze({ ...empty, phase: 'ended' });
            listeners.clear();
        },
    };
}
export type OwnerPolicyController = ReturnType<typeof createOwnerPolicyController>;
