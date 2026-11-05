import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {preparePublicationInput,HOST_PINS} from '../caller/genuine-advisor-host.mjs';
// SYNTHETIC DATA controls only. No actual identity/grant/session is created.
const sha=b=>createHash('sha256').update(b).digest('hex'),json=v=>Buffer.from(JSON.stringify(v));
const id=n=>'20000000-0000-4000-8000-'+String(n).padStart(12,'0');
const at='2026-11-03T12:00:00Z';
function example(){
 const ownerId=id(1),d={schemaVersion:1,ownerId,projectId:'sa-'+ownerId.replaceAll('-',''),sourceCommit:HOST_PINS.source,fixtureDirectory:HOST_PINS.root+'/.local-artifacts/synthetic-input-control',privateDirectory:HOST_PINS.root+'/.local-artifacts/synthetic-input-control/private',endpoints:{portal:HOST_PINS.portal,supabase:HOST_PINS.supabase,mailpit:'http://127.0.0.1:58624'},actors:{a:{id:id(2),email:'a@example.invalid',initialDisplayName:'SYNTHETIC A'},b:{id:id(3),email:'b@example.invalid',initialDisplayName:'SYNTHETIC B'}}};
 const descriptorBytes=json(d),b={ownerId,projectId:d.projectId,sourceCommit:HOST_PINS.source,rootTargetSha256:HOST_PINS.rootTargetSha256,runtimeManifestSha256:HOST_PINS.runtimeManifestSha256,adapterSha256:HOST_PINS.adapterSha256,callerSha256:sha(readFileSync(new URL('../caller/genuine-advisor-host.mjs',import.meta.url))),descriptorSha256:sha(descriptorBytes)};
 const capture=v=>({binding:structuredClone(b),bytesBase64:json(v).toString('base64'),sha256:sha(json(v)),capturedAt:at,error:null});
 const actors={owner:{id:id(4),email:'owner-'+ownerId+'@example.invalid'},viewer:{id:id(5),email:'viewer-'+ownerId+'@example.invalid'}};
 const sql={profiles:Object.values(actors).map(a=>({id:a.id,email:a.email,deletion_started_at:null})),advisors:Object.entries(actors).map(([role,a])=>({user_id:a.id,active:true,can_view:true,can_edit:role==='owner',can_publish:role==='owner',can_confirm_payments:role==='owner',can_admit_clients:false})),principals:Object.entries(actors).map(([role,a])=>({actor_id:a.id,kind:role==='owner'?'owner':'human',active:true})),policy:{singleton:true,activated:true,owner_actor_id:actors.owner.id,revision:1,require_kanuj_approval:true}};
 const setup={schemaVersion:1,kind:'M04_SETUP_OBSERVATIONS',binding:b,raw:{providerOwner:capture({method:'POST',path:'/auth/v1/admin/users',response:{status:200,body:{...actors.owner,is_anonymous:false}}}),providerViewer:capture({method:'POST',path:'/auth/v1/admin/users',response:{status:200,body:{...actors.viewer,is_anonymous:false}}}),sql:capture(sql)}};
 const http=(actorId,audience,request,body)=>capture({actorId,method:'POST',path:'/api/'+audience+'/payments',request,response:{status:200,body:{schemaVersion:2,...body}}});
 const q={schemaVersion:2,action:'issue_quote',requestId:id(10),expectedRevision:0,clientId:id(2),publicationVersion:0,serviceCents:10000,servicePeriod:null,shippingAddressVersion:null,items:[],productSubtotalCents:0,taxCents:0,shippingCents:0,productTotalCents:0,totalCents:10000};
 const c={schemaVersion:2,action:'submit_claim',requestId:id(11),expectedRevision:1,quoteId:id(6),quoteVersion:1,serviceCents:10000,productCents:0,totalCents:10000,shippingAddressVersion:null,paymentOptionId:id(8),evidenceId:null};
 const receipt={serviceUnlocked:false,serviceAccessStatus:null,productOrderStatus:null};
 const payment={schemaVersion:1,kind:'M04_UNVERIFIED_PAYMENT_OBSERVATIONS',binding:b,raw:{before:http(id(4),'advisor',{schemaVersion:2,action:'advisor_read',clientId:id(2)},{revision:0}),quote:http(id(4),'advisor',q,{...receipt,operation:'issue_quote',status:'payable',claimId:null,paymentOptionId:null,quoteId:id(6),revision:1}),afterQuote:http(id(2),'client',{schemaVersion:2,action:'client_read'},{revision:1,quotes:[{id:id(6),version:1,publicationVersion:0,status:'payable',contractVersion:2,serviceCents:10000,productTotalCents:0,totalCents:10000,paymentOptions:[{id:id(8),available:true,recipientVersion:1}]}]}),claim:http(id(2),'client',c,{...receipt,operation:'submit_claim',status:'submitted_unverified',quoteId:id(6),claimId:id(7),revision:2,paymentOptionId:id(8)}),sql:capture({clientId:id(2),quoteId:id(6),quoteVersion:1,claimId:id(7),claimStatus:'submitted_unverified',paymentOptionId:id(8),publishedVersion:0,confirmations:[],servicePeriods:[],publications:[],events:[],deliveries:[]})}};
 return {descriptorBytes,expectedDescriptorSha256:sha(descriptorBytes),binding:b,setupBytes:json(setup),expectedSetupSha256:sha(json(setup)),paymentBytes:json(payment),expectedPaymentSha256:sha(json(payment)),content:{schemaVersion:1,title:'SYNTHETIC PUBLIC UNIT CONTENT',context:{facts:[{visibility:'advisor_only',text:'SYNTHETIC PRIVATE UNIT CONTENT',sources:[]}]}}};
}
function editRaw(input,envelope,key,change){const field=envelope+'Bytes',value=JSON.parse(input[field]);const capture=value.raw[key];const body=JSON.parse(Buffer.from(capture.bytesBase64,'base64'));change(body);const bytes=json(body);capture.bytesBase64=bytes.toString('base64');capture.sha256=sha(bytes);input[field]=json(value);input['expected'+envelope[0].toUpperCase()+envelope.slice(1)+'Sha256']=sha(input[field]);}
function editEnvelope(input,envelope,change){const field=envelope+'Bytes',value=JSON.parse(input[field]);change(value);input[field]=json(value);input['expected'+envelope[0].toUpperCase()+envelope.slice(1)+'Sha256']=sha(input[field]);}
test('complete synthetic byte joins remain observations and never rewrite public descriptor or grant a role',()=>{
 const input=example(),original=Buffer.from(input.descriptorBytes),result=preparePublicationInput(input);
 assert.equal(result.status,'OBSERVATIONS_ONLY');assert.equal(result.genuineAcceptance,'NOT_ASSESSED');
 assert.equal(result.moduleDescriptor.actors.advisor.id,id(4));assert.equal(result.moduleDescriptor.actors.viewer.id,id(5));
 assert.deepEqual(input.descriptorBytes,original);assert.deepEqual(Object.keys(JSON.parse(input.descriptorBytes).actors),['a','b']);
 assert.equal(result.moduleDescriptor.publicationScenario.claimId,id(7));assert.equal(result.diagnosticV1.substitutesForMountedV3,false);
 assert.equal(result.mountedLeg.state,'NOT_EXECUTED_HOLD_PRESERVED');assert.equal(result.phaseOrder.indexOf('approve')<result.phaseOrder.indexOf('verify-payment'),true);
});
const cases=[
 ['unknown top-level authority flag',x=>{x.authorized=true;}],
 ['unknown binding authority flag',x=>{x.binding.authorized=true;}],
 ['wrong descriptor byte hash',x=>{x.expectedDescriptorSha256='0'.repeat(64);} ],
 ['old runtime17b-style closure',x=>{x.binding.runtimeManifestSha256='1'.repeat(64);} ],
 ['foreign source commit',x=>{x.binding.sourceCommit='0'.repeat(40);} ],
 ['missing actual raw SQL reference',x=>editEnvelope(x,'setup',e=>{delete e.raw.sql;})],
 ['capture error',x=>editEnvelope(x,'setup',e=>{e.raw.sql.error='SYNTHETIC capture failure';})],
 ['raw source binding mismatch',x=>editEnvelope(x,'setup',e=>{e.raw.sql.binding.ownerId=id(99);})],
 ['unbound raw bytes',x=>editEnvelope(x,'setup',e=>{e.raw.sql.sha256='0'.repeat(64);})],
 ['unparseable capture date',x=>editEnvelope(x,'setup',e=>{e.raw.sql.capturedAt='unknown';})],
 ['owner identity aliasing A',x=>editRaw(x,'setup','providerOwner',r=>{r.response.body.id=id(2);})],
 ['owner email different from fixed resource convention',x=>editRaw(x,'setup','providerOwner',r=>{r.response.body.email='arbitrary@example.invalid';})],
 ['anonymous provider identity',x=>editRaw(x,'setup','providerOwner',r=>{r.response.body.is_anonymous=true;})],
 ['missing profile',x=>editRaw(x,'setup','sql',r=>{r.profiles.pop();})],
 ['profile deletion underway',x=>editRaw(x,'setup','sql',r=>{r.profiles[0].deletion_started_at=at;})],
 ['viewer with edit right',x=>editRaw(x,'setup','sql',r=>{r.advisors[1].can_edit=true;})],
 ['foreign policy owner',x=>editRaw(x,'setup','sql',r=>{r.policy.owner_actor_id=id(99);})],
 ['wrong initial policy CAS revision',x=>editRaw(x,'setup','sql',r=>{r.policy.revision=3;})],
 ['owner-principal missing',x=>editRaw(x,'setup','sql',r=>{r.principals[0].kind='agent';})],
 ['quote recorded by a different actor',x=>editRaw(x,'payment','quote',r=>{r.actorId=id(5);})],
 ['wrong quote CAS',x=>editRaw(x,'payment','quote',r=>{r.request.expectedRevision=10;})],
 ['claim CAS increments twice',x=>editRaw(x,'payment','claim',r=>{r.response.body.revision=3;})],
 ['claim selected client in payload',x=>editRaw(x,'payment','claim',r=>{r.request.clientId=id(2);})],
 ['quote contains products',x=>editRaw(x,'payment','quote',r=>{r.request.productTotalCents=100;})],
 ['foreign quote version',x=>editRaw(x,'payment','claim',r=>{r.request.quoteVersion=2;})],
 ['option unavailable',x=>editRaw(x,'payment','afterQuote',r=>{r.response.body.quotes[0].paymentOptions[0].available=false;})],
 ['claim references other option',x=>editRaw(x,'payment','claim',r=>{r.response.body.paymentOptionId=id(99);})],
 ['already confirmed payment',x=>editRaw(x,'payment','sql',r=>{r.claimStatus='confirmed';})],
 ['publication already exists',x=>editRaw(x,'payment','sql',r=>{r.publications.push({version:1});})],
 ['outbox event preinserted',x=>editRaw(x,'payment','sql',r=>{r.events.push({id:id(99)});})],
 ['source photo locator',x=>{x.content.context.facts[0].sources.push({sourceId:id(99)});} ],
 ['unknown SQL role flag',x=>editRaw(x,'setup','sql',r=>{r.advisors[0].authorized=true;})],
 ['unknown quote command flag',x=>editRaw(x,'payment','quote',r=>{r.request.authorized=true;})],
 ['view contradicts issued quote amount',x=>editRaw(x,'payment','afterQuote',r=>{r.response.body.quotes[0].serviceCents=9999;})],
 ['legacy/malformed payment response',x=>editRaw(x,'payment','claim',r=>{delete r.response.body.schemaVersion;})],
 ['receipt claims funded service',x=>editRaw(x,'payment','claim',r=>{r.response.body.serviceUnlocked=true;})],
];
for(const [name,corrupt] of cases)test('byte join refuses '+name,()=>{const x=example();corrupt(x);assert.throws(()=>preparePublicationInput(x),/E_M04_/);});
