import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
// Source-only exposure of the exact internal bookkeeping class bytes.
// No HTTP/SQL/Auth/page/command or successful authority facade is supplied.
const source=readFileSync(new URL('../executor/principal-setup.mjs',import.meta.url),'utf8');
const start=source.indexOf('class NativeSlot {'),end=source.indexOf('\nlet activeExecution=',start);
assert.ok(start>0&&end>start);
const Class=new Function('need','return ('+source.slice(start,end)+');')((ok,code)=>{if(!ok)throw Error(code);});
test('unknown native slot operation refuses',()=>assert.throws(()=>new Class().claim('discover'),/E_PRINCIPAL_SLOT_KIND/));
test('duplicate/reentrant native issue refuses until the actual owner releases',()=>{const s=new Class(),owner=s.claim('inspect');assert.throws(()=>s.claim('sql'),/E_PRINCIPAL_SLOT_BUSY/);assert.throws(()=>s.assertIdle(),/E_PRINCIPAL_SLOT_UNJOINED/);assert.throws(()=>s.release({kind:'inspect'}),/E_PRINCIPAL_SLOT_OWNER/);s.release(owner);assert.throws(()=>s.release(owner),/E_PRINCIPAL_SLOT_OWNER/);});
test('old slot token cannot settle a newer operation',()=>{const s=new Class(),a=s.claim('sql');s.release(a);const b=s.claim('https');assert.throws(()=>s.release(a),/E_PRINCIPAL_SLOT_OWNER/);assert.throws(()=>s.claim('inspect'),/E_PRINCIPAL_SLOT_BUSY/);s.release(b);});
test('null token cannot clear or manufacture an idle slot',()=>{const s=new Class();assert.throws(()=>s.release(null),/E_PRINCIPAL_SLOT_OWNER/);const token=s.claim('inspect');assert.throws(()=>s.release(null),/E_PRINCIPAL_SLOT_OWNER/);s.release(token);});
test('unknown SQL command kind refuses before reading any SQL or private path',()=>{
 const a=source.indexOf('function sqlText('),b=source.indexOf('\nasync function query(',a);assert.ok(a>0&&b>a);
 const f=new Function('need','return ('+source.slice(a,b)+');')((ok,code)=>{if(!ok)throw Error(code);});
 assert.throws(()=>f({g:{sql:{path:'/MUST-NOT-BE-READ'}}},'discover'),/E_PRINCIPAL_SQL_KIND/);
});
