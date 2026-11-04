import assert from 'node:assert/strict';
import {test} from 'node:test';
let api={};
for(const name of ['Validation','Mapping','Values']){
 try{api={...api,...await import(new URL('../../../src/contracts/PortalServiceFinancials'+name+'.ts',import.meta.url).href)};}
 catch(error){if(error.code!=='ERR_MODULE_NOT_FOUND')throw error;}
}
const call=(name,...args)=>{assert.equal(typeof api[name],'function','new financials export '+name+' must exist');return api[name](...args);};
const id='10000000-0000-4000-8000-000000000001',quote='10000000-0000-4000-8000-000000000002';
const snapshot={paymentRevision:4,serviceRevision:7,asOfDay:'2026-11-03',hash:'a'.repeat(64)};
const command={schemaVersion:1,action:'read_client_service_financials_v1',snapshot:null,cursor:null,limit:100};
const payment={kind:'canonical_payment',claimId:id,quoteId:quote,verifiedAt:'2026-11-03T10:00:00Z',serviceCents:10000,period:{state:'pending_publication'}};
const view={schemaVersion:1,snapshot,payments:[payment],nextCursor:null,firstPublicationOn:{state:'unknown'},pendingServiceQuotes:[],guarantee:{state:'unavailable',code:'service_terms_unavailable'}};
test('own financials is exactly one fixed readonly RPC',()=>{
 assert.deepEqual(call('readServiceFinancialsCommand',command),command);
 assert.deepEqual(call('buildServiceFinancialsRpc',command),{name:'concierge_client_service_financials_read_v1',args:{p_command:command}});
});
test('metadata denies human/task transports and has bounded new-family limits',()=>{
 assert.equal(call('serviceFinancialsAccess','client'),'READ');assert.equal(call('serviceFinancialsAccess','human'),'DENY');assert.equal(call('serviceFinancialsAccess','task_agent'),'DENY');
 assert.equal(api.serviceFinancialsCommandMaxBytes,8192);assert.equal(api.serviceFinancialsResultMaxBytes,262144);assert.equal(api.serviceFinancialsAuthMaxBytes,8192);assert.equal(api.serviceFinancialsPageMax,100);assert.equal(api.serviceFinancialsCursorMaxBytes,512);
});
for(const extra of [{clientId:id},{actorId:id},{role:'owner'},{requestId:id},{rpc:'other'},{url:'https://example.com'},{approved:true}])test('no caller identity/authority/endpoint selector '+Object.keys(extra)[0],()=>assert.throws(()=>call('readServiceFinancialsCommand',{...command,...extra}),/invalid_input/));
for(const limit of [0,101,-1,1.5,null])test('invalid page limit '+limit,()=>assert.throws(()=>call('readServiceFinancialsCommand',{...command,limit}),/invalid_input/));
test('a cursor requires an exact previous snapshot and is bounded in UTF8 bytes',()=>{
 assert.throws(()=>call('readServiceFinancialsCommand',{...command,cursor:'next'}),/invalid_input/);
 const next={...command,snapshot,cursor:'next'};assert.deepEqual(call('readServiceFinancialsCommand',next),next);
 assert.throws(()=>call('readServiceFinancialsCommand',{...next,cursor:'é'.repeat(257)}),/invalid_input/);
});
test('positive represented canonical receipt keeps pending publication honestly unknown',()=>{
 const result=call('mapServiceFinancialsResult',view,command);assert.deepEqual(result,view);
 assert.equal(result.payments[0].period.state,'pending_publication');assert.equal(result.firstPublicationOn.state,'unknown');assert.equal(result.guarantee.state,'unavailable');
});
test('actual numeric cents are never rewritten to the current offer by mapping',()=>{
 const result=call('mapServiceFinancialsResult',{...view,payments:[{...payment,serviceCents:2500}]},command);assert.equal(result.payments[0].serviceCents,2500);
});
test('unrepresented legacy receipt cannot invent canonical IDs or pending period',()=>{
 for(const p of [{...payment,kind:'legacy_receipt'},{...payment,claimId:null},{...payment,quoteId:null},{...payment,period:{state:'unknown'}}])assert.throws(()=>call('mapServiceFinancialsResult',{...view,payments:[p]},command),/unavailable/);
});
test('known canonical period retains exact month-end clamping and exclusive end',()=>{
 const p={...payment,period:{state:'scheduled',startOn:'2024-01-31',endOn:'2024-02-29'}};
 assert.deepEqual(call('mapServiceFinancialsResult',{...view,payments:[p]},command).payments[0].period,p.period);
 assert.throws(()=>call('mapServiceFinancialsResult',{...view,payments:[{...p,period:{...p.period,endOn:'2024-03-01'}}]},command),/unavailable/);
});
test('v1 accepts finite unavailability and refuses an unsupported guarantee success',()=>{
 for(const code of ['payment_lineage_unavailable','legacy_payment_provenance_required','service_terms_unavailable','period_basis_unavailable','calendar_policy_unavailable','broader_terms_unavailable'])assert.equal(call('mapServiceFinancialsResult',{...view,guarantee:{state:'unavailable',code}},command).guarantee.code,code);
 for(const guarantee of [{state:'supported',termsVersion:1,firstThreePaidCents:10000},{state:'unavailable',code:'other'},{state:'unavailable',code:'service_terms_unavailable',evidence:'PRIVATE'}])assert.throws(()=>call('mapServiceFinancialsResult',{...view,guarantee},command),/unavailable/);
});
test('page response binds exact snapshot, cardinality and forward progress',()=>{
 const next={...command,snapshot,cursor:'original',limit:1};assert.deepEqual(call('mapServiceFinancialsResult',view,next),view);
 assert.throws(()=>call('mapServiceFinancialsResult',{...view,snapshot:{...snapshot,serviceRevision:8}},next),/unavailable/);
 assert.throws(()=>call('mapServiceFinancialsResult',{...view,nextCursor:'original'},next),/unavailable/);
 assert.throws(()=>call('mapServiceFinancialsResult',{...view,payments:[],nextCursor:'next'},next),/unavailable/);
});
test('duplicate receipt/quote and contradictory pending quote do not become a complete ledger',()=>{
 for(const delta of [{payments:[payment,payment]},{payments:[payment,{...payment,claimId:quote}]},{pendingServiceQuotes:[{id:quote,version:1}]},{pendingServiceQuotes:[{id:id,version:1},{id:id,version:2}]}])assert.throws(()=>call('mapServiceFinancialsResult',{...view,...delta},command),/unavailable/);
});
test('private source/bank/verification details and impossible known dates are rejected',()=>{
 for(const delta of [{privateNotes:'PRIVATE'},{bankReference:'PRIVATE'},{firstPublicationOn:{state:'known',value:'2025-02-29'}},{firstPublicationOn:{state:'unknown',value:'2026-01-01'}},{payments:[{...payment,verificationReference:'PRIVATE'}]}])assert.throws(()=>call('mapServiceFinancialsResult',{...view,...delta},command),/unavailable/);
});
test('JSON getters are refused without evaluation and parsed output is detached/frozen',()=>{
 let reads=0;const bad={...command};Object.defineProperty(bad,'cursor',{enumerable:true,get(){reads++;return null;}});
 assert.throws(()=>call('readServiceFinancialsCommand',bad),/invalid_input/);assert.equal(reads,0);
 const input=structuredClone(view),mapped=call('mapServiceFinancialsResult',input,command);input.payments[0].serviceCents=1;
 assert.equal(mapped.payments[0].serviceCents,10000);assert.equal(Object.isFrozen(mapped),true);assert.equal(Object.isFrozen(mapped.payments[0]),true);
});

test('bounded-domain roundtrip preserves every allowed page limit and detached snapshot',()=>{
 for(let limit=1;limit<=100;limit++){
  for(const basis of [null,snapshot]){
   const input={...command,limit,snapshot:basis};
   const parsed=call('readServiceFinancialsCommand',input);
   assert.deepEqual(parsed,input);
   assert.deepEqual(call('readServiceFinancialsCommand',JSON.parse(JSON.stringify(parsed))),input);
   assert.deepEqual(call('buildServiceFinancialsRpc',input).args.p_command,input);
   if(basis!==null)assert.notEqual(parsed.snapshot,basis);
  }
 }
});
test('bounded UTF8 domain enforces bytes while preserving exact valid opaque cursors',()=>{
 for(const scalar of ['a','é','€','🧴']){
  const width=new TextEncoder().encode(scalar).byteLength;
  for(let n=1;n<=Math.floor(512/width)+1;n++){
   const cursor=scalar.repeat(n),input={...command,snapshot,cursor};
   if(new TextEncoder().encode(cursor).byteLength<=512)assert.equal(call('readServiceFinancialsCommand',input).cursor,cursor);
   else assert.throws(()=>call('readServiceFinancialsCommand',input),/invalid_input/);
  }
 }
});

test('first publication later than the supplied server day is not a current fact',()=>{
 assert.throws(()=>call('mapServiceFinancialsResult',{...view,firstPublicationOn:{state:'known',value:'2026-11-04'}},command),/unavailable/);
});
test('verification time is bounded by the supplied Chicago business day',()=>{
 assert.throws(()=>call('mapServiceFinancialsResult',{...view,payments:[{...payment,verifiedAt:'2026-11-04T06:00:00Z'}]},command),/unavailable/);
});
test('UTC next-date verification still belongs to the previous Chicago day',()=>{
 const input={...view,payments:[{...payment,verifiedAt:'2026-11-04T05:59:00Z'}]};
 assert.equal(call('mapServiceFinancialsResult',input,command).payments[0].verifiedAt,'2026-11-04T05:59:00Z');
});
