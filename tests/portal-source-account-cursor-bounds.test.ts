import assert from 'node:assert/strict';
import {test} from 'node:test';
import type {SourceAccountConsent,SourceAccountPage,SourceAccountListCommand} from '../src/contracts/PortalSourceAccount.ts';
import {readSourceAccountPage,readSourceAccountRecords} from '../src/contracts/PortalSourceAccountValidation.ts';
import {mapSourceAccountResult,decodeSourceAccountResponse,collectSourceAccountPages} from '../src/contracts/PortalSourceAccountMapping.ts';

globalThis.fetch=async()=>{throw Error('external_fetch_denied');};
const id=(n:number)=>`90000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const client=id(1),advisor=id(2),group=id(100),other=id(101),hash='a'.repeat(64),snapshot={revision:7,hash};
function row(n:number,previous:number|null,effective:SourceAccountConsent['effective']='not_withdrawn'):SourceAccountConsent{return {
  consent:{id:id(n),groupId:group,purpose:'service_storage',disclosure:{version:1,hash}},
  supersedesConsentId:previous===null?null:id(previous),disclosureText:'SYNTHETIC EXACT DISCLOSURE ONLY',
  confirmation:{kind:'manual',decision:'allow',channel:'call',occurredAt:{state:'unknown'},recordedBy:advisor,recordedAt:'2026-11-01T12:00:00Z'},effective,withdrawal:null,
};}
function page(entries:SourceAccountConsent[],total:number,cursor:number|null=null):SourceAccountPage{
  const end=(cursor??0)+entries.length;return {schemaVersion:1,visibility:'client_account',clientId:client,state:'page',snapshot,cursor,total,entries,nextCursor:end<total?end:null};
}
function command(p:SourceAccountPage,limit=100):SourceAccountListCommand{return {schemaVersion:1,action:'list_source_consents_v1',snapshot:p.cursor===null?null:snapshot,cursor:p.cursor,limit};}
function accepts(p:SourceAccountPage,limit=100):void{
  assert.deepEqual(readSourceAccountPage(p),p);assert.deepEqual(mapSourceAccountResult(command(p,limit),p,{clientId:client}),p);
  assert.deepEqual(decodeSourceAccountResponse(command(p,limit),200,p,{clientId:client}),{state:'ok',value:p});
}
function rejects(p:SourceAccountPage):void{
  assert.throws(()=>readSourceAccountPage(p),/^Error: invalid_input$/);
  assert.throws(()=>mapSourceAccountResult(command(p),p,{clientId:client}),/^Error: unavailable$/);
  assert.deepEqual(decodeSourceAccountResponse(command(p),200,p,{clientId:client}),{state:'rejected',status:503,code:'unavailable'});
}

test('SAC3 exact bad terminal position rejects at reader, mapper and decoded READ',()=>{
  rejects(page([row(20,30)],2,1));
  assert.deepEqual(readSourceAccountRecords([row(20,30)],client),[row(20,30)]);
});
test('first, middle and last pages allow genuinely earlier or later named predecessors',()=>{
  accepts(page([row(20,30)],2));accepts(page([row(20,10)],2,1));
  accepts(page([row(20,30)],3,1));accepts(page([row(20,10)],3,1));
  const first=page([row(20,30)],2),tail=page([row(30,null,'superseded')],2,1);
  assert.deepEqual(collectSourceAccountPages([{command:command(first),page:first},{command:command(tail),page:tail}],{clientId:client}).entries,[row(20,30),row(30,null,'superseded')]);
});
test('zero earlier or later capacity rejects a named identity on that side without inferring causal UUID order',()=>{
  rejects(page([row(20,10)],2));rejects(page([row(20,30)],2,1));
  accepts(page([row(20,30,'superseded')],3));accepts(page([row(20,10,'superseded')],3,2));
});
test('a named missing identity strictly inside a contiguous visible page cannot be off-page',()=>{
  const entries=[row(20,30,'superseded'),row(40,20)];
  assert.deepEqual(readSourceAccountRecords(entries,client),entries);
  rejects(page(entries,3));rejects(page(entries,4,1));rejects(page(entries,10,4));
});
test('multiple distinct named identities must fit each side rather than only the global total',()=>{
  const after=[row(20,50,'superseded'),row(40,60)];rejects(page(after,4,1));accepts(page(after,4));
  const before=[row(20,10,'superseded'),row(40,11)];rejects(page(before,4,1));accepts(page(before,4,2));
  const split=[row(20,10,'superseded'),row(40,50)];accepts(page(split,4,1));rejects(page(split,4));rejects(page(split,4,2));
});
test('named bridges and distinct unobserved current tails share only remaining before or after slots',()=>{
  // 10 ->20 ->50 ->40: one named identity per side, with no extra terminal.
  const bridge=[row(20,10,'superseded'),row(40,50)];accepts(page(bridge,4,1));
  const missingTail=[row(20,10,'superseded'),row(40,50,'superseded')];
  rejects(page(missingTail,4,1));accepts(page(missingTail,5,1));accepts(page(missingTail,5,2));
  // An unnamed successor may sort earlier. UUID order does not establish causal order.
  accepts(page([row(20,null,'superseded')],2,1));
});
test('group and purpose independence preserves separate tails within the global positional budget',()=>{
  for(const dimension of ['group','purpose'] as const){
    const second=row(40,50,'superseded');if(dimension==='group')second.consent.groupId=other;else second.consent.purpose='service_review';
    const entries=[row(20,10,'superseded'),second];rejects(page(entries,5,1));accepts(page(entries,6,1));accepts(page(entries,6,3));
    rejects(page(entries,6));rejects(page(entries,6,4));
  }
});
test('page length, not requested limit, determines the contiguous window and remaining slots',()=>{
  const p=page([row(20,30)],2);accepts(p,1);accepts(p,100);
  rejects(page([row(20,10)],100));
});
test('empty complete, manual root denial, huge safe offsets and overflow retain their separate semantics',()=>{
  accepts(page([],0));const denied=row(20,null,'withdrawn');denied.confirmation.decision='withdraw';accepts(page([denied],1));
  accepts(page([row(20,10)],Number.MAX_SAFE_INTEGER,Number.MAX_SAFE_INTEGER-1));
  rejects(page([row(20,30)],Number.MAX_SAFE_INTEGER,Number.MAX_SAFE_INTEGER-1));
  rejects(page([row(20,null)],Number.MAX_SAFE_INTEGER,Number.MAX_SAFE_INTEGER));
});
test('Root canonicalizes UUID case before the existing string-ID comparison',()=>{
  const current=row(20,null),larger=row(30,null);larger.consent.groupId=other;
  current.consent.id='90000000-0000-4000-8000-0000000000A0';larger.consent.id='90000000-0000-4000-8000-0000000000b0';
  const p=page([current,larger],2),expected=structuredClone(p);expected.entries[0]!.consent.id=current.consent.id.toLowerCase();
  assert.deepEqual(readSourceAccountPage(p),expected);
});

// Independent reference builds full chains, sorts the COMPLETE records by the existing
// string-ID comparator, then slices actual offsets. No production bound/count formula.
// Fresh representative IDs on BOTH sides allow up to three off-page anonymous nodes;
// this finite catalog is not a proof for arbitrary UUID universes or snapshot producers.
type Fact={key:string;previous:string|null;current:boolean};
const pool=[0,1,10,20,30,40,50,60,70].map(id);
const key=(r:SourceAccountConsent)=>r.consent.groupId+':'+r.consent.purpose;
const fact=(r:SourceAccountConsent):Fact=>({key:key(r),previous:r.supersedesConsentId,current:r.effective!=='superseded'});
const signature=(entries:readonly [string,Fact][])=>JSON.stringify(entries);
function orders(values:readonly string[],length:number):string[][]{
  if(length===0)return [[]];const result:string[][]=[];
  for(let i=0;i<values.length;i++)for(const rest of orders([...values.slice(0,i),...values.slice(i+1)],length-1))result.push([values[i]!,...rest]);
  return result;
}
function sizes(total:number,groups:number):number[][]{
  if(groups===1)return total>0?[[total]]:[];const result:number[][]=[];
  for(let first=1;first<=total-groups+1;first++)for(const rest of sizes(total-first,groups-1))result.push([first,...rest]);
  return result;
}
function catalog(keys:string[],total:number):Set<string>{
  const found=new Set<string>();
  for(const labels of [keys,[...keys,'unobserved-group']])for(const lengths of sizes(total,labels.length))for(const ordered of orders(pool,total)){
    let at=0;const full:[string,Fact][]=[];
    for(let g=0;g<labels.length;g++)for(let j=0;j<lengths[g]!;j++,at++)full.push([ordered[at]!,{key:labels[g]!,previous:j===0?null:ordered[at-1]!,current:j===lengths[g]!-1}]);
    full.sort((a,b)=>a[0]<b[0]?-1:a[0]>b[0]?1:0);
    for(let offset=0;offset<total;offset++)for(const length of [1,2]){
      const slice=full.slice(offset,offset+length);
      // Only tested observation windows are20 or20,40; all other full nodes still
      // affect their actual positions, so missing interior30 cannot be ignored.
      if(slice.length===length&&slice[0]?.[0]===id(20)&&(length===1||slice[1]?.[0]===id(40)))found.add(JSON.stringify([offset,signature(slice)]));
    }
  }
  return found;
}
test('bounded complete-chain/sort/slice oracle checks causal facts AND cursor placement',t=>{
  const aKey=key(row(20,null)),bGroup=other+':service_storage',bPurpose=group+':service_review';
  const predecessors=[null,10,20,30,40,50],effects=['not_withdrawn','superseded'] as const;
  let checked=0,feasible=0,impossible=0;
  for(const mode of ['single','same','group','purpose'] as const)for(let total=mode==='single'?1:2;total<=4;total++){
    const keys=mode==='group'?[aKey,bGroup]:mode==='purpose'?[aKey,bPurpose]:[aKey],witnesses=catalog(keys,total);
    function check(entries:SourceAccountConsent[],offset:number):void{
      const expected=witnesses.has(JSON.stringify([offset,signature(entries.map(r=>[r.consent.id,fact(r)]))]));
      const p=page(entries,total,offset===0?null:offset);let actual:boolean;
      try{readSourceAccountPage(p);actual=true;}catch(error){assert.match(String(error),/^Error: invalid_input$/);actual=false;}
      assert.equal(actual,expected,JSON.stringify({mode,total,offset,entries:entries.map(r=>[r.consent.id,fact(r)])}));
      checked++;if(expected)feasible++;else impossible++;
    }
    for(const a of predecessors)for(const ea of effects){
      if(mode==='single'){for(let offset=0;offset<total;offset++)check([row(20,a,ea)],offset);continue;}
      for(const b of predecessors)for(const eb of effects){
        const second=row(40,b,eb);if(mode==='group')second.consent.groupId=other;else if(mode==='purpose')second.consent.purpose='service_review';
        for(let offset=0;offset<=total-2;offset++)check([row(20,a,ea),second],offset);
      }
    }
  }
  assert(feasible>0&&impossible>0);t.diagnostic(`finite page-position oracle ${checked} cases: ${feasible} feasible/${impossible} impossible; up to4 complete nodes from9 IDs`);
});
