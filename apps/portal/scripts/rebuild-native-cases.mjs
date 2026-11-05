import assert from 'node:assert/strict';
import {randomBytes, randomUUID} from 'node:crypto';
import {writeFile} from 'node:fs/promises';
import path from 'node:path';
import {providerOrigin, portalOrigin} from './rebuild-native-boundary.mjs';
import {createEmptyPlanContent} from '../../../src/contracts/PortalRebuild.ts';
import {readPlanContent} from '../../../src/contracts/PortalRebuildValidation.ts';

export async function syntheticCases(fixture) {
  const runId=randomUUID(), identities=[];
  const file=path.join(fixture.directory,'edge/w6/identities-'+runId+'.private.json');
  for(const kind of ['client','other','viewer']) {
    const identity={kind,email:'w6-'+kind+'-'+runId+'@example.invalid',password:randomBytes(32).toString('hex'),displayName:'SYNTHETIC W6 '+kind+' '+runId.slice(0,8)};
    const response=await fetch(providerOrigin+'/auth/v1/admin/users',{method:'POST',redirect:'manual',headers:{apikey:fixture.config.SERVICE_ROLE_KEY,authorization:'Bearer '+fixture.config.SERVICE_ROLE_KEY,'content-type':'application/json'},body:JSON.stringify({email:identity.email,password:identity.password,email_confirm:true})});
    assert.equal(response.status,200,'Local synthetic identity setup must succeed');
    const value=await response.json();assert.match(value.id,/^[0-9a-f-]{36}$/);identity.id=value.id;identities.push(identity);
    await writeFile(file,JSON.stringify({runId,identities},null,2)+'\n',{mode:0o600});
    if(kind==='viewer')fixture.sql(`begin;insert into public.profiles(id) values('${identity.id}') on conflict do nothing;insert into concierge.advisors(user_id,active,can_view,can_edit,can_publish,can_confirm_payments) values('${identity.id}',true,true,false,false,false);insert into concierge.plan_principals(actor_id,kind) values('${identity.id}','human');commit;`);
    else fixture.sql(`begin;insert into public.profiles(id) values('${identity.id}') on conflict do nothing;insert into concierge.cases(client_id) values('${identity.id}');insert into concierge.enrollments(client_id,display_name,status) values('${identity.id}','${identity.displayName}','active');commit;`);
  }
  return {runId,file,client:identities[0],other:identities[1],viewer:identities[2]};
}

export function syntheticContent() {
  const content=createEmptyPlanContent();
  Object.assign(content,{title:'synthetic browser verification plan',summary:'local interface verification only; no skincare advice or purchases'});
  content.context={products:{state:'none',factId:'none'},facts:[
    {id:'none',kind:'client_report',visibility:'client',text:'synthetic case has no current products',sources:[],contradicts:[]},
    {id:'private',kind:'advisor_conclusion',visibility:'advisor_only',text:'W6_PRIVATE_SYNTHETIC_ONLY',sources:[],contradicts:[]},
  ]};
  content.goals=[{id:'fixture',text:'synthetic interface verification',factIds:['none']}];
  content.followUp.criteria=['this is a local software fixture; no real care or follow-up is scheduled'];
  content.decisions=[{id:'no-addition',slotId:'none',recommendationId:null,kind:'no_addition',goalIds:['fixture'],currentProductIds:[],primaryProductId:null,alternativeProductIds:[],reason:'no product addition in this synthetic fixture',directions:['no purchase or product use is requested'],cautions:['software verification only'],limitations:['not a real client plan'],schedule:null,factIds:['none'],guidance:{title:'synthetic no addition decision',subtitle:'local verification',rationaleTitle:'fixture basis',reasons:[],actions:[],comparisons:[],factsTitle:'',facts:[],how:null,sources:[],group:null,decisionLabels:null}}];
  content.routine=Array.from({length:20},(_,n)=>({id:'instruction-'+n,slotId:'fixture-'+n,kind:'instruction',productId:null,title:'synthetic interface instruction '+(n+1),directions:['local test content only; no product or skincare action'],cautions:[],schedule:{periods:['morning','evening'],days:{kind:'daily'},condition:null,asNeeded:false,stages:[],anchor:'actual_start',automaticAdvance:false}}));
  return readPlanContent(content);
}

export async function closeProviderSession(fixture,item) {
  assert.match(item.id,/^[0-9a-f-]{36}$/);
  if(fixture.sql(`select count(*) from auth.sessions where id='${item.id}'`)!=='0') {
    const response=await fetch(providerOrigin+'/auth/v1/logout?scope=local',{method:'POST',redirect:'manual',headers:{apikey:fixture.config.PUBLISHABLE_KEY,authorization:'Bearer '+item.token}});
    assert.ok([200,204].includes(response.status),'Supported local provider logout required');
  }
  assert.equal(fixture.sql(`select count(*) from auth.sessions where id='${item.id}'`),'0');
  assert.equal(fixture.sql(`select count(*) from auth.refresh_tokens where session_id='${item.id}'`),'0');
  item.closed=true;
}

export async function prepareSyntheticClaim(fixture,stack,client) {
  const temporary=[];
  try {
    async function password(identity) {
      const response=await fetch(providerOrigin+'/auth/v1/token?grant_type=password',{method:'POST',redirect:'manual',headers:{apikey:fixture.config.PUBLISHABLE_KEY,'content-type':'application/json'},body:JSON.stringify({email:identity.email,password:identity.password})});
      assert.equal(response.status,200);const session=await response.json();stack.remember(session);
      const claims=JSON.parse(Buffer.from(session.access_token.split('.')[1],'base64url').toString());
      const item=stack.issued.get(claims.session_id);temporary.push(item);return item;
    }
    const owner=await password(fixture.owner), payer=await password(client);
    async function payment(actor,command) {
      const response=await fetch('http://127.0.0.1:57442/',{method:'POST',redirect:'manual',headers:{origin:portalOrigin,authorization:'Bearer '+actor.token,'content-type':'application/json'},body:JSON.stringify({schemaVersion:2,...command})});
      assert.equal(response.status,200,'Genuine canonical payment API must accept synthetic setup');return response.json();
    }
    const initial=await payment(owner,{action:'advisor_read',clientId:client.id});
    const quote=await payment(owner,{action:'issue_quote',requestId:randomUUID(),expectedRevision:initial.revision,clientId:client.id,publicationVersion:0,serviceCents:10000,servicePeriod:null,shippingAddressVersion:null,items:[],productSubtotalCents:0,taxCents:0,shippingCents:0,productTotalCents:0,totalCents:10000});
    const finances=await payment(owner,{action:'advisor_read',clientId:client.id});
    const option=finances.quotes.find(q=>q.id===quote.quoteId).paymentOptions.find(o=>o.available);assert.ok(option);
    const basis={quoteId:quote.quoteId,quoteVersion:1,serviceCents:10000,productCents:0,totalCents:10000,shippingAddressVersion:null,paymentOptionId:option.id};
    const claim=await payment(payer,{action:'submit_claim',requestId:randomUUID(),expectedRevision:quote.revision,...basis,evidenceId:null});
    return {quoteId:quote.quoteId,claimId:claim.claimId,paymentOptionId:option.id,temporarySessionIds:temporary.map(x=>x.id)};
  } finally {
    const failures=[];
    for(const item of temporary) {try{await closeProviderSession(fixture,item);}catch{failures.push(item.id);}}
    assert.deepEqual(failures,[],'All temporary payment setup sessions must close without touching browser sessions');
  }
}
