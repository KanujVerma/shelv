import assert from 'node:assert/strict';
import {test} from 'node:test';
import type {SourceAccountConsent,SourceAccountPage,SourceAccountListCommand} from '../src/contracts/PortalSourceAccount.ts';
import {readSourceAccountPage,readSourceAccountRecords} from '../src/contracts/PortalSourceAccountValidation.ts';
import {mapSourceAccountResult,decodeSourceAccountResponse,collectSourceAccountPages} from '../src/contracts/PortalSourceAccountMapping.ts';
import {readUuid} from '../src/contracts/ConciergePortalValidation.ts';

globalThis.fetch=async()=>{throw Error('external_fetch_denied');};
const minimum='00000000-0000-1000-8000-000000000000',maximum='ffffffff-ffff-8fff-bfff-ffffffffffff';
const client='90000000-0000-4000-8000-000000000001',advisor='90000000-0000-4000-8000-000000000002',group='90000000-0000-4000-8000-000000000100',other='90000000-0000-4000-8000-000000000101',hash='a'.repeat(64),snapshot={revision:7,hash};
function rawUuid(n:bigint):string{const s=n.toString(16).padStart(32,'0');return `${s.slice(0,8)}-${s.slice(8,12)}-${s.slice(12,16)}-${s.slice(16,20)}-${s.slice(20)}`;}
const lower=(n:bigint)=>rawUuid(BigInt('0x'+minimum.replaceAll('-',''))+n);
const upper=(n:bigint)=>rawUuid(BigInt('0x'+maximum.replaceAll('-',''))-n);
function row(id:string,previous:string|null=null,effective:SourceAccountConsent['effective']='not_withdrawn',groupId=group):SourceAccountConsent{return {
  consent:{id,groupId,purpose:'service_storage',disclosure:{version:1,hash}},supersedesConsentId:previous,disclosureText:'SYNTHETIC EXACT DISCLOSURE ONLY',
  confirmation:{kind:'manual',decision:'allow',channel:'call',occurredAt:{state:'unknown'},recordedBy:advisor,recordedAt:'2026-11-01T12:00:00Z'},effective,withdrawal:null,
};}
function page(entries:SourceAccountConsent[],total:number,cursor:number|null=null):SourceAccountPage{const end=(cursor??0)+entries.length;return {schemaVersion:1,visibility:'client_account',clientId:client,state:'page',snapshot,cursor,total,entries,nextCursor:end<total?end:null};}
function command(p:SourceAccountPage,limit=100):SourceAccountListCommand{return {schemaVersion:1,action:'list_source_consents_v1',snapshot:p.cursor===null?null:snapshot,cursor:p.cursor,limit};}
function accepts(p:SourceAccountPage):void{assert.deepEqual(readSourceAccountPage(p),p);assert.deepEqual(mapSourceAccountResult(command(p),p,{clientId:client}),p);assert.deepEqual(decodeSourceAccountResponse(command(p),200,p,{clientId:client}),{state:'ok',value:p});}
function rejects(p:SourceAccountPage):void{assert.throws(()=>readSourceAccountPage(p),/^Error: invalid_input$/);assert.throws(()=>mapSourceAccountResult(command(p),p,{clientId:client}),/^Error: unavailable$/);assert.deepEqual(decodeSourceAccountResponse(command(p),200,p,{clientId:client}),{state:'rejected',status:503,code:'unavailable'});}

test('SAC4 minimum cannot reserve an earlier identity, maximum cannot reserve a later identity',()=>{
  rejects(page([row(minimum)],2,1));rejects(page([row(maximum)],2));
  accepts(page([row(minimum)],1));accepts(page([row(maximum)],1));
  assert.deepEqual(readSourceAccountRecords([row(minimum)],client),[row(minimum)]);
  assert.deepEqual(readSourceAccountRecords([row(maximum)],client),[row(maximum)]);
});
test('the opposite outer side and adjacent named predecessors remain possible',()=>{
  const first=page([row(minimum)],2),tail=page([row(lower(1n),null,'not_withdrawn',other)],2,1);accepts(first);accepts(tail);
  assert.deepEqual(collectSourceAccountPages([{command:command(first),page:first},{command:command(tail),page:tail}],{clientId:client}).entries,[row(minimum),row(lower(1n),null,'not_withdrawn',other)]);
  accepts(page([row(lower(1n),minimum)],2,1));accepts(page([row(upper(1n),maximum)],2));
  accepts(page([row(maximum)],2,1));
});
test('near-endpoint anonymous capacities are exact at and one beyond each boundary',()=>{
  for(let n=0n;n<=6n;n++){
    accepts(page([row(lower(n))],Number(n)+1,n===0n?null:Number(n)));
    rejects(page([row(lower(n))],Number(n)+2,Number(n)+1));
    accepts(page([row(upper(n))],Number(n)+1));rejects(page([row(upper(n))],Number(n)+2));
  }
});
test('capacity arithmetic stays exact across low48-bit carry and safe-integer extremes',()=>{
  // Within these endpoint bands, every raw 128-bit step is admitted by Root:
  // version/variant nibbles remain fixed. This reference uses raw neighbors,
  // not the production mixed-radix ranking of the entire UUID domain.
  for(const n of [2n**32n,2n**48n-1n,2n**48n,2n**48n+1n,BigInt(Number.MAX_SAFE_INTEGER)-2n]){
    assert.equal(readUuid(lower(n)),lower(n));assert.equal(readUuid(upper(n)),upper(n));
    accepts(page([row(lower(n))],Number(n)+1,Number(n)));
    rejects(page([row(lower(n))],Number(n)+2,Number(n)+1));
    accepts(page([row(upper(n))],Number(n)+1));rejects(page([row(upper(n))],Number(n)+2));
  }
  accepts(page([row('90000000-0000-4000-8000-000000000020')],Number.MAX_SAFE_INTEGER,Number.MAX_SAFE_INTEGER-1));
});
test('named identities, causal bridges and flexible current tails consume legal slots once',()=>{
  accepts(page([row(lower(2n),minimum)],3,2));rejects(page([row(lower(2n),minimum)],4,3));
  accepts(page([row(upper(2n),maximum,'superseded')],3));rejects(page([row(upper(2n),maximum,'superseded')],4));
  accepts(page([row(minimum,null,'superseded')],2));
  // A later causal successor can sort before the maximum UUID.
  accepts(page([row(maximum,null,'superseded')],2,1));
});
test('independent groups and purposes do not create identities outside the UUID domain',()=>{
  for(const dimension of ['group','purpose'] as const){
    const second=row(lower(2n));if(dimension==='group')second.consent.groupId=other;else second.consent.purpose='service_review';
    accepts(page([row(minimum),second],3));rejects(page([row(minimum),second],3,1));
    const a=row(upper(2n)),b=row(maximum);if(dimension==='group')b.consent.groupId=other;else b.consent.purpose='service_review';
    accepts(page([a,b],3,1));rejects(page([a,b],3));
  }
});
test('actual Root grammar retains all eight versions, four variants and canonical case',()=>{
  for(let version=1;version<=8;version++)for(const variant of ['8','9','a','b']){
    const id=`00000000-0000-${version}000-${variant}000-000000000000`;assert.equal(readUuid(id),id);accepts(page([row(id)],1));
  }
  for(const invalid of ['00000000-0000-0000-8000-000000000000','00000000-0000-9000-8000-000000000000','00000000-0000-1000-7000-000000000000','00000000-0000-1000-c000-000000000000'])assert.throws(()=>readSourceAccountRecords([row(invalid)],client),/^Error: invalid_input$/);
  const p=page([row(maximum.toUpperCase())],1),expected=page([row(maximum)],1);assert.deepEqual(readSourceAccountPage(p),expected);
});
test('legal field transitions preserve sorted complete pages and reverse causal linkage',()=>{
  const pairs=[
    ['00000000-0000-1000-8000-ffffffffffff','00000000-0000-1000-8001-000000000000'],
    ['00000000-0000-1000-8fff-ffffffffffff','00000000-0000-1000-9000-000000000000'],
    ['00000000-0000-1000-bfff-ffffffffffff','00000000-0000-1001-8000-000000000000'],
    ['00000000-0000-1fff-bfff-ffffffffffff','00000000-0000-2000-8000-000000000000'],
    ['00000000-0000-8fff-bfff-ffffffffffff','00000000-0001-1000-8000-000000000000'],
    ['00000000-ffff-8fff-bfff-ffffffffffff','00000001-0000-1000-8000-000000000000'],
  ];
  for(const[a,b]of pairs){assert(a&&b&&a<b);assert.equal(readUuid(a),a);assert.equal(readUuid(b),b);
    accepts(page([row(a,b),row(b,null,'superseded')],2));
    accepts(page([row(a)],2**48,2**48-1));
    accepts(page([row(b)],Number.MAX_SAFE_INTEGER));
  }
});
test('page length rather than request limit, complete empty and portal-event namespace remain unchanged',()=>{
  const p=page([row(lower(1n))],2,1);assert.deepEqual(mapSourceAccountResult(command(p,1),p,{clientId:client}),p);assert.deepEqual(mapSourceAccountResult(command(p,100),p,{clientId:client}),p);
  accepts(page([],0));const denied=row(minimum,null,'withdrawn');denied.confirmation.decision='withdraw';accepts(page([denied],1));
  const withdrawn=row(minimum,null,'withdrawn');withdrawn.withdrawal={id:maximum,origin:'client_portal',consent:withdrawn.consent,recordedBy:client,recordedAt:'2026-11-01T12:00:00Z'};
  accepts(page([withdrawn],1));rejects(page([withdrawn],2,1));
});

// Independent finite completion reference: every endpoint band member is checked
// against Root's grammar. Complete independent-group histories (one-node chains)
// are enumerated, sorted and sliced. For the tested first/last four legal IDs,
// the catalog includes ALL identities on the constrained outer side plus enough
// spare identities on the other side for at most five complete nodes.
function subsets(values:readonly string[],n:number):string[][]{if(n===0)return [[]];const result:string[][]=[];for(let i=0;i<=values.length-n;i++)for(const rest of subsets(values.slice(i+1),n-1))result.push([values[i]!,...rest]);return result;}
test('finite legal-endpoint completion/sort/slice witnesses check both anonymous capacities',t=>{
  const pool=[...Array.from({length:6},(_,i)=>lower(BigInt(i))),...Array.from({length:6},(_,i)=>upper(BigInt(i)))].sort();
  for(const id of pool)assert.equal(readUuid(id),id);
  let checked=0,feasible=0,impossible=0,candidates=0;
  for(let total=1;total<=5;total++){
    const fullHistories=subsets(pool,total).map(ids=>ids.slice().sort());candidates+=fullHistories.length;
    for(const observed of [...pool.slice(0,4),...pool.slice(-4)])for(let offset=0;offset<total;offset++){
      const expected=fullHistories.some(full=>full.slice(offset,offset+1)[0]===observed),p=page([row(observed)],total,offset===0?null:offset);let actual:boolean;
      try{readSourceAccountPage(p);actual=true;}catch(error){assert.match(String(error),/^Error: invalid_input$/);actual=false;}
      assert.equal(actual,expected,JSON.stringify({observed,total,offset}));checked++;if(expected)feasible++;else impossible++;
    }
  }
  assert(feasible>0&&impossible>0);t.diagnostic(`finite endpoint witnesses: ${checked} cases/${candidates} complete independent-group histories; ${feasible} feasible/${impossible} impossible`);
});
