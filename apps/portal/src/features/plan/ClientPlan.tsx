import { useSyncExternalStore } from 'react';
import type { PlanDecision, PlanProduct, RoutineStep } from '../../../../../src/contracts/PortalRebuild.ts';
import { Button, Badge, Sheet, StatusNotice, Tabs } from '../../ui/index.ts';
import { PageHeader, Panel } from '../../shell/PortalShell.tsx';
import { BackButton, usePortalNavigation } from '../../navigation/react.tsx';
import type { RoutinePeriod } from '../../navigation/routes.ts';
import type { ClientPlanProps,PlanNavigationPort } from './types.ts';
import { DecisionControls } from './DecisionControls.tsx';
import { decisionNames, productContext, routineFor } from './model.ts';
import { ProductPhoto, GuideContent, Sources, Facts, Comparisons, ScheduleContent } from './content.tsx';
import './plan.css';
function usePlanNavigation(port?:PlanNavigationPort) {
    const shared=usePortalNavigation();
    return port?{route:port.route,navigator:port}:shared;
}
function PlanBack({navigation,children}:{navigation?:PlanNavigationPort;children:string}) {
    return <BackButton onClick={navigation?event=>{event.preventDefault();navigation.back();}:undefined}>{children}</BackButton>;
}
/** One renderer for entitled client data, previews, historical reads and Maya.
 * Mount inside the shared shell/navigation/overlay providers. No auth or fetch. */
export function ClientPlan(props: ClientPlanProps) { return <SessionPlan key={props.session.key} {...props}/>; }
function SessionPlan(props: ClientPlanProps) {
    const { session, view, mode } = props, { route, navigator } = usePlanNavigation(props.navigation);
    const valid = useSyncExternalStore(session.subscribeInvalidation, session.isCurrent, session.isCurrent);
    if (!valid)
        return <StatusNotice tone="denied" title="session changed">sign in again to view your plan.</StatusNotice>;
    if (view.access === 'preparation' || !view.plan)
        return <><PageHeader title="your plan"/><StatusNotice title="your plan is being prepared">your published plan will appear here when it is ready.</StatusNotice></>;
    const c = view.plan.content, period: RoutinePeriod = route && 'routine' in route ? route.routine : 'morning';
    const readOnly = mode === 'historical' || view.access === 'read_only';
    const productId = route && 'productId' in route ? route.productId : null, selected = productId ? productContext(view, productId) : null;
    const decision = route?.name === 'recommendation' ? c.decisions.find(d => d.id === route.decisionId) : null;
    const evidence = route?.name === 'product-evidence';
    const unavailable = route?.name === 'recommendation' && !decision || productId && !selected;
    const title = unavailable ? 'unavailable' : evidence ? 'directions & evidence' : decision ? 'review a recommendation' : 'your plan';
    const subtitle = unavailable ? undefined : evidence ? selected?.product.name : decision ? `${c.title} · this is not a purchase or a recorded start` : [c.title, c.summary].filter(Boolean).join(' · ');
    return <div className="plan-view">
  <PageHeader title={title} description={subtitle} action={props.onExport ? <Button variant="ghost" onClick={props.onExport}>download plan</Button> : undefined}/>
  {readOnly ? <StatusNotice title={mode === 'historical' ? 'historical plan' : 'read-only plan'}>this view preserves published advice. choices and use reporting are unavailable.</StatusNotice> : null}
  {unavailable ? <StatusNotice title="this item is unavailable" action={<PlanBack navigation={props.navigation}>back</PlanBack>}>return to your plan to choose a recorded item.</StatusNotice> : evidence && selected ? <Evidence props={props} selected={selected}/> : decision ? <Recommendation props={props} decision={decision} period={period}/> : <Routine props={props} period={period}/>}
  {route?.name === 'product' && selected ? <Sheet open onOpenChange={open => { if (!open)
        navigator.back(); }} title={selected.product.name || 'product details'} backLabel="back to plan"><ProductDetails props={props} selected={selected} period={period}/></Sheet> : null}
 </div>;
}
function ProductIdentity({ product, compact = false, sheet = false }: {
    product: PlanProduct;
    compact?: boolean;
    sheet?: boolean;
}) { return <div className={`plan-product-identity ${compact ? 'plan-product-compact' : ''}`}><ProductPhoto product={product} size={compact ? 'summary' : 'identity'}/><div>{product.brand && !sheet ? <p className="plan-meta">{product.brand}</p> : null}<h2>{(sheet ? product.name : product.variant) || product.name || 'product name not recorded'}</h2>{!compact ? <p className="plan-meta">{sheet && product.variant ? product.variant + ' · ' : ''}{product.sizeLabel || 'size not recorded'}{product.strength.state === 'known' ? ` · ${product.strength.value}` : null}</p> : null}</div></div>; }
function Routine({ props, period }: {
    props: ClientPlanProps;
    period: RoutinePeriod;
}) {
    const { view } = props, c = view.plan!.content, { navigator } = usePlanNavigation(props.navigation);
    const paused = c.decisions.filter(d => d.kind === 'pause' || d.kind === 'leave_out');
    const proposed = c.decisions.filter(d => d.kind !== 'pause' && d.kind !== 'leave_out' && d.kind !== 'keep' && !view.decisions.some(s => s.decisionId === d.id && s.choice !== 'deferred'));
    const rows = (p: RoutinePeriod) => <div className="plan-routine-list">{routineFor(view, p).length ? routineFor(view, p).map((step, i) => <RoutineRow key={step.id} step={step} period={p} index={i} props={props}/>) : <p className="plan-muted">no routine steps recorded for this time of day.</p>}</div>;
    return <div className="plan-columns"><div className="plan-stack plan-main-column"><div data-plan-routine><Panel className="plan-routine"><div><div className="plan-routine-heading"><h2>your current routine</h2><Badge tone="active">{props.mode === 'historical' ? 'historical' : 'current'}</Badge></div><Tabs className="plan-routine-tabs" value={period} onValueChange={value => navigator.navigate({ name: 'plan', routine: value as RoutinePeriod })} label="routine" items={[{ value: 'morning', label: 'morning', content: rows('morning') }, { value: 'evening', label: 'evening', content: rows('evening') }]}/></div></Panel></div>
 {paused.length ? <section className="plan-stack plan-paused" data-plan-paused><h2>paused & left out</h2>{paused.map(d => <div key={d.id}><h3>{d.guidance.title || decisionNames[d.kind]}</h3><p className="plan-muted">{d.reason}</p>{d.cautions.map((t, i) => <p key={i}>{t}</p>)}</div>)}</section> : null}
 {c.routineGuides.filter(g=>g.productId===null).map(g=><GuideContent key={g.id} guide={g}/>)}{c.context.products.state !== 'recorded' ? <p className="plan-muted">{c.context.products.state === 'none' ? 'no current products recorded.' : 'current product context is not recorded.'}</p> : null}
 </div><aside className="plan-stack plan-context">
 {proposed.map(d => { const product = c.products.find(p => p.id === d.primaryProductId); return <Panel className="plan-proposal" key={d.id}><Badge tone="pending">{proposed.length === 1 ? 'one proposed change' : decisionNames[d.kind]}</Badge>{product ? <ProductIdentity product={product} compact/> : <h2>{d.guidance.title || 'plan decision'}</h2>}<p>{d.reason}</p><Button onClick={() => navigator.navigate({ name: 'recommendation', decisionId: d.id, routine: period })}>review recommendation</Button><p className="plan-small">{d.primaryProductId && !view.actualUse.some(a => a.productId === d.primaryProductId) ? 'not in your active routine yet' : 'review this plan decision'}</p></Panel>; })}
 <Panel className="plan-follow-up"><h2>your next check-in</h2><p className="plan-review-date">{view.nextReviewOn || 'not scheduled'}</p>{c.followUp.criteria.map((t, i) => <p key={i}>{t}</p>)}{c.followUp.authoredNotes.map((t, i) => <p key={i}>{t}</p>)}{props.onSendUpdate && props.mode==='client' && view.access==='active' ? <Button variant="secondary" onClick={props.onSendUpdate}>send an update</Button> : null}</Panel>
 {props.onHistory ? <Button variant="ghost" onClick={props.onHistory}>view plan history</Button> : null}
 </aside></div>;
}
function RoutineRow({ step, period, index, props }: {
    step: RoutineStep;
    period: RoutinePeriod;
    index: number;
    props: ClientPlanProps;
}) {
    const { navigator } = usePlanNavigation(props.navigation), product = props.view.plan!.content.products.find(p => p.id === step.productId), short = step.usage?.short[period];
    if (step.schedule.asNeeded)
        return <article className="plan-optional-row"><span>optional</span><div><strong>{step.title || product?.name || 'routine step'}</strong><p>{short || step.directions.join(' ')}</p>{step.cautions.map((t, i) => <p className="plan-inline-caution" key={i}>{t}</p>)}</div></article>;
    return <article className="plan-routine-row" data-product-id={step.productId ?? undefined} data-optional={step.schedule.asNeeded || undefined}><span className="plan-row-number">{step.schedule.asNeeded ? 'optional' : String(index + 1).padStart(2, '0')}</span>{product ? <ProductPhoto product={product}/> : <div className="plan-instruction-mark" aria-hidden="true">step</div>}<div className="plan-row-copy"><h3>{step.title || product?.name || 'routine step'}</h3>{short ? <p className="plan-muted">{short}</p> : null}{(short && step.kind === 'product' ? [] : step.directions.filter(t => t !== short)).map((t, i) => <p className="plan-muted" key={i}>{t}</p>)}{step.cautions.map((t, i) => <p className="plan-inline-caution" key={i}>{t}</p>)}<ScheduleContent schedule={step.schedule}/></div>{product ? <Button id={`plan-product-${product.id}`} variant="ghost" aria-label={`details for ${product.name || 'unnamed product'}`} onClick={() => navigator.navigate({ name: 'product', productId: product.id, routine: period })}>details</Button> : null}</article>;
}
function Recommendation({ props, decision: d, period }: {
    props: ClientPlanProps;
    decision: PlanDecision;
    period: RoutinePeriod;
}) {
    const c = props.view.plan!.content, product = c.products.find(p => p.id === d.primaryProductId), { navigator } = usePlanNavigation(props.navigation);
    return <div className="plan-columns"><Panel className="plan-recommendation"><PlanBack navigation={props.navigation}>back to plan</PlanBack><Badge tone="pending">{decisionNames[d.kind]}</Badge>{product ? <ProductIdentity product={product}/> : <h2>{d.guidance.title || 'plan decision'}</h2>}<hr /><h2>{d.guidance.rationaleTitle || 'why this fits your plan'}</h2>{d.guidance.reasons.length ? d.guidance.reasons.map((r, i) => <section className="plan-stack" key={i}>{i > 0 && r.title ? <h3>{r.title}</h3> : null}<p>{r.body}</p></section>) : <p>{d.reason}</p>}{d.limitations.map((t, i) => <p className="plan-muted" key={i}>{t}</p>)}{d.directions.length ? <section className="plan-use-summary plan-stack"><h3>how to use it</h3>{d.directions.map((t, i) => <p key={i}>{t}</p>)}<ScheduleContent schedule={d.schedule}/></section> : null}{product ? <Button variant="secondary" onClick={() => navigator.navigate({ name: 'product-evidence', productId: product.id, routine: period })}>directions, ingredients & sources</Button> : <><Facts facts={d.guidance.facts}/>{d.guidance.actions.map((t,i)=><p key={i}>{t}</p>)}{d.guidance.how?.productId===null?<GuideContent guide={d.guidance.how}/>:null}<Sources sources={d.guidance.sources}/></>}</Panel><aside className="plan-stack"><Panel className="plan-choice-panel"><DecisionControls key={`${props.session.key}:${props.view.plan!.version}:${d.id}`} {...props} decision={d}/></Panel>{d.cautions.length ? <section className="plan-caution plan-stack"><h2>before you use it</h2>{d.cautions.map((t, i) => <p key={i}>{t}</p>)}</section> : null}</aside></div>;
}
type Context = NonNullable<ReturnType<typeof productContext>>;
function ProductDetails({ props, selected: s, period }: {
    props: ClientPlanProps;
    selected: Context;
    period: RoutinePeriod;
}) {
    const { navigator } = usePlanNavigation(props.navigation);
    const currentDecision = s.decisions.find(d => d.currentProductIds.includes(s.product.id));
    const directions = s.steps.flatMap(step => step.directions);
    return <div className="plan-stack plan-product-sheet"><Badge tone={s.current || s.started ? 'active' : 'pending'}>{s.current || s.started ? 'in your routine' : 'not started'}</Badge><ProductIdentity product={s.product} sheet/><section className="plan-stack"><h2>how to use it</h2>{directions.length ? directions.map((t, i) => <p key={i}>{t}</p>) : s.guides.length ? <GuideContent guide={s.guides[0]!}/> : <p>directions are not recorded.</p>}{s.steps.flatMap(step => step.cautions).map((t, i) => <p className="plan-inline-caution" key={i}>{t}</p>)}{s.steps.map(step => <ScheduleContent key={step.id} schedule={step.schedule}/>)}</section>{currentDecision ? <><hr /><h2>why it stays</h2><p className="plan-muted">{currentDecision.guidance.reasons[0]?.body || currentDecision.reason}</p></> : null}<Button variant="secondary" onClick={() => navigator.navigate({ name: 'product-evidence', productId: s.product.id, routine: period })}>ingredients & evidence</Button>{props.onRecordUse && props.mode === 'client' && props.view.access === 'active' ? <><hr /><h3>using it differently?</h3><Button variant="secondary" onClick={() => props.onRecordUse?.(s.product.id)}>record a change in use</Button><p className="plan-meta">your report is kept separate from the published advice.</p></> : null}</div>;
}
function Evidence({ props, selected: s }: {
    props: ClientPlanProps;
    selected: Context;
}) {
    const c = props.view.plan!.content;
    return <div className="plan-columns" data-plan-evidence><Panel className="plan-evidence-main"><PlanBack navigation={props.navigation}>back to product</PlanBack><h2>{s.product.name || 'product name not recorded'} · ingredients & reasoning</h2>{s.product.reference ? <p>{s.product.reference}</p> : null}{s.guides.map(g => <GuideContent key={g.id} guide={g}/>)}{s.steps.map(step => <section className="plan-stack" key={step.id}>{step.directions.map((t, i) => <p key={i}>{t}</p>)}{step.cautions.map((t, i) => <p className="plan-inline-caution" key={i}>{t}</p>)}<ScheduleContent schedule={step.schedule}/></section>)}{s.decisions.map(d => <section className="plan-stack" key={d.id}><h2>{d.guidance.rationaleTitle || 'reasoning'}</h2>{(d.primaryProductId === s.product.id ? d.guidance.reasons : d.guidance.reasons.slice(0, 1)).map((r, i) => <p key={i}>{r.body}</p>)}<Comparisons items={d.guidance.comparisons} currentName={d.currentProductIds.map(id => c.products.find(p => p.id === id)?.name || 'product name not recorded').join(', ') || 'current option'} proposedName={c.products.find(p => p.id === d.primaryProductId)?.name || 'proposed option'}/><Facts facts={d.guidance.facts}/>{d.guidance.actions.map((t,i)=><p key={i}>{t}</p>)}</section>)}<Facts facts={s.product.evidence}/></Panel><aside className="plan-stack"><Panel><h2>evidence & limits</h2>{s.decisions.flatMap(d => [...d.limitations, ...d.cautions]).map((t, i) => <p key={i}>{t}</p>)}<p className="plan-muted">{s.product.identity === 'client_confirmed' ? 'product identity reported by you.' : 'product identity has not been confirmed.'} {s.product.formula === 'verified' ? 'formula recorded as verified.' : 'the image does not verify the formula.'}</p><Sources sources={[...(s.product.productUrl ? [{ label: s.product.sourceLabel || 'manufacturer’s product information', url: s.product.productUrl }] : []), ...s.guides.flatMap(g => g.sources), ...s.decisions.flatMap(d => d.guidance.sources)]}/></Panel></aside></div>;
}
