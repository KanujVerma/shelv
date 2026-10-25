import { mapConciergeClientViewV2 } from '../../../src/contracts/ConciergePresentationMapping.ts';
import { readPresentation } from '../../../src/contracts/ConciergePresentationValidation.ts';
import { readInteger, readObject, readRecommendations, readUuid, requireValue } from '../../../src/contracts/ConciergePortalValidation.ts';
import { mapPaymentView } from '../concierge-payments/contract.ts';
import { mapPaymentViewV2 } from '../concierge-payments/methods.ts';
import { mapCheckinClientView } from '../concierge-checkins/projection.ts';

type PreviewSelection = {p_client_id:string;p_mode:'draft'|'published';p_expected_revision:number|null};
/** Reconstruct client-safe fields and bind the response to the exact requested selector. */
export function mapConciergePreview(value:unknown, selection:PreviewSelection) {
 try {
  const raw=readObject(value);requireValue(raw.schemaVersion===1&&raw.mode===selection.p_mode);
  const clientId=readUuid(raw.clientId).toLowerCase();requireValue(clientId===selection.p_client_id.toLowerCase());
  const revision=readInteger(raw.revision),clientView=mapConciergeClientViewV2(raw.clientView);
  requireValue(clientView.revision===revision);
  let draft=null;
  if(selection.p_mode==='draft'){
   requireValue(revision===selection.p_expected_revision);
   const saved=readObject(raw.draft),savedRevision=readInteger(saved.savedRevision),intakeVersion=readInteger(saved.intakeVersion,1);
   requireValue(savedRevision===revision);
   const recommendations=readRecommendations(saved.recommendations,{allowAdditions:true});
   draft={savedRevision,intakeVersion,presentation:readPresentation(saved.presentation,recommendations),recommendations};
  }else requireValue(raw.draft===null);
  const payments=readObject(raw.payments).schemaVersion===2?mapPaymentViewV2(raw.payments):mapPaymentView(raw.payments),checkins=mapCheckinClientView(raw.checkins);requireValue(checkins.ok);
  return {schemaVersion:1 as const,mode:selection.p_mode,clientId,revision,clientView,draft,payments,checkins:checkins.value};
 }catch{throw new Error('invalid_concierge_response');}
}
