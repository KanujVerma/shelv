import assert from 'node:assert/strict';
import {randomUUID,randomBytes} from 'node:crypto';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {createMayaSample} from '../site/advisor/maya-sample.js';
import {adaptLegacyPlan,createEmptyPlanContent} from '../../../src/contracts/PortalRebuild.ts';
import {readPlanContent} from '../../../src/contracts/PortalRebuildValidation.ts';
import {providerOrigin} from './rebuild-native-boundary.mjs';
import {selectCareFixture} from './rebuild-care-native-fixture.mjs';

// Retained public synthetic source supplies one real structured product descriptor.
// This creates no catalog/global product and makes no formula/price/recommendation claim.
export function syntheticCareContent() {
  const sample=createMayaSample().clientView.plan;
  const source=adaptLegacyPlan({version:sample.version,presentation:sample.presentation,recommendations:sample.recommendations},2).content;
  const product=structuredClone(source.products.find(p=>p.id==='cerave-pm'));assert.ok(product);
  Object.assign(product,{displayPrice:null,imageUrl:null,identity:'unresolved',formula:'unknown',strength:{state:'unknown'},factIds:['synthetic-none'],guides:[],evidence:[]});
  const content=createEmptyPlanContent();
  content.title='synthetic genuine care verification plan';content.summary='synthetic local software verification only; no actual care, funds, product order or requested use';
  content.context={products:{state:'none',factId:'synthetic-none'},facts:[{id:'synthetic-none',kind:'client_report',visibility:'client',text:'synthetic case reports no current products',sources:[],contradicts:[]},{id:'private',kind:'advisor_conclusion',visibility:'advisor_only',text:'W6_PRIVATE_SYNTHETIC_ONLY',sources:[],contradicts:[]}]};
  content.goals=[{id:'software-only',text:'synthetic software verification',factIds:['synthetic-none']}];content.products=[product];
  const schedule={periods:['morning','evening'],days:{kind:'daily'},condition:'synthetic fixture only',asNeeded:false,stages:[],anchor:'actual_start',automaticAdvance:false};
  content.decisions=[{id:'care-addition',slotId:'care-slot',recommendationId:null,kind:'addition',goalIds:['software-only'],currentProductIds:[],primaryProductId:product.id,alternativeProductIds:[],reason:'synthetic decision for identity/use software verification',directions:['no actual product use is requested'],cautions:['local software test only'],limitations:['no actual recommendation or formula verification'],schedule,factIds:['synthetic-none'],guidance:{title:'synthetic product decision',subtitle:'local verification only',rationaleTitle:'synthetic basis',reasons:[],actions:[],comparisons:[],factsTitle:'',facts:[],how:null,sources:[],group:null,decisionLabels:null}}];
  content.routine=[{id:'care-instruction',slotId:'care-instruction',kind:'instruction',productId:null,title:'synthetic local verification',directions:['do not use a product for this software test'],cautions:[],schedule}];
  content.followUp.criteria=['no actual support or follow-up is scheduled by this local fixture'];
  return readPlanContent(content);
}

// Later grant only. Explicit fresh identities/cases and one new viewer permission, never policy repair/reset.
export async function createCareCases(fixture) {
  selectCareFixture(fixture.selection);assert.equal(process.env.SHELV_REBUILD_CARE_NATIVE,'1');
  const runId=randomUUID(),identities=[],area=path.join(fixture.directory,'edge/w6-care');
  await mkdir(area,{recursive:true,mode:0o700});
  const file=path.join(area,'identities-'+runId+'.private.json');
  for(const kind of ['client','other','viewer']) {
    const identity={kind,email:'w6-care-'+kind+'-'+runId+'@example.invalid',password:randomBytes(32).toString('hex'),displayName:'SYNTHETIC W6 CARE '+kind+' '+runId.slice(0,8)};
    const response=await fetch(providerOrigin+'/auth/v1/admin/users',{method:'POST',redirect:'manual',headers:{apikey:fixture.config.SERVICE_ROLE_KEY,authorization:'Bearer '+fixture.config.SERVICE_ROLE_KEY,'content-type':'application/json'},body:JSON.stringify({email:identity.email,password:identity.password,email_confirm:true}),signal:AbortSignal.timeout(15000)});
    assert.equal(response.status,200,'Explicit local synthetic identity setup required');
    const value=await response.json();assert.match(value.id,/^[0-9a-f-]{36}$/);identity.id=value.id;identities.push(identity);
    await writeFile(file,JSON.stringify({runId,fixtureOwnerId:fixture.selection.ownerId,identities},null,2)+'\n',{mode:0o600});
    assert.equal(fixture.sql(`select count(*) from public.profiles where id='${identity.id}'`),'1','Actual Auth trigger must create the profile');
    // These inserts only initialize this newly returned Auth identity. No ON CONFLICT/UPDATE or old grant reset.
    if(kind==='viewer')fixture.sql(`begin;insert into concierge.advisors(user_id,active,can_view,can_edit,can_publish,can_confirm_payments) values('${identity.id}',true,true,false,false,false);insert into concierge.plan_principals(actor_id,kind) values('${identity.id}','human');commit;`);
    else fixture.sql(`begin;insert into concierge.cases(client_id) values('${identity.id}');insert into concierge.enrollments(client_id,display_name,status) values('${identity.id}','${identity.displayName}','active');commit;`);
  }
  return {runId,file,client:identities[0],other:identities[1],viewer:identities[2]};
}

export function careCaseSnapshot(fixture,clientId) {
  assert.match(clientId,/^[0-9a-f-]{36}$/);
  const tables=['publications','plan_documents','plan_publication_receipts','activations','service_periods','plan_review_schedule','quotes','claims','payment_confirmations','product_orders','care_events','care_use_events','care_reported_products','care_reported_product_versions','care_use_amendments','care_attention','plan_events','plan_deliveries'];
  const rows={};
  for(const table of tables) {
    const query=table==='product_orders'?`select o.* from concierge.product_orders o join concierge.quotes q on q.id=o.quote_id where q.client_id='${clientId}'`:table==='plan_deliveries'?`select d.* from concierge.plan_deliveries d join concierge.plan_events e on e.id=d.event_id where e.client_id='${clientId}'`:table==='care_use_events'?`select u.* from concierge.care_use_events u join concierge.care_events e on e.id=u.event_id where e.client_id='${clientId}'`:table==='care_use_amendments'?`select a.* from concierge.care_use_amendments a join concierge.care_events e on e.id=a.id where e.client_id='${clientId}'`:table==='care_reported_product_versions'?`select v.* from concierge.care_reported_product_versions v join concierge.care_reported_products p on p.id=v.product_id where p.client_id='${clientId}'`:`select * from concierge.${table} where client_id='${clientId}'`;
    rows[table]=JSON.parse(fixture.sql(`select coalesce(jsonb_agg(to_jsonb(x) order by to_jsonb(x)::text),'[]'::jsonb) from (${query}) x`));
  }
  rows.useHead=Number(fixture.sql(`select coalesce((select revision from concierge.care_use_heads where client_id='${clientId}'),0)`));
  return rows;
}
