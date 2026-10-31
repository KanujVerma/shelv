import {createConciergeAuthenticatedPorts} from '../concierge-operations/runtime.ts';
import type {ConciergeTransportConfiguration} from '../concierge-operations/runtime.ts';
import type {PlanRpcCall} from '../../../src/contracts/PortalRebuild.ts';
import type {PlanPorts} from './handler.ts';
/** Public key plus the verified caller bearer. No admin credential, endpoint selection or local role grant. */
export function createPlanPorts(config:ConciergeTransportConfiguration):PlanPorts{return createConciergeAuthenticatedPorts<PlanRpcCall>({...config,allowedRpcNames:['concierge_plan_command_v1']});}
