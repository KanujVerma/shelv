// Finite source HTTP facts; actual ApplicationSession/cookie/raw Review/Root/
// HistoryController and actual SSR. No DOM/browser/server or successful-port stub.
import assert from 'node:assert/strict';import path from 'node:path';import fs from 'node:fs/promises';import {createRequire} from 'node:module';import {build} from 'esbuild';
import {denialFixture,basis,history,uid,owner,receipt,deferred} from './rebuild-history-denial-helper.mjs';
import {createHistoryController} from '../src/features/history/controller.ts';import {createHistoryPort} from '../src/features/history/port.ts';import {createClientReviewRequest} from '../src/app/review-request.ts';
export {uid,owner,receipt,deferred};
export const area=path.resolve(import.meta.dirname,'../../../.local-artifacts/portal-rebuild/w4-history-restoration',process.env.W4_RESTORATION_RUN??'current');await fs.mkdir(area,{recursive:true});
const portal=path.resolve(import.meta.dirname,'..');await build({absWorkingDir:portal,tsconfig:'tsconfig.frontend.json',entryPoints:['tests/rebuild-history-ssr-entry.tsx'],outfile:path.join(area,'ssr.cjs'),platform:'node',format:'cjs',bundle:true,loader:{'.css':'empty'}});const m=createRequire(import.meta.url)(path.join(area,'ssr.cjs'));
export function row(n){return {kind:'report',event:{kind:'goal_report',id:uid(10000+n),body:{publication:{version:1,documentSchemaVersion:3},answers:[],comfort:null,actualUseEventIds:[],notes:'PRIVATE_RESTORATION_ROW_'+n,photoIds:[]},occurredOn:{state:'unknown'},channel:'portal',reportedBy:owner,recordedBy:owner,recordedAt:'2026-10-20T00:00:00Z'}};}
export async function fixture(t,{count=3,groups}={}){
 const f=await denialFixture(t);let entries=Array.from({length:count},(_,i)=>row(i)),parts=groups??entries.map(e=>[e]),version=1,revision=count,access='active',salt=30000,manifestHash='a'.repeat(64),fault=null;
 const view=()=>{const v=basis(version,revision,'PRIVATE_RESTORATION_PLAN');v.access=access;v.currentGuidance.snapshot.manifestHash=manifestHash;return v;};
 const cursor=i=>`r:${'a'.repeat(64)}:${uid(salt+i)}`;
 function page(c){const index=c.cursor===null?0:Array.from({length:parts.length},(_,i)=>cursor(i+1)).indexOf(c.cursor)+1;assert.ok(index>=0&&index<parts.length,'only an actual current response cursor may be followed');const p=history(version,revision);p.version=c.version;p.entries=parts[index];p.nextCursor=index+1<parts.length?cursor(index+1):null;return p;}
 f.respond(async c=>{const r=await fault?.(c);if(r)return r;return c.action==='read_client_plan_v3'?Response.json(view()):c.action==='read_care_history_v1'?Response.json(page(c)):null;});
 const controllers=[];
 const make=()=>{const boundary=f.runtime.getSnapshot().boundary;const c=createHistoryController({session:boundary,mode:'client',port:createHistoryPort(f.runtime,createClientReviewRequest(f.runtime))});controllers.push(c);return c;};
 t.after(()=>controllers.forEach(c=>c.dispose()));
 return {...f,makeCurrent:make,fault(fn){fault=fn;},data(patch){if(patch.parts)parts=patch.parts;if(patch.version!==undefined)version=patch.version;if(patch.revision!==undefined)revision=patch.revision;if(patch.access!==undefined)access=patch.access;if(patch.salt!==undefined)salt=patch.salt;if(patch.manifestHash!==undefined)manifestHash=patch.manifestHash;},page,view,cursor,
 html(c=f.controller,props={}){return m.renderToStaticMarkup(m.createElement(m.ClientHistory,{controller:c,screen:'history',navigation:{openUpdate(){},back(){},openVersion(){}},...props}));},
 async all(c=f.controller){await c.load();while(c.getSnapshot().pages.at(-1)?.nextCursor)await c.loadMore();},
 async uncertain(c=f.controller){c.startReport();const intent=structuredClone(c.getSnapshot().intent);intent.body.notes='EXACT_UNCERTAIN_RESTORATION_NOTE';c.edit(intent);fault=x=>x.action==='submit_goal_report_v1'?Response.json({code:'unavailable'},{status:503}):null;await c.submit();await f.runtime.restore();fault=null;return {pending:c.getSnapshot().pending,wire:f.calls.find(x=>x.command.action==='submit_goal_report_v1').wire};},
 async observe(name,c=f.controller){await fs.writeFile(path.join(area,name+'.json'),JSON.stringify({state:c.getSnapshot(),html:this.html(c),calls:f.calls},null,2));}
 };
}
