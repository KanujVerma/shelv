import {createConciergeAuthenticatedPorts} from '../concierge-operations/runtime.ts';
import {createPaymentStorage} from './storage.ts';
import {paymentRecipient} from './contract.ts';
import type {PaymentBackendCall,PaymentPorts} from './handler.ts';
import type {PaymentRecipient} from './types.ts';
type Configuration={supabaseUrl:string;publicKey:string;allowedOrigins:readonly string[];serviceKey?:string;recipient?:Partial<Omit<PaymentRecipient,'method'>>;fetch?:typeof globalThis.fetch};
/** Source-only composition, with core-owned identity transport and an exact RPC registry. */
export function createPaymentPorts(config:Configuration):PaymentPorts{
 const shared=createConciergeAuthenticatedPorts<PaymentBackendCall>({...config,allowedRpcNames:['concierge_payment_view','concierge_payment_write','concierge_payment_evidence_reserve','concierge_payment_evidence_commit','concierge_payment_evidence_access']});
 const recipient=paymentRecipient(config.recipient);
 return {...shared,recipient,...(config.serviceKey?{storage:createPaymentStorage({supabaseUrl:config.supabaseUrl,serviceKey:config.serviceKey,fetch:config.fetch})}:{})};
}
