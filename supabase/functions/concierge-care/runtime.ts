import {createConciergeAuthenticatedPorts} from '../concierge-operations/runtime.ts';
import type {ConciergeTransportConfiguration} from '../concierge-operations/runtime.ts';
import type {CareRpcCall} from '../../../src/contracts/PortalCare.ts';
import type {CarePorts} from './handler.ts';
/** Public key plus the verified caller bearer. No admin credential, endpoint selection or local role grant. */
export function createCarePorts(config:ConciergeTransportConfiguration):CarePorts{return createConciergeAuthenticatedPorts<CareRpcCall>({...config,allowedRpcNames:['concierge_care_command_v1']});}
