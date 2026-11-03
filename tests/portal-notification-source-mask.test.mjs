import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {execFileSync} from 'node:child_process';
import ts from '../apps/portal/node_modules/typescript/lib/typescript.js';
import {createHash} from 'node:crypto';
import {sharedCiBaselines,currentSourceSha256,currentMaskedSha256} from './helpers/portal-shared-ci-baselines.ts';
import {ownAdminSourceBytes} from './helpers/portal-own-admin-source-baselines.ts';
const base='58c0669d0c5507c0eb7087fe0a0b0e0785743d5e';
const prerequisite='3f4cb6716fed9123e2d47949a28144b9a7b55485';
const genericFiles=new Set(['apps/portal/site/auth/advisor-cookie-session.js','apps/portal/site/auth/client-cookie-session.js','apps/portal/src/transport/session.ts']);
const paths=['apps/portal/site/auth/client-cookie-session.js','apps/portal/site/auth/advisor-cookie-session.js','apps/portal/src/transport/session.ts',...['client-policy','client-upstream','policy','upstream','gateway'].map(n=>`apps/portal/session-integration/runtime/server/${n}.ts`)];
const helpers=new Set(['parseNotificationCommand','notificationCapability','mapNotificationResponse','notificationRequest']);
// These files contain independently reviewed generic/inventory/body changes too.
const combined=new Set(paths.filter(file=>!file.endsWith('/upstream.ts')));
function normalized(text,file,mask){
 const source=ts.createSourceFile(file,text,ts.ScriptTarget.Latest,true,file.endsWith('.js')?ts.ScriptKind.JS:ts.ScriptKind.TS);
 const transformed=ts.transform(source,[context=>{
  const visit=node=>{
   if(mask){
    if(ts.isImportDeclaration(node)){
     if(/PortalNotification/.test(node.moduleSpecifier.text))return undefined;
     if(node.importClause?.namedBindings&&ts.isNamedImports(node.importClause.namedBindings)){
      const elements=node.importClause.namedBindings.elements.filter(e=>!helpers.has(e.name.text));
      if(!elements.length&&!node.importClause.name)return undefined;
      if(elements.length!==node.importClause.namedBindings.elements.length)return ts.factory.updateImportDeclaration(node,node.modifiers,ts.factory.updateImportClause(node.importClause,node.importClause.isTypeOnly,node.importClause.name,ts.factory.updateNamedImports(node.importClause.namedBindings,elements)),node.moduleSpecifier,node.attributes);
     }
    }
    if(ts.isFunctionDeclaration(node)&&helpers.has(node.name?.text)||ts.isMethodDeclaration(node)&&node.name.getText(source)==='notification')return undefined;
    if(ts.isVariableStatement(node)&&node.declarationList.declarations.every(d=>d.name.getText(source)==='notificationInput'))return undefined;
    if(ts.isExpressionStatement(node)&&/^(?:actions|this\.actions)\.notifications\s*=/.test(node.getText(source)))return undefined;
    if(ts.isPropertyAssignment(node)&&node.name.getText(source)==='notifications')return undefined;
    if(ts.isIfStatement(node)&&(/\bnotificationInput\b/.test(node.expression.getText(source))||/\b(?:path|channel|inputOperation\.channel)\s*===\s*'notifications'/.test(node.expression.getText(source))))return node.elseStatement?ts.visitNode(node.elseStatement,visit):undefined;
    if(ts.isConditionalExpression(node)&&/\b(?:route|channel)\s*===\s*'(?:\/api\/advisor\/)?notifications'/.test(node.condition.getText(source)))return ts.visitNode(node.whenFalse,visit);
    if(ts.isUnionTypeNode(node))return ts.factory.updateUnionTypeNode(node,node.types.filter(t=>t.getText(source)!=="'notifications'").map(t=>ts.visitNode(t,visit)));
    if(ts.isArrayLiteralExpression(node))return ts.factory.updateArrayLiteralExpression(node,node.elements.filter(e=>!ts.isStringLiteral(e)||!['notifications','/api/advisor/notifications'].includes(e.text)).map(e=>ts.visitNode(e,visit)));
   }
   return ts.visitEachChild(node,visit,context);
  };return node=>ts.visitNode(node,visit);
 }]);
 const printed=ts.createPrinter({removeComments:true}).printFile(transformed.transformed[0]);transformed.dispose();return printed;
}
for(const file of paths)test(`${combined.has(file)?'pinned Root combined source identity and notification erasure shape':'notification-only erasure preserves every other executable node'}: ${file}`,()=>{
 const old=sharedCiBaselines.readBytes(genericFiles.has(file)?prerequisite:base,file).toString('utf8'),current=readFileSync(file,'utf8');
 if(combined.has(file)){
  assert.equal(createHash('sha256').update(current).digest('hex'),currentSourceSha256(file));
  const admin=ownAdminSourceBytes(file);
  if(admin)assert.equal(normalized(current,file,true),normalized(admin.toString('utf8'),file,true),file+' exact reviewed admin composition shape');
  else assert.equal(createHash('sha256').update(normalized(current,file,true)).digest('hex'),currentMaskedSha256('notification',file));
 }else assert.equal(normalized(current,file,true),normalized(old,file,genericFiles.has(file)));
});
test('erasure controls still detect changes to clinical namespaces and the original lease clock',()=>{
 for(const [file,oldPart,newPart] of [['apps/portal/site/auth/advisor-cookie-session.js','this.status === \'ready\'','this.status === \'offline\''],['apps/portal/session-integration/runtime/server/client-policy.ts',"channel==='reviews'","channel==='unapproved'"]]){
  const bytes=readFileSync(file,'utf8');assert.ok(bytes.includes(oldPart));assert.notEqual(normalized(bytes.replace(oldPart,newPart),file,true),normalized(bytes,file,true));
 }
});
