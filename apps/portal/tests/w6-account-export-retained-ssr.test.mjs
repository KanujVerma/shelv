// Shared React wrappers, source SSR only. No browser or filesystem proof.
import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {createRequire} from 'node:module';
import {writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {finalExportSourceProjection} from './w6-account-export-fixture.mjs';
const projected=finalExportSourceProjection(),portal=projected.portal;
const nodePaths=[projected.dependencyPortal+'/node_modules'];
let api={},built;
try {
  built=await build({absWorkingDir:portal,tsconfig:'tsconfig.frontend.json',stdin:{contents:`export * from './src/features/account/final-export/index.ts';export {createApplicationSession} from './src/app/session.ts';export {createElement} from 'react';export {renderToStaticMarkup} from 'react-dom/server';`,resolveDir:portal,loader:'tsx'},bundle:true,write:false,nodePaths,metafile:true,platform:'node',format:'cjs',loader:{'.css':'empty'}});
  const mod={exports:{}};new Function('module','exports','require',built.outputFiles[0].text)(mod,mod.exports,createRequire(import.meta.url));api=mod.exports;
} catch(error) { if(!error.errors?.some(e=>e.text.includes('final-export/index.ts')))throw error; }
async function fixture(t,host={}) {
  assert.equal(typeof api.AccountFinalExportView,'function','Account final-export shared-wrapper view exists');
  let requests=0;
  const runtime=api.createApplicationSession({audience:'client',now:()=>Date.parse('2026-11-02T12:00:00Z'),locks:{request:async(_n,_o,run)=>run()},fetcher:async url=>{requests++;assert.equal(url,'/api/client/session');return Response.json({signedIn:true,ownerId:'11111111-1111-4111-8111-111111111111',generation:1,csrf:'synthetic',capabilities:{view:true,edit:false,publish:false,confirmPayments:false},idleExpiresAt:'2026-11-02T12:10:00Z',absoluteExpiresAt:'2026-11-02T13:00:00Z'});}});
  await runtime.restore();const controller=api.createAccountFinalExport(runtime,host);t.after(()=>{controller.dispose();runtime.dispose();});
  return {controller,render:()=>api.renderToStaticMarkup(api.createElement(api.AccountFinalExportView,{controller})),requests:()=>requests};
}
test('inert SSR uses shared action/status wrappers and does not invoke the picker or export HTTP',async t=>{
  let picks=0;const f=await fixture(t,{async showSaveFilePicker(){picks++;throw Error('must not run during SSR');}});
  for(let i=0;i<3;i++){const html=f.render();assert.match(html,/final plan/);assert.match(html,/shelv-button/);assert.match(html,/choose where to save/);assert.doesNotMatch(html,/saved successfully|download complete|PRIVATE_|clientId|rootHash/);}
  assert.equal(picks,0);assert.equal(f.requests(),1);
});
test('unsupported capability is actionable unavailability without a false successful download',async t=>{
  const f=await fixture(t);await f.controller.saveFromUserAction();const html=f.render();
  assert.match(html,/saving is unavailable here/);assert.doesNotMatch(html,/saved successfully|download complete/);
});
test('retirement removes the action and preserves no private plan or filename receipt',async t=>{
  const f=await fixture(t);f.controller.dispose();const html=f.render();
  assert.match(html,/this export session has ended/);assert.doesNotMatch(html,/choose where to save|shelv-final-plan-v|rootHash/);
});
test('unconfirmed browser abort has no enabled retry that the controller would ignore',async t=>{
  const f=await fixture(t,{async showSaveFilePicker(){return{async createWritable(){return{async write(){throw Error('unsupported channel must not write');},async close(){throw Error('unsupported channel must not close');},async abort(){throw Error('synthetic browser abort unconfirmed');}};}};}});
  await f.controller.saveFromUserAction();assert.equal(f.controller.getSnapshot().writer,'abort-unconfirmed');
  const html=f.render();assert.match(html,/stopping the file write is not yet confirmed/);assert.doesNotMatch(html,/choose where to save/);
});
test('browser source closure uses the actual collector/public serializer/request and no server Auth/runtime',async()=>{
  assert.equal(typeof api.AccountFinalExportView,'function');
  const result=await build({absWorkingDir:portal,tsconfig:'tsconfig.frontend.json',entryPoints:['src/features/account/final-export/index.ts'],bundle:true,write:false,nodePaths,metafile:true,format:'esm',platform:'browser',target:'es2022',outdir:'unused-export-source-build'});
  const inputs=Object.keys(result.metafile.inputs);
  for(const suffix of ['PortalFinalExportMapping.ts','PortalFinalExportValidation.ts','concierge-final-export/serializer.ts','app/final-export-request.ts','auth/client-cookie-session.js','transport/session.ts','ui/primitives.tsx'])assert.ok(inputs.some(p=>p.endsWith(suffix)),suffix);
  assert.ok(!inputs.some(p=>/concierge-final-export\/(runtime|handler)\.ts|concierge-operations\/runtime|(?:^|\/)server\/|(?:^|\/)ai\/|src\/.*[Ww]orkflow/.test(p)));
  writeFileSync(new URL('../../../.local-artifacts/lane6-export/browser-closure.json',import.meta.url),JSON.stringify({metafile:result.metafile,outputs:result.outputFiles.map(f=>({bytes:f.contents.length,sha256:createHash('sha256').update(f.contents).digest('hex')}))},null,2)+'\n');
});
