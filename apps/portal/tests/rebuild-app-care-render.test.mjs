import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdir} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {carePlan,summary,owner} from './rebuild/care-fixture.mjs';
import {createApplicationSession} from '../src/app/session.ts';
import {createClientPorts} from '../src/app/ports.ts';
import {createClientPlanController} from '../src/app/client-state.ts';
import {buildRoute} from '../src/navigation/routes.ts';
import {mapCareResult} from '../../../src/contracts/PortalCareMapping.ts';
const area=path.resolve(import.meta.dirname,'../../../.local-artifacts/portal-rebuild/app-care-ssr');await mkdir(area,{recursive:true});
await build({absWorkingDir:path.resolve(import.meta.dirname,'..'),tsconfig:'tsconfig.frontend.json',entryPoints:['tests/rebuild/app-care-ssr-entry.tsx'],outfile:path.join(area,'entry.cjs'),platform:'node',format:'cjs',bundle:true,loader:{'.css':'empty'}});
const m=(await import(pathToFileURL(path.join(area,'entry.cjs')).href)).default,{createElement:h,renderToStaticMarkup:render}=m;
async function setup(t,view=carePlan(),status=200){
 const runtime=createApplicationSession({audience:'client',locks:{request:async(_n,_o,run)=>run()},fetcher:async url=>{
  if(url==='/api/client/session')return Response.json({signedIn:true,ownerId:owner,generation:1,csrf:'care-render-csrf',capabilities:{view:true,edit:false,publish:false,confirmPayments:false},idleExpiresAt:new Date(Date.now()+3600000).toISOString(),absoluteExpiresAt:new Date(Date.now()+7200000).toISOString()});
  assert.equal(url,'/api/client/care');return Response.json(status===200?view:{code:'unavailable'},{status});
 }});await runtime.restore();const boundary=runtime.getSnapshot().boundary,ports=createClientPorts(runtime,{care:true}),controller=createClientPlanController(boundary,ports,{readVersion:2});await controller.refresh();assert.equal(controller.getSnapshot().error,status===200?null:status);t.after(()=>{controller.dispose();runtime.dispose();});
 return {boundary,ports,controller};
}
function clientPage(f,route){
 const navigator={getSnapshot:()=>buildRoute(route),subscribe:()=>()=>{},navigate(){throw Error('unexpected SSR navigation');},back(){},backDestination:()=>({name:'plan',routine:'morning'})};
 return render(h(m.OverlayProvider,null,h(m.NavigationProvider,{navigator},h(m.ClientContent,{...f,route,onSignOut(){}}))));
}
test('actual client application composes an active v2 product use route into the shared form',async t=>{
 const f=await setup(t),productId=f.controller.getSnapshot().view.plan.content.products[0].id;
 const page=clientPage(f,{name:'product-use',productId,routine:'morning'});
 assert.match(page,/what changed\?/);assert.match(page,/is this your product\?/);assert.doesNotMatch(page,/this page is not connected yet/);
});
test('actual client application composes general reported use without a fake product',async t=>{
 const f=await setup(t),page=clientPage(f,{name:'report-use',routine:'evening'});
 assert.match(page,/what changed\?/);assert.doesNotMatch(page,/is this your product\?/);assert.doesNotMatch(page,/this page is not connected yet/);
});
test('actual client use route honors server read-only access',async t=>{
 const view=carePlan();view.access='read_only';const f=await setup(t,view),productId=view.plan.content.products[0].id;
 const page=clientPage(f,{name:'product-use',productId,routine:'morning'});
 assert.match(page,/read-only plan/);assert.doesNotMatch(page,/what changed\?/);assert.doesNotMatch(page,/<form/);assert.doesNotMatch(page,/this page is not connected yet/);
});
test('canonical advisor v2 audit shows reported stops without inventing client entitlement',()=>{
 const client=carePlan(),use=client.use.planProducts[0];use.state='stopped';use.latestEvent=summary(use.product);
 const command={schemaVersion:1,action:'read_advisor_publication_v2',clientId:owner,version:1};
 const view=mapCareResult({schemaVersion:2,clientId:owner,version:1,plan:client.plan,decisionRevision:client.decisionRevision,decisions:client.decisions,actualUse:client.actualUse,nextReviewOn:client.nextReviewOn,reviewSchedule:null,clientAccess:{care:'ended',entitled:false,canRead:false,canWrite:false},use:client.use,latestPublicReview:null},command);
 const page=render(h(m.PublicationAuditRecord,{view}));assert.match(page,/reported stopped/);assert.match(page,/current reported use/);assert.match(page,/ended/);assert.doesNotMatch(page,/record a change in use|view original report/);
});
for(const status of [403,409,503])test('direct care URLs retain first-read '+status+' recovery before any view exists',async t=>{
 const f=await setup(t,carePlan(),status);
 for(const route of [{name:'product-use',productId:'cerave-pm',routine:'evening'},{name:'report-use',routine:'evening'}]){
  const page=clientPage(f,route);assert.match(page,/try again/);assert.match(page,/<h1[^>]*>record actual use<\/h1>/);
  assert.doesNotMatch(page,/this page is not connected yet/);assert.doesNotMatch(page,/<form/);
 }
});
