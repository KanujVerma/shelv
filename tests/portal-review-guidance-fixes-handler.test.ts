import assert from 'node:assert/strict';
import {test} from 'node:test';
import {handleCheckinsRequest} from '../supabase/functions/concierge-checkins/handler.ts';
const id='10000000-0000-4000-8000-000000000004';
test('actual legacy Checkins maps current SQL session expiry to401 without retry or version disclosure',async()=>{
 const request=new Request('https://edge.invalid',{method:'POST',headers:{authorization:'Bearer synthetic','content-type':'application/json'},body:JSON.stringify({action:'client_read'})});
 const storage={origin:'https://synthetic.invalid',upload:async()=>{throw Error('storage_denied');},read:async()=>{throw Error('storage_denied');},sign:async()=>{throw Error('storage_denied');}};
 const response=await handleCheckinsRequest(request,{allowedOrigins:[],storage,authenticate:async()=>({id,is_anonymous:false}),rpc:async(_token,call)=>{assert.equal(call.name,'concierge_checkin_read');return {data:null,error:{status:400,message:'concierge_session_ended'}};}});
 assert.equal(response.status,401);assert.deepEqual(await response.json(),{code:'session_ended',retryable:false});
});
