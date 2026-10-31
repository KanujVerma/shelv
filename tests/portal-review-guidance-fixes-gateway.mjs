// Consume actual owned-handler SQL fence responses through retained gateway code.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ClientProvider} from '../apps/portal/session-integration/runtime/server/client-upstream.ts';
import {SupabaseProvider} from '../apps/portal/session-integration/runtime/server/upstream.ts';
import {safeError} from '../apps/portal/session-integration/runtime/server/policy.ts';
globalThis.fetch=async()=>{throw Error('external_network_forbidden');};
const cases=JSON.parse(readFileSync(new URL('../.local-artifacts/portal-rebuild/w1-review/m60-rg2-gateway-input.json',import.meta.url),'utf8'));
const id='10000000-0000-4000-8000-000000000004';
const credentials={access_token:'synthetic-access',refresh_token:'synthetic-refresh',expires_at:9999999999,user:{id},providerSessionId:id};
for(const key of ['client','advisor']){
 const actual=cases[key];assert.equal(actual.status,409);assert.deepEqual(actual.body,{code:'content_version_required',retryable:false});
 const provider=new ClientProvider('sb_publishable_synthetic',async()=>new Response(JSON.stringify(actual.body),{status:actual.status}));
 await assert.rejects(provider.perform(credentials,{view:true,edit:false,publish:false,confirmPayments:false},{kind:'command',channel:'checkins',command:{action:'client_read'}}),error=>{assert.deepEqual(safeError(error),{status:409,code:'content_version_required'});return true;});
}
class JsonProbe extends SupabaseProvider {run(){return this.json('https://synthetic.invalid/rest/v1/rpc/fixed','synthetic-access',{});}}
const actual=cases.preview;assert.equal(actual.status,409);assert.equal(actual.body.code,'concierge_content_version_required');
const provider=new JsonProbe('sb_publishable_synthetic',async()=>new Response(JSON.stringify(actual.body),{status:actual.status}));
await assert.rejects(provider.run(),error=>{assert.deepEqual(safeError(error),{status:409,code:'content_version_required'});return true;});
console.log('3 actual M60 handler/SQL fence responses preserve409 through retained gateway; Checkins retryable:false; external network DENIED');
const expiry=JSON.parse(readFileSync(new URL('../.local-artifacts/portal-rebuild/w1-review/m60-rg4-gateway-input.json',import.meta.url),'utf8'));
assert.deepEqual(expiry,{status:401,body:{code:'session_ended',retryable:false}});
const expired=new ClientProvider('sb_publishable_synthetic',async()=>new Response(JSON.stringify(expiry.body),{status:expiry.status}));
await assert.rejects(expired.perform(credentials,{view:true,edit:false,publish:false,confirmPayments:false},{kind:'command',channel:'checkins',command:{action:'client_read'}}),error=>{assert.deepEqual(safeError(error),{status:401,code:'session_ended'});return true;});
console.log('RG4 actual after-wait session401/retryable:false preserved through retained ClientProvider/safeError');
