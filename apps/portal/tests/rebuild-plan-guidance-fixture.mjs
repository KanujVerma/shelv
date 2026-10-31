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
