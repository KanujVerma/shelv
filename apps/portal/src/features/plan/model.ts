import type { ClientPlanView, PlanDecision, RoutineStep } from '../../../../../src/contracts/PortalRebuild.ts';
import type { RoutinePeriod } from '../../navigation/routes.ts';
export const decisionNames: Record<PlanDecision['kind'], string> = { keep: 'keep', pause: 'pause', leave_out: 'leave out', replace: 'replace', finish_then_replace: 'finish, then replace', addition: 'consider', optional_alternative: 'optional alternative', no_addition: 'no addition' };
export const isPurchaseDecision = (d: PlanDecision) => !!d.primaryProductId && ['addition', 'replace', 'finish_then_replace', 'optional_alternative'].includes(d.kind);
export const isRestriction = (d: PlanDecision) => d.kind === 'pause' || d.kind === 'leave_out';
/** Directions on an alternative decision describe its primary option, not every
 * product mentioned in the comparison. General guides retain their own scope. */
export const hasProductDirections = (d: PlanDecision, id: string) => d.primaryProductId === id || !d.primaryProductId && d.currentProductIds.includes(id);
/** Defensive rendering only. Canonical validation still belongs to W1. */
export function safePublicUrl(value: string | null, asset = false): string | null {
    if (!value || /[\u0000-\u0020\\]/.test(value))
        return null;
    if (asset && /^assets\/[a-zA-Z0-9][a-zA-Z0-9_-]*\.(?:png|jpg|jpeg|webp)$/.test(value))
        return '/' + value;
    if (asset && /^\/maya\/(?:assets|images)\/[a-zA-Z0-9._-]+$/.test(value))
        return value;
    try {
        const u = new URL(value);
        if (!/^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}$/.test(u.hostname) || /(?:^|\.)(?:localhost|local|internal|lan|home|test|invalid)$/.test(u.hostname)) return null;
        if (u.protocol !== 'https:' || u.username || u.password || /(?:private|signed|\/sign\/|\/authenticated\/)/i.test(u.pathname) || [...u.searchParams.keys()].some(k => /token|credential|signature|secret|key|expires/i.test(k)))
            return null;
        return u.href;
    }
    catch {
        return null;
    }
}
export function productContext(view: ClientPlanView, productId: string) {
    const c = view.plan?.content, product = c?.products.find(p => p.id === productId);
    if (!c || !product)
        return null;
    const decisions = c.decisions.filter(d => d.primaryProductId === productId || d.currentProductIds.includes(productId) || d.alternativeProductIds.includes(productId));
    const restrictions = decisions.filter(isRestriction);
    const guidance = (restrictions.length ? restrictions : decisions).filter(d => hasProductDirections(d, productId));
    const guides = (restrictions.length ? restrictions.flatMap(d => d.guidance.how ? [d.guidance.how] : []) : [...product.guides, ...c.routineGuides, ...decisions.flatMap(d => d.guidance.how ? [d.guidance.how] : [])]).filter(g => g.productId === productId);
    const steps = [...new Map([...routineFor(view, 'morning'), ...routineFor(view, 'evening')].filter(s => s.productId === productId).map(s => [s.id, s])).values()];
    const proposed = !steps.length && !restrictions.length && decisions.some(d => d.primaryProductId === productId && isPurchaseDecision(d));
    return { product, decisions, restrictions, guidance, proposed, guides: [...new Map(guides.map(g => [g.id, g])).values()], steps, start: view.actualUse.find(a => a.productId === productId) ?? null, current: steps.length > 0,
        evidenceVariant: proposed ? 'introduction' as const : 'product' as const };
}
/** Publication contains advice. Only explicit reported Start changes its basis. */
export function routineFor(view: ClientPlanView, period: RoutinePeriod): RoutineStep[] {
    const c = view.plan?.content;
    if (!c)
        return [];
    const paused = new Set(c.decisions.filter(d => d.kind === 'pause' || d.kind === 'leave_out').flatMap(d => [...d.currentProductIds, ...(d.primaryProductId ? [d.primaryProductId] : [])]));
    const proposed = new Set(c.decisions.filter(d => !['keep', 'pause', 'leave_out', 'no_addition'].includes(d.kind)).flatMap(d => d.primaryProductId ? [d.primaryProductId] : []));
    const actual = new Map(view.actualUse.map(a => [a.slot, a.productId]));
    const steps = c.routine.filter(s => !s.productId || !paused.has(s.productId) && (!actual.has(s.slotId) || actual.get(s.slotId) === s.productId) && (!proposed.has(s.productId) || actual.get(s.slotId) === s.productId));
    for (const d of c.decisions) {
        if(d.kind==='pause'||d.kind==='leave_out')continue;
        const productId = actual.get(d.slotId);
        if (!productId || productId !== d.primaryProductId || steps.some(s => s.productId === productId))
            continue;
        const schedule = d.schedule;
        if (!schedule)
            continue;
        steps.push({ id: `started:${d.id}`, slotId: d.slotId, kind: 'product', productId, title: c.products.find(p => p.id === productId)?.name || 'product name not recorded', directions: d.directions, cautions: d.cautions, schedule, usage: d.usage ?? undefined });
    }
    return steps.filter(s => s.schedule.periods.includes(period)).sort((a, b) => (a.usage?.order ?? c.routine.indexOf(a)) - (b.usage?.order ?? c.routine.indexOf(b)));
}
