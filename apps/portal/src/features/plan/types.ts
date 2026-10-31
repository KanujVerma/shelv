import type {ClientPlanView,PlanCommand} from '../../../../../src/contracts/PortalRebuild.ts';
import type {CareCommand,CareResult,ClientPlanViewV2} from '../../../../../src/contracts/PortalCare.ts';
import type {careClientActions} from '../../../../../src/contracts/PortalCareValues.ts';
import type {OperationPort} from '../../transport/session.ts';
import type {PortalRoute,PresentationMode} from '../../navigation/routes.ts';

export type ClientPlanReadView=ClientPlanView|ClientPlanViewV2;
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
}
/** Separate capability, deliberately incompatible with a live decision port. */
export interface DemoPlanPorts extends ClientPlanPorts {readonly mode:'public-demo'}
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
  onViewChange?:(view:ClientPlanReadView)=>void;
  onRecordUse?:(productId:string)=>void;
  onSelfPurchase?:(productId:string,decisionId:string)=>void;
  onExport?:()=>void;
  onSendUpdate?:()=>void;
  onHistory?:()=>void;
}
