import {buildServiceRpc} from '../../../src/contracts/ConciergeService.ts';
import { readIntakePresentation, readPresentation } from '../../../src/contracts/ConciergePresentationValidation.ts';
import type { ConciergeRpcCall } from '../../../src/contracts/ConciergePortal.ts';
import { exactKeys, readArray, readDate, readIdentifier, readInteger, readObject, readRecommendations, readText, readUuid, recommendationKeys, requireValue } from '../../../src/contracts/ConciergePortalValidation.ts';

/** Parse untrusted HTTP input. Advisor authority is deliberately not a request field. */
export function buildConciergeRpc(value: unknown, verifiedOwnerId: string): ConciergeRpcCall {
  const b = readObject(value), owner = readUuid(verifiedOwnerId);
  const service=buildServiceRpc(b,owner);if(service)return service;
  if (b.action === 'advisor_preview_read_v2') {
    exactKeys(b,['action','clientId','mode','expectedRevision']);
    requireValue(b.mode === 'draft' || b.mode === 'published');
    const revision = b.mode === 'draft' ? readInteger(b.expectedRevision) : (requireValue(b.expectedRevision === null), null);
    return {name:'concierge_advisor_preview_v2',args:{p_client_id:readUuid(b.clientId),p_mode:b.mode,p_expected_revision:revision}};
  }
  if (b.action === 'client_read_v2') { exactKeys(b,['action']); return {name:'concierge_client_view_v2',args:{}}; }
  if (b.action === 'advisor_read_v2') { exactKeys(b,['action','clientId']); return {name:'concierge_advisor_view_v2',args:{p_client_id:readUuid(b.clientId)}}; }
  if (b.action === 'advisor_list') { exactKeys(b, ['action']); return { name: 'concierge_advisor_directory', args: {} }; }
  if (b.action === 'client_read') { exactKeys(b, ['action']); return { name: 'concierge_client_view', args: {} }; }
  if (b.action === 'advisor_read') { exactKeys(b, ['action', 'clientId']); return { name: 'concierge_advisor_view', args: { p_client_id: readUuid(b.clientId) } }; }
  const advisor = b.action === 'save_draft_v2' || b.action === 'save_intake_v2' || b.action === 'publish_v2' || b.action === 'save_draft' || b.action === 'publish' || b.action === 'save_intake' || b.action === 'save_meeting_note';
  const common = ['action', 'requestId', 'expectedRevision', ...(advisor ? ['clientId'] : [])];
  const base = { p_client_id: advisor ? readUuid(b.clientId) : owner, p_expected_revision: readInteger(b.expectedRevision), p_request_id: readUuid(b.requestId) };
  switch (b.action) {
    case 'save_meeting_note': {
      exactKeys(b, [...common, 'kind', 'text']); requireValue(b.kind === 'notes' || b.kind === 'transcript');
      return { name: 'concierge_advisor_write', args: { ...base, p_action: b.action, p_payload: { kind: b.kind, text: readText(b.text, 20000) } } };
    }
    case 'save_intake_v2':
    case 'save_intake':
    case 'submit_intake': {
      exactKeys(b, [...common, 'goal', 'note', 'baseline',...(b.action==='save_intake_v2'?['presentation']:[])]);
      const baseline = readArray(b.baseline, 50).map(value => {
        const r = readObject(value); exactKeys(r, ['slot', 'productId']);
        return { slot: readIdentifier(r.slot), productId: readIdentifier(r.productId) };
      });
      requireValue((b.action==='save_intake_v2'||baseline.length > 0) && new Set(baseline.map(r => r.slot)).size === baseline.length);
      const payload = { goal: readText(b.goal, 300), note: readText(b.note, 4000, true), baseline };
      if(b.action==='save_intake_v2')return {name:'concierge_presentation_write',args:{...base,p_action:b.action,p_payload:{...payload,presentation:readIntakePresentation(b.presentation,baseline)}}};
      return b.action === 'save_intake' ? { name: 'concierge_advisor_write', args: { ...base, p_action: 'save_intake', p_payload: payload } } : { name: 'concierge_write', args: { ...base, p_action: 'submit_intake', p_payload: payload } };
    }
    case 'save_draft_v2':
    case 'save_draft': {
      exactKeys(b, [...common, 'intakeVersion', 'recommendations', 'advisorNote',...(b.action==='save_draft_v2'?['presentation']:[])]);
      for (const r of readArray(b.recommendations, 50)) exactKeys(readObject(r), recommendationKeys);
      const payload={intakeVersion:readInteger(b.intakeVersion,1),recommendations:readRecommendations(b.recommendations,{allowAdditions:b.action==='save_draft_v2'}),advisorNote:readText(b.advisorNote,4000,true)};
      if(b.action==='save_draft_v2')return {name:'concierge_presentation_write',args:{...base,p_action:b.action,p_payload:{...payload,presentation:readPresentation(b.presentation,payload.recommendations)}}};
      return {name:'concierge_write',args:{...base,p_action:b.action,p_payload:payload}};
    }
    case 'publish_v2':
      exactKeys(b,common);return {name:'concierge_presentation_write',args:{...base,p_action:b.action,p_payload:{}}};
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
