import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readAccountContactCommand} from '../src/contracts/PortalAccountContactValidation.ts';
import {mapAccountContactResult} from '../src/contracts/PortalAccountContactMapping.ts';
import type {AccountContactCommand} from '../src/contracts/PortalAccountContact.ts';

const read = {schemaVersion:1, action:'read_account_contact_v1'} as const;
const write = {schemaVersion:1, action:'request_account_email_change_v1', requestId:'10000000-0000-4000-8000-0000000000ab', expectedContactBasis:'a'.repeat(64), email:'Élodie+Tag@Example.INVALID'} as const;
const status = {schemaVersion:1, action:'read_account_email_change_request_v1', requestId:write.requestId} as const;
const view = {schemaVersion:1, contactBasis:'b'.repeat(64), currentEmail:{state:'known', address:' Canonical@Example.INVALID ', verified:false}, pendingEmail:{state:'unknown'}};

test('exact three commands detach, freeze, preserve spelling and canonicalize UUID only', () => {
  for (const command of [read,write,status]) {
    const mapped = readAccountContactCommand(command);
    assert.deepEqual(mapped,command); assert.notEqual(mapped,command); assert.ok(Object.isFrozen(mapped));
  }
  const canonical=readAccountContactCommand({...write,requestId:write.requestId.toUpperCase()});assert.ok('requestId' in canonical);assert.equal(canonical.requestId,write.requestId);
  const mutable:Record<string,unknown> = {...write,email:write.email}; const captured=readAccountContactCommand(mutable); mutable.email='other@example.invalid';
  assert.ok('email' in captured);assert.equal(captured.email,write.email);
});

test('closed commands refuse selectors, authority, ambiguous shapes, hostile objects and unknown actions', () => {
  for (const extra of [{clientId:write.requestId},{actorId:write.requestId},{rpc:'anything'},{url:'https://example.invalid'},{verified:true},{store:true},{pendingEmail:{state:'none'}}]) {
    for (const command of [read,write,status]) assert.throws(()=>readAccountContactCommand({...command,...extra}));
  }
  for (const bad of [null,[],{...read,schemaVersion:2},{...write,action:'updateUser'},{...write,requestId:'bad'},{...write,expectedContactBasis:'A'.repeat(64)}]) assert.throws(()=>readAccountContactCommand(bad));
  const accessor={...write};Object.defineProperty(accessor,'email',{get(){throw Error('private');},enumerable:true});
  assert.throws(()=>readAccountContactCommand(accessor));
  assert.throws(()=>readAccountContactCommand({...write,[Symbol('hidden')]:true}));
  assert.throws(()=>readAccountContactCommand(Object.assign(Object.create({authority:true}),write)));
});

test('email requests preserve Unicode and exact case without invented domain or length limits', () => {
  for (const email of [write.email,'a@b','a'.repeat(300)+'@example.invalid','𐐀@例.invalid']) {const c=readAccountContactCommand({...write,email});assert.ok('email' in c);assert.equal(c.email,email);}
  for (const email of ['', ' a@b','a@b ', '\u00a0a@b','a b@c','a@','@b','a@@b','a\0@b','a\n@b','a\u007f@b','a\u0085@b','\ud800@b','a@\udfff']) assert.throws(()=>readAccountContactCommand({...write,email}));
});

test('command UTF8 byte bound is exact and does not truncate', () => {
  const fixed=JSON.stringify({...write,email:''}); const length=8192-new TextEncoder().encode(fixed).length;
  const email='x'.repeat(length-2)+'@b';
  assert.equal(new TextEncoder().encode(JSON.stringify({...write,email})).length,8192);
  const atBound=readAccountContactCommand({...write,email});assert.ok('email' in atBound);assert.equal(atBound.email,email);
  assert.throws(()=>readAccountContactCommand({...write,email:'x'+email}));
});

test('current email exactly retains profile semantics; pending unknown, none and pending are distinct', () => {
  const mapped=mapAccountContactResult(view,read);assert.deepEqual(mapped,view);assert.notEqual(mapped,view);assert.ok(Object.isFrozen(mapped));
  assert.ok('currentEmail' in mapped);assert.ok(Object.isFrozen(mapped.currentEmail));assert.ok(Object.isFrozen(mapped.pendingEmail));
  for(const pendingEmail of [{state:'unknown'},{state:'none'},{state:'pending',address:write.email}]){const r=mapAccountContactResult({...view,pendingEmail},read);assert.ok('pendingEmail' in r);assert.deepEqual(r.pendingEmail,pendingEmail);}
  const unknown=mapAccountContactResult({...view,currentEmail:{state:'unknown'}},read);assert.ok('currentEmail' in unknown);assert.deepEqual(unknown.currentEmail,{state:'unknown'});
  for(const currentEmail of [{state:'unknown',verified:true},{state:'known',address:'x'},{state:'known',address:'',verified:true},{state:'known',address:'\ud800',verified:true}])assert.throws(()=>mapAccountContactResult({...view,currentEmail},read));
  for(const pendingEmail of [{state:'unknown',address:write.email},{state:'none',address:write.email},{state:'pending'},{state:'pending',address:' a@b'},{state:'sent',address:write.email}])assert.throws(()=>mapAccountContactResult({...view,pendingEmail},read));
  assert.throws(()=>mapAccountContactResult({...view,contactBasis:'B'.repeat(64)},read));
  assert.throws(()=>mapAccountContactResult({...view,privateNotes:'private'},read));
});

test('historical receipt binds original mutation and never claims verification or current contact', () => {
  const receipt={schemaVersion:1,action:write.action,requestId:write.requestId,outcome:'provider_accepted',recordedAt:'2026-11-02T12:00:00.123456Z'};
  assert.deepEqual(mapAccountContactResult(receipt,write),receipt);
  for(const patch of [{action:read.action},{requestId:'10000000-0000-4000-8000-000000000002'},{outcome:'verified'},{recordedAt:'2026-02-30T00:00:00Z'},{recordedAt:'2026-11-02T12:00:00+00:00'},{email:write.email},{currentEmail:view.currentEmail}])assert.throws(()=>mapAccountContactResult({...receipt,...patch},write));
  assert.throws(()=>mapAccountContactResult(receipt,read));assert.throws(()=>mapAccountContactResult(view,write));
});

test('status is exact original-request history with no invented current or pending facts', () => {
  for(const state of ['not_found','registered','dispatch_unknown','provider_accepted','provider_rejected']) {
    const result={...status,state}; assert.deepEqual(mapAccountContactResult(result,status),result);
  }
  for(const patch of [{state:'sent'},{requestId:'10000000-0000-4000-8000-000000000002'},{action:write.action},{currentEmail:view.currentEmail},{pendingEmail:{state:'none'}},{recordedAt:'2026-11-02T00:00:00Z'}])assert.throws(()=>mapAccountContactResult({...status,state:'not_found',...patch},status));
  assert.throws(()=>mapAccountContactResult({...status,state:'not_found'},write));
});

test('result bound is exact and command validation cannot be bypassed at the mapper', () => {
  const fixed=JSON.stringify({...view,currentEmail:{state:'known',address:'',verified:false}});
  const address='x'.repeat(16384-new TextEncoder().encode(fixed).length);
  const atBound={...view,currentEmail:{state:'known',address,verified:false}};
  assert.doesNotThrow(()=>mapAccountContactResult(atBound,read));
  assert.throws(()=>mapAccountContactResult({...atBound,currentEmail:{...atBound.currentEmail,address:address+'x'}},read));
  assert.throws(()=>mapAccountContactResult(view,{...read,authority:true} as AccountContactCommand));
});
