// SYNTHETIC finite HTTP only. All session, cookie, factory and Root code is real.
import assert from 'node:assert/strict';
import {createApplicationSession} from '../src/app/session.ts';
import {createClientReviewRequest} from '../src/app/review-request.ts';
import {createAdvisorReviewRequest,createAdvisorGuidanceRequest} from '../src/app/advisor-review-request.ts';
import {createClientPorts} from '../src/app/ports.ts';
import {readReviewCommand,readGuidanceCommand} from '../../../src/contracts/PortalReviewValidation.ts';
import {mapReviewResult,mapGuidanceResult} from '../../../src/contracts/PortalReviewMapping.ts';

export const owner='11111111-1111-4111-8111-111111111111';
export const requestId='33333333-3333-4333-8333-333333333333';
export const read={schemaVersion:1,action:'read_client_plan_v3',version:null};
export const preparation={schemaVersion:3,access:'preparation',plan:null,decisionRevision:0,decisions:[],actualUse:[],nextReviewOn:null,use:{revision:0,planProducts:[],reportedProducts:{items:[],nextCursor:null}},latestPublicReview:null,currentGuidance:null,decisionGuidance:[]};
export const stop={schemaVersion:1,action:'report_product_use_v1',requestId,expectedUseRevision:0,product:{kind:'plan_product',publication:{version:1,documentSchemaVersion:3},productId:'cleanser',slotId:null},change:{kind:'stopped',details:null},sourcePublication:null,occurredOn:{state:'unknown'},channel:'portal',acquisition:'already_owned',identityEventId:null};
export const stopReceipt={requestId,event:{kind:'use',id:requestId},revision:1,recordedAt:'2026-10-31T00:00:00Z',notificationEventId:null};
export const families=['client/reviews','advisor/reviews','advisor/guidance'];
export const statusCommand={schemaVersion:1,action:'request_status_v1',requestId};
export const abortError=()=>new DOMException('The operation was aborted.','AbortError');
export function deferred(){let resolve;const promise=new Promise(r=>resolve=r);return{promise,resolve};}

export async function fixture(t,{audience='client',timeoutMs=15000}={}){
 let login={signedIn:true,ownerId:owner,generation:1,csrf:'synthetic-cancellation-csrf',capabilities:{view:true,edit:audience==='advisor',publish:audience==='advisor',confirmPayments:false},idleExpiresAt:'2099-01-01T00:00:00Z',absoluteExpiresAt:'2099-01-02T00:00:00Z'};
 const calls=[],queue=[];
 const runtime=createApplicationSession({audience,timeoutMs,locks:{request:async(_n,_o,run)=>run()},fetcher:async(url,init)=>{
  assert.ok(['session','logout','reviews','guidance','care','checkins','payments','checkins/photos/upload'].some(p=>url===`/api/${audience}/${p}`),'unexpected HTTP '+url);
  assert.equal(init.credentials,'same-origin');assert.equal(init.cache,'no-store');assert.equal(init.redirect,'error');
  const headers=new Headers(init.headers);assert.equal(headers.has('authorization'),false);assert.equal(headers.has('apikey'),false);
  if(url.endsWith('/session'))return Response.json(login);
  if(url.endsWith('/logout'))return Response.json({signedOut:true});
  assert.equal(headers.get('x-shelv-csrf'),login.csrf);
  calls.push({url,init});const reply=queue.shift();assert.ok(reply,'unplanned HTTP '+url);return reply(url,init);
 }});
 t.after(()=>runtime.dispose());await runtime.restore();
 return{runtime,calls,queue,setLogin(value){login={...login,...value};},reply(value,status=200){queue.push(()=>Response.json(value,{status}));}};
}
export function rawRequest(f,family='client/reviews'){
 return family==='client/reviews'?createClientReviewRequest(f.runtime):family==='advisor/reviews'?createAdvisorReviewRequest(f.runtime):createAdvisorGuidanceRequest(f.runtime);
}
export function positiveRoot(value,command,family='client/reviews'){
 return family==='advisor/guidance'?mapGuidanceResult(value,readGuidanceCommand(command)):mapReviewResult(value,readReviewCommand(command));
}
export async function followingReviewAndStop(f){
 f.reply(preparation);assert.deepEqual(positiveRoot(await rawRequest(f).execute(read),read),preparation);
 f.reply(stopReceipt);assert.deepEqual(await createClientPorts(f.runtime,{care:true}).care.execute(stop),stopReceipt);
}
// highWaterMark0 makes entered mean JSON consumption has drained the prefix
// and is asking for more bytes, rather than only observing response headers.
export function bodyRead({errorOnAbort=true,status=200}={}){
 const entered=deferred();let controller;
 return{entered:entered.promise,response(init){return new Response(new ReadableStream({
  start(c){controller=c;c.enqueue(new TextEncoder().encode('{"status":'));if(errorOnAbort)init.signal.addEventListener('abort',()=>c.error(abortError()),{once:true});},
  pull(){entered.resolve();},
 },{highWaterMark:0}),{status,headers:{'Content-Type':'application/json'}});},finish(){controller.enqueue(new TextEncoder().encode('"absent"}'));controller.close();}};
}
