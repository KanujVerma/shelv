import {carePlan,uid,owner} from './rebuild/care-fixture.mjs';
import {mapReviewResult} from '../../../src/contracts/PortalReviewMapping.ts';
import {createApplicationSession} from '../src/app/session.ts';
export {uid,owner};
export const v3read={schemaVersion:1,action:'read_client_plan_v3',version:null};
export function guidancePlan(){const v=carePlan();return mapReviewResult({...v,schemaVersion:3,currentGuidance:{schemaVersion:1,mode:'current_document',instructionSemantics:'current_for_selected_publication',snapshot:{publication:{version:1,documentSchemaVersion:3},currentPublication:{version:1,documentSchemaVersion:3},useHead:0,reportHead:0,instructionHead:0,serviceRevision:0,decisionRevision:0,asOfDay:'2026-10-31',manifestHash:'a'.repeat(64)},instructionCount:0},decisionGuidance:[]},v3read);}
export async function finiteSession(t,{audience='client',respond=()=>Response.json(guidancePlan())}={}){
 let login={signedIn:true,ownerId:owner,generation:1,csrf:'guidance-csrf',capabilities:{view:true,edit:true,publish:true,confirmPayments:true},idleExpiresAt:new Date(Date.now()+3600000).toISOString(),absoluteExpiresAt:new Date(Date.now()+7200000).toISOString()};
 const calls=[];const runtime=createApplicationSession({audience,locks:{request:async(_n,_o,run)=>run()},fetcher:async(url,init)=>{
 if(url===`/api/${audience}/session`)return Response.json(login);
 if(url===`/api/${audience}/logout`)return Response.json({signedOut:true});
 assertEndpoint(url,audience);if(new Headers(init.headers).get('x-shelv-csrf')!==login.csrf)throw Error('missing actual csrf');
 const command=JSON.parse(init.body);calls.push({url,command,wire:init.body,signal:init.signal});return await respond(command,calls.length,url);
 }});await runtime.restore();t.after(()=>runtime.dispose());return {runtime,calls,login:patch=>{login={...login,...patch};}};
}
function assertEndpoint(url,audience){if(![`/api/${audience}/reviews`,`/api/${audience}/plans`,`/api/${audience}/care`].includes(url))throw Error('unexpected finite endpoint '+url);}
export function instruction(v,slotId,productId,n=1){const snapshot=v.currentGuidance.snapshot;const scope={publication:snapshot.publication,slotId,productId},use=v.use.planProducts.find(p=>p.product.productId===productId);const item={instructionId:uid(n),version:1,format:'authored_schedule',scope,contentHash:String(n%10).repeat(64),effectiveOn:'2026-10-30',baseInstructionId:null,baseInstructionVersion:0,reviewedUseBasis:productId===null?null:{useRevision:snapshot.useHead,latestEventId:use?.latestEvent?.eventId??null,amendmentHeadId:use?.latestEvent?.amendment?.id??null},basisStatus:'current',originalStart:productId===null?null:{state:'unknown'}};
 return {schemaVersion:1,audience:'client',snapshot,item,content:{format:'authored_schedule',body:{kind:'instruction',publication:snapshot.publication,slotId,productId,baseInstructionId:null,baseInstructionVersion:0,useBasis:item.reviewedUseBasis,directions:['CURRENT_DIRECTIONS_'+n],cautions:['CURRENT_CAUTION_'+n],schedule:{...v.plan.content.routine[0].schedule,periods:['morning'],condition:'AUTHORED_CONDITION',stages:[]},reason:'CURRENT_REASON_'+n,effectiveOn:item.effectiveOn,reviewId:null}},publishedBy:uid(100),publishedAt:'2026-10-30T15:00:00Z'};
}
export function manifestPage(v,items,cursor=null,nextCursor=null){return{schemaVersion:1,audience:'client',snapshot:v.currentGuidance.snapshot,total:v.currentGuidance.instructionCount,cursor,items,nextCursor};}
export const cursor=n=>'r:'+String(n%10).repeat(64)+':'+uid(n);
export function memorySession(){const memory=new Map(),listeners=new Set();let live=true;return{key:'synthetic-guidance-owner',isCurrent:()=>live,subscribeInvalidation(fn){listeners.add(fn);return()=>listeners.delete(fn);},memory:{get:k=>memory.get(k),set:(k,v)=>memory.set(k,v),delete:k=>memory.delete(k)},end(){live=false;memory.clear();listeners.forEach(fn=>fn());}};}
export function deferred(){let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return{promise,resolve,reject};}
