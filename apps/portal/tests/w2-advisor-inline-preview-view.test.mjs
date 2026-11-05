// Actual advisor/card SSR and actual session with synthetic memory plans only.
// This file never launches a browser, server, Auth write or external provider.
import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createApplicationSession} from '../src/app/session.ts';
import {createAdvisorController} from '../src/features/advisor/controller.ts';
import {loadPreview} from '../src/app/preview.ts';
import {fixture,ids} from './rebuild/advisor-fixture.mjs';
import {mayaPlan} from './rebuild/plan-fixture.mjs';

const output=new URL('../../../.local-artifacts/w2/inline-preview-view-ssr.cjs',import.meta.url);
await mkdir(new URL('.',output),{recursive:true});
const built=await build({absWorkingDir:new URL('..',import.meta.url).pathname,tsconfig:'tsconfig.frontend.json',stdin:{
 contents:`import React from 'react';import{renderToStaticMarkup}from'react-dom/server';import{OverlayProvider}from'./src/ui/index.ts';import{AdvisorWorkspace}from'./src/features/advisor/AdvisorWorkspace.tsx';export * from './src/features/advisor/index.ts';export const render=(props)=>renderToStaticMarkup(React.createElement(OverlayProvider,null,React.createElement(AdvisorWorkspace,props)));`,
 resolveDir:new URL('..',import.meta.url).pathname,loader:'tsx'},outfile:output.pathname,platform:'node',format:'cjs',bundle:true,write:false,loader:{'.css':'empty'}});
const compiled=built.outputFiles[0].contents;
const immutable=new URL(`./inline-preview-view-${createHash('sha256').update(compiled).digest('hex')}.cjs`,output);
try{await writeFile(immutable,compiled,{flag:'wx',mode:0o600});}catch(error){if(error.code!=='EEXIST')throw error;assert.deepEqual(await readFile(immutable),Buffer.from(compiled));}
const api=createRequire(import.meta.url)(immutable.pathname);
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return{promise,resolve};};
async function setup(t,{inline=true,port=true,content}={}){
 const f=fixture({ready:true});let c,p,override=null;const reads=[];
 if(content){const view=f.getView();view.draft.content=content;f.setView(view);}
 const runtime=createApplicationSession({audience:'advisor',locks:{request:async(_n,_o,run)=>run()},fetcher:async(url)=>{
  if(url==='/api/advisor/logout')return Response.json({ok:true});
  assert.equal(url,'/api/advisor/session');
  return Response.json({signedIn:true,ownerId:ids.actor,generation:1,csrf:'SYNTHETIC-inline-SSR',capabilities:{view:true,edit:true,publish:true,confirmPayments:true},idleExpiresAt:'2099-01-01T00:00:00Z',absoluteExpiresAt:'2099-01-02T00:00:00Z'});
 }});
 t.after(()=>{p?.dispose();c?.dispose();runtime.dispose();});await runtime.restore();
 f.options.session=runtime.getSnapshot().boundary;c=createAdvisorController(f.options);await c.open(ids.draft);
 if(inline){
  assert.equal(typeof api.createAdvisorInlinePreviewController,'function');
  const read={async execute(input,options){assert.deepEqual(input,{});reads.push({input,options});const value=await loadPreview(f.options.ports.plans,ids.draft,runtime.getSnapshot().boundary,options);return override?override(value):value;}};
  p=api.createAdvisorInlinePreviewController({runtime,advisor:c,draftId:ids.draft,...(port?{read}:{})});
 }
 const render=(section='decisions')=>api.render({controller:c,inlinePreview:p,navigation:{route:{name:'advisor-editor',draftId:ids.draft,section},navigate(){}}});
 return{f,c,p,runtime,reads,override(fn){override=fn;},html:render,aside(){
  const markup=render();return markup.slice(markup.indexOf('<aside>'),markup.indexOf('</aside>')+8);
 }};
}

// Removing the optional consumer would conceal its unavailable state while
// leaving the full-preview action present; this checks the actual workbench.
test('A02 missing inline composition is honest and retains the actual full-preview action',async t=>{
 const h=await setup(t,{inline:false});const before=h.f.calls.length,markup=h.html();
 assert.match(markup,/inline preview unavailable/);
 assert.match(markup,/id="advisor-preview-open-plan"/);
 assert.equal(h.f.calls.length,before);
 assert.equal(h.f.previews.length,0);
});

test('A02 a missing actual read port stays unavailable without a fabricated shared card',async t=>{
 const h=await setup(t,{port:false});await h.p.refresh();const markup=h.aside();
 assert.match(markup,/inline preview unavailable/);assert.doesNotMatch(markup,/plan-unpublished-card|saved r1/);
 assert.equal(h.reads.length,0);assert.equal(h.f.previews.length,0);
});

test('A02 exact saved empty preview uses the admitted shared card and rendering makes no additional read',async t=>{
 const h=await setup(t);await h.p.refresh();const before=h.f.calls.length,markup=h.aside();
 assert.match(markup,/saved r1/);assert.match(markup,/plan-unpublished-card/);assert.match(markup,/no decision in this draft/);
 assert.doesNotMatch(markup,/approve product|approve decision|published at|start not recorded/);
 assert.equal(h.f.calls.length,before);assert.equal(h.f.previews.length,0);
});

test('A02 a saved draft with decisions requires a deliberate selection and never auto-previews the first product',async t=>{
 const h=await setup(t,{content:structuredClone(mayaPlan().plan.content)});await h.p.refresh();const markup=h.aside();
 assert.match(markup,/decision to preview/);assert.match(markup,/select a decision to preview/);
 const card=markup.slice(markup.indexOf('plan-unpublished-card'));
 assert.doesNotMatch(card,/approve product|approve decision|Azelaic Acid|recorded choice/);
 assert.equal(h.f.previews.length,0);
});

test('A02 loading and dirty states hide the old card while preserving manual authoring',async t=>{
 const h=await setup(t);await h.p.refresh();const wait=deferred(),entered=deferred();t.after(()=>wait.resolve());
 h.override(async value=>{entered.resolve();await wait.promise;return value;});const reading=h.p.refresh();await entered.promise;
 assert.match(h.aside(),/loading saved preview/);assert.doesNotMatch(h.aside(),/plan-unpublished-card/);
 wait.resolve();await reading;h.c.edit(content=>({...content,title:'SYNTHETIC unsaved inline source'}));const before=h.reads.length;
 await h.p.refresh();assert.match(h.aside(),/save changes to refresh the preview/);assert.doesNotMatch(h.aside(),/plan-unpublished-card|SYNTHETIC unsaved inline source/);
 assert.equal(h.reads.length,before);assert.equal(h.c.getSnapshot().local.title,'SYNTHETIC unsaved inline source');
});

test('A02 denied reads remove the shared card without disguising the denial as an empty saved draft',async t=>{
 const h=await setup(t);await h.p.refresh();h.override(()=>{throw{status:403};});await h.p.refresh();const markup=h.aside();
 assert.match(markup,/inline preview unavailable with current access/);assert.doesNotMatch(markup,/plan-unpublished-card|no decision in this draft|saved r1/);
});

test('A02 offline and retired sessions remove the compact preview and expose only applicable recovery',async t=>{
 const h=await setup(t);await h.p.refresh();h.runtime.cookie.suspend();
 assert.match(h.aside(),/inline preview is offline/);assert.match(h.aside(),/check preview connection/);assert.doesNotMatch(h.aside(),/plan-unpublished-card/);
 await h.p.checkConnection();assert.match(h.aside(),/no decision in this draft/);
 await h.runtime.signOut();assert.equal(h.p.getSnapshot().phase,'ended');assert.doesNotMatch(h.html(),/plan-unpublished-card/);
});

test('A02 a foreign session record renders an unavailable state rather than a card or a guessed empty preview',async t=>{
 const h=await setup(t);h.override(value=>({...value,sessionKey:'foreign-boundary'}));await h.p.refresh();const markup=h.aside();
 assert.match(markup,/saved preview unavailable/);assert.doesNotMatch(markup,/plan-unpublished-card|no decision in this draft/);
});
