// CU regression fixtures: synthetic finite HTTP objects only. No endpoint,
// fetch, browser, auth provider, server, money, or successful production port.
import assert from 'node:assert/strict';
import {createApplicationSession} from '../src/app/session.ts';
import {createCommercePort,CommerceError} from '../src/features/orders/port.ts';
import {createOrdersController} from '../src/features/orders/controller.ts';
import {hashCommerceCommand,readCommerceCommand} from '../../../src/contracts/PortalCommerceValidation.ts';
import {quoteFixture,purchaseFixture,owner,id,instant} from './w5-orders-commerce-fixtures.mjs';
export {owner,id,instant};
export const snapshot={revision:31,paymentRevision:17,serviceRevision:23,asOfDay:'2026-10-31',hash:'e'.repeat(64)};
export const intentKey=`orders-intent:${owner}`;
export function deferred(){let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};}
export async function setup(t,{purchase=false,accepted=false}={}){
 const q=await quoteFixture({accepted});
 const detail=purchase?{...purchaseFixture(q),revision:9}:q.header;
 const entity=purchase?{kind:'purchase',id:detail.id,revision:9}:{kind:'quote',id:q.header.target.quoteId,revision:q.header.target.quoteVersion};
 const sessionCalls=[];
 const runtime=createApplicationSession({audience:'client',locks:{request:async(_k,o,fn)=>fn(o.signal)},fetcher:async url=>{
  sessionCalls.push(url);assert.equal(url,'/api/client/session');
  return Response.json({signedIn:true,ownerId:owner,generation:7,capabilities:{view:true,edit:false,publish:false,confirmPayments:false},csrf:'CU-synthetic-session',idleExpiresAt:'2099-01-01T00:00:00Z',absoluteExpiresAt:'2099-01-02T00:00:00Z'});
 }});
 await runtime.restore();t.after(()=>runtime.dispose());
 const boundary=runtime.getSnapshot().boundary,calls=[],wire=[];
 const request={family:'commerce-v1',snapshot,override:null,async execute(command,options){
  // Finite HTTP serialization is observed at the actual future request boundary.
  const rawWire=JSON.stringify(command);wire.push(rawWire);const c=JSON.parse(rawWire);calls.push(c);
  let response=await request.override?.(c,options);
  if(response===undefined){
   const base={schemaVersion:1,clientId:owner,snapshot:request.snapshot};
   if(c.action==='read_commerce_v1')response=Response.json({...base,entries:[{entity,label:'Synthetic frozen entity',state:'payable',recordedAt:instant}],nextCursor:null});
   else if(c.action==='read_commerce_detail_v1')response=Response.json({...base,detail});
   else if(c.action==='read_quote_components_v1')response=Response.json({...base,quote:c.quote,component:c.component,total:c.component==='lines'?q.lines.length:q.options.length,entries:c.component==='lines'?q.lines:q.options,nextCursor:null});
   else if(c.action==='read_commerce_history_v1')response=Response.json({...base,entries:[],nextCursor:null});
   else response=Response.json({code:c.action==='request_status_v1'?'unavailable':'uncertain'},{status:503});
  }
  if(!response.ok)throw new CommerceError(response.status,true,options.kind==='write'&&response.status===503);
  return response.json();
 }};
 const port=createCommercePort(runtime,request);
 const create=(contextKey='cu-orders',boundPort=port)=>createOrdersController({port:boundPort,session:boundary,ownerId:owner,mode:'client',contextKey});
 const controller=create();t.after(()=>controller.dispose());await controller.refresh();await controller.open(entity);
 assert.equal(controller.getSnapshot().phase,'ready');assert.ok(controller.getSnapshot().selection);
 return {q,detail,entity,runtime,boundary,request,port,create,c:controller,calls,wire,sessionCalls};
}
/** Custody of an already DISPATCHED historical request. No new claim is enabled
 * against the old currency-less projection merely to prepare a test. */
export async function retainHistoricalClaim(f){
 const command=readCommerceCommand({schemaVersion:1,action:'submit_payment_claim_v1',requestId:id(900),expectedPaymentRevision:17,quote:f.q.header.target,payment:{currency:f.q.header.currency,quoteId:f.q.header.target.quoteId,quoteVersion:f.q.header.target.quoteVersion,shippingAddressVersion:2,serviceCents:0,productCents:1000,totalCents:1000,paymentOptionId:f.q.options[0].id},evidenceId:null});
 const pending={command,phase:'uncertain',status:'unchecked',dispatched:true,rawWire:JSON.stringify(command),commandHash:await hashCommerceCommand(command)};
 f.boundary.memory.set(intentKey,structuredClone(pending));return pending;
}
export async function receiptHash(command){return hashCommerceCommand(command);}
export async function retainHistoricalAcceptance(f){
 const command=readCommerceCommand({schemaVersion:1,action:'accept_product_quote_v1',requestId:id(901),quote:f.q.header.target});
 const pending={command,phase:'uncertain',status:'unchecked',dispatched:true,rawWire:JSON.stringify(command),commandHash:await hashCommerceCommand(command)};
 f.boundary.memory.set(intentKey,structuredClone(pending));return pending;
}
let ui;
export async function renderSource(state,controller,kind){
 if(!ui){
  const {build}=await import('esbuild'),{createRequire}=await import('node:module');
  const require=createRequire(import.meta.url),portal=new URL('../',import.meta.url).pathname;
  const result=await build({absWorkingDir:portal,tsconfig:'tsconfig.frontend.json',stdin:{contents:"export * from './src/features/orders/OrdersPage.tsx';",resolveDir:portal,loader:'tsx'},bundle:true,write:false,platform:'node',format:'cjs',external:['react','react-dom/server'],loader:{'.css':'empty'}});
  const module={exports:{}};new Function('require','module','exports',result.outputFiles[0].text)(require,module,module.exports);ui=module.exports;
 }
 const {createElement}=await import('react'),{renderToStaticMarkup}=await import('react-dom/server');
 return renderToStaticMarkup(createElement(kind?ui.OrderSheetContent:ui.OrdersView,{state,controller,kind}));
}
