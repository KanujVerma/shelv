// Opt-in actual local Auth/PostgREST/SQL acceptance. Never reads hosted inputs.
import {createRequire} from 'node:module';
import {readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {randomUUID,randomBytes} from 'node:crypto';
import assert from 'node:assert/strict';
import {handleAdmissionRequest} from '../supabase/functions/concierge-admission/handler.ts';
import {createAdmissionPorts} from '../supabase/functions/concierge-admission/runtime.ts';
const configPath=process.env.SHELV_ADMISSION_LOCAL_CONFIG;
assert.ok(configPath,'Set SHELV_ADMISSION_LOCAL_CONFIG to local Supabase status JSON; hosted inputs are forbidden');
const config=JSON.parse(await readFile(configPath,'utf8'));
const localUrl=value=>{const url=new URL(value);assert.ok(url.protocol==='http:'&&['127.0.0.1','localhost','[::1]'].includes(url.hostname),'Only loopback fixture endpoints are allowed');return url;};
localUrl(config.API_URL);
const require=createRequire(new URL('../apps/portal/package.json',import.meta.url));
const {GoTrueClient}=require('@supabase/auth-js');
const container=process.env.SHELV_ADMISSION_DB_CONTAINER;assert.ok(/^supabase_db_[a-zA-Z0-9_-]+$/.test(container??''),'Set the exact task-owned Supabase DB container');
const docker=['exec','-i',container,'psql','-U','postgres','-d','postgres','-X','-At','-v','ON_ERROR_STOP=1'];
const sql=text=>execFileSync('docker',docker,{input:text,encoding:'utf8',stdio:['pipe','pipe','pipe']}).trim();
const result={at:new Date().toISOString(),kind:'local-native-auth-postgrest-sql',checks:[],hostedRequests:0,realEmails:0};
const pass=label=>result.checks.push({label,status:'PASS'});
const client=(key)=>new GoTrueClient({url:config.API_URL+'/auth/v1',headers:{apikey:key,Authorization:'Bearer '+key},persistSession:false,autoRefreshToken:false,detectSessionInUrl:false,skipAutoInitialize:true,debug:false});
const admin=client(config.SERVICE_ROLE_KEY),sessions=[];
try{
 assert.equal(sql("select marker from public.shelv_admission_fixture_marker"),'shelv-admission-20261024');
 assert.equal(sql("select to_regprocedure('public.concierge_admission_begin(uuid,text,text)') is not null"),'t','Admission SQL API is installed in the marked local fixture');
 assert.equal(sql("select has_function_privilege('authenticated','public.concierge_admission_begin(uuid,text,text)','EXECUTE')"),'t');
 const createActor=async admit=>{const email='founder-'+randomUUID()+'@example.invalid',password=randomBytes(32).toString('hex');const created=await admin.admin.createUser({email,password,email_confirm:true});assert.equal(created.error,null);const id=created.data.user.id;sql(`insert into concierge.advisors(user_id,active,can_view,can_edit,can_publish,can_confirm_payments,can_admit_clients) values('${id}',true,true,true,true,true,${admit})`);const auth=client(config.ANON_KEY),signed=await auth.signInWithPassword({email,password});assert.equal(signed.error,null);sessions.push(signed.data.session.access_token);return{id,token:signed.data.session.access_token};};
 const founder=await createActor(true),viewer=await createActor(false);
 const fetchLocal=async(input,init)=>{const original=new URL(String(input));assert.equal(original.origin,'https://native-auth.invalid');return fetch(config.API_URL+original.pathname+original.search,init);};
 const ports=createAdmissionPorts({supabaseUrl:'https://native-auth.invalid',publicKey:config.ANON_KEY,serviceKey:config.SERVICE_ROLE_KEY,allowedOrigins:['https://portal.goshelv.com'],fetch:fetchLocal});
 const send=async(actor,body)=>{const r=await handleAdmissionRequest(new Request('https://edge.invalid',{method:'POST',headers:{authorization:'Bearer '+actor.token,origin:'https://portal.goshelv.com','content-type':'application/json'},body:JSON.stringify(body)}),ports);return{status:r.status,body:await r.json()};};
 const inbox=localUrl(config.MAILPIT_URL??config.INBUCKET_URL),callback=localUrl(process.env.SHELV_ADMISSION_CALLBACK_URL??'http://127.0.0.1:3000/');
 const mailList=async()=>{const response=await fetch(new URL('/api/v1/messages',inbox));assert.equal(response.status,200);return response.json();};
 const initialMail=await mailList();
 const email='client-'+randomUUID()+'@example.invalid',intent={action:'add_client',requestId:randomUUID(),email,displayName:'Synthetic Native Client'};
 let reply=await send(viewer,intent);assert.equal(reply.status,403);assert.equal(sql(`select count(*) from auth.users where email='${email}'`),'0');pass('Edit/publish/payment capability does not authorize client admission or identity creation');
 reply=await send(founder,intent);assert.equal(reply.status,200,JSON.stringify(reply.body));const target=reply.body.clientId;assert.equal(reply.body.emailSent,false);assert.equal(reply.body.status,'admitted');assert.equal(sql(`select (email_confirmed_at is null)::text from auth.users where id='${target}'`),'true');assert.equal(sql(`select status||':'||phase from concierge.enrollments where client_id='${target}'`),'active:premeeting');assert.equal(sql(`select revision||':'||published_version from concierge.cases where client_id='${target}'`),'0:0');pass('Actual handler creates stable unconfirmed Auth identity and atomically admits empty premeeting case');
 assert.equal((await mailList()).total,initialMail.total);pass('Admission creation sends no email');
 const beforeMail=await mailList();
 const ownStorage=new Map(),own=new GoTrueClient({url:config.API_URL+'/auth/v1',headers:{apikey:config.ANON_KEY},flowType:'pkce',storageKey:'shelv-local-admission',storage:{getItem:k=>ownStorage.get(k)??null,setItem:(k,v)=>ownStorage.set(k,v),removeItem:k=>ownStorage.delete(k)},persistSession:true,autoRefreshToken:false,detectSessionInUrl:false,skipAutoInitialize:true,debug:false});
 const otp=await own.signInWithOtp({email,options:{shouldCreateUser:false,emailRedirectTo:callback.href}});assert.equal(otp.error,null);
 let mail;for(let i=0;i<30;i++){mail=await mailList();if(mail.total>beforeMail.total)break;await new Promise(r=>setTimeout(r,100));}assert.equal(mail.total,beforeMail.total+1);
 const message=await(await fetch(new URL('/api/v1/message/'+mail.messages[0].ID,inbox))).json(),content=message.HTML??message.Text;
 const links=[...content.matchAll(/https?:[^\s"<>]+/g)].map(m=>m[0].replaceAll('&amp;','&')).filter(value=>{try{const url=new URL(value);return url.origin===new URL(config.API_URL).origin&&url.pathname==='/auth/v1/verify';}catch{return false;}});assert.ok(links.length);
 const verify=await fetch(links[0],{redirect:'manual'});assert.ok([302,303].includes(verify.status));const returned=new URL(verify.headers.get('location'));assert.equal(returned.origin,callback.origin);const code=returned.searchParams.get('code');assert.ok(code);
 const foreign=client(config.ANON_KEY);assert.ok((await foreign.exchangeCodeForSession(code)).error);const signed=await own.exchangeCodeForSession(code);assert.equal(signed.error,null);assert.equal(signed.data.user.id,target);assert.ok(signed.data.user.email_confirmed_at);sessions.push(signed.data.session.access_token);pass('Precreated unconfirmed client completes existing-only PKCE from its own flow; foreign flow denied; one local captured email');
 const recoveredEmail='recover-'+randomUUID()+'@example.invalid',recoveredIntent={...intent,requestId:randomUUID(),email:recoveredEmail};
 let lost=false;const lostPorts={...ports,createIdentity:async(...args)=>{const identity=await ports.createIdentity(...args);if(!lost){lost=true;throw Error('unavailable');}return identity;}};
 const recoverRequest=()=>new Request('https://edge.invalid',{method:'POST',headers:{authorization:'Bearer '+founder.token,origin:'https://portal.goshelv.com','content-type':'application/json'},body:JSON.stringify(recoveredIntent)});
 assert.equal((await handleAdmissionRequest(recoverRequest(),lostPorts)).status,503);const recovered=await handleAdmissionRequest(recoverRequest(),lostPorts);assert.equal(recovered.status,200);assert.equal(sql(`select count(*) from auth.users where email='${recoveredEmail}'`),'1');pass('Lost real Auth-create reply resumes reserved UUID without a second identity');
 const concurrentEmail='parallel-'+randomUUID()+'@example.invalid',parallel=[0,1].map(()=>({...intent,email:concurrentEmail,requestId:randomUUID()}));
 const outcomes=await Promise.all(parallel.map(command=>send(founder,command)));assert.ok(outcomes.some(item=>item.status===200));assert.ok(outcomes.every(item=>[200,409,503].includes(item.status)),JSON.stringify(outcomes.map(item=>({status:item.status,code:item.body.code}))));
 const settled=await Promise.all(parallel.map(command=>send(founder,command)));assert.ok(settled.every(item=>item.status===200));assert.equal(settled[0].body.clientId,settled[1].body.clientId);assert.equal(sql(`select count(*) from auth.users where email='${concurrentEmail}'`),'1');pass('Concurrent founder intents converge on one Auth owner and one client without resets');
 const fencedEmail='fenced-'+randomUUID()+'@example.invalid',fencedIntent={...intent,email:fencedEmail,requestId:randomUUID()};
 const fencedPorts={...ports,createIdentity:async(...args)=>{const identity=await ports.createIdentity(...args);sql(`update concierge.advisors set can_admit_clients=false where user_id='${founder.id}'`);return identity;}};
 const fencedRequest=new Request('https://edge.invalid',{method:'POST',headers:{authorization:'Bearer '+founder.token,origin:'https://portal.goshelv.com','content-type':'application/json'},body:JSON.stringify(fencedIntent)});
 assert.equal((await handleAdmissionRequest(fencedRequest,fencedPorts)).status,403);assert.equal(sql(`select count(*) from concierge.enrollments e join auth.users u on u.id=e.client_id where u.email='${fencedEmail}'`),'0');sql(`update concierge.advisors set can_admit_clients=true where user_id='${founder.id}'`);assert.equal((await send(founder,fencedIntent)).status,200);pass('Revocation after Auth creation prevents enrollment; explicit restored authority resumes the same partial intent');
 const replay=await send(founder,intent);assert.deepEqual(replay,reply);pass('Exact replay returns identical receipt without duplicate Auth or case');
 const changed=await send(founder,{...intent,displayName:'Changed'});assert.equal(changed.status,409);pass('Changed-payload retry is rejected');
 const duplicate=await send(founder,{...intent,requestId:randomUUID(),displayName:'Do not rename'});assert.equal(duplicate.status,200);assert.equal(duplicate.body.status,'already_admitted');assert.equal(duplicate.body.clientId,target);assert.equal(duplicate.body.displayName,'Synthetic Native Client');pass('Separate duplicate intent opens existing client without renaming or resetting');
 sql(`update concierge.advisors set can_admit_clients=false where user_id='${founder.id}'`);assert.equal((await send(founder,intent)).status,403);sql(`update concierge.advisors set can_admit_clients=true where user_id='${founder.id}'`);pass('Capability revocation blocks completed-request replay');
 sql(`update concierge.enrollments set status='revoked' where client_id='${target}'`);assert.equal((await send(founder,{...intent,requestId:randomUUID()})).status,409);assert.equal(sql(`select status from concierge.enrollments where client_id='${target}'`),'revoked');pass('Revoked enrollment is never silently reactivated');
 assert.equal(sql("select has_function_privilege('anon','public.concierge_admission_begin(uuid,text,text)','EXECUTE')"),'f');assert.equal(sql("select has_function_privilege('authenticated','public.concierge_admission_finish(uuid,uuid)','EXECUTE')"),'f');assert.equal(sql("select has_function_privilege('service_role','public.concierge_admission_begin(uuid,text,text)','EXECUTE')"),'f');assert.equal(sql("select has_table_privilege('authenticated','concierge.admission_intents','SELECT')"),'f');pass('Raw journal and administrative finalizer are inaccessible to ordinary callers');
 if(process.env.SHELV_ADMISSION_NATIVE_BROWSER==='1'){
  const {runNativeAdmissionBrowser}=await import('../apps/portal/tests/native-admission-browser.mjs');const browserEmail='browser-'+randomUUID()+'@example.invalid';let browserTarget=null;
  await runNativeAdmissionBrowser({email:browserEmail,artifacts:process.env.SHELV_ADMISSION_UI_ARTIFACTS,
   admission:async command=>{const response=await send(founder,command);assert.equal(response.status,200);if(command.action==='add_client')browserTarget=response.body.clientId;return response.body;},
   directory:async()=>({capabilities:{view:true,edit:true,publish:true,confirmPayments:true},clients:browserTarget?[{clientId:browserTarget,displayName:'Synthetic Native Browser Client',enrollmentStatus:'active',revision:0,publishedVersion:0,hasDraft:false}]:[]}),
   readCase:async id=>{assert.equal(id,browserTarget);assert.equal(sql(`select revision||':'||published_version from concierge.cases where client_id='${id}'`),'0:0');return{client:{revision:0,plan:null,history:[],orderProposal:{kind:'proposal',currency:'USD',items:[],subtotalCents:0,payable:false,shippingAndTaxConfirmed:false},routine:[],routineHistory:[]},intake:null,draft:null,meetingNotes:[]};}});
  assert.equal(sql(`select count(*) from concierge.enrollments where client_id='${browserTarget}' and status='active' and phase='premeeting'`),'1');pass('Native Chrome founder UI invokes actual Auth/HTTP handler/SQL admission and opens persisted empty consultation');
 }
 result.status='PASS';
}catch(error){result.status='FAIL';result.failure=error instanceof assert.AssertionError?error.message:'native_fixture_error';}
finally{
 try{
  const ids=sessions.map(token=>JSON.parse(Buffer.from(token.split('.')[1],'base64url').toString('utf8')).session_id);for(const id of ids)assert.ok(/^[0-9a-f-]{36}$/.test(id));
  for(const token of sessions){const ended=await admin.admin.signOut(token,'local');assert.equal(ended.error,null);}
  if(ids.length){const literals=ids.map(id=>`'${id}'`).join(',');assert.equal(sql(`select count(*) from auth.sessions where id in(${literals})`),'0');assert.equal(sql(`select count(*) from auth.refresh_tokens where session_id in(${literals})`),'0');pass('Supported logout removes every issued local provider session and refresh row');}
 }catch{result.status='FAIL';result.failure='local_provider_cleanup_failed';}
}
if(process.env.SHELV_ADMISSION_REPORT)await writeFile(process.env.SHELV_ADMISSION_REPORT,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));if(result.status!=='PASS')process.exitCode=1;
