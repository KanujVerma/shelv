import type {ApplicationSession} from '../../app/session.ts';
import type {OperationPort} from '../../transport/session.ts';
import type {mapPaymentViewV2,mapPaymentReceiptV2} from '../../../../../supabase/functions/concierge-payments/methods.ts';

export type ClientPaymentView=ReturnType<typeof mapPaymentViewV2>;
export type ClientPaymentReceipt=Extract<ReturnType<typeof mapPaymentReceiptV2>,{quoteId:string}>;
export type ClientPaymentRead=Readonly<{schemaVersion:2;action:'client_read'}>;
export type ClientPaymentClaim=Readonly<{
  schemaVersion:2;action:'submit_claim';requestId:string;expectedRevision:number;
  quoteId:string;quoteVersion:number;paymentOptionId:string;serviceCents:number;
  productCents:number;totalCents:number;shippingAddressVersion:null;evidenceId:null;
}>;
/** W0 supplies the actual retained-cookie payment channel, strict codecs and
 * session transport. These ports grant no client/advisor or provider authority. */
export interface ClientPaymentPorts {
  read:OperationPort<ClientPaymentRead,ClientPaymentView>;
  claim:OperationPort<ClientPaymentClaim,ClientPaymentReceipt>;
}
export type ClientPaymentSnapshot=Readonly<{
  phase:'idle'|'loading'|'ready'|'submitting'|'unavailable'|'denied'|'ended';
  view:ClientPaymentView|null;
  pending:ClientPaymentClaim|null;
  receipt:ClientPaymentReceipt|null;
  outcome:'none'|'uncertain'|'submitted_unverified'|'rejected';
  error:number|null;
}>;
export interface ClientPaymentsController {
  getSnapshot():ClientPaymentSnapshot;
  subscribe(listener:()=>void):()=>void;
  load():Promise<void>;
  claim(rendered:ClientPaymentSnapshot,quoteId:string,optionId:string,confirmed:boolean):Promise<void>;
  retry(rendered:ClientPaymentSnapshot):Promise<void>;
  dispose():void;
}
export type ClientPaymentsRuntime=ApplicationSession;
