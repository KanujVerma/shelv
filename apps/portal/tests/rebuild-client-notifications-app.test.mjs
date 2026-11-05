import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {createRequire} from 'node:module';
import {entryFixture} from './rebuild-notifications-entry-fixture.mjs';

// Actual Application + actual cookie runtime; finite native Response bootstrap.
// SSR is inert and is not browser, SQL, provider delivery or clinical acceptance.
const result=await build({absWorkingDir:new URL('..',import.meta.url).pathname,tsconfig:'tsconfig.frontend.json',stdin:{contents:"export {PortalApplication} from './src/app/Application.tsx';export {OverlayProvider} from './src/ui/overlay.tsx';export {createElement} from 'react';export {renderToString} from 'react-dom/server';",resolveDir:new URL('..',import.meta.url).pathname,loader:'tsx'},bundle:true,write:false,format:'cjs',platform:'node',loader:{'.css':'empty'}});
const compiled={exports:{}};
new Function('module','exports','require',result.outputFiles[0].text)(compiled,compiled.exports,createRequire(import.meta.url));
test('actual client notifications route selects the inert inbox before any clinical plan read',async t=>{
 const f=await entryFixture(t,{audience:'client',initialPath:'/notifications'});
 const html=compiled.exports.renderToString(compiled.exports.createElement(compiled.exports.OverlayProvider,null,compiled.exports.createElement(compiled.exports.PortalApplication,{runtime:f.runtime,startup:Promise.resolve(),win:f.win})));
 assert.match(html,/loading notifications/);
 assert.doesNotMatch(html,/loading your plan|this page is not connected yet|email sent|payment confirmed/);
 assert.equal(f.commands.length,0);
 assert.equal(f.win.history.state,null,'SSR neither starts navigation nor constructs a clinical read');
});

