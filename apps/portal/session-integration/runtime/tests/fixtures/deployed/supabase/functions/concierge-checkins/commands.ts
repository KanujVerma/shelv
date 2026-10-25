import { exactKeys, readInteger, readObject, readText, readUuid, requireValue } from '../../../src/contracts/ConciergePortalValidation.ts';
import { validateCheckinSubmission } from './validation.ts';
import { validateCheckinDate } from './dates.ts';
import type { CheckinRpcCall } from './types.ts';

/** Input authority is always the verified identity plus the transactional RPC guard. */
export function buildCheckinCall(input: unknown, ownerId: string): CheckinRpcCall {
  const b = readObject(input), owner = readUuid(ownerId).toLowerCase();
  if (b.action === 'client_read') { exactKeys(b, ['action']); return { name: 'concierge_checkin_read', args: { p_client_id: owner } }; }
  if (b.action === 'advisor_read') { exactKeys(b, ['action','clientId']);
    return { name: 'concierge_checkin_advisor_read', args: { p_client_id: readUuid(b.clientId).toLowerCase() } }; }
  if (b.action === 'photo_view' || b.action === 'advisor_photo_view') {
    exactKeys(b, ['action','photoId', ...(b.action === 'advisor_photo_view' ? ['clientId'] : [])]);
    return { name: 'concierge_checkin_photo_authorize', args: { p_client_id: b.action === 'photo_view' ? owner : readUuid(b.clientId).toLowerCase(),
      p_photo_id: readUuid(b.photoId).toLowerCase() } };
  }
  const common = ['action','requestId','expectedRevision'];
  const base = { p_client_id: owner, p_request_id: readUuid(b.requestId).toLowerCase(), p_expected_revision: readInteger(b.expectedRevision) };
  requireValue(base.p_expected_revision < Number.MAX_SAFE_INTEGER);
  if (b.action === 'submit_report') {
    const allowed = [...common,'comfort','consistency','changes', ...(Object.hasOwn(b,'photoIds') ? ['photoIds'] : [])]; exactKeys(b, allowed);
    const result = validateCheckinSubmission({ requestId: b.requestId, comfort: b.comfort, consistency: b.consistency, changes: b.changes,
      ...(Object.hasOwn(b,'photoIds') ? { photoIds: b.photoIds } : {}) });
    requireValue(result.ok);
    return { name: 'concierge_checkin_write', args: { ...base, p_action: 'submit_report', p_payload: {
      comfort: result.value.comfort, consistency: result.value.consistency, changes: result.value.changes, photoIds: [...result.value.photoIds] } } };
  }
  if (b.action === 'set_next_checkin') {
    exactKeys(b, [...common,'clientId','nextCheckinOn']); const date = validateCheckinDate(b.nextCheckinOn); requireValue(date.ok);
    return { name: 'concierge_checkin_write', args: { ...base, p_client_id: readUuid(b.clientId).toLowerCase(), p_action: b.action,
      p_payload: { nextCheckinOn: date.value } } };
  }
  if (b.action === 'add_meeting_note') {
    exactKeys(b, [...common,'clientId','checkinId','note']); const note = readText(b.note, 4000); requireValue(!note.includes('\u0000'));
    return { name: 'concierge_checkin_write', args: { ...base, p_client_id: readUuid(b.clientId).toLowerCase(), p_action: b.action,
      p_payload: { checkinId: readUuid(b.checkinId).toLowerCase(), note } } };
  }
  throw new Error('invalid_input');
}
