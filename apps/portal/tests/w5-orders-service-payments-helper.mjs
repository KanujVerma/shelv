// Synthetic money and finite HTTP only. Real session, cookie factory, transport
// and payment codecs. No DB, provider, publication, order or Start operation.
import assert from 'node:assert/strict';
import {createApplicationSession} from '../src/app/session.ts';
import {createClientCookieRequest} from '../site/auth/client-cookie-session.js';
import {buildPaymentCallV2,mapPaymentViewV2,mapPaymentReceiptV2} from '../../../supabase/functions/concierge-payments/methods.ts';
export const actor='11111111-1111-4111-8111-111111111111';
export const quoteId='22222222-2222-4222-8222-222222222222';
export const optionId='33333333-3333-4333-8333-333333333333';
export const claimId='44444444-4444-4444-8444-444444444444';
export function view(){return {schemaVersion:2,revision:3,quotes:[{id:quoteId,version:1,publicationVersion:0,currency:'USD',status:'payable',serviceCents:10000,servicePeriod:null,shippingAddressVersion:null,items:[],productSubtotalCents:0,taxCents:0,shippingCents:0,productTotalCents:0,totalCents:10000,contractVersion:2,paymentOptions:[{id:optionId,recipientVersion:2,recipient:{method:'cash_app',name:'Synthetic Recipient',cashtag:'$synthetic'},available:true}]}],claims:[],service:{status:'unpaid',period:null},nextServicePeriod:null,shippingAddress:null,shippingAddresses:[]};}
export function receipt(){return {schemaVersion:2,paymentOptionId:optionId,revision:4,operation:'submit_claim',quoteId,claimId,status:'submitted_unverified',serviceUnlocked:false,serviceAccessStatus:null,productOrderStatus:null};}
export function deferred(){let release;return {promise:new Promise(r=>{release=r;}),release:v=>release(v)};}
export async function fixture(t){
 const broadcast=globalThis.BroadcastChannel;globalThis.BroadcastChannel=undefined;t.after(()=>{globalThis.BroadcastChannel=broadcast;});
 let data=view(),readReply=null,reply=()=>Response.json(receipt());const calls=[];
 let login={signedIn:true,ownerId:actor,generation:1,csrf:'synthetic-w5-csrf',capabilities:{view:true,edit:false,publish:false,confirmPayments:false},idleExpiresAt:'2026-11-04T12:00:00Z',absoluteExpiresAt:'2026-11-05T12:00:00Z'};
 const runtime=createApplicationSession({audience:'client',now:()=>Date.parse('2026-11-03T12:00:00Z'),locks:{request:async(_n,_o,run)=>run()},fetcher:async(url,init)=>{
  assert.equal(init.credentials,'same-origin');assert.equal(init.cache,'no-store');assert.equal(init.redirect,'error');
  const h=new Headers(init.headers);assert.equal(h.has('authorization'),false);assert.equal(h.has('apikey'),false);
  if(url==='/api/client/session')return Response.json(login);
  assert.equal(url,'/api/client/payments','unexpected HTTP denied');assert.equal(h.get('X-Shelv-CSRF'),login.csrf);
  const command=JSON.parse(init.body);calls.push({command,body:init.body});buildPaymentCallV2(command,actor);
  if(command.action==='client_read')return readReply?readReply():Response.json(data);
  assert.equal(command.action,'submit_claim');return reply(command);
 }});
 await runtime.restore();t.after(()=>runtime.dispose());
 const ports={read:runtime.transport.bindCookieChannel(createClientCookieRequest,'payments','read',mapPaymentViewV2),claim:{async execute(command,options){
  const call=buildPaymentCallV2(command,actor);
  return runtime.transport.bindCookieChannel(createClientCookieRequest,'payments','write',value=>mapPaymentReceiptV2(value,call)).execute(command,options);
 }}};
 return {runtime,ports,calls,setView(v){data=v;},setReadReply(v){readReply=v;},setReply(v){reply=v;},setLogin(v){login={...login,...v};}};
}
