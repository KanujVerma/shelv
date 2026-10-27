import assert from 'node:assert/strict';
import test from 'node:test';
import {createPaymentPorts} from '../supabase/functions/concierge-payments/runtime.ts';
import {handlePaymentRequest} from '../supabase/functions/concierge-payments/handler.ts';
const owner='00000000-0000-4000-8000-000000000001';
test('payment HTTP uses shared verified bearer transport and never service authority for financial RPC',async()=>{
 const calls:{url:string;options:RequestInit}[]=[];
 const ports=createPaymentPorts({supabaseUrl:'https://project.supabase.co',publicKey:'synthetic-public',serviceKey:'synthetic-private',allowedOrigins:[],fetch:async(input,options)=>{
  calls.push({url:String(input),options:options!});
  if(String(input).endsWith('/auth/v1/user'))return Response.json({id:owner,is_anonymous:false});
  if(String(input).endsWith('/rest/v1/rpc/concierge_payment_view'))return Response.json({revision:0,quotes:[],claims:[],service:{status:'unpaid',period:null},nextServicePeriod:null,shippingAddress:null,shippingAddresses:[],bankReference:'PRIVATE_CANARY'});
  throw Error('Unexpected network access');}});
 const response=await handlePaymentRequest(new Request('https://edge.invalid',{method:'POST',headers:{authorization:'Bearer synthetic-user','content-type':'application/json'},body:'{"action":"client_read"}'}),ports);
 assert.equal(response.status,200);assert.doesNotMatch(await response.text(),/PRIVATE_CANARY/);assert.equal(calls.length,2);
 for(const call of calls){const headers=new Headers(call.options.headers);assert.equal(headers.get('authorization'),'Bearer synthetic-user');assert.equal(headers.get('apikey'),'synthetic-public');assert.doesNotMatch(JSON.stringify(call.options),/synthetic-private/);}
});
test('payment transport refuses RPCs outside its fixed server-owned registry',async()=>{
 let calls=0;const ports=createPaymentPorts({supabaseUrl:'https://project.supabase.co',publicKey:'synthetic',allowedOrigins:[],fetch:async()=>{calls++;throw Error('network');}});
 await assert.rejects(ports.rpc('synthetic',{name:'concierge_write',args:{}} as never),/unavailable/);assert.equal(calls,0);
});
