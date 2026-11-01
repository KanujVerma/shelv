import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import ts from '../node_modules/typescript/lib/typescript.js';
import {buildCheckinCall} from '../../../supabase/functions/concierge-checkins/commands.ts';
import * as projection from '../../../supabase/functions/concierge-checkins/projection.ts';
import {handleCheckinsRequest} from '../../../supabase/functions/concierge-checkins/handler.ts';

const owner='d1000000-0000-4000-8000-000000000001';
const command={action:'read_photo_head_v1'};
const request=body=>new Request('https://edge.test/concierge-checkins',{method:'POST',headers:{authorization:'Bearer synthetic','content-type':'application/json'},body:JSON.stringify(body)});
const forbiddenStorage={origin:'https://synthetic.test',upload(){throw Error('unexpected Storage upload');},read(){throw Error('unexpected Storage read');},sign(){throw Error('unexpected Storage sign');}};
function ports(data){return {allowedOrigins:[],authenticate:async()=>({id:owner,is_anonymous:false}),rpc:async(_token,call)=>{assert.deepEqual(call,{name:'concierge_checkin_head_v1',args:{}});return {data,error:null};},storage:forbiddenStorage};}

test('new own photo-head read maps to only a fixed selector-free RPC',()=>{
 assert.deepEqual(buildCheckinCall(command,owner),{name:'concierge_checkin_head_v1',args:{}});
 for(const field of ['clientId','ownerId','userId','requestId','rpc','url','expectedRevision'])assert.throws(()=>buildCheckinCall({...command,[field]:owner},owner));
});
test('Root returns only an exact independently supplied head, including real zero',async()=>{
 for(const revision of [0,17,Number.MAX_SAFE_INTEGER]){
  const r=await handleCheckinsRequest(request(command),ports({revision}));
  assert.equal(r.status,200);assert.deepEqual(await r.json(),{revision});assert.match(r.headers.get('cache-control'),/no-store/);
 }
});
test('metadata mapper and Root reject absent, lossy, private, extra or unsafe head values',async()=>{
 for(const value of [null,[],{},0,{revision:null},{revision:'0'},{revision:-1},{revision:0.1},{revision:Infinity},{revision:Number.MAX_SAFE_INTEGER+1},{revision:17,reportHead:99},{revision:17,reports:[]},{revision:17,privateNotes:'PRIVATE_CANARY'}]){
  assert.equal(projection.mapCheckinPhotoHead(value).ok,false);
  const r=await handleCheckinsRequest(request(command),ports(value));assert.equal(r.status,503);assert.deepEqual(await r.json(),{code:'unavailable',retryable:true});
 }
});
test('Root retains legacy M59 conflict and never falls back to the legacy read',async()=>{
 const p=ports(null);p.rpc=async(_token,call)=>{assert.equal(call.name,'concierge_checkin_read');return {data:null,error:{message:'concierge_content_version_required'}};};
 const r=await handleCheckinsRequest(request({action:'client_read'}),p);assert.equal(r.status,409);assert.deepEqual(await r.json(),{code:'content_version_required',retryable:false});
});
test('Root metadata path preserves identity, input byte limits and RPC rejection',async()=>{
 for(const user of [null,{id:owner,is_anonymous:true}]){
  const p=ports({revision:0});p.authenticate=async()=>user;p.rpc=()=>{throw Error('unexpected RPC');};
  assert.equal((await handleCheckinsRequest(request(command),p)).status,user===null?401:403);
 }
 for(const [code,status] of [['forbidden',403],['session_ended',401],['not_found',404]]){
  const p=ports(null);p.rpc=async()=>({data:null,error:{message:`concierge_${code}`}});
  assert.equal((await handleCheckinsRequest(request(command),p)).status,status);
 }
 const p=ports({revision:0});p.rpc=()=>{throw Error('unexpected RPC');};
 assert.equal((await handleCheckinsRequest(request({...command,padding:'x'.repeat(100001)}),p)).status,413);
});
test('new SQL source is additive selector-free metadata with guards around the canonical wait; pgTAP stays authored only',()=>{
 const sql=readFileSync(new URL('../../../supabase/migrations/20261101195359_portal_rebuild_photo_head_v1.sql',import.meta.url),'utf8');
 const body=sql.replace(/--[^\n]*/g,'');
 assert.equal((body.match(/create function /g)??[]).length,2);
 assert.doesNotMatch(body,/\b(?:insert|update|delete|alter|drop|create or replace)\b/i);
 assert.match(body,/create function public\.concierge_checkin_head_v1\(\)/);
 assert.equal((body.match(/concierge\.photo_head_client_guard_v1\(\)/g)??[]).length,5); // definition, revoke and three live checks
 const lock=body.indexOf("pg_advisory_xact_lock"),read=body.indexOf('select revision into h'),last=body.lastIndexOf('if concierge.photo_head_client_guard_v1()');
 assert.ok(lock>body.indexOf('u:=concierge.photo_head_client_guard_v1()')&&read>lock&&last>read);
 assert.ok(body.indexOf('from concierge.cases where client_id=u for share')>lock);
 assert.match(body,/perform concierge\.plan_session\(u,s::uuid\)/);
 assert.match(body,/from concierge\.plan_principals where actor_id=u for share/);
 assert.match(body,/perform concierge\.plan_target_client\(u,false\)/);
 assert.match(body,/perform concierge\.plan_care_access\(u,false\)/);
 assert.match(body,/return jsonb_build_object\('revision',h\)/);
 assert.doesNotMatch(body,/\b(?:checkin_projection|review_report_revision|care_report_heads|concierge_checkin_read)\b/);
 const tap=readFileSync(new URL('../../../supabase/tests/portal_rebuild_photo_head_v1.sql',import.meta.url),'utf8');
 assert.match(tap,/UNRUN/);assert.match(tap,/select \* from finish\(\);\nrollback;/);
});
test('AST proof removes only the explicitly allocated new read branches and preserves every old executable node',()=>{
 const root=fileURLToPath(new URL('../../../',import.meta.url));
 const files=['supabase/functions/concierge-checkins/commands.ts','supabase/functions/concierge-checkins/types.ts','supabase/functions/concierge-checkins/projection.ts','supabase/functions/concierge-checkins/handler.ts','supabase/functions/concierge-checkins/index.ts','apps/portal/site/auth/client-cookie-session.js','apps/portal/session-integration/runtime/server/client-policy.ts','apps/portal/session-integration/runtime/server/client-upstream.ts','apps/portal/session-integration/runtime/server/gateway.ts'];
 const names=new Set(['mapCheckinPhotoHead','mapClientPhotoHeadResponse']),newText=/['"](?:read_photo_head_v1|concierge_checkin_head_v1)['"]/;
 function normalized(text,file,strip){
  const source=ts.createSourceFile(file,text,ts.ScriptTarget.ESNext,true,file.endsWith('.js')?ts.ScriptKind.JS:ts.ScriptKind.TS);
  const transform=ts.transform(source,[context=>{
   const visit=node=>{
    if(strip){
     if(ts.isTypeAliasDeclaration(node)&&node.name.text==='CheckinPhotoHead'||ts.isFunctionDeclaration(node)&&names.has(node.name?.text))return undefined;
     if(ts.isIfStatement(node)&&newText.test(node.expression.getText(source)))return undefined;
     if(ts.isConditionalExpression(node)&&ts.isCallExpression(node.whenTrue)&&node.whenTrue.expression.getText(source)==='mapClientPhotoHeadResponse')return ts.visitNode(node.whenFalse,visit);
     if(ts.isArrayLiteralExpression(node))return ts.factory.updateArrayLiteralExpression(node,node.elements.filter(e=>!ts.isStringLiteral(e)||!['read_photo_head_v1','concierge_checkin_head_v1'].includes(e.text)).map(e=>ts.visitNode(e,visit)));
     if(ts.isUnionTypeNode(node))return ts.factory.updateUnionTypeNode(node,node.types.filter(e=>!newText.test(e.getText(source))).map(e=>ts.visitNode(e,visit)));
     if(ts.isImportDeclaration(node)&&node.importClause?.namedBindings&&ts.isNamedImports(node.importClause.namedBindings)){
      const elements=node.importClause.namedBindings.elements.filter(e=>!names.has(e.name.text));
      if(!elements.length&&!node.importClause.name)return undefined;
      return ts.factory.updateImportDeclaration(node,node.modifiers,ts.factory.updateImportClause(node.importClause,node.importClause.isTypeOnly,node.importClause.name,ts.factory.updateNamedImports(node.importClause.namedBindings,elements)),node.moduleSpecifier,node.attributes);
     }
    }
    return ts.visitEachChild(node,visit,context);
   };return node=>ts.visitNode(node,visit);
  }]);
  const printed=ts.createPrinter({removeComments:true}).printFile(transform.transformed[0]);transform.dispose();return printed;
 }
 for(const file of files){
  // The sole Parent-owned exception is six annotations, admitted separately with
  // byte-exact emitted JavaScript proof. All other old nodes retain d412 identity.
  const reference=file==='supabase/functions/concierge-checkins/handler.ts'?'d4a3314ecd81e4c3b544a8919834429e90c05d06':'d4125cca52cb21d0c0a79a5733662f782a0dea76';
  const original=execFileSync('git',['show',`${reference}:${file}`],{cwd:root,encoding:'utf8'}),current=readFileSync(new URL('../../../'+file,import.meta.url),'utf8');
  const a=normalized(original,file,false),b=normalized(current,file,true);assert.equal(b,a,file);
  console.log('OLD_AST_PRESERVED '+JSON.stringify({file,reference,sha256:createHash('sha256').update(a).digest('hex')}));
 }
});
