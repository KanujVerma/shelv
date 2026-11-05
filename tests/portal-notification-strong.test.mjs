import test from 'node:test';import assert from 'node:assert/strict';import path from 'node:path';import {execFileSync} from 'node:child_process';import ts from '../apps/portal/node_modules/typescript/lib/typescript.js';
import {sharedCiBaselines} from './helpers/portal-shared-ci-baselines.ts';
const root=process.cwd(),portal=path.join(root,'apps/portal'),base='58c0669d0c5507c0eb7087fe0a0b0e0785743d5e';
const strong={target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,moduleResolution:ts.ModuleResolutionKind.Bundler,noEmit:true,allowImportingTsExtensions:true,strict:true,noUncheckedIndexedAccess:true,verbatimModuleSyntax:true,skipLibCheck:false,typeRoots:[path.join(portal,'node_modules/@types')],jsx:ts.JsxEmit.ReactJSX};
const tracked=new Set(sharedCiBaselines.paths(base)),cache=new Map();
function compile(files,options,baseline=false){
 const host=ts.createCompilerHost(options),get=host.getSourceFile;
 if(baseline)host.getSourceFile=(file,language,onError,create)=>{const name=path.relative(root,file);if(!tracked.has(name))return get(file,language,onError,create);if(!cache.has(name))cache.set(name,sharedCiBaselines.readBytes(base,name).toString('utf8'));return ts.createSourceFile(file,cache.get(name),language,true);};
 const program=ts.createProgram(files.map(f=>path.resolve(root,f)),options,host);const diagnostics=ts.getPreEmitDiagnostics(program).map(d=>({file:d.file&&path.relative(root,d.file.fileName),code:d.code,message:ts.flattenDiagnosticMessageText(d.messageText,'\n'),source:d.file&&d.start!==undefined?d.file.text.split('\n')[d.file.getLineAndCharacterOfPosition(d.start).line].trim():null}));return {compiler:ts.version,files:program.getSourceFiles().map(s=>path.relative(root,s.fileName)),diagnostics};
}
test('new adapter and API consumer compile with actual React declarations and unchanged strong flags',()=>{
 const result=compile(['apps/portal/src/app/notification-request.ts','tests/portal-notification-transport-types.ts'],{...strong,lib:['lib.es2022.d.ts','lib.dom.d.ts','lib.dom.iterable.d.ts'],types:['react','react-dom']});console.log('NEW_ADAPTER_STRONG '+JSON.stringify(result));assert.deepEqual(result.diagnostics,[]);
});
test('actual gateway/provider Workers graph has exactly the frozen baseline diagnostics and no new errors',()=>{
 const files=[...['commands','types','projection','handler','index'].map(name=>`supabase/functions/concierge-checkins/${name}.ts`),'apps/portal/session-integration/runtime/server/gateway.ts','apps/portal/session-integration/runtime/server/client-upstream.ts','apps/portal/session-integration/runtime/server/gateway-configuration.d.ts','apps/portal/node_modules/@cloudflare/workers-types/index.d.ts'];
 const options={...strong,lib:['lib.es2022.d.ts'],types:[],noErrorTruncation:true,allowJs:false};const before=compile(files,options,true),after=compile(files,options,false);
 const key=d=>JSON.stringify([d.file,d.code,d.message,d.source]);assert.deepEqual(after.diagnostics.map(key).sort(),before.diagnostics.map(key).sort());console.log('WORKERS_STRONG_DIFFERENTIAL '+JSON.stringify({baseline:before,current:after,introduced:0}));
});
