import {createNotificationRequest} from '../apps/portal/src/app/notification-request.ts';
import type {ApplicationSession} from '../apps/portal/src/app/session.ts';
import type {NotificationCommand,NotificationResult} from '../src/contracts/PortalNotification.ts';
import type {OperationOptions} from '../apps/portal/src/transport/session.ts';
declare const runtime:ApplicationSession;
declare const command:NotificationCommand;
declare const options:OperationOptions;
const api=createNotificationRequest(runtime);
const result:Promise<NotificationResult>=api.execute(command,options);
const current:boolean=api.isCurrent();
api.dispose();
// @ts-expect-error no successful request factory or data override accepted
createNotificationRequest(runtime,{factory:()=>async()=>({status:'unknown'})});
// @ts-expect-error no caller owner/role/endpoint/RPC fields
api.execute({schemaVersion:1,action:'list_inbox_v1',cursor:null,limit:5,ownerId:'caller'});
// @ts-expect-error status must carry the exact original write, never only request ID
api.execute({schemaVersion:1,action:'request_status_v1',requestId:'caller'});
// @ts-expect-error no service claim registration
api.execute({schemaVersion:1,action:'concierge_plan_claim_email_deliveries_v1'});
// @ts-expect-error no truthy relevance result
api.execute(command,{isApplicable:()=>1});
void [result,current];
