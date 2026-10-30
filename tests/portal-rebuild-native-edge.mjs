// Dedicated Unix-socket synthetic session bridge. No real Auth verification is claimed.
import {spawnSync} from 'node:child_process';
import {handlePlanRequest} from '../supabase/functions/concierge-plans/handler.ts';
let input='';for await(const chunk of process.stdin)input+=chunk;
const {actor,command}=JSON.parse(input);
if(!/^10000000-0000-4000-8000-\d{12}$/.test(actor))throw Error('synthetic_actor_required');
const lit=value=>"'"+String(value).replaceAll("'","''")+"'";
const response=await handlePlanRequest(new Request('https://edge.invalid',{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer synthetic',origin:'https://portal.goshelv.com'},body:JSON.stringify(command)}),{
 allowedOrigins:['https://portal.goshelv.com'],authenticate:async()=>({id:actor,is_anonymous:false}),
 rpc:async(_token,call)=>{
  if(call.name!=='concierge_plan_command_v1')throw Error('invalid_rpc');
  const env=Object.fromEntries(Object.entries(process.env).filter(([k])=>!k.startsWith('PG')));env.PGPASSFILE='/tmp/shelv-w1-plan-pg/no-password-file';env.PGSERVICEFILE='/dev/null';
  const result=spawnSync('psql',['-X','-w','-h','/tmp/shelv-w1-plan-pg/socket','-p','55439','-U','postgres','-d','shelv_w1_plan_v1_synthetic','-At','-v','ON_ERROR_STOP=1'],{encoding:'utf8',env,input:'begin;set local role authenticated;set local request.jwt.claims='+lit(JSON.stringify({sub:actor,session_id:actor,is_anonymous:false}))+';select public.concierge_plan_command_v1('+lit(JSON.stringify(call.args.p_command))+'::jsonb);commit;'});
  if(result.status!==0)return {data:null,error:{message:/ERROR:\s+(concierge_[a-z_]+)/.exec(result.stderr)?.[1]??'unavailable'}};
  return {data:JSON.parse(result.stdout.split('\n').find(line=>line.startsWith('{'))),error:null};
 },
});
process.stdout.write(JSON.stringify({status:response.status,body:await response.json()}));
