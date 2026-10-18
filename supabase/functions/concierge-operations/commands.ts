import type { ConciergeRpcCall } from '../../../src/contracts/ConciergePortal.ts';
import { exactKeys, readArray, readDate, readIdentifier, readInteger, readObject, readRecommendations, readText, readUuid, recommendationKeys, requireValue } from '../../../src/contracts/ConciergePortalValidation.ts';

/** Parse untrusted HTTP input. Advisor authority is deliberately not a request field. */
export function buildConciergeRpc(value: unknown, verifiedOwnerId: string): ConciergeRpcCall {
  const b = readObject(value), owner = readUuid(verifiedOwnerId);
  if (b.action === 'client_read') { exactKeys(b, ['action']); return { name: 'concierge_client_view', args: {} }; }
  if (b.action === 'advisor_read') { exactKeys(b, ['action', 'clientId']); return { name: 'concierge_advisor_view', args: { p_client_id: readUuid(b.clientId) } }; }
  const advisor = b.action === 'save_draft' || b.action === 'publish';
  const common = ['action', 'requestId', 'expectedRevision', ...(advisor ? ['clientId'] : [])];
  const base = { p_client_id: advisor ? readUuid(b.clientId) : owner, p_expected_revision: readInteger(b.expectedRevision), p_request_id: readUuid(b.requestId) };
  switch (b.action) {
    case 'submit_intake': {
      exactKeys(b, [...common, 'goal', 'note', 'baseline']);
      const baseline = readArray(b.baseline, 50).map(value => {
        const r = readObject(value); exactKeys(r, ['slot', 'productId']);
        return { slot: readIdentifier(r.slot), productId: readIdentifier(r.productId) };
      });
      requireValue(baseline.length > 0 && new Set(baseline.map(r => r.slot)).size === baseline.length);
      return { name: 'concierge_write', args: { ...base, p_action: b.action, p_payload: { goal: readText(b.goal, 300), note: readText(b.note, 4000, true), baseline } } };
    }
    case 'save_draft': {
      exactKeys(b, [...common, 'intakeVersion', 'recommendations', 'advisorNote']);
      for (const r of readArray(b.recommendations, 50)) exactKeys(readObject(r), recommendationKeys);
      return { name: 'concierge_write', args: { ...base, p_action: b.action, p_payload: { intakeVersion: readInteger(b.intakeVersion, 1), recommendations: readRecommendations(b.recommendations), advisorNote: readText(b.advisorNote, 4000, true) } } };
    }
    case 'publish':
      exactKeys(b, common);
      return { name: 'concierge_write', args: { ...base, p_action: b.action, p_payload: {} } };
    case 'decide': {
      exactKeys(b, [...common, 'version', 'recommendationId', 'choice', 'reason']);
      requireValue(b.choice === 'approved' || b.choice === 'declined');
      const reason = readText(b.reason, 1000, b.choice === 'approved');
      requireValue(b.choice !== 'approved' || reason === '');
      return { name: 'concierge_write', args: { ...base, p_action: b.action, p_payload: { version: readInteger(b.version, 1), recommendationId: readIdentifier(b.recommendationId), choice: b.choice, reason } } };
    }
    case 'receive':
      exactKeys(b, [...common, 'version', 'recommendationId']);
      return { name: 'concierge_write', args: { ...base, p_action: b.action, p_payload: { version: readInteger(b.version, 1), recommendationId: readIdentifier(b.recommendationId) } } };
    case 'start':
      exactKeys(b, [...common, 'version', 'recommendationId', 'startedOn']);
      // SQL is authoritative for the UTC actual-day cutoff, receipt and approval.
      return { name: 'concierge_write', args: { ...base, p_action: b.action, p_payload: { version: readInteger(b.version, 1), recommendationId: readIdentifier(b.recommendationId), startedOn: readDate(b.startedOn) } } };
    default: throw new Error('invalid_input');
  }
}
