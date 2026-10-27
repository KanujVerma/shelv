import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {Miniflare,convertV4MiniflareOptions} from 'miniflare';
import {buildCandidate} from '../scripts/build.mjs';
import {CredentialEnvelope} from '../server/credential-envelope';

const origin='https://portal.goshelv.com',supabase='https://snojlbqovlawewwqbviz.supabase.co';
const owner='11111111-1111-4111-8111-111111111111',otherOwner='33333333-3333-4333-8333-333333333333';
const providerSession='22222222-2222-4222-8222-222222222222',otherSession='44444444-4444-4444-8444-444444444444';
const caps={view:true,edit:false,publish:false,confirmPayments:false};
const ring=JSON.stringify({active:'synthetic',keys:{synthetic:Buffer.alloc(32,37).toString('base64url')}});
const dataCanary='CLIENT_DATA_MUST_NOT_ESCAPE_REJECTION';
function credentials(id=owner,session=providerSession,claimsOverride:Record<string,unknown>={}){
 const claims={sub:id,session_id:session,exp:Math.floor(Date.now()/1000)+3600,...claimsOverride};
 return {access_token:[Buffer.from('{}').toString('base64url'),Buffer.from(JSON.stringify(claims)).toString('base64url'),'synthetic-signature'].join('.'),refresh_token:'synthetic-refresh',expires_at:Date.now()/1000+3600,user:{id},providerSessionId:session};
}
function context(c=credentials()){return {ownerId:c.user.id,providerSessionId:c.providerSessionId,role:'client',sessionNotAfter:null,capabilities:caps};}
const commands={read:{channel:'operations',body:{action:'client_read_v2'}},write:{channel:'payments',body:{action:'submit_claim',quoteId:'55555555-5555-4555-8555-555555555555',quoteVersion:1,serviceCents:10000,productCents:0,totalCents:10000,shippingAddressVersion:null,evidenceId:null,expectedRevision:1,requestId:'66666666-6666-4666-8666-666666666666'}}};

async function runtime(){
 await buildCandidate();let current=credentials(),projection:any=context(current),afterDomain:()=>Promise<void>=async()=>{};
 let contextCalls=0,reads=0,writes=0;const claims:string[]=[];let serial=0;
 const outbound=async(req:any)=>{
  const url=new URL(req.url);assert.equal(url.origin,supabase);
  assert.equal(req.headers.get('authorization'),`Bearer ${current.access_token}`);
  if(url.pathname==='/rest/v1/rpc/concierge_client_session_context'){contextCalls++;return Response.json(projection);}
  const body=await req.json();
  if(url.pathname==='/functions/v1/concierge-operations'){
   assert.equal(body.action,'client_read_v2');reads++;await afterDomain();
   return Response.json({plan:{version:7},publicCanary:dataCanary});
  }
  assert.equal(url.pathname,'/functions/v1/concierge-payments');assert.equal(body.action,'submit_claim');
  writes++;claims.push('synthetic-unverified-claim');await afterDomain();
  return Response.json({claimId:claims.at(-1),status:'submitted_unverified',serviceUnlocked:false,publicCanary:dataCanary});
 };
 const raw:any={cf:false,logRequests:false,upstream:origin,workers:[
  {name:'gateway',routes:['portal.goshelv.com/*'],modules:true,scriptPath:'dist/pages/_worker.js',compatibilityDate:'2026-10-20',compatibilityFlags:['nodejs_compat'],bindings:{PORTAL_ORIGIN:origin,CLIENT_SHARED_SESSIONS:'true'},durableObjects:{ADVISOR_SESSIONS:{className:'AdvisorSessionObject',scriptName:'vault',useSQLite:true}},serviceBindings:{ASSETS:async()=>{throw Error('unexpected asset access');}},outboundService:async()=>{throw Error('unexpected gateway outbound');}},
  {name:'vault',modules:true,scriptPath:'dist/vault/index.js',compatibilityDate:'2026-10-20',compatibilityFlags:['nodejs_compat'],bindings:{PORTAL_ORIGIN:origin,CLIENT_SHARED_SESSIONS:'true',SUPABASE_PUBLIC_KEY:'sb_publishable_synthetic',ADVISOR_SESSION_KEYS:ring,SESSION_IDLE_SECONDS:'3600',SESSION_ABSOLUTE_SECONDS:'28800',SESSION_FLOW_SECONDS:'600',CLIENT_REMEMBER_IDLE_SECONDS:'604800',CLIENT_REMEMBER_ABSOLUTE_SECONDS:'2592000'},durableObjects:{ADVISOR_SESSIONS:{className:'AdvisorSessionObject',useSQLite:true}},outboundService:outbound}
 ]};
 const mf=new Miniflare({...convertV4MiniflareOptions(raw),unsafeInspectDurableObjects:true,telemetry:{enabled:false}});
 const ns:any=await mf.getDurableObjectNamespace('ADVISOR_SESSIONS','vault');
 const reset=()=>{contextCalls=0;reads=0;writes=0;claims.length=0;afterDomain=async()=>{};};
 const use=(c:any,body:any=context(c))=>{current=c;projection=body;};
 async function target(label:string){
  const selector=createHash('sha256').update(`${label}:${serial++}`).digest('base64url');
  const name='client:session:'+createHash('sha256').update(`client:session:${selector}`).digest('base64url');
  const stub=ns.getByName(name),objectId=ns.idFromName(name).toString();
  const store=await mf.unsafeGetDurableObjectStorage('vault','AdvisorSessionObject',{name});
  return {stub,objectId,store,cookie:'__Host-shelv_client='+selector,csrf:''};
 }
 async function seed(label:string){
  use(credentials());reset();const s=await target(label),result=await s.stub.invoke({type:'session.initialize',audience:'client',credentials:current,grant:'synthetic-grant',remember:true});
  assert.equal(result.ok,true,label);assert.equal(result.value.ownerId,owner);assert.equal(contextCalls,1);s.csrf=result.value.csrf;reset();return {...s,providerCredentials:current};
 }
 const readRecord=async(s:any)=>{const rows=await s.store.exec('SELECT json FROM session_record WHERE singleton=1');return rows.length?JSON.parse(String(rows[0].json)):null;};
 const writeRecord=async(s:any,r:any)=>{await s.store.exec('UPDATE session_record SET json=? WHERE singleton=1',JSON.stringify(r));};
 async function reseal(s:any,c:any,patch:any){
  const r={...await readRecord(s),...patch};r.credentials=await new CredentialEnvelope(ring,s.objectId).seal(c,r.ownerId);
  await writeRecord(s,r);use(c);return r;
 }
 const call=(s:any,kind:'read'|'write')=>{const c=commands[kind];return mf.dispatchFetch(origin+'/api/client/'+c.channel,{method:'POST',headers:{Origin:origin,'Sec-Fetch-Site':'same-origin','CF-Connecting-IP':'192.0.2.91','Content-Type':'application/json','X-Shelv-CSRF':s.csrf,Cookie:s.cookie},body:JSON.stringify(c.body)});};
 return {mf,seed,target,use,reset,readRecord,writeRecord,reseal,call,stats:()=>({contextCalls,reads,writes,claims:[...claims]}),after:(fn:()=>Promise<void>)=>afterDomain=fn};
}
async function denied(response:Response,status=403,code='forbidden'){
 assert.equal(response.status,status);assert.match(response.headers.get('cache-control')??'',/private, no-store/);
 const raw=await response.text();assert.deepEqual(JSON.parse(raw),{code});
 assert.doesNotMatch(raw,/CLIENT_DATA_|synthetic-|11111111|22222222|33333333|44444444/);
}
async function revoked(f:any,s:any){const record=await f.readRecord(s);assert.equal(record.status,'revoked');assert.equal(record.credentials,null);assert.equal(record.epoch,2);}

test('real client gateway/Vault dispatch permits matching owner/session reads and one domain mutation',async()=>{
 const f=await runtime();try{
  const s=await f.seed('matching');const read=await f.call(s,'read');assert.equal(read.status,200);assert.deepEqual(await read.json(),{plan:{version:7},publicCanary:dataCanary});
  const write=await f.call(s,'write');assert.equal(write.status,200);assert.deepEqual(await write.json(),{claimId:'synthetic-unverified-claim',status:'submitted_unverified',serviceUnlocked:false,publicCanary:dataCanary});
  assert.deepEqual(f.stats(),{contextCalls:4,reads:1,writes:1,claims:['synthetic-unverified-claim']});assert.equal((await f.readRecord(s)).status,'active');
 }finally{await f.mf.dispose();}
});

test('real client dispatch rejects mismatched/missing/malformed provider identity before reads or mutations',async()=>{
 const valid=context();const cases=[
  {label:'other-owner',body:{...valid,ownerId:otherOwner}},
  {label:'other-provider-session',body:{...valid,providerSessionId:otherSession}},
  {label:'missing-owner',body:{...valid,ownerId:undefined}},
  {label:'malformed-owner',body:{...valid,ownerId:{id:owner}}},
  {label:'missing-provider-session',body:{...valid,providerSessionId:undefined}},
  {label:'malformed-provider-session',body:{...valid,providerSessionId:17}},
  {label:'advisor-role',body:{...valid,role:'advisor'}},
  {label:'missing-role',body:{...valid,role:undefined}},
  {label:'malformed-role',body:{...valid,role:{name:'client'}}},
 ];
 const f=await runtime();try{
  for(const c of cases)for(const kind of ['read','write'] as const){
   // Reuse the seeded pair; rebuilding its JWT can cross an expiry timestamp second.
   const s=await f.seed(`${c.label}:${kind}`);f.use(s.providerCredentials,c.body);
   await denied(await f.call(s,kind));assert.deepEqual(f.stats(),{contextCalls:1,reads:0,writes:0,claims:[]},c.label);await revoked(f,s);
   await denied(await f.call(s,kind),401,'session_ended');assert.equal(f.stats().contextCalls,1,'revoked retry never reaches provider');assert.equal(f.stats().writes,0);
  }
 }finally{await f.mf.dispose();}
});

test('Vault-owned identity fence rejects credential-matching provider context that disagrees with persisted owner/session',async()=>{
 // Privileged local corruption fixtures, not an externally accessible state-edit mechanism.
 // Provider context matches the decrypted credentials, so only the Vault's own binding can deny.
 const cases=[
  {label:'vault-other-owner',credentials:credentials(otherOwner),patch:{}},
  {label:'vault-other-provider-session',credentials:credentials(owner,otherSession),patch:{}},
  {label:'vault-missing-owner',credentials:credentials(),patch:{ownerId:undefined}},
  {label:'vault-malformed-owner',credentials:credentials(),patch:{ownerId:17}},
  {label:'vault-missing-provider-session',credentials:credentials(),patch:{providerSessionId:undefined}},
  {label:'vault-malformed-provider-session',credentials:credentials(),patch:{providerSessionId:{id:providerSession}}},
 ];
 const f=await runtime();try{
  for(const c of cases)for(const kind of ['read','write'] as const){
   const s=await f.seed(`${c.label}:${kind}`);await f.reseal(s,c.credentials,c.patch);
   await denied(await f.call(s,kind));assert.deepEqual(f.stats(),{contextCalls:1,reads:0,writes:0,claims:[]},c.label);await revoked(f,s);
  }
 }finally{await f.mf.dispose();}
});

test('actual Vault initialization rejects missing/malformed credential identity without storing a session or dispatching domain work',async()=>{
 const base=credentials();const cases=[
  {label:'missing-user',value:{...base,user:undefined},status:503},
  {label:'missing-user-id',value:{...base,user:{}},status:401},
  {label:'malformed-user-id',value:{...base,user:{id:17}},status:401},
  {label:'other-user-id',value:{...base,user:{id:otherOwner}},status:401},
  {label:'missing-provider-session',value:{...base,providerSessionId:undefined},status:401},
  {label:'other-provider-session',value:{...base,providerSessionId:otherSession},status:401},
  {label:'missing-token-sub',value:credentials(owner,providerSession,{sub:undefined}),status:401},
  {label:'missing-token-session',value:credentials(owner,providerSession,{session_id:undefined}),status:401},
  {label:'malformed-token-sub',value:credentials(owner,providerSession,{sub:{id:owner}}),status:401},
 ];
 const f=await runtime();try{
  for(const c of cases){
   f.use(credentials());f.reset();const s=await f.target(c.label),result=await s.stub.invoke({type:'session.initialize',audience:'client',credentials:c.value,grant:'synthetic-grant',remember:true});
   assert.equal(result.ok,false,c.label);assert.equal(result.error.status,c.status,c.label);assert.equal(result.value,undefined);assert.equal(await f.readRecord(s),null,c.label);
   assert.deepEqual(f.stats(),{contextCalls:0,reads:0,writes:0,claims:[]},c.label);
  }
 }finally{await f.mf.dispose();}
});

test('post-operation Vault owner/session mismatch suppresses response and revokes without undoing completed domain work',async()=>{
 const f=await runtime();try{
  for(const field of ['ownerId','providerSessionId'])for(const kind of ['read','write'] as const){
   const s=await f.seed(`post:${field}:${kind}`);
   f.after(async()=>{const r=await f.readRecord(s);r[field]=field==='ownerId'?otherOwner:otherSession;await f.writeRecord(s,r);});
   await denied(await f.call(s,kind));assert.deepEqual(f.stats(),{contextCalls:2,reads:kind==='read'?1:0,writes:kind==='write'?1:0,claims:kind==='write'?['synthetic-unverified-claim']:[]});await revoked(f,s);
   // The first operation was authorized before the identity changed. A denial cannot undo it.
   await denied(await f.call(s,'write'),401,'session_ended');assert.equal(f.stats().writes,kind==='write'?1:0);assert.equal(f.stats().contextCalls,2);
  }
 }finally{await f.mf.dispose();}
});
