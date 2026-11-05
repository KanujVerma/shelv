// Closed HTTP source fixture only. Actual retained Auth/RPC runtime and W1
// command/result codecs; the view is hand-built synthetic input, not money proof.
import assert from 'node:assert/strict';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
export const actor='11111111-1111-4111-8111-111111111111';
export const claim='22222222-2222-4222-8222-222222222222';
export const quote='33333333-3333-4333-8333-333333333333';
export const origin='https://shelv-financials.invalid';
export const command={schemaVersion:1,action:'read_client_service_financials_v1',snapshot:null,cursor:null,limit:100};
export function view(){return {schemaVersion:1,snapshot:{paymentRevision:4,serviceRevision:3,asOfDay:'2026-11-03',hash:'a'.repeat(64)},payments:[{kind:'canonical_payment',claimId:claim,quoteId:quote,verifiedAt:'2026-10-01T12:00:00Z',serviceCents:10000,period:{state:'scheduled',startOn:'2026-10-01',endOn:'2026-11-01'}}],nextCursor:null,firstPublicationOn:{state:'known',value:'2026-10-01'},pendingServiceQuotes:[],guarantee:{state:'unavailable',code:'service_terms_unavailable'}};}
async function source(relative){
 const url=process.env.W5_FINANCIALS_SOURCE_ROOT?pathToFileURL(path.resolve(process.env.W5_FINANCIALS_SOURCE_ROOT,relative)):new URL('../../../'+relative,import.meta.url);
 try{return await import(url);}catch(error){assert.fail('financial read source/dependency unavailable: '+error.message);}
}
export async function fixture(){
 const {createServiceFinancialsPorts}=await source('supabase/functions/concierge-payments/service-financials-runtime.ts');
 const {handleServiceFinancialsRequest}=await source('supabase/functions/concierge-payments/service-financials-handler.ts');
 let authReply=()=>Response.json({id:actor,is_anonymous:false}),rpcReply=()=>Response.json(view());const calls=[];
 const ports=createServiceFinancialsPorts({supabaseUrl:'https://synthetic.supabase.co',publicKey:'synthetic-public-key',allowedOrigins:[origin],fetch:async(input,init)=>{
  const url=String(input);calls.push({url,init});assert.equal(init.credentials,'omit');assert.equal(init.cache,'no-store');assert.equal(init.redirect,'manual');
  const h=new Headers(init.headers);assert.equal(h.get('authorization'),'Bearer synthetic');assert.equal(h.get('apikey'),'synthetic-public-key');
  if(url==='https://synthetic.supabase.co/auth/v1/user')return authReply();
  assert.equal(url,'https://synthetic.supabase.co/rest/v1/rpc/concierge_client_service_financials_read_v1');return rpcReply(JSON.parse(init.body));
 }});
 const request=(value=command,options={})=>new Request('https://edge.invalid/financials',{method:'POST',headers:{authorization:'Bearer synthetic','content-type':'application/json',origin,...options.headers},body:options.body??JSON.stringify(value),...(options.signal?{signal:options.signal}:{})});
 return {calls,request,run:(r)=>handleServiceFinancialsRequest(r,ports),setAuthReply(fn){authReply=fn;},setRpcReply(fn){rpcReply=fn;}};
}
