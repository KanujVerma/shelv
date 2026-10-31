import { useRef, useSyncExternalStore } from 'react';
import type { RefObject } from 'react';
import type {ReportedProductUse} from '../../../../../src/contracts/PortalCare.ts';
import type { PlanDecision, PlanProduct, RoutineStep } from '../../../../../src/contracts/PortalRebuild.ts';
import { Button, Badge, Sheet, StatusNotice, Tabs } from '../../ui/index.ts';
import { PageHeader, Panel } from '../../shell/PortalShell.tsx';
import { BackButton, usePortalNavigation } from '../../navigation/react.tsx';
import type { RoutinePeriod } from '../../navigation/routes.ts';
import type {PlanPreview} from '../../../../../src/contracts/PortalRebuildMapping.ts';
import type {UnpublishedPlanView} from './preview.ts';
import type { ClientPlanProps,PlanNavigationPort } from './types.ts';
import { DecisionControls, PendingDecisionReviews } from './DecisionControls.tsx';
import { decisionNames, isPurchaseDecision, productContext, routineFor, planContent, effectiveUse, suppressContinue } from './model.ts';
import { ProductPhoto, GuideContent, Sources, Facts, ScheduleContent, DecisionReasons, DecisionComparisons, DecisionDirections, ProductAdviceStatus, ProductDirections } from './content.tsx';
import {UseReport} from './UseReport.tsx';
import {ReportedProducts} from './ReportedProducts.tsx';
import {UseFacts,useLabels} from './UseFacts.tsx';
import {DecisionReviewBoundary} from './reviewBasis.tsx';
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
export function ClientPlan(props: ClientPlanProps) { return <DecisionReviewBoundary key={props.session.key} props={props}><SessionPlan {...props}/></DecisionReviewBoundary>; }
type RenderProps=(ClientPlanProps&{kind:'published'})|{kind:'unpublished';view:UnpublishedPlanView;preview:PlanPreview;navigation:PlanNavigationPort};
function SessionPlan(props:ClientPlanProps) {
    const {session,view}=props;
    const valid=useSyncExternalStore(session.subscribeInvalidation,session.isCurrent,session.isCurrent);
    if(!valid)return <StatusNotice tone="denied" title="session changed">sign in again to view your plan.</StatusNotice>;
    if(view.access==='preparation'||!view.plan)return <><PageHeader title="your plan"/><StatusNotice title="your plan is being prepared">your published plan will appear here when it is ready.</StatusNotice></>;
    return <PlanRenderer props={{...props,kind:'published'}}/>;
}
export function PlanRenderer({props}:{props:RenderProps}) {
    const {view}=props,{route,navigator}=usePlanNavigation(props.navigation);
    const productOpeners=useRef(new Map<string,RefObject<HTMLButtonElement|null>>());
    const openerFor=(id:string)=>{let ref=productOpeners.current.get(id);if(!ref){ref={current:null};productOpeners.current.set(id,ref);}return ref;};
    const c = planContent(view)!, period: RoutinePeriod = route && 'routine' in route ? route.routine : 'morning';
    const readOnly = props.kind==='published'&&(props.mode==='historical'||props.view.access==='read_only');
    const productId = route && 'productId' in route ? route.productId : null, selected = productId ? productContext(view, productId) : null;
    const decision = route?.name === 'recommendation' ? c.decisions.find(d => d.id === route.decisionId) : null;
    const evidence = route?.name === 'product-evidence', useRoute=route?.name==='product-use'||route?.name==='report-use';
    const reported=props.kind==='published'&&props.view.schemaVersion===2?props.view.use.reportedProducts.items.find(s=>s.product.reportedProductId===productId):null;
    const unavailable = route?.name === 'recommendation' && !decision || productId && (!!selected&&!!reported || !selected&&!reported || !!reported&&evidence);
    const productEvidence=evidence && selected?.evidenceVariant==='product';
    const title = unavailable ? 'unavailable' : useRoute ? selected?.proposed?'record actual use':selected ? `record a change · ${selected.product.name}` : 'record actual use' : productEvidence ? `${selected.product.name} · ingredients & reasoning` : evidence ? 'directions & evidence' : decision ? 'review a recommendation' : 'your plan';
    const subtitle = unavailable ? undefined : useRoute ? 'what you report does not silently rewrite your advisor’s instructions' : productEvidence ? undefined : evidence ? `${selected?.product.name} · proposed guidance · ${selected?.use.kind==='unavailable'?'actual use unavailable in preview':selected?.use.effective?selected.use.effective.contradiction?'product and use need clarification':useLabels[selected.use.effective.state]:selected?.use.start?'earlier start recorded':'start not recorded'}` : decision ? `${c.title} · this is not a purchase or a recorded start` : c.title;
    return <div className={`plan-view ${useRoute?'plan-use-page':''} ${productEvidence ? 'plan-product-evidence' : evidence ? 'plan-introduction-evidence' : ''}`}>
  <PageHeader title={title} description={subtitle} action={props.kind==='published' && props.onExport && !evidence && !useRoute ? <Button variant="ghost" onClick={props.onExport}>download plan</Button> : undefined}/>
  {props.kind==='published'?<PendingDecisionReviews props={props} selectedDecisionId={decision?.id??null} inPlan={route?.name==='plan'} onReview={()=>navigator.navigate({name:'plan',routine:period})}/>:null}
  {props.kind==='unpublished'?<StatusNotice title="unpublished preview"><p>not published. this preview has not started service or review clocks.</p><p>actual use, choices, service dates and notification dates are unavailable in preview.</p>{props.preview.issues.length?<><h2>validation issues</h2><ul>{props.preview.issues.map((issue,i)=><li key={i}>{issue.section.replaceAll('_',' ')} · {issue.code.replaceAll('_',' ')}</li>)}</ul></>:null}</StatusNotice>:null}
  {readOnly ? <StatusNotice title={props.kind==='published' && props.mode === 'historical' ? 'historical plan' : 'read-only plan'}>this view preserves published advice. choices and use reporting are unavailable.</StatusNotice> : null}
  {props.kind==='published'&&props.view.schemaVersion===2&&props.mode==='historical'?<StatusNotice title="current reported use">the document is historical. use reports below show current reported use and may refer to another publication.</StatusNotice>:null}
  {unavailable ? <StatusNotice title="this item is unavailable" action={<PlanBack navigation={props.navigation}>back</PlanBack>}>return to your plan to choose a recorded item.</StatusNotice> : useRoute ? props.kind==='published'?<UseReport key={productId??'new'} props={props} product={selected?.product??null} proposed={selected?.proposed??false} reported={reported?.product??null} descriptor={reported?.descriptor??null} backLabel={navigator.backDestination?.()?.name==='product'?'back to product':navigator.backDestination?.()?.name==='plan'?'back to plan':'back'} back={()=>navigator.back()}/>:<StatusNotice title="unpublished preview">use reporting is unavailable in preview.</StatusNotice> : evidence && selected ? <Evidence props={props} selected={selected}/> : decision ? <Recommendation props={props} decision={decision} period={period}/> : <Routine props={props} period={period} openerFor={openerFor}/>}
  {route?.name === 'product' && selected && !unavailable ? <Sheet open restoreFocusRef={openerFor(selected.product.id)} onOpenChange={open => { if (!open)
        navigator.back(); }} title={selected.product.name || 'product details'} backLabel="back to plan"><ProductDetails props={props} selected={selected} period={period}/></Sheet> : null}
  {route?.name==='product'&&reported&&!unavailable&&props.kind==='published'?<Sheet open restoreFocusRef={openerFor(`reported:${reported.product.reportedProductId}`)} onOpenChange={open=>{if(!open)navigator.back();}} title={reported.descriptor.name} backLabel="back to plan"><ReportedProductDetails props={props} reported={reported} onRecord={()=>navigator.navigate({name:'product-use',productId:reported.product.reportedProductId,routine:period})}/></Sheet>:null}
 </div>;
}
function ProductIdentity({ product, compact = false, sheet = false }: {
    product: PlanProduct;
    compact?: boolean;
    sheet?: boolean;
}) { return <div className={`plan-product-identity ${compact ? 'plan-product-compact' : ''}`}><ProductPhoto product={product} size={compact ? 'summary' : 'identity'}/><div>{product.brand && !sheet ? <p className="plan-meta">{product.brand}</p> : null}<h2>{(sheet ? product.name : product.variant) || product.name || 'product name not recorded'}</h2>{!compact ? <p className="plan-meta">{sheet && product.variant ? product.variant + ' · ' : ''}{product.sizeLabel || 'size not recorded'}{product.strength.state === 'known' ? ` · ${product.strength.value}` : null}</p> : null}</div></div>; }
function Routine({ props, period, openerFor }: {
    props: RenderProps;
    period: RoutinePeriod;
    openerFor:(id:string)=>RefObject<HTMLButtonElement|null>;
}) {
    const { view } = props, c = planContent(view)!, { navigator } = usePlanNavigation(props.navigation);
    const paused = c.decisions.filter(d => d.kind === 'pause' || d.kind === 'leave_out');
    const proposed = c.decisions.filter(d => d.kind !== 'pause' && d.kind !== 'leave_out' && !(props.kind==='published'&&props.view.decisions.some(s => s.decisionId === d.id && s.choice !== 'deferred'))).sort((a,b)=>Number(b.kind==='addition')-Number(a.kind==='addition'));
    const rows = (p: RoutinePeriod) => <div className="plan-routine-list">{routineFor(view, p).length ? routineFor(view, p).map((step, i) => <RoutineRow key={step.id} step={step} period={p} index={i} props={props} openerFor={openerFor}/>) : <p className="plan-muted">no routine steps recorded for this time of day.</p>}</div>;
    return <div className="plan-columns"><div className="plan-stack plan-main-column"><div data-plan-routine><Panel className="plan-routine"><div><div className="plan-routine-heading"><h2>{props.kind==='unpublished'?'draft routine':'your current routine'}</h2><Badge tone="active">{props.kind==='unpublished'?'unpublished':props.mode==='historical'?'historical':'current'}</Badge></div><Tabs className="plan-routine-tabs" value={period} onValueChange={value => navigator.navigate({ name: 'plan', routine: value as RoutinePeriod })} label="routine" items={[{ value: 'morning', label: 'morning', content: rows('morning') }, { value: 'evening', label: 'evening', content: rows('evening') }]}/></div></Panel></div>
 {props.kind==='published'&&props.view.schemaVersion===2?<section className="plan-stack">{props.view.use.planProducts.filter(s=>s.contradiction||s.state==='paused'||s.state==='stopped'||s.state==='using_differently'||s.state==='unreviewed'||s.state==='using'&&c.decisions.some(d=>(d.kind==='pause'||d.kind==='leave_out')&&(d.primaryProductId===s.product.productId||d.currentProductIds.includes(s.product.productId)))||s.identity&&s.identity.match!=='yes').map(s=><Panel key={s.product.productId}><h2>{c.products.find(p=>p.id===s.product.productId)?.name}</h2><UseFacts use={s} props={props}/><Button ref={openerFor(s.product.productId)} id={`plan-product-${s.product.productId}`} variant="secondary" onClick={()=>navigator.navigate({name:'product',productId:s.product.productId,routine:period})}>published guidance & details</Button></Panel>)}{props.view.use.reportedProducts.items.map(s=><Panel key={s.product.reportedProductId}><h2>{s.descriptor.name}</h2><p className="plan-meta">unreviewed client-reported product · {[s.descriptor.brand,s.descriptor.variant,s.descriptor.strength,s.descriptor.sizeLabel].filter(k=>k.state==='known').map(k=>k.state==='known'?k.value:'').join(' · ')}</p><UseFacts use={s} props={props}/>{props.mode==='client'&&props.view.access==='active'&&props.ports?.care?<Button ref={openerFor(`reported:${s.product.reportedProductId}`)} id={`plan-reported-product-${s.product.reportedProductId}`} variant="secondary" onClick={()=>navigator.navigate({name:'product-use',productId:s.product.reportedProductId,routine:period})}>record a change in use</Button>:null}</Panel>)}{props.view.use.reportedProducts.nextCursor?<ReportedProducts props={props}/>:null}</section>:null}
 {paused.length ? <section className="plan-stack plan-paused" data-plan-paused><h2>paused & left out</h2>{paused.map(d => <div key={d.id}><h3>{d.guidance.title || decisionNames[d.kind]}</h3><p className="plan-muted">{d.reason}</p>{d.cautions.map((t, i) => <p key={i}>{t}</p>)}<Button variant="ghost" onClick={()=>navigator.navigate({name:'recommendation',decisionId:d.id,routine:period})}>review {decisionNames[d.kind]}</Button></div>)}</section> : null}
 {c.summary ? <p className="plan-muted">{c.summary}</p> : null}{c.consultationSections.map((section,i)=><section className="plan-stack" key={i}><h2>{section.title}</h2><p>{section.body}</p></section>)}<Sources sources={c.sources}/>{c.routineGuides.filter(g=>g.productId===null).map(g=><GuideContent key={g.id} guide={g}/>)}{c.context.products.state !== 'recorded' ? <p className="plan-muted">{c.context.products.state === 'none' ? 'no current products recorded.' : 'current product context is not recorded.'}</p> : null}
 </div><aside className="plan-stack plan-context">
 {proposed.map(d => { const product = c.products.find(p => p.id === d.primaryProductId); return <Panel className="plan-proposal" key={d.id}><Badge tone="pending">{proposed.length === 1 ? 'one proposed change' : decisionNames[d.kind]}</Badge>{product ? <ProductIdentity product={product} compact/> : <h2>{d.guidance.title || 'plan decision'}</h2>}<p>{d.reason}</p><Button onClick={() => navigator.navigate({ name: 'recommendation', decisionId: d.id, routine: period })}>review recommendation</Button><p className="plan-small">{props.kind==='unpublished'?'draft proposal · actual use unavailable':props.view.schemaVersion===2&&isPurchaseDecision(d)?effectiveUse(props.view,d.primaryProductId!)?.contradiction?'product and use need clarification':useLabels[effectiveUse(props.view,d.primaryProductId!)?.state??'not_reported']:isPurchaseDecision(d) && props.kind==='published' && !(props.view.schemaVersion===2?effectiveUse(props.view,d.primaryProductId!)?.state==='using':props.view.actualUse.some(a => a.productId === d.primaryProductId)) ? 'proposed option · start not recorded' : 'review this plan decision'}</p></Panel>; })}
 <Panel className="plan-follow-up"><h2>{props.kind==='unpublished'?'draft follow-up':'your next check-in'}</h2><p className="plan-review-date">{props.kind==='unpublished'?'dates unavailable in preview':props.view.nextReviewOn||'not scheduled'}</p>{c.followUp.criteria.map((t, i) => <p key={i}>{t}</p>)}{c.followUp.authoredNotes.map((t, i) => <p key={i}>{t}</p>)}{props.kind==='published' && props.onSendUpdate && props.mode==='client' && props.view.access==='active' ? <Button variant="secondary" onClick={props.onSendUpdate}>send an update</Button> : null}</Panel>
 {props.kind==='published'&&props.mode==='client'&&props.view.access==='active'&&props.view.schemaVersion===2&&props.ports?.care?<Button variant="secondary" onClick={()=>navigator.navigate({name:'report-use',routine:period})}>report another product</Button>:null}
 {props.kind==='published'&&props.view.schemaVersion===2&&props.view.latestPublicReview?<Panel><h2>latest published review</h2><p>{props.view.latestPublicReview.conclusion}</p><p>{props.view.latestPublicReview.rationale}</p><p>{props.view.latestPublicReview.nextStep}</p></Panel>:null}
 {props.kind==='published' && props.onHistory ? <Button variant="ghost" onClick={props.onHistory}>view plan history</Button> : null}
 </aside></div>;
}
function RoutineRow({ step, period, index, props, openerFor }: {
    step: RoutineStep;
    period: RoutinePeriod;
    index: number;
    props: RenderProps;
    openerFor:(id:string)=>RefObject<HTMLButtonElement|null>;
}) {
    const { navigator } = usePlanNavigation(props.navigation), product = planContent(props.view)!.products.find(p => p.id === step.productId), short = step.usage?.short[period];
    return <article className={step.schedule.asNeeded ? 'plan-routine-row plan-optional-row' : 'plan-routine-row'} data-product-id={step.productId ?? undefined} data-optional={step.schedule.asNeeded || undefined}>
      <span className="plan-row-number">{step.schedule.asNeeded ? 'optional' : String(index+1).padStart(2,'0')}</span>
      {product ? <ProductPhoto product={product}/> : <div className="plan-instruction-mark" aria-hidden="true">step</div>}
      <div className="plan-row-copy"><h3>{step.title || product?.name || 'routine step'}</h3>{short ? <p className="plan-muted">{short}</p> : null}{step.directions.filter(t=>t!==short).map((t,i)=><p className="plan-muted" key={i}>{t}</p>)}{step.cautions.map((t,i)=><p className="plan-inline-caution" key={i}>{t}</p>)}<ScheduleContent schedule={step.schedule}/></div>
      {product ? <Button ref={openerFor(product.id)} id={`plan-product-${product.id}`} variant="ghost" aria-label={`details for ${product.name || 'unnamed product'}`} onClick={()=>navigator.navigate({name:'product',productId:product.id,routine:period})}>details</Button> : null}
    </article>;
}
function Recommendation({ props, decision: d, period }: {
    props: RenderProps;
    decision: PlanDecision;
    period: RoutinePeriod;
}) {
    const c = planContent(props.view)!, product = c.products.find(p => p.id === d.primaryProductId), { navigator } = usePlanNavigation(props.navigation);
    return <div className="plan-columns"><Panel className="plan-recommendation">
      <PlanBack navigation={props.navigation}>back to plan</PlanBack><Badge tone="pending">{decisionNames[d.kind]}</Badge>
      <h2>{d.guidance.title || 'plan decision'}</h2>{d.guidance.subtitle ? <p>{d.guidance.subtitle}</p> : null}
      {d.currentProductIds.filter(id=>id!==d.primaryProductId).map(id=>{const current=c.products.find(p=>p.id===id);return current ? <ProductIdentity key={id} product={current} compact/> : null;})}
      {product ? <ProductIdentity product={product}/> : null}<hr/><h2>{d.guidance.rationaleTitle || 'why this fits your plan'}</h2><DecisionReasons decision={d}/>
      {d.limitations.map((t,i)=><p className="plan-muted" key={i}>{t}</p>)}
      {props.kind==='published'&&props.view.schemaVersion===2&&product?<ProductAdviceStatus selected={productContext(props.view,product.id)!} props={props}/>:null}
      {d.directions.length || d.schedule ? <section className="plan-use-summary plan-stack"><h3>plan directions</h3>{product&&suppressContinue(props.view,product.id)?<details><summary>published guidance for reference</summary><DecisionDirections decision={d}/></details>:<DecisionDirections decision={d}/>}</section> : null}
      {d.guidance.how && (d.guidance.how.productId===null || product && d.guidance.how.productId!==product.id) ? <GuideContent guide={d.guidance.how}/> : null}
      {product ? <Button variant="secondary" onClick={()=>navigator.navigate({name:'product-evidence',productId:product.id,routine:period})}>directions, ingredients & sources</Button> : <>
        <DecisionComparisons decision={d} products={c.products}/><Facts facts={d.guidance.facts}/>{d.guidance.actions.map((t,i)=><p key={i}>{t}</p>)}
        {d.guidance.how?.productId ? <GuideContent guide={d.guidance.how}/> : null}<Sources sources={d.guidance.sources}/>
      </>}
    </Panel><aside className="plan-stack"><Panel className="plan-choice-panel">{props.kind==='published'?<DecisionControls key={`${props.session.key}:${props.mode}:${d.id}`} {...props} decision={d}/>:<StatusNotice title="preview only">choices are unavailable in preview.</StatusNotice>}</Panel>
      {d.cautions.length ? <section className="plan-caution plan-stack"><h2>before you use it</h2>{d.cautions.map((t,i)=><p key={i}>{t}</p>)}</section> : null}
    </aside></div>;
}
type Context = NonNullable<ReturnType<typeof productContext>>;
function ProductDetails({ props, selected: s, period }: {
    props: RenderProps;
    selected: Context;
    period: RoutinePeriod;
}) {
    const { navigator } = usePlanNavigation(props.navigation);
    return <div className="plan-stack plan-product-sheet">
      <Badge tone={s.restrictions.length ? 'neutral' : s.current ? 'active' : 'pending'}>{s.restrictions.length ? s.restrictions.some(d=>d.kind==='pause') ? 'paused in plan' : 'left out of plan' : s.current ? props.kind==='unpublished'?'in the draft routine':'in your current routine' : s.proposed ? 'proposed option' : 'product context'}</Badge>
      <ProductIdentity product={s.product} sheet/><ProductAdviceStatus selected={s} props={props.kind==='published'?props:undefined}/><ProductDirections selected={s}/>
      {s.decisions.length ? <><hr/><h2>{s.restrictions.length ? 'context for this decision' : 'why this guidance'}</h2>{s.restrictions.length ? <p className="plan-meta">the pause or exclusion above takes precedence over routine and comparison context.</p> : null}{s.decisions.map(d=><DecisionReasons key={d.id} decision={d}/>)}</> : null}
      <Button variant="secondary" onClick={()=>navigator.navigate({name:'product-evidence',productId:s.product.id,routine:period})}>ingredients & evidence</Button>
      {props.kind==='published' && (props.view.schemaVersion===2?props.ports?.care:props.onRecordUse) && props.mode==='client' && props.view.access==='active' ? <><hr/><h3>using it differently?</h3><Button variant="secondary" onClick={()=>props.view.schemaVersion===2&&props.ports?.care?navigator.navigate({name:'product-use',productId:s.product.id,routine:period}):props.onRecordUse?.(s.product.id)}>record a change in use</Button><p className="plan-meta">your report is kept separate from the published advice.</p></> : null}
    </div>;
}
function Evidence({props,selected:s}: {props:RenderProps;selected:Context}) {
    const c=planContent(props.view)!,{navigator}=usePlanNavigation(props.navigation),destination=navigator.backDestination?.();
    const backLabel=destination?.name==='recommendation'?'back to recommendation':destination?.name==='product'?'back to product':'back';
    return <div className="plan-columns" data-plan-evidence>
      <Panel className="plan-evidence-main"><PlanBack navigation={props.navigation}>{backLabel}</PlanBack>
        <ProductAdviceStatus selected={s} props={props.kind==='published'?props:undefined}/><ProductDirections selected={s}/>
        {s.restrictions.length ? <p className="plan-meta">the pause or exclusion above takes precedence over routine and comparison context.</p> : null}
        {s.product.reference ? <p>{s.product.reference}</p> : null}
        {s.decisions.map(d=><section className="plan-stack" key={d.id}><h2>{d.guidance.rationaleTitle || 'reasoning'}</h2><DecisionReasons decision={d}/>
          <DecisionComparisons decision={d} products={c.products}/><Facts facts={d.guidance.facts}/>{d.guidance.actions.map((t,i)=><p key={i}>{t}</p>)}
          {d.guidance.how?.productId===null ? <GuideContent guide={d.guidance.how}/> : null}
        </section>)}<Facts facts={s.product.evidence}/>
      </Panel><aside className="plan-stack"><Panel className="plan-evidence-context"><h2>{s.evidenceVariant==='product' ? 'your experience & plan context' : 'evidence & limits'}</h2>
        {s.decisions.flatMap(d=>[...d.limitations,...d.cautions]).map((t,i)=><p key={i}>{t}</p>)}
        <p className="plan-muted">{props.kind==='published'&&props.view.schemaVersion===2?'published identity record: ':null}{s.product.identity==='client_confirmed' ? 'product identity reported by you.' : 'product identity has not been confirmed.'} {s.product.formula==='verified' ? 'formula recorded as verified.' : 'the image does not verify the formula.'}</p>
        <Sources sources={[...(s.product.productUrl ? [{label:s.product.sourceLabel || 'manufacturer’s product information',url:s.product.productUrl}] : []),...s.guides.flatMap(g=>g.sources),...s.decisions.flatMap(d=>[...d.guidance.sources,...(d.guidance.how?.productId===null ? d.guidance.how.sources : [])])]}/>
      </Panel></aside>
    </div>;
}

function ReportedProductDetails({props,reported,onRecord}:{props:ClientPlanProps;reported:ReportedProductUse;onRecord:()=>void}) {
    const d=reported.descriptor;
    return <div className="plan-stack plan-product-sheet"><Badge>unreviewed product</Badge><h2>{d.name}</h2><p className="plan-meta">{[d.brand,d.variant,d.strength,d.sizeLabel].map(k=>k.state==='known'?k.value:null).filter(Boolean).join(' · ')}</p><StatusNotice title="not reviewed in your plan">your report does not add this product to the advised routine.</StatusNotice><UseFacts use={reported} props={props}/>{props.mode==='client'&&props.view.access==='active'&&props.ports?.care&&props.onViewChange?<Button variant="secondary" onClick={onRecord}>record a change in use</Button>:null}</div>;
}
