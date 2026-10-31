import type { ClientCareHistoryPage, ClientPlanViewV3, ReportEvent, ReportReplacement, ReportWriteReceipt, ReportNoopReceipt } from '../../../../../src/contracts/PortalReview.ts';
import { mapReviewResult } from '../../../../../src/contracts/PortalReviewMapping.ts';
import { goalReportHasObservation } from '../../../../../src/contracts/PortalReviewValidation.ts';
import type { HistoryContext, HistoryState, HistoryController, HistoryCommand, ReportCommand, ReportIntent, HistoryOutcome } from './types.ts';
import { appendHistory, buildReportCommand, emptyBody } from './model.ts';
const memoryKey = 'shelv.history.intent.v1';
type Stored = Pick<HistoryState, 'intent' | 'pending' | 'mutation' | 'receipt' | 'needsReview'>;
const initial = (): HistoryState => ({ phase: 'idle', view: null, amendmentView: null, pages: [], version: null, loadingMore: false, checkingStatus:false, readError: false, intent: null, mutation: 'idle', pending: null, receipt: null, needsReview: false, error: null });
const clone = <T>(value: T): T => structuredClone(value);
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const writes = (c: HistoryCommand): c is ReportCommand => c.action === 'submit_goal_report_v1' || c.action === 'amend_report_v1';
/** In-memory controller, owned by one actual captured session. Tests may supply
 * pure OperationPorts; those are not Auth, persistence or notification proof. */
export function createHistoryController(context: HistoryContext, uuid: () => string = () => crypto.randomUUID()): HistoryController {
    let ctx = context, state = initial(), disposed = false, ended = false, epoch = 0, lastAccess: ClientPlanViewV3['access'] | null = null;
    const listeners = new Set<() => void>();
    let readOwner: symbol | null = null, writeOwner: symbol | null = null, detailOwner: symbol | null = null;
    let unsubscribe = () => { };
    function emit() { listeners.forEach(fn => fn()); }
    function remember() { if (!disposed && !ended && ctx.session.isCurrent()) {
        const { intent, pending, mutation, receipt, needsReview } = state;
        ctx.session.memory.set(memoryKey, clone({ intent, pending, mutation, receipt, needsReview }));
    } }
    function set(patch: Partial<HistoryState>) { state = { ...state, ...patch }; remember(); emit(); }
    function invalidate() { if (ended)
        return; ended = true; epoch++; readOwner = null; writeOwner = null; detailOwner = null; ctx.session.memory.delete(memoryKey); state = { ...initial(), phase: 'ended' }; emit(); }
    function current() { if (disposed || ended)
        return false; if (!ctx.session.isCurrent()) {
        invalidate();
        return false;
    } return true; }
    function attach() { unsubscribe = ctx.session.subscribeInvalidation(invalidate); const stored = ctx.session.memory.get<Stored>(memoryKey); if (stored) {
        state = { ...state, ...clone(stored), mutation: stored.pending ? 'uncertain' : stored.mutation === 'saving' ? 'conflict' : stored.mutation, needsReview: stored.needsReview || stored.mutation === 'conflict' };
    } }
    attach();
    function capture() { return { epoch, context: ctx, session: ctx.session }; }
    function applies(c: ReturnType<typeof capture>) { return current() && epoch === c.epoch && ctx === c.context && ctx.session === c.session; }
    function permitted() { return current() && ctx.mode === 'client' && !!ctx.port; }
    function active() { return permitted() && state.phase === 'ready' && !state.readError && !state.loadingMore && state.version === null && state.view?.access === 'active' && state.view.currentGuidance?.mode === 'current_document'; }
    /** A current private-history denial retires this feature's readable lease,
     * not the actual cookie. Keep local intent and the original uncertain wire. */
    function denyReadableHistory() {
        epoch++;
        readOwner = null;
        detailOwner = null;
        writeOwner = null;
        set({ phase: 'denied', view: null, amendmentView: null, pages: [], loadingMore: false, checkingStatus: false,
            readError: true, needsReview: true, mutation: state.pending ? 'uncertain' : state.mutation,
            error: 'you do not currently have access to this record.' });
    }
    async function execute(command: HistoryCommand): Promise<HistoryOutcome> {
        if (!ctx.port)
            return { state: 'rejected', status: 503, code: 'unavailable' };
        try {
            return await ctx.port.execute(command);
        }
        catch (error) {
            const status = (error as {
                status?: number;
            })?.status;
            if (status === 401 || status === 403)
                return { state: 'rejected', status, code: status === 401 ? 'session_ended' : 'forbidden' };
            if (writes(command))
                return { state: 'uncertain', status: 503, code: 'uncertain', retry: command };
            return { state: 'rejected', status: 503, code: 'unavailable' };
        }
    }
    // A business/status 403 is a READ denial, not proof the original mutation
    // failed. Actual owner/CSRF/lease loss is checked by the real boundary and
    // creation-bound port and arrives as an ended boundary/401.
    function authFailure(outcome: HistoryOutcome) { if (outcome.state === 'rejected' && outcome.status === 401) {
        invalidate();
        return true;
    } return false; }
    async function fetchBasis(version: number | null, c: ReturnType<typeof capture>, owns: () => boolean) {
        const command = { schemaVersion: 1, action: 'read_client_plan_v3', version: null } as const;
        const read = await execute(command);
        if (!applies(c) || !owns())
            return null;
        if (authFailure(read))
            return null;
        if (read.state !== 'ok')
            throw Object.assign(new Error('current plan unavailable'),{status:read.status});
        const view = mapReviewResult(read.value, command) as ClientPlanViewV3;
        const historyCommand = { schemaVersion: 1, action: 'read_care_history_v1', version, cursor: null, limit: 40 } as const;
        const history = await execute(historyCommand);
        if (!applies(c) || !owns())
            return null;
        if (authFailure(history))
            return null;
        if (history.state !== 'ok')
            throw Object.assign(new Error('history unavailable'),{status:history.status});
        const page = mapReviewResult(history.value, historyCommand) as ClientCareHistoryPage;
        if (view.currentGuidance) {
            const s = view.currentGuidance.snapshot, h = page.heads;
            if (s.useHead !== h.useHead || s.reportHead !== h.reportHead || s.instructionHead !== h.instructionHead || s.serviceRevision !== h.serviceRevision || s.currentPublication.version !== h.publicationVersion)
                throw new Error('history changed');
        }
        return { view, page };
    }
    async function load(version: number | null = state.version) {
        if (!current())
            return;
        const c = capture(), token = Symbol('history read');
        readOwner = token;
        detailOwner = null;
        set({ phase: 'loading', view: null, amendmentView: null, pages: [], version, loadingMore: false, readError: false, error: null });
        if (!permitted()) {
            if (applies(c) && readOwner === token)
                set({ phase: 'error', error: 'history is unavailable in this view' });
            return;
        }
        try {
            const basis = await fetchBasis(version, c, () => readOwner === token);
            if (!applies(c) || readOwner !== token || !basis)
                return;
            const returned = lastAccess === 'read_only' && basis.view.access === 'active';
            const readonlyIntent=basis.view.access==='read_only'&&state.intent!==null;
            const changedPublication=state.intent?.kind==='new'&&basis.view.plan!==null&&!same(state.intent.body.publication,{version:basis.view.plan.version,documentSchemaVersion:basis.view.plan.documentSchemaVersion});
            lastAccess = basis.view.access;
            set({ phase: 'ready', view: basis.view, pages: [basis.page], ...returned||readonlyIntent||changedPublication ? { needsReview: true, mutation: state.pending ? 'uncertain' : 'conflict' } : {} });
            if (state.intent?.kind === 'amendment')
                await loadAmendmentView(state.intent.original, c);
        }
        catch (error) {
            if (applies(c) && readOwner === token)
                set({ phase: (error as {status?:number})?.status===403?'denied':'error', readError: true, error: 'could not load your record. retry to fetch the current record.' });
        }
        finally {
            if (applies(c) && readOwner === token)
                readOwner = null;
        }
    }
    async function loadMore() {
        const last = state.pages.at(-1);
        if (!permitted() || state.phase !== 'ready' || !last?.nextCursor || state.loadingMore)
            return;
        const c = capture(), pages = state.pages, token = Symbol('history page');
        readOwner = token;
        set({ loadingMore: true, readError: false });
        const command = { schemaVersion: 1, action: 'read_care_history_v1', version: state.version, cursor: last.nextCursor, limit: 40 } as const;
        try {
            const result = await execute(command);
            if (!applies(c) || readOwner !== token)
                return;
            if (authFailure(result))
                return;
            if (result.state !== 'ok') {
                if (result.state === 'rejected' && result.status === 403) {
                    denyReadableHistory();
                    return;
                }
                if (result.state === 'rejected' && result.status === 409) {
                    set({ readError: true, error: 'your record changed. reload the current record before continuing.' });
                    return;
                }
                throw new Error();
            }
            const page = mapReviewResult(result.value, command) as ClientCareHistoryPage;
            set({ pages: appendHistory(pages, page) });
        }
        catch {
            if (applies(c) && readOwner === token)
                set({ readError: true, error: 'could not continue this record. reload to start a current record.' });
        }
        finally {
            if (applies(c) && readOwner === token) {
                readOwner = null;
                set({ loadingMore: false });
            }
        }
    }
    async function loadAmendmentView(event: ReportEvent, c: ReturnType<typeof capture>) {
        if (event.kind !== 'goal_report')
            return;
        const token = Symbol('original publication');
        detailOwner = token;
        const command = { schemaVersion: 1, action: 'read_client_plan_v3', version: event.body.publication.version } as const;
        try {
            const result = await execute(command);
            if (!applies(c) || detailOwner !== token)
                return;
            if (authFailure(result))
                return;
            if (result.state !== 'ok')
                throw new Error();
            const view = mapReviewResult(result.value, command) as ClientPlanViewV3;
            if (!view.plan || view.plan.version !== event.body.publication.version || view.plan.documentSchemaVersion !== event.body.publication.documentSchemaVersion)
                throw new Error();
            set({ amendmentView: view });
        }
        catch {
            if (applies(c) && detailOwner === token)
                set({ error: 'the original plan is unavailable. retry the record before editing this correction.' });
        }
        finally {
            if (applies(c) && detailOwner === token)
                detailOwner = null;
        }
    }
    function startReport() {
        if (!active() || state.pending || state.mutation === 'saving')
            return;
        if (state.intent && state.mutation !== 'confirmed' && state.mutation !== 'no_observation')
            return;
        const plan = state.view!.plan;
        if (!plan)
            return;
        set({ intent: { kind: 'new', body: emptyBody({ version: plan.version, documentSchemaVersion: plan.documentSchemaVersion }), occurredOn: { state: 'unknown' } }, amendmentView: null, mutation: 'idle', receipt: null, error: null });
    }
    async function startAmendment(event: ReportEvent) {
        if (!active() || state.pending || state.mutation === 'saving')
            return;
        if (state.intent && !['confirmed', 'no_observation'].includes(state.mutation)) {
            if (state.intent.kind === 'amendment' && same(state.intent.original, event)) {
                await loadAmendmentView(event, capture());
                return;
            }
            if (state.intent.kind === 'amendment' || goalReportHasObservation(state.intent.body) || state.intent.occurredOn.state === 'known') {
                set({ error: 'your unsent update is retained. continue it before starting another correction.' });
                return;
            }
        }
        const entries = state.pages.flatMap(p => p.entries);
        const retained = entries.find(e => e.kind === 'report' && same(e.event, event) || e.kind === 'report_amendment' && same(e.original, event));
        if (!retained)
            return;
        // Amendment head is only known after the entire immutable snapshot is read.
        if (state.pages.at(-1)?.nextCursor !== null) {
            set({ error: 'load the rest of your record before correcting a report.' });
            return;
        }
        const amendments = entries.filter(e => e.kind === 'report_amendment' && e.original.id === event.id).map(e => e.kind === 'report_amendment' ? e.amendment : neverEntry());
        const referenced = new Set(amendments.map(a => a.previousAmendmentHeadId));
        const heads = amendments.filter(a => !referenced.has(a.id));
        if (heads.length > 1) {
            set({ error: 'correction history is incomplete. reload your record.' });
            return;
        }
        const head = heads[0];
        const original: ReportReplacement = event.kind === 'goal_report' ? { kind: 'goal_report', body: event.body } : { kind: 'legacy_report', body: event.body };
        const replacement = clone(head?.replacement ?? original);
        set({ intent: { kind: 'amendment', original: clone(event), expectedAmendmentHeadId: head?.id ?? null, retainedPhotoIds: clone(replacement.body.photoIds), replacement, occurredOn: clone(head?.occurredOn ?? event.occurredOn), reason: '' }, amendmentView: null, mutation: 'idle', receipt: null, error: null });
        await loadAmendmentView(event, capture());
    }
    function edit(intent: ReportIntent) {
        if (!active() || state.pending || state.mutation === 'saving' || !state.intent)
            return;
        if (intent.kind !== state.intent.kind)
            return;
        if (intent.kind === 'amendment' && state.intent.kind === 'amendment' && (!same(intent.original, state.intent.original) || intent.expectedAmendmentHeadId !== state.intent.expectedAmendmentHeadId || !same(intent.retainedPhotoIds, state.intent.retainedPhotoIds)))
            return;
        if (intent.kind === 'new' && state.intent.kind === 'new' && !same(intent.body.publication, state.intent.body.publication))
            return;
        set({ intent: clone(intent), mutation: state.needsReview ? 'conflict' : 'idle', receipt: null, error: null });
    }
    function sourceIds() {
        const intent = state.intent, view = intent?.kind === 'amendment' ? state.amendmentView : state.view;
        const goals = view?.plan?.content.goals.map(g => g.id) ?? [];
        const use = state.pages.flatMap(p => p.entries.flatMap(e => e.kind === 'use' ? [e.event.eventId] : []));
        if (intent?.kind === 'amendment' && intent.original.kind === 'goal_report')
            use.push(...intent.original.body.actualUseEventIds);
        return { goals, use };
    }
    function confirm(raw: unknown, command: ReportCommand) { const receipt = mapReviewResult(raw, command) as ReportWriteReceipt | ReportNoopReceipt; set({ pending: null, receipt, mutation: 'outcome' in receipt ? 'no_observation' : 'confirmed', needsReview: false, error: null }); }
    async function send(command: ReportCommand) {
        const c = capture(), token = Symbol('report write');
        writeOwner = token;
        set({ pending: clone(command), mutation: 'saving', receipt: null, error: null });
        try {
            const result = await execute(command);
            if (!applies(c) || writeOwner !== token)
                return;
            if (authFailure(result))
                return;
            if (result.state === 'ok') {
                try {
                    confirm(result.value, command);
                }
                catch {
                    set({ mutation: 'uncertain', error: 'the result could not be confirmed. check this exact update’s status.' });
                }
                return;
            }
            if (result.state === 'uncertain') {
                set({ mutation: 'uncertain', error: 'the result is uncertain. check status or retry this exact update.' });
                return;
            }
            if (result.status === 409) {
                set({ pending: null, mutation: 'conflict', needsReview: true, error: 'your record changed. fetch and review the current record before sending again.' });
                await load(null);
                return;
            }
            set({ pending: null, mutation: result.status===403?'denied':'idle', needsReview:result.status===403, error: 'the update was not accepted. your unsent answers are retained.' });
        }
        catch {
            if (applies(c) && writeOwner === token)
                set({ mutation: 'uncertain', error: 'the result is uncertain. check this exact update’s status.' });
        }
        finally {
            if (applies(c) && writeOwner === token)
                writeOwner = null;
        }
    }
    async function submit() {
        if (!active() || state.pending || state.needsReview || ['saving', 'confirmed', 'no_observation'].includes(state.mutation) || !state.intent)
            return;
        if (state.intent.kind === 'amendment' && state.intent.original.kind === 'goal_report' && !state.amendmentView) {
            set({ error: 'fetch the original plan before sending this correction.' });
            return;
        }
        const ids = sourceIds();
        try {
            const command = buildReportCommand(state.intent, state.pages[0]!.heads.reportHead, uuid(), ids.goals, ids.use);
            await send(command);
        }
        catch {
            if (current())
                set({ error: 'check the report date, references and correction reason. your answers are retained.' });
        }
    }
    async function retryExact() {
        if (!active() || state.mutation !== 'uncertain' || !state.pending || writeOwner)
            return;
        const pending = state.pending, c = capture(), displayed = state.view, pages = state.pages;
        // This explicit click may review only a basis already fetched for display.
        // A changed/failed/retired recheck leaves the gate for another action.
        if (state.needsReview)
            await reviewCurrent();
        if (!applies(c) || state.view !== displayed || state.pages !== pages || !active() || state.needsReview ||
            state.pending !== pending || state.mutation !== 'uncertain' || writeOwner)
            return;
        await send(pending);
    }
    async function checkStatus() {
        if (!permitted() || !state.pending || writeOwner)
            return;
        const pending = state.pending, c = capture(), token = Symbol('report status');
        writeOwner = token;
        set({ mutation: 'uncertain', checkingStatus:true, error: null });
        const command = { schemaVersion: 1, action: 'request_status_v1', requestId: pending.requestId } as const;
        try {
            const result = await execute(command);
            if (!applies(c) || writeOwner !== token)
                return;
            if (authFailure(result))
                return;
            if (result.state !== 'ok') {
                set({mutation:'uncertain',error:result.status===403?'status access was denied. your exact update is retained.':'status is unavailable. your exact update is still retained.'});
                return;
            }
            const status = mapReviewResult(result.value, command);
            if ('status' in status && status.status === 'committed') {
                confirm(status.receipt, pending);
                return;
            }
            set({ mutation: 'uncertain', error: 'no committed result was found. your exact update is retained; you may check again or retry it.' });
        }
        catch {
            if (applies(c) && writeOwner === token)
                set({ mutation: 'uncertain', error: 'status is unavailable. your exact update is still retained.' });
        }
        finally {
            if (applies(c) && writeOwner === token) {
                writeOwner = null;
                set({checkingStatus:false});
            }
        }
    }
    async function reviewCurrent() {
        if (!active() || !state.needsReview)
            return;
        const retainedPending = state.pending;
        if (!retainedPending && state.intent?.kind === 'amendment' && state.pages.at(-1)?.nextCursor !== null) {
            set({ error: 'load the rest of your record before reviewing this correction.' });
            return;
        }
        const retainedPages = state.pages;
        const basis = { view: state.view, page: state.pages[0] }, c = capture(), token = Symbol('review current');
        readOwner = token;
        set({ phase: 'loading', readError: false });
        try {
            const fresh = await fetchBasis(null, c, () => readOwner === token);
            if (!applies(c) || readOwner !== token || !fresh)
                return;
            const equal = same(basis.view, fresh.view) && same(basis.page?.heads, fresh.page.heads);
            let intent = state.intent;
            if (equal && !retainedPending && intent?.kind === 'new' && fresh.view.plan) {
                intent = { ...intent, body: { ...intent.body, publication: { version: fresh.view.plan.version, documentSchemaVersion: fresh.view.plan.documentSchemaVersion } } };
            }
            if (equal && !retainedPending && intent?.kind === 'amendment') {
                const id = intent.original.id;
                const amendments = retainedPages.flatMap(p => p.entries.flatMap(e => e.kind === 'report_amendment' && e.original.id === id ? [e.amendment] : []));
                const prior = new Set(amendments.map(a => a.previousAmendmentHeadId)), heads = amendments.filter(a => !prior.has(a.id));
                if (heads.length > 1)
                    throw new Error('incomplete corrections');
                const photos = heads[0]?.replacement.body.photoIds ?? intent.original.body.photoIds;
                const replacement = clone(intent.replacement);
                replacement.body.photoIds = [...new Set([...replacement.body.photoIds, ...photos])];
                intent = { ...intent, expectedAmendmentHeadId: heads[0]?.id ?? null, retainedPhotoIds: clone(replacement.body.photoIds), replacement };
            }
            set({ phase: 'ready', view: equal ? basis.view : fresh.view, pages: equal ? retainedPages : [fresh.page], intent,
                needsReview: !equal, mutation: retainedPending ? state.mutation : equal ? 'idle' : 'conflict',
                error: equal ? null : 'your record changed again. review the fetched record before continuing.' });
        }
        catch (error) {
            if (applies(c) && readOwner === token) {
                if ((error as {status?:number})?.status === 403)
                    denyReadableHistory();
                else
                    set({ phase: 'error', readError: true, error: 'current review could not be confirmed. retry the current record.' });
            }
        }
        finally {
            if (applies(c) && readOwner === token)
                readOwner = null;
        }
    }
    return {
        getSnapshot() { current(); return state; }, subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }, load, loadMore, startReport, startAmendment, edit, submit, retryExact, checkStatus, reviewCurrent,
        setContext(next) {
            if (disposed || next === ctx)
                return;
            if (next.session === ctx.session && next.mode === ctx.mode && next.port === ctx.port)
                return;
            const replacement = next.session !== ctx.session;
            if (replacement) {
                ctx.session.memory.delete(memoryKey);
                unsubscribe();
                state = initial();
                ended = false;
                lastAccess = null;
            }
            else if (state.intent) {
                state = { ...state, mutation: state.pending ? 'uncertain' : 'conflict', needsReview: true };
                remember();
            }
            epoch++;
            readOwner = null;
            writeOwner = null;
            detailOwner = null;
            ctx = next;
            state = { ...state, phase: 'idle', view: null, amendmentView: null, pages: [], loadingMore: false, checkingStatus:false };
            if (replacement)
                attach();
            emit();
        },
        dispose() { if (disposed)
            return; remember(); disposed = true; epoch++; readOwner = null; writeOwner = null; detailOwner = null; unsubscribe(); state = initial(); listeners.clear(); },
    };
}
function neverEntry(): never { throw new Error('invalid amendment'); }
