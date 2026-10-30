import { useState } from 'react';
import type { Guide, Source, Comparison, Fact } from '../../../../../src/contracts/ConciergePresentation.ts';
import type { PlanProduct, Schedule } from '../../../../../src/contracts/PortalRebuild.ts';
import { Button, Icon } from '../../ui/index.ts';
import { safePublicUrl } from './model.ts';
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
    return <>{schedule.condition ? <p className="plan-condition">{schedule.condition}</p> : null}{schedule.asNeeded ? <p className="plan-condition">optional / as needed</p> : null}{schedule.days.kind === 'selected' ? <p>{schedule.days.weekdays.map(d => days[d - 1]).join(', ')}</p> : null}{schedule.stages.length ? <section className="plan-stack"><h3>gradual introduction</h3>{schedule.stages.map(s => <div key={s.id}><p>{s.directions}</p>{s.minimumDaysFromActualStart !== null ? <p className="plan-muted">earliest {s.minimumDaysFromActualStart} days after your actual start</p> : null}<p>{s.proceedOnlyWhen}</p></div>)}<p className="plan-muted">advance only when the stated conditions are met.</p></section> : null}</>;
}
