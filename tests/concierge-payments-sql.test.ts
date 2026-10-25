/** Explicitly opt-in synthetic HTTP→native SQL fixture. No hosted Auth or Storage HTTP. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {handlePaymentRequest,type PaymentPorts,type PaymentBackendCall} from '../supabase/functions/concierge-payments/handler.ts';

const DB='derive_disposable_concierge_payments_20261019_01';
const MARKER='Synthetic payment feature HTTP SQL fixture only 20261019';
const lit=(value:unknown)=>"'"+String(value).replaceAll("'","''")+"'";
const env={...Object.fromEntries(Object.entries(process.env).filter(([key])=>!key.startsWith('PG'))),PGPASSFILE:'/tmp/shelv-payment-disabled-pgpass-never-create',PGSERVICEFILE:'/dev/null',PGCONNECT_TIMEOUT:'5',PGAPPNAME:'synthetic-payment-http-sql',NODE_ENV:process.env.NODE_ENV??'test'};
function sql(query:string){
 const result=spawnSync('/opt/homebrew/opt/postgresql@15/bin/psql',['-X','-w','-h','/tmp/derive-storage-20261015-01','-p','52819','-U','postgres','-d',DB,'-Atq','-v','ON_ERROR_STOP=1','-c',query],{env,encoding:'utf8',timeout:20000});
 if(result.error)throw result.error;return result;
}
function ok(query:string){const result=sql(query);assert.equal(result.status,0,result.stderr);return result.stdout.trim();}
const signature:Record<string,readonly string[]>={
 concierge_payment_view:['p_client_id'],concierge_payment_write:['p_client_id','p_action','p_expected_revision','p_request_id','p_payload'],
 concierge_payment_evidence_reserve:['p_client_id','p_request_id','p_expected_revision','p_quote_id','p_quote_version','p_content_type','p_size_bytes','p_sha256'],
 concierge_payment_evidence_commit:['p_evidence_id','p_request_id'],concierge_payment_evidence_access:['p_evidence_id']
};
function invoke(actor:string,name:string,args:unknown[]){
 assert.match(actor,/^[a-f0-9-]{36}$/);assert.match(name,/^concierge_[a-z_]+$/);
 return sql(`begin;set local role authenticated;set local request.jwt.claim.sub=${lit(actor)};select public.${name}(${args.map(value=>typeof value==='object'&&value!==null?lit(JSON.stringify(value))+'::jsonb':lit(value)).join(',')});commit;`);
}
function rawCall(actor:string,name:string,args:unknown[]){const result=invoke(actor,name,args);assert.equal(result.status,0,result.stderr);return JSON.parse(result.stdout.trim().split('\n').reverse().find(line=>line.startsWith('{')||line.startsWith('['))!);}

test('synthetic HTTP→SQL enforces prepublication service, immutable bank settlement, private shipping and evidence', {skip:process.env.CONCIERGE_PAYMENTS_NATIVE_SQL!=='1'},async()=>{
 // Verify marker before any write. Fresh random IDs retain prior synthetic runs; no truncate/reset/drop.
 assert.equal(ok("select current_database()||'|'||shobj_description(oid,'pg_database') from pg_database where datname=current_database()"),`${DB}|${MARKER}`);
 const [client,other,advisor,editor]=Array.from({length:4},()=>randomUUID());
 ok(`insert into auth.users(id,is_anonymous) values ${[client,other,advisor,editor].map(id=>`(${lit(id)},false)`).join(',')}`);
 ok(`insert into concierge.enrollments(client_id,display_name,status) values (${lit(client)},'Synthetic payment client','active'),(${lit(other)},'Synthetic unrelated client','active')`);
 ok(`insert into concierge.advisors(user_id,active,can_view,can_edit,can_publish,can_confirm_payments) values (${lit(advisor)},true,true,true,true,true),(${lit(editor)},true,true,true,false,false)`);
 const tokens:Record<string,string>={client,other,advisor,editor},objects=new Map<string,Uint8Array>();let signs=0,onUpload:(()=>void)|undefined;
 const ports:PaymentPorts={allowedOrigins:[],authenticate:async token=>tokens[token]?{id:tokens[token],is_anonymous:false}:null,
  rpc:async(token,call)=>{
   assert.ok(Object.hasOwn(signature,call.name));const args=call.args as Record<string,unknown>;
   const result=invoke(tokens[token],call.name,signature[call.name].map(key=>args[key]));
   if(result.status!==0){const code=/ERROR:\s+(concierge_[a-z_]+)/.exec(result.stderr)?.[1];return {data:null,error:{message:code??'fixture_rpc_failed'}};}
   return {data:JSON.parse(result.stdout.trim().split('\n').reverse().find(line=>line.startsWith('{')||line.startsWith('['))!),error:null};
  },storage:{upload:async(path,bytes,contentType)=>{
   if(objects.has(path)){assert.deepEqual(bytes,objects.get(path));return;}objects.set(path,bytes.slice());
   // Metadata-only adapter exercises SQL completion. This is not native Storage HTTP evidence.
   ok(`insert into storage.objects(bucket_id,name,metadata) values ('concierge-payment-evidence',${lit(path)},${lit(JSON.stringify({size:bytes.length,mimetype:contentType}))}::jsonb)`);onUpload?.();
  },sign:async(_path,ttl)=>{assert.equal(ttl,60);signs++;return 'https://synthetic.invalid/private?token=synthetic';}}};
 async function http(token:string,command:unknown,status=200){
  const multipart=command instanceof FormData;const response=await handlePaymentRequest(new Request('https://synthetic.invalid/payments',{method:'POST',headers:{authorization:`Bearer ${token}`,...(multipart?{}:{'content-type':'application/json'})},body:multipart?command as FormData:JSON.stringify(command)}),ports);
  const body=await response.json();assert.equal(response.status,status,JSON.stringify(body));return body as any;
 }
 const write=(token:string,action:string,expectedRevision:number,payload:Record<string,unknown>,requestId=randomUUID(),status=200)=>http(token,{action,requestId,expectedRevision,...(['issue_quote','confirm_payment','reject_claim'].includes(action)?{clientId:client}:{}),...payload},status);
 const read=()=>http('client',{action:'client_read'});
 const quoteMoney={publicationVersion:0,serviceCents:10000,servicePeriod:null,shippingAddressVersion:null,items:[],productSubtotalCents:0,taxCents:0,shippingCents:0,productTotalCents:0,totalCents:10000};
 const issued=await write('advisor','issue_quote',0,quoteMoney),quote=(await read()).quotes[0];
 const basis={quoteId:issued.quoteId,quoteVersion:quote.version,serviceCents:10000,productCents:0,totalCents:10000,shippingAddressVersion:null};
 await write('other','submit_claim',0,{...basis,evidenceId:null},randomUUID(),404);
 const claim=await write('client','submit_claim',1,{...basis,evidenceId:null});assert.equal(claim.status,'submitted_unverified');assert.equal((await read()).service.status,'unpaid');
 const confirmId=randomUUID(),payload={...basis,claimId:claim.claimId,bankReceiptVerified:true};
 await write('editor','confirm_payment',2,payload,randomUUID(),403);
 const confirmed=await write('advisor','confirm_payment',2,payload,confirmId);assert.equal(confirmed.serviceUnlocked,false);assert.equal(confirmed.serviceAccessStatus,'pending_publication');
 assert.deepEqual(await write('advisor','confirm_payment',2,payload,confirmId),confirmed);
 await write('advisor','confirm_payment',2,{...payload,totalCents:10001},confirmId,400);
 const replayConflict=await write('advisor','confirm_payment',2,{...payload,quoteVersion:basis.quoteVersion+1},confirmId,409);assert.equal(replayConflict.code,'concierge_request_conflict');
 await write('advisor','confirm_payment',3,payload,randomUUID(),409);
 assert.equal((await read()).service.period,null);
 // Core plan setup uses its real RPC, not a second payment model.
 const coreWrite=(actor:string,stream:string,action:string,revision:number,payload:unknown,targetClient=client)=>rawCall(actor,`concierge_${stream}`,[targetClient,action,revision,randomUUID(),payload]);
 const recommendation={id:'synthetic-moisturizer',slot:'moisturizer',currentProductId:'original',proposedProductId:'replacement',priceCents:1600,currency:'USD',rationale:'Synthetic public rationale'};
 coreWrite(advisor,'advisor_write','save_intake',0,{goal:'Comfort',note:'SYNTHETIC_HEALTH_CANARY',baseline:[{slot:'moisturizer',productId:'original'}]});
 coreWrite(advisor,'write','save_draft',1,{intakeVersion:1,recommendations:[recommendation],advisorNote:'SYNTHETIC_PRIVATE_NOTE'});coreWrite(advisor,'write','publish',2,{});
 const active=await read();assert.equal(active.service.status,'active');assert.ok(active.service.period);assert.ok(active.nextServicePeriod);assert.equal(active.quotes[0].servicePeriod,null);assert.doesNotMatch(JSON.stringify(active),/HEALTH_CANARY|PRIVATE_NOTE/);
 coreWrite(advisor,'write','save_draft',3,{intakeVersion:1,recommendations:[recommendation],advisorNote:''});coreWrite(advisor,'write','publish',4,{});
 assert.deepEqual((await read()).service,active.service);
 coreWrite(client,'write','decide',5,{version:2,recommendationId:recommendation.id,choice:'approved',reason:''});
 const address={recipientName:'Synthetic Recipient',line1:'100 Synthetic Lane',line2:'',city:'Fixture City',region:'IL',postalCode:'00000',countryCode:'US'};
 assert.equal((await write('client','confirm_shipping_address',3,{address})).addressVersion,1);
 const products={...quoteMoney,publicationVersion:2,serviceCents:0,shippingAddressVersion:1,items:[{recommendationId:recommendation.id,quantity:1,unitPriceCents:1600,lineTotalCents:1600}],productSubtotalCents:1600,taxCents:100,shippingCents:200,productTotalCents:1900,totalCents:1900};
 const unapproved=await write('editor','issue_quote',4,{...products,items:[{...products.items[0],recommendationId:'not-approved'}]},randomUUID(),409);assert.equal(unapproved.code,'concierge_product_not_approved');
 const productIssued=await write('editor','issue_quote',4,products),productQuote=(await read()).quotes.find((q:any)=>q.id===productIssued.quoteId);
 const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=','base64');
 const form=new FormData();form.set('metadata',JSON.stringify({action:'upload_evidence',requestId:randomUUID(),completionRequestId:randomUUID(),expectedRevision:5,quoteId:productQuote.id,quoteVersion:productQuote.version}));form.set('file',new Blob([png],{type:'image/png'}),'synthetic.png');
 const uploaded=await http('client',form);assert.equal(uploaded.status,'uploaded_unverified');assert.equal((await read()).revision,5);assert.equal((await read()).claims.length,1);
 await http('other',{action:'evidence_url',evidenceId:uploaded.evidenceId},403);assert.equal(signs,0);
 assert.equal((await http('advisor',{action:'evidence_url',evidenceId:uploaded.evidenceId})).expiresInSeconds,60);assert.equal(signs,1);
 const productBasis={quoteId:productQuote.id,quoteVersion:productQuote.version,serviceCents:0,productCents:1900,totalCents:1900,shippingAddressVersion:1};
 const sent=await write('client','submit_claim',5,{...productBasis,evidenceId:uploaded.evidenceId});
 const rejection=await write('editor','reject_claim',6,{...productBasis,claimId:sent.claimId,reasonCode:'not_received'});assert.equal(rejection.status,'rejected');
 const resent=await write('client','submit_claim',7,{...productBasis,evidenceId:uploaded.evidenceId});
 const productConfirmId=randomUUID(),productConfirmPayload={...productBasis,claimId:resent.claimId,bankReceiptVerified:true};
 const productConfirm=await write('advisor','confirm_payment',8,productConfirmPayload,productConfirmId);assert.equal(productConfirm.productOrderStatus,'ready_to_purchase');assert.equal(productConfirm.serviceUnlocked,false);
 assert.deepEqual(await write('advisor','confirm_payment',8,productConfirmPayload,productConfirmId),productConfirm);
 const duplicateFunding=await write('editor','issue_quote',9,products,randomUUID(),409);assert.equal(duplicateFunding.code,'concierge_product_already_funded');
 await write('client','confirm_shipping_address',9,{address:{...address,line1:'200 Synthetic Lane'}});
 const changed=await read();assert.equal(changed.shippingAddress.version,2);assert.equal(changed.shippingAddresses[0].address.line1,address.line1);assert.equal(changed.quotes.find((q:any)=>q.id===productQuote.id).shippingAddressVersion,1);
 assert.equal(ok(`select count(*) from concierge.payment_confirmations where client_id=${lit(client)}`),'2');
 assert.equal(ok(`select status from concierge.product_orders where quote_id=${lit(productQuote.id)}`),'ready_to_purchase');
 // Prepaid renewal advances only the invoice anchor; current coverage stays selected.
 const beforeRenewal=await read();assert.equal(beforeRenewal.nextServicePeriod.startOn,beforeRenewal.service.period.endOn);
 const renewal=await write('advisor','issue_quote',10,{...quoteMoney,publicationVersion:2,servicePeriod:beforeRenewal.nextServicePeriod});
 const renewalView=await read(),renewalQuote=renewalView.quotes.find((q:any)=>q.id===renewal.quoteId);
 const renewalBasis={quoteId:renewalQuote.id,quoteVersion:renewalQuote.version,serviceCents:10000,productCents:0,totalCents:10000,shippingAddressVersion:null};
 const renewalClaim=await write('client','submit_claim',11,{...renewalBasis,evidenceId:null});
 await write('advisor','confirm_payment',12,{...renewalBasis,claimId:renewalClaim.claimId,bankReceiptVerified:true});
 const afterRenewal=await read();assert.deepEqual(afterRenewal.service,beforeRenewal.service);assert.equal(afterRenewal.nextServicePeriod.startOn,renewalQuote.servicePeriod.endOn);
 // Funding identity persists across publications, but is not a lifetime SKU ban.
 coreWrite(advisor,'write','save_draft',6,{intakeVersion:1,recommendations:[recommendation],advisorNote:''});coreWrite(advisor,'write','publish',7,{});
 coreWrite(client,'write','decide',8,{version:3,recommendationId:recommendation.id,choice:'approved',reason:''});
 const republishedDuplicate=await write('editor','issue_quote',13,{...products,publicationVersion:3,shippingAddressVersion:2},randomUUID(),409);assert.equal(republishedDuplicate.code,'concierge_product_already_funded');
 const newObligation={...recommendation,id:'synthetic-moisturizer-new-obligation'};
 coreWrite(advisor,'write','save_draft',9,{intakeVersion:1,recommendations:[newObligation],advisorNote:''});coreWrite(advisor,'write','publish',10,{});
 const freshProducts={...products,publicationVersion:4,shippingAddressVersion:2,items:[{...products.items[0],recommendationId:newObligation.id}]};
 const freshApprovalRequired=await write('editor','issue_quote',13,freshProducts,randomUUID(),409);assert.equal(freshApprovalRequired.code,'concierge_product_not_approved');
 coreWrite(client,'write','decide',11,{version:4,recommendationId:newObligation.id,choice:'approved',reason:''});
 // The un-funded, approved obligation isolates stale address enforcement from funding guards.
 const stale=await write('editor','issue_quote',13,{...freshProducts,shippingAddressVersion:1},randomUUID(),409);assert.match(stale.code,/conflict/);
 const freshQuoteReceipt=await write('editor','issue_quote',13,freshProducts),freshQuote=(await read()).quotes.find((q:any)=>q.id===freshQuoteReceipt.quoteId);
 const freshBasis={quoteId:freshQuote.id,quoteVersion:freshQuote.version,serviceCents:0,productCents:1900,totalCents:1900,shippingAddressVersion:2};
 const freshClaim=await write('client','submit_claim',14,{...freshBasis,evidenceId:null});
 const freshPaid=await write('advisor','confirm_payment',15,{...freshBasis,claimId:freshClaim.claimId,bankReceiptVerified:true});assert.equal(freshPaid.productOrderStatus,'ready_to_purchase');
 assert.equal(ok(`select count(*) from concierge.product_orders o join concierge.quotes q on q.id=o.quote_id where q.client_id=${lit(client)}`),'2');
 // A service-only invoice/proof issued after publication survives republishing.
 coreWrite(advisor,'advisor_write','save_intake',0,{goal:'Comfort',note:'',baseline:[{slot:'moisturizer',productId:'original'}]},other);
 coreWrite(advisor,'write','save_draft',1,{intakeVersion:1,recommendations:[recommendation],advisorNote:''},other);coreWrite(advisor,'write','publish',2,{},other);
 const beforeService=await http('other',{action:'client_read'});assert.equal(beforeService.service.status,'unpaid');assert.deepEqual(beforeService.service.period,beforeService.nextServicePeriod);
 const otherQuote=await http('advisor',{action:'issue_quote',clientId:other,requestId:randomUUID(),expectedRevision:0,...quoteMoney,publicationVersion:1,servicePeriod:beforeService.nextServicePeriod});
 const otherView=await http('other',{action:'client_read'}),serviceQuote=otherView.quotes[0];
 onUpload=()=>{coreWrite(advisor,'write','save_draft',3,{intakeVersion:1,recommendations:[recommendation],advisorNote:''},other);coreWrite(advisor,'write','publish',4,{},other);};
 const serviceForm=new FormData();serviceForm.set('metadata',JSON.stringify({action:'upload_evidence',requestId:randomUUID(),completionRequestId:randomUUID(),expectedRevision:1,quoteId:otherQuote.quoteId,quoteVersion:serviceQuote.version}));serviceForm.set('file',new Blob([png],{type:'image/png'}),'synthetic-service.png');
 const serviceProof=await http('other',serviceForm);onUpload=undefined;assert.equal(serviceProof.status,'uploaded_unverified');
 const serviceBasis={quoteId:serviceQuote.id,quoteVersion:serviceQuote.version,serviceCents:10000,productCents:0,totalCents:10000,shippingAddressVersion:null};
 const otherClaim=await http('other',{action:'submit_claim',requestId:randomUUID(),expectedRevision:1,...serviceBasis,evidenceId:serviceProof.evidenceId});
 const otherPaid=await http('advisor',{action:'confirm_payment',clientId:other,requestId:randomUUID(),expectedRevision:2,...serviceBasis,claimId:otherClaim.claimId,bankReceiptVerified:true});assert.equal(otherPaid.serviceUnlocked,true);assert.equal(otherPaid.productOrderStatus,null);
 ok(`update concierge.advisors set can_confirm_payments=false where user_id=${lit(advisor)}`);
 await write('advisor','confirm_payment',2,payload,confirmId,403); // authorization is checked before replay
});
