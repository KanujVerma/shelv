import assert from 'node:assert/strict';
import test from 'node:test';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import ts from '../node_modules/typescript/lib/typescript.js';

const root=fileURLToPath(new URL('../../../',import.meta.url)),portal=path.join(root,'apps/portal');
const strong={target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,moduleResolution:ts.ModuleResolutionKind.Bundler,noEmit:true,allowImportingTsExtensions:true,strict:true,noUncheckedIndexedAccess:true,verbatimModuleSyntax:true,skipLibCheck:false,typeRoots:[path.join(portal,'node_modules/@types')],jsx:ts.JsxEmit.ReactJSX};
const rootFiles=['commands','types','projection','handler','index'].map(name=>path.join(root,'supabase/functions/concierge-checkins',name+'.ts'));
const format=diagnostics=>ts.formatDiagnosticsWithColorAndContext(diagnostics,{getCurrentDirectory:()=>root,getCanonicalFileName:f=>f,getNewLine:()=> '\n'});
const base='d4125cca52cb21d0c0a79a5733662f782a0dea76';
const tracked=new Set(execFileSync('git',['ls-tree','-r','--name-only',base],{cwd:root,encoding:'utf8'}).trim().split('\n'));
const baselineBytes=new Map();
function original(file){const rel=path.relative(root,file);if(!tracked.has(rel))return undefined;if(!baselineBytes.has(rel))baselineBytes.set(rel,execFileSync('git',['show',`${base}:${rel}`],{cwd:root}));return baselineBytes.get(rel);}
function compile(files,options,baseline){
 const host=ts.createCompilerHost(options),get=host.getSourceFile;
 if(baseline)host.getSourceFile=(file,language,onError,create)=>{const bytes=original(file);return bytes===undefined?get(file,language,onError,create):ts.createSourceFile(file,bytes.toString('utf8'),language,true);};
 const p=ts.createProgram(files,options,host),diagnostics=ts.getPreEmitDiagnostics(p);
 const audit={baseline,compiler:ts.version,options,entryFiles:files,diagnostics:diagnostics.map(d=>({file:d.file?path.relative(root,d.file.fileName):null,code:d.code,message:ts.flattenDiagnosticMessageText(d.messageText,'\n'),line:d.file&&d.start!==undefined?d.file.getLineAndCharacterOfPosition(d.start).line+1:null,source:d.file&&d.start!==undefined?d.file.text.split('\n')[d.file.getLineAndCharacterOfPosition(d.start).line].trim():null})),files:p.getSourceFiles().map(f=>({path:path.relative(root,f.fileName),sha256:createHash('sha256').update(baseline?(original(f.fileName)??readFileSync(f.fileName)):readFileSync(f.fileName)).digest('hex')}))};
 console.log('COMPILE_AUDIT '+JSON.stringify(audit));console.log(format(diagnostics));return audit;
}
function check(files,options){
 const raw=compile(files,options,true),current=compile(files,options,false);
 const key=d=>JSON.stringify([d.file,d.code,d.message,d.source]);
 const expected=new Map();for(const d of raw.diagnostics)expected.set(key(d),(expected.get(key(d))??0)+1);
 const introduced=[];for(const d of current.diagnostics){const k=key(d),n=expected.get(k)??0;if(n)expected.set(k,n-1);else introduced.push(d);}
 console.log('STRONG_DIFFERENTIAL '+JSON.stringify({baseline:raw.diagnostics.length,current:current.diagnostics.length,introduced,removed:[...expected.values()].reduce((a,b)=>a+b,0)}));
 assert.deepEqual(introduced,[],'no new strong diagnostics; raw graph remains qualified by printed baseline failures');
 return current;
}

test('TS6 strong actual Root/App graph preserves its exact immutable baseline diagnostics; no new branch error',()=>{
 assert.match(ts.version,/^6\./);
 const current=check([...rootFiles,path.join(portal,'src/app/session.ts'),path.join(portal,'src/ui/assets.d.ts')],{...strong,lib:['lib.es2022.d.ts','lib.dom.d.ts','lib.dom.iterable.d.ts'],types:['react','react-dom']});
 assert.equal(current.diagnostics.length,0,'Parent exact-erasure prerequisite closes all six Root diagnostics');
});
test('TS6 strong actual gateway/ClientProvider/Root graph preserves exact baseline diagnostics with real Workers declarations',()=>{
 check([...rootFiles,path.join(portal,'node_modules/@cloudflare/workers-types/index.d.ts'),...['client-policy','client-upstream','gateway','gateway-configuration.d'].map(name=>path.join(portal,'session-integration/runtime/server',name+'.ts'))],{...strong,lib:['lib.es2022.d.ts'],types:[],noErrorTruncation:true,allowJs:false});
});
test('new metadata ABI compiles with zero strong diagnostics and rejects owner arguments, arbitrary RPCs and clinical output',()=>{
 const file=path.join(portal,'tests/.photo-head-abi.ts');
 const source=`import type {CheckinRpcCall} from '../../../supabase/functions/concierge-checkins/types.ts';
import {buildCheckinCall} from '../../../supabase/functions/concierge-checkins/commands.ts';
import {mapCheckinPhotoHead} from '../../../supabase/functions/concierge-checkins/projection.ts';
const fixed:CheckinRpcCall={name:'concierge_checkin_head_v1',args:{}};
// @ts-expect-error fixed metadata has no owner selector
const injected:CheckinRpcCall={name:'concierge_checkin_head_v1',args:{p_client_id:'caller'}};
// @ts-expect-error fixed registry cannot target an arbitrary RPC
const arbitrary:CheckinRpcCall={name:'arbitrary_sql',args:{}};
const call=buildCheckinCall({action:'read_photo_head_v1'},'d1000000-0000-4000-8000-000000000001');
const head=mapCheckinPhotoHead({revision:17});
if(head.ok){
 const revision:number=head.value.revision;
 // @ts-expect-error metadata is immutable
 head.value.revision=revision;
 // @ts-expect-error metadata provides no clinical history
 head.value.reports;
}
void [fixed,injected,arbitrary,call];`;
 const options={...strong,lib:['lib.es2022.d.ts','lib.dom.d.ts','lib.dom.iterable.d.ts'],types:[]};
 const host=ts.createCompilerHost(options),get=host.getSourceFile;
 host.getSourceFile=(name,version,onError,create)=>name===file?ts.createSourceFile(name,source,version,true):get(name,version,onError,create);
 const p=ts.createProgram([file],options,host),diagnostics=ts.getPreEmitDiagnostics(p);
 console.log('NEW_ABI_STRONG '+JSON.stringify({compiler:ts.version,diagnostics:diagnostics.length,sourceSha256:createHash('sha256').update(source).digest('hex'),files:p.getSourceFiles().map(f=>({path:path.relative(root,f.fileName),sha256:createHash('sha256').update(f.fileName===file?source:readFileSync(f.fileName)).digest('hex')}))}));
 assert.equal(diagnostics.length,0,format(diagnostics));
});
