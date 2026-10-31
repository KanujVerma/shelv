import type { ClientCareHistoryPage, ClientCareHistoryEntry, GoalReportBody } from '../../../../../src/contracts/PortalReview.ts';
import type { ReportIntent, ReportCommand } from './types.ts';
import type {HistoryFilter} from './restoration.ts';
import { readReviewCommand } from '../../../../../src/contracts/PortalReviewValidation.ts';
export function buildReportCommand(intent: ReportIntent, revision: number, requestId: string, goals: readonly string[], useIds: readonly string[]): ReportCommand {
    const replacement = intent.kind === 'new' ? { kind: 'goal_report' as const, body: intent.body } : intent.replacement;
    const photos = intent.kind === 'new' ? [] : intent.retainedPhotoIds;
    if (JSON.stringify(replacement.body.photoIds) !== JSON.stringify(photos))
        throw new Error('photo integration unavailable');
    if (replacement.kind === 'goal_report') {
        if (replacement.body.answers.some(a => !goals.includes(a.goalId)) || replacement.body.actualUseEventIds.some(id => !useIds.includes(id)))
            throw new Error('source reference unavailable');
        if (intent.kind === 'amendment' && (intent.original.kind !== 'goal_report' || JSON.stringify(replacement.body.publication) !== JSON.stringify(intent.original.body.publication)))
            throw new Error('original publication required');
    }
    const command = intent.kind === 'new' ? { schemaVersion: 1, action: 'submit_goal_report_v1', requestId, expectedReportRevision: revision, body: intent.body, occurredOn: intent.occurredOn } : { schemaVersion: 1, action: 'amend_report_v1', requestId, expectedReportRevision: revision, event: { kind: intent.original.kind, id: intent.original.id }, expectedAmendmentHeadId: intent.expectedAmendmentHeadId, replacement: intent.replacement, occurredOn: intent.occurredOn, reason: intent.reason };
    return readReviewCommand(command) as ReportCommand;
}
export function appendHistory(pages: readonly ClientCareHistoryPage[], page: ClientCareHistoryPage): readonly ClientCareHistoryPage[] {
    const first = pages[0], last = pages.at(-1);
    if (first && (last?.nextCursor === null || first.version !== page.version || JSON.stringify(first.heads) !== JSON.stringify(page.heads)))
        throw new Error('history changed');
    const keys = new Set(pages.flatMap(p => p.entries.map(historyKey)));
    for (const entry of page.entries) {
        const key = historyKey(entry);
        if (keys.has(key))
            throw new Error('duplicate history event');
        keys.add(key);
    }
    if (page.nextCursor !== null && pages.some(p => p.nextCursor === page.nextCursor))
        throw new Error('cursor loop');
    return [...pages, page];
}
export function historyKey(entry: ClientCareHistoryEntry): string {
    switch (entry.kind) {
        case 'publication': return `publication:${entry.publication.version}`;
        case 'report': return `report:${entry.event.id}`;
        case 'report_amendment': return `report_amendment:${entry.amendment.id}`;
        case 'review_attention': return `attention:${entry.eventId}`;
        case 'guidance': return `public_${entry.guidance.record.kind}:${entry.guidance.record.id}`;
        case 'legacy_review': return `public_review:${entry.review.id}`;
        case 'legacy_instruction': return `public_instruction:${entry.revision.id}`;
        case 'legacy_reply': return `public_reply:${entry.id}`;
        case 'amendment': return `use_amendment:${entry.amendment.id}`;
        default: return `${entry.kind}:${entry.event.eventId}`;
    }
}
export function emptyBody(publication: GoalReportBody['publication']): GoalReportBody { return { publication, answers: [], comfort: null, actualUseEventIds: [], notes: null, photoIds: [] }; }

export function visibleHistory(entry: ClientCareHistoryEntry, filter: HistoryFilter) { return filter === 'all' || filter === 'checkins' && ['report', 'report_amendment', 'review_attention', 'legacy_review', 'legacy_reply'].includes(entry.kind) || filter === 'checkins' && entry.kind === 'guidance' && entry.guidance.body.kind !== 'instruction' || filter === 'changes' && (entry.kind === 'publication' || entry.kind === 'legacy_instruction' || entry.kind === 'guidance' && entry.guidance.body.kind === 'instruction'); }
