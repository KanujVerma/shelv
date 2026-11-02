import test from 'node:test';import assert from 'node:assert/strict';import {build} from '../apps/portal/node_modules/esbuild/lib/main.js';
globalThis.fetch=async()=>{throw Error('global_network_denied');};
const bundle=await build({stdin:{contents:"export {default as gateway} from './apps/portal/session-integration/runtime/server/gateway.ts';",resolveDir:process.cwd(),loader:'ts'},bundle:true,platform:'node',format:'cjs',write:false});const module={exports:{}};new Function('module','exports',bundle.outputFiles[0].text)(module,module.exports);const {gateway}=module.exports;
for(const mode of ['resolved','pending','rejected','throwing'])test(`actual notification gateway oversized body / ${mode} underlying cancel`,async()=>{
 let cancelled=0,release,timer,dispatch=0;const held=new Promise(r=>release=r);const body=new ReadableStream({start(c){c.enqueue(new Uint8Array(8193).fill(32));},cancel(){cancelled++;if(mode==='pending')return held;if(mode==='rejected')return Promise.reject(Error('synthetic_cancel_rejected'));if(mode==='throwing')throw Error('synthetic_cancel_threw');}});
 const request=new Request('https://portal.goshelv.com/api/client/notifications',{method:'POST',duplex:'half',body,headers:{Origin:'https://portal.goshelv.com','Sec-Fetch-Site':'same-origin','Content-Type':'application/json','X-Shelv-CSRF':'synthetic-gateway','Cookie':'__Host-shelv_client='+'a'.repeat(43)}});
 const pending=gateway.fetch(request,{PORTAL_ORIGIN:'https://portal.goshelv.com',CLIENT_SHARED_SESSIONS:'true',ASSETS:{fetch(){throw Error('asset_unexpected');}},ADVISOR_SESSIONS:{getByName(){dispatch++;throw Error('vault_must_not_be_reached');}}}).then(async response=>({status:response.status,body:await response.json()}));
 try{const observed=await Promise.race([pending,new Promise(r=>timer=setTimeout(()=>r({status:'pending'}),100))]);console.log(JSON.stringify({mode,observed,cancelled,dispatch}));assert.equal(cancelled,1);assert.equal(dispatch,0);assert.deepEqual(observed,{status:413,body:{code:'too_large'}});}
 finally{clearTimeout(timer);release();await pending;}
});
async function boundaryRequest(bytes,{closed=true,rejectCancel=false}={}){
 let dispatch=0,cancelled=0;
 const body=new ReadableStream({start(controller){controller.enqueue(bytes.subarray(0,8191));if(bytes.byteLength>8191)controller.enqueue(bytes.subarray(8191));if(closed)controller.close();},cancel(){cancelled++;if(rejectCancel)return Promise.reject(Error('synthetic_cancel_rejected'));}});
 const request=new Request('https://portal.goshelv.com/api/client/notifications',{method:'POST',duplex:'half',body,headers:{Origin:'https://portal.goshelv.com','Sec-Fetch-Site':'same-origin','Content-Type':'application/json','X-Shelv-CSRF':'synthetic-gateway','Cookie':'__Host-shelv_client='+'a'.repeat(43)}});
 const response=await gateway.fetch(request,{PORTAL_ORIGIN:'https://portal.goshelv.com',CLIENT_SHARED_SESSIONS:'true',ASSETS:{fetch(){throw Error('asset_unexpected');}},ADVISOR_SESSIONS:{getByName(){dispatch++;throw Error('negative_vault_dispatch');}}});
 return {status:response.status,body:await response.json(),dispatch,cancelled};
}
test('exact8192 notification command reaches only the negative Vault dispatch control',async()=>{
 const text=JSON.stringify({schemaVersion:1,action:'list_inbox_v1',cursor:null,limit:1}),bytes=new TextEncoder().encode(text+' '.repeat(8192-text.length));assert.equal(bytes.byteLength,8192);
 const observed=await boundaryRequest(bytes);assert.equal(observed.dispatch,1);assert.equal(observed.status,503);assert.equal(observed.cancelled,0);
});
test('exact8192 UTF8 bytes pass the reader and are rejected only as a non-command',async()=>{
 const bytes=new TextEncoder().encode('"'+'é'.repeat(4095)+'"');assert.equal(bytes.byteLength,8192);
 const observed=await boundaryRequest(bytes);assert.equal(observed.status,400);assert.equal(observed.dispatch,0);assert.equal(observed.cancelled,0);
});
test('UTF8 byte8193 refuses413 despite rejected cancellation before Vault or JSON interpretation',async()=>{
 const bytes=new TextEncoder().encode('"'+'é'.repeat(4095)+'" ');assert.equal(bytes.byteLength,8193);
 const observed=await boundaryRequest(bytes,{closed:false,rejectCancel:true});assert.deepEqual(observed,{status:413,body:{code:'too_large'},dispatch:0,cancelled:1});
});
