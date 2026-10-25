/** Opt-in actual Edge handler -> isolated, Unix-socket-only PostgreSQL. No provider/network ports. */
import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync,execFile,spawn} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {handlePaymentRequest} from '../supabase/functions/concierge-payments/handler.ts';
import type {PaymentPorts,PaymentBackendCall} from '../supabase/functions/concierge-payments/handler.ts';
const enabled=process.env.CONCIERGE_METHODS_NATIVE_SQL==='1',root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const bin=process.env.CONCIERGE_TEST_PG_BIN||'/opt/homebrew/opt/postgresql@15/bin';
const artifacts=path.join(root,'.local-artifacts/payment-methods/native-'+process.pid),db='shelv_payment_methods';
const env={...Object.fromEntries(Object.entries(process.env).filter(([key])=>!key.startsWith('PG'))),NODE_ENV:process.env.NODE_ENV??'test',PGPASSFILE:'/dev/null',PGSERVICEFILE:'/dev/null',PGCONNECT_TIMEOUT:'5',PGAPPNAME:'shelv-isolated-payment-methods'};
let socket='',started=false;
const lit=(value:unknown):string=>typeof value==='number'?String(value):"'"+String(typeof value==='object'?JSON.stringify(value):value).replaceAll("'","''")+"'"+(typeof value==='object'?'::jsonb':'');
const args=(database=db)=>['-X','-w','-h',socket,'-p','55449','-U','postgres','-d',database,'-Atq','-v','ON_ERROR_STOP=1'];
function command(name:string,argv:string[]){const result=spawnSync(path.join(bin,name),argv,{env,encoding:'utf8',timeout:30000});assert.equal(result.status,0,result.stderr||String(result.error));return result.stdout.trim();}
function sql(query:string){return command('psql',[...args(),'-c',query]);}
function deniedSql(query:string,code:string){const result=spawnSync(path.join(bin,'psql'),[...args(),'-c',query],{env,encoding:'utf8',timeout:10000});assert.notEqual(result.status,0);assert.match(result.stderr,new RegExp(code));}
before(()=>{
 if(!enabled)return;fs.mkdirSync(artifacts,{recursive:true});socket=fs.mkdtempSync('/tmp/shelv-methods-');
 command('initdb',['-D',path.join(artifacts,'data'),'-U','postgres','--auth=trust','--no-locale','-E','UTF8']);
 command('pg_ctl',['-D',path.join(artifacts,'data'),'-l',path.join(artifacts,'postgres.log'),'-o',`-k ${socket} -p 55449 -c listen_addresses=''`,'-w','start']);started=true;
 command('psql',[...args('postgres'),'-c',`create database ${db}`]);
 sql(`comment on database ${db} is 'Task-owned synthetic check-in reply acceptance';create role anon;create role authenticated;create role service_role;create schema auth;create table auth.users(id uuid primary key,is_anonymous boolean default false);create function auth.uid() returns uuid language sql as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;create table public.profiles(id uuid primary key references auth.users on delete cascade,deletion_started_at timestamptz);create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text,metadata jsonb);alter table storage.objects enable row level security;`);
 const migrations=['20261017190016_concierge_persistence_r1.sql','20261018234537_concierge_portal_workflows.sql','20261019015338_concierge_presentation_r2.sql','20261020002348_concierge_advisor_preview_v2.sql','20261020161532_concierge_maya_contract.sql',...fs.readdirSync(path.join(root,'supabase/migrations')).filter(name=>name.endsWith('_concierge_manual_payment_methods.sql'))];
 for(const name of migrations)command('psql',[...args(),'-f',path.join(root,'supabase/migrations',name)]);
 assert.equal(sql('show listen_addresses'),'');
 fs.writeFileSync(path.join(artifacts,'BOOTSTRAP.json'),JSON.stringify({database:db,listenAddresses:'',migrations,synthetic:true})+'\n');
});
after(()=>{if(started){command('pg_ctl',['-D',path.join(artifacts,'data'),'-m','fast','-w','stop']);fs.rmSync(path.join(artifacts,'data'),{recursive:true,force:true});}if(socket)fs.rmSync(socket,{recursive:true,force:true});});
const png=Uint8Array.from(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=','base64'));
function sqlTask(query:string|null,name:string){
 const child=spawn(path.join(bin,'psql'),[...args(),...(query===null?[]:['-c',query])],{env:{...env,PGAPPNAME:name},stdio:['pipe','pipe','pipe']});
 const task={child,name,stdout:'',stderr:'',done:false,completion:Promise.resolve({status:0,stdout:'',stderr:''})};
 child.stdout.on('data',chunk=>task.stdout+=String(chunk));child.stderr.on('data',chunk=>task.stderr+=String(chunk));task.completion=new Promise(resolve=>child.on('close',status=>{task.done=true;resolve({status:status??1,stdout:task.stdout,stderr:task.stderr});}));return task;
}
async function waitSql(check:()=>boolean,message:string){const end=Date.now()+10000;while(Date.now()<end){if(check())return;await new Promise(resolve=>setTimeout(resolve,15));}assert.fail(message);}
const waitingOn=(waiter:string,holder:string)=>sql(`select exists(select 1 from pg_stat_activity w join pg_stat_activity h on h.pid=any(pg_blocking_pids(w.pid)) where w.application_name=${lit(waiter)} and h.application_name=${lit(holder)} and w.wait_event_type='Lock')`)==='t';
const asActor=(actor:string,statement:string)=>`begin;set local role authenticated;set local request.jwt.claim.sub=${lit(actor)};${statement};commit;`;
function productPayload(){return {publicationVersion:1,serviceCents:0,servicePeriod:null,items:[{recommendationId:'moisturizer-1',quantity:1,unitPriceCents:1399,lineTotalCents:1399}],shippingAddressVersion:1,productSubtotalCents:1399,taxCents:0,shippingCents:0,productTotalCents:1399,totalCents:1399};}
function otherPng(){const data=Buffer.from('note\0synthetic'),kind=Buffer.from('tEXt'),crcBytes=Buffer.concat([kind,data]);let crc=0xffffffff;for(const byte of crcBytes){crc^=byte;for(let bit=0;bit<8;bit++)crc=crc&1?0xedb88320^(crc>>>1):crc>>>1;}const head=Buffer.alloc(4),tail=Buffer.alloc(4);head.writeUInt32BE(data.length);tail.writeUInt32BE((crc^0xffffffff)>>>0);return Uint8Array.from(Buffer.concat([Buffer.from(png.subarray(0,-12)),head,crcBytes,tail,Buffer.from(png.subarray(-12))]));}
function setup(addition=false){
 const [client,other,advisor,editor]=Array.from({length:4},()=>randomUUID()),recommendation=[{id:'moisturizer-1',slot:addition?'treatments':'moisturizer',currentProductId:addition?null:'old',proposedProductId:'new',priceCents:1399,currency:'USD',rationale:'Synthetic product'}];
 sql(`insert into auth.users(id) values ${[client,other,advisor,editor].map(id=>`(${lit(id)})`).join(',')};insert into public.profiles(id) select id from auth.users on conflict do nothing;insert into concierge.enrollments(client_id,display_name,status) values (${lit(client)},'Synthetic payment client','active'),(${lit(other)},'Synthetic other client','active');insert into concierge.advisors(user_id,active,can_view,can_edit,can_publish,can_confirm_payments) values (${lit(advisor)},true,true,true,true,true),(${lit(editor)},true,true,true,false,false);insert into concierge.cases(client_id,published_version) values (${lit(client)},1);insert into concierge.intakes(client_id,version,goal,note) values (${lit(client)},1,'Synthetic','PRIVATE_NOTE');insert into concierge.publications(client_id,version,intake_version,recommendations,published_by) values (${lit(client)},1,1,${lit(recommendation)},${lit(advisor)});insert into concierge.item_states(client_id,version,recommendation_id,choice) values (${lit(client)},1,'moisturizer-1','approved');insert into concierge.shipping_addresses(client_id,version,address,confirmed_by) values (${lit(client)},1,${lit({recipientName:'Synthetic',line1:'Not deliverable',line2:'',city:'Fixture',region:'IL',postalCode:'00000',countryCode:'US'})},${lit(client)});insert into concierge.payment_heads(client_id,address_version) values (${lit(client)},1);`);
 sql(`select concierge.validate_items(${lit(recommendation)});insert into concierge.baselines(client_id,slot,product_id) values (${lit(client)},'cleanser','comfortable-cleanser')${addition?'':`,(${lit(client)},'moisturizer','old')`}`);
 const actors:Record<string,string>={client,other,advisor,editor},objects=new Map<string,Uint8Array>();let lose=false,loseEvidence=false;
 const allowed=new Set(['concierge_payment_view','concierge_payment_write','concierge_payment_evidence_reserve','concierge_payment_evidence_commit','concierge_payment_evidence_access','concierge_payment_view_v2','concierge_payment_write_v2','concierge_payment_evidence_reserve_v2','concierge_payment_evidence_commit_v2','concierge_payment_evidence_access_v2']);
 const ports:PaymentPorts={allowedOrigins:[],authenticate:async token=>actors[token]?{id:actors[token],is_anonymous:false}:null,rpc:async(token,call:PaymentBackendCall)=>{
  assert.ok(allowed.has(call.name));const query=`begin;set local role authenticated;set local request.jwt.claim.sub=${lit(actors[token])};select public.${call.name}(${Object.entries(call.args).map(([key,value])=>`${key} => ${lit(value)}`).join(',')});commit;`;
  const outcome=await new Promise<{stdout:string;stderr:string;failed:boolean}>(resolve=>execFile(path.join(bin,'psql'),[...args(),'-c',query],{env,encoding:'utf8',timeout:10000},(error,stdout,stderr)=>resolve({stdout,stderr,failed:Boolean(error)})));
  if(outcome.failed)return {data:null,error:{message:/ERROR:\s+(concierge_[a-z_]+)/.exec(outcome.stderr)?.[1]||'synthetic_sql_error'}};
  const data=JSON.parse(outcome.stdout.trim().split('\n').find(line=>line.startsWith('{'))!);if(lose&&call.name==='concierge_payment_write_v2'){lose=false;throw Error('Synthetic response lost after commit');}if(loseEvidence&&call.name==='concierge_payment_evidence_commit_v2'){loseEvidence=false;throw Error('Synthetic completion response lost');}return {data,error:null};
 },storage:{upload:async(p,bytes,type)=>{if(objects.has(p)){assert.deepEqual(bytes,objects.get(p));return;}objects.set(p,bytes.slice());sql(`insert into storage.objects(bucket_id,name,metadata) values ('concierge-payment-evidence',${lit(p)},${lit({size:bytes.length,mimetype:type})})`);},sign:async p=>'https://synthetic.invalid/storage/v1/object/sign/concierge-payment-evidence/'+p+'?token=synthetic'}};
 const response=(token:string,body:unknown)=>handlePaymentRequest(new Request('https://synthetic.invalid/payments',{method:'POST',headers:{authorization:'Bearer '+token,'content-type':'application/json'},body:JSON.stringify(body)}),ports);
 const http=async(token:string,body:unknown,status=200)=>{const result=await response(token,body),value=await result.json();assert.equal(result.status,status,JSON.stringify(value));return value as any;};
 const read=()=>http('client',{action:'client_read',schemaVersion:2});
 const issue=async(service=false,legacy=false)=>{const period=JSON.parse(sql(`select jsonb_build_object('startOn',concierge.service_anchor(${lit(client)}),'endOn',(concierge.service_anchor(${lit(client)})+interval '1 month')::date)`));return http('advisor',{...(!legacy?{schemaVersion:2}:{}),action:'issue_quote',clientId:client,requestId:randomUUID(),expectedRevision:Number(sql(`select revision from concierge.payment_heads where client_id=${lit(client)}`)),publicationVersion:1,serviceCents:service?10000:0,servicePeriod:service?period:null,items:service?[]:[{recommendationId:'moisturizer-1',quantity:1,unitPriceCents:1399,lineTotalCents:1399}],shippingAddressVersion:service?null:1,productSubtotalCents:service?0:1399,taxCents:0,shippingCents:0,productTotalCents:service?0:1399,totalCents:service?10000:1399});};
 const claim=(q:any,option:string|null,revision:number,evidenceId:string|null=null,legacy=false)=>({...(!legacy?{schemaVersion:2,paymentOptionId:option}:{}),action:'submit_claim',requestId:randomUUID(),expectedRevision:revision,quoteId:q.id,quoteVersion:q.version,serviceCents:q.serviceCents,productCents:q.productTotalCents,totalCents:q.totalCents,shippingAddressVersion:q.shippingAddressVersion,evidenceId});
 const upload=async(q:any,option:string,revision:number,requestId=randomUUID(),completionRequestId=randomUUID(),bytes=png)=>{const form=new FormData();form.set('metadata',JSON.stringify({schemaVersion:2,action:'upload_evidence',requestId,completionRequestId,expectedRevision:revision,quoteId:q.id,quoteVersion:q.version,paymentOptionId:option}));form.set('file',new Blob([bytes],{type:'image/png'}),'synthetic.png');return handlePaymentRequest(new Request('https://synthetic.invalid/payments',{method:'POST',headers:{authorization:'Bearer client'},body:form}),ports);};
 return {client,other,advisor,editor,http,response,read,issue,claim,upload,lose(){lose=true;},loseEvidence(){loseEvidence=true;}};
}

test('native registry freezes eligible recipient options and rejects V1 method-bearing reads', {skip:!enabled},async()=>{
 const s=setup();await s.issue();let v=await s.read();assert.equal(v.quotes[0].paymentOptions.length,1);assert.equal(v.quotes[0].paymentOptions[0].recipient.method,'zelle');
 sql("update concierge.payment_recipient_status set enabled=true,allow_service=false where recipient_id='cash-app-kanuj'");
 await s.issue();v=await s.read();const q=v.quotes.at(-1);assert.equal(q.paymentOptions.length,2);assert.equal(q.paymentOptions.find((o:any)=>o.recipient.method==='cash_app').recipient.cashtag,'$KanujVerma');
 await s.http('client',{action:'client_read'},409);await s.http('advisor',{action:'advisor_read',clientId:s.client},409);
 await s.issue(true);v=await s.read();assert.deepEqual(v.quotes.at(-1).paymentOptions.map((o:any)=>o.recipient.method),['zelle']);
 sql("update concierge.payment_recipient_status set enabled=true,allow_service=true");await s.issue(true);v=await s.read();assert.deepEqual(v.quotes.at(-1).paymentOptions.map((o:any)=>o.recipient.method).sort(),['apple_cash','cash_app','zelle']);
 sql("update concierge.payment_recipient_status set enabled=false");const before=v.revision;await s.issue().then(()=>assert.fail('No eligible method must refuse issuance'),()=>{});assert.equal((await s.read()).revision,before);
 sql("update concierge.payment_recipient_status set enabled=true where recipient_id='zelle-approved'");
});

test('native evidence/claim/receipt bind method, digest and owner, with actual founder acknowledgement', {skip:!enabled},async()=>{
 sql("update concierge.payment_recipient_status set enabled=true");const s=setup();await s.issue();const v=await s.read(),q=v.quotes[0],z=q.paymentOptions.find((o:any)=>o.recipient.method==='zelle'),cash=q.paymentOptions.find((o:any)=>o.recipient.method==='cash_app');
 const reserve=randomUUID(),complete=randomUUID();s.loseEvidence();assert.equal((await s.upload(q,z.id,v.revision,reserve,complete)).status,503);const uploaded=await s.upload(q,z.id,v.revision,reserve,complete);assert.equal(uploaded.status,200);const evidence=await uploaded.json();assert.equal(evidence.paymentOptionId,z.id);
 const retry=await s.upload(q,z.id,v.revision,reserve,complete);assert.equal(retry.status,200);assert.deepEqual(await retry.json(),evidence);
 assert.equal((await s.upload(q,cash.id,v.revision,reserve,complete)).status,409);assert.equal((await s.upload(q,z.id,v.revision,reserve,complete,otherPng())).status,409);
 await s.http('client',s.claim(q,cash.id,v.revision,evidence.evidenceId),409);
 const sent=await s.http('client',s.claim(q,z.id,v.revision,evidence.evidenceId));const confirm={schemaVersion:2,action:'confirm_payment',clientId:s.client,requestId:randomUUID(),expectedRevision:sent.revision,quoteId:q.id,quoteVersion:q.version,claimId:sent.claimId,serviceCents:0,productCents:1399,totalCents:1399,shippingAddressVersion:1,paymentOptionId:z.id,receiptVerified:true};
 await s.http('editor',confirm,403);await s.http('advisor',{...confirm,paymentOptionId:cash.id},409);const paid=await s.http('advisor',confirm);assert.equal(paid.productOrderStatus,'ready_to_purchase');assert.deepEqual(await s.http('advisor',confirm),paid);
 await s.http('advisor',{...confirm,requestId:randomUUID(),expectedRevision:paid.revision},409);
 const duplicate=await s.http('advisor',{schemaVersion:2,action:'issue_quote',clientId:s.client,requestId:randomUUID(),expectedRevision:paid.revision,publicationVersion:1,serviceCents:0,servicePeriod:null,items:q.items,shippingAddressVersion:1,productSubtotalCents:1399,taxCents:0,shippingCents:0,productTotalCents:1399,totalCents:1399},409);assert.equal(duplicate.code,'concierge_product_already_funded');
 await s.http('other',{schemaVersion:2,action:'evidence_url',evidenceId:evidence.evidenceId},403);assert.equal(sql(`select count(*) from concierge.activations where client_id=${lit(s.client)}`),'0');
 sql(`update concierge.advisors set active=false where user_id=${lit(s.advisor)}`);await s.http('advisor',confirm,403);
});

test('all three locally configured manual methods retain service pricing and server option provenance', {skip:!enabled},async()=>{
 sql('update concierge.payment_recipient_status set enabled=true,allow_service=true,allow_products=true');
 for(const method of ['zelle','cash_app','apple_cash']){
  const s=setup();await s.issue(true);const view=await s.read(),q=view.quotes[0],option=q.paymentOptions.find((o:any)=>o.recipient.method===method);assert.equal(q.totalCents,10000);assert.ok(option);
  if(method==='apple_cash')assert.equal(option.recipient.phone.replace(/\D/g,''),'9257191334');
  const sent=await s.http('client',s.claim(q,option.id,view.revision));await s.http('advisor',{schemaVersion:2,action:'confirm_payment',clientId:s.client,requestId:randomUUID(),expectedRevision:sent.revision,quoteId:q.id,quoteVersion:q.version,claimId:sent.claimId,serviceCents:10000,productCents:0,totalCents:10000,shippingAddressVersion:null,paymentOptionId:option.id,receiptVerified:true});
  assert.equal(sql(`select count(*) from concierge.payment_confirmations where client_id=${lit(s.client)}`),'1');assert.equal(sql(`select count(*) from concierge.activations where client_id=${lit(s.client)}`),'0');
 }
});
test('restored Maya contract supports optional replacement and null-current addition funding without activation before explicit Start', {skip:!enabled},async()=>{
 for(const addition of [false,true]){
  const s=setup(addition);await s.issue();let view=await s.read();
  async function fund(q:any){const option=q.paymentOptions.find((o:any)=>o.recipient.method==='zelle'),sent=await s.http('client',s.claim(q,option.id,(await s.read()).revision));return s.http('advisor',{schemaVersion:2,action:'confirm_payment',clientId:s.client,requestId:randomUUID(),expectedRevision:sent.revision,quoteId:q.id,quoteVersion:q.version,claimId:sent.claimId,serviceCents:q.serviceCents,productCents:q.productTotalCents,totalCents:q.totalCents,shippingAddressVersion:q.shippingAddressVersion,paymentOptionId:option.id,receiptVerified:true});}
  await fund(view.quotes[0]);assert.equal(sql(`select count(*) from concierge.activations where client_id=${lit(s.client)}`),'0');
  await s.issue(true);view=await s.read();await fund(view.quotes.at(-1));
  const baseline=sql(`select jsonb_agg(jsonb_build_array(slot,product_id) order by slot) from concierge.baselines where client_id=${lit(s.client)}`);
  // Read the case revision as the fixture owner because authenticated roles have no raw table grant.
  const coreWrite=(action:string,payload:unknown)=>{const rev=Number(sql(`select revision from concierge.cases where client_id=${lit(s.client)}`));return sql(`begin;set local role authenticated;set local request.jwt.claim.sub=${lit(s.client)};select public.concierge_write(${lit(s.client)},${lit(action)},${rev},${lit(randomUUID())},${lit(payload)});commit;`);};
  coreWrite('receive',{version:1,recommendationId:'moisturizer-1'});assert.equal(sql(`select count(*) from concierge.activations where client_id=${lit(s.client)}`),'0');assert.equal(sql(`select jsonb_agg(jsonb_build_array(slot,product_id) order by slot) from concierge.baselines where client_id=${lit(s.client)}`),baseline);
  coreWrite('start',{version:1,recommendationId:'moisturizer-1',startedOn:sql("select (now() at time zone 'UTC')::date")});assert.equal(sql(`select count(*) from concierge.activations where client_id=${lit(s.client)} and slot=${lit(addition?'treatments':'moisturizer')} and product_id='new'`),'1');
 }
});

test('native wrappers preserve legacy exact replay and record one V2 claim after a lost response and concurrent intents', {skip:!enabled},async()=>{
 const s=setup();await s.issue(false,true);const old=await s.http('client',{action:'client_read'}),q0=old.quotes[0],legacy=s.claim(q0,null,old.revision,null,true),receipt=await s.http('client',legacy);
 await s.issue();assert.deepEqual(await s.http('client',legacy),receipt);const view=await s.read();assert.equal(view.quotes[0].contractVersion,1);assert.deepEqual(view.quotes[0].paymentOptions,[]);
 const q=view.quotes.at(-1),option=q.paymentOptions[0].id,command=s.claim(q,option,view.revision);
 await s.http('client',{...command,requestId:legacy.requestId},409);
 const oldIssueId=sql(`select request_id from concierge.workflow_requests where actor_id=${lit(s.advisor)} and result->>'quoteId'=${lit(q0.id)} and result->>'operation'='issue_quote'`),newIssueId=sql(`select request_id from concierge.workflow_requests where actor_id=${lit(s.advisor)} and result->>'quoteId'=${lit(q.id)} and result->>'operation'='issue_quote'`);
 const money={publicationVersion:q.publicationVersion,serviceCents:q.serviceCents,servicePeriod:q.servicePeriod,shippingAddressVersion:q.shippingAddressVersion,items:q.items,productSubtotalCents:q.productSubtotalCents,taxCents:q.taxCents,shippingCents:q.shippingCents,productTotalCents:q.productTotalCents,totalCents:q.totalCents};
 await s.http('advisor',{schemaVersion:2,action:'issue_quote',clientId:s.client,requestId:oldIssueId,expectedRevision:0,...money},409);
 await s.http('advisor',{action:'issue_quote',clientId:s.client,requestId:newIssueId,expectedRevision:view.revision-1,...money},409);
 assert.equal(sql(`select count(*) from concierge.payment_contract_quotes where quote_id=${lit(q0.id)}`),'0','A V2 UUID collision cannot retrofit a legacy quote');
 s.lose();await s.http('client',command,503);const sent=await s.http('client',command);assert.deepEqual(await s.http('client',command),sent);assert.equal(sql(`select count(*) from concierge.claims where quote_id=${lit(q.id)}`),'1');
 await s.http('client',{...command,paymentOptionId:randomUUID()},409);await s.http('client',{...command,schemaVersion:undefined,paymentOptionId:undefined},409);
 const other=setup();await other.issue();const v=await other.read(),quote=v.quotes[0],a=other.claim(quote,quote.paymentOptions[0].id,v.revision),b={...a,requestId:randomUUID()};const replies=await Promise.all([other.response('client',a),other.response('client',b)]);assert.deepEqual(replies.map(r=>r.status).sort(),[200,409]);
});

test('held V2 transaction cannot expose its inner V1 receipt or admit an unbound V1 evidence reservation', {skip:!enabled,timeout:30000},async()=>{
 const s=setup(),request=randomUUID(),tag='method-race-'+randomUUID().slice(0,8),barrier=771001;
 const control=sqlTask(null,tag+'-control'),tasks=[control];control.child.stdin.write(`select pg_advisory_lock(${barrier});select 'READY';\n`);
 try{
  await waitSql(()=>control.stdout.includes('READY'),'Barrier controller did not acquire its owned lock');
  const held=sqlTask(null,tag+'-v2');tasks.push(held);held.child.stdin.end(`begin;set local role authenticated;set local request.jwt.claim.sub=${lit(s.advisor)};\nselect public.concierge_payment_write_v2(${lit(s.client)},'issue_quote',0,${lit(request)},${lit(productPayload())});\nselect pg_advisory_xact_lock(${barrier});\ncommit;\n`);
  await waitSql(()=>waitingOn(held.name,control.name),'V2 transaction did not reach its pre-commit barrier');
  await waitSql(()=>held.stdout.includes('quoteId'),'V2 did not flush its uncommitted synthetic quote result');
  const result=JSON.parse(held.stdout.split('\n').find(line=>line.startsWith('{'))!);
  const old=sqlTask(asActor(s.advisor,`select public.concierge_payment_write(${lit(s.client)},'issue_quote',0,${lit(request)},${lit(productPayload())})`),tag+'-v1');tasks.push(old);
  const reserve=sqlTask(asActor(s.client,`select public.concierge_payment_evidence_reserve(${lit(s.client)},${lit(randomUUID())},1,${lit(result.quoteId)},1,'image/png',68,${lit('a'.repeat(64))})`),tag+'-reserve');tasks.push(reserve);
  await waitSql(()=>waitingOn(old.name,held.name),'V1 write was not actually waiting behind held V2 transaction');await waitSql(()=>waitingOn(reserve.name,held.name),'V1 reservation was not actually waiting behind held V2 transaction');
  control.child.stdin.end(`select pg_advisory_unlock(${barrier});\n\\q\n`);assert.equal((await held.completion).status,0);
  const v1=await old.completion,evidence=await reserve.completion;assert.notEqual(v1.status,0,'V1 adopted the V2 inner receipt: '+v1.stdout);assert.match(v1.stderr,/concierge_payment_contract_upgrade_required/);assert.notEqual(evidence.status,0,'V1 created method-unbound evidence: '+evidence.stdout);assert.match(evidence.stderr,/concierge_payment_contract_upgrade_required/);
  assert.equal(sql(`select count(*) from concierge.payment_evidence where client_id=${lit(s.client)}`),'0');
 }finally{for(const task of tasks)if(!task.done)task.child.kill('SIGTERM');await Promise.all(tasks.map(task=>task.completion));}
});

test('serialized V1 read cannot check before a V2 commit and then project its quote without method metadata', {skip:!enabled,timeout:30000},async()=>{
 const s=setup(),tag='read-race-'+randomUUID().slice(0,8),barrier=771002,control=sqlTask(null,tag+'-control'),tasks=[control];
 sql("update concierge.payment_recipient_status set enabled=(recipient_id='cash-app-kanuj')");
 // Test-only timing barrier around the unchanged legacy read core; the public V1 guard is actual production SQL.
 sql(`alter function concierge.payment_view_v1_core(uuid) rename to payment_view_race_actual;create function concierge.payment_view_v1_core(p_client_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$begin perform pg_advisory_xact_lock(${barrier});return concierge.payment_view_race_actual(p_client_id);end$$;`);
 control.child.stdin.write(`select pg_advisory_lock(${barrier});select 'READY';\n`);
 try{
  await waitSql(()=>control.stdout.includes('READY'),'Read barrier controller did not acquire its owned lock');
  const read=sqlTask(asActor(s.client,`select public.concierge_payment_view(${lit(s.client)})`),tag+'-read');tasks.push(read);await waitSql(()=>waitingOn(read.name,control.name),'Read did not reach the inside-core timing barrier');
  const write=sqlTask(asActor(s.advisor,`select public.concierge_payment_write_v2(${lit(s.client)},'issue_quote',0,${lit(randomUUID())},${lit(productPayload())})`),tag+'-write');tasks.push(write);
  await waitSql(()=>write.done||waitingOn(write.name,read.name),'Concurrent issuer did not complete or wait');const serialized=!write.done&&waitingOn(write.name,read.name);
  control.child.stdin.end(`select pg_advisory_unlock(${barrier});\n\\q\n`);const reader=await read.completion,writer=await write.completion;assert.equal(reader.status,0,reader.stderr);assert.equal(writer.status,0,writer.stderr);
  assert.equal(serialized,true,'V2 committed after the V1 marker check; leaked legacy projection: '+reader.stdout);assert.deepEqual(JSON.parse(reader.stdout.trim()).quotes,[]);assert.deepEqual(JSON.parse(sql(`select jsonb_agg(recipient->>'method') from concierge.payment_quote_options where client_id=${lit(s.client)}`)),['cash_app']);
  const denied=spawnSync(path.join(bin,'psql'),[...args(),'-c',asActor(s.client,`select public.concierge_payment_view(${lit(s.client)})`)],{env,encoding:'utf8'});assert.notEqual(denied.status,0);assert.match(denied.stderr,/concierge_payment_contract_upgrade_required/);
 }finally{for(const task of tasks)if(!task.done)task.child.kill('SIGTERM');await Promise.all(tasks.map(task=>task.completion));sql('drop function concierge.payment_view_v1_core(uuid);alter function concierge.payment_view_race_actual(uuid) rename to payment_view_v1_core;update concierge.payment_recipient_status set enabled=true;');}
});
