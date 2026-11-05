import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture,load,client,draftId,receipt,index,detail,components,deferred} from './w5-orders-commerce-admin-helper.mjs';
const {createProductQuoteAdminController}=await load('apps/portal/src/features/orders/admin/controller.ts');
async function setup(t){const f=await fixture(t),c=createProductQuoteAdminController({runtime:f.runtime,clientId:client,request:f.request});t.after(()=>c.dispose());await c.refresh();await c.openDraft(draftId);return {...f,c};}
test('removing a working draft product is local only and invalidates a late product selection',async t=>{
 const f=await setup(t),before=f.calls.length,hold=deferred(),selection=f.c.chooseProduct('line-a',()=>hold.promise);assert.equal(typeof f.c.removeLine,'function');assert.equal(f.c.removeLine('line-a'),true);hold.release(null);assert.equal(await selection,false);assert.deepEqual(f.c.getSnapshot().preparation.body.lineIds,[]);assert.equal(f.c.getSnapshot().preparation.lines.length,0);assert.equal(f.c.getSnapshot().dirty,true);assert.equal(f.calls.length,before);assert.equal(f.c.reviewIssue(),false);
});
test('explicit discard restores canonical fields and removes half-typed buffers without a write',async t=>{
 const f=await setup(t),before=f.calls.length;f.c.setHeaderInputs({...f.c.getSnapshot().inputs.header,taxAmount:'1.'});assert.equal(f.c.discardLocal(),true);assert.equal(f.c.getSnapshot().inputs.header.taxAmount,'0.00');assert.equal(f.c.getSnapshot().inputErrors.header,null);assert.equal(f.c.getSnapshot().dirty,false);assert.equal(f.calls.length,before);
});
async function issued(t){const f=await setup(t);let paidHead=11;
 f.setReply(async command=>{if(command.action==='issue_product_quote_v1'){paidHead=12;return Response.json(await receipt(command));}const result=command.action==='read_advisor_commerce_v1'?index():command.action==='read_advisor_commerce_detail_v1'?detail():components(command);result.snapshot.paymentRevision=paidHead;return Response.json(result);});
 assert.equal(f.c.reviewIssue(),true);await f.c.issueQuote();assert.equal(f.c.getSnapshot().receipt.action,'issue_product_quote_v1');return f;
}
test('issued navigation carries only the strict immutable quote target on explicit action',async t=>{
 const f=await issued(t),before=f.calls.length,targets=[];assert.equal(f.c.openIssuedQuote(),false);assert.equal(f.c.openIssuedQuote(value=>targets.push(value)),true);assert.equal(targets.length,1);assert.deepEqual(Object.keys(targets[0]).sort(),['quoteId','quoteVersion','termsHash']);assert.equal(Object.isFrozen(targets[0]),true);assert.equal(f.calls.length,before);assert.equal(f.c.getSnapshot().receipt.action,'issue_product_quote_v1');
});
test('issued navigation is unavailable after actual runtime retirement and cannot return successful custody after callback retirement',async t=>{
 const f=await issued(t);assert.equal(f.c.openIssuedQuote(()=>f.runtime.cookie.suspend()),false);let count=0;assert.equal(f.c.openIssuedQuote(()=>count++),false);assert.equal(count,0);
});
test('an unresolved write blocks local discard and product removal',async t=>{
 const f=await setup(t);f.setReply(async()=>Response.json({error:'service_unavailable'},{status:503}));await f.c.saveDraft();assert.ok(f.c.getSnapshot().pending);assert.equal(f.c.discardLocal(),false);assert.equal(f.c.removeLine('line-a'),false);assert.equal(f.c.getSnapshot().preparation.lines.length,1);
});
