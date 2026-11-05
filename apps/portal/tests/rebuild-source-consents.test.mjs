// Pure UX only. Actual Root codecs validate synthetic DTOs; no Source permission proof.
import test from 'node:test';import assert from 'node:assert/strict';
import {createSourceConsentsModel} from '../src/features/account/source-consents/model.ts';
import {page,consent,loaded,pending,client,uid} from './rebuild-source-consents-fixture.mjs';

test('missing read stays distinct from unavailable and a Root-accepted complete empty page',()=>{
 const model=createSourceConsentsModel({read:{state:'unknown'}});
 assert.equal(model.getSnapshot().read.state,'unknown');
 model.replace({read:{state:'unavailable',reason:'backend_unavailable'}});assert.equal(model.getSnapshot().read.state,'unavailable');
 model.replace(loaded(page([])));assert.equal(model.getSnapshot().read.state,'loaded');assert.equal(model.getSnapshot().read.page.total,0);assert.equal(model.getSnapshot().rows.length,0);
});
test('Root-accepted rows retain separate purposes, exact disclosure bytes and honest unknown occurrence',()=>{
 const input=page(),text='\ufeffSYNTHETIC 2 < 3 & "quoted"\r\nDe\u0301claration & exact text';input.entries[0].disclosureText=text;
 const model=createSourceConsentsModel(loaded(input)),s=model.getSnapshot();
 assert.equal(s.rows.length,2);assert.deepEqual(s.rows.map(r=>r.record.consent.purpose),['service_storage','service_review']);
 assert.equal(s.rows[0].record.disclosureText,text);assert.equal(s.rows[0].record.confirmation.occurredAt.state,'unknown');
 input.entries[0].disclosureText='MUTATED';assert.equal(s.rows[0].record.disclosureText,text);assert.ok(Object.isFrozen(s.rows[0].record.consent.disclosure));assert.equal(model.getSnapshot(),s);
});
test('a review captures exact tuple/text/snapshot and confirmation emits an intent once without a command or receipt',()=>{
 const intents=[],model=createSourceConsentsModel(loaded(page(),{onWithdrawalIntent:value=>intents.push(value)}));
 model.reviewWithdrawal(model.getSnapshot().rows[0]);const review=model.getSnapshot().confirmation;
 assert.ok(review);assert.deepEqual(review.consent,consent().consent);assert.equal(review.snapshot.revision,7);assert.equal(review.disclosureText,consent().disclosureText);
 model.confirmWithdrawal(review);model.confirmWithdrawal(review);
 assert.equal(intents.length,1);assert.equal(intents[0].kind,'withdrawal');assert.deepEqual(intents[0].consent,consent().consent);assert.deepEqual(intents[0].snapshot,{revision:7,hash:'c'.repeat(64)});
 assert.equal('requestId' in intents[0],false);assert.equal('outcome' in intents[0],false);assert.equal('clientId' in intents[0],false);assert.ok(Object.isFrozen(intents[0]));
 assert.equal(model.getSnapshot().intentState,'emitted');assert.equal(model.getSnapshot().rows[0].record.effective,'not_withdrawn');
});
test('cancel, replacement, disclosure changes, read-only presentation and old row identities retire confirmation',()=>{
 const intents=[],input=loaded(page(),{onWithdrawalIntent:x=>intents.push(x)}),model=createSourceConsentsModel(input);
 const row=model.getSnapshot().rows[0];model.reviewWithdrawal(row);let review=model.getSnapshot().confirmation;
 model.cancelReview(review);model.confirmWithdrawal(review);assert.equal(intents.length,0);
 model.reviewWithdrawal(row);review=model.getSnapshot().confirmation;
 const next=page();next.snapshot.revision=8;next.snapshot.hash='e'.repeat(64);next.entries[0].consent.disclosure.version=2;next.entries[0].disclosureText='SYNTHETIC CHANGED DISCLOSURE';
 model.replace(loaded(next,{onWithdrawalIntent:x=>intents.push(x)}));model.confirmWithdrawal(review);model.reviewWithdrawal(row);assert.equal(model.getSnapshot().confirmation,null);assert.equal(intents.length,0);
 model.replace({...input,presentation:'read_only'});model.reviewWithdrawal(model.getSnapshot().rows[0]);assert.equal(model.getSnapshot().confirmation,null);assert.match(model.getSnapshot().rows[0].unavailableReason,/read-only/);
});
test('missing callbacks, withdrawn and superseded records cannot open review and provide a reason',()=>{
 const old=consent();old.effective='superseded';const current=consent(12);current.supersedesConsentId=old.consent.id;current.confirmation.decision='withdraw';current.effective='withdrawn';
 const model=createSourceConsentsModel(loaded(page([old,current])));
 for(const row of model.getSnapshot().rows){assert.ok(row.unavailableReason);model.reviewWithdrawal(row);assert.equal(model.getSnapshot().confirmation,null);}
 model.replace(loaded());assert.match(model.getSnapshot().rows[0].unavailableReason,/unavailable/);model.reviewWithdrawal(model.getSnapshot().rows[0]);assert.equal(model.getSnapshot().confirmation,null);
});
test('reentrant subscriber replacement before intent callback prevents stale emission and retires private state',()=>{
 const intents=[],model=createSourceConsentsModel(loaded(page(),{onWithdrawalIntent:x=>intents.push(x)}));
 model.reviewWithdrawal(model.getSnapshot().rows[0]);const review=model.getSnapshot().confirmation;
 let ran=false;model.subscribe(()=>{if(!ran&&model.getSnapshot().intentState==='emitted'){ran=true;model.replace({read:{state:'unavailable',reason:'backend_unavailable'}});}});
 model.confirmWithdrawal(review);assert.equal(intents.length,0);assert.equal(model.getSnapshot().read.state,'unavailable');assert.equal(model.getSnapshot().rows.length,0);assert.equal(model.getSnapshot().confirmation,null);
});
test('callback reentry cannot dispatch the same review twice, and callback errors disclose no thrown content',()=>{
 let count=0,review,model;model=createSourceConsentsModel(loaded(page(),{onWithdrawalIntent:()=>{count++;model.confirmWithdrawal(review);throw Error('PRIVATE_CALLBACK_CANARY');}}));
 model.reviewWithdrawal(model.getSnapshot().rows[0]);review=model.getSnapshot().confirmation;
 assert.doesNotThrow(()=>model.confirmWithdrawal(review));assert.equal(count,1);assert.equal(model.getSnapshot().intentState,'unavailable');assert.doesNotMatch(JSON.stringify(model.getSnapshot()),/PRIVATE_CALLBACK_CANARY/);
});
test('Root rejected page supersets and contradictory histories become unavailable rather than empty',()=>{
 for(const value of [{...page(),privateSourceUrl:'https://private.invalid/raw'}, {...page(),entries:[{...consent(),effective:'superseded'}],total:1}]){
  const model=createSourceConsentsModel(loaded(value));assert.equal(model.getSnapshot().read.state,'unavailable');assert.equal(model.getSnapshot().rows.length,0);
 }
});
test('partial pages stay partial without a fabricated complete history or inferred missing consent',()=>{
 const model=createSourceConsentsModel(loaded(page([consent()],{total:2,nextCursor:1}))),s=model.getSnapshot();assert.equal(s.read.state,'loaded');assert.equal(s.read.page.total,2);assert.equal(s.read.page.nextCursor,1);assert.equal(s.rows.length,1);
});
test('recovery preserves unknown, actual absent, unavailable and purged as distinct non-success states',()=>{
 const states=[['unknown',{state:'unknown'}],['absent',{state:'observed',status:{schemaVersion:1,visibility:'client_account',clientId:client,requestId:uid(90),status:'absent'}}],['unavailable',{state:'observed',status:{schemaVersion:1,visibility:'client_account',clientId:client,requestId:uid(90),status:'unavailable',code:'request_unavailable'}}],['purged',{state:'observed',status:{schemaVersion:1,visibility:'client_account',clientId:client,requestId:uid(90),status:'unavailable',code:'request_purged'}}]];
 for(const [state,observation] of states){const m=createSourceConsentsModel(loaded(page(),{recovery:pending(observation)}));assert.equal(m.getSnapshot().recovery.state,state);assert.ok(m.getSnapshot().recovery.checkUnavailableReason);assert.ok(m.getSnapshot().recovery.retryUnavailableReason);assert.ok(m.getSnapshot().rows.every(r=>r.unavailableReason));}
});
test('recovery emits only the retained original request and never retries unknown, unavailable or purged',()=>{
 const statuses=[],retries=[],p=pending(),m=createSourceConsentsModel(loaded(page(),{recovery:p,onCheckStatusIntent:c=>statuses.push(c),onRetryOriginalIntent:c=>retries.push(c)}));
 m.checkOriginalResult();m.retryOriginal();assert.deepEqual(statuses,[{schemaVersion:1,action:'request_status_v1',requestId:uid(90)}]);assert.equal(retries.length,0);
 const absent={state:'observed',status:{schemaVersion:1,visibility:'client_account',clientId:client,requestId:uid(90),status:'absent'}};
 m.replace(loaded(page(),{recovery:pending(absent),onRetryOriginalIntent:c=>retries.push(c)}));m.retryOriginal();assert.deepEqual(retries,[p.original]);assert.ok(Object.isFrozen(retries[0]));
});
test('wrong original status bindings fail closed; no receipt or claimed current authority can enter recovery',()=>{
 const base={schemaVersion:1,visibility:'client_account',clientId:client,requestId:uid(90),status:'absent'};
 for(const changes of [{clientId:uid(99)},{requestId:uid(91)},{current:true},{status:'committed',receipt:{outcome:'withdrawn'}}]){
  const m=createSourceConsentsModel(loaded(page(),{recovery:pending({state:'observed',status:{...base,...changes}})}));assert.equal(m.getSnapshot().recovery.state,'unavailable');assert.ok(m.getSnapshot().recovery.retryUnavailableReason);
 }
});
test('dispose clears transient records and invalidates every retained row/review/callback',()=>{
 const intents=[],m=createSourceConsentsModel(loaded(page(),{onWithdrawalIntent:c=>intents.push(c),onRefreshIntent:()=>intents.push('read')}));const row=m.getSnapshot().rows[0];m.reviewWithdrawal(row);const review=m.getSnapshot().confirmation;
 m.dispose();m.dispose();m.confirmWithdrawal(review);m.reviewWithdrawal(row);m.refresh();m.replace(loaded());assert.equal(intents.length,0);assert.equal(m.getSnapshot().rows.length,0);assert.equal(m.getSnapshot().confirmation,null);
});
test('the model API is immutable and caller callback mutation cannot swap an already loaded owner',()=>{
 let first=0,second=0;const input=loaded(page(),{onRefreshIntent:()=>{first++;}}),m=createSourceConsentsModel(input);
 assert.ok(Object.isFrozen(m));input.onRefreshIntent=()=>{second++;};m.refresh();assert.equal(first,1);assert.equal(second,0);
 assert.throws(()=>{m.confirmWithdrawal=()=>{second++;};},TypeError);assert.equal(second,0);
});
test('old cancellation and forged row copies cannot cancel or select a newer loaded review',()=>{
 const m=createSourceConsentsModel(loaded(page(),{onWithdrawalIntent(){}}));m.reviewWithdrawal(m.getSnapshot().rows[0]);const old=m.getSnapshot().confirmation;
 m.replace(loaded(page(),{onWithdrawalIntent(){}}));const row=m.getSnapshot().rows[0];m.reviewWithdrawal({...row});assert.equal(m.getSnapshot().confirmation,null);
 m.reviewWithdrawal(row);const current=m.getSnapshot().confirmation;assert.ok(current);m.cancelReview(old);assert.equal(m.getSnapshot().confirmation,current);
 m.reviewWithdrawal(m.getSnapshot().rows[1]);assert.equal(m.getSnapshot().confirmation,current);
});
test('mutating the caller page after selection cannot change the exact emitted tuple, disclosure or snapshot',()=>{
 const value=page(),intents=[],m=createSourceConsentsModel(loaded(value,{onWithdrawalIntent:x=>intents.push(x)}));m.reviewWithdrawal(m.getSnapshot().rows[0]);const selected=m.getSnapshot().confirmation;
 value.snapshot.revision=99;value.snapshot.hash='f'.repeat(64);value.entries[0].consent.id=uid(40);value.entries[0].consent.disclosure.version=88;value.entries[0].disclosureText='MUTATED CALLER TEXT';
 m.confirmWithdrawal(selected);assert.equal(intents.length,1);assert.equal(intents[0].snapshot.revision,7);assert.deepEqual(intents[0].consent,consent().consent);assert.equal(intents[0].disclosureText,consent().disclosureText);
});
test('unavailable Root producer reasons and rejected disclosure dates never turn into a loaded empty page',()=>{
 for(const code of ['client_lineage_unavailable','consent_unavailable','disclosure_unavailable','attribution_unavailable','lifecycle_unavailable']){
  const m=createSourceConsentsModel(loaded({schemaVersion:1,visibility:'client_account',clientId:client,state:'unavailable',code}));assert.equal(m.getSnapshot().read.state,'unavailable');assert.equal(m.getSnapshot().rows.length,0);
 }
 const input=page();input.entries[0].confirmation.recordedAt='2026-02-30T12:00:00Z';assert.equal(createSourceConsentsModel(loaded(input)).getSnapshot().read.state,'unavailable');
});
test('result-check and retry callbacks cannot reenter or restore a replaced read, and read-only never emits a retry',()=>{
 const observation={state:'observed',status:{schemaVersion:1,visibility:'client_account',clientId:client,requestId:uid(90),status:'absent'}};
 let count=0,m;m=createSourceConsentsModel(loaded(page(),{recovery:pending(observation),onRetryOriginalIntent(){count++;m.retryOriginal();m.replace({read:{state:'unknown'}});throw Error('PRIVATE_RETRY');}}));
 m.retryOriginal();assert.equal(count,1);assert.equal(m.getSnapshot().read.state,'unknown');assert.equal(m.getSnapshot().rows.length,0);assert.equal(m.getSnapshot().intentState,'idle');
 m.replace(loaded(page(),{presentation:'read_only',recovery:pending(observation),onRetryOriginalIntent(){count++;}}));m.retryOriginal();assert.equal(count,1);assert.match(m.getSnapshot().recovery.retryUnavailableReason,/read-only/);
 let checks=0;m.replace(loaded(page(),{recovery:pending(),onCheckStatusIntent(){checks++;m.checkOriginalResult();}}));m.checkOriginalResult();m.checkOriginalResult();assert.equal(checks,1);
});
test('invalid DTO accessors are rejected without execution or unsafe error disclosure',()=>{
 const input=page();let accesses=0;Object.defineProperty(input.entries[0],'disclosureText',{enumerable:true,get(){accesses++;throw Error('PRIVATE_ACCESSOR_CANARY');}});
 const m=createSourceConsentsModel(loaded(input));assert.equal(accesses,0);assert.equal(m.getSnapshot().read.state,'unavailable');assert.doesNotMatch(JSON.stringify(m.getSnapshot()),/PRIVATE_ACCESSOR_CANARY/);
});
