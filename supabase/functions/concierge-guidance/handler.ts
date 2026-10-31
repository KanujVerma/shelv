import type {ConciergeAuthenticatedPorts} from '../../../src/contracts/ConciergePortal.ts';
import type {GuidanceRpcCall} from '../../../src/contracts/PortalReview.ts';
import {buildGuidanceRpc} from '../../../src/contracts/PortalReviewValidation.ts';
import {mapGuidanceResult} from '../../../src/contracts/PortalReviewMapping.ts';
import {handleTypedReviewRequest} from '../concierge-reviews/shared.ts';
export type GuidancePorts=ConciergeAuthenticatedPorts<GuidanceRpcCall>;
export const handleGuidanceRequest=(request:Request,ports:GuidancePorts):Promise<Response>=>handleTypedReviewRequest(request,ports,buildGuidanceRpc,mapGuidanceResult);
