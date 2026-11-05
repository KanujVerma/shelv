import type {ClientPlanView,PlanCommand} from '../../../../../src/contracts/PortalRebuild.ts';
import type {CareCommand,CareResult,ClientPlanViewV2} from '../../../../../src/contracts/PortalCare.ts';
import type {ClientPlanViewV3} from '../../../../../src/contracts/PortalReview.ts';
import type {ClientGuidancePort} from './guidancePort.ts';
import type {careClientActions} from '../../../../../src/contracts/PortalCareValues.ts';
import type {OperationPort} from '../../transport/session.ts';
import type {PortalRoute,PresentationMode} from '../../navigation/routes.ts';
import type {CapturedUse} from './useModel.ts';

export type ClientPlanReadView=ClientPlanView|ClientPlanViewV2|ClientPlanViewV3;
export type ClientCareCommand=Extract<CareCommand,{action:typeof careClientActions[number]}>;
export type DecisionCommand=Extract<PlanCommand,{action:'record_decision_v1'}>;
export type ReadPlanCommand=Extract<PlanCommand,{action:'read_client_plan_v1'}>;
/** Compose these from the retained, strictly decoded session transport. A resolved
 * decision acknowledges the command only; the renderer always rereads the view. */
export interface ClientPlanPorts {
  read: OperationPort<ReadPlanCommand,ClientPlanView>;
  decision: OperationPort<DecisionCommand,void>;
  /** Optional finite capability. Never supplied to unpublished or live-free demos. */
  care?: OperationPort<ClientCareCommand,CareResult>;
  /** Five-action V3 capability. Confirmed V3 never falls back to older reads. */
  review?: ClientGuidancePort;
}
/** Separate capability, deliberately incompatible with a live decision port. */
export interface DemoPlanPorts extends ClientPlanPorts {readonly mode:'public-demo'}
/** Memory interactions deliberately have no live-operation ABI or receipt. */
export interface DemoMemoryResult {readonly kind:'demo-memory';readonly view:ClientPlanViewV2}
export interface DemoUsePort {
  readonly kind:'demo-use';
  readonly sampleToday:string;
  isCurrent():boolean;
  report(capture:CapturedUse):DemoMemoryResult;
}
export interface DemoChoicePort {
  readonly kind:'demo-choice';
  isCurrent():boolean;
  choose(input:{decisionId:string;choice:DecisionCommand['choice']}):DemoMemoryResult;
}
export interface DemoPlanInteractions {
  readonly mode:'public-demo';
  readonly use:DemoUsePort;
  readonly choice:DemoChoicePort;
}
export interface PlanSessionBoundary {
  /** Opaque owner + session generation key; never a credential. Replace on login. */
  readonly key:string;
  isCurrent():boolean;
  subscribeInvalidation(listener:()=>void):()=>void;
  memory:{get<T>(key:string):T|undefined;set(key:string,value:unknown):void;delete(key:string):void};
}
export type PlanRoute=Extract<PortalRoute,{name:'plan'|'recommendation'|'product'|'product-evidence'|'product-use'|'report-use'}>;
/** Optional enclosing-view navigation for advisor preview / public Maya. The
 * coordinator owns mapping it to shared navigation and its scoped URL/history. */
export interface PlanNavigationPort {
  route:PlanRoute;
  navigate(route:PlanRoute):void;
  back():void;
  /** Exact scoped predecessor or semantic parent used by back; null means unknown. */
  backDestination?():PlanRoute|null;
}
export interface ClientPlanProps {
  navigation?:PlanNavigationPort;
  view:ClientPlanReadView;
  mode:PresentationMode;
  session:PlanSessionBoundary;
  ports?:ClientPlanPorts;
  demoPorts?:DemoPlanPorts;
  demoInteractions?:DemoPlanInteractions;
  onViewChange?:(view:ClientPlanReadView)=>void;
  onRecordUse?:(productId:string)=>void;
  onSelfPurchase?:(productId:string,decisionId:string)=>void;
  onExport?:()=>void;
  onSendUpdate?:()=>void;
  onHistory?:()=>void;
}
