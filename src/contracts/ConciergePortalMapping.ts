import type { ConciergeAdvisorDirectory, ConciergeAdvisorView, ConciergeClientView, ConciergeItemState, ConciergePublication, ConciergeWriteAction, ConciergeWriteReceipt } from './ConciergePortal.ts';
import { readArray, readDate, readIdentifier, readInteger, readObject, readRecommendations, readText, readUuid, requireValue } from './ConciergePortalValidation.ts';

function publication(value: unknown, allowAdditions=false): ConciergePublication {
  const p = readObject(value);
  return { version: readInteger(p.version, 1), recommendations: readRecommendations(p.recommendations,{allowAdditions}) };
}
function itemState(value: unknown): ConciergeItemState {
  const s = readObject(value);
  requireValue(s.choice === null || s.choice === 'approved' || s.choice === 'declined');
  requireValue(typeof s.received === 'boolean');
  const reason = s.reason === null ? null : readText(s.reason, 1000);
  requireValue(s.choice === 'declined' ? reason !== null : reason === null);
  const startedOn = s.startedOn === null ? null : readDate(s.startedOn);
  requireValue(!s.received || s.choice === 'approved');
  requireValue(startedOn === null || s.received);
  return { recommendationId: readIdentifier(s.recommendationId), choice: s.choice, reason, received: s.received, startedOn };
}
function clientView(value: unknown, allowAdditions=false): ConciergeClientView {
  const v = readObject(value);
  const plan = v.plan === null ? null : (() => {
    const raw = readObject(v.plan), p = publication(raw,allowAdditions);
    const itemStates = readArray(raw.itemStates, 50).map(itemState);
    const ids = new Set(itemStates.map(s => s.recommendationId));
    requireValue(ids.size === itemStates.length && ids.size === p.recommendations.length && p.recommendations.every(r => ids.has(r.id)));
    return { ...p, itemStates };
  })();
  const history = readArray(v.history).map(p=>publication(p,allowAdditions));
  requireValue(history.every((p, i) => plan !== null && p.version < plan.version && (i === 0 || history[i - 1].version < p.version)));
  const proposal = readObject(v.orderProposal);
  requireValue(proposal.kind === 'proposal' && proposal.currency === 'USD' && proposal.payable === false && proposal.shippingAndTaxConfirmed === false);
  const items = readRecommendations(proposal.items,{allowAdditions});
  const subtotalCents = readInteger(proposal.subtotalCents);
  const expectedItems = plan?.recommendations.filter(r => plan.itemStates.some(s => s.recommendationId === r.id && s.choice === 'approved' && !s.received)) ?? [];
  requireValue(JSON.stringify(items) === JSON.stringify(expectedItems) && subtotalCents === items.reduce((total, r) => total + r.priceCents, 0));
  const routine = readArray(v.routine, 50).map(value => {
    const r = readObject(value);
    return { slot: readIdentifier(r.slot), productId: readIdentifier(r.productId) };
  });
  requireValue(new Set(routine.map(r => r.slot)).size === routine.length);
  const routineHistory = readArray(v.routineHistory).map(value => {
    const r = readObject(value);
    return { version: readInteger(r.version, 1), recommendationId: readIdentifier(r.recommendationId), slot: readIdentifier(r.slot),
      productId: readIdentifier(r.productId), startedOn: readDate(r.startedOn) };
  });
  // Preserve the authoritative active routine. Approval/receipt are never activation.
  return { revision: readInteger(v.revision), plan, history,
    orderProposal: { kind: 'proposal', currency: 'USD', items, subtotalCents, payable: false, shippingAndTaxConfirmed: false }, routine, routineHistory };
}

/** New objects only: unknown/private fields are never copied to client JSON. */
export function mapConciergeClientView(value: unknown, {allowAdditions=false} = {}): ConciergeClientView {
  try { return clientView(value,allowAdditions); } catch { throw new Error('invalid_concierge_response'); }
}
/** Call only after the advisor RPC has independently authorized the bearer actor. */
export function mapConciergeAdvisorView(value: unknown, {allowAdditions=false} = {}): ConciergeAdvisorView {
  try {
    const v = readObject(value), i = v.intake === null ? null : readObject(v.intake), d = v.draft === null ? null : readObject(v.draft);
    return { client: clientView(v.client,allowAdditions),
      meetingNotes: readArray(v.meetingNotes ?? []).map(raw => { const n = readObject(raw); requireValue(n.kind === 'notes' || n.kind === 'transcript'); requireValue(typeof n.createdAt === 'string' && Number.isFinite(Date.parse(n.createdAt))); return { id: readUuid(n.id), kind: n.kind as 'notes' | 'transcript', text: readText(n.text, 20000), createdAt: n.createdAt }; }),
      intake: i === null ? null : { version: readInteger(i.version, 1), goal: readText(i.goal, 300), note: readText(i.note, 4000, true) },
      draft: d === null ? null : { intakeVersion: readInteger(d.intakeVersion, 1), recommendations: readRecommendations(d.recommendations,{allowAdditions}), advisorNote: readText(d.advisorNote, 4000, true) } };
  } catch { throw new Error('invalid_concierge_response'); }
}
export function mapConciergeWriteReceipt(value: unknown, action: ConciergeWriteAction): ConciergeWriteReceipt {
  try {
    const v = readObject(value);
    requireValue(v.operation === action);
    return { revision: readInteger(v.revision), publishedVersion: readInteger(v.publishedVersion), operation: action };
  } catch { throw new Error('invalid_concierge_response'); }
}

/** Directory is authorized by SQL; no role is derived from display names or metadata. */
export function mapConciergeAdvisorDirectory(value: unknown): ConciergeAdvisorDirectory {
  try {
    const v = readObject(value), c = readObject(v.capabilities);
    for (const k of ['view','edit','publish','confirmPayments']) requireValue(typeof c[k] === 'boolean');
    return { capabilities: { view: c.view as boolean, edit: c.edit as boolean, publish: c.publish as boolean, confirmPayments: c.confirmPayments as boolean },
      clients: readArray(v.clients).map(raw => { const x = readObject(raw); requireValue(['active','cancelled','revoked'].includes(String(x.enrollmentStatus)) && typeof x.hasDraft === 'boolean');
        return { clientId: readUuid(x.clientId), displayName: readText(x.displayName, 200), enrollmentStatus: x.enrollmentStatus as 'active' | 'cancelled' | 'revoked', revision: readInteger(x.revision), publishedVersion: readInteger(x.publishedVersion), hasDraft: x.hasDraft as boolean }; }) };
  } catch { throw new Error('invalid_concierge_response'); }
}
