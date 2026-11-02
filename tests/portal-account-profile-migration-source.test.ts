// Deliberately SOURCE predicates only. These do not parse/execute PostgreSQL.
// The user requested exact supported-preimage and non-waiting-lock source tests.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
const read=(path:string)=>readFileSync(new URL(path,import.meta.url),'utf8');
const migration=read('../supabase/migrations/20261102110000_portal_rebuild_account_profile_v1.sql');
const retained=read('../supabase/migrations/20261101191527_portal_rebuild_notifications_v1.sql');
const body=/create or replace function concierge\.review_request_collision\(\).*?as \$\$([\s\S]*?)\$\$;/.exec(retained)![1];
const source8=body.replace("'notification_requests'] loop","'notification_requests','source_requests','source_account_requests'] loop");
const sha=(s:string)=>createHash('sha256').update(s).digest('hex');
test('SOURCE: guards bind exact six/eight retained bodies and actual Source table presence',()=>{
 assert.equal(sha(body),'26afa4244895b19a260c379b57a0c2a4292cd18983fa90241b805b8d102cc7dc');
 assert.equal(sha(source8),'d5aa3b2a59c9f2cdf6cd10f67fa3d4f4bb8642d4cec56013255e1f029c418180');
 assert.match(migration,/h='26afa4244895b19a260c379b57a0c2a4292cd18983fa90241b805b8d102cc7dc' and source_table is null and account_table is null/);
 assert.match(migration,/h='d5aa3b2a59c9f2cdf6cd10f67fa3d4f4bb8642d4cec56013255e1f029c418180' and source_table is not null and account_table is not null/);
 assert.match(migration,/else raise exception 'account_profile_collision_preimage_unsupported'/);
});
test('SOURCE: six/eight successors append only profile and retain exact existing helper logic',()=>{
 for(const [old,suffix] of [[body,'notification_requests'],[source8,'source_account_requests']]){
  const replacement=`'''${suffix}'',''account_profile_requests_v1''] loop'`;
  assert.ok(migration.includes(`return replace(body,'''${suffix}''] loop',${replacement});`));
  const successor=old.replace(`'${suffix}'] loop`,`'${suffix}','account_profile_requests_v1'] loop`);
  assert.equal(successor.replace(",'account_profile_requests_v1'",''),old);
 }
 assert.match(migration,/b\.metadata is not distinct from to_jsonb\(p\)-'prosrc'/);
 assert.match(migration,/b\.metadata is distinct from to_jsonb\(t\)/);
});
test('SOURCE: canonical row precedes try-request lock and head, contention is unavailable',()=>{
 const entry=migration.slice(migration.indexOf('create function public.concierge_account_profile_command_v1'));
 const row=entry.indexOf('where client_id=u for update'),attempt=entry.indexOf('pg_try_advisory_xact_lock'),head=entry.indexOf('insert into concierge.account_profile_heads_v1');
 assert.ok(row>=0&&row<attempt&&attempt<head);
 assert.match(entry,/if not pg_try_advisory_xact_lock\([^\n]+then perform concierge\.fail\('unavailable'\);end if;\n  perform concierge\.account_profile_authorize_v1/);
 assert.doesNotMatch(entry,/(?<!try_)pg_advisory_xact_lock\(/);
});
