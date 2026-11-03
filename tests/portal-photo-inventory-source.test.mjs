import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {execFileSync} from 'node:child_process';
import ts from '../apps/portal/node_modules/typescript/lib/typescript.js';
import {createHash} from 'node:crypto';
import {sharedCiBaselines,currentSourceSha256} from './helpers/portal-shared-ci-baselines.ts';
import {ownAdminSourceBytes} from './helpers/portal-own-admin-source-baselines.ts';
const base='07c4ae82def408bf9526f48a48eb987e4506f83e';
const files=['apps/portal/site/auth/client-cookie-session.js','apps/portal/site/auth/advisor-cookie-session.js',...['client-policy','client-upstream','gateway'].map(n=>`apps/portal/session-integration/runtime/server/${n}.ts`),...['commands','types','projection','handler','index'].map(n=>`supabase/functions/concierge-checkins/${n}.ts`),'supabase/functions/concierge-operations/runtime.ts'];
const names=new Set(['photoInventoryJson','parseClientPhotoInventoryPage','mapClientPhotoInventoryResponse','mapCheckinPhotoInventory','CheckinPhotoInventoryPage','CheckinPhotoInventory']);
const inventory=node=>node&&ts.isStringLiteral(node)&&['read_photo_inventory_v1','concierge_checkin_photo_inventory_v1'].includes(node.text);
function normalized(text,file,mask){
 const source=ts.createSourceFile(file,text,ts.ScriptTarget.Latest,true,file.endsWith('.js')?ts.ScriptKind.JS:ts.ScriptKind.TS),removed=[];
 const transformed=ts.transform(source,[context=>root=>ts.visitNode(root,function visit(node){
  if(mask){
   if(ts.isImportDeclaration(node)&&node.importClause?.namedBindings&&ts.isNamedImports(node.importClause.namedBindings)){
    const extra=new Set([...names,...(file.endsWith('client-upstream.ts')?['SessionError','safeCodes']:[]),...(file==='supabase/functions/concierge-checkins/projection.ts'?['exactKeys','readInteger','readObject','requireValue']:[])]),elements=node.importClause.namedBindings.elements.filter(e=>!extra.has(e.name.text));
    if(elements.length!==node.importClause.namedBindings.elements.length){removed.push('imports');if(!elements.length&&!node.importClause.name)return undefined;return ts.factory.updateImportDeclaration(node,node.modifiers,ts.factory.updateImportClause(node.importClause,node.importClause.isTypeOnly,node.importClause.name,ts.factory.updateNamedImports(node.importClause.namedBindings,elements)),node.moduleSpecifier,node.attributes);}
   }
   if((ts.isFunctionDeclaration(node)||ts.isTypeAliasDeclaration(node))&&names.has(node.name?.text)){removed.push(node.name.text);return undefined;}
   if(ts.isConstructorDeclaration(node)&&file.endsWith('client-upstream.ts')){removed.push('constructor');return undefined;}
   if((ts.isMethodDeclaration(node)||ts.isPropertyDeclaration(node))&&['photoInventory','inventoryFetcher','inventoryTimeoutMs'].includes(node.name?.getText(source))){removed.push(node.name.getText(source));return undefined;}
   if(ts.isVariableStatement(node)&&node.declarationList.declarations.every(d=>['inventoryRead','inventoryCurrent'].includes(d.name.getText(source)))){removed.push('cookie-selection');return undefined;}
   if(ts.isIfStatement(node)&&(/read_photo_inventory_v1|concierge_checkin_photo_inventory_v1/.test(node.expression.getText(source))||node.expression.getText(source)==='inventoryRead&&response.ok')){removed.push('branch');return node.elseStatement?ts.visitNode(node.elseStatement,visit):undefined;}
   if(ts.isConditionalExpression(node)&&/read_photo_inventory_v1|concierge_checkin_photo_inventory_v1/.test(node.condition.getText(source))){removed.push('mapping');return ts.visitNode(node.whenFalse,visit);}
   if(ts.isBinaryExpression(node)&&node.operatorToken.kind===ts.SyntaxKind.BarBarToken&&node.right.getText(source)==='inventoryRead'){removed.push('denial-selection');return ts.visitNode(node.left,visit);}
   if(ts.isParenthesizedExpression(node)&&ts.isBinaryExpression(node.expression)&&node.expression.operatorToken.kind===ts.SyntaxKind.BarBarToken&&node.expression.right.getText(source)==='inventoryRead'){removed.push('denial-selection');return ts.visitNode(node.expression.left,visit);}
   if(ts.isArrayLiteralExpression(node)&&node.elements.some(inventory)){removed.push('registry');return ts.factory.updateArrayLiteralExpression(node,node.elements.filter(e=>!inventory(e)).map(e=>ts.visitNode(e,visit)));}
   if(ts.isUnionTypeNode(node)&&node.types.some(t=>ts.isTypeLiteralNode(t)&&t.members.some(m=>ts.isPropertySignature(m)&&m.name.getText(source)==='name'&&ts.isLiteralTypeNode(m.type)&&inventory(m.type.literal)))){removed.push('RPC-type');return ts.factory.updateUnionTypeNode(node,node.types.filter(t=>!(ts.isTypeLiteralNode(t)&&t.members.some(m=>ts.isPropertySignature(m)&&m.name.getText(source)==='name'&&ts.isLiteralTypeNode(m.type)&&inventory(m.type.literal)))).map(t=>ts.visitNode(t,visit)));}
  }
  return ts.visitEachChild(node,visit,context);
 })]);
 const value=ts.createPrinter({removeComments:true}).printFile(transformed.transformed[0]);transformed.dispose();return {value,removed};
}
for(const file of files)test(`${ownAdminSourceBytes(file)?'reviewed admin source identity and inventory erasure shape':'inventory-only erasure preserves all other executable nodes'}: ${file}`,()=>{
 const old=sharedCiBaselines.readBytes(base,file).toString('utf8'),current=readFileSync(file,'utf8'),result=normalized(current,file,true);
 assert.ok(result.removed.length>0);
 const admin=ownAdminSourceBytes(file);
 if(admin){
  assert.equal(createHash('sha256').update(current).digest('hex'),currentSourceSha256(file));
  assert.equal(result.value,normalized(admin.toString('utf8'),file,true).value,file+' exact reviewed admin composition shape');
 }else assert.equal(result.value,normalized(old,file,false).value);
});
function constructorPin(text){
 const source=ts.createSourceFile('provider.ts',text,ts.ScriptTarget.Latest,true);let constructor;
 const visit=n=>{if(ts.isClassDeclaration(n)&&n.name?.text==='ClientProvider')constructor=n.members.find(ts.isConstructorDeclaration);ts.forEachChild(n,visit);};visit(source);assert.ok(constructor);
 assert.deepEqual(constructor.parameters.map(p=>p.name.getText(source)),['publicKey','fetcher','timeoutMs','durableContext']);
 assert.deepEqual(constructor.parameters.map(p=>p.initializer?.getText(source).replace(/\s/g,'')),[undefined,'(input,init)=>globalThis.fetch(input,init)','12000','false']);
 const call=constructor.body.statements[0].expression;assert.equal(call.expression.kind,ts.SyntaxKind.SuperKeyword);assert.deepEqual(call.arguments.map(a=>a.getText(source)),['publicKey','fetcher','timeoutMs','durableContext']);
 assert.equal(constructor.body.statements.length,4);
 assert.equal(constructor.body.statements[3].getText(source).replace(/\s/g,''),'this.ownAdminProvider=createOwnAdminProvider({supabaseUrl:SUPABASE_ORIGIN,publicKey,allowedOrigins:[PORTAL_ORIGIN],fetch:fetcher});');
}
test('inherited four constructor parameters/defaults stay exact and the fixed admin factory is explicit',()=>{
 const current=readFileSync('apps/portal/session-integration/runtime/server/client-upstream.ts','utf8');constructorPin(current);
 assert.throws(()=>constructorPin(current.replace('super(publicKey,fetcher,timeoutMs,durableContext)','super(publicKey,fetcher,1,durableContext)')));
});
test('preservation witnesses detect a real original denial or head-budget mutation',()=>{
 for(const [file,before,after] of [['apps/portal/site/auth/advisor-cookie-session.js',"this.status === 'ready'","this.status === 'offline'"],['supabase/functions/concierge-operations/runtime.ts',"'concierge_checkin_head_v1' ? 4096","'concierge_checkin_head_v1' ? 4095"]]){
  const current=readFileSync(file,'utf8');assert.ok(current.includes(before));assert.notEqual(normalized(current,file,true).value,normalized(current.replace(before,after),file,true).value);
 }
});
test('reviewed generic source and historical NT1 provider/Vault stay pinned',()=>{
 for(const file of ['apps/portal/src/transport/session.ts','apps/portal/session-integration/runtime/server/upstream.ts','apps/portal/session-integration/runtime/server/session-vault.ts']){
  const current=readFileSync(file);
  if(file==='apps/portal/src/transport/session.ts')assert.equal(createHash('sha256').update(current).digest('hex'),currentSourceSha256(file));
  else assert.equal(current.toString('utf8'),sharedCiBaselines.readBytes(base,file).toString('utf8'));
 }
});
