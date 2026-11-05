import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';

test('inventory no-effect oracle captures Review head after fixture writes and before inventory reads',()=>{
  const source=readFileSync(new URL('../supabase/tests/portal_rebuild_photo_inventory_v1.sql',import.meta.url),'utf8');
  const snapshot=source.indexOf('create temporary table photo_inventory_review_head_before as');
  const report=source.indexOf('insert into concierge.checkin_reports');
  const amendment=source.indexOf('insert into concierge.review_amendment_photos');
  const firstMeasuredRead=source.indexOf("select is(public.concierge_checkin_head_v1(),");
  assert.ok(snapshot>report&&snapshot>amendment&&snapshot<firstMeasuredRead,'capture the actual post-setup baseline before measured reads');
  assert.match(source,/select is\(\(select revision from concierge\.care_report_heads where client_id='d1200000-0000-4000-8000-000000000001'\),\(select revision from photo_inventory_review_head_before\),'Review head is unrelated and unchanged'\)/);
});
