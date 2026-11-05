import {createConciergeAuthenticatedPorts} from '../concierge-operations/runtime.ts';
import type {ConciergeTransportConfiguration} from '../concierge-operations/runtime.ts';
import type {ReviewRpcCall} from '../../../src/contracts/PortalReview.ts';
import type {ReviewPorts} from './handler.ts';
export const createReviewPorts=(config:ConciergeTransportConfiguration):ReviewPorts=>createConciergeAuthenticatedPorts<ReviewRpcCall>({...config,allowedRpcNames:['concierge_review_command_v1']});
