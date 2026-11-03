import test from 'node:test';import assert from 'node:assert/strict';
import {createCommercePorts} from '../../../supabase/functions/concierge-commerce/runtime.ts';
globalThis.fetch=async()=>{throw Error('W7 global network forbidden');};
test('W7 abort retires a stalled Commerce response body before its producer releases',{timeout:2000},async()=>{
 let source,enter;const entered=new Promise(r=>{enter=r;}),abort=new AbortController();
 const runtime=createCommercePorts({supabaseUrl:'https://synthetic.supabase.co',publicKey:'synthetic',allowedOrigins:['https://portal.example.invalid'],fetch:async()=>new Response(new ReadableStream({start(c){source=c;},pull(){enter();}},{highWaterMark:0}))});
 const pending=runtime.rpc('synthetic',{name:'concierge_commerce_command_v1',args:{p_command:{schemaVersion:1,action:'request_status_v1',requestId:'10000000-0000-4000-8000-000000000001'}}},abort.signal).then(()=> 'fulfilled',()=> 'rejected');
 await entered;abort.abort();let timer;
 try{const early=await Promise.race([pending,new Promise(r=>{timer=setTimeout(()=>r('waiting'),100);})]);assert.equal(early,'rejected','aborted body must settle without waiting for remote producer');}
 finally{clearTimeout(timer);try{source.enqueue(new TextEncoder().encode('{"status":"absent"}'));source.close();}catch{}console.log(JSON.stringify({afterAbortAndRelease:await pending}));}
});
