// Test-only read model. No transport, observe(), retry(), disposal or state setter.
import type {ClientPlanReadView,PlanSessionBoundary,ClientPlanProps} from '../src/features/plan/types.ts';
import type {ClientPlanViewV3} from '../../../src/contracts/PortalReview.ts';
import type {GuidanceHydrator,GuidanceHydrationState} from '../src/features/plan/guidanceHydration.ts';
import type {PresentationMode} from '../src/navigation/routes.ts';
export interface ManifestSummary {
 readonly lifecycle:'absent'|'waiting'|'active'|'mismatch'|'retired'|'disposed';
 readonly commitId:number;readonly instanceId:number;readonly viewId:number;readonly sessionId:number;readonly snapshotId:number;readonly scopeId:number;
 readonly currentViewId:number;readonly currentSessionId:number;readonly currentSnapshotId:number;readonly currentScopeId:number;
 readonly mode:PresentationMode|null;readonly phase:GuidanceHydrationState['phase']|null;
 readonly manifestCount:number|null;readonly instructionCount:number|null;readonly detailCount:number|null;readonly error:number|null;
 readonly revision:number;readonly observedAtMs:number;readonly observationKind:'commit'|'store'|'pull'|'cleanup';
}
type Current={view:ClientPlanReadView|null;session:PlanSessionBoundary|null;scope:string};
type Context={props:ClientPlanProps&{view:ClientPlanViewV3};hydrator:GuidanceHydrator|null};
export function createManifestObservation(current:()=>Current,onSummary:(summary:ManifestSummary)=>void=()=>{},now:()=>number=()=>performance.now()){
 const identities=new WeakMap<object,number>(),scopes=new Map<string,number>();let identity=0,generation=0;
 const token=(value:object|null|undefined)=>{if(!value)return 0;let n=identities.get(value);if(!n){n=++identity;identities.set(value,n);}return n;};
 const scopeToken=(value:string)=>{let n=scopes.get(value);if(!n){n=++identity;if(scopes.size>=64)scopes.delete(scopes.keys().next().value!);scopes.set(value,n);}return n;};
 type Record={id:number;view:ClientPlanViewV3;session:PlanSessionBoundary;mode:PresentationMode;snapshot:object|null;scope:string;h:GuidanceHydrator|null;revision:number;time:number;kind:ManifestSummary['observationKind'];stop:()=>void};
 let active:Record|null=null,last:ManifestSummary|null=null;
 function read():ManifestSummary{
  const owner=current(),snapshot=owner.view?.schemaVersion===3?owner.view.currentGuidance?.snapshot:null;
  const currentIds={currentViewId:token(owner.view),currentSessionId:token(owner.session),currentSnapshotId:token(snapshot),currentScopeId:scopeToken(owner.scope)};
  if(!active)return Object.freeze({...last,commitId:last?.commitId??0,instanceId:last?.instanceId??0,viewId:last?.viewId??0,sessionId:last?.sessionId??0,snapshotId:last?.snapshotId??0,scopeId:last?.scopeId??0,...currentIds,lifecycle:last?'disposed':'absent',mode:last?.mode??null,phase:null,manifestCount:null,instructionCount:null,detailCount:null,error:null,revision:last?.revision??0,observedAtMs:last?.observedAtMs??now(),observationKind:'pull'});
  const a=active,h=a.h,state=h?.getSnapshot();let lifecycle:ManifestSummary['lifecycle']=h?'active':'waiting';
  if(owner.view!==a.view||owner.session!==a.session||owner.scope!==a.scope||a.view.currentGuidance?.snapshot!==a.snapshot||!a.session.isCurrent()||h&&(h.view!==a.view||h.session!==a.session||h.mode!==a.mode))lifecycle='mismatch';
  if(state?.phase==='retired')lifecycle='retired';
  return Object.freeze({commitId:a.id,instanceId:token(h),viewId:token(a.view),sessionId:token(a.session),snapshotId:token(a.snapshot),scopeId:scopeToken(a.scope),...currentIds,lifecycle,mode:a.mode,phase:state?.phase??null,manifestCount:state?.manifest===null||!state?null:state.manifest.length,instructionCount:a.view.currentGuidance?.instructionCount??null,detailCount:state?.details.size??null,error:state?.error??null,revision:a.revision,observedAtMs:a.time,observationKind:a.kind});
 }
 const notify=()=>{try{onSummary(read());}catch{/* Diagnostic consumers cannot affect the real producer. */}};
 function commit(context:Context,scope:string){
  active?.stop();const a:Record={id:++generation,view:context.props.view,session:context.props.session,mode:context.props.mode,snapshot:context.props.view.currentGuidance?.snapshot??null,scope,h:context.hydrator,revision:0,time:now(),kind:'commit',stop:()=>{}};active=a;
  let stopped=false;const stop=a.h?.subscribe(()=>{if(active!==a)return;a.revision++;a.time=now();a.kind='store';notify();})??(()=>{});a.stop=()=>{if(!stopped){stopped=true;stop();}};notify();
  return()=>{a.stop();if(active===a){last=Object.freeze({...read(),lifecycle:'disposed',observationKind:'cleanup',observedAtMs:now()});active=null;notify();}};
 }
 return{commit,read};
}
export function manifestBasis(s:ManifestSummary,mode:PresentationMode='client'){
 if(!s.currentViewId||!s.currentSessionId||!s.currentSnapshotId)throw Error('manifest current basis unavailable');
 return Object.freeze({currentViewId:s.currentViewId,currentSessionId:s.currentSessionId,currentSnapshotId:s.currentSnapshotId,currentScopeId:s.currentScopeId,mode});
}
// Standalone functions are serialized verbatim for Playwright polling. No closure/DOM writes.
export function manifestInstance(s:ManifestSummary,b:{currentViewId:number;currentSessionId:number;currentSnapshotId:number;currentScopeId:number;mode:PresentationMode}){
 if(!s||s.currentViewId!==b.currentViewId||s.currentSessionId!==b.currentSessionId||s.currentSnapshotId!==b.currentSnapshotId||s.currentScopeId!==b.currentScopeId)throw Error('manifest current context or scope changed');
 if(s.lifecycle==='mismatch'||s.lifecycle==='retired'||s.mode!==null&&s.mode!==b.mode||s.phase==='error')throw Error('manifest instance mismatched, retired or unavailable');
 return s.lifecycle==='active'&&s.instanceId!==0?s:false;
}
export function manifestAccepted(s:ManifestSummary,b:ManifestSummary){
 if(!s||s.currentViewId!==b.currentViewId||s.currentSessionId!==b.currentSessionId||s.currentSnapshotId!==b.currentSnapshotId||s.currentScopeId!==b.currentScopeId)throw Error('manifest current context or scope changed');
 if(s.commitId!==b.commitId||s.instanceId!==b.instanceId)throw Error('manifest committed instance replaced');
 if(s.lifecycle!=='active'||s.mode!==b.mode||s.viewId!==b.viewId||s.sessionId!==b.sessionId||s.snapshotId!==b.snapshotId||s.scopeId!==b.scopeId)throw Error('manifest instance disposed, retired or mismatched');
 if(s.phase==='error'||s.phase==='retired')throw Error('manifest unavailable');
 return s.phase==='ready'&&s.manifestCount!==null&&s.manifestCount===s.instructionCount?s:false;
}
