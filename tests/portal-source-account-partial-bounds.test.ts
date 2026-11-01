import assert from 'node:assert/strict';
import {test} from 'node:test';
import type {SourceAccountConsent,SourceAccountPage,SourceAccountListCommand} from '../src/contracts/PortalSourceAccount.ts';
import {mapSourceAccountResult,decodeSourceAccountResponse,collectSourceAccountPages} from '../src/contracts/PortalSourceAccountMapping.ts';
import {readSourceAccountRecords} from '../src/contracts/PortalSourceAccountValidation.ts';
import {sourceAccountPageMaxBytes} from '../src/contracts/PortalSourceAccountValues.ts';

globalThis.fetch=async()=>{throw Error('external_fetch_denied');};
const id=(n:number)=>`80000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const client=id(1),advisor=id(2),group=id(100),otherGroup=id(101),hash='a'.repeat(64);
const snapshot={revision:7,hash};
const command:SourceAccountListCommand={schemaVersion:1,action:'list_source_consents_v1',snapshot:null,cursor:null,limit:100};
function row(n:number,previous:number|null,effective:SourceAccountConsent['effective']='not_withdrawn'):SourceAccountConsent{return {
  consent:{id:id(n),groupId:group,purpose:'service_storage',disclosure:{version:1,hash}},
  supersedesConsentId:previous===null?null:id(previous),disclosureText:'SYNTHETIC EXACT DISCLOSURE ONLY',
  confirmation:{kind:'manual',decision:'allow',channel:'call',occurredAt:{state:'unknown'},recordedBy:advisor,recordedAt:'2026-11-01T12:00:00Z'},
  effective,withdrawal:null,
};}
function page(entries:SourceAccountConsent[],total:number,cursor:number|null=null):SourceAccountPage{
  const end=(cursor??0)+entries.length;
  return {schemaVersion:1,visibility:'client_account',clientId:client,state:'page',snapshot,cursor,total,entries,nextCursor:end<total?end:null};
}
function readCommand(p:SourceAccountPage):SourceAccountListCommand{return {...command,snapshot:p.cursor===null?null:snapshot,cursor:p.cursor};}
function accepts(p:SourceAccountPage):void{
  const c=readCommand(p);assert.deepEqual(mapSourceAccountResult(c,p,{clientId:client}),p);
  assert.deepEqual(decodeSourceAccountResponse(c,200,p,{clientId:client}),{state:'ok',value:p});
}
function rejects(p:SourceAccountPage):void{
  const c=readCommand(p);assert.throws(()=>mapSourceAccountResult(c,p,{clientId:client}),/^Error: unavailable$/);
  assert.deepEqual(decodeSourceAccountResponse(c,200,p,{clientId:client}),{state:'rejected',status:503,code:'unavailable'});
}

test('SAC2 exact total2/3 boundary retains real off-page predecessor/successor and both READ boundaries',()=>{
  const middle=row(20,30,'superseded');rejects(page([middle],2));accepts(page([middle],3));
  const root=row(30,null,'superseded'),current=row(40,20),first=page([middle],3),tail=page([root,current],3,1);
  accepts(tail);
  assert.deepEqual(collectSourceAccountPages([{command,page:first},{command:readCommand(tail),page:tail}],{clientId:client}).entries,[middle,root,current]);
});
test('predecessor-only current and successor-only superseded tail each need only one unseen node',()=>{
  accepts(page([row(20,30)],2));accepts(page([row(20,null,'superseded')],2));
  rejects(page([row(20,30)],1));rejects(page([row(20,null,'superseded')],1));
});
test('named predecessor from another segment can bridge a missing successor without double counting',()=>{
  // 30 -> 20 -> 50 -> 40: 30 and50 are already required unseen predecessor identities.
  const entries=[row(20,30,'superseded'),row(40,50)];rejects(page(entries,3));accepts(page(entries,4));
});
test('without an observed current node a fresh terminal must be distinct from required ancestors',()=>{
  const entries=[row(20,30,'superseded'),row(40,50,'superseded')];
  rejects(page(entries,4));accepts(page(entries,5));
  accepts(page([row(20,30,'superseded'),row(40,20,'superseded')],4));
});
test('independent groups and purposes cannot share a missing record or terminal budget',()=>{
  for(const second of [
    {...row(40,50),consent:{...row(40,50).consent,groupId:otherGroup}},
    {...row(40,50),consent:{...row(40,50).consent,purpose:'service_review' as const}},
  ]){const entries=[row(20,30,'superseded'),second];rejects(page(entries,4));accepts(page(entries,5));}
  const tails=[row(20,null,'superseded'),{...row(40,null,'superseded'),consent:{...row(40,null).consent,groupId:otherGroup}}];
  rejects(page(tails,3));accepts(page(tails,4));
});
test('a known closed root-to-current component cannot admit another segment of that same group',()=>{
  const closed=[row(10,null,'superseded'),row(20,10)],extra=row(40,50,'superseded');
  rejects(page([...closed,extra],100));
  assert.throws(()=>readSourceAccountRecords([...closed,extra],client),/^Error: invalid_input$/);
  accepts(page([...closed,{...extra,consent:{...extra.consent,groupId:otherGroup}}],5));
  // Unconstrained extra records may belong to another not-yet-observed group.
  accepts(page(closed,3));
});
test('visible self/cycle/fork/cross-group contradictions remain impossible at every larger total',()=>{
  for(const entries of [
    [row(20,20,'superseded')],
    [row(20,30,'superseded'),row(30,20,'superseded')],
    [row(10,null,'superseded'),row(20,10,'superseded'),row(30,10)],
    [row(20,null,'superseded'),{...row(30,20),consent:{...row(30,20).consent,groupId:otherGroup}}],
  ])rejects(page(entries,20));
});
test('cursor arithmetic, terminal-tail partial bounds and safe integer totals are separate checks',()=>{
  const middle=row(20,30,'superseded');rejects(page([middle],2,1));accepts(page([middle],3,1));
  rejects(page([row(20,null)],Number.MAX_SAFE_INTEGER,Number.MAX_SAFE_INTEGER));
  accepts(page([row(20,null)],Number.MAX_SAFE_INTEGER,Number.MAX_SAFE_INTEGER-1));
  rejects(page([row(20,null)],Number.MAX_SAFE_INTEGER+1));
});
test('complete empty and root manual denial remain valid, and namespace coincidences add no consent nodes',()=>{
  accepts(page([],0));const denial=row(20,null,'withdrawn');denial.confirmation.decision='withdraw';accepts(page([denial],1));
  const middle=row(20,30,'superseded');middle.withdrawal={id:id(30),origin:'client_portal',consent:middle.consent,recordedBy:client,recordedAt:'2026-11-01T12:00:00Z'};
  // Event30 and consent30 occupy distinct namespaces. Neither event nor group aliases are graph records.
  accepts(page([middle],3));
});
test('201 reverse-causal UUID records still map in100/100/1 pages and valid smaller observed subsets',()=>{
  const entries=Array.from({length:201},(_,i)=>row(10+i,i===200?null:11+i,i===0?'not_withdrawn':'superseded'));
  const first=page(entries.slice(0,100),201),middle=page(entries.slice(100,200),201,100),last=page(entries.slice(200),201,200);
  accepts(first);accepts(middle);accepts(last);
  accepts(page(entries.filter((_,i)=>i%4===0),201));
  assert.deepEqual(collectSourceAccountPages([{command,page:first},{command:readCommand(middle),page:middle},{command:readCommand(last),page:last}],{clientId:client}).entries,entries);
});
test('exact400000/400001 escaped UTF8 envelope includes the current group and predecessor fields',t=>{
  const entries=Array.from({length:17},(_,i)=>{
    const r=row(10+i,i===0?null:9+i,'superseded');r.consent.disclosure.version=i+1;r.disclosureText=i<16?'\u0001'.repeat(4000):'';return r;
  });
  const p=page(entries,18),bytes=(v:unknown)=>new TextEncoder().encode(JSON.stringify(v)).byteLength;
  const room=sourceAccountPageMaxBytes-bytes(p),last=entries[16];assert(last&&room>0&&room<24000);
  last.disclosureText='\u0001'.repeat(Math.floor(room/6))+'x'.repeat(room%6);
  assert(Array.from(last.disclosureText).length<=4000);assert.equal(bytes(p),400000);accepts(p);
  last.disclosureText+='x';assert.equal(bytes(p),400001);rejects(p);
  t.diagnostic(`exact escaped bytes400000/400001; last scalars ${Array.from(last.disclosureText).length}`);
});

// Independent finite oracle: enumerate complete ordered chains and cuts, never the implementation's bound.
// Universe is five consent IDs; unseen nodes may form one additional unobserved group. This is bounded
// causal-graph evidence, not a proof of arbitrary graph sizes, UUID placement or actual query producers.
type Fact={group:string;previous:string|null;terminal:boolean};
const pool=[10,20,30,40,50].map(id);
const groupKey=(r:SourceAccountConsent)=>`${r.consent.groupId}:${r.consent.purpose}`;
function combinations(values:readonly string[],n:number):string[][]{
  if(n===0)return [[]];const result:string[][]=[];
  for(let i=0;i<=values.length-n;i++)for(const rest of combinations(values.slice(i+1),n-1))result.push([values[i]!,...rest]);
  return result;
}
function permutations(values:readonly string[]):string[][]{
  if(values.length===0)return [[]];const result:string[][]=[];
  for(let i=0;i<values.length;i++)for(const rest of permutations([...values.slice(0,i),...values.slice(i+1)]))result.push([values[i]!,...rest]);
  return result;
}
function lengths(total:number,groups:number):number[][]{
  if(groups===1)return total>0?[[total]]:[];const result:number[][]=[];
  for(let first=1;first<=total-groups+1;first++)for(const tail of lengths(total-first,groups-1))result.push([first,...tail]);
  return result;
}
const catalogs=new Map<string,Map<string,Fact>[]>();
function candidates(keys:string[],total:number):Map<string,Fact>[] {
  const cacheKey=JSON.stringify([keys,total]),cached=catalogs.get(cacheKey);if(cached)return cached;
  const result:Map<string,Fact>[]=[];
  for(const labels of [keys,[...keys,'unobserved-group']])for(const sizes of lengths(total,labels.length)){
    for(const subset of combinations(pool,total))for(const order of permutations(subset)){
      const facts=new Map<string,Fact>();let at=0;
      for(let g=0;g<labels.length;g++){
        const size=sizes[g]!,key=labels[g]!;
        for(let j=0;j<size;j++,at++)facts.set(order[at]!,{group:key,previous:j===0?null:order[at-1]!,terminal:j===size-1});
      }
      result.push(facts);
    }
  }
  catalogs.set(cacheKey,result);return result;
}
function oracle(records:SourceAccountConsent[],total:number):boolean{
  const keys=[...new Set(records.map(groupKey))].sort();
  return candidates(keys,total).some(facts=>records.every(r=>{
    const f=facts.get(r.consent.id);return f!==undefined&&f.group===groupKey(r)&&f.previous===r.supersedesConsentId&&f.terminal===(r.effective!=='superseded');
  }));
}
test('bounded independent five-ID completion oracle checks partial causal totals',t=>{
  const predecessors=[null,10,20,30,40,50],effects=['not_withdrawn','superseded'] as const;
  let checked=0,accepted=0,rejected=0;
  function check(entries:SourceAccountConsent[],total:number):void{
    const possible=oracle(entries,total),p=page(entries,total);let actual:boolean;
    try{mapSourceAccountResult(command,p,{clientId:client});actual=true;}catch(error){assert.match(String(error),/^Error: unavailable$/);actual=false;}
    assert.equal(actual,possible,JSON.stringify({total,entries:entries.map(r=>({id:r.consent.id,group:groupKey(r),prev:r.supersedesConsentId,effective:r.effective}))}));
    checked++;if(possible)accepted++;else rejected++;
  }
  for(const previous of predecessors)for(const effective of effects)for(let total=1;total<=5;total++)check([row(20,previous,effective)],total);
  for(const a of predecessors)for(const b of predecessors)for(const ea of effects)for(const eb of effects)for(let total=2;total<=5;total++)check([row(20,a,ea),row(40,b,eb)],total);
  for(const separate of ['group','purpose'] as const)for(const a of [null,10,30])for(const b of [null,30,50])for(let total=2;total<=5;total++){
    const second=row(40,b);if(separate==='group')second.consent.groupId=otherGroup;else second.consent.purpose='service_review';
    check([row(20,a,'superseded'),second],total);
  }
  assert(accepted>0&&rejected>0);t.diagnostic(`finite causal-completion oracle: ${checked} cases; ${accepted} feasible, ${rejected} impossible; at most5 IDs`);
});
