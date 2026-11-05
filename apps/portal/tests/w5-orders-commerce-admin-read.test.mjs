import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture,load,sourceRoot,actor,client,other,snapshot,index,detail,components,entity,draft,line,option,deferred} from './w5-orders-commerce-admin-helper.mjs';
const module=await load('apps/portal/src/features/orders/admin/quote-read.ts').catch(error=>{if(error.code==='ERR_MODULE_NOT_FOUND'&&error.url?.endsWith('/orders/admin/quote-read.ts'))return {};throw error;});
const fn=name=>{assert.equal(typeof module[name],'function',`missing new canonical quote read ${name}`);return module[name];};
const context={actorId:actor,clientId:client};
test('actual session/cookie/transport loads strict own complete quote index',async t=>{
 const read=fn('readAdminQuoteIndex'),f=await fixture(t);const result=await read(f.request,context);assert.deepEqual(result.entries,index().entries);assert.deepEqual(result.snapshot,snapshot());assert.equal(f.calls.length,1);assert.equal(Object.isFrozen(result.entries),true);
});
test('index traverses pages and never mistakes nonfinal data for complete history',async t=>{
 const read=fn('readAdminQuoteIndex'),f=await fixture(t),cursor=`c:${snapshot().hash}:e0000000-0000-4000-8000-000000000010:1`;
 f.setReply(async c=>Response.json(c.cursor===null?{...index(),nextCursor:cursor}:{...index(),entries:[{...index().entries[0],entity:{kind:'quote_draft',id:'e0000000-0000-4000-8000-000000000011',revision:2}}]}));
 const result=await read(f.request,context);assert.equal(result.entries.length,2);assert.equal(f.calls.length,2);assert.equal(f.calls[1].command.cursor,cursor);assert.deepEqual(f.calls[1].command.snapshot,snapshot());
});
test('index rejects duplicate IDs, changed snapshot and repeated cursors',async t=>{
 const read=fn('readAdminQuoteIndex'),f=await fixture(t),cursor=`c:${snapshot().hash}:e0000000-0000-4000-8000-000000000010:1`;
 for(const second of [index(),{...index(),snapshot:{...snapshot(),revision:20}},{...index(),nextCursor:cursor}]){f.setReply(async c=>Response.json(c.cursor===null?{...index(),nextCursor:cursor}:second));await assert.rejects(read(f.request,context));}
});
test('draft reads exact target plus all line and receiving-option components',async t=>{
 const read=fn('loadAdminQuoteDraft'),f=await fixture(t);const result=await read(f.request,context,{entity:entity(),snapshot:snapshot()});assert.deepEqual(result.draft,draft());assert.deepEqual(result.lines,[line()]);assert.deepEqual(result.options,[option()]);assert.deepEqual(f.calls.map(x=>x.command.action),['read_advisor_commerce_detail_v1','read_advisor_quote_components_v1','read_advisor_quote_components_v1']);assert.equal(Object.isFrozen(result.draft.target),true);
});
test('draft refuses foreign envelope and stale or mismatched entity target',async t=>{
 const read=fn('loadAdminQuoteDraft'),f=await fixture(t);for(const value of [{...detail(),clientId:other},{...detail(),detail:{...draft(),clientId:other}},{...detail(),detail:{...draft(),target:{...draft().target,revision:8}}}]){f.setReply(async()=>Response.json(value));await assert.rejects(read(f.request,context,{entity:entity(),snapshot:snapshot()}));}
});
test('incomplete line collection, wrong target and duplicate component IDs never complete',async t=>{
 const read=fn('loadAdminQuoteDraft'),f=await fixture(t);for(const change of [c=>({...components(c),total:2}),c=>({...components(c),quote:{kind:'draft',target:{...draft().target,contentHash:'d'.repeat(64)}}}),c=>({...components(c),total:2,entries:[line(),line()]})]){f.setReply(async c=>Response.json(c.action==='read_advisor_commerce_detail_v1'?detail():change(c)));await assert.rejects(read(f.request,context,{entity:entity(),snapshot:snapshot()}));}
});
test('known missing draft lines remain incomplete facts rather than invented records',async t=>{
 const read=fn('loadAdminQuoteDraft'),f=await fixture(t);f.setReply(async c=>Response.json(c.action==='read_advisor_commerce_detail_v1'?{...detail(),detail:{...draft(),readyToIssue:false,issues:['missing_line']}}:c.component==='lines'?{...components(c),total:0,entries:[]}:components(c)));
 const result=await read(f.request,context,{entity:entity(),snapshot:snapshot()});assert.deepEqual(result.lines,[]);assert.deepEqual(result.draft.issues,['missing_line']);assert.equal(result.draft.readyToIssue,false);
});
test('retired native signal or deny-only applicability prevents raw read',async t=>{
 const read=fn('readAdminQuoteIndex'),f=await fixture(t),abort=new AbortController();abort.abort();await assert.rejects(read(f.request,context,{signal:abort.signal}));await assert.rejects(read(f.request,context,{isApplicable:()=>false}));assert.equal(f.calls.length,0);
});
test('owner logout while read is pending cannot return private draft or later components',async t=>{
 const read=fn('loadAdminQuoteDraft'),f=await fixture(t),wait=deferred();f.setReply(async()=>wait.promise);const pending=read(f.request,context,{entity:entity(),snapshot:snapshot()});await new Promise(r=>setImmediate(r));f.setLogin({signedIn:false});await f.runtime.restore();wait.release(Response.json(detail()));await assert.rejects(pending);assert.equal(f.calls.length,1);assert.equal(f.runtime.getSnapshot().boundary,null);
});
