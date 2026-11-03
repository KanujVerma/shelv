import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync,readdirSync} from 'node:fs';
import {portalCiBaselines} from '../../../tests/helpers/portal-ci-baselines.ts';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import ts from '../node_modules/typescript/lib/typescript.js';
import {withoutApprovedFetchPrivacyType} from './helpers/photo-inventory-baseline.mjs';
import {buildCheckinCall} from '../../../supabase/functions/concierge-checkins/commands.ts';
import {mapCheckinPhotoInventory} from '../../../supabase/functions/concierge-checkins/projection.ts';

const root=fileURLToPath(new URL('../../../',import.meta.url)),base='3bd152a259b7b9b9971caa1546e65f69de12aab9';
const owner='d1000000-0000-4000-8000-000000000001';
const id=n=>`d2000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const page={cursor:null,limit:2,expectedRevision:null};
test('pure command and projection keep the exact fixed API, immutable rows and last-returned cursor',()=>{
 assert.deepEqual(buildCheckinCall({action:'read_photo_inventory_v1',...page},owner),{name:'concierge_checkin_photo_inventory_v1',args:{p_cursor:null,p_limit:2,p_expected_revision:null}});
 const raw={revision:17,photos:[{id:id(1),angle:'front'},{id:id(2),angle:'left'}],nextCursor:id(2)};
 const mapped=mapCheckinPhotoInventory(raw,page);assert.equal(mapped.ok,true);assert.deepEqual(mapped.value,raw);
 assert.ok(Object.isFrozen(mapped.value)&&Object.isFrozen(mapped.value.photos)&&mapped.value.photos.every(Object.isFrozen));
 raw.photos[0].angle='right';assert.equal(mapped.value.photos[0].angle,'front');
 for(const bad of [{...page,limit:0},{...page,cursor:id(1)}, {...page,expectedRevision:18}])assert.equal(mapCheckinPhotoInventory(raw,bad).ok,false);
});

test('inventory migration source reuses actual guarded head and only bounded own-complete keyset rows; canonical pgTAP is UNRUN',()=>{
 const files=readdirSync(root+'supabase/migrations').filter(p=>p.endsWith('_portal_rebuild_photo_inventory_v1.sql'));assert.equal(files.length,1);
 const body=readFileSync(root+'supabase/migrations/'+files[0],'utf8').replace(/--[^\n]*/g,'');
 assert.match(body,/create function public\.concierge_checkin_photo_inventory_v1\(p_cursor uuid,p_limit integer,p_expected_revision bigint\)/);
 assert.doesNotMatch(body,/\b(?:insert|update|delete|alter|drop|create or replace|create table)\b/i);
 assert.match(body,/security definer set search_path=''/);
 assert.match(body,/u:=concierge\.photo_head_client_guard_v1\(\)/);
 assert.match(body,/public\.concierge_checkin_head_v1\(\)/);
 const head=body.indexOf('public.concierge_checkin_head_v1()'),query=body.indexOf('from concierge.checkin_photos'),final=body.lastIndexOf('concierge.photo_head_client_guard_v1()');
 assert.ok(head>body.indexOf('u:=concierge.photo_head_client_guard_v1()')&&query>head&&final>query);
 assert.match(body,/p_expected_revision is not null and h<>p_expected_revision/);
 assert.match(body,/client_id=u and state='complete'/);
 assert.match(body,/p_cursor is null or id>p_cursor/);
 assert.match(body,/order by id limit p_limit\+1/);
 assert.doesNotMatch(body,/\b(?:checkin_projection|care_report_heads|care_report_revision|report_photos|review_amendment_photos|reserved_by|path|signedUrl|sha256|count|total)\b/i);
 assert.match(body,/revoke all on function public\.concierge_checkin_photo_inventory_v1\(uuid,integer,bigint\) from public,anon,authenticated,service_role/);
 assert.match(body,/grant execute on function public\.concierge_checkin_photo_inventory_v1\(uuid,integer,bigint\) to authenticated/);
 assert.match(body,/create index checkin_photos_complete_client_id_v1 on concierge\.checkin_photos\(client_id,id\) where state='complete'/);
 const headBody=readFileSync(root+'supabase/migrations/20261101195359_portal_rebuild_photo_head_v1.sql','utf8');
 const advisory=headBody.indexOf('pg_advisory_xact_lock'),caseShare=headBody.indexOf('from concierge.cases where client_id=u for share'),headShare=headBody.indexOf('from concierge.checkin_heads where client_id=u for share');
 assert.ok(advisory<caseShare&&caseShare<headShare);assert.equal((headBody.match(/photo_head_client_guard_v1\(\)/g)??[]).length,5);
 const tap=readFileSync(root+'supabase/tests/portal_rebuild_photo_inventory_v1.sql','utf8');assert.match(tap,/UNRUN/);assert.match(tap,/select \* from finish\(\);\nrollback;/);
});

test('removing only allocated inventory nodes leaves every old executable Root node and head success budget exact',()=>{
 const files=['commands','types','projection','handler','index'].map(n=>'supabase/functions/concierge-checkins/'+n+'.ts').concat('supabase/functions/concierge-operations/runtime.ts');
 const functions=new Set(['mapCheckinPhotoInventory']),types=new Set(['CheckinPhotoInventory','CheckinPhotoInventoryPage']);
 const names=new Set([...functions,...types,'exactKeys','readInteger','readObject','requireValue']);
 const newText=/['"](?:read_photo_inventory_v1|concierge_checkin_photo_inventory_v1)['"]/;
 function normalize(text,file,strip){
  const source=ts.createSourceFile(file,withoutApprovedFetchPrivacyType(text,file),ts.ScriptTarget.ESNext,true);
  const transformed=ts.transform(source,[context=>{
   const visit=node=>{
    if(strip){
     if(ts.isTypeAliasDeclaration(node)&&types.has(node.name.text)||ts.isFunctionDeclaration(node)&&functions.has(node.name?.text))return undefined;
     if(ts.isIfStatement(node)&&newText.test(node.expression.getText(source)))return undefined;
     if(ts.isConditionalExpression(node)&&newText.test(node.condition.getText(source)))return ts.visitNode(node.whenFalse,visit);
     if(ts.isArrayLiteralExpression(node))return ts.factory.updateArrayLiteralExpression(node,node.elements.filter(e=>!ts.isStringLiteral(e)||e.text!=='concierge_checkin_photo_inventory_v1').map(e=>ts.visitNode(e,visit)));
     if(ts.isUnionTypeNode(node))return ts.factory.updateUnionTypeNode(node,node.types.filter(e=>!newText.test(e.getText(source))).map(e=>ts.visitNode(e,visit)));
     if(ts.isImportDeclaration(node)&&node.importClause?.namedBindings&&ts.isNamedImports(node.importClause.namedBindings)){
      const remove=file.endsWith('/projection.ts')?names:new Set(['mapCheckinPhotoInventory']);
      const elements=node.importClause.namedBindings.elements.filter(e=>!remove.has(e.name.text));
      if(!elements.length&&!node.importClause.name)return undefined;
      return ts.factory.updateImportDeclaration(node,node.modifiers,ts.factory.updateImportClause(node.importClause,node.importClause.isTypeOnly,node.importClause.name,ts.factory.updateNamedImports(node.importClause.namedBindings,elements)),node.moduleSpecifier,node.attributes);
     }
    }
    return ts.visitEachChild(node,visit,context);
   };return node=>ts.visitNode(node,visit);
  }]);
  const printed=ts.createPrinter({removeComments:true}).printFile(transformed.transformed[0]);transformed.dispose();return printed;
 }
 for(const file of files){
  const original=portalCiBaselines.readBytes(base,file).toString('utf8'),current=readFileSync(root+file,'utf8');
  const before=normalize(original,file,false),after=normalize(current,file,true);assert.equal(after,before,file);
  console.log('INVENTORY_OLD_AST '+JSON.stringify({file,base,sha256:createHash('sha256').update(before).digest('hex')}));
 }
});
