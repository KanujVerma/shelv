import type { ReactNode } from 'react';
import type { Known } from '../../../../../src/contracts/PortalRebuild.ts';
import type { ProductRef, UseChange, AttributedUseEvent } from '../../../../../src/contracts/PortalCare.ts';
import type { GoalReportBody, ReportEvent, ReportReplacement, ClientCareHistoryEntry, PublishedGuidance } from '../../../../../src/contracts/PortalReview.ts';
import type { HistoryProps } from './types.ts';
import { Badge, Button, Icon } from '../../ui/index.ts';
import { historyKey } from './model.ts';
type Labels = Pick<HistoryProps, 'actorLabel' | 'productLabel' | 'goalLabel'>;
export function known(value: Known<string>): string { return value.state === 'known' ? value.value : 'not recorded'; }
function actor(id: string, labels: Labels) { return labels.actorLabel?.(id) ?? `account ${id}`; }
function product(ref: ProductRef, labels: Labels) { return labels.productLabel?.(ref) ?? (ref.kind === 'plan_product' ? `product ${ref.productId} · plan version ${ref.publication.version}` : `reported product ${ref.reportedProductId} · descriptor version ${ref.version}`); }
function Text({ label, children }: {
    label: string;
    children: ReactNode;
}) { return <p><span className="history-field-label">{label}: </span>{children}</p>; }
function Photos({ ids }: {
    ids: readonly string[];
}) { return ids.length ? <p className="history-meta">{ids.length} retained photo{ids.length === 1 ? '' : 's'} · photo viewing is unavailable here</p> : null; }
function Occurrence({ event, labels }: {
    event: {
        occurredOn: Known<string>;
        channel: string;
        reportedBy: string;
        recordedBy: string;
        recordedAt: string;
    };
    labels: Labels;
}) { return <div className="history-meta"><p>occurred: {known(event.occurredOn)} · recorded: <time dateTime={event.recordedAt}>{event.recordedAt}</time> · {event.channel.replaceAll('_', ' ')}</p><p>reported by {actor(event.reportedBy, labels)} · recorded by {actor(event.recordedBy, labels)}</p></div>; }
export function ReportBody({ replacement, labels }: {
    replacement: ReportReplacement;
    labels: Labels;
}) {
    if (replacement.kind === 'legacy_report')
        return <><Text label="comfort">{replacement.body.comfort}</Text><Text label="consistency">{replacement.body.consistency}</Text><Text label="changes">{replacement.body.changes || 'not recorded'}</Text><Photos ids={replacement.body.photoIds}/></>;
    const b = replacement.body;
    return <><p className="history-meta">plan version {b.publication.version}</p>{b.answers.map(a => <Text key={a.goalId} label={labels.goalLabel?.(a.goalId, b.publication) ?? a.goalId}>{a.change === 'same' ? 'the same' : a.change.replaceAll('_', ' ')}</Text>)}
    <Text label="comfort">{b.comfort ?? 'not recorded'}</Text><Text label="notes">{b.notes ?? 'not recorded'}</Text>
    {b.actualUseEventIds.length ? <Text label="linked actual-use reports">{b.actualUseEventIds.join(', ')}</Text> : null}<Photos ids={b.photoIds}/></>;
}
function originalBody(event: ReportEvent): ReportReplacement { return event.kind === 'goal_report' ? { kind: event.kind, body: event.body } : { kind: event.kind, body: event.body }; }
export function ChangeBody({ change }: {
    change: UseChange;
}) { return <><Text label="reported use">{change.kind.replaceAll('_', ' ')}</Text>{change.kind === 'different' ? <><Text label="frequency">{known(change.frequency)}</Text><Text label="amount">{known(change.amount)}</Text></> : null}{'details' in change && change.details !== null ? <Text label="details">{change.details}</Text> : null}</>; }
function UseBody({ event, labels }: {
    event: AttributedUseEvent;
    labels: Labels;
}) { const a = event.amendment; return <><h3>{product(event.product, labels)}</h3><Occurrence event={event} labels={labels}/><ChangeBody change={event.change}/><Text label="acquisition">{event.acquisition.replaceAll('_', ' ')}</Text><Text label="source publication">{event.sourcePublication ? `plan version ${event.sourcePublication.version}` : 'not recorded'}</Text>{event.identityEventId ? <Text label="identity report">{event.identityEventId}</Text> : null}{a ? <section className="history-original"><h4>latest separate correction</h4><p className="history-meta">corrected by {actor(a.amendedBy, labels)} · {a.amendedAt}</p><Text label="corrected product">{product(a.replacement.product, labels)}</Text><Text label="corrected occurrence">{known(a.replacement.occurredOn)}</Text><ChangeBody change={a.replacement.change}/><Text label="reason">{a.reason}</Text><Text label="acquisition">{a.replacement.acquisition.replaceAll('_', ' ')}</Text></section> : null}</>; }
function Guidance({ value, labels }: {
    value: PublishedGuidance;
    labels: Labels;
}) {
    const b = value.body;
    return <><div className="history-meta"><p>published by {actor(value.publishedBy, labels)} · <time dateTime={value.publishedAt}>{value.publishedAt}</time></p><p>plan version {b.publication.version}</p></div>
  {b.kind === 'review' ? <><h3>{b.conclusion}</h3><Text label="you reported">{b.clientReport}</Text><Text label="reason">{b.rationale}</Text><Text label="changes">{b.changes.length ? b.changes.join('\n') : 'no plan changes'}</Text><Text label="next step">{b.nextStep}</Text><Text label="next review">{b.nextReviewOn ?? 'not recorded'}</Text><p className="history-meta">occurred: {known(b.occurredOn)} · {b.channel.replaceAll('_', ' ')}</p></> : b.kind === 'reply' ? <><h3>advisor reply</h3><p>{b.reply}</p>{b.nextStep ? <Text label="next step">{b.nextStep}</Text> : null}<Text label="in response to report">{b.reportRef.id}</Text></> : <><h3>updated instructions</h3><Text label="slot">{b.slotId}</Text><Text label="product">{b.productId ?? 'nonproduct instruction'}</Text><Text label="directions">{b.directions.join('\n')}</Text>{b.cautions.length ? <Text label="cautions">{b.cautions.join('\n')}</Text> : null}<Text label="reason">{b.reason}</Text><Text label="effective">{b.effectiveOn}</Text><Schedule value={b.schedule}/><Text label="original reported start">{value.originalStart ? known(value.originalStart) : 'not applicable'}</Text></>}
  </>;
}
function Schedule({ value }: {
    value: Extract<PublishedGuidance['body'], {
        kind: 'instruction';
    }>['schedule'];
}) { return <><Text label="routine">{value.periods.join(', ') || 'not recorded'}</Text><Text label="days">{value.days.kind === 'daily' ? 'daily' : value.days.weekdays.join(', ')}</Text>{value.condition ? <Text label="when">{value.condition}</Text> : null}{value.asNeeded ? <p>as needed</p> : null}{value.stages.map(s => <div key={s.id}><p>{s.directions}</p><Text label="proceed only when">{s.proceedOnlyWhen}</Text><Text label="minimum days from actual start">{s.minimumDaysFromActualStart ?? 'not recorded'}</Text></div>)}</>; }
export function HistoryEvent({ entry, labels, onAmend, onVersion }: {
    entry: ClientCareHistoryEntry;
    labels: Labels;
    onAmend?: (event: ReportEvent) => void;
    onVersion?: (version: number) => void;
}) {
    let body: ReactNode;
    switch (entry.kind) {
        case 'publication':
            body = <><div className="history-meta"><Icon name="history" size="small"/> published by {actor(entry.recordedBy, labels)} · <time dateTime={entry.publishedAt}>{entry.publishedAt}</time></div><h3>plan version {entry.publication.version}</h3>{onVersion ? <Button variant="secondary" onClick={() => onVersion(entry.publication.version)}>open plan version {entry.publication.version}</Button> : null}</>;
            break;
        case 'report':
            body = <><h3>your update</h3><Occurrence event={entry.event} labels={labels}/><ReportBody replacement={originalBody(entry.event)} labels={labels}/>{onAmend ? <Button variant="secondary" onClick={() => onAmend(entry.event)}>add a correction</Button> : null}</>;
            break;
        case 'report_amendment':
            body = <><h3>report correction</h3><div className="history-original"><h4>original report</h4><Occurrence event={entry.original} labels={labels}/><ReportBody replacement={originalBody(entry.original)} labels={labels}/></div><h4>separate correction</h4><p className="history-meta">corrected by {actor(entry.amendment.amendedBy, labels)} · <time dateTime={entry.amendment.recordedAt}>{entry.amendment.recordedAt}</time></p><Text label="corrected occurrence">{known(entry.amendment.occurredOn)}</Text><Text label="reason">{entry.amendment.reason}</Text><ReportBody replacement={entry.amendment.replacement} labels={labels}/>{entry.amendment.attention ? <Text label="prior review">{entry.amendment.attention.priorReview.id} · {entry.amendment.attention.state}</Text> : null}{onAmend ? <Button variant="secondary" onClick={() => onAmend(entry.original)}>add another correction</Button> : null}</>;
            break;
        case 'review_attention':
            body = <><h3>{entry.attention.state === 'resolved' ? 'correction reviewed' : 'earlier review needs attention'}</h3><Text label="prior published review">{entry.attention.priorReview.id}</Text><Text label="correction">{entry.amendmentId}</Text><Text label="report">{entry.event.id}</Text><p className="history-meta">recorded: {entry.recordedAt} · plan version {entry.publication.version}</p>{entry.attention.resolvedBy ? <Text label="resolved by published review">{entry.attention.resolvedBy.id}</Text> : <p>the earlier conclusion remains in your record.</p>}</>;
            break;
        case 'guidance':
            body = <Guidance value={entry.guidance} labels={labels}/>;
            break;
        case 'legacy_review': {
            const r = entry.review;
            body = <><h3>{r.decision}</h3><p className="history-meta">recorded by {r.authorLabel || actor(r.authorId, labels)} · {r.recordedAt}</p><p className="history-meta">occurred: {r.occurredOn} · {r.channel.replaceAll('_', ' ')} · publication not recorded</p><Text label="summary">{r.summary}</Text><Text label="reported use">{r.reportedUse}</Text><Text label="next review">{r.nextReviewOn ?? 'not recorded'}</Text></>;
            break;
        }
        case 'legacy_reply':
            body = <><h3>advisor reply</h3><p className="history-meta">recorded by {actor(entry.recordedBy, labels)} · {entry.recordedAt} · publication not recorded</p><p>{entry.reply}</p><Text label="in response to report">{entry.report.id}</Text></>;
            break;
        case 'legacy_instruction': {
            const r = entry.revision;
            body = <><h3>instruction version {r.version}</h3><p className="history-meta">recorded by {actor(r.authorId, labels)} · {r.createdAt}</p><Text label="plan version">{r.planVersion}</Text><Text label="original source publication">{r.source.publicationVersion} · {r.source.kind}</Text><Text label="product">{r.productId}</Text><Text label="slot">{r.slot}</Text><Text label="directions">{r.usage.instructions.join('\n')}</Text><Text label="morning">{r.usage.short.morning ?? 'not recorded'}</Text><Text label="evening">{r.usage.short.evening ?? 'not recorded'}</Text><Text label="routine periods">{r.usage.periods.join(', ')}</Text><Text label="order">{r.usage.order}</Text><Text label="reason">{r.reason}</Text><Text label="effective">{r.effectiveOn}</Text><Text label="original reported start">{r.originalStartedOn ?? 'not recorded'}</Text>{r.reviewId ? <Text label="linked review">{r.reviewId}</Text> : null}</>;
            break;
        }
        case 'use':
            body = <UseBody event={entry.event} labels={labels}/>;
            break;
        case 'amendment': {
            const a = entry.amendment;
            body = <><h3>actual-use correction</h3><p className="history-meta">corrected by {actor(a.amendedBy, labels)} · {a.amendedAt}</p><Text label="original report">{a.eventId}</Text><Text label="corrected product">{product(a.replacement.product, labels)}</Text><Text label="corrected occurrence">{known(a.replacement.occurredOn)}</Text><ChangeBody change={a.replacement.change}/><Text label="acquisition">{a.replacement.acquisition.replaceAll('_', ' ')}</Text><Text label="reason">{a.reason}</Text><Text label="source publication">{a.replacement.sourcePublication?.version ?? 'not recorded'}</Text></>;
            break;
        }
        case 'identity': {
            const e = entry.event;
            body = <><h3>product identity report</h3><Occurrence event={e} labels={labels}/><Text label="product">{product(e.target.subject, labels)}</Text>{e.target.comparedWith ? <Text label="compared with">{product(e.target.comparedWith, labels)}</Text> : null}<Text label="match">{e.answer.match.replaceAll('_', ' ')}</Text><Text label="reported name">{e.answer.reportedName ?? 'not recorded'}</Text><Text label="variant">{known(e.answer.variant)}</Text><Text label="strength">{known(e.answer.strength)}</Text><Photos ids={e.answer.labelPhotoIds}/></>;
            break;
        }
        case 'reported_product': {
            const e = entry.event;
            body = <><h3>{e.descriptor.name}</h3><Occurrence event={e} labels={labels}/><Text label="descriptor version">{e.product.version}</Text><Text label="brand">{known(e.descriptor.brand)}</Text><Text label="variant">{known(e.descriptor.variant)}</Text><Text label="strength">{known(e.descriptor.strength)}</Text><Text label="size">{known(e.descriptor.sizeLabel)}</Text>{e.reason ? <Text label="correction reason">{e.reason}</Text> : null}<Photos ids={e.descriptor.labelPhotoIds}/>{e.initialUse ? <UseBody event={e.initialUse} labels={labels}/> : null}</>;
            break;
        }
    }
    return <article className="history-event" data-event={historyKey(entry)}>{body}</article>;
}
export type HistoryFilter = 'all' | 'checkins' | 'changes';
export function visibleHistory(entry: ClientCareHistoryEntry, filter: HistoryFilter) { return filter === 'all' || filter === 'checkins' && ['report', 'report_amendment', 'review_attention', 'legacy_review', 'legacy_reply'].includes(entry.kind) || filter === 'checkins' && entry.kind === 'guidance' && entry.guidance.body.kind !== 'instruction' || filter === 'changes' && (entry.kind === 'publication' || entry.kind === 'legacy_instruction' || entry.kind === 'guidance' && entry.guidance.body.kind === 'instruction'); }
export function Timeline({ entries, filter, labels, onAmend, onVersion }: {
    entries: readonly ClientCareHistoryEntry[];
    filter: HistoryFilter;
    labels: Labels;
    onAmend?: (event: ReportEvent) => void;
    onVersion?: (version: number) => void;
}) { return <div className="history-timeline">{entries.filter(e => visibleHistory(e, filter)).map(e => <HistoryEvent key={historyKey(e)} entry={e} labels={labels} onAmend={onAmend} onVersion={onVersion}/>)}</div>; }
