// SOURCE predicates only. No PostgreSQL parser, catalog, role or race execution.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {test} from 'node:test';
const read=(path:string)=>readFileSync(new URL(path,import.meta.url),'utf8');
const migration=()=>read('../supabase/migrations/20261102130000_portal_rebuild_client_orders_read_v1.sql');
test('SOURCE: one additive read RPC and one private projection, no table/trigger/helper replacement or DML',()=>{
 const source=migration().replace(/--[^\n]*/g,'');
 assert.deepEqual([...source.matchAll(/create function ([a-z0-9_.]+)\(/g)].map(match=>match[1]),['concierge.client_orders_projection_v1','public.concierge_client_orders_read_v1']);
 assert.doesNotMatch(source,/\b(?:insert|update|delete|truncate|alter|drop|create or replace|create table|create trigger)\b/i);
 assert.match(source,/revoke all on function concierge\.client_orders_projection_v1\(uuid\) from public,anon,authenticated,service_role/);
 assert.match(source,/revoke all on function public\.concierge_client_orders_read_v1\(jsonb\) from public,anon,authenticated,service_role/);
 assert.match(source,/grant execute on function public\.concierge_client_orders_read_v1\(jsonb\) to authenticated/);
 assert.doesNotMatch(source,/\b(?:service_projection_data|plan_care_window|service_active|workflow_begin|workflow_finish|account_profile_heads_v1)\b/);
});
test('SOURCE: captured own actor/session, closed command, enrollment before client lock/head and final reauthorization',()=>{
 const source=migration(),entry=source.slice(source.indexOf('create function public.'));
 assert.match(entry,/u uuid:=auth\.uid\(\)/);assert.match(entry,/s:=\(auth\.jwt\(\)->>'session_id'\)::uuid;expiry:=\(auth\.jwt\(\)->>'exp'\)::numeric/);
 assert.match(entry,/concierge\.keys\(p_command,array\['schemaVersion','action'\]\)/);
 const row=entry.indexOf('where client_id=u for share'),client=entry.indexOf("'concierge:client:'||u::text"),head=entry.indexOf('from concierge.service_heads where client_id=u for share');
 assert.ok(row>=0&&row<client&&client<head);
 assert.ok((entry.match(/perform concierge\.account_profile_authorize_v1\(u,s,expiry\)/g)??[]).length>=5);
 assert.match(entry,/perform concierge\.account_profile_authorize_v1\(u,s,expiry\);\s*return result;/);
});
test('SOURCE: complete ordered own records, canonical head and finite refusal, never a page or empty fallback',()=>{
 const source=migration();
 for(const table of ['retail_purchases','return_cases','return_events','service_heads'])assert.match(source,new RegExp(`concierge\\.${table}`));
 assert.match(source,/order by p\.recorded_at,p\.id/);assert.match(source,/order by r\.requested_at,r\.id/);assert.match(source,/order by e\.sequence/);
 assert.doesNotMatch(source,/\blimit\b/i);assert.doesNotMatch(source,/exception when others|\b(?:retail_purchase_private|return_event_private|service_reviews|instruction_drafts)\b/);
 assert.match(source,/octet_length\(convert_to\(result::text,'UTF8'\)\)>2000000 then perform concierge\.fail\('unavailable'\)/);
 assert.match(source,/if head is null and \(exists\(select 1 from concierge\.retail_purchases/);
 assert.match(source,/concierge\.client_orders_projection_v1\(u\) is distinct from result/);
});
test('SOURCE: canonical private own-admin authorizer and legacy care-lossiness refusal remain exact inputs',()=>{
 const sha=(value:string)=>createHash('sha256').update(value).digest('hex');
 assert.equal(sha(read('../supabase/migrations/20261102110000_portal_rebuild_account_profile_v1.sql')),'7dcde23039959d60dc1a964b50f22012991139e3d68d5889282ab4524c82b23b');
 assert.equal(sha(read('../supabase/migrations/20261031091520_portal_rebuild_reviews_guidance_v1.sql')),'b663f897d669edf33d6c7b0c4e18be8f775ed23c3b539e5bb51620606d912a1e');
});
