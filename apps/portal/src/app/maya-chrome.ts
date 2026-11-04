import type {MayaDemoController,MayaDemoSnapshot} from '../features/walkthrough/maya/controller.ts';
import type {PlanSessionBoundary} from '../features/plan/types.ts';

type ChromeSnapshot=Readonly<{opening:object|null;revision:number;retired:boolean}>;
/** Local sample chrome only. Rendered handles contain no plan snapshot,
 * session, answers, contact details or business operation. */
export function createMayaChromeController(controller:MayaDemoController){
 const listeners=new Set<()=>void>();
 let state:ChromeSnapshot=Object.freeze({opening:null,revision:0,retired:false});
 let current:MayaDemoSnapshot|null=controller.getSnapshot(),session:PlanSessionBoundary|null=controller.getPlanProps().session;
 let disposed=false,notifying=false,stopController=()=>{},stopSession=()=>{};
 function safe(fn:()=>void){try{fn();}catch{/* Finish every local retirement. */}}
 function notify(){
  if(notifying)return;notifying=true;
  try{let before;do{before=state;for(const fn of [...listeners]){
   if(state!==before)break;if(listeners.has(fn))safe(fn);
  }}while(before!==state);}finally{notifying=false;}
 }
 function end(){
  if(state.retired)return;
  const detachController=stopController,detachSession=stopSession;
  // Clear ownership/references before unsubscribing or invoking observers.
  current=null;session=null;stopController=()=>{};stopSession=()=>{};
  state=Object.freeze({opening:null,revision:state.revision+1,retired:true});
  safe(detachController);safe(detachSession);notify();
 }
 function refresh(){
  if(disposed||state.retired)return;
  const next=controller.getSnapshot(),nextSession=controller.getPlanProps().session;
  if(!nextSession.isCurrent()){end();return;}
  if(next===current&&nextSession===session)return;
  const detach=stopSession;
  current=next;session=nextSession;stopSession=()=>{};
  state=Object.freeze({opening:null,revision:state.revision+1,retired:false});
  safe(detach);
  stopSession=nextSession.subscribeInvalidation(refresh);
  // No mutation follows callbacks: a reentrant new opening/context keeps custody.
  notify();
 }
 stopSession=session.subscribeInvalidation(refresh);
 stopController=controller.subscribe(refresh);
 function owns(rendered:ChromeSnapshot){refresh();return !disposed&&!state.retired&&state===rendered;}
 return Object.freeze({
  getSnapshot(){refresh();return state;},
  subscribe(fn:()=>void){if(disposed)return()=>{};listeners.add(fn);return()=>{listeners.delete(fn);};},
  open(rendered:ChromeSnapshot){if(!owns(rendered))return;state=Object.freeze({...state,opening:Object.freeze({})});notify();},
  close(rendered:ChromeSnapshot){if(!owns(rendered)||state.opening===null)return;state=Object.freeze({...state,opening:null});notify();},
  showPlan(rendered:ChromeSnapshot){if(!owns(rendered))return;const routine=controller.getSnapshot().route.routine;
   if(!owns(rendered))return;controller.navigate({name:'plan',routine});},
  dispose(){if(disposed)return;disposed=true;end();listeners.clear();},
 });
}
export type MayaChromeController=ReturnType<typeof createMayaChromeController>;
