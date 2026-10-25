import assert from 'node:assert/strict';
import test from 'node:test';
import {parseCommand} from '../server/policy';
import {parseClientCommand} from '../server/client-policy';
import {createCookieRequest} from '../adapter/advisor-cookie-session.js';
import {SupabaseProvider} from '../server/upstream';
const clientId='10000000-0000-4000-8000-000000000001',requestId='10000000-0000-4000-8000-000000000002';
test('only advisor admission channel accepts fixed capability/status/add commands',()=>{
 const add={action:'add_client',requestId,email:'client@example.com',displayName:'Example'};
 assert.equal(parseCommand('admission' as any,add).kind,'command');
 assert.equal(parseCommand('admission' as any,{action:'capabilities'}).kind,'command');
 assert.throws(()=>parseClientCommand('admission' as any,add),/action_forbidden/);
 assert.throws(()=>parseCommand('operations',add),/action_forbidden/);
 for(const extra of [{sendEmail:true},{clientId},{emailConfirmed:true},{role:'founder'}])assert.throws(()=>parseCommand('admission' as any,{...add,...extra}));
});
test('reply dispatch requires edit capability; admission authority stays in the dedicated endpoint',async()=>{
 let calls=0;const provider=new SupabaseProvider('sb_publishable_synthetic',async input=>{calls++;assert.match(String(input),/\/functions\/v1\/concierge-(checkins|admission)$/);return Response.json({ok:true});});
 const credentials={access_token:'synthetic-access',refresh_token:'synthetic-refresh',expires_at:Date.now()/1000+3600,user:{id:clientId},providerSessionId:requestId};
 const caps={view:true,edit:false,publish:false,confirmPayments:false};
 const operation={kind:'command' as const,channel:'checkins' as const,command:{action:'send_advisor_reply',clientId,checkinId:clientId,requestId,expectedRevision:0,reply:'A clear next step.'}};
 await assert.rejects(()=>provider.perform(credentials,caps,operation),/forbidden/);assert.equal(calls,0);
 await provider.perform(credentials,{...caps,edit:true},operation);assert.equal(calls,1);
 await provider.perform(credentials,caps,{kind:'command',channel:'admission',command:{action:'capabilities'}});assert.equal(calls,2);
});
test('client-visible reply is advisor-only with exact server-owned author/time boundary',async()=>{
 const reply={action:'send_advisor_reply',clientId,checkinId:clientId,requestId,expectedRevision:0,reply:'A clear next step.'};
 assert.equal(parseCommand('checkins',reply).kind,'command');assert.throws(()=>parseClientCommand('checkins',reply),/action_forbidden/);
 for(const extra of [{authorId:clientId},{createdAt:'2026-10-24'},{note:'private'}])assert.throws(()=>parseCommand('checkins',{...reply,...extra}));
 const calls:unknown[]=[];const session={acquire:async()=>({csrf:'test'}),isCurrent:()=>true,_fetch:async(channel:string,data:unknown)=>{calls.push({channel,data});return{};}};
 await createCookieRequest('admission',session)({action:'capabilities'});await createCookieRequest('checkins',session)(reply);assert.equal(calls.length,2);
});
