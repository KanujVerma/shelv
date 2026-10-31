// Synthetic identity bridge only. Actual care/plan handler, parser, mapper and role-switched SQL.
import {spawnSync} from 'node:child_process';
import {handleCareRequest} from '../supabase/functions/concierge-care/handler.ts';
import {handlePlanRequest} from '../supabase/functions/concierge-plans/handler.ts';
let text='';for await(const c of process.stdin)text+=c;
const {actor,command,family='care'}=JSON.parse(text);
if(!/^10000000-0000-4000-8000-\d{12}$/.test(actor))throw Error('synthetic_actor_required');
const socket=process.env.SHELV_CARE_SOCKET;
if(!socket||!/^\/tmp\/sh-care-caf2b712-[a-f0-9]{8}$/.test(socket))throw Error('owned_socket_required');
const lit=v=>"'"+String(v).replaceAll("'","''")+"'";
const handler=family==='plan'?handlePlanRequest:handleCareRequest;
const result=await handler(new Request('https://edge.invalid',{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer synthetic',origin:'https://portal.goshelv.com'},body:JSON.stringify(command)}),{
 allowedOrigins:['https://portal.goshelv.com'],authenticate:async()=>({id:actor,is_anonymous:false}),rpc:async(_token,call)=>{
 const name=family==='plan'?'concierge_plan_command_v1':'concierge_care_command_v1';if(call.name!==name)throw Error('fixed_rpc_required');
 const env=Object.fromEntries(Object.entries(process.env).filter(([k])=>!k.startsWith('PG')));env.PGPASSFILE=socket+'/no-password';env.PGSERVICEFILE='/dev/null';
 const r=spawnSync('/opt/homebrew/opt/postgresql@15/bin/psql',['-X','-w','-h',socket,'-p','55461','-U','postgres','-d','shelv_care_caf2b712_synthetic','-At','-v','ON_ERROR_STOP=1'],{encoding:'utf8',env,input:'begin;set local role authenticated;set local request.jwt.claims='+lit(JSON.stringify({sub:actor,session_id:actor,is_anonymous:false}))+';select public.'+name+'('+lit(JSON.stringify(call.args.p_command))+'::jsonb);commit;'});
 if(r.status!==0)return {data:null,error:{message:/ERROR:\s+(concierge_[a-z_]+)/.exec(r.stderr)?.[1]??'unavailable'}};
 return {data:JSON.parse(r.stdout.split('\n').find(x=>x.startsWith('{'))),error:null};
 }});
process.stdout.write(JSON.stringify({status:result.status,body:await result.json()}));
