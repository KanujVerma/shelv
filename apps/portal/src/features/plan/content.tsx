import { useState } from 'react';
import type { Guide, Source, Comparison, Fact } from '../../../../../src/contracts/ConciergePresentation.ts';
import type { PlanDecision, PlanProduct, Schedule } from '../../../../../src/contracts/PortalRebuild.ts';
import { Button, Icon } from '../../ui/index.ts';
import type {ClientPlanProps} from './types.ts';
import {UseFacts} from './UseFacts.tsx';
import { safePublicUrl, productContext } from './model.ts';
export function ProductPhoto({ product, size = 'routine' }: {
    product: PlanProduct;
    size?: 'routine' | 'summary' | 'identity';
}) {
    const [failed, setFailed] = useState<string | null>(null), url = safePublicUrl(product.imageUrl, true);
    return <div className={`plan-photo plan-photo-${size}`} data-product-photo={product.id}>{url && failed !== url ? <img src={url} alt="" onError={() => setFailed(url)}/> : <div className="plan-photo-fallback" role="img" aria-label="product image unavailable"><Icon name="orders" size="large"/></div>}</div>;
}
export function Sources({ sources }: {
    sources: Source[];
}) {
    const unique = [...new Map(sources.map(s => [s.url, s])).values()];
    return <div className="plan-sources">{unique.map((s, i) => { const url = safePublicUrl(s.url); return url ? <Button asChild variant="secondary" key={i}><a href={url} target="_blank" rel="noopener noreferrer">{s.label}</a></Button> : <p className="plan-muted" key={i}>{s.label} · link unavailable</p>; })}</div>;
}
export function GuideContent({ guide }: {
    guide: Guide;
}) {
    return <section className="plan-stack"><h2>{guide.title || 'directions'}</h2>{guide.intro ? <p>{guide.intro}</p> : null}<ol className="plan-guide">{guide.steps.map((s, i) => <li key={i}><span className="plan-step-number">{String(i + 1).padStart(2, '0')}</span><div>{s.title ? <h3>{s.title}</h3> : null}<p>{s.body}</p></div></li>)}</ol>{guide.careNote ? <div className="plan-caution">{guide.careNote}</div> : null}<Sources sources={guide.sources}/></section>;
}
export function Facts({ facts }: {
    facts: Fact[];
}) { return <>{facts.map((f, i) => <section className="plan-stack" key={i}><h3>{f.title}</h3><p>{f.body}</p><Sources sources={f.sources}/></section>)}</>; }
export function Comparisons({ items, currentName, proposedName }: {
    items: Comparison[];
    currentName: string;
    proposedName: string;
}) {
    return <>{items.map((c, i) => <section className="plan-comparison plan-stack" key={i}><h3>{c.label}</h3><dl><div><dt>{currentName}</dt><dd>{c.currentText}</dd></div><div><dt>{proposedName}</dt><dd>{c.proposedText}</dd></div></dl><p>{c.significance}</p>{c.guideNote ? <p className="plan-muted">{c.guideNote}</p> : null}<Sources sources={c.sources}/></section>)}</>;
}
export function ScheduleContent({ schedule }: {
    schedule: Schedule | null;
}) {
    if (!schedule)
        return null;
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    return <>{schedule.periods.length ? <p className="plan-meta">{schedule.periods.join(' / ')}</p> : null}{schedule.condition ? <p className="plan-condition">{schedule.condition}</p> : null}{schedule.asNeeded ? <p className="plan-condition">optional / as needed</p> : null}{schedule.days.kind === 'selected' ? <p>{schedule.days.weekdays.map(d => days[d - 1]).join(', ')}</p> : null}{schedule.stages.length ? <section className="plan-stack"><h3>gradual introduction</h3>{schedule.stages.map(s => <div key={s.id}><p>{s.directions}</p>{s.minimumDaysFromActualStart !== null ? <p className="plan-muted">earliest {s.minimumDaysFromActualStart} days after your actual start</p> : null}<p>{s.proceedOnlyWhen}</p></div>)}<p className="plan-muted">advance only when the stated conditions are met.</p></section> : null}</>;
}

export function DecisionReasons({decision:d}: {decision:PlanDecision}) {
    const bodies=d.guidance.reasons.map(r=>r.body);
    return <>{d.reason && d.reason!==bodies.join('\n') ? <p>{d.reason}</p> : null}{d.guidance.reasons.map((r,i)=><section className="plan-stack" key={i}>{r.title && r.title!==d.guidance.rationaleTitle ? <h3>{r.title}</h3> : null}<p>{r.body}</p></section>)}</>;
}
export function DecisionComparisons({decision:d,products}: {decision:PlanDecision;products:PlanProduct[]}) {
    const name=(id:string)=>products.find(p=>p.id===id)?.name || 'product name not recorded';
    return <Comparisons items={d.guidance.comparisons} currentName={d.currentProductIds.map(name).join(', ') || 'current approach'} proposedName={d.primaryProductId ? name(d.primaryProductId) : 'proposed approach'}/>;
}
export function DecisionDirections({decision:d}: {decision:PlanDecision}) {
    return <section className="plan-stack">{d.directions.map((t,i)=><p key={i}>{t}</p>)}{d.cautions.map((t,i)=><p className="plan-inline-caution" key={i}>{t}</p>)}<ScheduleContent schedule={d.schedule}/></section>;
}
export function ProductAdviceStatus({selected:s,props}: {props?:ClientPlanProps;selected:NonNullable<ReturnType<typeof productContext>>}) {
    return <section className="plan-stack" data-product-advice>{s.restrictions.map(d=><div key={d.id}><h2>{d.kind==='pause' ? 'paused in your plan' : 'left out of your plan'}</h2><p>{d.reason}</p>{d.cautions.map((t,i)=><p key={i}>{t}</p>)}</div>)}{s.use.kind==='published'&&s.use.effective?<UseFacts use={s.use.effective} props={props}/>:<p className="plan-meta">{s.use.kind==='unavailable' ? 'actual use is unavailable in preview.' : s.use.start ? `previously reported start: ${s.use.start.startedOn}. this record does not confirm current use.` : 'start not recorded. current use is not confirmed.'}</p>}</section>;
}
export function ProductDirections({selected:s}: {selected:NonNullable<ReturnType<typeof productContext>>}) {
    const hasDirections=s.steps.some(step=>step.directions.length>0) || s.guidance.some(d=>d.directions.length>0) || s.guides.length>0;
    const suppressed=s.use.kind==='published'&&s.use.effective&&(s.use.effective.contradiction||['paused','stopped','using_differently','unreviewed'].includes(s.use.effective.state)||s.use.effective.identity&&s.use.effective.identity.match!=='yes');
    const directions=<><h2>{s.restrictions.length ? 'current plan guidance' : s.proposed ? 'proposed directions' : 'how to use it'}</h2>
      {s.steps.map(step=><section className="plan-stack" key={step.id}>{step.directions.map((t,i)=><p key={i}>{t}</p>)}{step.cautions.map((t,i)=><p className="plan-inline-caution" key={i}>{t}</p>)}<ScheduleContent schedule={step.schedule}/></section>)}
      {s.guidance.map(d=><DecisionDirections key={d.id} decision={d}/>)}{s.guides.map(g=><GuideContent key={g.id} guide={g}/>)}
      {!hasDirections && !s.restrictions.length ? <p>directions are not recorded.</p> : null}</>;
    return <section className="plan-stack">{suppressed&&!s.restrictions.length?<details><summary>published guidance for reference</summary><div className="plan-stack">{directions}</div></details>:directions}</section>;
}
