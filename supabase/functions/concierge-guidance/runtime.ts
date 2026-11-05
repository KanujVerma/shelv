import {createConciergeAuthenticatedPorts} from '../concierge-operations/runtime.ts';
import type {ConciergeTransportConfiguration} from '../concierge-operations/runtime.ts';
import type {GuidanceRpcCall} from '../../../src/contracts/PortalReview.ts';
import type {GuidancePorts} from './handler.ts';
export const createGuidancePorts=(config:ConciergeTransportConfiguration):GuidancePorts=>createConciergeAuthenticatedPorts<GuidanceRpcCall>({...config,allowedRpcNames:['concierge_guidance_command_v1']});
