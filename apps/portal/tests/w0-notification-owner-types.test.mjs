import test from 'node:test';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import ts from '../node_modules/typescript/lib/typescript.js';
test('notification owner and composition ABI use the unchanged frontend graph and negative type controls',()=>{
 const configPath=fileURLToPath(new URL('../tsconfig.frontend.json',import.meta.url));
 const raw=ts.readConfigFile(configPath,ts.sys.readFile);assert.equal(raw.error,undefined);
 const config=ts.parseJsonConfigFileContent(raw.config,ts.sys,fileURLToPath(new URL('../',import.meta.url)),undefined,configPath);
 assert.equal(config.options.strict,true);assert.equal(config.options.noUncheckedIndexedAccess,true);
 assert.equal(config.options.verbatimModuleSyntax,true);assert.equal(config.options.skipLibCheck,false);
 const program=ts.createProgram([...config.fileNames,...['w0-notification-owner-types.test.ts','w0-notification-composition-types.test.ts'].map(p=>fileURLToPath(new URL(p,import.meta.url)))],config.options);
 const diagnostics=[...config.errors,...ts.getPreEmitDiagnostics(program)];
 assert.equal(diagnostics.length,0,ts.formatDiagnosticsWithColorAndContext(diagnostics,{getCanonicalFileName:x=>x,getCurrentDirectory:()=>process.cwd(),getNewLine:()=>"\n"}));
});
