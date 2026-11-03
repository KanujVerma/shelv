// Closed finite HTTP fixtures. Real ApplicationSession/cookie/transport; no server,
// Auth/provider, successful operation port, channel registration or network.
import assert from 'node:assert/strict';
import {createApplicationSession as currentApplication} from '../src/app/session.ts';
import {historicalUnregisteredApplication} from './helpers/historical-unregistered-session.mjs';
export const actor = '11111111-1111-4111-8111-111111111111';
export const other = '22222222-2222-4222-8222-222222222222';
export const requestId = '33333333-3333-4333-8333-333333333333';
export const basis = 'a'.repeat(64);
export const contact = Object.freeze({schemaVersion:1,contactBasis:basis,currentEmail:Object.freeze({state:'known',address:'Current@Example.test',verified:true}),pendingEmail:Object.freeze({state:'unknown'})});
export const original = Object.freeze({schemaVersion:1,action:'request_account_email_change_v1',requestId,expectedContactBasis:basis,email:'Proposed@Example.test'});
export const deferred = () => {let enter,release;return {entered:new Promise(r=>enter=r),wait:new Promise(r=>release=r),enter:()=>enter(),release:()=>release()};};
export async function historical(t,options={}) {return actual(t,{...options,historicalUnregistered:true});}
export async function actual(t,{audience='client',restore=true,historicalUnregistered=false}={}) {
  const createApplicationSession=historicalUnregistered?await historicalUnregisteredApplication():currentApplication;
  const broadcast = globalThis.BroadcastChannel;
  // Disable cross-process discovery. This changes no cookie/authority behavior.
  globalThis.BroadcastChannel = undefined;
  t.after(()=>{globalThis.BroadcastChannel=broadcast;});
  const calls=[];
  let login={signedIn:true,ownerId:actor,generation:1,csrf:'contact-synthetic-csrf',capabilities:{view:true,edit:false,publish:false,confirmPayments:false},idleExpiresAt:'2026-11-03T00:00:00Z',absoluteExpiresAt:'2026-11-04T00:00:00Z'};
  let held=null;
  const runtime=createApplicationSession({audience,now:()=>Date.parse('2026-11-02T12:00:00Z'),locks:{request:async(_name,_options,run)=>run()},fetcher:async(url,init)=>{
    calls.push({url,init});
    assert.ok(url===`/api/${audience}/session`||(!historicalUnregistered&&audience==='client'&&url==='/api/client/account-contact'),'closed contact HTTP');
    assert.equal(init.credentials,'same-origin');assert.equal(init.cache,'no-store');assert.equal(init.redirect,'error');
    const headers=new Headers(init.headers);assert.equal(headers.has('authorization'),false);assert.equal(headers.has('apikey'),false);
    if(url==='/api/client/account-contact'){
      assert.equal(init.method,'POST');assert.equal(headers.get('x-shelv-csrf'),login.csrf);
      const command=JSON.parse(init.body);
      return command.action==='read_account_contact_v1'?Response.json(contact):Response.json({code:'unavailable'},{status:503});
    }
    const value={...login,capabilities:{...login.capabilities}};
    if(held){const h=held;held=null;h.enter();await h.wait;}
    return Response.json(value);
  }});
  t.after(()=>runtime.dispose());
  if(restore)await runtime.restore();
  return {runtime,calls,setLogin(value){login={...login,...value};},hold(){held=deferred();return held;}};
}
