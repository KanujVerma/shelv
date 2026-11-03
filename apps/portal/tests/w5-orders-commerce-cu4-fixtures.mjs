// CU4 source fixtures: actual retained cookie/session/Root/Commerce port, finite
// in-memory HTTP only. No endpoint, crypto override or successful provider stub.
import assert from 'node:assert/strict';
import {clientCookieRequest} from '../src/app/retained.ts';
import {owner,id} from './w5-orders-commerce-cu-fixtures.mjs';
export const actions=['confirm_product_received_v1','request_product_return_v1','accept_product_quote_v1','submit_payment_claim_v1'];
export const optionsFor=action=>({purchase:action==='confirm_product_received_v1'||action==='request_product_return_v1',accepted:action==='submit_payment_claim_v1'});
export async function deliberate(c,f,action){
 if(action==='confirm_product_received_v1')return c.reportReceived({state:'unknown'});
 if(action==='request_product_return_v1')return c.requestReturn({quantity:1,condition:'opened',reason:'Synthetic actual wrong item'});
 c.reviewQuote();return action==='accept_product_quote_v1'?c.acceptQuote():c.claimPayment(f.q.options[0].id);
}
export function naturalConnection(f,{operationReply=()=>Response.json({code:'unavailable'},{status:503}),nextOwner=false}={}){
 const requests=[];
 f.runtime.cookie.fetcher=async(url,options)=>{
  requests.push({url,method:options?.method,body:options?.body});
  if(url==='/api/client/operations'){assert.equal(JSON.parse(options.body).action,'client_read_v2');return operationReply();}
  assert.equal(url,'/api/client/session');return Response.json({signedIn:true,ownerId:nextOwner?id(77):owner,generation:nextOwner?8:7,capabilities:{view:true,edit:false,publish:false,confirmPayments:false},csrf:nextOwner?'CU4-new-owner':'CU-synthetic-session',idleExpiresAt:'2099-01-01T00:00:00Z',absoluteExpiresAt:'2099-01-02T00:00:00Z'});
 };
 return {requests,read:()=>clientCookieRequest('operations',f.runtime.cookie)({action:'client_read_v2'})};
}
