import type { AdvisorViewV2, ClientViewV2, ActiveStep } from './ConciergePresentation.ts';
import { mapConciergeAdvisorView, mapConciergeClientView } from './ConciergePortalMapping.ts';
import { readArray, readIdentifier, readInteger, readObject, requireValue } from './ConciergePortalValidation.ts';
import { readIntakePresentation, readPresentation, readPresentationShape, stepShape } from './ConciergePresentationValidation.ts';

// JSONB/PostgREST object key order is not a wire invariant.
function canonical(value:unknown):string {
 if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';
 if(value!==null&&typeof value==='object')return '{'+Object.entries(value).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>JSON.stringify(k)+':'+canonical(v)).join(',')+'}';
 return JSON.stringify(value);
}
/** Public fields are reconstructed; advisor notes and unknown root keys stay out. */
export function mapConciergeClientViewV2(value:unknown):ClientViewV2 {
 try {
  const raw=readObject(value);requireValue(raw.schemaVersion===2);
  const base=mapConciergeClientView(raw);
  const plan=base.plan===null?null:{...base.plan,presentation:readObject(raw.plan).presentation===null?null:readPresentation(readObject(raw.plan).presentation,base.plan.recommendations)};
  const history=base.history.map((p,i)=>({...p,presentation:readObject(readArray(raw.history)[i]).presentation===null?null:readPresentation(readObject(readArray(raw.history)[i]).presentation,p.recommendations)}));
  const publications=[...history,...(plan?[plan]:[])];
  const earliest=publications.find(p=>p.presentation!==null);
  const activeRoutine:ActiveStep[]=readArray(raw.activeRoutine,50).map(input=>{
   const x=readObject(input),source=readObject(x.source);
   requireValue(source.kind==='baseline'||source.kind==='activation');
   const publicationVersion=readInteger(source.publicationVersion,1),recommendationId=source.recommendationId===null?null:readIdentifier(source.recommendationId);
   const step=readPresentationShape(Object.fromEntries(Object.keys(stepShape.fields!).map(k=>[k,x[k]])),stepShape) as Omit<ActiveStep,'source'|'guides'>;
   const snapshot=publications.find(p=>p.version===publicationVersion)?.presentation;requireValue(snapshot);
   if(source.kind==='baseline'){
    requireValue(recommendationId===null&&earliest?.version===publicationVersion);
    const captured=snapshot.baselineRoutine.find(s=>s.id===step.id);requireValue(captured&&canonical(captured)===canonical(step));
   }else{
    requireValue(step.kind==='product'&&recommendationId!==null);
    const card=snapshot.categoryCards.find(c=>c.recommendationId===recommendationId);
    requireValue(card&&card.slot===step.slot&&card.proposedProduct?.id===step.productId&&canonical(card.proposedProduct)===canonical(step.product)&&canonical(card.usage)===canonical(step.usage));
    requireValue(base.routineHistory.some(h=>h.version===publicationVersion&&h.recommendationId===recommendationId&&h.slot===step.slot&&h.productId===step.productId));
   }
   requireValue(step.kind==='instruction'?step.productId===null&&step.product===null&&step.slot===null:base.routine.some(r=>r.slot===step.slot&&r.productId===step.productId));
   const allowed=[...snapshot.routineGuides,...snapshot.categoryCards.map(c=>c.how)].filter(g=>g.productId===null||g.productId===step.productId);
   const guides=readArray(x.guides,62).map(g=>{const candidate=allowed.find(a=>canonical(a)===canonical(g));requireValue(candidate);return structuredClone(candidate);});
   return {...step,source:{kind:source.kind,publicationVersion,recommendationId},guides};
  });
  requireValue(new Set(activeRoutine.map(s=>s.id)).size===activeRoutine.length);
  requireValue(plan!==null||activeRoutine.length===0);
  return {...base,schemaVersion:2,plan,history,activeRoutine};
 }catch{throw new Error('invalid_concierge_response');}
}
export function mapConciergeAdvisorViewV2(value:unknown):AdvisorViewV2 {
 try {
  const raw=readObject(value),base=mapConciergeAdvisorView(raw);
  const intake=base.intake===null?null:{...base.intake,presentation:readObject(raw.intake).presentation===null?null:readIntakePresentation(readObject(raw.intake).presentation)};
  const draft=base.draft===null?null:{...base.draft,presentation:readObject(raw.draft).presentation===null?null:readPresentation(readObject(raw.draft).presentation,base.draft.recommendations)};
  return {...base,client:mapConciergeClientViewV2(raw.client),intake,draft};
 }catch{throw new Error('invalid_concierge_response');}
}
