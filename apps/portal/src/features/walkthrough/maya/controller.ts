import {readPlanCommand} from '../../../../../../src/contracts/PortalRebuildValidation.ts';
import type {AttributedUseEvent,ClientPlanViewV2,UseProjection} from '../../../../../../src/contracts/PortalCare.ts';
import type {ClientPlanProps,ClientPlanReadView,DemoPlanInteractions,DemoPlanPorts,PlanNavigationPort,PlanRoute,PlanSessionBoundary} from '../../plan/types.ts';
import {captureUse} from '../../plan/useModel.ts';
import type {UseForm} from '../../plan/useModel.ts';
import {buildRoute,parentRoute,parseRoute} from '../../../navigation/routes.ts';
import {createMayaFixture,mayaCareView,MAYA_TREATMENT} from './fixture.ts';
import {MAYA_SAMPLE_TODAY,reduceMayaUse} from './interactions.ts';
import {mayaStage,readMayaStage} from './model.ts';
import type {MayaGuide,MayaPage,MayaStageNumber} from './model.ts';

export interface MayaDemoSnapshot {
  readonly stage:MayaStageNumber;
  readonly guide:MayaGuide;
  readonly page:MayaPage;
  readonly route:PlanRoute;
  readonly view:ClientPlanReadView;
  readonly exampleReceipt:boolean;
  readonly exampleReports:readonly AttributedUseEvent[];
  readonly generation:number;
}
type Lease={active:boolean;memory:Map<string,unknown>;listeners:Set<()=>void>;lastRead:ClientPlanReadView|null;lastMemoryView:ClientPlanViewV2|null};
const unavailable=()=>Object.assign(Error('demo is no longer available'),{status:403});
function planRoute(input:PlanRoute):PlanRoute {
  const route=parseRoute(buildRoute(input));
  if(!route||!['plan','recommendation','product','product-evidence','product-use','report-use'].includes(route.name))throw Error('invalid demo plan route');
  return route as PlanRoute;
}

/** A public-only demo, with no ApplicationSession, transport, cookie, endpoint,
 * storage or injected live authority. It owns only its isolated memory. */
export function createMayaDemoController(options:{initialStage?:MayaStageNumber}={}) {
  const listeners=new Set<()=>void>();
  let disposed=false,generation=0,fixture=createMayaFixture(),use:UseProjection=fixture.use;
  let lease:Lease={active:true,memory:new Map(),listeners:new Set(),lastRead:null,lastMemoryView:null};
  let stack:PlanRoute[]=[],reports:AttributedUseEvent[]=[],stage=readMayaStage(options.initialStage??1),guide:MayaGuide='open',page:MayaPage=mayaStage(stage).page,route:PlanRoute=structuredClone(mayaStage(stage).route),receipt=false;
  const receipts=new Map<string,string>();
  let snapshot:MayaDemoSnapshot;
  const live=()=>!disposed&&lease.active;
  const renderView=():ClientPlanViewV2=>mayaCareView(fixture.base,use,stage>=4);
  function publish() {
    lease.lastRead=null;lease.lastMemoryView=null;
    snapshot={stage,guide,page,route:structuredClone(route),view:renderView(),exampleReceipt:receipt,exampleReports:structuredClone(reports),generation};
  }
  function emit(){publish();for(const listener of [...listeners])listener();}
  function requireLive(){if(!live())throw unavailable();}
  function selectStage(value:MayaStageNumber){requireLive();stage=readMayaStage(value);page=mayaStage(stage).page;route=structuredClone(mayaStage(stage).route);stack=[];emit();}
  function navigate(input:PlanRoute){requireLive();const next=planRoute(input);stack.push(route);route=next;page='plan';emit();}
  function backDestination():PlanRoute {return structuredClone(stack.at(-1)??parentRoute(route)) as PlanRoute;}
  function backPlan(){requireLive();route=planRoute(stack.pop()??backDestination());page='plan';emit();}
  function retire(current:Lease){
    current.active=false;current.memory.clear();current.lastRead=null;current.lastMemoryView=null;
    const observers=[...current.listeners];current.listeners.clear();
    for(const fn of observers){try{fn();}catch{/* Local observers cannot interrupt retirement. */}}
  }
  function createPorts(current:Lease):DemoPlanPorts {
    const currentLease=()=>live()&&lease===current&&current.active;
    return {mode:'public-demo',read:{async execute(input){
      if(!currentLease())throw unavailable();
      const command=readPlanCommand(input);
      if(command.action!=='read_client_plan_v1'||command.version!==null&&command.version!==1)throw Error('invalid demo read');
      const view=structuredClone(fixture.base);current.lastRead=view;return view;
    }},decision:{async execute(input){
      if(!currentLease())throw unavailable();
      const command=readPlanCommand(input);
      if(command.action!=='record_decision_v1')throw Error('invalid demo choice');
      const wire=JSON.stringify(command),prior=receipts.get(command.requestId);
      if(prior){if(prior!==wire)throw Object.assign(Error('demo request reused'),{status:409});return;}
      if(command.publicationVersion!==1||command.expectedDecisionRevision!==fixture.base.decisionRevision||!fixture.base.plan!.content.decisions.some(d=>d.id===command.decisionId))throw Object.assign(Error('demo choice changed'),{status:409});
      fixture.base={...fixture.base,decisionRevision:fixture.base.decisionRevision+1,decisions:[...fixture.base.decisions.filter(d=>d.decisionId!==command.decisionId),{decisionId:command.decisionId,choice:command.choice,reason:command.reason}]};
      receipts.set(command.requestId,wire);
      // No emit here: shared DecisionControls rereads and confirms before its
      // onViewChange callback replaces the rendering context.
    }}};
  }
  let demoPorts=createPorts(lease);
  function sessionFor(current:Lease):PlanSessionBoundary {
    const currentLease=()=>!disposed&&lease===current&&current.active;
    return {key:`public-maya:${generation}`,isCurrent:currentLease,subscribeInvalidation(fn){if(!currentLease())return()=>{};current.listeners.add(fn);return()=>{current.listeners.delete(fn);};},memory:{
      get<T>(key:string){return currentLease()?current.memory.get(key) as T|undefined:undefined;},
      set(key,value){if(currentLease())current.memory.set(key,value);},
      delete(key){if(currentLease())current.memory.delete(key);},
    }};
  }
  let session=sessionFor(lease);
  function reset(){
    requireLive();const old=lease;old.active=false;
    generation++;fixture=createMayaFixture();use=fixture.use;reports=[];receipt=false;receipts.clear();stack=[];stage=1;guide='open';page='plan';route={name:'plan',routine:'morning'};
    lease={active:true,memory:new Map(),listeners:new Set(),lastRead:null,lastMemoryView:null};demoPorts=createPorts(lease);session=sessionFor(lease);
    publish();retire(old);emit();
  }
  /** Preset reports demonstrate the REAL shared capture/projection/renderer
   * semantics, not a second use form or a successful live care operation. */
  function reportExample(action:'started-known'|'started-unknown'|'stopped-unknown',productId=MAYA_TREATMENT){
    requireLive();const state=use.planProducts.find(s=>s.product.productId===productId);
    if(!state)throw Error('unknown demo product');
    const form:UseForm={match:action==='stopped-unknown'?null:'yes',action:action==='stopped-unknown'?'stopped':'started_earlier',when:action==='started-known'?'earlier':'unknown',date:action==='started-known'?'2026-11-03':'',acquisition:action==='stopped-unknown'?'unknown':'self',details:'',frequency:'',amount:'',name:'',brand:'',variant:'',strength:'',sizeLabel:'',differentProduct:false};
    const capture=captureUse(form,state.product,state.product.publication,'2026-11-03');
    const next=reduceMayaUse(renderView(),reports,capture);use=next.use;reports=next.reports;emit();
  }
  publish();
  return {
    getSnapshot:()=>snapshot,
    subscribe(fn:()=>void){if(disposed)return()=>{};listeners.add(fn);return()=>{listeners.delete(fn);};},
    selectStage,
    next(){requireLive();if(stage<5)selectStage((stage+1) as MayaStageNumber);else{guide='exploring';page='plan';route={name:'plan',routine:'morning'};stack=[];emit();}},
    back(){requireLive();if(stage>1)selectStage((stage-1) as MayaStageNumber);},
    collapse(){requireLive();guide='collapsed';emit();},
    // Resume the chosen guide target after free exploration, keeping its demo
    // data/lease intact. Stage entry also retires the exploratory predecessor.
    reopen(){requireLive();guide='open';selectStage(stage);},
    exit(){requireLive();guide='exited';page='plan';emit();},
    explore(){requireLive();guide='exploring';page='plan';emit();},
    replay(){requireLive();guide='open';selectStage(1);},
    reset,
    navigate,
    backPlan,
    reportExample,
    receiveExample(){requireLive();receipt=true;emit();},
    getPlanProps():ClientPlanProps {
      const current=lease,view=snapshot.view,capturedRoute=snapshot.route;
      const routeKey=buildRoute(snapshot.route),currentContext=()=>live()&&lease===current&&snapshot.view===view&&buildRoute(snapshot.route)===routeKey;
      const navigation:PlanNavigationPort={route:capturedRoute,navigate(input){if(!currentContext())throw unavailable();navigate(input);},back(){if(!currentContext())throw unavailable();backPlan();},backDestination:()=>currentContext()?backDestination():parentRoute(capturedRoute) as PlanRoute};
      // A sample interaction returns the exact Root read DTO. The later-story
      // review remains authored display content, never a fabricated Care ACK.
      const result=()=>{const value=mayaCareView(fixture.base,use,false);current.lastMemoryView=value;return {kind:'demo-memory' as const,view:value};};
      const demoInteractions:DemoPlanInteractions={mode:'public-demo',use:{kind:'demo-use',sampleToday:MAYA_SAMPLE_TODAY,isCurrent:currentContext,report(capture){
        if(!currentContext()||current.lastMemoryView!==null||view.schemaVersion!==2)throw unavailable();
        const r=snapshot.route;
        if(r.name==='report-use'?capture.original!==null:r.name!=='product-use'||!capture.original||(capture.original.kind==='plan_product'?capture.original.productId:capture.original.reportedProductId)!==r.productId)throw Error('sample use target changed');
        const next=reduceMayaUse(view,reports,capture);use=next.use;reports=next.reports;return result();
      }},choice:{kind:'demo-choice',isCurrent:currentContext,choose(input){
        if(!currentContext()||current.lastMemoryView!==null||view.schemaVersion!==2)throw unavailable();
        if(snapshot.route.name!=='recommendation'||snapshot.route.decisionId!==input.decisionId||!['approved','deferred','declined'].includes(input.choice)||!fixture.base.plan!.content.decisions.some(d=>d.id===input.decisionId))throw Error('sample choice target changed');
        fixture.base={...fixture.base,decisionRevision:fixture.base.decisionRevision+1,decisions:[...fixture.base.decisions.filter(d=>d.decisionId!==input.decisionId),{decisionId:input.decisionId,choice:input.choice,reason:null}]};
        return result();
      }}};
      return {view,mode:'public-demo',session,demoPorts,demoInteractions,navigation,onViewChange(value){if(currentContext()&&(current.lastRead===value&&value.schemaVersion===1||current.lastMemoryView===value&&value.schemaVersion===2)){current.lastMemoryView=null;emit();}}};
    },
    dispose(){if(disposed)return;disposed=true;const old=lease;receipts.clear();reports=[];stack=[];fixture=createMayaFixture();use=fixture.use;receipt=false;guide='exited';page='plan';stage=1;route={name:'plan',routine:'morning'};publish();listeners.clear();retire(old);},
  };
}
export type MayaDemoController=ReturnType<typeof createMayaDemoController>;
