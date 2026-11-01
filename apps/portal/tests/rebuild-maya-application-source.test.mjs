import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('actual public Application selects the real Maya application for the parsed public stage',()=>{
  const source=readFileSync(new URL('../src/app/Application.tsx',import.meta.url),'utf8');
  const entry=source.slice(source.indexOf('export function PublicEntry('),source.indexOf('/** Startup'));
  assert.match(entry,/if\s*\(route\?\.name === ["']maya["']\)\s*return <MayaApplication\s+stage=\{route\.stage\}/,
    'PublicEntry must mount the Maya application for every parsed stage, rather than report the tour unavailable');
  assert.match(source,/import \{ MayaApplication \} from ["']\.\/MayaApplication\.tsx["']/);
});
