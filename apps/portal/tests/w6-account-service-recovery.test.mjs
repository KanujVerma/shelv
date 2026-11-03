// Closed finite HTTP; this file's synthetic namespace is explicit and local.
// It does not register production or replace authority/currentness ports.
import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import ts from 'typescript';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
const portal=fileURLToPath(new URL('..',import.meta.url));
const hash=value=>createHash('sha256').update(value).digest('hex');
let constructorProjection;
globalThis.fetch=async()=>{throw Error('unexpected global network');};
const result=await build({absWorkingDir:portal,tsconfig:'tsconfig.frontend.json',stdin:{
  contents:"export{createApplicationSession}from'./src/app/session.ts';export{createAccountServiceController}from'./src/features/account/service/controller.ts';export{readClientServiceCommand}from'../../src/contracts/PortalClientServiceValidation.ts';",loader:'ts',resolveDir:portal},
  bundle:true,write:false,metafile:true,platform:'node',format:'esm',plugins:[{name:'finite-service-namespace',setup(b){
    b.onLoad({filter:/client-cookie-session\.js$/},args=>{
      const before=readFileSync(args.path,'utf8'),source=ts.createSourceFile(args.path,before,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
      const cls=source.statements.find(n=>ts.isClassDeclaration(n)&&n.name?.text==='CookieClientSession');assert.ok(cls);
      const ctor=cls.members.find(ts.isConstructorDeclaration);assert.ok(ctor);
      const original=before.slice(ctor.getStart(source),ctor.end);
      assert.equal(hash(original),'8f175a8dcbdfb4aed067c7adc90d3a5fcfaad26745139c5300d26d65cfbbb147','exact unregistered constructor preimage');
      const anchor="  this.actions.notifications=['list_inbox_v1','mark_seen_v1','request_status_v1'];";assert.equal(original.split(anchor).length,2);
      const projected=original.replace(anchor,anchor+"\n  this.actions['account-service']=['read_client_service_v1','cancel_client_service_period_end_v1','client_service_request_status_v1'];");
      assert.equal(hash(projected),'d3051850bdf1543b47b832d5a1e61def0cce3a834d9df19fbbc21ae44bb9164d');
      const contents=before.slice(0,ctor.getStart(source))+projected+before.slice(ctor.end);
      constructorProjection={path:args.path,scope:'SYNTHETIC THREE-ACTION NAMESPACE ONLY',constructorBefore:hash(original),constructorAfter:hash(projected),fileBefore:hash(before),fileAfter:hash(contents)};
      return{contents,loader:'js',resolveDir:resolve(args.path,'..')};
    });
  }}]});
assert.ok(constructorProjection);
const artifact=fileURLToPath(new URL('../../../.local-artifacts/w6-account-service/self-contained-recovery/',import.meta.url));mkdirSync(artifact,{recursive:true});
const output=result.outputFiles[0].contents,outputPath=resolve(artifact,'api-'+hash(output)+'.mjs');writeFileSync(outputPath,output);
const dependencies=Object.keys(result.metafile.inputs).filter(p=>p!=='<stdin>').map(path=>({path,sha256:hash(readFileSync(resolve(portal,path))),...(resolve(portal,path)===constructorProjection.path?{effectiveSha256:constructorProjection.fileAfter}:{})}));
const toolchain=['package-lock.json','node_modules/esbuild/package.json','node_modules/typescript/package.json'].map(path=>({path,sha256:hash(readFileSync(resolve(portal,path)))}));
writeFileSync(resolve(artifact,'SOURCE.json'),JSON.stringify({scope:'SOURCE/finite HTTP only; not actual registration or genuine Auth',nodeVersion:process.version,constructorProjection,dependencies,toolchain,outputSha256:hash(output)},null,2)+'\n');
const {createApplicationSession,createAccountServiceController,readClientServiceCommand}=await import(pathToFileURL(outputPath).href);

test('a lost cancellation can resolve the exact original after absent status and a changed current basis', async t => {
  const actor='11111111-1111-4111-8111-111111111111',calls=[];
  let current={schemaVersion:1,serviceRevision:7,basisHash:'a'.repeat(64),asOfDay:'2026-11-03',
    coverage:{status:'active',period:{startOn:'2026-11-01',endOn:'2026-12-01'},paidSupportEndsOn:'2027-01-01',pendingPublication:false},
    cancellation:null,periodEndCancellation:{state:'available',supportEndsOn:'2027-01-01',readOnlyEndsOn:'2027-01-31'}};
  let sends=0;
  const originalFetch=globalThis.fetch;globalThis.fetch=async()=>{throw Error('unexpected global network');};t.after(()=>{globalThis.fetch=originalFetch;});
  const runtime=createApplicationSession({audience:'client',now:()=>Date.parse('2026-11-03T12:00:00Z'),locks:{request:async(_name,_options,run)=>run()},
    fetcher:async(url,init)=>{
      if(url==='/api/client/session')return Response.json({signedIn:true,ownerId:actor,generation:1,csrf:'synthetic-service-recovery',capabilities:{view:true,edit:false,publish:false,confirmPayments:false},idleExpiresAt:'2099-01-01T00:00:00Z',absoluteExpiresAt:'2099-01-02T00:00:00Z'});
      assert.equal(url,'/api/client/account-service');
      const command=readClientServiceCommand(JSON.parse(init.body));calls.push({command,wire:init.body});
      if(command.action==='read_client_service_v1')return Response.json(current);
      if(command.action==='client_service_request_status_v1')return Response.json({schemaVersion:1,requestId:command.requestId,state:'absent'});
      sends++;
      return Response.json({code:sends===1?'unavailable':'revision_conflict'},{status:sends===1?503:409});
    }});
  await runtime.restore();runtime.cookie.channel?.unref?.();t.after(()=>runtime.dispose());
  const controller=createAccountServiceController(runtime);t.after(()=>controller.dispose());
  assert.equal(await controller.load(),true);assert.equal(controller.openCancellation(controller.getSnapshot().current),true);
  const review=controller.getSnapshot().draft;await controller.confirmCancellation(review);
  const original=controller.getSnapshot().original,wire=calls.find(call=>call.command.action==='cancel_client_service_period_end_v1').wire;
  assert.ok(original);assert.equal(sends,1);await runtime.restore();
  current={...current,serviceRevision:8,basisHash:'b'.repeat(64),coverage:{...current.coverage,paidSupportEndsOn:'2027-02-01'},periodEndCancellation:{state:'available',supportEndsOn:'2027-02-01',readOnlyEndsOn:'2027-03-03'}};
  assert.equal(await controller.readOriginalStatus(original),true);
  assert.equal(controller.getSnapshot().originalStatus.state,'absent');assert.equal(sends,1,'status never resends');
  assert.equal(controller.getSnapshot().canRetry,true,'exact original recovery must reach server idempotency/CAS even after basis drift');
  await controller.retryOriginal(original);
  assert.equal(sends,2);assert.equal(calls.filter(call=>call.command.action==='cancel_client_service_period_end_v1')[1].wire,wire);
  assert.equal(controller.getSnapshot().writeState,'conflict');
  assert.equal(controller.discardCancellation(review),true);await controller.readCurrent();
  assert.equal(controller.openCancellation(controller.getSnapshot().current),true);assert.equal(controller.getSnapshot().canConfirm,true);
  assert.equal(sends,2,'a new cancellation still needs a separate deliberate confirmation');
});
