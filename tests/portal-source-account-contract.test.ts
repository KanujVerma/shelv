import assert from 'node:assert/strict';
import {test} from 'node:test';
import type {
  SourceAccountCommand, SourceAccountConsent, SourceAccountListCommand, SourceAccountWithdrawCommand,
  SourceAccountStatusCommand, SourceAccountPage, SourceAccountReceipt, SourceAccountMappingContext,
} from '../src/contracts/PortalSourceAccount.ts';
import {readSourceAccountCommand,buildSourceAccountRpc,readSourceAccountRecords} from '../src/contracts/PortalSourceAccountValidation.ts';
import {mapSourceAccountResult,collectSourceAccountPages,decodeSourceAccountResponse} from '../src/contracts/PortalSourceAccountMapping.ts';
import {sourceAccountPageMaxBytes,sourceAccountDisclosureMaxScalars,sourceAccountErrorStatuses} from '../src/contracts/PortalSourceAccountValues.ts';

// These tests are pure. Any accidental network use, including by future imports, fails.
globalThis.fetch = async () => { throw Error('external_fetch_denied'); };
const client='10000000-0000-4000-8000-000000000001';
const advisor='10000000-0000-4000-8000-000000000002';
const foreign='10000000-0000-4000-8000-000000000003';
const consentId='10000000-0000-4000-8000-000000000004';
const requestId='10000000-0000-4000-8000-000000000005';
const eventId='10000000-0000-4000-8000-000000000006';
// Explicit synthetic producer fact: these records belong to one opaque consent-scope group.
const groupId='10000000-0000-4000-8000-000000000007';
const hash='a'.repeat(64), requestHash='b'.repeat(64), now='2026-11-01T12:00:00Z';
const snapshot={revision:7,hash};
const ref={id:consentId,groupId,purpose:'service_storage' as const,disclosure:{version:2,hash}};
// Actual typed constructions for ALL three proposed actions, without positive result casts.
const list:SourceAccountListCommand={schemaVersion:1,action:'list_source_consents_v1',snapshot:null,cursor:null,limit:100};
const withdraw:SourceAccountWithdrawCommand={schemaVersion:1,action:'withdraw_source_consent_v1',requestId,expectedRevision:7,consent:ref};
const status:SourceAccountStatusCommand={schemaVersion:1,action:'request_status_v1',requestId};
const commands:SourceAccountCommand[]=[list,withdraw,status];
const context:SourceAccountMappingContext={clientId:client,requestHash,originalWithdrawal:withdraw};
const base={schemaVersion:1 as const,visibility:'client_account' as const,clientId:client};
function row(id=consentId):SourceAccountConsent{return {
  consent:{...ref,id},disclosureText:'SYNTHETIC TEST DISCLOSURE ONLY.\uFEFF\r\nStorage purpose e\u0301 🧪.',
  confirmation:{kind:'manual',decision:'allow',channel:'call',occurredAt:{state:'unknown'},recordedBy:advisor,recordedAt:now},
  supersedesConsentId:null,effective:'not_withdrawn',withdrawal:null,
};}
function page(entries:SourceAccountConsent[]=[row()]):SourceAccountPage{return {...base,state:'page',snapshot,cursor:null,total:entries.length,entries,nextCursor:null};}
function receipt():SourceAccountReceipt{return {...base,action:'withdraw_source_consent_v1',requestId,commandHash:requestHash,revision:8,outcome:'withdrawn',withdrawal:{id:eventId,origin:'client_portal',consent:ref,recordedBy:client,recordedAt:now}};}
const clone=<T>(v:T):T=>structuredClone(v);
const invalid=(c:SourceAccountCommand,value:unknown,ctx=context)=>assert.throws(()=>mapSourceAccountResult(c,value,ctx),new RegExp(c.action==='withdraw_source_consent_v1'?'^Error: uncertain$':'^Error: unavailable$'));
const byteLength=(v:unknown)=>new TextEncoder().encode(JSON.stringify(v)).byteLength;

test('all typed actions build one fixed closed RPC and parse without a client selector',()=>{
  for(const c of commands)assert.deepEqual(buildSourceAccountRpc(c),{name:'concierge_source_account_command_v1',args:{p_command:c}});
  for(const c of commands)for(const extra of [{clientId:foreign},{actorId:advisor},{current:true},{approved:true},{url:'https://example.invalid'},{rpc:'foreign'},{raw:'PRIVATE_CANARY'},{reference:'PRIVATE_CANARY'},{originalName:'PRIVATE_CANARY'},{handleId:eventId}])assert.throws(()=>readSourceAccountCommand({...c,...extra}),/invalid_input/);
});
test('safe own list and exact withdrawal/status positives retain immutable manual and portal attribution',()=>{
  assert.deepEqual(mapSourceAccountResult(list,page(),{clientId:client}),page());
  const r=receipt();assert.deepEqual(mapSourceAccountResult(withdraw,r,context),r);
  assert.deepEqual(mapSourceAccountResult(status,{...base,requestId,status:'committed',receipt:r},context),{...base,requestId,status:'committed',receipt:r});
  const item=row();item.effective='withdrawn';item.withdrawal=r.withdrawal;
  assert.deepEqual(mapSourceAccountResult(list,page([item]),{clientId:client}),page([item]));
  assert.equal(item.confirmation.kind,'manual');assert.equal(item.confirmation.channel,'call');
  assert.equal(item.withdrawal.origin,'client_portal');
});
test('foreign client and wrong original receipt cannot become own Account data',()=>{
  invalid(list,{...page(),clientId:foreign});invalid(withdraw,{...receipt(),clientId:foreign});
  invalid(withdraw,{...receipt(),withdrawal:{...receipt().withdrawal,recordedBy:advisor}});
  invalid(status,{...base,requestId,status:'committed',receipt:receipt()},{...context,originalWithdrawal:{...withdraw,requestId:foreign}});
  invalid(status,{...base,requestId,status:'committed',receipt:receipt()},{clientId:client});
  invalid(withdraw,{...receipt(),commandHash:hash});
  invalid(withdraw,{...receipt(),revision:9});
});
test('stale consent ID, purpose or disclosure never acknowledges a newer allow',()=>{
  for(const consent of [{...ref,id:foreign},{...ref,purpose:'service_review'},{...ref,disclosure:{version:3,hash}},{...ref,disclosure:{version:2,hash:requestHash}}])invalid(withdraw,{...receipt(),withdrawal:{...receipt().withdrawal,consent}});
  invalid(withdraw,{...receipt(),requestId:foreign});
  invalid(withdraw,{...receipt(),withdrawal:{...receipt().withdrawal,origin:'call'}});
});
test('unavailable is distinct from complete empty, queried absence and purged original status',()=>{
  assert.deepEqual(collectSourceAccountPages([{command:list,page:page([])}],{clientId:client}),{...base,state:'complete',snapshot,entries:[]});
  for(const code of ['client_lineage_unavailable','consent_unavailable','disclosure_unavailable','attribution_unavailable','lifecycle_unavailable']){
    const value={...base,state:'unavailable',code};assert.deepEqual(mapSourceAccountResult(list,value,{clientId:client}),value);
    invalid(list,{...value,entries:[],total:0});
  }
  for(const value of [{...base,requestId,status:'absent'},{...base,requestId,status:'unavailable',code:'request_purged'},{...base,requestId,status:'unavailable',code:'request_unavailable'}])assert.deepEqual(mapSourceAccountResult(status,value,context),value);
  assert.throws(()=>collectSourceAccountPages([],{clientId:client}),/unavailable/);
});
test('manual channels and unknown occurrence stay truthful; impossible instants never normalize',()=>{
  for(const channel of ['text','call','video','in_person'] as const){const item=row();item.confirmation.channel=channel;assert.deepEqual(mapSourceAccountResult(list,page([item]),{clientId:client}),page([item]));}
  for(const stamp of ['2024-02-29T23:59:59.123456Z','2000-02-29T12:00:00+02:00']){
    const item=row();item.confirmation.occurredAt={state:'known',value:stamp};assert.deepEqual(mapSourceAccountResult(list,page([item]),{clientId:client}),page([item]));
  }
  for(const stamp of ['2026-02-30T12:00:00Z','2100-02-29T12:00:00Z','2026-11-01T24:00:00Z','2026-11-01T12:60:00Z','2026-11-01T12:00:60Z']){
    const item=row();item.confirmation.recordedAt=stamp;invalid(list,page([item]));
    invalid(withdraw,{...receipt(),withdrawal:{...receipt().withdrawal,recordedAt:stamp}});
  }
});
test('unsafe numbers, prototypes, getters, sparse arrays and non-JSON never reach positive parsing',()=>{
  for(const n of [-1,1.5,NaN,Infinity,Number.MAX_SAFE_INTEGER,Number.MAX_SAFE_INTEGER+1])assert.throws(()=>readSourceAccountCommand({...withdraw,expectedRevision:n}),/invalid_input/);
  for(const n of [0,101,NaN,Number.MAX_SAFE_INTEGER+1])assert.throws(()=>readSourceAccountCommand({...list,limit:n}),/invalid_input/);
  assert.throws(()=>readSourceAccountCommand(Object.assign(Object.create({actorId:advisor}),list)),/invalid_input/);
  const getter={...list};Object.defineProperty(getter,'limit',{get(){throw Error('PRIVATE_CANARY');},enumerable:true});assert.throws(()=>readSourceAccountCommand(getter),/^Error: invalid_input$/);
  invalid(list,{...page(),entries:new Array(1)});invalid(list,{...page(),entries:[undefined]});
});

test('record semantics reject impossible effective decisions and manufactured manual portal evidence',()=>{
  const manual=row();manual.confirmation.decision='withdraw';manual.effective='withdrawn';
  assert.deepEqual(mapSourceAccountResult(list,page([manual]),{clientId:client}),page([manual]));
  invalid(list,page([{...row(),effective:'withdrawn'}]));
  invalid(list,page([{...manual,effective:'not_withdrawn'}]));
  invalid(list,page([{...manual,withdrawal:receipt().withdrawal}]));
  invalid(list,page([{...row(),withdrawal:receipt().withdrawal}]));
  invalid(list,page([{...row(),effective:'withdrawn',withdrawal:{...receipt().withdrawal,consent:{...ref,id:foreign}}}]));
  invalid(list,page([{...row(),effective:'withdrawn',withdrawal:{...receipt().withdrawal,recordedBy:foreign}}]));
  invalid(withdraw,{...receipt(),withdrawal:{...receipt().withdrawal,id:consentId}});
});
test('known occurrence and later withdrawal chronology preserve exact microseconds and offsets',()=>{
  const item=row();item.confirmation.occurredAt={state:'known',value:'2026-11-01T11:59:59.999999Z'};
  item.confirmation.recordedAt='2026-11-01T12:00:00.000001Z';
  assert.deepEqual(mapSourceAccountResult(list,page([item]),{clientId:client}),page([item]));
  item.confirmation.occurredAt={state:'known',value:'2026-11-01T14:00:00.000002+02:00'};invalid(list,page([item]));
  const later=row();later.confirmation.recordedAt='2026-11-01T12:00:00.000002Z';later.effective='withdrawn';
  later.withdrawal={...receipt().withdrawal,recordedAt:'2026-11-01T14:00:00.000001+02:00'};invalid(list,page([later]));
});
test('private supersets fail closed at every own-data boundary without echoing the canary',()=>{
  for(const extras of [{actorId:advisor},{privateReference:'PRIVATE_CANARY'},{reference:'PRIVATE_CANARY'},{filename:'PRIVATE_CANARY'},{body:'PRIVATE_CANARY'},{transcript:'PRIVATE_CANARY'},{notes:'PRIVATE_CANARY'},{locator:'PRIVATE_CANARY'},{path:'PRIVATE_CANARY'},{handle:'PRIVATE_CANARY'},{grants:[]},{permissions:[]},{clientId:foreign}]){
    invalid(list,{...page(),...extras});
    invalid(list,page([{...row(),...extras}]));
    invalid(list,page([{...row(),confirmation:{...row().confirmation,...extras}}]));
    invalid(withdraw,{...receipt(),withdrawal:{...receipt().withdrawal,...extras}});
  }
  invalid(list,{...page(),visibility:'advisor_private'});
  invalid(list,{...page(),entries:[{...row(),consent:{...ref,sourceId:consentId}}]});
  invalid(list,{...page(),entries:[{...row(),consent:{...ref,disclosure:{...ref.disclosure,url:'https://example.invalid'}}}]});
});
test('disclosure bytes stay exact plain text with no guessed copy, lone surrogate or markup',()=>{
  const p=page(),value=mapSourceAccountResult(list,p,{clientId:client});
  assert.deepEqual(value,p);assert.equal(p.entries[0]?.disclosureText,'SYNTHETIC TEST DISCLOSURE ONLY.\uFEFF\r\nStorage purpose e\u0301 🧪.');
  for(const text of ['', '  ', '<script>PRIVATE_CANARY</script>', '<img src=x onerror=alert(1)>', '\ud800', '\udfff', 'text\0tail'])invalid(list,page([{...row(),disclosureText:text}]));
  invalid(list,{...page(),entries:[{...row(),disclosureText:undefined}]});
  invalid(list,{...page(),entries:[{...row(),confirmation:{...row().confirmation,occurredAt:{state:'unknown',value:now}}}]});
});
const seriesId=(n:number)=>`20000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
function history(n:number):SourceAccountConsent[]{return Array.from({length:n},(_,i)=>({...row(seriesId(i+1)),supersedesConsentId:i===0?null:seriesId(i),effective:i===n-1?'not_withdrawn':'superseded'}));}
function historyReads():{command:SourceAccountListCommand;page:SourceAccountPage}[]{
  const items=history(201),sizes=[67,89,45];let offset=0;
  return sizes.map(size=>{
    const cursor=offset===0?null:offset,entries=items.slice(offset,offset+size);offset+=size;
    return {command:{...list,snapshot:cursor===null?null:snapshot,cursor,limit:size},page:{...base,state:'page',snapshot,cursor,total:201,entries,nextCursor:offset===201?null:offset}};
  });
}
test('201 records across bounded variable pages are complete only after the terminal exact chain',()=>{
  const reads=historyReads(),all=collectSourceAccountPages(reads,{clientId:client});
  assert.equal(all.entries.length,201);assert.equal(all.entries[200]?.consent.id,seriesId(201));
  assert.throws(()=>collectSourceAccountPages(reads.slice(0,1),{clientId:client}),/^Error: unavailable$/);
  assert.throws(()=>collectSourceAccountPages(reads.slice(0,2),{clientId:client}),/^Error: unavailable$/);
  assert.throws(()=>collectSourceAccountPages([...reads,reads[0]!],{clientId:client}),/^Error: unavailable$/);
  assert.throws(()=>collectSourceAccountPages([...reads].reverse(),{clientId:client}),/^Error: unavailable$/);
});
test('duplicate identities, inconsistent disclosures and multiple current rows cannot masquerade as complete',()=>{
  invalid(list,page([row(),row()]));
  invalid(list,page([row(),row(foreign)]));
  const first={...row(),effective:'superseded' as const},second={...row(foreign),supersedesConsentId:first.consent.id,disclosureText:'SYNTHETIC DIFFERENT SAME VERSION'};
  invalid(list,page([first,second]));
  invalid(list,page([first,{...second,disclosureText:first.disclosureText,consent:{...second.consent,disclosure:{version:2,hash:requestHash}}}]));
  const reads=historyReads(),bad=clone(reads);assert(bad[1]&&bad[0]);bad[1].page.entries[0]=bad[0].page.entries[0]!;
  assert.throws(()=>collectSourceAccountPages(bad,{clientId:client}),/^Error: unavailable$/);
});
test('snapshot, offsets, totals and tail cannot claim false absence or discard missing history',()=>{
  assert.throws(()=>readSourceAccountCommand({...list,cursor:1}),/invalid_input/);
  invalid(list,{...page(),total:2});invalid(list,{...page(),total:0});
  invalid(list,{...page(),total:2,nextCursor:2});invalid(list,{...page(),total:1,nextCursor:1});
  invalid(list,{...page(),entries:[],total:1,nextCursor:1});
  invalid({...list,limit:1},page(history(2)));
  const reads=historyReads();assert(reads[1]);
  invalid(reads[1].command,{...reads[1].page,cursor:68});
  invalid(reads[1].command,{...reads[1].page,snapshot:{...snapshot,revision:8}});
  const bad=clone(reads);assert(bad[2]);bad[2].page.total=202;
  assert.throws(()=>collectSourceAccountPages(bad,{clientId:client}),/^Error: unavailable$/);
  invalid({...list,snapshot,cursor:Number.MAX_SAFE_INTEGER},{...page(),cursor:Number.MAX_SAFE_INTEGER,total:Number.MAX_SAFE_INTEGER});
});
test('maximum escaped disclosure and page budget use actual UTF8 envelopes, no unrelated cap increase',()=>{
  const text='\u0001'.repeat(sourceAccountDisclosureMaxScalars);assert.equal(Array.from(text).length,4000);
  const items=history(100).map(item=>({...item,disclosureText:text}));
  const oversized=page(items);assert(byteLength(oversized)>sourceAccountPageMaxBytes);invalid(list,oversized);
  let count=1;
  while(count<items.length&&byteLength({...page(items.slice(0,count+1)),total:100,nextCursor:count+1})<=sourceAccountPageMaxBytes)count++;
  const maximum={...page(items.slice(0,count)),total:100,nextCursor:count};
  assert(byteLength(maximum)<=sourceAccountPageMaxBytes);
  assert.deepEqual(mapSourceAccountResult(list,maximum,{clientId:client}),maximum);
  assert(byteLength({...maximum,entries:items.slice(0,count+1),nextCursor:count+1})>sourceAccountPageMaxBytes);
  invalid(list,page([{...row(),disclosureText:text+'x'}]));
  const astral='🧪'.repeat(4000);assert.equal(new TextEncoder().encode(astral).length,16000);
  assert.deepEqual(mapSourceAccountResult(list,page([{...row(),disclosureText:astral}]),{clientId:client}),page([{...row(),disclosureText:astral}]));
});
test('finite errors do not expose private payload and malformed write success stays uncertain with original retry',()=>{
  for(const [code,httpStatus] of Object.entries(sourceAccountErrorStatuses)){
    const outcome=decodeSourceAccountResponse(withdraw,httpStatus,{code},context);
    assert.equal(outcome.state,httpStatus===503?'uncertain':'rejected');
    assert(!JSON.stringify(outcome).includes('PRIVATE_CANARY'));
  }
  const uncertain=decodeSourceAccountResponse(withdraw,200,{...receipt(),body:'PRIVATE_CANARY'},context);
  assert.deepEqual(uncertain,{state:'uncertain',status:503,code:'uncertain',retry:withdraw});
  assert.deepEqual(decodeSourceAccountResponse(list,200,{...page(),raw:'PRIVATE_CANARY'},{clientId:client}),{state:'rejected',status:503,code:'unavailable'});
  for(const httpStatus of [400,503,500,NaN,200.5]){
    assert.deepEqual(decodeSourceAccountResponse(status,httpStatus,{code:'unknown',message:'PRIVATE_CANARY'},context),{state:'rejected',status:503,code:'unavailable'});
  }
});
test('parsed commands/results are detached, canonical UUIDs are checked without normalizing disclosure bytes',()=>{
  const raw=page(),mapped=mapSourceAccountResult(list,raw,{clientId:client.toUpperCase()});
  assert.notStrictEqual(raw,mapped);raw.entries[0]!.disclosureText='CHANGED';
  assert.equal('entries' in mapped&&mapped.entries[0]?.disclosureText.includes('SYNTHETIC TEST'),true);
  const command=clone(withdraw),call=buildSourceAccountRpc(command);command.consent.disclosure.version=3;
  assert.deepEqual(call.args.p_command,withdraw);
  assert.throws(()=>readSourceAccountCommand({...withdraw,consent:{...ref,id:'00000000-0000-0000-0000-000000000000'}}),/invalid_input/);
});

test('storage and service review are independent purposes with exact positive withdrawals for each',()=>{
  const storage=row(),review=row(seriesId(2));review.consent.purpose='service_review';
  assert.deepEqual(mapSourceAccountResult(list,page([storage,review]),{clientId:client}),page([storage,review]));
  const c:SourceAccountWithdrawCommand={...withdraw,consent:review.consent};
  const r:SourceAccountReceipt={...receipt(),withdrawal:{...receipt().withdrawal,consent:review.consent}};
  assert.deepEqual(mapSourceAccountResult(c,r,{clientId:client,requestHash}),r);
  invalid(c,receipt(),{clientId:client,requestHash});
  const unavailable=decodeSourceAccountResponse(c,200,{...r,consentRequired:false},{clientId:client,requestHash});
  assert.equal(unavailable.state,'uncertain');
});
test('one linked portal event cannot identify withdrawals of two different purpose records',()=>{
  const a=row(),b=row(seriesId(2));b.consent.purpose='service_review';a.effective=b.effective='withdrawn';
  a.withdrawal=receipt().withdrawal;b.withdrawal={...receipt().withdrawal,consent:b.consent};
  invalid(list,page([a,b]));
  b.withdrawal.id=seriesId(1);
  assert.deepEqual(mapSourceAccountResult(list,page([a,b]),{clientId:client}),page([a,b]));
});
test('exported record reader rejects unsafe array prototypes and does not invoke array accessors',()=>{
  class ForeignArray extends Array<SourceAccountConsent>{}
  assert.throws(()=>readSourceAccountRecords(new ForeignArray(row()),client),/^Error: invalid_input$/);
  const unsafe=[row()];let invoked=false;
  Object.defineProperty(unsafe,'0',{enumerable:true,get(){invoked=true;throw Error('PRIVATE_CANARY');}});
  assert.throws(()=>readSourceAccountRecords(unsafe,client),/^Error: invalid_input$/);assert.equal(invoked,false);
  invalid(list,{...page(),entries:new ForeignArray(row())});
});
test('a malicious non-JSON proxy cannot escape finite command or result errors',()=>{
  const hostile=new Proxy({}, {ownKeys(){throw Error('PRIVATE_CANARY');}});
  assert.throws(()=>readSourceAccountCommand(hostile),/^Error: invalid_input$/);
  invalid(list,hostile);invalid(withdraw,hostile);
});
test('cross-page declaration and current-purpose contradictions reject without a total history cutoff',()=>{
  const reads=historyReads(),altered=clone(reads);assert(altered[1]);
  altered[1].page.entries=altered[1].page.entries.map(item=>({...item,disclosureText:'SYNTHETIC SECOND PAGE SAME VERSION CHANGE'}));
  assert.throws(()=>collectSourceAccountPages(altered,{clientId:client}),/^Error: unavailable$/);
  const badCurrent=clone(reads);assert(badCurrent[0]?.page.entries[0]);badCurrent[0].page.entries[0].effective='not_withdrawn';
  assert.throws(()=>collectSourceAccountPages(badCurrent,{clientId:client}),/^Error: unavailable$/);
  const nullPrototype=Object.assign(Object.create(null),list);
  assert.deepEqual(readSourceAccountCommand(nullPrototype),list);
});
test('original status binds every branch to original own UUID and cannot substitute current eligibility',()=>{
  for(const value of [{...base,requestId:foreign,status:'absent'},{...base,requestId,status:'absent',approved:true},{...base,requestId,status:'unavailable',code:'request_purged',receipt:receipt()}])invalid(status,value);
  invalid(status,{...base,requestId,status:'committed',receipt:{...receipt(),clientId:foreign}});
  invalid(status,{...base,requestId,status:'committed',receipt:receipt()},{...context,requestHash:hash});
  invalid(status,{...base,requestId,status:'committed',receipt:receipt()},{...context,originalWithdrawal:{...withdraw,expectedRevision:6}});
  invalid(status,{...base,requestId,status:'absent'},{...context,requestHash:undefined});
});

// Compile-time excess-field negatives accompany the three actual positive literals above.
function typeNegatives():void{
  // @ts-expect-error client identity cannot enter command JSON
  const a:SourceAccountCommand={...list,clientId:client};
  // @ts-expect-error no actor override on a withdrawal
  const b:SourceAccountCommand={...withdraw,recordedBy:client};
  // @ts-expect-error status cannot carry a current/permission flag
  const c:SourceAccountCommand={...status,current:true};
  void [a,b,c];
}
void typeNegatives;
