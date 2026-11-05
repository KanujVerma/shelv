import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';

test('final export PLpgSQL size condition keeps the CASE inside its IF expression',()=>{
  const source=readFileSync(new URL('../supabase/migrations/20261101173223_portal_rebuild_final_export_v1.sql',import.meta.url),'utf8');
  // Regression for real PostgreSQL42601 at CREATE FUNCTION statement12 in CI.
  // This source guard is not a substitute for a successful native replay.
  assert.match(source,/if octet_length\(convert_to\(unit::text,'UTF8'\)\)>\(case when unit_index=0 then 14772736 else 865536 end\) then/);
  assert.doesNotMatch(source,/if octet_length\(convert_to\(unit::text,'UTF8'\)\)>case\b/);
});
