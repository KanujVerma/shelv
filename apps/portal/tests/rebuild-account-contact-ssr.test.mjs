// HISTORICAL unregistered constructor controls: exact immutable556 source, not current registry.
// SSR only: fixed presentation models are NOT connected contact successes.
// Actual controller case asserts inert/unavailable behavior on the real registry.
import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {createRequire} from 'node:module';
import {historical as actual,contact,original,requestId,basis} from './rebuild-account-contact-fixture.mjs';
import {createAccountContactController} from '../src/features/account/contact/controller.ts';
import {initialAccountContactSnapshot} from '../src/features/account/contact/model.ts';
const result=await build({absWorkingDir:new URL('..',import.meta.url).pathname,tsconfig:'tsconfig.frontend.json',stdin:{resolveDir:new URL('..',import.meta.url).pathname,loader:'tsx',contents:"import React from 'react';import{renderToStaticMarkup}from'react-dom/server';import{AccountContact}from'./src/features/account/contact/AccountContact.tsx';export const render=(controller,presentation)=>renderToStaticMarkup(React.createElement(AccountContact,{controller,presentation}));"},bundle:true,write:false,format:'cjs',platform:'node'});
const mod={exports:{}};new Function('module','exports','require',result.outputFiles[0].text)(mod,mod.exports,createRequire(import.meta.url));
const render=mod.exports.render;
// Explicit fixed pure view model, no ApplicationSession/authority/operation port.
function fixed(snapshot){return {getSnapshot:()=>snapshot,subscribe:()=>()=>{},load(){throw Error('SSR must remain inert');},editEmail(){throw Error('SSR must remain inert');},setEmail(){throw Error('SSR must remain inert');},reviewEmail(){throw Error('SSR must remain inert');},requestChange(){throw Error('SSR must remain inert');},readOriginalStatus(){throw Error('SSR must remain inert');},discardEdit(){throw Error('SSR must remain inert');},dispose(){throw Error('SSR must remain inert');}};}
function sample(patch={}){return {...initialAccountContactSnapshot(),phase:'ready',current:contact,...patch};}
test('actual controller SSR has no side effects, outer shell or private facts; explicit load stays unavailable',async t=>{
  const f=await actual(t),c=createAccountContactController(f.runtime);t.after(()=>c.dispose());const n=f.calls.length;
  const initial=render(c);assert.match(initial,/load email details/);assert.doesNotMatch(initial,/Current@|dialog|<h1|<nav|edit details/);assert.equal(f.calls.length,n);
  await c.load();const html=render(c);assert.match(html,/unavailable/);assert.doesNotMatch(html,/Current@|type="email"/);assert.equal(f.calls.length,n);
});
test('pure fixed summary renders exact canonical current and unknown pending without edit form or delivery instructions',()=>{
  const html=render(fixed(sample()));assert.match(html,/Current@Example.test/);assert.match(html,/verified/);assert.match(html,/pending email details unavailable/);
  assert.doesNotMatch(html,/check your inbox|sent|delivered|type="email"|contact preference|personal texts|<h1|<nav|dialog|edit details/);
});
test('pure fixed pending address stays separate from unverified current facts and never asserts delivery',()=>{
  const html=render(fixed(sample({current:{...contact,currentEmail:{state:'known',address:'Current@Example.test',verified:false},pendingEmail:{state:'pending',address:'Pending@Example.test'}}})));
  assert.match(html,/Current@Example.test/);assert.match(html,/Pending@Example.test/);assert.match(html,/verification not confirmed/);assert.doesNotMatch(html,/delivered|check your inbox|email changed/);
});
test('pure fixed edit-only form preserves exact proposed spelling with accessible shared field and no duplicated summary',()=>{
  const draft={email:'Proposed@Example.test',expectedContactBasis:basis};const html=render(fixed(sample({draft})),'edit');
  assert.match(html,/<label[^>]*>new email<\/label>/);assert.match(html,/type="email"/);assert.match(html,/Proposed@Example.test/);assert.match(html,/review email change/);assert.match(html,/discard unsent edit/);
  assert.doesNotMatch(html,/<dt>|edit details|dialog|contact preference/);
});
test('pure fixed review is explicit and cannot claim request success or verified address',()=>{
  const draft={email:'Proposed@Example.test',expectedContactBasis:basis};const html=render(fixed(sample({draft,review:draft,requestState:'reviewing'})),'edit');
  assert.match(html,/email change to review/);assert.match(html,/Proposed@Example.test/);assert.match(html,/request email change/);assert.match(html,/keep editing/);assert.doesNotMatch(html,/successfully|email changed|sent successfully/);
});
for(const status of ['not_found','registered','dispatch_unknown','provider_accepted','provider_rejected'])test('pure fixed original '+status+' offers only status read, with no resend, cancel or mark-verified control',()=>{
  const html=render(fixed(sample({original,originalStatus:{schemaVersion:1,action:'read_account_email_change_request_v1',requestId,state:status},requestState:'uncertain'})));
  assert.match(html,/original email change request/);assert.match(html,/Proposed@Example.test/);assert.match(html,/check original request status/);assert.doesNotMatch(html,/retry|resend|cancel.*request|mark verified|email changed|delivered/);
});
test('pure fixed historical receipt does not replace current email and cannot hide a newer unsent draft',()=>{
  const receipt={schemaVersion:1,action:original.action,requestId,outcome:'provider_accepted',recordedAt:'2026-11-02T12:00:00Z'};
  const c=fixed(sample({original,receipt,draft:{email:'Later@Example.test',expectedContactBasis:basis},requestState:'acknowledged'}));
  assert.match(render(c),/Current@Example.test/);assert.match(render(c),/Proposed@Example.test/);assert.match(render(c,'edit'),/Later@Example.test/);assert.doesNotMatch(render(c),/email changed|delivered/);
});
test('pure fixed ended presentation refuses all private current, draft and original fields',()=>{
  const c=fixed(sample({phase:'ended',message:'your session has ended. sign in again.',original,draft:{email:'Later@Example.test',expectedContactBasis:basis}}));
  for(const mode of ['summary','edit']){const html=render(c,mode);assert.match(html,/session has ended/);assert.doesNotMatch(html,/@Example|type="email"|check original/);}
});
