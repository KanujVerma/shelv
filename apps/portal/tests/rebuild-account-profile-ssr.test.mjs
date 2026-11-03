// Requires an explicitly authorized own compiler/React dependency closure.
// These are SSR and browser-target source builds, never browser acceptance.
import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {createRequire} from 'node:module';
import {fixture,controllerApi,initial} from './rebuild-account-profile-fixture.mjs';
const portal=new URL('..',import.meta.url).pathname;
const result=await build({absWorkingDir:portal,tsconfig:'tsconfig.frontend.json',stdin:{contents:"import React from 'react';import{renderToStaticMarkup}from'react-dom/server';import{AccountProfile}from'./src/features/account/profile/AccountProfile.tsx';export const render=(controller,presentation='summary')=>renderToStaticMarkup(React.createElement(AccountProfile,{controller,presentation}));",loader:'tsx',resolveDir:portal},bundle:true,write:false,format:'cjs',platform:'node',loader:{'.css':'empty'}});
const module={exports:{}};new Function('module','exports','require',result.outputFiles[0].text)(module,module.exports,createRequire(import.meta.url));const render=module.exports.render;
async function controlled(t){const f=await fixture(t),{createAccountProfileController}=await controllerApi(),c=createAccountProfileController(f.runtime);t.after(()=>c.dispose());return {...f,c};}
test('SSR constructor and both fragments are inert, without shell/panel/dialog/trigger/autoload',async t=>{
 const f=await controlled(t);assert.equal(f.calls.length,0);const summary=render(f.c),edit=render(f.c,'edit');assert.equal(f.calls.length,0);assert.match(summary,/have not been loaded/);assert.doesNotMatch(summary+edit,/<h1|<section|role="dialog"|edit details|shelv-panel/);assert.equal(edit,'');
});
test('C08 summary owns canonical name only; Contact owns email and pending facts',async t=>{
 const f=await controlled(t);await f.c.load();let html=render(f.c);assert.match(html,/  Maya Example  /);assert.doesNotMatch(html,/<dt>email|maya@example.invalid|verified|<input|<form|phone|preferences/);
 f.setCurrent({...initial(),currentEmail:{state:'known',address:'Other@EXAMPLE.invalid',verified:false}});await f.c.readCurrent();html=render(f.c);assert.match(html,/  Maya Example  /);assert.doesNotMatch(html,/<dt>email|Other@EXAMPLE.invalid|verified/);
 f.setCurrent({...initial(),currentEmail:{state:'unknown'}});await f.c.readCurrent();html=render(f.c);assert.match(html,/  Maya Example  /);assert.doesNotMatch(html,/<dt>email|not known|maya@example.invalid|Other@EXAMPLE.invalid/);
});
test('SSR edit fragment uses actual shared fields, exact Unicode value and name-only save/discard',async t=>{
 const f=await controlled(t);await f.c.load();f.c.editDisplayName();f.c.setDisplayName('  '+ '😀'.repeat(200)+'  ');const html=render(f.c,'edit');assert.match(html,/aria-label="edit your name"/);assert.match(html,/data-slot="input"/);assert.match(html,/name="displayName"/);assert.match(html,/autoComplete="name"|autocomplete="name"/);assert.match(html,/save name/);assert.match(html,/discard unsent edit/);assert.doesNotMatch(html,/maxLength|maxlength|type="email"|edit details|role="dialog"|<h1/);
});
test('SSR uncertain intent is distinct from current name, preserves exact retry and never claims saved',async t=>{
 const f=await controlled(t);await f.c.load();f.c.editDisplayName();f.c.setDisplayName('Uncertain Original');f.reply({code:'unavailable'},503);await f.c.save();await f.c.readCurrent();const html=render(f.c);assert.match(html,/original save result is uncertain/);assert.match(html,/Uncertain Original/);assert.match(html,/retry original change/);assert.match(html,/Maya Example/);assert.doesNotMatch(html,/your details are saved/);
});
test('SSR denied and session-ended snapshots contain no prior private name, email or draft',async t=>{
 const f=await controlled(t);await f.c.load();f.c.editDisplayName();f.c.setDisplayName('Private Draft');f.reply({code:'forbidden'},403);await f.c.readCurrent();let html=render(f.c)+render(f.c,'edit');assert.doesNotMatch(html,/Maya Example|maya@example.invalid|Private Draft|<input/);assert.match(html,/do not have access/);
 f.runtime.dispose();html=render(f.c)+render(f.c,'edit');assert.doesNotMatch(html,/Maya Example|maya@example.invalid|Private Draft|<input/);assert.match(html,/session has ended/);
});
test('browser-target write:false source closure uses actual runtime/transport/Root codecs and shared controls',async()=>{
 const output=await build({absWorkingDir:portal,tsconfig:'tsconfig.frontend.json',entryPoints:['src/features/account/profile/index.ts','src/app/account-profile-request.ts'],outdir:'unused-profile-output',bundle:true,write:false,metafile:true,format:'esm',platform:'browser',target:'es2022'});
 const inputs=Object.keys(output.metafile.inputs);for(const suffix of ['src/features/account/profile/AccountProfile.tsx','src/app/account-profile-request.ts','src/transport/session.ts','site/auth/client-cookie-session.js','PortalAccountProfileValidation.ts','PortalAccountProfileMapping.ts','src/ui/primitives.tsx'])assert.ok(inputs.some(path=>path.endsWith(suffix)),suffix);
 assert.ok(output.outputFiles.length>0);
});
