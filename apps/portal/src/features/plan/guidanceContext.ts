import type {ClientPlanProps,PlanSessionBoundary} from './types.ts';

// Restriction history belongs to the whole published feature, including routes
// that never mount a decision. This holds no content or client intent, and is
// collectible with the captured session. Unpublished previews never enter it.
const contexts=new WeakMap<PlanSessionBoundary,{restricted:boolean;restriction:object|null}>();
export function observeGuidanceFeatureContext(props:ClientPlanProps){
 if(!props.session.isCurrent()){contexts.delete(props.session);return;}
 if(props.view.schemaVersion!==3)return;
 const previous=contexts.get(props.session);
 const restricted=props.mode!=='client'||props.view.access!=='active'||props.view.currentGuidance?.mode!=='current_document'||!props.ports?.review||!props.onViewChange;
 contexts.set(props.session,{restricted,restriction:restricted&&!previous?.restricted?{}:previous?.restriction??null});
}
export function guidanceRestriction(session:PlanSessionBoundary):object|null{
 if(!session.isCurrent()){contexts.delete(session);return null;}
 return contexts.get(session)?.restriction??null;
}
