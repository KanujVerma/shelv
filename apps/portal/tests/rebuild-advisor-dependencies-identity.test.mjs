// CD3: synthetic finite HTTP, actual legacy normalizer/cookie/ports/controller/SSR.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {build} from 'esbuild';
import {cdApp,multiVersion} from './rebuild-advisor-dependencies-cd-helper.mjs';
import {adaptLegacyPlan,projectClientPlan} from '../../../src/contracts/PortalRebuild.ts';
import {dependencyProductIdentity} from '../src/features/advisor/dependencies.ts';
const out=new URL('../../../.local-artifacts/portal-rebuild/coordinator-cd3/ssr.cjs',import.meta.url);
await mkdir(new URL('.',out),{recursive:true});
await build({absWorkingDir:new URL('..',import.meta.url).pathname,tsconfig:'tsconfig.frontend.json',entryPoints:['tests/rebuild-advisor-dependencies-cd-ssr-entry.tsx'],outfile:out.pathname,platform:'node',format:'cjs',bundle:true,loader:{'.css':'empty'}});
const m=(await import(out.href)).default;
const render=c=>m.renderToStaticMarkup(m.createElement(m.DependencyReview,{controller:c,state:c.getSnapshot()}));

function opaque(data){
 for(const [i,id] of data.refs.map(p=>p.productId).entries())data=JSON.parse(JSON.stringify(data).replaceAll(JSON.stringify(id),JSON.stringify(`legacy-opaque-${i?'b73e':'a91f'}`)));
 return data;
}
function namelessR1(){
 const data=multiVersion(),legacy={version:1,recommendations:data.refs.map((p,i)=>({id:`legacy-decision-${i}`,slot:`legacy-slot-${i}`,currentProductId:null,proposedProductId:p.productId,priceCents:100,currency:'USD',rationale:'SYNTHETIC retained R1 reason'})),presentation:null};
 const content=projectClientPlan(adaptLegacyPlan(legacy,1).content);
 data.historical.plan={documentSchemaVersion:1,version:1,publishedAt:data.historical.plan.publishedAt,content,legacyOriginal:legacy};
 data.historical.use.planProducts=content.products.map(p=>({product:{kind:'plan_product',publication:{version:1,documentSchemaVersion:1},productId:p.id,slotId:null},state:'not_reported',originalStart:{state:'unknown'},latestEvent:null,identity:null,contradiction:false}));
 for(const entry of data.entries){entry.event.product.publication.documentSchemaVersion=1;entry.event.sourcePublication.documentSchemaVersion=1;}
 for(const row of data.current.use.planProducts)if(row.latestEvent){row.latestEvent.product.publication.documentSchemaVersion=1;row.latestEvent.sourcePublication.documentSchemaVersion=1;row.state='not_reported';row.contradiction=true;}
 for(const p of data.current.plan.content.products)p.name='CURRENT DESCRIPTOR ONLY '+p.name;
 return opaque(data);
}

test('CD3 actual nameless R1 identities remain readable but cannot authorize acknowledgement',async t=>{
 const data=namelessR1(),h=await cdApp(t,{data});await h.c.inspectDependencies();
 const r=h.c.getSnapshot().dependencies;
 assert.equal(r.status,'unavailable');
 for(const ref of data.refs){const identity=dependencyProductIdentity(ref,r);assert.equal(identity.resolved,false);assert.match(identity.label,new RegExp(ref.productId));assert.match(identity.reason,/product name/);}
 h.c.acknowledgeDependencies(true);assert.equal(h.c.canRebaseDependencies(),false);
 const html=render(h.c);assert.match(html,/SYNTHETIC FIRST PRODUCT COMFORT/);assert.match(html,/SYNTHETIC SECOND PRODUCT IRRITATION/);assert.match(html,/every evening/);assert.match(html,/two pumps/);
 assert.match(html,/<select[^>]*disabled/);assert.match(html,/<button[^>]*disabled[^>]*>update draft basis<\/button>/);
 assert.equal(h.calls.some(x=>x.command.action==='rebase_draft_dependencies_v1'),false);
});
test('known original names with the same opaque IDs still permit deliberate review',async t=>{
 const data=opaque(multiVersion({renamedCurrent:true})),h=await cdApp(t,{data});await h.c.inspectDependencies();
 const r=h.c.getSnapshot().dependencies;assert.equal(r.status,'ready');
 for(const ref of data.refs){const identity=dependencyProductIdentity(ref,r);assert.equal(identity.resolved,true);assert.doesNotMatch(identity.label,/CURRENT ONLY/);}
 h.c.acknowledgeDependencies(true);assert.equal(h.c.canRebaseDependencies(),true);assert.equal(h.calls.some(x=>x.command.action==='rebase_draft_dependencies_v1'),false);
});
for(const name of ['', ' \t\n', '\u00a0\ufeff'])test('a blank historical name is unavailable rather than an opaque-ID fallback '+JSON.stringify(name),async t=>{
 const data=opaque(multiVersion()),h=await cdApp(t,{data});await h.c.inspectDependencies();
 const r=structuredClone(h.c.getSnapshot().dependencies),ref=data.refs[0],p=r.documents[1].products.find(p=>p.id===ref.productId);
 p.name=name;assert.equal(dependencyProductIdentity(ref,r).resolved,false);
});
test('known duplicate names remain distinguishable without a new blanket block',async t=>{
 const data=opaque(multiVersion()),h=await cdApp(t,{data});await h.c.inspectDependencies();
 const r=structuredClone(h.c.getSnapshot().dependencies),products=r.documents[1].products;
 for(const p of products){p.name='SYNTHETIC known product';p.brand=null;p.variant=null;p.strength={state:'unknown'};p.sizeLabel='';}
 const identities=data.refs.map(ref=>dependencyProductIdentity(ref,r));assert.ok(identities.every(x=>x.resolved));assert.notEqual(identities[0].label,identities[1].label);
});
