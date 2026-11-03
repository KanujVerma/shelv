// SOURCE ONLY. The retained tests intentionally exercise an unregistered cookie
// namespace. This does not register an API or supply successful authority.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,mkdtempSync,existsSync} from 'node:fs';
import {resolve,relative,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import ts from 'typescript';

const repo=fileURLToPath(new URL('../../../',import.meta.url));
const request='apps/portal/src/app/final-export-request.ts';
const cookie='apps/portal/site/auth/client-cookie-session.js';
const cases=['w6-account-export-recovery-cases.mjs','w6-account-export-retained-consumer-cases.mjs'];
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
let projection;

export function finalExportSourceProjection() {
  if(projection)return projection;
  const home=resolve(repo,'.local-artifacts/w6-account-export');mkdirSync(home,{recursive:true});
  const directory=mkdtempSync(resolve(home,'source-'));
  const pending=['apps/portal/src/features/account/final-export/index.ts','apps/portal/tsconfig.frontend.json',
    ...cases.map(name=>'apps/portal/tests/'+name)];
  const seen=new Set(),rows=[];
  while(pending.length) {
    const path=pending.pop();if(seen.has(path))continue;seen.add(path);
    assert.ok(!path.startsWith('../')&&!path.startsWith('/'),'source containment');
    const physical=resolve(repo,path);
    let bytes,selected='current own source';
    if(path===cookie) {
      bytes=execFileSync('git',['show','c075cbd4ea4b2f4d75959370233745d07145c069:'+path],{cwd:repo});
      selected='EXPLICIT HISTORICAL UNREGISTERED constructor at c075';
    } else if(existsSync(physical))bytes=readFileSync(physical);
    else {
      assert.equal(path,request,'only the one missing W0 request is a pinned source input');
      bytes=execFileSync('git',['show','e949c9cc4a352c57d0aebb796c175370f72bd052:'+path],{cwd:repo});
      selected='W0-owned pending exact e949 request; not product admission';
    }
    const output=resolve(directory,path);mkdirSync(dirname(output),{recursive:true});writeFileSync(output,bytes,{flag:'wx'});
    rows.push({path,selected,bytes:bytes.length,sha256:sha(bytes)});
    if(/\.(?:ts|tsx|js|mjs)$/.test(path)) {
      const source=ts.createSourceFile(path,bytes.toString(),ts.ScriptTarget.Latest,true);
      const imports=[];
      const visit=node=>{
        if((ts.isImportDeclaration(node)||ts.isExportDeclaration(node))&&node.moduleSpecifier&&ts.isStringLiteral(node.moduleSpecifier))imports.push(node.moduleSpecifier.text);
        if(ts.isCallExpression(node)&&(node.expression.kind===ts.SyntaxKind.ImportKeyword||ts.isIdentifier(node.expression)&&node.expression.text==='load')&&node.arguments.length===1&&ts.isStringLiteral(node.arguments[0]))imports.push(node.arguments[0].text);
        ts.forEachChild(node,visit);
      };visit(source);
      for(const specifier of imports)if(specifier.startsWith('.'))pending.push(relative(repo,resolve(dirname(physical),specifier)));
    }
  }
  mkdirSync(resolve(repo,'.local-artifacts/lane6-export'),{recursive:true});
  writeFileSync(resolve(directory,'SOURCE.json'),JSON.stringify({scope:'SOURCE ONLY: current consumer/protocol with pinned unregistered constructor and pending W0 request; no genuine Auth/SQL/browser/filesystem proof',head:execFileSync('git',['rev-parse','HEAD'],{cwd:repo,encoding:'utf8'}).trim(),rows},null,2)+'\n');
  projection={directory,portal:resolve(directory,'apps/portal'),dependencyPortal:resolve(repo,'apps/portal')};
  return projection;
}

export async function runFinalExportCase(name) {
  assert.ok(cases.includes(name),'closed finite case set');
  const {directory}=finalExportSourceProjection();
  globalThis.fetch=async()=>{throw Error('unexpected global network');};
  // Tests register their asynchronous bodies while the module loads. Keep the
  // global deny in force for this isolated Node test file's whole lifetime.
  await import(pathToFileURL(resolve(directory,'apps/portal/tests',name)).href);
}
