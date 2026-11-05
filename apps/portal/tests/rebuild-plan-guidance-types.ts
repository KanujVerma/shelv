import type {ClientGuidanceCommand,ClientGuidancePort} from '../src/features/plan/guidancePort.ts';
import type {ClientPlanReadView,ClientPlanPorts} from '../src/features/plan/types.ts';
import type {ClientPlanViewV3} from '../../../src/contracts/PortalReview.ts';
import {createClientPlanController} from '../src/app/client-state.ts';
import type {PlanSessionBoundary} from '../src/features/plan/types.ts';
import type {OperationPort} from '../src/transport/session.ts';
const view:ClientPlanReadView={} as ClientPlanViewV3;
void view;
const denied:ClientGuidanceCommand={schemaVersion:1,
 // @ts-expect-error factual Care operations retain a separate capability
 action:'report_product_use_v1'};
void denied;
const extra:ClientGuidanceCommand={schemaVersion:1,action:'read_client_plan_v3',version:null,
 // @ts-expect-error no caller-selected owner
 clientId:'11111111-1111-4111-8111-111111111111'};
void extra;
function compose(session:PlanSessionBoundary,ports:ClientPlanPorts,review:ClientGuidancePort,raw:OperationPort<unknown,unknown>){
 createClientPlanController(session,{...ports,review},{readVersion:3});
 // @ts-expect-error raw coordinator transport needs the canonical feature adapter
 createClientPlanController(session,{...ports,review:raw},{readVersion:3});
}
void compose;
