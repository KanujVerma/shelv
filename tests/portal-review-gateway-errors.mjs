import assert from 'node:assert/strict';
import {ClientProvider} from '../apps/portal/session-integration/runtime/server/client-upstream.ts';
import {SupabaseProvider} from '../apps/portal/session-integration/runtime/server/upstream.ts';
import {safeError} from '../apps/portal/session-integration/runtime/server/policy.ts';
const id='10000000-0000-4000-8000-000000000003';
globalThis.fetch=async()=>{throw Error('external_network_forbidden');};
const credentials={access_token:'synthetic-access',refresh_token:'synthetic-refresh',expires_at:9999999999,user:{id},providerSessionId:id};
const cases=[['content_version_required','content_version_required'],['concierge_content_version_required','content_version_required'],['concierge_unrecognized_private_error','unavailable'],['concierge_guidance_version_required','unavailable']];
for(const [code,expected] of cases){
 let calls=0;
 const provider=new ClientProvider('sb_publishable_synthetic',async(input,init)=>{calls++;assert.ok(String(input).endsWith('/functions/v1/concierge-checkins'));assert.equal(new Headers(init.headers).get('authorization'),'Bearer synthetic-access');return new Response(JSON.stringify({code,retryable:false}),{status:409,headers:{'content-type':'application/json'}});});
 await assert.rejects(provider.perform(credentials,{view:true,edit:false,publish:false,confirmPayments:false},{kind:'command',channel:'checkins',command:{action:'client_read'}}),error=>{assert.deepEqual(safeError(error),{status:409,code:expected});return true;});
 assert.equal(calls,1);
 console.log(`Verified gateway input ${code}`);
}
class JsonProbe extends SupabaseProvider {run(){return this.json('https://synthetic.invalid/rest/v1/rpc/fixed','synthetic-access',{});}}
for(const [code,expected] of cases){const provider=new JsonProbe('sb_publishable_synthetic',async()=>new Response(JSON.stringify({code,privateNote:'PRIVATE_ERROR_CANARY',sql:'PRIVATE_SQL_CANARY'}),{status:409}));await assert.rejects(provider.run(),error=>{assert.deepEqual(safeError(error),{status:409,code:expected});assert.ok(!JSON.stringify(error).includes('CANARY'));return true;});}
const malformed=new JsonProbe('sb_publishable_synthetic',async()=>new Response('PRIVATE_MALFORMED_CANARY',{status:409}));await assert.rejects(malformed.run(),error=>{assert.deepEqual(safeError(error),{status:503,code:'unavailable'});assert.ok(!JSON.stringify(error).includes('CANARY'));return true;});
console.log('Actual retained gateway normalization: 9 vectors passed; global external fetch DENIED; exact one-alias source change only');
