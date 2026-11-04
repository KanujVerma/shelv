// Pure callback recovery with the actual session/controller and a fixed read seam.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createApplicationSession} from '../src/app/session.ts';
import {createAdvisorClientWorkspaceController} from '../src/features/advisor/client-workspace/controller.ts';
const actor='10000000-0000-4000-8000-000000000004',clientId='10000000-0000-4000-8000-000000000002';
test('a loading observer may change a local filter without stranding the scoped read',async t=>{
 const runtime=createApplicationSession({audience:'advisor',locks:{request:async(_n,_o,run)=>run()},fetcher:async(url)=>{assert.equal(url,'/api/advisor/session');return Response.json({signedIn:true,ownerId:actor,generation:1,csrf:'SYNTHETIC-local-filter',capabilities:{view:true,edit:true,publish:false,confirmPayments:false},idleExpiresAt:'2099-01-01T00:00:00Z',absoluteExpiresAt:'2099-01-02T00:00:00Z'});}});let c;t.after(()=>{c?.dispose();runtime.dispose()});await runtime.restore();
 const calls=[];c=createAdvisorClientWorkspaceController({runtime,clientId,readPlans:{async execute(input){calls.push(input);return{nextCursor:null,drafts:[],publications:[]};}}});
 const off=c.subscribe(()=>{const s=c.getSnapshot();if(s.phase==='loading'&&s.filter==='')c.setFilter('local filter');});t.after(off);
 await c.refresh();const s=c.getSnapshot();assert.deepEqual({calls:calls.length,phase:s.phase,filter:s.filter},{calls:1,phase:'ready',filter:'local filter'});
});

async function observed(t,change){
 const runtime=createApplicationSession({audience:'advisor',locks:{request:async(_n,_o,run)=>run()},fetcher:async(url)=>{assert.equal(url,'/api/advisor/session');return Response.json({signedIn:true,ownerId:actor,generation:1,csrf:'SYNTHETIC-local-retirement',capabilities:{view:true,edit:true,publish:false,confirmPayments:false},idleExpiresAt:'2099-01-01T00:00:00Z',absoluteExpiresAt:'2099-01-02T00:00:00Z'});}});let c;t.after(()=>{c?.dispose();runtime.dispose()});await runtime.restore();const calls=[];
 c=createAdvisorClientWorkspaceController({runtime,clientId,readPlans:{async execute(input){calls.push(input);return{nextCursor:null,drafts:[],publications:[]};}}});
 const off=c.subscribe(()=>{const s=c.getSnapshot();if(s.phase==='loading'&&s.filter===''){c.setFilter('local filter');change(runtime);}});t.after(off);await c.refresh();return{runtime,c,calls};
}
test('a filter callback followed by actual session retirement still prevents dispatch',async t=>{const h=await observed(t,r=>r.cookie._end());assert.equal(h.calls.length,0);assert.equal(h.c.getSnapshot().phase,'ended');assert.equal(h.c.getSnapshot().directory,null);});
test('a filter callback followed by actual suspension still prevents dispatch',async t=>{const h=await observed(t,r=>r.cookie.suspend());assert.equal(h.calls.length,0);assert.equal(h.c.getSnapshot().phase,'offline');assert.equal(h.c.getSnapshot().directory,null);});
test('connection recovery continues its owned read after a harmless local filter callback',async t=>{
 const h=await observed(t,()=>{});h.calls.length=0;h.runtime.cookie.suspend();assert.equal(h.c.getSnapshot().phase,'offline');
 const off=h.c.subscribe(()=>{const s=h.c.getSnapshot();if(s.phase==='idle'&&s.filter==='')h.c.setFilter('restored filter');});t.after(off);await h.c.checkConnection();assert.deepEqual({calls:h.calls.length,phase:h.c.getSnapshot().phase,filter:h.c.getSnapshot().filter},{calls:1,phase:'ready',filter:'restored filter'});
});
