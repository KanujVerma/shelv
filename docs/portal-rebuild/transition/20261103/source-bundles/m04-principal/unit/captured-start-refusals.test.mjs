import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
// Exact internal source function exposure; synthetic metadata is never a native
// inspect response or authority. All controls are refusals with no resource IO.
const source=readFileSync(new URL('../executor/principal-setup.mjs',import.meta.url),'utf8');
const a=source.indexOf('function capturedStart('),b=source.indexOf('\nfunction gitRead(',a);assert.ok(a>0&&b>a);
const f=new Function('need','equal','return ('+source.slice(a,b)+');')((ok,code)=>{if(!ok)throw Error(code);},(x,y,code)=>{try{assert.deepEqual(x,y);}catch{throw Error(code);}});
const data=()=>({resources:{at:'2026-11-03T10:01:00Z'},db:{running:true,labels:{project:'synthetic'},created:'2026-11-03T10:00:00Z'},expected:{startedAt:'2026-11-03T10:00:01Z',labels:{project:'synthetic'}}});
for(const [name,change]of [
 ['stopped captured DB',x=>{x.db.running=false;}],
 ['missing capture time',x=>{delete x.resources.at;}],
 ['restart after immutable capture',x=>{x.expected.startedAt='2026-11-03T10:02:00Z';}],
 ['captured label mismatch',x=>{x.expected.labels={project:'foreign'};}],
])test('captured start refuses '+name,()=>{const x=data();change(x);assert.throws(()=>f(x.resources,x.db,x.expected),/E_PRINCIPAL_/);});
