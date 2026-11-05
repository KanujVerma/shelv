import type {ConciergeAuthenticatedPorts} from '../../../src/contracts/ConciergePortal.ts';
import type {ReviewRpcCall} from '../../../src/contracts/PortalReview.ts';
import {buildReviewRpc} from '../../../src/contracts/PortalReviewValidation.ts';
import {mapReviewResult} from '../../../src/contracts/PortalReviewMapping.ts';
import {handleTypedReviewRequest} from './shared.ts';
export type ReviewPorts=ConciergeAuthenticatedPorts<ReviewRpcCall>;
export const handleReviewRequest=(request:Request,ports:ReviewPorts):Promise<Response>=>handleTypedReviewRequest(request,ports,buildReviewRpc,mapReviewResult);
