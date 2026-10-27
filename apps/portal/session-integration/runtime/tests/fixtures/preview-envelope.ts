import { createAlexSample } from '../../../../site/advisor/alex-sample.js';
import { mapConciergePreview } from '../../../../backend/source/supabase/functions/concierge-operations/preview.ts';

// Full synthetic wire data is checked by the released Edge projector before transport tests use it.
export function previewEnvelope(mode:'draft'|'published',clientId:string,photos:{id:string,angle:'front'|'left'|'right'}[]=[]) {
 const e:any=createAlexSample();delete e.sample;e.clientId=clientId;e.mode=mode;e.revision=12;e.clientView.revision=12;
 e.draft=mode==='draft'?{savedRevision:12,intakeVersion:1,presentation:e.clientView.plan.presentation,recommendations:e.clientView.plan.recommendations}:null;
 e.checkins.reports=[{id:'66666666-6666-4666-8666-666666666666',submittedAt:'2026-10-20T00:00:00Z',comfort:'Comfortable',consistency:'Daily',changes:'Synthetic fixture',photos}];
 return structuredClone(mapConciergePreview(e,{p_client_id:clientId,p_mode:mode,p_expected_revision:mode==='draft'?12:null}));
}
