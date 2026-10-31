import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { GoalReportBody, ReportEvent } from '../../../../../src/contracts/PortalReview.ts';
import type { HistoryProps, ReportIntent } from './types.ts';
import { Button, Badge, Field, Input, Textarea, StatusNotice, Icon } from '../../ui/index.ts';
import { PageHeader, Panel } from '../../shell/PortalShell.tsx';
import { Timeline, visibleHistory, ReportBody } from './Timeline.tsx';
import type { HistoryFilter } from './Timeline.tsx';
import './history.css';
export function ClientHistory(props: HistoryProps) {
    const { controller, screen, navigation } = props;
    const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
    const [filter, setFilter] = useState<HistoryFilter>('all');
    const scope = useRef({ controller, screen, navigation });
    if (scope.current.controller !== controller || scope.current.screen !== screen || scope.current.navigation !== navigation)
        scope.current = { controller, screen, navigation };
    useEffect(() => () => { scope.current = { ...scope.current }; }, []);
    useEffect(() => {
        let live = true;
        const s = controller.getSnapshot();
        if (s.phase === 'idle' || screen === 'history')
            void controller.load().then(() => { if (live && screen === 'update')
                controller.startReport(); });
        else if (screen === 'update' && s.phase === 'ready')
            controller.startReport();
        return () => { live = false; };
    }, [controller, screen]);
    const retry = async () => { const captured = scope.current; await controller.load(); if (scope.current === captured && screen === 'update' && controller.getSnapshot().phase === 'ready')
        controller.startReport(); };
    const update = () => { controller.startReport(); navigation.openUpdate(); };
    const correct = async (event: ReportEvent) => { const captured = scope.current; await controller.startAmendment(event); const s = controller.getSnapshot(); if (scope.current === captured && s.phase === 'ready' && s.intent?.kind === 'amendment' && s.intent.original.id === event.id)
        navigation.openUpdate(); };
    const labels = { actorLabel: props.actorLabel, productLabel: props.productLabel, goalLabel: props.goalLabel ?? ((id: string, pub: GoalReportBody['publication']) => state.view?.plan?.version === pub.version && state.view.plan.documentSchemaVersion === pub.documentSchemaVersion ? state.view.plan.content.goals.find(g => g.id === id)?.text ?? null : null) };
    const write = state.phase === 'ready' && state.version === null && state.view?.access === 'active' && state.view.currentGuidance?.mode === 'current_document';
    const entries = state.pages.flatMap(p => p.entries), hasMore = state.pages.at(-1)?.nextCursor != null;
    return <div className="history-view" data-history-screen={screen}>
    <PageHeader title={screen === 'history' ? 'check-ins & history' : state.intent?.kind === 'amendment' ? 'correct an update' : 'send an update'} description={screen === 'history' ? 'your updates, our decisions and what changed' : 'a short update before your check-in, or whenever something changes'} action={screen === 'history' ? props.onExport ? <Button variant="ghost" onClick={props.onExport}>download plan</Button> : undefined : <Button variant="ghost" onClick={navigation.back}><Icon name="arrow-left"/>back to history</Button>}/>
    {state.phase === 'ended' ? <StatusNotice tone="denied" title="your session changed">sign in again to open your record.</StatusNotice> : null}
    {state.phase === 'denied' ? <StatusNotice tone="denied" title="record access denied" action={<Button variant="secondary" onClick={()=>void retry()}>retry current record</Button>}>you do not currently have access to this record. any pending update is retained for this session.</StatusNotice> : null}
    {state.phase === 'idle' || state.phase === 'loading' ? <StatusNotice tone="loading" title="loading your record"/> : null}
    {state.phase === 'error' ? <StatusNotice tone="error" title="your record is unavailable" action={<Button variant="secondary" onClick={() => void retry()}>retry current record</Button>}>{state.error}</StatusNotice> : null}
    {state.intent && state.phase === 'error' ? <StatusNotice tone="neutral" title="your unsent update is retained">retry the current record to continue.</StatusNotice> : null}
    {state.phase === 'ready' ? <>
      {state.view?.access === 'read_only' ? <StatusNotice title="read-only record">your plan and history remain available. new care updates are unavailable.</StatusNotice> : null}
      {state.view?.access === 'preparation' ? <StatusNotice title="your plan is being prepared">you can continue your consultation by text, call or video.</StatusNotice> : null}
      {state.version !== null ? <StatusNotice title={`history for plan version ${state.version}`} action={<Button variant="secondary" onClick={() => void controller.load(null)}>return to all history</Button>}>this is a history filter. it is not a snapshot of actual use at publication.</StatusNotice> : null}
      {state.error && state.mutation !== 'uncertain' && state.mutation !== 'conflict' ? <StatusNotice tone="error" title="check your update">{state.error}</StatusNotice> : null}
      <div className="history-columns">
        <div className="history-stack">
          {screen === 'history' ? <>
            <div className="history-filters" role="group" aria-label="filter history">{([['all', 'all activity'], ['checkins', 'check-ins'], ['changes', 'plan changes']] as const).map(([key, label]) => <Button key={key} variant={filter === key ? 'primary' : 'secondary'} aria-pressed={filter === key} onClick={() => setFilter(key)}>{label}</Button>)}</div>
            <Panel className="history-record"><Timeline entries={entries} filter={filter} labels={labels} onAmend={write && !state.pending ? event => void correct(event) : undefined} onVersion={navigation.openVersion}/>
              {!entries.some(e => visibleHistory(e, filter)) ? <StatusNotice tone="empty" title={hasMore ? 'no matching activity in the loaded pages' : 'no activity to show yet'}>{hasMore ? 'load more to continue through your record.' : 'your future updates and published decisions will appear here.'}</StatusNotice> : null}
              {hasMore ? <Button variant="secondary" busy={state.loadingMore} onClick={() => void controller.loadMore()}>load more activity</Button> : null}
            </Panel>
          </> : <>
            <Feedback state={state} controller={controller}/>
            {state.needsReview ? <Panel><h2>current fetched record</h2><p>{state.view?.plan?.content.title}</p><p>plan version {state.view?.plan?.version ?? 'not recorded'}</p>{state.view?.plan?.content.goals.map(g => <p key={g.id}>{g.text}</p>)}<Timeline entries={entries} filter="all" labels={labels}/>{hasMore ? <Button variant="secondary" busy={state.loadingMore} onClick={() => void controller.loadMore()}>load more before reviewing</Button> : null}</Panel> : null}
            {state.intent ? <ReportForm {...props} state={state} editable={!!write && !state.pending && !['saving', 'confirmed'].includes(state.mutation)} labels={labels}/> : write ? <Button onClick={() => controller.startReport()}>start an update</Button> : null}
          </>}
        </div>
        <aside className="history-stack" aria-label={screen === 'history' ? 'check-in context' : 'help with your update'}>
          {screen === 'history' ? <>{state.view?.access!=='read_only'?<Panel className="history-next"><h2>next check-in</h2><p className="history-review-date">{state.view?.nextReviewOn ?? 'not scheduled'}</p><p>text, call or an update here. this date is not a booked appointment.</p>{write ? <Button onClick={update}>send an update</Button> : null}</Panel>:null}<Panel><h2>your record, in context</h2><p>reported use stays distinct from advice. corrections are added to the record; earlier versions stay available.</p></Panel></> : <Panel className="history-next"><h2>{write?'you don’t need perfect notes':'your unsent update'}</h2><p>{write?'tell us what you noticed. every answer is optional, and “not sure” is useful.':'your record is read-only. any unsent update remains in this session.'}</p>{write ? <p>we’ll review a sent update and reply within 24 hours.</p> : null}{props.onContact ? <Button variant="secondary" onClick={props.onContact}>text shelv</Button> : null}</Panel>}
        </aside>
      </div>
    </> : null}
  </div>;
}
function Feedback({ state, controller }: {
    state: ReturnType<HistoryProps['controller']['getSnapshot']>;
    controller: HistoryProps['controller'];
}) {
    if (state.mutation === 'uncertain')
        return <StatusNotice tone="uncertain" title="update result uncertain" action={<div className="history-actions"><Button variant="secondary" busy={state.checkingStatus} onClick={() => void controller.checkStatus()}>check update status</Button>{state.view?.access === 'active' ? <Button variant="secondary" disabled={state.checkingStatus} onClick={() => void controller.retryExact()}>retry exact update</Button> : null}</div>}>{state.error ?? 'the original update is retained.'}</StatusNotice>;
    if (state.needsReview)
        return <StatusNotice tone="warning" title="review the current record" action={<Button variant="secondary" onClick={() => void controller.reviewCurrent()}>i’ve reviewed this record</Button>}>{state.error ?? 'your unsent answers are retained. review this fetched record before sending again.'}</StatusNotice>;
    if (state.mutation === 'no_observation')
        return <StatusNotice title="nothing was sent">there were no observations to record. add anything you noticed, or return to your history.</StatusNotice>;
    if (state.mutation === 'confirmed')
        return <StatusNotice tone="success" title={state.intent?.kind === 'amendment' ? 'correction recorded' : 'update recorded'}>your advisor can review it. this acknowledgement is not a personal reply.</StatusNotice>;
    return null;
}
type FormProps = HistoryProps & {
    state: ReturnType<HistoryProps['controller']['getSnapshot']>;
    editable: boolean;
    labels: Pick<HistoryProps, 'actorLabel' | 'goalLabel' | 'productLabel'>;
};
function ReportForm({ state, controller, editable, labels }: FormProps) {
    const intent = state.intent!;
    const body = intent.kind === 'new' ? intent.body : intent.replacement.kind === 'goal_report' ? intent.replacement.body : null;
    const source = intent.kind === 'new' ? state.view : state.amendmentView;
    const goals = source?.plan?.content.goals ?? [];
    const change = (next: ReportIntent) => controller.edit(next);
    const setBody = (next: GoalReportBody) => change(intent.kind === 'new' ? { ...intent, body: next } : { ...intent, replacement: { kind: 'goal_report', body: next } });
    const busy = state.mutation === 'saving';
    const actualUses = state.pages.flatMap(p => p.entries.flatMap(e => e.kind === 'use' ? [e.event] : []));
    return <Panel className="history-form"><Badge>{state.pending ? 'pending confirmation' : state.mutation === 'confirmed' ? 'recorded' : 'draft · not sent'}</Badge>
    {intent.kind === 'amendment' ? <><h2>correct your report</h2><p>the original stays in your record. your correction has its own reason and date.</p><details><summary>original report</summary><ReportBody replacement={intent.original.kind === 'goal_report' ? { kind: 'goal_report', body: intent.original.body } : { kind: 'legacy_report', body: intent.original.body }} labels={labels}/></details></> : null}
    <form onSubmit={e => { e.preventDefault(); void controller.submit(); }}>
      {body ? <>
        {intent.kind === 'amendment' && !source ? <StatusNotice tone="warning" title="original plan unavailable">retry the record to load the original goals.</StatusNotice> : null}
        {goals.map(g => <fieldset key={g.id} disabled={!editable}><legend>{g.text} <span className="history-optional">(optional)</span></legend><div className="history-answers">{([['better', 'better'], ['same', 'the same'], ['worse', 'worse'], ['not_sure', 'not sure']] as const).map(([value, label]) => { const selected = body.answers.find(a => a.goalId === g.id)?.change === value; return <Button key={value} variant={selected ? 'primary' : 'secondary'} aria-pressed={selected} onClick={() => setBody({ ...body, answers: [...body.answers.filter(a => a.goalId !== g.id), ...selected ? [] : [{ goalId: g.id, change: value }]] })}>{label}</Button>; })}</div></fieldset>)}
        {body.answers.filter(a => !goals.some(g => g.id === a.goalId)).map(a => <StatusNotice key={a.goalId} tone="warning" title="an original goal is unavailable" action={editable ? <Button variant="secondary" onClick={() => setBody({ ...body, answers: body.answers.filter(v => v.goalId !== a.goalId) })}>remove this answer</Button> : undefined}>{a.goalId}: {a.change.replaceAll('_', ' ')}. the answer is retained until you deliberately remove it.</StatusNotice>)}
        <fieldset disabled={!editable}><legend>how has your skin felt? <span className="history-optional">(optional)</span></legend><div className="history-answers history-comfort">{['comfortable', 'some irritation', 'not sure'].map(value => <Button key={value} variant={body.comfort === value ? 'primary' : 'secondary'} aria-pressed={body.comfort === value} onClick={() => setBody({ ...body, comfort: body.comfort === value ? null : value })}>{value}</Button>)}</div>{body.comfort && !['comfortable', 'some irritation', 'not sure'].includes(body.comfort) ? <Field label="reported comfort"><Textarea value={body.comfort} readOnly={!editable} onChange={e => setBody({ ...body, comfort: e.target.value || null })}/></Field> : null}</fieldset>
        <fieldset disabled={!editable}><legend>what have you actually used? <span className="history-optional">(optional)</span></legend><p className="history-meta">link existing actual-use reports, or describe what you noticed in your notes.</p><div className="history-stack">{actualUses.map(event => { const id = event.eventId, selected = body.actualUseEventIds.includes(id); return <Button key={id} variant={selected ? 'primary' : 'secondary'} aria-pressed={selected} onClick={() => setBody({ ...body, actualUseEventIds: selected ? body.actualUseEventIds.filter(v => v !== id) : [...body.actualUseEventIds, id] })}>{labels.productLabel?.(event.product) ?? (event.product.kind === 'plan_product' ? `product ${event.product.productId} · plan version ${event.product.publication.version}` : 'reported product')} · {event.change.kind.replaceAll('_', ' ')} · {event.occurredOn.state === 'known' ? event.occurredOn.value : 'date not recorded'}</Button>; })}</div>{!actualUses.length ? <p className="history-meta">no actual-use reports are loaded.</p> : null}{body.actualUseEventIds.filter(id => !actualUses.some(e => e.eventId === id)).map(id => <p className="history-meta" key={id}>retained actual-use reference: {id}</p>)}</fieldset>
        <Field label="anything else to discuss? (optional)"><Textarea value={body.notes ?? ''} readOnly={!editable} onChange={e => setBody({ ...body, notes: e.target.value || null })}/></Field>
      </> : intent.kind === 'amendment' && intent.replacement.kind === 'legacy_report' ? (['comfort', 'consistency', 'changes'] as const).map(key => <Field key={key} label={key}><Textarea value={intent.replacement.kind === 'legacy_report' ? intent.replacement.body[key] : ''} readOnly={!editable} onChange={e => { if (intent.replacement.kind === 'legacy_report')
            change({ ...intent, replacement: { kind: 'legacy_report', body: { ...intent.replacement.body, [key]: e.target.value } } }); }}/></Field>) : null}
      <Field label="when did you notice this? (optional)" hint="leave blank if the date is not known."><Input type="date" value={intent.occurredOn.state === 'known' ? intent.occurredOn.value : ''} readOnly={!editable} onChange={e => change({ ...intent, occurredOn: e.target.value ? { state: 'known', value: e.target.value } : { state: 'unknown' } })}/></Field>
      {intent.kind === 'amendment' ? <Field label="reason for this correction"><Textarea value={intent.reason} readOnly={!editable} onChange={e => change({ ...intent, reason: e.target.value })}/></Field> : null}
      {intent.kind === 'amendment' && intent.replacement.body.photoIds.length ? <p className="history-meta">{intent.replacement.body.photoIds.length} existing photo references will be retained.</p> : null}
      <Button type="submit" busy={busy} disabled={!editable || state.needsReview || state.mutation === 'no_observation' || intent.kind === 'amendment' && intent.original.kind === 'goal_report' && !state.amendmentView}>{intent.kind === 'amendment' ? 'send correction' : 'send update'}</Button>
    </form>
  </Panel>;
}
