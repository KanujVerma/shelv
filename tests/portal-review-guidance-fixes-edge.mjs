// M60 test-only bridge; actual handlers and own fixed SQL, synthetic identity.
// Extends only the test allowlist for the existing legacy preview reader.
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {handleReviewRequest} from '../supabase/functions/concierge-reviews/handler.ts';
import {handleGuidanceRequest} from '../supabase/functions/concierge-guidance/handler.ts';
import {handlePlanRequest} from '../supabase/functions/concierge-plans/handler.ts';
import {handleCareRequest} from '../supabase/functions/concierge-care/handler.ts';
import {handleCheckinsRequest} from '../supabase/functions/concierge-checkins/handler.ts';
import {handleConciergeRequest} from '../supabase/functions/concierge-operations/handler.ts';
const root=fileURLToPath(new URL('../',import.meta.url)).replace(/\/$/,'');
const owner=JSON.parse(readFileSync(new URL('../.local-artifacts/portal-rebuild/w1-review/CURRENT.json',import.meta.url),'utf8'));
if(owner.root!==root||owner.database!=='shelv_review_7a7cac7e_synthetic'||owner.port!=='55487'||owner.marker!=='W1 review 7a7cac7e synthetic Unix-only 20261031'||!/^\/tmp\/sh-rv7a-[a-f0-9]{8}$/.test(owner.socket)||!resolve(owner.data).startsWith(root+'/.local-artifacts/portal-rebuild/w1-review/fixture/'))throw Error('owned_fixture_required');
if(Number(readFileSync(owner.data+'/postmaster.pid','utf8').split('\n')[0])!==owner.pid)throw Error('owned_pid_required');
let input='';for await(const part of process.stdin)input+=part;const {actor,command,family='review'}=JSON.parse(input);
if(!/^10000000-0000-4000-8000-\d{12}$/.test(actor))throw Error('synthetic_actor_required');
const families={review:[handleReviewRequest,['concierge_review_command_v1']],guidance:[handleGuidanceRequest,['concierge_guidance_command_v1']],plan:[handlePlanRequest,['concierge_plan_command_v1']],care:[handleCareRequest,['concierge_care_command_v1']],checkins:[handleCheckinsRequest,['concierge_checkin_read','concierge_checkin_advisor_read','concierge_checkin_write','concierge_checkin_photo_authorize']],operations:[handleConciergeRequest,['concierge_service_client_view','concierge_service_advisor_view','concierge_service_write','concierge_write','concierge_client_view','concierge_client_view_v2','concierge_advisor_view','concierge_advisor_view_v2','concierge_advisor_preview_v2']]};
if(!Object.hasOwn(families,family))throw Error('fixed_family_required');const [handler,names]=families[family];
const lit=v=>"'"+String(v).replaceAll("'","''")+"'";
const env=Object.fromEntries(Object.entries(process.env).filter(([k])=>!k.startsWith('PG')));env.PGPASSFILE=owner.socket+'/no-password';env.PGSERVICEFILE='/dev/null';env.PGAPPNAME='shelv-review-7a7cac7e-edge';
const args=['-X','-w','-h',owner.socket,'-p',owner.port,'-U','postgres','-d',owner.database,'-At','-v','ON_ERROR_STOP=1'];
const probe=spawnSync('/opt/homebrew/opt/postgresql@15/bin/psql',args,{env,encoding:'utf8',input:"select current_setting('data_directory')||'|'||shobj_description(oid,'pg_database') from pg_database where datname=current_database();"});
if(probe.status!==0||probe.stdout.trim()!==owner.data+'|'+owner.marker)throw Error('owned_database_required');
const storage={origin:'https://synthetic.invalid',upload:async()=>{throw Error('storage_not_authorized');},read:async()=>{throw Error('storage_not_authorized');},sign:async()=>{throw Error('storage_not_authorized');}};
globalThis.fetch=async()=>{throw Error('external_network_forbidden');};
const response=await handler(new Request('https://edge.invalid',{method:'POST',headers:{authorization:'Bearer synthetic','content-type':'application/json',origin:'https://portal.goshelv.com'},body:JSON.stringify(command)}),{storage,allowedOrigins:['https://portal.goshelv.com'],authenticate:async()=>({id:actor,is_anonymous:false}),rpc:async(_token,call)=>{
 if(!names.includes(call.name))throw Error('fixed_rpc_required');
 const parameters=Object.entries(call.args).map(([key,value])=>{if(!/^p_[a-z_]+$/.test(key))throw Error('fixed_argument_required');const literal=value===null?'null':typeof value==='object'?lit(JSON.stringify(value))+'::jsonb':typeof value==='number'?String(value):typeof value==='boolean'?(value?'true':'false'):lit(value);return key+'=>'+literal;}).join(',');
 const r=spawnSync('/opt/homebrew/opt/postgresql@15/bin/psql',args,{env,encoding:'utf8',maxBuffer:6000000,input:'begin;set local role authenticated;set local request.jwt.claims='+lit(JSON.stringify({sub:actor,session_id:actor,is_anonymous:false}))+';select public.'+call.name+'('+parameters+');commit;'});
 if(r.status!==0)return {data:null,error:{message:/ERROR:\s+(concierge_[a-z_]+)/.exec(r.stderr??'')?.[1]??'unavailable'}};
 return {data:JSON.parse(r.stdout.split('\n').find(line=>line.startsWith('{'))),error:null};
}});
process.stdout.write(JSON.stringify({status:response.status,body:await response.json()}));
