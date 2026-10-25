import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdtemp,readFile,writeFile,rm,stat} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {randomBytes,randomUUID} from 'node:crypto';
import {spawnSync} from 'node:child_process';

const portal=fileURLToPath(new URL('../',import.meta.url)),directory=await mkdtemp(join(tmpdir(),'shelv-walkthrough-test-')),runtime=join(directory,'runtime.mjs');
await build({stdin:{contents:`export * from './backend/walkthroughs/local-store.ts';export * from './backend/walkthroughs/local-handler.ts';export * from './session-integration/runtime/server/walkthrough-gateway.ts';export * from './session-integration/runtime/server/walkthrough-contract.ts';export * from './session-integration/runtime/server/walkthrough-policy.ts';export * from './session-integration/runtime/server/walkthrough-upstream.ts';`,resolveDir:portal},outfile:runtime,bundle:true,platform:'node',format:'esm',logLevel:'silent'});
const {LocalWalkthroughStore,createLocalWalkthroughHandler,createWalkthroughGateway,capabilityDigest,projectWalkthrough,parseWalkthroughCommand,WalkthroughProvider,readWalkthroughWithKey}=await import(pathToFileURL(runtime).href);
test.after(()=>rm(directory,{recursive:true,force:true}));
const base=JSON.parse(await readFile(new URL('../backend/source/tests/fixtures/concierge-presentation.json',import.meta.url),'utf8')).presentation;
const actor={ownerId:'30000000-0000-4000-8000-000000000001',canView:true,canShare:true},authorize=async()=>actor;
const privateInput=()=>({schemaVersion:1,case:{id:randomUUID(),title:'Generic private consultation',status:'ready',sourceReference:'PRIVATE_SOURCE_CANARY'},version:{id:randomUUID(),createdAt:'2026-10-01T00:00:00.000Z',presentation:structuredClone(base),stages:[{id:'overview',title:'Start here',section:'plan',day:'2026-10-01',body:'A useful routine.',messages:[]}],provenance:{rawNotes:'PRIVATE_NOTES_CANARY',contact:'PRIVATE_CONTACT_CANARY',founderConfirmation:'Synthetic isolated fixture'}}});
async function setup(){const input=privateInput(),path=join(directory,randomUUID()),store=new LocalWalkthroughStore(path);await store.import(input);return {input,path,store};}
const create=(input,token=randomBytes(32).toString('base64url'))=>({action:'share_create',caseId:input.case.id,versionId:input.version.id,requestId:randomUUID(),token});
const guestRequest=(token,extra={})=>new Request('https://portal.example.com/api/walkthroughs/view',{method:'POST',headers:{Origin:'https://portal.example.com','Content-Type':'application/json'},body:JSON.stringify({audience:'walkthrough',token,...extra})});
test('private import separates provenance, starts without grants and enforces private file modes',async()=>{
    const {store,path,input}=await setup();assert.deepEqual((await store.command({action:'share_list',caseId:input.case.id},authorize)).grants,[]);
    const opened=await store.command({action:'open',caseId:input.case.id},authorize);assert.equal(opened.snapshot.caseId,input.case.id);assert.ok(!JSON.stringify(opened).includes('PRIVATE_'));
    assert.equal((await stat(path)).mode&0o777,0o700);assert.equal((await stat(join(path,'store.json'))).mode&0o777,0o600);
    assert.equal((await store.command({action:'library'},authorize)).entries[0].sourceReference,'PRIVATE_SOURCE_CANARY');
    await assert.rejects(store.command({action:'library'},async()=>({...actor,canView:false})),e=>e.status===403);
});
test('exact create/revoke retries keep only a digest and immutable case/version scope',async()=>{
    const {store,path,input}=await setup(),command=create(input),created=await store.command(command,authorize),retry=await store.command(command,authorize);
    assert.deepEqual(created,retry);const stored=await readFile(join(path,'store.json'),'utf8');assert.ok(!stored.includes(command.token));assert.ok(stored.includes(await capabilityDigest(command.token)));assert.ok(!JSON.stringify(created).includes(command.token));
    assert.equal(Date.parse(created.grant.expiresAt)-Date.parse(created.grant.createdAt),30*86400000);
    await assert.rejects(store.command({...command,token:randomBytes(32).toString('base64url')},authorize),e=>e.status===409);
    const changed=structuredClone(input);changed.version.id=randomUUID();changed.version.presentation.title='A new version';await store.import(changed);
    assert.equal((await store.readCapability(await capabilityDigest(command.token))).versionId,input.version.id);
    const second=await store.readCapability(await capabilityDigest(command.token));second.presentation.title='Viewer edit';assert.notEqual((await store.readCapability(await capabilityDigest(command.token))).presentation.title,'Viewer edit');
    const revoke={action:'share_revoke',caseId:input.case.id,grantId:created.grant.id,requestId:randomUUID()};assert.deepEqual(await store.command(revoke,authorize),await store.command(revoke,authorize));
    await assert.rejects(store.readCapability(await capabilityDigest(command.token)),e=>e.status===404);
    changed.version.presentation.title='Forbidden rewrite';await assert.rejects(store.import(changed),e=>e.code==='immutable_version');
});
test('fresh authorization and canonical projection run before storage, create and every protected read',async()=>{
    const {store,path,input}=await setup(),command=create(input);let calls=0;
    await assert.rejects(store.command(command,async()=>({...actor,canShare:++calls<3})),e=>e.status===403);assert.equal((await store.command({action:'share_list',caseId:input.case.id},authorize)).grants.length,0);
    const malformed=structuredClone(input);malformed.version.id=randomUUID();malformed.version.stages[0].privateNotes='LEAK';await assert.rejects(store.import(malformed));
    await store.command(command,authorize);const state=JSON.parse(await readFile(join(path,'store.json'),'utf8'));state.versions[input.version.id].snapshot.privateNotes='LEAK';await writeFile(join(path,'store.json'),JSON.stringify(state));
    await assert.rejects(store.readCapability(await capabilityDigest(command.token)));
    await assert.rejects(store.command(create(input),authorize));
});
test('guest route ignores existing real-account cookies and rejects any auth fallback or business command',async()=>{
    const {store,input}=await setup(),command=create(input);await store.command(command,authorize);let authorizations=0;
    const handler=createLocalWalkthroughHandler(store,{origin:'https://portal.example.com',authorize:async()=>{authorizations++;throw Error('Must never inspect guest account');}});
    const request=guestRequest(command.token);request.headers.set('cookie','real-account-cookie=secret');const good=await handler.fetch(request);assert.equal(good.status,200);assert.equal(authorizations,0);
    assert.equal(good.headers.get('cache-control'),'no-store, max-age=0');assert.equal(good.headers.get('referrer-policy'),'no-referrer');
    const unauthorized=guestRequest(command.token);unauthorized.headers.set('Authorization','Bearer client-session');assert.equal((await handler.fetch(unauthorized)).status,404);
    assert.equal((await handler.fetch(guestRequest(command.token,{action:'publish_v2',clientId:actor.ownerId}))).status,404);
    const advisor=new Request('https://portal.example.com/api/advisor/walkthroughs',{method:'POST',headers:{Origin:'https://portal.example.com','Content-Type':'application/json'},body:JSON.stringify({action:'library'})});assert.equal((await handler.fetch(advisor)).status,503);assert.equal(authorizations,1);
});
test('unknown, expired and revoked capabilities give the same generic payload and enforce the invalid-attempt limit',async()=>{
    let now=Date.parse('2026-10-01T00:00:00Z');const input=privateInput(),store=new LocalWalkthroughStore(join(directory,randomUUID()),()=>now);await store.import(input);const command=create(input),created=await store.command(command,authorize);
    const gateway=createWalkthroughGateway({origin:'https://portal.example.com',limit:async()=>true,read:d=>store.readCapability(d)});
    now+=31*86400000;const expired=await gateway.fetch(guestRequest(command.token));const unknown=await gateway.fetch(guestRequest(randomBytes(32).toString('base64url')));assert.equal(expired.status,404);assert.equal(await expired.text(),await unknown.text());
    await store.command({action:'share_revoke',caseId:input.case.id,grantId:created.grant.id,requestId:randomUUID()},authorize);assert.equal(await (await gateway.fetch(guestRequest(command.token))).text(),'{"code":"unavailable"}');
    const limited=createLocalWalkthroughHandler(store,{origin:'https://portal.example.com',authorize:async()=>({actor,csrfValid:true})});for(let i=0;i<60;i++){const r=guestRequest('bad');r.headers.set('x-local-viewer',String(i));assert.equal((await limited.fetch(r)).status,404);}assert.equal((await limited.fetch(guestRequest('bad'))).status,429);
});
test('request limits reject oversized streaming payloads and management requires CSRF',async()=>{
    const {store}=await setup(),handler=createLocalWalkthroughHandler(store,{origin:'https://portal.example.com',authorize:async()=>({actor,csrfValid:false})});
    const denied=new Request('https://portal.example.com/api/advisor/walkthroughs',{method:'POST',headers:{Origin:'https://portal.example.com','Content-Type':'application/json'},body:'{"action":"library"}'});assert.equal((await handler.fetch(denied)).status,403);
    const huge=new Request('https://portal.example.com/api/advisor/walkthroughs',{method:'POST',headers:{Origin:'https://portal.example.com','Content-Type':'application/json'},body:' '.repeat(8193)});assert.equal((await handler.fetch(huge)).status,413);
    const cross=guestRequest(randomBytes(32).toString('base64url'));cross.headers.set('Origin','https://other.example.com');assert.equal((await handler.fetch(cross)).status,404);
});
test('provider sends only digest and private guest reader rejects public keys and corrupt responses',async()=>{
    const {input}=await setup(),command=create(input);let upstream;
    const key='sb_publishable_abcdefghijk',provider=new WalkthroughProvider(key,async(url,init)=>{upstream={url,body:JSON.parse(init.body),headers:init.headers};return Response.json({schemaVersion:1,grant:{id:randomUUID(),caseId:input.case.id,versionId:input.version.id,createdBy:actor.ownerId,createdAt:'2026-10-01T00:00:00.000Z',expiresAt:'2026-10-31T00:00:00.000Z',revokedAt:null,status:'active'}});});
    await provider.performWalkthrough({access_token:'provider-token',refresh_token:'refresh',expires_at:0,user:{id:actor.ownerId},providerSessionId:randomUUID()},command);assert.ok(!JSON.stringify(upstream).includes(command.token));assert.equal(upstream.body.p_command.digest,await capabilityDigest(command.token));
    const capped=new WalkthroughProvider(key,async()=>Response.json({code:'PT409',message:'share_limit_reached',details:null,hint:null},{status:409}));
    await assert.rejects(capped.performWalkthrough({access_token:'provider-token',refresh_token:'refresh',expires_at:0,user:{id:actor.ownerId},providerSessionId:randomUUID()},command),e=>e.status===409&&e.code==='share_limit_reached');
    await assert.rejects(readWalkthroughWithKey(key,'0'.repeat(64),async()=>{throw Error('Must reject key first');}),e=>e.status===503);
    const snapshot=projectWalkthrough({schemaVersion:1,caseId:input.case.id,versionId:input.version.id,presentation:input.version.presentation,stages:input.version.stages});
    assert.deepEqual(await readWalkthroughWithKey('sb_secret_'+'a'.repeat(50),'0'.repeat(64),async()=>Response.json(snapshot)),snapshot);
    await assert.rejects(readWalkthroughWithKey('sb_secret_'+'a'.repeat(50),'0'.repeat(64),async()=>Response.json({...snapshot,privateNotes:'LEAK'})));
    assert.throws(()=>parseWalkthroughCommand({action:'share_create',caseId:input.case.id,versionId:input.version.id,requestId:randomUUID(),token:'A'.repeat(42)+'B'}));
});
test('private import command works from file and stdin without printing content or creating links',async()=>{
    const input=privateInput(),file=join(directory,'private-input.json'),store=join(directory,'cli-store');await writeFile(file,JSON.stringify(input),{mode:0o600});
    for(const source of [file,'-']){const result=spawnSync(process.execPath,[resolve(portal,'scripts/import-walkthroughs.mjs'),'--store',store,'--input',source],{input:source==='-'?JSON.stringify(input):undefined,encoding:'utf8'});assert.equal(result.status,0,result.stderr);assert.ok(!result.stdout.includes('Generic private consultation'));assert.ok(!result.stdout.includes('PRIVATE_'));}
    const state=JSON.parse(await readFile(join(store,'store.json'),'utf8'));assert.equal(Object.keys(state.grants).length,0);assert.equal(Object.keys(state.versions).length,1);
});
test('the active-link cap serializes concurrent creates, preserves exact retries and releases revoked slots',async()=>{
    const {store,path,input}=await setup(),firstCommand=create(input),first=await store.command(firstCommand,authorize),file=join(path,'store.json'),state=JSON.parse(await readFile(file,'utf8'));
    const template=state.grants[first.grant.id];for(let i=0;i<98;i++){const id=randomUUID();state.grants[id]={...template,id,digest:randomBytes(32).toString('hex')};}await writeFile(file,JSON.stringify(state));
    const pending=[create(input),create(input)],results=await Promise.allSettled(pending.map(command=>new LocalWalkthroughStore(path).command(command,authorize)));
    assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(results.filter(r=>r.status==='rejected'&&r.reason.code==='share_limit_reached').length,1);
    const full=await store.command({action:'share_list',caseId:input.case.id},authorize);assert.equal(full.grants.filter(g=>g.status==='active').length,100);assert.equal(full.nextCursor,null);
    assert.deepEqual(await store.command(firstCommand,authorize),first);
    const failed=pending[results.findIndex(r=>r.status==='rejected')];await assert.rejects(store.command(failed,authorize),e=>e.status===409&&e.code==='share_limit_reached');
    await store.command({action:'share_revoke',caseId:input.case.id,grantId:first.grant.id,requestId:randomUUID()},authorize);assert.equal((await store.command(failed,authorize)).grant.status,'active');
    assert.equal((await store.command({action:'share_list',caseId:input.case.id},authorize)).grants.filter(g=>g.status==='active').length,100);
});
test('active links remain manageable ahead of newer inactive history and pre-cap active overflow is paginated',async()=>{
    const {store,path,input}=await setup(),command=create(input),first=await store.command(command,authorize),file=join(path,'store.json'),state=JSON.parse(await readFile(file,'utf8')),template=state.grants[first.grant.id];
    const recent=new Date(Date.parse(template.createdAt)+1000).toISOString();
    for(let i=0;i<201;i++){const id=randomUUID();state.grants[id]={...template,id,digest:randomBytes(32).toString('hex'),createdAt:recent,revokedAt:recent};}await writeFile(file,JSON.stringify(state));
    const history=await store.command({action:'share_list',caseId:input.case.id},authorize);assert.equal(history.grants.length,200);assert.equal(history.grants[0].id,first.grant.id);assert.equal(history.nextCursor.phase,'inactive');assert.equal((await store.readCapability(await capabilityDigest(command.token))).caseId,input.case.id);
    for(const grant of Object.values(state.grants))grant.revokedAt=null;await writeFile(file,JSON.stringify(state));
    const page1=await store.command({action:'share_list',caseId:input.case.id},authorize);assert.equal(page1.grants.length,200);assert.equal(page1.nextCursor.phase,'active');
    const page2=await store.command({action:'share_list',caseId:input.case.id,cursor:page1.nextCursor},authorize);assert.equal(page2.grants.length,2);assert.equal(page2.nextCursor,null);
    const all=[...page1.grants,...page2.grants];assert.equal(new Set(all.map(g=>g.id)).size,202);assert.ok(all.some(g=>g.id===first.grant.id));
    await assert.rejects(store.command(create(input),authorize),e=>e.code==='share_limit_reached');
    await store.command({action:'share_revoke',caseId:input.case.id,grantId:first.grant.id,requestId:randomUUID()},authorize);await assert.rejects(store.readCapability(await capabilityDigest(command.token)),e=>e.status===404);
    assert.throws(()=>parseWalkthroughCommand({action:'share_list',caseId:input.case.id,cursor:{phase:'invalid',createdAt:recent,id:first.grant.id}}));
});
