// Actual provider -> Edge handler -> retained authenticated runtime; synthetic finite fetch only.
import assert from 'node:assert/strict';
import test from 'node:test';
import {SupabaseProvider} from '../session-integration/runtime/server/upstream.ts';
import {parseCommand as opCommand,PORTAL_ORIGIN,SUPABASE_ORIGIN} from '../session-integration/runtime/server/policy.ts';
import {createReviewPorts} from '../../../supabase/functions/concierge-reviews/runtime.ts';
import {createGuidancePorts} from '../../../supabase/functions/concierge-guidance/runtime.ts';
import {handleReviewRequest} from '../../../supabase/functions/concierge-reviews/handler.ts';
import {handleGuidanceRequest} from '../../../supabase/functions/concierge-guidance/handler.ts';
const owner='11111111-1111-4111-8111-111111111111',id='22222222-2222-4222-8222-222222222222';
const credentials={access_token:'synthetic-review-access',refresh_token:'synthetic-review-refresh',expires_at:9999999999,user:{id:owner},providerSessionId:id};
const status={schemaVersion:1,action:'request_status_v1',requestId:id},all={view:true,edit:true,publish:true,confirmPayments:false};
const op=(family,command)=>opCommand(family,command);
test('actual provider -> reviewed handler/runtime uses fixed RPC with public apikey and original caller bearer',async()=>{
 for(const [family,create,handle,rpc] of [['reviews',createReviewPorts,handleReviewRequest,'concierge_review_command_v1'],['guidance',createGuidancePorts,handleGuidanceRequest,'concierge_guidance_command_v1']]){
  const seen=[],publicKey='sb_publishable_synthetic';
  const ports=create({supabaseUrl:SUPABASE_ORIGIN,publicKey,allowedOrigins:[PORTAL_ORIGIN],fetch:async(input,init)=>{
   const url=String(input);seen.push(url);assert.equal(new Headers(init?.headers).get('apikey'),publicKey);assert.equal(new Headers(init?.headers).get('authorization'),'Bearer '+credentials.access_token);
   if(url===SUPABASE_ORIGIN+'/auth/v1/user')return Response.json({id:owner,is_anonymous:false});
   assert.equal(url,SUPABASE_ORIGIN+'/rest/v1/rpc/'+rpc);assert.deepEqual(JSON.parse(String(init?.body)),{p_command:status});return Response.json({status:'absent'});
  }});
  const provider=new SupabaseProvider(publicKey,async(input,init)=>{assert.equal(String(input),SUPABASE_ORIGIN+'/functions/v1/concierge-'+family);return handle(new Request(String(input),init),ports);});
  assert.deepEqual(await provider.perform(credentials,all,op(family,status)),{status:200,body:{status:'absent'}});
  assert.deepEqual(seen,[SUPABASE_ORIGIN+'/auth/v1/user',SUPABASE_ORIGIN+'/rest/v1/rpc/'+rpc]);
 }
});
