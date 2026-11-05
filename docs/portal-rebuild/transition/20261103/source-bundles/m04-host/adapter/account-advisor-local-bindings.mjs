import assert from 'node:assert/strict';
import path from 'node:path';
import {createHash,X509Certificate,createPrivateKey,createPublicKey} from 'node:crypto';
import {readFile,lstat,realpath,mkdir,readdir,writeFile,open} from 'node:fs/promises';
import {constants as fsConstants} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';


// M04 fixture composition. This never grants an actor role or starts a resource.
export const M04_SOURCE_PINS=Object.freeze({rootTargetSha256:'be2e06bcbd45665e2f2e191dafb5d6d284f0a2591987ad236a6efce02e21eb1e',runtimeManifestSha256:'2cc3c59ca1be485a60a83b243a5d6957ffc145349025546d0d1bfeb6885beb86'});
export function fixedAdvisorEmails(ownerId){
  assert.ok(typeof ownerId==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(ownerId),'resource owner UUID required');
  const value=ownerId.toLowerCase();return Object.freeze({owner:'owner-'+value+'@example.invalid',viewer:'viewer-'+value+'@example.invalid'});
}
const m04Id='[a-zA-Z0-9][a-zA-Z0-9_:.-]{0,159}';
const m04Editor=new RegExp('^/advisor/plans/'+m04Id+'/(sources|client-context|decisions|routine|follow-up|review-publish|preview)$');
export function fixtureSpaDestination(pathname){
  if(typeof pathname!=='string'||pathname.length>600||/[\\%?#\u0000-\u0020\u007f]/.test(pathname)||pathname.startsWith('//'))return false;
  if(['/','/account','/account/service','/account/cancel','/orders','/plan','/history','/history/new','/notifications','/maya','/advisor/plans','/advisor/clients'].includes(pathname))return true;
  // -1 intentionally reaches the real Root route/unavailable UI as a negative.
  if(pathname==='/history/versions/-1')return true;
  if(new RegExp('^/history/versions/'+m04Id+'$').test(pathname))return true;
  return m04Editor.test(pathname)||/^\/orders\/[a-f0-9-]{36}$/i.test(pathname);
}
export function fixtureApiDestination(pathname){
  if(typeof pathname!=='string')return false;
  const advisor=['session','auth/request','auth/complete','logout','operations','plans','payments','care'];
  const client=['session','auth/request','auth/complete','logout','account-profile','account-contact','client-orders','plans','payments'];
  return advisor.some(p=>pathname==='/api/advisor/'+p)||client.some(p=>pathname==='/api/client/'+p);
}
const m04PlanActions=new Set(['list_plans_v1','create_draft_v1','read_draft_v1','save_draft_v1','compare_import_v1','apply_import_v1','assign_draft_v1','review_section_v1','read_draft_dependencies_v1','validate_draft_v1','read_advisor_gate_v1','approve_publication_v1','publish_plan_v1','request_status_v1','read_advisor_publication_v1','read_client_plan_v1']);
const m04PaymentActions=new Set(['advisor_read','client_read','issue_quote','submit_claim','confirm_payment']);
const m04CareActions=new Set(['read_advisor_use_history_v1','read_advisor_publication_v2']);
export function fixtureServiceAction(pathname,command){
  assert.ok(command&&typeof command==='object'&&!Array.isArray(command),'fixed service command required');
  if(pathname==='/functions/v1/concierge-operations'&&command.action==='advisor_list')return 'operations';
  if(pathname==='/functions/v1/concierge-plans'&&command.schemaVersion===1&&m04PlanActions.has(command.action))return command.action==='read_client_plan_v1'?'diagnostic-v1':'plans';
  if(pathname==='/functions/v1/concierge-payments'&&command.schemaVersion===2&&m04PaymentActions.has(command.action))return 'payments';
  if(pathname==='/functions/v1/concierge-care'&&command.schemaVersion===1&&m04CareActions.has(command.action))return 'care-read';
  throw Error('M04 fixed service/action refused; no held or diagnostic fallback');
}
export function projectM04ProviderSource(name,bytes){
  const expected={
    'apps/portal/session-integration/runtime/server/upstream.ts':['16d4e818a52d79351e02162a506dbee7770ee3388b3beece12cfe38949eee1dd','private fetcher: typeof fetch = (input, init) => globalThis.fetch(input, init)','private fetcher: typeof fetch = (input, init) => m04FixedFetch(input, init)'],
    'apps/portal/session-integration/runtime/server/client-upstream.ts':['18120c8450b0744fdc67f1ac342975f92fa6f9949f12352e0bde5fa5c1e4fc78','fetcher:typeof fetch=(input,init)=>globalThis.fetch(input,init)','fetcher:typeof fetch=(input,init)=>m04FixedFetch(input,init)'],
  }[name];
  if(!expected)return {source:Buffer.from(bytes).toString('utf8'),delta:[]};
  assert.equal(sha(bytes),expected[0],'exact Root359 provider source required');
  let source=Buffer.from(bytes).toString('utf8');const before=expected[1],after=expected[2],offset=source.indexOf(before);
  assert.ok(offset>=0&&source.indexOf(before,offset+1)===-1,'exactly one default fetch declaration');
  source=source.slice(0,offset)+after+source.slice(offset+before.length);
  const header="import {m04FixedFetch} from 'm04:fixed-handlers';\n";
  return {source:header+source,delta:[{offset,before,after},{offset:0,before:'',after:header}],originalSha256:sha(bytes),localSha256:sha(header+source)};
}
function m04VirtualSource(name,root){
  assert.equal(root,SOURCE_PIN.root,'foreign virtual source root');
  if(name==='m04:gateway-entry')return `import actual from '${root}/apps/portal/session-integration/runtime/server/advisor-candidate-gateway.ts';
const fixtureApiDestination=${fixtureApiDestination.toString()};
export default {fetch(request,env){const p=new URL(request.url).pathname;if((p==='/api'||p.startsWith('/api/'))&&!fixtureApiDestination(p))return Response.json({code:'not_found'},{status:404,headers:{'cache-control':'private, no-store'}});return actual.fetch(request,env);}};`;
  assert.equal(name,'m04:fixed-handlers','unknown virtual source refused');
  return `import {PORTAL_ORIGIN,SUPABASE_ORIGIN} from '${root}/apps/portal/session-integration/runtime/server/policy.ts';
import {readConciergeJson} from '${root}/supabase/functions/concierge-operations/body.ts';
import {handleConciergeRequest} from '${root}/supabase/functions/concierge-operations/handler.ts';
import {createConciergeSupabasePorts} from '${root}/supabase/functions/concierge-operations/runtime.ts';
import {handlePlanRequest} from '${root}/supabase/functions/concierge-plans/handler.ts';
import {createPlanPorts} from '${root}/supabase/functions/concierge-plans/runtime.ts';
import {handlePaymentRequest} from '${root}/supabase/functions/concierge-payments/handler.ts';
import {createPaymentPorts} from '${root}/supabase/functions/concierge-payments/runtime.ts';
import {handleCareRequest} from '${root}/supabase/functions/concierge-care/handler.ts';
import {createCarePorts} from '${root}/supabase/functions/concierge-care/runtime.ts';
const m04PlanActions=new Set(${JSON.stringify([...m04PlanActions])});
const m04PaymentActions=new Set(${JSON.stringify([...m04PaymentActions])});
const m04CareActions=new Set(${JSON.stringify([...m04CareActions])});
const fixtureServiceAction=${fixtureServiceAction.toString().replaceAll('assert.ok(','requireM04(')};
const requireM04=(condition,message)=>{if(!condition)throw Error(message);};
export async function m04FixedFetch(input,init){
 const request=new Request(input,init),url=new URL(request.url);
 if(!url.pathname.startsWith('/functions/'))return globalThis.fetch(request);
 if(url.origin!==SUPABASE_ORIGIN||url.username||url.password||url.search||url.hash||request.method!=='POST')throw Error('M04 fixed function origin/method refused');
 const command=await readConciergeJson(request.clone().body,500000);
 const family=fixtureServiceAction(url.pathname,command);
 const config={supabaseUrl:SUPABASE_ORIGIN,publicKey:request.headers.get('apikey')??'',allowedOrigins:[PORTAL_ORIGIN],fetch:(input,init)=>globalThis.fetch(input,init)};
 if(family==='operations')return handleConciergeRequest(request,createConciergeSupabasePorts(config));
 if(family==='plans'||family==='diagnostic-v1')return handlePlanRequest(request,createPlanPorts(config));
 if(family==='payments')return handlePaymentRequest(request,createPaymentPorts(config));
 if(family==='care-read')return handleCareRequest(request,createCarePorts(config));
 throw Error('M04 service unavailable');
}`;
}
export function fixtureVirtualSources(root=SOURCE_PIN.root){
  return Object.freeze({gatewayEntry:m04VirtualSource('m04:gateway-entry',root),fixedHandlers:m04VirtualSource('m04:fixed-handlers',root)});
}

// This module has no import-time IO, compiler/SDK imports, process or listener.
export const SOURCE_PIN=Object.freeze({
  root:'/Users/kanuj/.t3/worktrees/shelv/kanuj-portal-rebuild-integration-20261030',
  commit:'359c6bf0c759357df648ca441e9e3d1c3d29398c',
  policyPath:'apps/portal/session-integration/runtime/server/policy.ts',
  policySha256:'f2515052dbebfe883320c26608e956cc728787ace87483fb12765f40b7d3749f',
});
export const ROLLFORWARD_SOURCE_COMMIT='72edabab3afe2532580da4a4069dea1edbd1b952';
// These approved endpoint pins are a source plan, never a resource grant.
export const LOCAL_ORIGINS=Object.freeze({portal:'https://127.0.0.1:58630',supabase:'https://127.0.0.1:58621'});
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
function exact(value,keys,label){
  assert.ok(value&&typeof value==='object'&&!Array.isArray(value),label+' object required');
  assert.deepEqual(Object.keys(value).sort(),[...keys].sort(),label+' option fields');
}
function literalOrigin(value,protocols){
  assert.equal(typeof value,'string','origin must be literal');
  assert.match(value,/^https?:\/\/127\.0\.0\.1:[1-9][0-9]{3,4}$/,'origin must be literal loopback with explicit port');
  const parsed=new URL(value),port=Number(parsed.port);
  assert.ok(protocols.includes(parsed.protocol)&&parsed.origin===value&&port>=1024&&port<=65535,'origin protocol/port refused');
  return value;
}

/** Only the two exact declarations in the immutable current policy may differ. */
export function projectPolicySource(options){
  exact(options,['sourceRoot','sourcePath','sourceBytes','portalOrigin','supabaseOrigin'],'projection');
  const {sourceRoot,sourcePath,sourceBytes}=options;
  assert.equal(sourceRoot,SOURCE_PIN.root,'foreign source root');
  assert.equal(sourcePath,path.join(sourceRoot,SOURCE_PIN.policyPath),'foreign source path');
  assert.ok(Buffer.isBuffer(sourceBytes)||sourceBytes instanceof Uint8Array,'policy source bytes required');
  assert.equal(sha(sourceBytes),SOURCE_PIN.policySha256,'current policy source hash mismatch');
  const portalOrigin=literalOrigin(options.portalOrigin,['https:']);
  const supabaseOrigin=literalOrigin(options.supabaseOrigin,['http:','https:']);
  assert.notEqual(new URL(portalOrigin).port,new URL(supabaseOrigin).port,'distinct origins required');
  let source=Buffer.from(sourceBytes).toString('utf8');const delta=[];
  for(const [name,before,after] of [
    ['PORTAL_ORIGIN',"export const PORTAL_ORIGIN = 'https://portal.goshelv.com';",`export const PORTAL_ORIGIN = '${portalOrigin}';`],
    ['SUPABASE_ORIGIN',"export const SUPABASE_ORIGIN = 'https://snojlbqovlawewwqbviz.supabase.co';",`export const SUPABASE_ORIGIN = '${supabaseOrigin}';`],
  ]){
    const offset=source.indexOf(before);
    assert.ok(offset>=0&&source.indexOf(before,offset+1)===-1,'exactly one policy origin literal required');
    source=source.slice(0,offset)+after+source.slice(offset+before.length);
    delta.push(Object.freeze({name,offset,before,after}));
  }
  let restored=source;
  for(const change of [...delta].reverse())restored=restored.slice(0,change.offset)+change.before+restored.slice(change.offset+change.after.length);
  assert.ok(Buffer.from(restored).equals(Buffer.from(sourceBytes)),'policy reversible delta mismatch');
  return Object.freeze({source,originalSha256:sha(sourceBytes),localSha256:sha(source),delta:Object.freeze(delta)});
}

/** Narrower fixture egress, never a selector or an HTTP destination rewrite. */
export function localProviderTarget(request,descriptor,body){
  const origin=literalOrigin(descriptor.endpoints.supabase,['https:']);
  assert.equal(origin,LOCAL_ORIGINS.supabase,'egress destination port/protocol refused');
  assert.equal(descriptor.endpoints.portal,LOCAL_ORIGINS.portal,'egress portal origin refused');
  const url=new URL(request.url);
  assert.ok(url.origin===origin&&request.url===url.href&&!url.username&&!url.password&&!url.hash,'egress destination origin refused');
  assert.ok(request.url.startsWith(origin+'/'),'egress literal destination refused');
  const query=[...url.searchParams],single=(key,values)=>query.length===1&&query[0][0]===key&&values.includes(query[0][1]);
  if(url.pathname==='/auth/v1/user')assert.equal(request.method,'GET','egress method refused');else assert.equal(request.method,'POST','egress method refused');
  if(url.pathname==='/auth/v1/otp'){
    assert.ok(query.length===1&&query[0][0]==='redirect_to','egress OTP query refused');
    const redirect=new URL(query[0][1]);
    const advisor=redirect.pathname==='/advisor/plans'||redirect.pathname==='/advisor/clients'||m04Editor.test(redirect.pathname);
    assert.ok(redirect.origin===descriptor.endpoints.portal&&!redirect.username&&!redirect.password&&!redirect.hash&&!redirect.search&&
      (['/account','/orders','/plan'].includes(redirect.pathname)||advisor),'egress OTP redirect refused');
    const payload=JSON.parse(Buffer.from(body).toString('utf8')),emails=fixedAdvisorEmails(descriptor.ownerId);
    assert.ok(payload.create_user===false,'local OTP must not enroll identities');
    const allowed=advisor?[emails.owner,emails.viewer]:[descriptor.actors.a.email,descriptor.actors.b.email];
    assert.ok(allowed.includes(payload.email)&&payload.email.endsWith('.invalid'),'local OTP synthetic recipient refused');
  }else if(url.pathname==='/auth/v1/token')assert.ok(single('grant_type',['pkce','refresh_token']),'egress token query refused');
  else if(url.pathname==='/auth/v1/logout')assert.ok(single('scope',['local']),'egress logout query refused');
  else{
    assert.equal(query.length,0,'egress query refused');
    const paths=['/auth/v1/user','/rest/v1/rpc/concierge_client_session_context','/rest/v1/rpc/concierge_account_profile_command_v1','/rest/v1/rpc/concierge_client_orders_read_v1','/rest/v1/rpc/concierge_advisor_session_context','/rest/v1/rpc/concierge_advisor_directory','/rest/v1/rpc/concierge_plan_command_v1','/rest/v1/rpc/concierge_payment_view_v2','/rest/v1/rpc/concierge_payment_write_v2','/rest/v1/rpc/concierge_care_command_v1'];
    assert.ok(paths.includes(url.pathname),'egress route refused');
    if(url.pathname.endsWith('/concierge_plan_command_v1')||url.pathname.endsWith('/concierge_care_command_v1')){
      const value=JSON.parse(Buffer.from(body).toString('utf8'));
      const family=url.pathname.endsWith('/concierge_plan_command_v1')?'/functions/v1/concierge-plans':'/functions/v1/concierge-care';
      fixtureServiceAction(family,value.p_command);
    }
    if(url.pathname.endsWith('/concierge_payment_write_v2'))assert.ok(['issue_quote','submit_claim','confirm_payment'].includes(JSON.parse(Buffer.from(body).toString('utf8')).p_action),'egress payment action refused');
  }
  return request.url;
}

async function canonicalDirectory(directory){
  assert.equal(typeof directory,'string','directory path required');
  assert.ok(path.isAbsolute(directory)&&path.normalize(directory)===directory,'canonical absolute directory path required');
  const parts=directory.split(path.sep).filter(Boolean);let current=path.parse(directory).root;
  for(const part of parts){current=path.join(current,part);assert.ok(!(await lstat(current)).isSymbolicLink(),'symlinked directory path refused');}
  assert.equal(await realpath(directory),directory,'canonical directory required');
  assert.ok((await lstat(directory)).isDirectory(),'directory required');
  return directory;
}
function within(parent,child){return child.startsWith(parent+path.sep)&&path.normalize(child)===child;}
function git(root,args){return execFileSync('git',args,{cwd:root,encoding:'utf8',maxBuffer:8_000_000});}
function blobHash(bytes){return createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');}
function sourceTree(root,commit=SOURCE_PIN.commit){
  return git(root,['ls-tree','-rz',commit]).split('\0').filter(Boolean).map(row=>{
    const match=/^(100644|100755) blob ([a-f0-9]{40})\t(.+)$/.exec(row);
    assert.ok(match,'unsupported source tree kind');return {mode:match[1],blob:match[2],path:match[3]};
  });
}
async function pinnedFile(root,record){
  const file=path.join(root,record.path),parent=path.dirname(file);await canonicalDirectory(parent);
  const stat=await lstat(file);assert.ok(stat.isFile()&&!stat.isSymbolicLink(),'source kind must remain a regular file');
  assert.equal((stat.mode&0o111)!==0,record.mode==='100755','source executable mode changed');
  const bytes=await readFile(file);assert.equal(blobHash(bytes),record.blob,'immutable source bytes changed: '+record.path);
  return {bytes,record:Object.freeze({...record,kind:'file',filesystemMode:stat.mode&0o7777,bytes:bytes.length,sha256:sha(bytes)})};
}
function protectedPath(name){
  return ['apps/portal/src/','apps/portal/site/auth/','apps/portal/session-integration/runtime/server/',
    'apps/portal/session-integration/runtime/workers/','src/contracts/','supabase/functions/','supabase/migrations/'].some(prefix=>name.startsWith(prefix))
    || /^(?:package(?:-lock)?\.json|tsconfig[^/]*\.json)$/.test(name)
    || /^apps\/portal\/(?:session-integration\/runtime\/)?(?:package(?:-lock)?\.json|tsconfig[^/]*\.json)$/.test(name)
    || name==='apps/portal/session-integration/runtime/pages.wrangler.jsonc';
}
function freeze(value){if(value&&typeof value==='object'){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;}
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8',
  '.woff2':'font/woff2','.woff':'font/woff','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.txt':'text/plain; charset=utf-8'};

async function verifySource(context){
  assert.equal(git(context.sourceRoot,['rev-parse','HEAD']).trim(),context.source.commit,'actual Root source commit changed');
  assert.equal(sha(git(context.sourceRoot,['ls-files','--stage','-z',...context.source.files.map(file=>file.path)])),context.source.indexSha256,'protected source index changed');
  for(const record of context.source.files){
    const current=(await pinnedFile(context.sourceRoot,record)).record;
    assert.equal(current.filesystemMode,record.filesystemMode,'protected source mode changed');
  }
}
async function readSource(context,name){
  const record=context.tree.find(item=>item.path===name);assert.ok(record,'untracked/foreign source path refused: '+name);
  return (await pinnedFile(context.sourceRoot,record)).bytes;
}
async function generatedWrite(context,relative,bytes){
  const destination=path.join(context.artifactDirectory,relative);
  assert.ok(within(context.artifactDirectory,destination),'foreign generated path refused');
  await mkdir(path.dirname(destination),{recursive:true,mode:0o700});await canonicalDirectory(path.dirname(destination));
  await writeFile(destination,bytes,{flag:'wx',mode:0o600});
}
async function inventory(directory){
  const files=[];
  async function walk(current){for(const entry of await readdir(current,{withFileTypes:true})){
    assert.ok(!entry.isSymbolicLink(),'generated output symlink refused');const file=path.join(current,entry.name);
    if(entry.isDirectory())await walk(file);else{assert.ok(entry.isFile(),'generated output kind refused');const bytes=await readFile(file);files.push({path:path.relative(directory,file),bytes:bytes.length,sha256:sha(bytes)});}
  }}
  await walk(directory);return files.sort((a,b)=>a.path.localeCompare(b.path));
}
async function verifyOutputs(context,built){
  assert.ok(built,'actual build has not completed');await verifySource(context);
  for(const file of built.outputs){
    const target=path.join(context.artifactDirectory,file.path);await canonicalDirectory(path.dirname(target));
    assert.ok((await lstat(target)).isFile()&&!(await lstat(target)).isSymbolicLink(),'built output kind changed');
    const bytes=await readFile(target);assert.ok(bytes.length===file.bytes&&sha(bytes)===file.sha256,'built output bytes changed');
  }
}
async function compilerBuild(context){
  await verifySource(context);
  // No installation, package-manager subprocess or alternative checkout.
  const require=createRequire(path.join(context.sourceRoot,'apps/portal/package.json'));
  const compiler=await import(pathToFileURL(require.resolve('esbuild')).href);
  assert.equal(compiler.version,'0.28.2','installed compiler must match the current lockfile');
  let buildError;
  try {
  await mkdir(context.artifactDirectory,{mode:0o700});
  await generatedWrite(context,'source/policy.original.ts',await readSource(context,SOURCE_PIN.policyPath));
  await generatedWrite(context,'source/policy.local.ts',context.policyProjection.source);
  await generatedWrite(context,'source/policy-projection.json',JSON.stringify(context.policyProjection,null,2)+'\n');
  const graph=[],seams=[],fixtureSeams=[];
  const plugin={name:'exact-current-root-source-and-two-origins',setup(builder){
    builder.onResolve({filter:/^m04:/},args=>{assert.ok(['m04:gateway-entry','m04:fixed-handlers'].includes(args.path),'unknown M04 virtual module');return {path:args.path,namespace:'m04'};});
    builder.onLoad({filter:/.*/},async args=>{
      if(args.namespace==='m04')return {contents:m04VirtualSource(args.path,context.sourceRoot),loader:'ts',resolveDir:context.sourceRoot};
      const relative=path.relative(context.sourceRoot,args.path);
      if(relative.split(path.sep).includes('node_modules')){
        assert.ok(within(context.sourceRoot,args.path),'foreign dependency checkout refused');return;
      }
      const bytes=await readSource(context,relative);
      if(relative===SOURCE_PIN.policyPath){seams.push(context.policyProjection.localSha256);return {contents:context.policyProjection.source,loader:'ts'};}
      const projected=projectM04ProviderSource(relative,bytes);
      if(projected.delta.length){fixtureSeams.push({path:relative,...projected});return {contents:projected.source,loader:'ts'};}
      const ext=path.extname(args.path),loader={'.ts':'ts','.tsx':'tsx','.js':'js','.mjs':'js','.jsx':'jsx','.json':'json','.css':'css','.woff2':'file','.woff':'file'}[ext];
      assert.ok(loader,'unrecognized source loader refused: '+relative);return {contents:bytes,loader};
    });
  }};
  const portal=path.join(context.sourceRoot,'apps/portal'),runtime=path.join(portal,'session-integration/runtime');
  const result=await compiler.build({absWorkingDir:portal,tsconfig:'tsconfig.frontend.json',entryPoints:['src/main.tsx'],
    outdir:context.buildPlan.application.outdir,bundle:true,format:'esm',splitting:true,target:['es2022'],metafile:true,
    entryNames:'application',chunkNames:'chunks/[name]-[hash]',assetNames:'fonts/[name]-[hash]',
    loader:{'.woff2':'file','.woff':'file'},legalComments:'linked',plugins:[plugin]});
  graph.push({entry:'apps/portal/src/main.tsx',metafile:result.metafile});
  for(const [entry,outfile] of [['m04:gateway-entry',context.buildPlan.gateway.outfile],['workers/session-vault/index.ts',context.buildPlan.vault.outfile]]){
    const output=await compiler.build({absWorkingDir:runtime,tsconfig:'tsconfig.json',entryPoints:[entry],outfile,
      bundle:true,format:'esm',platform:'browser',target:'es2022',external:['cloudflare:workers'],metafile:true,legalComments:'linked',plugins:[plugin]});
    graph.push({entry:'apps/portal/session-integration/runtime/'+entry,metafile:output.metafile});
  }
  assert.equal(seams.length,2,'both actual Worker builds must use the exact projected policy');
  const copy=async(source,destination,expected)=>{
    const bytes=await readSource(context,source);if(expected)assert.equal(sha(bytes),expected,'approved static asset hash mismatch');
    await generatedWrite(context,'application/'+destination,bytes);
  };
  await copy('apps/portal/src/app/index.html','index.html');
  const approved=JSON.parse(await readSource(context,'docs/portal-rebuild/design/ASSETS.json'));
  for(const asset of approved.assets)await copy('docs/portal-rebuild/design/'+asset.path,'assets/approved/'+path.basename(asset.path),asset.sha256);
  await copy('apps/portal/site/assets/shelv-mark.png','assets/shelv-mark.png');
  for(const entry of context.tree.filter(record=>/^apps\/portal\/site\/maya\/assets\/[^/]+\.(?:png|jpg|webp)$/.test(record.path)))
    await copy(entry.path,'maya/assets/'+path.basename(entry.path));
  // Use the real notice writer for the actual emitted frontend dependency graph.
  await readSource(context,'apps/portal/scripts/emitted-notices.mjs');
  const notices=await import(pathToFileURL(path.join(portal,'scripts/emitted-notices.mjs')).href);
  await notices.writeEmittedNotices(result.metafile,{workingDirectory:portal,outputDirectory:context.buildPlan.application.outdir});
  await verifySource(context);
  await generatedWrite(context,'build-graphs.json',JSON.stringify(graph,null,2)+'\n');
  const outputs=await inventory(context.artifactDirectory);
  const manifest=freeze({schemaVersion:1,sourceCommit:context.source.commit,sourceManifestSha256:context.source.sourceManifestSha256,
    policyOriginalSha256:context.policyProjection.originalSha256,policyLocalSha256:context.policyProjection.localSha256,m04ProviderProjections:fixtureSeams,m04SourcePins:M04_SOURCE_PINS,outputs});
  await generatedWrite(context,'build-manifest.json',JSON.stringify(manifest,null,2)+'\n');
  return manifest;
  } catch(error){buildError=error;throw error;}
  finally {
    try{await compiler.stop();}
    catch(error){if(buildError)throw new AggregateError([buildError,error],'build and compiler shutdown failed');throw error;}
  }
}

async function privateRead(context,name){
  const file=context.privateFiles[name];assert.ok(file&&within(context.privateDirectory,file),'foreign private path refused');
  await canonicalDirectory(context.privateDirectory);
  const handle=await open(file,fsConstants.O_RDONLY|fsConstants.O_NOFOLLOW);
  try{const stat=await handle.stat();assert.ok(stat.isFile()&&(stat.mode&0o7777)===0o600,'private fixture files must be regular0600');
    assert.ok(stat.size>0&&stat.size<65536,'private fixture file size refused');return await handle.readFile();
  }finally{await handle.close();}
}
async function credentialsAndTls(context){
  const anon=(await privateRead(context,'anon-key')).toString().trim();
  let payload;try{payload=JSON.parse(Buffer.from(anon.split('.')[1],'base64url').toString());}catch{}
  assert.ok(payload?.role==='anon'&&!payload?.service_role,'actual fixture-issued legacy anon key required');
  const envelope=(await privateRead(context,'envelope-keys.json')).toString();let ring;
  try{ring=JSON.parse(envelope);}catch{throw Error('fixture envelope JSON invalid');}
  assert.ok(typeof ring.active==='string'&&ring.keys&&Object.keys(ring.keys).length>=1&&Object.keys(ring.keys).length<=5&&Object.hasOwn(ring.keys,ring.active),'actual fixture envelope keyring required');
  for(const [id,key] of Object.entries(ring.keys))assert.ok(/^[a-zA-Z0-9_-]{1,32}$/.test(id)&&typeof key==='string'&&/^[a-zA-Z0-9_-]+$/.test(key)&&Buffer.from(key,'base64url').length===32,'fixture envelope key refused');
  const key=await privateRead(context,'portal-leaf.key'),cert=await privateRead(context,'portal-leaf.crt'),ca=await privateRead(context,'fixture-ca.crt');
  const leaf=new X509Certificate(cert),authority=new X509Certificate(ca),now=Date.now();
  assert.ok(authority.ca&&!leaf.ca&&leaf.checkIP('127.0.0.1')==='127.0.0.1'&&leaf.verify(authority.publicKey),'fixture TLS chain/IP refused');
  for(const value of [leaf,authority])assert.ok(Date.parse(value.validFrom)<=now&&Date.parse(value.validTo)>now,'fixture TLS validity refused');
  assert.ok(createPublicKey(createPrivateKey(key)).export({type:'spki',format:'der'}).equals(leaf.publicKey.export({type:'spki',format:'der'})),'fixture TLS key mismatch');
  return {anon,envelope,key,cert,ca,fingerprints:freeze({caSha256:sha(ca),portalCertificateSha256:sha(cert),portalKeySha256:sha(key),envelopeSha256:sha(envelope),anonKeySha256:sha(anon)})};
}

/** Actual Node IncomingMessage -> Fetch response, with headers visible first.
 * Exported for builtin stream regressions; never constructs authorization data.
 */
export function responseFromLocalMessage(message,request,observations,secrets){
  const status=message.statusCode,headers=new Headers();
  assert.ok(Number.isInteger(status)&&status>=200&&status<=599,'actual local HTTP status required');
  for(let i=0;i<message.rawHeaders.length;i+=2)headers.append(message.rawHeaders[i],message.rawHeaders[i+1]);
  const observation={method:request.method,path:request.path,status,bytes:0,receivedAt:new Date().toISOString(),bodyState:'streaming'};
  observations.push(observation);
  const chunks=[];let ended=false;
  const stream=new ReadableStream({
    start(controller){
      message.on('data',chunk=>{
        if(ended)return;
        const bytes=Buffer.from(chunk);observation.bytes+=bytes.length;
        if(observation.bytes>2_000_000){message.destroy(Error('local response too large'));return;}
        if(request.path==='/auth/v1/token'&&status===200)chunks.push(bytes);
        controller.enqueue(bytes);
      });
      message.once('end',()=>{
        if(ended)return;
        ended=true;observation.bodyState='complete';
        if(chunks.length){try{const pair=JSON.parse(Buffer.concat(chunks));for(const name of ['access_token','refresh_token'])if(typeof pair[name]==='string'&&pair[name])secrets.add(pair[name]);}catch{}}
        controller.close();
      });
      message.once('error',error=>{if(ended)return;ended=true;observation.bodyState='failed';controller.error(error);});
      message.once('close',()=>{if(!ended){ended=true;observation.bodyState='failed';controller.error(Error('local response closed before end'));}});
    },
    cancel(){ended=true;observation.bodyState='canceled';message.destroy();},
  });
  if([204,205,304].includes(status)){
    // Consume the real bodyless message to completion; do not leave an owned socket.
    void stream.pipeTo(new WritableStream()).catch(()=>{});
    return new Response(null,{status,headers});
  }
  return new Response(stream,{status,headers});
}

async function forwardLocal(request,context,tls,observations,secrets){
  assert.equal(new URL(request.url).origin,LOCAL_ORIGINS.supabase,'egress origin/port refused before body IO');
  assert.ok(request.url.startsWith(LOCAL_ORIGINS.supabase+'/'),'egress literal destination refused before body IO');
  const body=['GET','HEAD'].includes(request.method)?undefined:Buffer.from(await request.arrayBuffer());
  assert.ok(!body||body.length<=500_000,'local egress request bound');
  const target=localProviderTarget(request,context.descriptor,body??Buffer.alloc(0));
  const {request:send}=await import('node:https');
  return new Promise((resolve,reject)=>{
    const sent=send(target,{method:request.method,headers:Object.fromEntries(request.headers),ca:tls.ca,rejectUnauthorized:true,agent:false},response=>{
      try{resolve(responseFromLocalMessage(response,{method:request.method,path:new URL(target).pathname},observations,secrets));}
      catch(error){response.destroy();reject(error);}
    });
    const timer=setTimeout(()=>sent.destroy(Error('local provider deadline')),15000);
    const abort=()=>sent.destroy(Error('local provider aborted'));
    sent.on('error',reject);sent.on('close',()=>{clearTimeout(timer);request.signal?.removeEventListener('abort',abort);});
    request.signal?.addEventListener('abort',abort,{once:true});if(request.signal?.aborted)abort();
    sent.end(body);
  });
}

async function officialMiniflare(context){
  const require=createRequire(path.join(context.sourceRoot,'apps/portal/session-integration/runtime/package.json'));
  const loaded=await import(pathToFileURL(require.resolve('miniflare')).href);
  assert.equal(typeof loaded.Miniflare,'function','installed official Miniflare required');
  assert.equal(typeof loaded.convertV4MiniflareOptions,'function','locked Miniflare v5 converter required');
  return loaded;
}
async function assetsResponse(request,context,built){
  const url=new URL(request.url);
  assert.equal(url.origin,context.descriptor.endpoints.portal,'foreign asset origin refused');
  if(!['GET','HEAD'].includes(request.method))return new Response(null,{status:405});
  let pathname;try{pathname=decodeURIComponent(url.pathname);}catch{return new Response(null,{status:404});}
  if(pathname.includes('\\')||pathname.split('/').some(part=>part==='..'||part==='.')||pathname.includes('\0'))return new Response(null,{status:404});
  let relative='application'+pathname;
  let record=built.outputs.find(file=>file.path===relative);
  if(!record){
    // Only real client application destinations use the unchanged SPA document.
    const route=fixtureSpaDestination(pathname);
    if(!route)return new Response(null,{status:404});
    relative='application/index.html';record=built.outputs.find(file=>file.path===relative);
  }
  assert.ok(record,'actual application asset absent');
  const file=path.join(context.artifactDirectory,relative);await canonicalDirectory(path.dirname(file));
  assert.ok((await lstat(file)).isFile()&&!(await lstat(file)).isSymbolicLink(),'asset kind changed');
  const bytes=await readFile(file);assert.ok(bytes.length===record.bytes&&sha(bytes)===record.sha256,'actual asset bytes changed');
  return new Response(request.method==='HEAD'?null:bytes,{headers:{'content-type':mime[path.extname(file)]??'application/octet-stream',
    'cache-control':'private, no-store','referrer-policy':'no-referrer','x-content-type-options':'nosniff',
    'content-security-policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'; object-src 'none'"}});
}
async function unlistenedHttpsHost(runtime,context,tls){
  const official=await officialMiniflare(context);
  assert.ok(runtime instanceof official.Miniflare,'host accepts only the actual official Miniflare instance');
  const {createServer}=await import('node:https');const {once}=await import('node:events');
  const portal=new URL(context.descriptor.endpoints.portal);
  const server=createServer({key:tls.key,cert:tls.cert,ca:tls.ca,minVersion:'TLSv1.2'},async(incoming,outgoing)=>{
    let response;
    try{
      assert.ok(['127.0.0.1','::ffff:127.0.0.1'].includes(incoming.socket.remoteAddress),'nonloopback peer refused');
      assert.equal(incoming.headers.host,portal.host,'foreign HTTPS host refused');
      assert.ok(typeof incoming.url==='string'&&incoming.url.startsWith('/')&&!incoming.url.startsWith('//'),'invalid request target');
      const url=portal.origin+incoming.url;assert.equal(new URL(url).origin,portal.origin,'foreign HTTPS request origin refused');
      const headers=new Headers();
      for(let i=0;i<incoming.rawHeaders.length;i+=2)headers.append(incoming.rawHeaders[i],incoming.rawHeaders[i+1]);
      // Real proxy transport metadata. Never trust a browser-supplied CF header.
      headers.set('cf-connecting-ip',incoming.socket.remoteAddress==='::ffff:127.0.0.1'?'127.0.0.1':incoming.socket.remoteAddress);
      const chunks=[];let size=0;
      for await(const chunk of incoming){size+=chunk.length;assert.ok(size<=2_000_000,'HTTPS request too large');chunks.push(chunk);}
      const method=incoming.method??'GET',controller=new AbortController();
      outgoing.once('close',()=>{if(!outgoing.writableEnded)controller.abort();});
      response=await runtime.dispatchFetch(url,{method,headers,body:['GET','HEAD'].includes(method)?undefined:Buffer.concat(chunks),signal:controller.signal});
      outgoing.statusCode=response.status;
      for(const [name,value] of response.headers)if(!['set-cookie','transfer-encoding','connection'].includes(name.toLowerCase()))outgoing.setHeader(name,value);
      const cookies=response.headers.getSetCookie();if(cookies.length)outgoing.setHeader('set-cookie',cookies);
      if(method==='HEAD'||!response.body){outgoing.end();return;}
      const reader=response.body.getReader();
      try{for(;;){const part=await reader.read();if(part.done)break;if(outgoing.destroyed){await reader.cancel();return;}
        if(!outgoing.write(Buffer.from(part.value)))await once(outgoing,'drain',{signal:controller.signal});
      }}finally{reader.releaseLock();}
      outgoing.end();
    }catch{
      try{await response?.body?.cancel();}catch{}
      if(outgoing.headersSent){outgoing.destroy();return;}
      outgoing.writeHead(503,{'content-type':'application/json','cache-control':'private, no-store','x-content-type-options':'nosniff'});outgoing.end('{"code":"unavailable"}');
    }
  });
  server.requestTimeout=20000;server.headersTimeout=10000;
  // Provisioner alone listens, captures handles and closes this exact server.
  return server;
}

/** Read-only planning. A descriptor is never an execution grant or proof. */
export function localBindingLayout({fixtureDirectory,artifactDirectory,rollforward}){
  assert.equal(rollforward,undefined,'M04 fresh Root359 context required; no resource adoption');
  if(rollforward===undefined)return {sourceCommit:SOURCE_PIN.commit,persistenceDirectory:artifactDirectory};
  exact(rollforward,['previousSourceCommit','sourceCommit','persistenceDirectory','grantSha256'],'rollforward');
  assert.equal(rollforward.previousSourceCommit,SOURCE_PIN.commit,'previous source mismatch');
  assert.equal(rollforward.sourceCommit,ROLLFORWARD_SOURCE_COMMIT,'new exact source required');
  assert.match(rollforward.grantSha256,/^[a-f0-9]{64}$/,'external roll grant hash required');
  assert.equal(artifactDirectory,path.join(fixtureDirectory,'account-host-code2/bundle'),'new code2 output required');
  assert.equal(rollforward.persistenceDirectory,path.join(fixtureDirectory,'account-host/bundle'),'original persistence directory required');
  return {sourceCommit:rollforward.sourceCommit,persistenceDirectory:rollforward.persistenceDirectory};
}
export async function prepareLocalBindings(options){
  exact(options,['sourceRoot','fixtureDescriptor','privateDirectory','artifactDirectory',...(Object.hasOwn(options,'rollforward')?['rollforward']:[])],'preparation');
  const {sourceRoot,privateDirectory,artifactDirectory}=options;
  assert.equal(sourceRoot,SOURCE_PIN.root,'foreign source root');await canonicalDirectory(sourceRoot);
  const descriptor=structuredClone(options.fixtureDescriptor);
  const layout=localBindingLayout({fixtureDirectory:descriptor.fixtureDirectory,artifactDirectory,rollforward:options.rollforward});
  assert.equal(descriptor.schemaVersion,1,'fixture descriptor version');
  assert.equal(descriptor.sourceCommit,layout.sourceCommit,'fixture source commit mismatch');
  assert.match(descriptor.ownerId,uuid,'fixture owner UUID required');
  assert.match(descriptor.projectId,/^[a-z][a-z0-9_-]{4,90}$/,'unique local project required');
  const directory=await canonicalDirectory(descriptor.fixtureDirectory);
  assert.equal(privateDirectory,descriptor.privateDirectory,'private directory does not match fixture');
  assert.ok(within(directory,privateDirectory),'private directory must be fixture-owned');
  await canonicalDirectory(privateDirectory);
  assert.equal((await lstat(privateDirectory)).mode&0o7777,0o700,'private directory mode must be 0700');
  assert.ok(within(directory,artifactDirectory)&&!within(privateDirectory,artifactDirectory)&&artifactDirectory!==privateDirectory,'generated artifact directory path must be fixture-owned');
  assert.ok(directory.split(path.sep).includes('.local-artifacts'),'fixture must be in owned ignored artifacts');
  await canonicalDirectory(path.dirname(artifactDirectory));
  try{const stat=await lstat(artifactDirectory);assert.ok(!stat.isSymbolicLink(),'symlinked artifact directory refused');throw Error('generated artifact directory already exists');}catch(error){if(error.code!=='ENOENT')throw error;}
  if(options.rollforward){
    for(const directory of [layout.persistenceDirectory,path.join(layout.persistenceDirectory,'resources'),path.join(layout.persistenceDirectory,'isolated')])await canonicalDirectory(directory);
    const tmp=path.join(layout.persistenceDirectory,'tmp');try{await lstat(tmp);await canonicalDirectory(tmp);}catch(error){if(error.code!=='ENOENT')throw error;}
  }
  const portal=literalOrigin(descriptor.endpoints.portal,['https:']),supabase=literalOrigin(descriptor.endpoints.supabase,['https:']);
  assert.equal(portal,LOCAL_ORIGINS.portal,'approved portal origin/port mismatch');
  assert.equal(supabase,LOCAL_ORIGINS.supabase,'approved Supabase origin/port mismatch');
  const mailpit=literalOrigin(descriptor.endpoints.mailpit,['http:']);
  assert.equal(new Set([portal,supabase,mailpit].map(origin=>new URL(origin).port)).size,3,'distinct fixture endpoint ports required');
  for(const actor of [descriptor.actors.a,descriptor.actors.b]){
    assert.match(actor.id,uuid,'actual actor id required');
    assert.ok(typeof actor.email==='string'&&/^[^\s@]+@[^\s@]+\.invalid$/.test(actor.email),'synthetic local actor email required');
    assert.equal(typeof actor.initialDisplayName,'string','actor initial display name required');
  }
  assert.notEqual(descriptor.actors.a.id,descriptor.actors.b.id,'distinct actors required');
  assert.notEqual(descriptor.actors.a.email,descriptor.actors.b.email,'distinct actor emails required');
  assert.equal(git(sourceRoot,['rev-parse','HEAD']).trim(),layout.sourceCommit,'actual Root commit mismatch');
  const tree=sourceTree(sourceRoot,layout.sourceCommit),selected=tree.filter(record=>protectedPath(record.path));
  const files=[];for(const record of selected)files.push((await pinnedFile(sourceRoot,record)).record);
  const migrations=tree.filter(record=>record.path.startsWith('supabase/migrations/')&&record.path.endsWith('.sql'));
  assert.equal(migrations.length,68,'current Root requires exactly68 migrations');
  const policy=await readFile(path.join(sourceRoot,SOURCE_PIN.policyPath));
  const policyProjection=projectPolicySource({sourceRoot,sourcePath:path.join(sourceRoot,SOURCE_PIN.policyPath),sourceBytes:policy,portalOrigin:portal,supabaseOrigin:supabase});
  const runtime=path.join(sourceRoot,'apps/portal/session-integration/runtime');
  const buildPlan=freeze({
    node:'/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node',cwd:path.join(sourceRoot,'apps/portal'),
    application:{entry:path.join(sourceRoot,'apps/portal/src/main.tsx'),outdir:path.join(artifactDirectory,'application')},
    gateway:{entry:'m04:gateway-entry',actualEntry:path.join(runtime,'server/advisor-candidate-gateway.ts'),outfile:path.join(artifactDirectory,'gateway.mjs')},
    vault:{entry:path.join(runtime,'workers/session-vault/index.ts'),outfile:path.join(artifactDirectory,'vault.mjs')},
    toolchain:{esbuild:'0.28.2',miniflare:'5.20261019.0-beta',wrangler:'4.151.2',installation:'forbidden; use only Parent-approved installed lockfile tooling'},
  });
  const privateFiles=freeze(Object.fromEntries(['anon-key','envelope-keys.json','portal-leaf.key','portal-leaf.crt','fixture-ca.crt'].map(name=>[name,path.join(privateDirectory,name)])));
  const blockers=freeze(supabase.startsWith('http:')?[{code:'ROOT_ACCOUNT_REQUIRES_HTTPS_SUPABASE',
    path:'supabase/functions/concierge-account-profile/runtime.ts',
    explanation:'Actual Root createAccountProfilePorts requires HTTPS. An HTTP literal cannot initialize ClientProvider. No policy/protocol bypass is permitted.'}]:[]);
  const source=freeze({...SOURCE_PIN,commit:layout.sourceCommit,files,migrationCount:migrations.length,sourceManifestSha256:sha(JSON.stringify(files))});
  const indexSha256=sha(git(sourceRoot,['ls-files','--stage','-z',...files.map(file=>file.path)]));
  const pinnedSource=freeze({...source,indexSha256});
  const context={sourceRoot,privateDirectory,artifactDirectory,descriptor:freeze(descriptor),tree,source:pinnedSource,policyProjection,buildPlan,privateFiles};
  const vaultConfig=JSON.parse(await readSource(context,'apps/portal/session-integration/runtime/workers/session-vault/wrangler.jsonc'));
  const gatewayConfig=JSON.parse(await readSource(context,'apps/portal/session-integration/runtime/pages.wrangler.jsonc'));
  const nativePlan=freeze({engine:'official installed Miniflare/workerd',
    configurationAPI:'new Miniflare({...convertV4MiniflareOptions(await plan.runtimeOptions()), telemetry:{enabled:false}})',
    gatewaySource:'apps/portal/session-integration/runtime/server/advisor-candidate-gateway.ts',vaultClass:'AdvisorSessionObject',sqlite:true,
    gatewayVars:{...gatewayConfig.vars,PORTAL_ORIGIN:portal,CLIENT_SHARED_SESSIONS:'true',ADVISOR_SHARED_SESSIONS:'true'},
    vaultVars:{...vaultConfig.vars,PORTAL_ORIGIN:portal,CLIENT_SHARED_SESSIONS:'true',ADVISOR_SHARED_SESSIONS:'true'},
    host:{origin:portal,host:'127.0.0.1',port:Number(new URL(portal).port)},
    persistence:{resources:path.join(layout.persistenceDirectory,'resources'),isolated:path.join(layout.persistenceDirectory,'isolated'),tmp:path.join(layout.persistenceDirectory,'tmp')},
    custody:'provisioner constructs Miniflare, awaits ready, listens on exact HTTPS endpoint, records handles, closes host, disposes Miniflare; no adapter auto-start/cleanup/reset',
  });
  const requireReady=()=>{
    assert.equal(blockers.length,0,'Root Account requires HTTPS Supabase; descriptor/issuer correction and exact Parent packet are required');
    assert.equal(process.execPath,buildPlan.node,'explicit Node22.23.0 required');
  };
  let built,tls;
  const observations=[],secrets=new Set();
  const readPrivate=async()=>{
    const current=await credentialsAndTls(context);
    if(tls)assert.deepEqual(current.fingerprints,tls.fingerprints,'fixture private file fingerprints changed');
    tls=current;secrets.add(tls.anon);secrets.add(tls.envelope);secrets.add(tls.key.toString());
    for(const key of Object.values(JSON.parse(tls.envelope).keys))secrets.add(key);
    return tls;
  };
  // The provisioner, never prepare/import, invokes these lifecycle factories.
  return Object.freeze({schemaVersion:1,source:pinnedSource,policyProjection,buildPlan,nativePlan,privateFiles,blockers,
    async build(){requireReady();assert.ok(!built,'build already completed');built=await compilerBuild(context);return built;},
    async runtimeOptions(){
      requireReady();await verifyOutputs(context,built);const privateValues=await readPrivate();
      const common={modules:true,modulesRoot:artifactDirectory,compatibilityDate:vaultConfig.compatibility_date,compatibilityFlags:vaultConfig.compatibility_flags};
      return {cf:false,host:'127.0.0.1',port:0,logRequests:false,upstream:portal,...{
        resourcePersistencePath:nativePlan.persistence.resources,isolatedResourcePersistencePath:nativePlan.persistence.isolated,resourceTmpPath:nativePlan.persistence.tmp},
        workers:[
          {...common,name:'gateway',routes:['127.0.0.1/*'],scriptPath:buildPlan.gateway.outfile,bindings:nativePlan.gatewayVars,
            durableObjects:{ADVISOR_SESSIONS:{className:'AdvisorSessionObject',scriptName:'vault',useSQLite:true}},
            serviceBindings:{ASSETS:request=>assetsResponse(request,context,built)},outboundService:async()=>{throw Error('gateway network egress refused');}},
          {...common,name:'vault',scriptPath:buildPlan.vault.outfile,
            bindings:{...nativePlan.vaultVars,SUPABASE_PUBLIC_KEY:privateValues.anon,ADVISOR_SESSION_KEYS:privateValues.envelope},
            durableObjects:{ADVISOR_SESSIONS:{className:'AdvisorSessionObject',useSQLite:true}},
            outboundService:request=>forwardLocal(request,context,privateValues,observations,secrets)},
        ]};
    },
    async createHttpsHost(runtime){requireReady();await verifyOutputs(context,built);return unlistenedHttpsHost(runtime,context,await readPrivate());},
    observations:()=>observations.map(item=>({...item})),
    privateFileFingerprints:()=>tls?{...tls.fingerprints}:null,
    // Sensitive return: provisioner passes it directly to its private leak scanner.
    privateScanValues:()=>[...secrets],
  });
}
